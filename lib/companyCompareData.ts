import {
    fetchCompaniesFromApi,
    isCompanyCompareApiEnabled,
    type CompanyCompareApiItem,
} from './companyCompareApi';
import type {
    AmbitionBoxRatings,
    CompanyCompare,
    CompanyMetricCounts,
    ExploreFilters,
    FilterFacet,
    KnownForFilterFacet,
    RatingDimensionKey,
} from '../types/companyCompare';
import { RATING_DIMENSIONS, RATING_FILTER_THRESHOLDS } from '../types/companyCompare';

type RawRecord = Record<string, unknown>;

function stripCitationKeys<T>(obj: unknown): T {
    if (Array.isArray(obj)) {
        return obj.map(item => stripCitationKeys(item)) as T;
    }
    if (obj !== null && typeof obj === 'object') {
        const out: RawRecord = {};
        for (const [key, value] of Object.entries(obj as RawRecord)) {
            if (key.endsWith('_citation')) continue;
            out[key] = stripCitationKeys(value);
        }
        return out as T;
    }
    return obj as T;
}

export function slugifyName(name: string): string {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function cleanHeadquarters(hq: string): string {
    return hq.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').trim();
}

function extractValue(item: unknown): string {
    if (typeof item === 'string') return item;
    if (item && typeof item === 'object' && 'value' in item) {
        return String((item as { value?: string }).value ?? '');
    }
    return item != null ? String(item) : '';
}

function coerceRatings(raw: RawRecord): AmbitionBoxRatings {
    const salaryBenefits = Number(raw.salary_and_benefits) || 0;
    let management = Number(raw.management) || 0;
    if (!management && salaryBenefits) management = salaryBenefits;

    return {
        overall_rating: Number(raw.overall_rating) || 0,
        work_life_balance: Number(raw.work_life_balance) || 0,
        company_culture: Number(raw.company_culture) || 0,
        skill_development: Number(raw.skill_development) || 0,
        job_security: Number(raw.job_security) || 0,
        management,
    };
}

function buildSyntheticSalary(salaryRange: string): CompanyCompare['salaries'] {
    if (!salaryRange) return [];
    return [
        {
            role: 'Average role',
            average_annual_salary: salaryRange,
            salary_range: salaryRange,
            experience_level: '',
        },
    ];
}

function buildInterviewsFromQuestions(
    questions: unknown[],
    companyName: string
): CompanyCompare['interviews'] {
    const qs = questions.map(q => ({ value: extractValue(q) })).filter(q => q.value);
    if (!qs.length) return [];
    return [
        {
            role: 'General',
            difficulty_level: 'Moderate',
            experience_summary: `Common interview questions at ${companyName}`,
            interview_questions: qs,
        },
    ];
}

function buildBenefits(raw: unknown[]): CompanyCompare['benefits'] {
    return raw.map(b => ({ value: extractValue(b) })).filter(b => b.value);
}

export function formatBenefitLabel(benefit: CompanyCompare['benefits'][number] | string): string {
    if (typeof benefit === 'string') return benefit.trim();
    return benefit.value?.trim() ?? '';
}

export function getCompanyInterviewQuestions(company: CompanyCompare): string[] {
    const seen = new Set<string>();
    const questions: string[] = [];
    const add = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed || seen.has(trimmed)) return;
        seen.add(trimmed);
        questions.push(trimmed);
    };

    for (const block of company.interviews) {
        for (const question of block.interview_questions ?? []) {
            add(extractValue(question));
        }
    }
    for (const question of company.interviewQuestions ?? []) {
        add(typeof question === 'string' ? question : extractValue(question));
    }
    return questions;
}

function buildActiveJobs(roles: unknown[], headquarters: string): CompanyCompare['active_jobs'] {
    const loc = cleanHeadquarters(headquarters) || 'India';
    return roles
        .map(r => extractValue(r))
        .filter(Boolean)
        .map(title => ({
            job_title: title,
            location: loc,
            posted_date: '',
            apply_url: '',
        }));
}

