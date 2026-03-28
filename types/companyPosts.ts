export type PostCategory = 'interview-experience' | 'company-feedback' | 'salary-compensation' | 'career-discussion';

export type CompanyPostOfferType = 'Internship' | 'Full-time' | 'Intern + PPO';

export interface CompanyPostComment {
    id: string;
    author: string;
    text: string;
    createdAt: string;
}

export interface CompanyPost {
    id: string;
    authorId: string | null;
    authorName: string;
    companyName: string;
    isAdminCompany: boolean;
    role: string;
    category: PostCategory;
    createdAt: string;
    /** Server-maintained; present when loaded from API */
    updatedAt?: string;
    title: string;
    content: string;
    location?: string;
    experienceLevel?: string;
    interviewRound?: string;
    packageDetails?: {
        ctc: string;
        basePay?: string;
        bonus?: string;
        stock?: string;
        graduationYear?: string;
        offerType?: CompanyPostOfferType;
    };
    companyRating?: number;
    careerTopic?: string;
    tags?: string[];
    upvotes: number;
    /** Present when loaded from API or offline session; whether the current viewer already upvoted */
    hasUpvoted?: boolean;
    comments: CompanyPostComment[];
}
