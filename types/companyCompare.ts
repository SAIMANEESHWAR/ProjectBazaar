export interface CompanyIdentity {
    name: string;
    description: string;
    industry: string;
    headquarters: string;
    website: string;
    company_type?: string;
    founded?: number;
    founders?: string[];
    ceo?: string;
    parent_company?: string;
    stock_symbol?: string;
    specialties?: string[];
}

export interface AmbitionBoxRatings {
    overall_rating: number;
    work_life_balance: number;
    company_culture: number;
    skill_development: number;
    job_security: number;
    management: number;
    salary_and_benefits?: number;
    salary_benefits?: number;
    career_growth?: number;
    promotions?: number;
    work_satisfaction?: number;
    [key: string]: number | undefined;
}

export interface CompanyReview {
    review_date: string;
    pros: string;
    cons: string;
    summary: string;
}

export interface CompanySalary {
    role: string;
    average_annual_salary: string;
    salary_range: string;
    experience_level: string;
    currency?: string;
    salary_period?: string;
}

export interface CompanyInterview {
    role: string;
    difficulty_level: string;
    experience_summary: string;
    interview_questions?: Array<{ value: string }>;
    selection_process?: string[];
}

export interface CompanyBenefit {
    value: string;
}

export interface CompanyActiveJob {
    job_title: string;
    location: string;
    posted_date: string;
    apply_url: string;
}

export interface CompanyMetadata {
    source_urls: Array<{ value: string }>;
    scrape_timestamp: string;
    source?: string;
    last_verified?: string;
}

export interface CompanySocialLinks {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    youtube?: string;
    instagram?: string;
    website?: string;
}

export interface CompanyCompare {
    id: string;
    identity: CompanyIdentity;
    ratings: AmbitionBoxRatings;
    reviews: CompanyReview[];
    salaries: CompanySalary[];
    interviews: CompanyInterview[];
    benefits: CompanyBenefit[];
    active_jobs: CompanyActiveJob[];
    metadata: CompanyMetadata;
    overviewUrl?: string;
    logoUrl?: string;
    foundedYear?: number;
    employeeCount?: string;
    salaryRange?: string;
    interviewQuestions?: string[];
    locations?: string[];
    technologies?: string[];
    company_highlights?: string[];
    socialLinks?: CompanySocialLinks;
    createdAt?: string;
    updatedAt?: string;
}

export type RatingDimensionKey =
    | 'work_life_balance'
    | 'company_culture'
    | 'skill_development'
    | 'job_security'
    | 'management';

export const RATING_DIMENSIONS: Array<{ key: RatingDimensionKey; label: string; shortLabel: string }> = [
    { key: 'work_life_balance', label: 'Work-life balance', shortLabel: 'WLB' },
    { key: 'company_culture', label: 'Company culture', shortLabel: 'Culture' },
    { key: 'skill_development', label: 'Skill development', shortLabel: 'Skills' },
    { key: 'job_security', label: 'Job security', shortLabel: 'Security' },
    { key: 'management', label: 'Management', shortLabel: 'Mgmt' },
];

export interface ExploreFilters {
    search: string;
    industry: string | null;
    minRating: number | null;
    location: string | null;
    role: string | null;
    knownFor: RatingDimensionKey | null;
}

export interface CompanyMetricCounts {
    reviews: number;
    salaries: number;
    interviews: number;
    jobs: number;
    benefits: number;
}

export const DEFAULT_EXPLORE_FILTERS: ExploreFilters = {
    search: '',
    industry: null,
    minRating: null,
    location: null,
    role: null,
    knownFor: null,
};

export const RATING_FILTER_THRESHOLDS = [4.5, 4.0, 3.75, 3.5] as const;

export interface FilterFacet {
    value: string;
    count: number;
}

export interface KnownForFilterFacet {
    key: RatingDimensionKey;
    label: string;
    count: number;
}