export function normalizeCompanyFromApi(item: CompanyCompareApiItem): CompanyCompare {
    const name = item.identity?.name || item.name || 'Unknown';
    const id = item.companyId || item.id || slugifyName(name);
    const ratings = coerceRatings((item.ratings ?? {}) as RawRecord);
    let salaries = item.salaries ?? [];
    if (!salaries.length && item.salaryRange) {
        salaries = buildSyntheticSalary(item.salaryRange);
    }

    const base: CompanyCompare = {
        id,
        identity: {
            ...(item.identity ?? {}),
            name,
            description: item.identity?.description ?? '',
            industry: item.identity?.industry ?? '',
            headquarters: cleanHeadquarters(item.identity?.headquarters ?? ''),
            website: item.identity?.website ?? '',
        },
        ratings,
        reviews: item.reviews ?? [],
        salaries,
        interviews: item.interviews ?? [],
        benefits: buildBenefits(item.benefits ?? []),
        active_jobs: item.active_jobs ?? [],
        metadata: item.metadata ?? { source_urls: [], scrape_timestamp: '' },
        overviewUrl: item.overviewUrl,
        logoUrl: item.logoUrl,
        foundedYear: item.foundedYear,
        employeeCount: item.employeeCount,
        salaryRange: item.salaryRange,
        interviewQuestions: item.interviewQuestions,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
    };

    const extra = item as RawRecord;
    const passthroughKeys = ['locations', 'technologies', 'company_highlights', 'socialLinks'] as const;
    const passthrough: Partial<Record<(typeof passthroughKeys)[number], unknown>> = {};
    for (const key of passthroughKeys) {
        if (extra[key] != null) {
            passthrough[key] = extra[key];
        }
    }
    return { ...base, ...passthrough };
}

export function normalizeCompany(raw: unknown): CompanyCompare {
    const cleaned = stripCitationKeys<RawRecord>(raw);

    const identity = cleaned.identity as RawRecord | undefined;
    if (identity?.name) {
        return normalizeCompanyFromApi({
            ...(cleaned as unknown as CompanyCompareApiItem),
            companyId: (cleaned.companyId || cleaned.id) as string | undefined,
        });
    }

    const profile = (cleaned.ambitionbox_profile ?? cleaned.company_identity) as RawRecord | undefined;
    if (profile?.name) {
        const name = String(profile.name);
        const hq = cleanHeadquarters(String(profile.headquarters ?? ''));
        const ratingsRaw = (cleaned.employee_ratings ?? cleaned.ambitionbox_ratings ?? {}) as RawRecord;
        const salaryData = (cleaned.salary_data ?? {}) as RawRecord;
        const salaryRange = String(salaryData.salary_range ?? '');
        const questions =
            ((cleaned.interview_insights as RawRecord)?.common_interview_questions as unknown[]) ?? [];
        const hiringRoles =
            ((cleaned.jobs_and_hiring as RawRecord)?.top_hiring_roles as unknown[]) ?? [];

        let salaries = (cleaned.salaries ?? []) as CompanyCompare['salaries'];
        if (!salaries.length && salaryRange) salaries = buildSyntheticSalary(salaryRange);

        let interviews = (cleaned.interviews ?? []) as CompanyCompare['interviews'];
        if (!interviews.length && questions.length) {
            interviews = buildInterviewsFromQuestions(questions, name);
        }

        let activeJobs = (cleaned.active_jobs ?? []) as CompanyCompare['active_jobs'];
        if (!activeJobs.length && hiringRoles.length) {
            activeJobs = buildActiveJobs(hiringRoles, hq);
        }

        const benefits =
            (cleaned.benefits as CompanyCompare['benefits']) ??
            buildBenefits((cleaned.major_benefits as unknown[]) ?? []);

        const overviewUrl =
            String((raw as RawRecord)?.ambitionbox_profile &&
                ((raw as RawRecord).ambitionbox_profile as RawRecord)?.name_citation) ||
            String(profile.name_citation ?? '');

        return {
            id: slugifyName(name),
            identity: {
                name,
                description: String(profile.description ?? ''),
                industry: String(profile.industry ?? ''),
                headquarters: hq,
                website: String(profile.website ?? ''),
            },
            ratings: coerceRatings(ratingsRaw),
            reviews: (cleaned.reviews ?? []) as CompanyCompare['reviews'],
            salaries,
            interviews,
            benefits,
            active_jobs: activeJobs,
            metadata: (cleaned.metadata as CompanyCompare['metadata']) ?? {
                source_urls: overviewUrl ? [{ value: overviewUrl }] : [],
                scrape_timestamp: new Date().toISOString(),
            },
            overviewUrl: overviewUrl || undefined,
            logoUrl: profile.logo_url ? String(profile.logo_url) : undefined,
            foundedYear: profile.founded_year ? Number(profile.founded_year) : undefined,
            employeeCount: profile.employee_count ? String(profile.employee_count) : undefined,
            salaryRange: salaryRange || undefined,
            interviewQuestions: questions.map(q => extractValue(q)).filter(Boolean),
        };
    }

    const companyIdentity = cleaned.company_identity as CompanyCompare['identity'];
    const metadata = cleaned.metadata as CompanyCompare['metadata'];
    const overviewUrl = metadata?.source_urls?.[0]?.value;

    return {
        id: slugifyName(companyIdentity.name),
        identity: {
            ...companyIdentity,
            headquarters: cleanHeadquarters(companyIdentity.headquarters),
        },
        ratings: coerceRatings(cleaned.ambitionbox_ratings as RawRecord),
        reviews: (cleaned.reviews ?? []) as CompanyCompare['reviews'],
        salaries: (cleaned.salaries ?? []) as CompanyCompare['salaries'],
        interviews: (cleaned.interviews ?? []) as CompanyCompare['interviews'],
        benefits: (cleaned.benefits ?? []) as CompanyCompare['benefits'],
        active_jobs: (cleaned.active_jobs ?? []) as CompanyCompare['active_jobs'],
        metadata,
        overviewUrl,
    };
}

