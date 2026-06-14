export interface CompanyIdentity {
    name: string;
    description: string;
    industry: string;
    headquarters: string;
    website: string;
}

export interface AmbitionBoxRatings {
    overall_rating: number;
    work_life_balance: number;
    company_culture: number;
    skill_development: number;
    job_security: number;
    management: number;
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
}

export interface CompanyInterview {
    role: string;
    difficulty_level: string;
    experience_summary: string;
    interview_questions?: Array<{ value: string }>;
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
