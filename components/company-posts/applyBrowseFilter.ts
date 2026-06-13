import type { CompanyPost } from '../../types/companyPosts';
import type { CompanyPostsBrowseFilter } from './explorerTypes';

const LOCATION_ALIASES: Record<string, string[]> = {
    bengaluru: ['bengaluru', 'bangalore', 'blr'],
    mumbai: ['mumbai', 'bombay'],
    'new delhi': ['new delhi', 'delhi', 'ncr'],
    hyderabad: ['hyderabad', 'hyd'],
    chennai: ['chennai', 'madras'],
    pune: ['pune'],
};

function locationMatches(postLocation: string | undefined, target: string): boolean {
    if (!postLocation) return false;
    const normalized = postLocation.toLowerCase();
    const key = target.toLowerCase();
    const aliases = LOCATION_ALIASES[key] ?? [key];
    return aliases.some(alias => normalized.includes(alias));
}

const INDUSTRY_KEYWORDS: Record<string, string[]> = {
    'IT Services & Consulting': ['tcs', 'infosys', 'wipro', 'consulting', 'it services', 'software'],
    'Engineering & Construction': ['engineering', 'construction', 'infrastructure', 'l&t', 'larsen'],
    'Auto Components': ['auto', 'automotive', 'component', 'vehicle', 'mahindra', 'tata motors'],
};

const KNOWN_FOR_KEYWORDS: Record<string, string[]> = {
    'Job Security': ['job security', 'stable', 'stability', 'tenure'],
    'Work Satisfaction': ['work satisfaction', 'work-life', 'culture', 'wlb', 'satisfaction'],
    'Skill Development': ['skill development', 'learning', 'growth', 'upskill', 'training'],
};

function textIncludesAny(text: string, keywords: string[]): boolean {
    const lower = text.toLowerCase();
    return keywords.some(k => lower.includes(k));
}

function matchesAnyIndustry(post: CompanyPost): boolean {
    const haystack = [post.companyName, post.role, post.title, post.content, ...(post.tags ?? [])].join(' ');
    return Object.values(INDUSTRY_KEYWORDS).some(keywords => textIncludesAny(haystack, keywords));
}

export function postMatchesBrowseFilter(post: CompanyPost, filter: CompanyPostsBrowseFilter): boolean {
    if (!filter.value) {
        switch (filter.kind) {
            case 'location':
                return Boolean(post.location?.trim());
            case 'role':
                return Boolean(post.role.trim()) && post.role.toLowerCase() !== 'general';
            case 'industry':
                return matchesAnyIndustry(post);
            case 'known-for':
                return post.category === 'company-feedback' || post.category === 'career-discussion';
            default:
                return true;
        }
    }

    switch (filter.kind) {
        case 'location':
            return locationMatches(post.location, filter.value);
        case 'role':
            return post.role.toLowerCase().includes(filter.value.toLowerCase());
        case 'industry': {
            const keywords = INDUSTRY_KEYWORDS[filter.value] ?? [filter.value.toLowerCase()];
            const haystack = [
                post.companyName,
                post.role,
                post.title,
                post.content,
                ...(post.tags ?? []),
            ].join(' ');
            return textIncludesAny(haystack, keywords);
        }
        case 'known-for': {
            const keywords = KNOWN_FOR_KEYWORDS[filter.value] ?? [filter.value.toLowerCase()];
            const haystack = [post.title, post.content, ...(post.tags ?? [])].join(' ');
            if (textIncludesAny(haystack, keywords)) return true;
            if (filter.value === 'Work Satisfaction' && post.category === 'company-feedback') return true;
            if (filter.value === 'Skill Development' && post.category === 'career-discussion') return true;
            return false;
        }
        default:
            return true;
    }
}