let cachedCompanies: CompanyCompare[] | null = null;
let loadPromise: Promise<CompanyCompare[]> | null = null;

function companyDataScore(company: CompanyCompare): number {
    return (
        company.reviews.length +
        company.salaries.length +
        company.interviews.length +
        company.benefits.length +
        company.active_jobs.length
    );
}

function dedupeCompanies(companies: CompanyCompare[]): CompanyCompare[] {
    const byKey = new Map<string, CompanyCompare>();
    for (const company of companies) {
        const key = slugifyName(company.identity.name || company.id);
        const existing = byKey.get(key);
        if (!existing || companyDataScore(company) > companyDataScore(existing)) {
            byKey.set(key, company);
        }
    }
    return Array.from(byKey.values()).sort((a, b) =>
        a.identity.name.localeCompare(b.identity.name),
    );
}

export async function loadCompaniesFromApi(): Promise<CompanyCompare[]> {
    if (cachedCompanies) return cachedCompanies;
    if (loadPromise) return loadPromise;

    if (!isCompanyCompareApiEnabled()) {
        return [];
    }

    loadPromise = (async () => {
        const res = await fetchCompaniesFromApi({ limit: 500 });
        cachedCompanies = dedupeCompanies((res.companies ?? []).map(normalizeCompanyFromApi));
        return cachedCompanies;
    })();

    try {
        return await loadPromise;
    } finally {
        loadPromise = null;
    }
}

export async function fetchAdminCompanyNames(): Promise<string[]> {
    if (!isCompanyCompareApiEnabled()) return [];
    const res = await fetchCompaniesFromApi({ limit: 500 });
    return Array.from(
        new Set(
            (res.companies ?? [])
                .map(c => (c.identity?.name || c.name || '').trim())
                .filter(Boolean),
        ),
    ).sort((a, b) => a.localeCompare(b));
}

export function loadCompanies(): CompanyCompare[] {
    return cachedCompanies ?? [];
}

export function invalidateCompanyCompareCache(): void {
    cachedCompanies = null;
    loadPromise = null;
}

export function getCompanyBySlug(slug: string): CompanyCompare | undefined {
    const normalized = slugifyName(slug);
    return loadCompanies().find(c => c.id === normalized);
}

export function getIndustries(companies?: CompanyCompare[]): string[] {
    const list = companies ?? loadCompanies();
    const set = new Set<string>();
    for (const company of list) {
        if (company.identity.industry) set.add(company.identity.industry);
    }
    return Array.from(set).sort();
}

const KNOWN_FOR_ALIASES: Record<string, RatingDimensionKey> = {
    'job security': 'job_security',
    'work satisfaction': 'company_culture',
    'skill development': 'skill_development',
    'work-life balance': 'work_life_balance',
    management: 'management',
};

export function knownForLabelToDimension(label: string): RatingDimensionKey | null {
    const key = label.trim().toLowerCase();
    return KNOWN_FOR_ALIASES[key] ?? null;
}

export function getPrimaryLocation(company: CompanyCompare): string {
    const hq = company.identity.headquarters;
    const city = hq.split(',')[0]?.trim();
    return city || hq;
}

export function getCompanyMetricCounts(company: CompanyCompare): CompanyMetricCounts {
    const interviewQuestions = getCompanyInterviewQuestions(company);
    return {
        reviews: company.reviews.length,
        salaries: company.salaries.length || (company.salaryRange ? 1 : 0),
        interviews: interviewQuestions.length || company.interviews.length,
        jobs: company.active_jobs.length,
        benefits: company.benefits.length,
    };
}

export function getTopRatedDimensions(
    company: CompanyCompare,
    n = 2
): Array<{ key: RatingDimensionKey; label: string; value: number }> {
    return RATING_DIMENSIONS.map(dim => ({
        key: dim.key,
        label: dim.label,
        value: company.ratings[dim.key],
    }))
        .sort((a, b) => b.value - a.value)
        .slice(0, n);
}

