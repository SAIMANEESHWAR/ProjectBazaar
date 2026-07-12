export {
    adminDeleteCompany,
    adminUpsertCompany,
    adminSyncCompanies,
    fetchCompaniesFromApi,
    fetchCompanyByIdFromApi,
    getCompanyCompareAdminKey,
    getCompanyCompareApiBase,
    isCompanyCompareApiEnabled,
} from '../lib/companyCompareApi';
export type { AdminSyncResponse, CompanyCompareApiItem } from '../lib/companyCompareApi';
