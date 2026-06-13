export type BrowseFilterKind = 'location' | 'role' | 'industry' | 'known-for';

export interface CompanyPostsBrowseFilter {
    kind: BrowseFilterKind;
    value: string;
    title: string;
    subtitle?: string;
}

export interface ExplorerSelectPayload {
    kind: BrowseFilterKind;
    value: string;
    title: string;
    subtitle?: string;
}