export function getLowRatedDimensions(
    company: CompanyCompare,
    n = 2
): Array<{ key: RatingDimensionKey; label: string; value: number }> {
    return RATING_DIMENSIONS.map(dim => ({
        key: dim.key,
        label: dim.label,
        value: company.ratings[dim.key],
    }))
        .sort((a, b) => a.value - b.value)
        .slice(0, n);
}

export function getTopSalaryRole(company: CompanyCompare): CompanyCompare['salaries'][number] | null {
    if (company.salaries[0]) return company.salaries[0];
    if (company.salaryRange) {
        return {
            role: 'Average role',
            average_annual_salary: company.salaryRange,
            salary_range: company.salaryRange,
            experience_level: '',
        };
    }
    return null;
}

/** Parse salary strings like "₹5.7L", "7.3 L/yr", "₹18.4 L/yr" into lakhs. */
export function parseSalaryToLakhs(value: string): number | null {
    if (!value?.trim()) return null;
    const normalized = value.replace(/,/g, '').trim();
    const lakhMatch = normalized.match(/([\d.]+)\s*l(?:\s*\/\s*yr)?/i);
    if (lakhMatch) return Number.parseFloat(lakhMatch[1]);
    const croreMatch = normalized.match(/([\d.]+)\s*cr/i);
    if (croreMatch) return Number.parseFloat(croreMatch[1]) * 100;
    return null;
}

export function formatSalaryLakhs(value: number): string {
    const rounded = Math.round(value * 10) / 10;
    const text = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
    return `₹${text} L/yr`;
}

export function getCompanyAverageSalaryLakhs(company: CompanyCompare): number | null {
    const topSalary = getTopSalaryRole(company);
    if (!topSalary) return null;

    const fromAverage = parseSalaryToLakhs(topSalary.average_annual_salary);
    if (fromAverage != null) return fromAverage;

    const rangeParts = topSalary.salary_range.split(/\s*[-–]\s*/);
    if (rangeParts.length === 2) {
        const min = parseSalaryToLakhs(rangeParts[0]);
        const max = parseSalaryToLakhs(rangeParts[1]);
        if (min != null && max != null) return (min + max) / 2;
    }

    return parseSalaryToLakhs(topSalary.salary_range);
}

