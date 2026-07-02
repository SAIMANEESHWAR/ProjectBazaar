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
    RatingDimensionKey,
} from '../types/companyCompare';
import { RATING_DIMENSIONS } from '../types/companyCompare';
import companyCompareSeed from '../data/companyCompareSeed.json';

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

    return {
        id,
        identity: {
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
        benefits: item.benefits ?? [],
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
}

export function normalizeCompany(raw: unknown): CompanyCompare {
    const cleaned = stripCitationKeys<RawRecord>(raw);

    if (cleaned.companyId && cleaned.identity) {
        return normalizeCompanyFromApi(cleaned as unknown as CompanyCompareApiItem);
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

    const identity = cleaned.company_identity as CompanyCompare['identity'];
    const metadata = cleaned.metadata as CompanyCompare['metadata'];
    const overviewUrl = metadata?.source_urls?.[0]?.value;

    return {
        id: slugifyName(identity.name),
        identity: {
            ...identity,
            headquarters: cleanHeadquarters(identity.headquarters),
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

function loadSeedCompanies(): CompanyCompare[] {
    const raw = (companyCompareSeed as { companies?: unknown[] }).companies ?? [];
    return dedupeCompanies(raw.map(normalizeCompany));
}

export async function loadCompaniesFromApi(): Promise<CompanyCompare[]> {
    if (cachedCompanies) return cachedCompanies;
    if (loadPromise) return loadPromise;

    if (!isCompanyCompareApiEnabled()) {
        return loadSeedCompanies();
    }

    loadPromise = (async () => {
        try {
            const res = await fetchCompaniesFromApi({ limit: 500 });
            cachedCompanies = dedupeCompanies((res.companies ?? []).map(normalizeCompanyFromApi));
            return cachedCompanies;
        } catch (err) {
            console.warn('Company compare API unavailable, using seed data:', err);
            cachedCompanies = loadSeedCompanies();
            return cachedCompanies;
        }
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
    return {
        reviews: company.reviews.length,
        salaries: company.salaries.length || (company.salaryRange ? 1 : 0),
        interviews: company.interviews.length,
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