export function getIndustryAverageSalaryLakhs(
    companies: CompanyCompare[],
    industry: string,
): number | null {
    const trimmed = industry.trim();
    if (!trimmed) return null;

    const values = companies
        .filter(c => c.identity.industry?.trim() === trimmed)
        .map(getCompanyAverageSalaryLakhs)
        .filter((value): value is number => value != null);

    if (!values.length) return null;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export type SalaryIndustryComparison = 'higher' | 'lower' | 'at par';

export function getSalaryIndustryComparison(
    companyLakhs: number,
    industryLakhs: number,
): SalaryIndustryComparison {
    if (industryLakhs <= 0) return 'at par';
    const diffRatio = (companyLakhs - industryLakhs) / industryLakhs;
    if (Math.abs(diffRatio) < 0.05) return 'at par';
    return diffRatio > 0 ? 'higher' : 'lower';
}

export function getSalaryComparisonLabel(comparison: SalaryIndustryComparison): string {
    if (comparison === 'higher') return 'above par';
    if (comparison === 'lower') return 'below par';
    return 'at par';
}

function companyMatchesLocation(company: CompanyCompare, location: string): boolean {
    const needle = location.trim().toLowerCase();
    if (!needle) return true;
    const haystack = [
        company.identity.headquarters,
        ...company.active_jobs.map(j => j.location),
    ]
        .join(' ')
        .toLowerCase();
    return haystack.includes(needle);
}

function companyMatchesRole(company: CompanyCompare, role: string): boolean {
    const needle = role.trim().toLowerCase();
    if (!needle) return true;
    const haystack = [
        ...company.salaries.map(s => s.role),
        ...company.active_jobs.map(j => j.job_title),
    ]
        .join(' ')
        .toLowerCase();
    return haystack.includes(needle);
}

function companyMatchesKnownFor(company: CompanyCompare, dimension: RatingDimensionKey): boolean {
    const ranked = getTopRatedDimensions(company, 2);
    return ranked.some(r => r.key === dimension && r.value >= 3.0);
}

export function filterCompanies(filters: ExploreFilters, companies?: CompanyCompare[]): CompanyCompare[] {
    const source = companies ?? loadCompanies();
    const query = filters.search.trim().toLowerCase();
    const industry = filters.industry?.trim() || null;
    const minRating = filters.minRating;
    const location = filters.location?.trim() || null;
    const role = filters.role?.trim() || null;
    const knownFor = filters.knownFor;

    return source.filter(company => {
        if (industry && company.identity.industry !== industry) return false;
        if (minRating != null && company.ratings.overall_rating < minRating) return false;
        if (location && !companyMatchesLocation(company, location)) return false;
        if (role && !companyMatchesRole(company, role)) return false;
        if (knownFor && !companyMatchesKnownFor(company, knownFor)) return false;

        if (!query) return true;

        const haystack = [
            company.identity.name,
            company.identity.industry,
            company.identity.headquarters,
            company.identity.description,
            ...company.salaries.map(s => s.role),
            ...company.active_jobs.map(j => j.job_title),
        ]
            .join(' ')
            .toLowerCase();

        return haystack.includes(query);
    });
}

export function formatFilterCount(count: number): string {
    if (count >= 100_000) {
        const lakhs = count / 100_000;
        return `${lakhs >= 10 ? Math.round(lakhs) : lakhs.toFixed(1).replace(/\.0$/, '')}L`;
    }
    if (count >= 1_000) {
        const thousands = count / 1_000;
        return `${thousands >= 10 ? Math.round(thousands) : thousands.toFixed(1).replace(/\.0$/, '')}k`;
    }
    return String(count);
}

export function countActiveExploreFilters(filters: ExploreFilters): number {
    let count = 0;
    if (filters.search.trim()) count += 1;
    if (filters.industry) count += 1;
    if (filters.minRating != null) count += 1;
    if (filters.location) count += 1;
    if (filters.role) count += 1;
    if (filters.knownFor) count += 1;
    return count;
}

export function buildRatingFilterFacets(
    companies: CompanyCompare[],
): Array<{ threshold: number; count: number }> {
    return RATING_FILTER_THRESHOLDS.map(threshold => ({
        threshold,
        count: companies.filter(c => c.ratings.overall_rating >= threshold).length,
    }));
}

export function buildIndustryFilterFacets(companies: CompanyCompare[]): FilterFacet[] {
    const counts = new Map<string, number>();
    for (const company of companies) {
        const industry = company.identity.industry?.trim();
        if (!industry) continue;
        counts.set(industry, (counts.get(industry) ?? 0) + 1);
    }
    return Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
}

export function buildLocationFilterFacets(companies: CompanyCompare[]): FilterFacet[] {
    const counts = new Map<string, number>();
    for (const company of companies) {
        const location = getPrimaryLocation(company);
        if (!location) continue;
        counts.set(location, (counts.get(location) ?? 0) + 1);
    }
    return Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
}

export function buildRoleFilterFacets(companies: CompanyCompare[]): FilterFacet[] {
    const counts = new Map<string, number>();
    for (const company of companies) {
        const roles = new Set<string>();
        for (const salary of company.salaries) {
            const role = salary.role?.trim();
            if (role) roles.add(role);
        }
        for (const job of company.active_jobs) {
            const title = job.job_title?.trim();
            if (title) roles.add(title);
        }
        for (const role of roles) {
            counts.set(role, (counts.get(role) ?? 0) + 1);
        }
    }
    return Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count);
}

export function buildKnownForFilterFacets(companies: CompanyCompare[]): KnownForFilterFacet[] {
    return RATING_DIMENSIONS.map(dim => ({
        key: dim.key,
        label: dim.label,
        count: companies.filter(c => companyMatchesKnownFor(c, dim.key)).length,
    })).sort((a, b) => b.count - a.count);
}

const PREFERRED_METRO_CITIES = ['Mumbai', 'Pune', 'Bengaluru', 'Bangalore', 'New Delhi', 'Hyderabad', 'Chennai', 'Kolkata'];

export function getTopMetroCityFacets(companies: CompanyCompare[], limit = 4): FilterFacet[] {
    const all = buildLocationFilterFacets(companies);
    const picked: FilterFacet[] = [];
    const used = new Set<string>();

    const findCity = (target: string) =>
        all.find(f => f.value.toLowerCase() === target.toLowerCase());

    for (const city of PREFERRED_METRO_CITIES) {
        if (picked.length >= limit) break;
        const match = findCity(city);
        if (!match || used.has(match.value.toLowerCase())) continue;
        used.add(match.value.toLowerCase());
        picked.push(match);
    }

    return picked;
}

const AVATAR_COLORS = ['#5670FB', '#1E223C', '#10B981', '#F59E0B', '#EC4899', '#6366F1'];

export function companyInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function companyAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function formatWebsiteUrl(website: string): string {
    const trimmed = website.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
}
