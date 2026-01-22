import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useNavigation, usePremium } from '../App';
import GitHubContributionHeatmap from './GitHubContributionHeatmap';

const UPDATE_SETTINGS_ENDPOINT = 'https://ydcdsqspm3.execute-api.ap-south-2.amazonaws.com/default/Update_userdetails_in_settings';
const GET_USER_ENDPOINT = 'https://6omszxa58g.execute-api.ap-south-2.amazonaws.com/default/Get_user_Details_by_his_Id';
const GITHUB_OAUTH_CALLBACK = 'https://ksngma8ixd.execute-api.ap-south-2.amazonaws.com/default/Github_OAuth_Callback';
const GITHUB_CLIENT_ID = 'Ov23liWkZ6bJwdgaeJta';
const GOOGLE_DRIVE_OAUTH_CALLBACK = 'https://yr3g0hy49k.execute-api.ap-south-2.amazonaws.com/default/Google_Drive_Callback';
const GOOGLE_CLIENT_ID = '1045739523565-va7quhkm5ngjflbcp4r7q2mijc69bkm6.apps.googleusercontent.com';
const FREELANCER_OAUTH_CALLBACK_API = 'https://0pwxlef4jj.execute-api.ap-south-2.amazonaws.com/default/freelancer-oauth-callback';
// Freelancer OAuth Client ID - must match the CLIENT_ID in your Lambda environment variable FREELANCER_CLIENT_ID
const FREELANCER_CLIENT_ID = 'e7f386e4-b386-48e8-bed4-449692bc20cb';

interface SectionCardProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, description, children }) => (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
        </div>
        <div className="p-6">
            {children}
        </div>
    </div>
);

interface InputFieldProps {
    id: string;
    label: string;
    type?: string;
    value?: string;
    name?: string;
    placeholder?: string;
    icon: React.ReactNode;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isEditing?: boolean;
    displayValue?: string;
}

const InputField: React.FC<InputFieldProps> = ({ id, label, type = 'text', value = '', name, placeholder, icon, onChange, isEditing = true, displayValue }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {isEditing ? (
            <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                    {icon}
                </span>
                <input 
                    type={type} 
                    id={id}
                    name={name || id}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-gray-900"
                />
            </div>
        ) : (
            <div className="flex items-center gap-3 py-2 px-3 bg-gray-100 rounded-lg border border-gray-200 cursor-not-allowed">
                <span className="text-gray-400">{icon}</span>
                <span className="text-gray-500">{displayValue || value || <span className="text-gray-400 italic">Not set</span>}</span>
            </div>
        )}
    </div>
);

interface ToggleSwitchProps {
    label: string;
    description: string;
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ label, description, enabled, setEnabled }) => (
    <div className="flex justify-between items-center">
        <div>
            <p className="font-medium text-gray-800">{label}</p>
            <p className="text-sm text-gray-500">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={enabled} onChange={() => setEnabled(!enabled)} className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 shadow-inner"></div>
        </label>
    </div>
);


const SettingsPage: React.FC = () => {
    const { userEmail, userId } = useAuth();
    const { isPremium, credits, setIsPremium } = usePremium();
    const { navigateTo } = useNavigation();
    const [profileImg, setProfileImg] = useState<string | null>(null);
    
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);

    const [fullName, setFullName] = useState('');
    const [linkedinUrl, setLinkedinUrl] = useState('');
    const [githubUrl, setGithubUrl] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    
    // GitHub OAuth state
    const [githubData, setGithubData] = useState<{
        id?: number;
        username?: string;
        name?: string;
        avatar?: string;
        profileUrl?: string;
        bio?: string;
        followers?: number;
        following?: number;
        publicRepos?: number;
        heatmapUrl?: string;
        accountCreatedAt?: string;
        minYear?: number;
        accessToken?: string;
    } | null>(null);
    const [connectingGithub, setConnectingGithub] = useState(false);
    const githubCallbackProcessed = useRef(false);
    const [selectedHeatmapYear, setSelectedHeatmapYear] = useState<number>(new Date().getFullYear());
    
    // GitHub repositories state
    interface GitHubRepo {
        id: number;
        name: string;
        full_name: string;
        description: string | null;
        html_url: string;
        language: string | null;
        stargazers_count: number;
        updated_at: string;
        private: boolean;
    }
    const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(false);
    const [reposError, setReposError] = useState<string | null>(null);
    const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null);

    // Google Drive OAuth state
    const [driveData, setDriveData] = useState<{
        accessToken?: string;
        files?: Array<{
            id: string;
            name: string;
            mimeType: string;
        }>;
        user?: {
            email?: string;
            name?: string;
            picture?: string;
        };
    } | null>(null);
    const [connectingDrive, setConnectingDrive] = useState(false);
    const driveCallbackProcessed = useRef(false);
    const [loadingDriveFiles, setLoadingDriveFiles] = useState(false);

    // Freelancer OAuth state
    const [freelancerData, setFreelancerData] = useState<{
        username?: string;
        rating?: number;
        profileLink?: string;
        accessToken?: string;
        [key: string]: any;
    } | null>(null);
    const [connectingFreelancer, setConnectingFreelancer] = useState(false);
    const freelancerCallbackProcessed = useRef(false);
    
    // Freelancer projects state
    interface FreelancerProject {
        id: number;
        title: string;
        description: string;
        url: string;
        status: string;
        type: string;
        budget?: {
            minimum: number;
            maximum: number;
            currency?: {
                code: string;
                sign: string;
            };
        };
        time_submitted: number;
        currency?: {
            code: string;
            sign: string;
        };
        seo_url?: string;
    }
    const [freelancerProjects, setFreelancerProjects] = useState<FreelancerProject[]>([]);
    const [loadingFreelancerProjects, setLoadingFreelancerProjects] = useState(false);
    const [freelancerProjectsError, setFreelancerProjectsError] = useState<string | null>(null);

    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState<string | null>(null);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const MAX_SIZE_MB = 10;

    // Fetch user profile data on component mount
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!userId) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch(GET_USER_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId }),
                });

                const data = await response.json();
                console.log('Fetched user data:', data); // Debug log

                // Handle response - check for user data in different formats
                const user = data.data || data.user || data;
                
                if (user && (data.success !== false)) {
                    // Profile fields
                    setFullName(user.fullName || user.name || '');
                    setPhoneNumber(user.phoneNumber || '');
                    setLinkedinUrl(user.linkedinUrl || '');
                    setGithubUrl(user.githubUrl || '');
                    setProfileImg(user.profilePictureUrl || null);
                    setEmailNotifications(user.emailNotifications ?? true);
                    setPushNotifications(user.pushNotifications ?? false);
                    
                    // GitHub data
                    if (user.githubData) {
                        // Restore access token from localStorage if available
                        const storedToken = localStorage.getItem('github_access_token');
                        const githubDataWithToken = storedToken 
                            ? { ...user.githubData, accessToken: storedToken }
                            : user.githubData;
                        setGithubData(githubDataWithToken);
                    } else {
                        // If no githubData in database but token exists in localStorage, try to restore
                        const storedToken = localStorage.getItem('github_access_token');
                        if (storedToken) {
                            // Try to fetch GitHub user info to restore connection state
                            fetchGitHubUserInfo(storedToken);
                        }
                    }
                    
                    // Google Drive data
                    if (user.driveData) {
                        // Restore access token from localStorage if available
                        const storedToken = localStorage.getItem('drive_access_token');
                        const driveDataWithToken = storedToken 
                            ? { ...user.driveData, accessToken: storedToken }
                            : user.driveData;
                        setDriveData(driveDataWithToken);
                    } else {
                        // If no driveData in database but token exists in localStorage, try to restore
                        const storedToken = localStorage.getItem('drive_access_token');
                        if (storedToken) {
                            // Try to fetch Drive files to restore connection state
                            fetchDriveFiles(storedToken);
                        }
                    }
                    
                    // Freelancer data
                    if (user.freelancerData) {
                        // Restore access token from localStorage if available
                        const storedToken = localStorage.getItem('freelancer_access_token');
                        const freelancerDataWithToken = storedToken 
                            ? { ...user.freelancerData, accessToken: storedToken }
                            : user.freelancerData;
                        setFreelancerData(freelancerDataWithToken);
                    } else {
                        // If no freelancerData in database but token exists in localStorage, try to restore
                        const storedToken = localStorage.getItem('freelancer_access_token');
                        if (storedToken) {
                            // Token exists but no profile data - user might need to reconnect
                            console.log('Freelancer token found but no profile data');
                        }
                    }
                    
                    // Sync premium status and credits
                    if (typeof user.isPremium === 'boolean') {
                        setIsPremium(user.isPremium);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch user profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [userId]);

    // Handle GitHub OAuth callback (when Lambda redirects back to frontend)
    useEffect(() => {
        const handleGithubCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const githubDataParam = urlParams.get('github_data');
            const error = urlParams.get('error');
            const message = urlParams.get('message');
            
            // Check if this is a redirect from Lambda with GitHub data
            if (githubDataParam && userId && !githubCallbackProcessed.current) {
                githubCallbackProcessed.current = true;
                setConnectingGithub(true);
                setSaveError(null);
                
                try {
                    // Decode GitHub data from URL parameter
                    const decodedData = JSON.parse(decodeURIComponent(githubDataParam));
                    
                    if (decodedData.success && decodedData.github) {
                        // Store access token in localStorage (temporary solution - should be encrypted in production)
                        if (decodedData.github.accessToken) {
                            localStorage.setItem('github_access_token', decodedData.github.accessToken);
                        }
                        
                        setGithubData(decodedData.github);
                        setGithubUrl(decodedData.github.profileUrl || '');
                        
                        // Save GitHub data to user profile (without access token for security)
                        const githubDataToSave = { ...decodedData.github };
                        delete githubDataToSave.accessToken; // Don't save token to database
                        
                        const saveResponse = await fetch(UPDATE_SETTINGS_ENDPOINT, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'updateSettings',
                                userId,
                                githubUrl: decodedData.github.profileUrl,
                                githubData: githubDataToSave,
                            }),
                        });
                        
                        const saveData = await saveResponse.json();
                        if (saveData.success) {
                            setSaveMessage('GitHub account connected successfully!');
                            // Fetch repositories after successful connection
                            if (decodedData.github.accessToken) {
                                fetchRepositories(decodedData.github.accessToken);
                            }
                            // Clean URL - remove parameters
                            window.history.replaceState({}, document.title, window.location.pathname);
                        } else {
                            setSaveError('Failed to save GitHub data');
                        }
                    } else {
                        setSaveError(decodedData.message || 'Failed to connect GitHub account');
                    }
                } catch (err) {
                    console.error('GitHub OAuth error:', err);
                    setSaveError('Failed to process GitHub data');
                } finally {
                    setConnectingGithub(false);
                }
            } else if (error || message) {
                // Handle error from Lambda redirect
                setSaveError(message || error || 'GitHub authorization failed');
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        };
        
        handleGithubCallback();
    }, [userId]);

    // Handle Google Drive OAuth callback (when Lambda redirects back to frontend)
    useEffect(() => {
        const handleDriveCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const driveDataParam = urlParams.get('drive_data');
            const error = urlParams.get('error');
            const message = urlParams.get('message');
            
            // Check if this is a redirect from Lambda with Drive data
            if (driveDataParam && userId && !driveCallbackProcessed.current) {
                driveCallbackProcessed.current = true;
                setConnectingDrive(true);
                setSaveError(null);
                
                try {
                    // Decode Drive data from URL parameter
                    const decodedData = JSON.parse(decodeURIComponent(driveDataParam));
                    
                    if (decodedData.success && decodedData.drive) {
                        // Store access token in localStorage (temporary solution - should be encrypted in production)
                        if (decodedData.drive.accessToken) {
                            localStorage.setItem('drive_access_token', decodedData.drive.accessToken);
                        }
                        
                        setDriveData(decodedData.drive);
                        
                        // Save Drive data to user profile (without access token for security)
                        const driveDataToSave = { ...decodedData.drive };
                        delete driveDataToSave.accessToken; // Don't save token to database
                        
                        const saveResponse = await fetch(UPDATE_SETTINGS_ENDPOINT, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'updateSettings',
                                userId,
                                driveData: driveDataToSave,
                            }),
                        });
                        
                        const saveData = await saveResponse.json();
                        if (saveData.success) {
                            setSaveMessage('Google Drive connected successfully!');
                            // Clean URL - remove parameters
                            window.history.replaceState({}, document.title, window.location.pathname);
                        } else {
                            setSaveError('Failed to save Google Drive data');
                        }
                    } else {
                        setSaveError(decodedData.message || 'Failed to connect Google Drive');
                    }
                } catch (err) {
                    console.error('Google Drive OAuth error:', err);
                    setSaveError('Failed to process Google Drive data');
                } finally {
                    setConnectingDrive(false);
                }
            } else if (error || message) {
                // Handle error from Lambda redirect (only if not already processed)
                if (!driveCallbackProcessed.current) {
                    setSaveError(message || error || 'Google Drive authorization failed');
                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            }
        };
        
        handleDriveCallback();
    }, [userId]);

    // Handle Freelancer OAuth callback (when Lambda redirects back to frontend with profile data)
    useEffect(() => {
        const handleFreelancerCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search);
            const freelancerDataParam = urlParams.get('freelancer_data');
            const error = urlParams.get('error');
            const message = urlParams.get('message');
            
            // Check if this is a redirect from Lambda with Freelancer profile data
            if (freelancerDataParam && userId && !freelancerCallbackProcessed.current) {
                freelancerCallbackProcessed.current = true;
                setConnectingFreelancer(true);
                setSaveError(null);
                
                try {
                    // Decode Freelancer data from URL parameter (Lambda redirects back with data)
                    const decodedData = JSON.parse(decodeURIComponent(freelancerDataParam));
                    
                    console.log('Decoded Freelancer data:', decodedData);
                    
                    // Handle the actual API response structure: { access_token, profile: { status: "success", result: {...} } }
                    // The profile data is nested in profile.result
                    const profileResult = decodedData.profile?.result || decodedData.result || null;
                    const profileStatus = decodedData.profile?.status || decodedData.status;
                    
                    if (profileStatus === 'success' && profileResult) {
                        // Extract profile information from the actual Freelancer API response structure
                        const username = profileResult.username || profileResult.display_name || profileResult.public_name || profileResult.id?.toString();
                        const profileLink = `https://www.freelancer.com/u/${username}`;
                        const accessToken = decodedData.access_token; // Store access token to fetch projects
                        
                        // Calculate rating if available (employer_reputation or other reputation fields)
                        const rating = profileResult.employer_reputation || profileResult.reputation || profileResult.freelancer_reputation || null;
                        
                        // Extract location information
                        const location = profileResult.location ? {
                            city: profileResult.location.city,
                            country: profileResult.location.country?.name,
                            countryCode: profileResult.location.country?.code,
                        } : null;
                        
                        // Extract registration date
                        const registrationDate = profileResult.registration_date 
                            ? new Date(profileResult.registration_date * 1000).toLocaleDateString()
                            : null;
                        
                        // Normalize profile data for storage and display
                        const normalizedProfile = {
                            username: username,
                            displayName: profileResult.display_name || profileResult.public_name,
                            publicName: profileResult.public_name,
                            userId: profileResult.id,
                            role: profileResult.role || profileResult.chosen_role,
                            profileLink: profileLink,
                            rating: rating,
                            location: location,
                            registrationDate: registrationDate,
                            emailVerified: profileResult.status?.email_verified || false,
                            paymentVerified: profileResult.status?.payment_verified || false,
                            profileComplete: profileResult.status?.profile_complete || false,
                            primaryCurrency: profileResult.primary_currency?.code || 'INR',
                            avatar: profileResult.avatar_cdn || profileResult.avatar_large_cdn || profileResult.avatar,
                            portfolioCount: profileResult.portfolio_count !== undefined ? profileResult.portfolio_count : 0,
                            jobsCount: profileResult.jobs !== undefined ? profileResult.jobs : null,
                            hourlyRate: profileResult.hourly_rate !== undefined && profileResult.hourly_rate !== null ? profileResult.hourly_rate : null,
                            profileDescription: profileResult.profile_description || null,
                            tagline: profileResult.tagline || null,
                            // Store access token temporarily in state (will be stored in localStorage)
                            accessToken: accessToken,
                        };
                        
                        console.log('Normalized Freelancer profile:', normalizedProfile);
                        
                        // Store access token in localStorage for fetching projects
                        if (accessToken) {
                            localStorage.setItem('freelancer_access_token', accessToken);
                        }
                        
                        setFreelancerData(normalizedProfile);
                        
                        // Save Freelancer data to user profile (without accessToken)
                        const { accessToken: _, ...profileToSave } = normalizedProfile;
                        
                        const saveResponse = await fetch(UPDATE_SETTINGS_ENDPOINT, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'updateSettings',
                                userId,
                                freelancerData: profileToSave,
                            }),
                        });
                        
                        const saveData = await saveResponse.json();
                        if (saveData.success !== false) {
                            setSaveMessage('Freelancer account connected successfully!');
                            
                            // Fetch projects after successful connection
                            if (accessToken && profileResult.id) {
                                fetchFreelancerProjects(accessToken, profileResult.id);
                            }
                            
                            // Clean URL - remove parameters
                            window.history.replaceState({}, document.title, window.location.pathname);
                        } else {
                            setSaveError('Failed to save Freelancer data');
                        }
                    } else {
                        setSaveError(decodedData.message || decodedData.error || decodedData.profile?.status || 'Failed to connect Freelancer account');
                    }
                } catch (err) {
                    console.error('Freelancer OAuth error:', err);
                    setSaveError('Failed to process Freelancer data');
                } finally {
                    setConnectingFreelancer(false);
                }
            } else if (error || message) {
                // Handle error from Lambda redirect
                if (!freelancerCallbackProcessed.current) {
                    setSaveError(message || error || 'Freelancer authorization failed');
                    // Clean URL
                    window.history.replaceState({}, document.title, window.location.pathname);
                    freelancerCallbackProcessed.current = true;
                }
            }
        };
        
        handleFreelancerCallback();
    }, [userId]);

    // Initiate GitHub OAuth
    const connectGithub = () => {
        if (!userId) {
            setSaveError('You must be logged in to connect GitHub');
            return;
        }
        
        // Use Lambda function URL as redirect_uri (already registered in GitHub)
        // Pass frontend return URL in state parameter
        const frontendReturnUrl = `${window.location.origin}${window.location.pathname}`;
        const state = btoa(JSON.stringify({ userId, returnUrl: frontendReturnUrl }));
        const redirectUri = GITHUB_OAUTH_CALLBACK;
        
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user&state=${encodeURIComponent(state)}`;
        window.location.href = githubAuthUrl;
    };

    // Initiate Google Drive OAuth
    const connectDrive = () => {
        if (!userId) {
            setSaveError('You must be logged in to connect Google Drive');
            return;
        }
        
        // Use Lambda function URL as redirect_uri (already registered in Google)
        // Pass frontend return URL in state parameter
        const frontendReturnUrl = `${window.location.origin}${window.location.pathname}`;
        const state = btoa(JSON.stringify({ userId, returnUrl: frontendReturnUrl }));
        const redirectUri = GOOGLE_DRIVE_OAUTH_CALLBACK;
        
        const googleAuthUrl =
            "https://accounts.google.com/o/oauth2/v2/auth" +
            `?client_id=${GOOGLE_CLIENT_ID}` +
            `&redirect_uri=${encodeURIComponent(redirectUri)}` +
            "&response_type=code" +
            "&scope=https://www.googleapis.com/auth/drive.metadata.readonly" +
            "&access_type=offline" +
            "&prompt=consent" +
            `&state=${encodeURIComponent(state)}`;
        
        window.location.href = googleAuthUrl;
    };

    // Fetch Google Drive files
    const fetchDriveFiles = async (accessToken?: string) => {
        const token = accessToken || driveData?.accessToken || localStorage.getItem('drive_access_token');
        if (!token) {
            return;
        }
        
        setLoadingDriveFiles(true);
        try {
            const response = await fetch(
                'https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,modifiedTime,size)',
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                }
            );
            
            if (response.ok) {
                const data = await response.json();
                setDriveData(prev => ({
                    ...prev,
                    files: data.files || [],
                }));
            }
        } catch (err) {
            console.error('Error fetching Drive files:', err);
        } finally {
            setLoadingDriveFiles(false);
        }
    };

    // Disconnect Google Drive
    const disconnectDrive = async () => {
        if (!userId) return;
        
        setConnectingDrive(true);
        try {
            const response = await fetch(UPDATE_SETTINGS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateSettings',
                    userId,
                    driveData: null,
                }),
            });
            
            const data = await response.json();
            if (data.success) {
                setDriveData(null);
                // Remove access token from localStorage
                localStorage.removeItem('drive_access_token');
                setSaveMessage('Google Drive disconnected');
            } else {
                setSaveError('Failed to disconnect Google Drive');
            }
        } catch (err) {
            console.error('Disconnect Drive error:', err);
            setSaveError('Failed to disconnect Google Drive');
        } finally {
            setConnectingDrive(false);
        }
    };

    // Initiate Freelancer OAuth
    // Flow: Frontend redirects to Freelancer OAuth -> Freelancer redirects back to frontend with code -> Frontend calls Lambda with code
    const connectFreelancer = () => {
        console.log('Connect Freelancer button clicked');
        
        if (!userId) {
            setSaveError('You must be logged in to connect Freelancer');
            return;
        }
        
        try {
            // Verify CLIENT_ID is configured
            if (!FREELANCER_CLIENT_ID || FREELANCER_CLIENT_ID.trim() === '') {
                const errorMsg = 'Freelancer OAuth Client ID is not configured. Please set FREELANCER_CLIENT_ID in SettingsPage.tsx.';
                setSaveError(errorMsg);
                alert(errorMsg);
                return;
            }
            
            // Use Lambda callback API as redirect_uri (must be registered in Freelancer OAuth app settings)
            // Pass frontend return URL in state parameter so Lambda can redirect back
            const frontendReturnUrl = `${window.location.origin}${window.location.pathname}`;
            const state = btoa(JSON.stringify({ userId, returnUrl: frontendReturnUrl }));
            const redirectUri = FREELANCER_OAUTH_CALLBACK_API;
            const scope = 'basic';
            
            // Use correct Freelancer OAuth authorize URL (accounts.freelancer.com, not www.freelancer.com)
            const freelancerAuthUrl = `https://accounts.freelancer.com/oauth/authorize?response_type=code&client_id=${FREELANCER_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${encodeURIComponent(state)}`;
            
            console.log('Redirecting to Freelancer OAuth');
            console.log('Redirect URI (Lambda callback):', redirectUri);
            console.log('Frontend return URL (in state):', frontendReturnUrl);
            console.log('Full OAuth URL:', freelancerAuthUrl);
            
            setConnectingFreelancer(true);
            setSaveError(null);
            setSaveMessage(null);
            
            window.location.href = freelancerAuthUrl;
        } catch (error) {
            console.error('Error initiating Freelancer OAuth:', error);
            setSaveError(`Failed to initiate Freelancer OAuth: ${error instanceof Error ? error.message : 'Unknown error'}`);
            setConnectingFreelancer(false);
        }
    };

    // Disconnect Freelancer
    // Fetch Freelancer projects
    const fetchFreelancerProjects = async (accessToken?: string, userId?: number) => {
        const token = accessToken || freelancerData?.accessToken || localStorage.getItem('freelancer_access_token');
        const freelancerUserId = userId || freelancerData?.userId;
        
        if (!token || !freelancerUserId) {
            setFreelancerProjectsError('Access token or user ID not available. Please reconnect your Freelancer account.');
            return;
        }
        
        setLoadingFreelancerProjects(true);
        setFreelancerProjectsError(null);
        
        try {
            // Fetch projects owned by the user
            const projectsUrl = `https://www.freelancer.com/api/projects/0.1/projects/?owners[]=${freelancerUserId}&limit=20`;
            
            const response = await fetch(projectsUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json',
                },
            });
            
            if (!response.ok) {
                throw new Error(`Failed to fetch projects: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Freelancer projects response:', data);
            
            // Handle different response structures
            const projects = data.result?.projects || data.projects || data.data || [];
            
            if (Array.isArray(projects)) {
                setFreelancerProjects(projects);
            } else {
                setFreelancerProjects([]);
            }
        } catch (err) {
            console.error('Error fetching Freelancer projects:', err);
            setFreelancerProjectsError('Failed to fetch Freelancer projects. Please try again.');
            setFreelancerProjects([]);
        } finally {
            setLoadingFreelancerProjects(false);
        }
    };

    const disconnectFreelancer = async () => {
        if (!userId) return;
        
        setConnectingFreelancer(true);
        try {
            const response = await fetch(UPDATE_SETTINGS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateSettings',
                    userId,
                    freelancerData: null,
                }),
            });
            
            const data = await response.json();
            if (data.success !== false) {
                setFreelancerData(null);
                setFreelancerProjects([]);
                // Remove access token from localStorage
                localStorage.removeItem('freelancer_access_token');
                setSaveMessage('Freelancer account disconnected');
            } else {
                setSaveError('Failed to disconnect Freelancer account');
            }
        } catch (err) {
            console.error('Disconnect Freelancer error:', err);
            setSaveError('Failed to disconnect Freelancer account');
        } finally {
            setConnectingFreelancer(false);
        }
    };

    // Fetch GitHub user info to restore connection state
    const fetchGitHubUserInfo = async (accessToken: string) => {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                },
            });
            
            if (response.ok) {
                const user = await response.json();
                const username = user.login;
                const created_at = user.created_at;
                
                // Generate heatmap URL
                const heatmap_url = `https://ghchart.rshah.org/${username}`;
                
                // Calculate account creation year
                let account_creation_year = null;
                if (created_at) {
                    try {
                        account_creation_year = new Date(created_at).getFullYear();
                    } catch (e) {
                        // Ignore
                    }
                }
                
                const currentYear = new Date().getFullYear();
                const minYear = account_creation_year && account_creation_year > 2010
                    ? account_creation_year
                    : Math.max(2014, currentYear - 10);
                
                // Restore GitHub data
                const restoredGithubData = {
                    id: user.id,
                    username: username,
                    name: user.name,
                    avatar: user.avatar_url,
                    profileUrl: user.html_url,
                    bio: user.bio,
                    followers: user.followers,
                    following: user.following,
                    publicRepos: user.public_repos,
                    heatmapUrl: heatmap_url,
                    accountCreatedAt: created_at,
                    minYear: minYear,
                    accessToken: accessToken,
                };
                
                setGithubData(restoredGithubData);
                setGithubUrl(user.html_url);
                
                // Save to database (without token)
                const { accessToken: _, ...githubDataToSave } = restoredGithubData;
                
                if (userId) {
                    await fetch(UPDATE_SETTINGS_ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            action: 'updateSettings',
                            userId,
                            githubUrl: user.html_url,
                            githubData: githubDataToSave,
                        }),
                    });
                }
            }
        } catch (err) {
            console.error('Failed to restore GitHub user info:', err);
            // If token is invalid, remove it
            localStorage.removeItem('github_access_token');
        }
    };

    // Fetch GitHub repositories
    const fetchRepositories = async (accessToken?: string) => {
        // Try to get token from: parameter > state > localStorage
        const token = accessToken || githubData?.accessToken || localStorage.getItem('github_access_token');
        if (!token) {
            setReposError('GitHub access token not available. Please reconnect your GitHub account.');
            return;
        }
        
        setLoadingRepos(true);
        setReposError(null);
        
        try {
            // Fetch all public repositories
            const repos: GitHubRepo[] = [];
            let page = 1;
            let hasMore = true;
            
            while (hasMore && page <= 10) { // Limit to 10 pages (300 repos max)
                const response = await fetch(
                    `https://api.github.com/user/repos?type=public&per_page=30&page=${page}&sort=updated`,
                    {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/vnd.github.v3+json',
                        },
                    }
                );
                
                if (!response.ok) {
                    throw new Error(`Failed to fetch repositories: ${response.statusText}`);
                }
                
                const pageRepos: GitHubRepo[] = await response.json();
                if (pageRepos.length === 0) {
                    hasMore = false;
                } else {
                    repos.push(...pageRepos.filter(repo => !repo.private));
                    page++;
                }
            }
            
            setRepositories(repos);
        } catch (err) {
            console.error('Error fetching repositories:', err);
            setReposError('Failed to fetch repositories. Please try again.');
        } finally {
            setLoadingRepos(false);
        }
    };
    
    // Load repositories when GitHub is connected
    useEffect(() => {
        const token = githubData?.accessToken || localStorage.getItem('github_access_token');
        if (token && githubData && repositories.length === 0 && !loadingRepos) {
            fetchRepositories();
        }
    }, [githubData]);

    // Load Drive files when Google Drive is connected
    useEffect(() => {
        const token = driveData?.accessToken || localStorage.getItem('drive_access_token');
        if (token && driveData && (!driveData.files || driveData.files.length === 0) && !loadingDriveFiles) {
            fetchDriveFiles();
        }
    }, [driveData]);

    // Load Freelancer projects when Freelancer is connected
    useEffect(() => {
        const token = freelancerData?.accessToken || localStorage.getItem('freelancer_access_token');
        if (token && freelancerData && freelancerData.userId && freelancerProjects.length === 0 && !loadingFreelancerProjects) {
            fetchFreelancerProjects(token, freelancerData.userId);
        }
    }, [freelancerData]);
    
    // Disconnect GitHub
    const disconnectGithub = async () => {
        if (!userId) return;
        
        setConnectingGithub(true);
        try {
            const response = await fetch(UPDATE_SETTINGS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updateSettings',
                    userId,
                    githubUrl: '',
                    githubData: null,
                }),
            });
            
            const data = await response.json();
            if (data.success) {
                setGithubData(null);
                setGithubUrl('');
                setRepositories([]);
                // Remove access token from localStorage
                localStorage.removeItem('github_access_token');
                setSaveMessage('GitHub account disconnected');
            } else {
                setSaveError('Failed to disconnect GitHub account');
            }
        } catch (err) {
            console.error('Disconnect GitHub error:', err);
            setSaveError('Failed to disconnect GitHub account');
        } finally {
            setConnectingGithub(false);
        }
    };
    
    // Select repository (only one at a time)
    const selectRepo = (repoId: number) => {
        // If clicking the same repo, deselect it
        if (selectedRepoId === repoId) {
            setSelectedRepoId(null);
        } else {
            setSelectedRepoId(repoId);
        }
    };

    // Navigate to seller dashboard with gitUrl and project name pre-filled
    const uploadToProjectBazaar = (repoUrl: string, repoName: string) => {
        // Store gitUrl and project name in localStorage for SellerDashboard to pick up
        localStorage.setItem('prefillGitUrl', repoUrl);
        localStorage.setItem('prefillProjectName', repoName);
        // Navigate to seller dashboard route
        navigateTo('seller');
        // The SellerDashboardPage and SellerDashboard will check for these values on mount
    };

    // Upload selected repository
    const uploadSelectedRepo = () => {
        if (!selectedRepoId) return;
        
        const selectedRepo = repositories.find(repo => repo.id === selectedRepoId);
        
        if (selectedRepo) {
            uploadToProjectBazaar(selectedRepo.html_url, selectedRepo.name);
            // Clear selection after upload
            setSelectedRepoId(null);
        }
    };

    

    const uploadFile = async (file: File) => {
        if (!userId) return;

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
            setSaveError('Image must be less than 10MB');
            return;
        }
        
        setUploading(true);
        setSaveError(null);
        
        try {
            // 1️⃣ Ask SAME Lambda for presigned URL
            const presignRes = await fetch(UPDATE_SETTINGS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'getPresignedUrl',
                    userId,
                    fileName: file.name,
                    fileType: file.type,
                }),
            });
    
            const presignData = await presignRes.json();
            console.log('Presign response:', presignData);
    
            if (!presignData.success) {
                throw new Error('Failed to get upload URL');
            }
    
            const { uploadUrl, fileUrl, contentType } = presignData;
    
            // 2️⃣ Upload image directly to S3 using fetch
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                // Only set Content-Type if the backend tells us to
                ...(contentType && { headers: { 'Content-Type': contentType } })
            });

            if (!uploadResponse.ok) {
                console.error('S3 upload failed:', uploadResponse.status, await uploadResponse.text());
                throw new Error(`Upload failed with status ${uploadResponse.status}`);
            }
    
            // 3️⃣ Save S3 URL to state (will be saved to DB when user clicks Save Changes)
            setPendingImageUrl(fileUrl);
            setProfileImg(fileUrl);
    
        } catch (err) {
            console.error('Image upload failed', err);
            setSaveError('Failed to upload image');
        } finally {
            setUploading(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !userId) return;
        const file = e.target.files[0];
        await uploadFile(file);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            const file = files[0];
            if (file.type.startsWith('image/')) {
                await uploadFile(file);
            } else {
                setSaveError('Please drop an image file');
            }
        }
    };
    

    const handleProfileSubmit = async (e?: React.FormEvent) => {
        console.log('Save button clicked!'); // Debug: confirm button works
        if (e) {
            e.preventDefault();
        }
        setSaveMessage(null);
        setSaveError(null);

        if (!userId) {
            setSaveError('You must be logged in to update settings.');
            return;
        }

        setSaving(true);
        try {
            // Build request body - only include profilePictureUrl if it exists
            const requestBody: Record<string, unknown> = {
                action: 'updateSettings',
                userId,
                emailNotifications,
                pushNotifications,
            };

            if (fullName.trim()) requestBody.fullName = fullName.trim();
            if (phoneNumber.trim()) requestBody.phoneNumber = phoneNumber.trim();
            if (linkedinUrl.trim()) requestBody.linkedinUrl = linkedinUrl.trim();
            if (githubUrl.trim()) requestBody.githubUrl = githubUrl.trim();
            
            // Include GitHub data if available
            if (githubData) {
                requestBody.githubData = githubData;
            }
            
            // Include Google Drive data if available (without access token)
            if (driveData) {
                const { accessToken, ...driveDataToSave } = driveData;
                requestBody.driveData = driveDataToSave;
            }
            
            // Include Freelancer data if available
            if (freelancerData) {
                requestBody.freelancerData = freelancerData;
            }
            
            // Include profile picture URL if available
            const imageUrlToSave = pendingImageUrl || profileImg;
            if (imageUrlToSave) {
                requestBody.profilePictureUrl = imageUrlToSave;
            }

            console.log('Saving settings:', requestBody); // Debug log

            const response = await fetch(UPDATE_SETTINGS_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),                
            });

            const data = await response.json();
            console.log('Response:', data); // Debug log

            if (data.success) {
                setSaveMessage('Settings updated successfully.');
                setPendingImageUrl(null);
                setIsEditingProfile(false);
            } else {
                setSaveError(data?.error?.message || data?.message || 'Failed to update settings.');
            }
        } catch (err) {
            console.error('Update settings error:', err);
            setSaveError('Network error while updating settings.');
        } finally {
            setSaving(false);
        }
    };
    
    // Show loading spinner while fetching user data
    if (loading) {
        return (
            <div className="mt-8 flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <svg className="animate-spin h-10 w-10 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-gray-500">Loading your profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mt-8 space-y-8 max-w-4xl mx-auto">
            <SectionCard title="Public Profile" description="This information will be displayed publicly.">
                <div className="space-y-6">
                    {/* Edit Button - shown when not editing */}
                    {!isEditingProfile && (
                        <div className="flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsEditingProfile(true)}
                                className="flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                                Edit Profile
                            </button>
                        </div>
                    )}

                    {/* Profile Picture Section */}
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-gray-200">
                                {profileImg ? (
                                    <img src={profileImg} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                                )}
                            </div>
                            {uploading && (
                                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                                    <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </div>
                            )}
                        </div>
                        
                        {isEditingProfile ? (
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                className={`flex-1 border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                                    isDragging 
                                        ? 'border-orange-500 bg-orange-50' 
                                        : 'border-gray-300 hover:border-orange-400 hover:bg-orange-50/50'
                                }`}
                            >
                                <input type="file" id="file-upload" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                                <label htmlFor="file-upload" className={`cursor-pointer ${uploading ? 'pointer-events-none' : ''}`}>
                                    <div className="flex flex-col items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isDragging ? 'text-orange-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                        <div className="text-sm">
                                            <span className="text-orange-600 font-semibold">Click to upload</span>
                                            <span className="text-gray-500"> or drag and drop</span>
                                        </div>
                                        <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</p>
                                    </div>
                                </label>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm font-medium text-gray-700">Profile Picture</p>
                                <p className="text-xs text-gray-400 mt-1">{profileImg ? 'Photo uploaded' : 'No photo uploaded'}</p>
                            </div>
                        )}
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            id="fullName"
                            label="Full Name"
                            name="fullName"
                            placeholder="John Doe"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            isEditing={isEditingProfile}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>}
                        />
                        <InputField
                            id="email"
                            label="Email Address"
                            name="email"
                            value={userEmail || ''}
                            placeholder="you@example.com"
                            type="email"
                            isEditing={false}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>}
                            onChange={() => {
                                // Email is not editable via settings API; ignore changes
                            }}
                        />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField
                            id="phoneNumber"
                            label="Phone Number"
                            name="phoneNumber"
                            placeholder="+91..."
                            value={phoneNumber}
                            onChange={() => {
                                // Phone number is not editable via settings; ignore changes
                            }}
                            isEditing={false}
                            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>}
                        />
                        <div className="grid grid-cols-1 gap-6">
                            <InputField
                                id="linkedin"
                                label="LinkedIn URL"
                                name="linkedinUrl"
                                placeholder="linkedin.com/in/..."
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                isEditing={isEditingProfile}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>}
                            />
                            <InputField
                                id="github"
                                label="GitHub URL"
                                name="githubUrl"
                                placeholder="github.com/..."
                                value={githubUrl}
                                onChange={(e) => setGithubUrl(e.target.value)}
                                isEditing={isEditingProfile}
                                icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>}
                            />
                        </div>
                    </div>
                    
                    {/* GitHub Integration Section */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">GitHub Integration</h4>
                                <p className="text-sm text-gray-500">Connect your GitHub account to showcase your contributions and activity</p>
                            </div>
                        </div>
                        
                        {/* Setup Instructions */}
                        {!githubData && (
                            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-green-900 mb-2">Ready to Connect!</p>
                                        <p className="text-xs text-green-800 mb-2">
                                            The Lambda function URL is already configured as the callback URL in your GitHub OAuth App.
                                        </p>
                                        <p className="text-xs text-green-800">
                                            Click "Connect GitHub" below to authorize and connect your GitHub account.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {githubData ? (
                            <div className="space-y-4">
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {githubData.avatar && (
                                                <img 
                                                    src={githubData.avatar} 
                                                    alt={githubData.username || 'GitHub'} 
                                                    className="w-12 h-12 rounded-full"
                                                />
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-gray-900">{githubData.username || 'GitHub User'}</p>
                                                    {githubData.name && (
                                                        <span className="text-sm text-gray-500">({githubData.name})</span>
                                                    )}
                                                </div>
                                                {githubData.bio && (
                                                    <p className="text-sm text-gray-600 mt-1">{githubData.bio}</p>
                                                )}
                                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                                    {githubData.followers !== undefined && (
                                                        <span>{githubData.followers} followers</span>
                                                    )}
                                                    {githubData.following !== undefined && (
                                                        <span>{githubData.following} following</span>
                                                    )}
                                                    {githubData.publicRepos !== undefined && (
                                                        <span>{githubData.publicRepos} repositories</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={disconnectGithub}
                                            disabled={connectingGithub}
                                            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {connectingGithub ? 'Disconnecting...' : 'Disconnect'}
                                        </button>
                                    </div>
                                </div>
                                
                                {/* GitHub Contribution Heatmap */}
                                {githubData.heatmapUrl && githubData.username && (
                                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                                </svg>
                                                <h4 className="text-lg font-semibold text-gray-900">Contribution Heatmap</h4>
                                            </div>
                                            <select
                                                value={selectedHeatmapYear}
                                                onChange={(e) => setSelectedHeatmapYear(parseInt(e.target.value))}
                                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                            >
                                                {(() => {
                                                    const currentYear = new Date().getFullYear();
                                                    // Use minYear from GitHub data if available, otherwise last 10 years
                                                    const minYear = githubData?.minYear || Math.max(2014, currentYear - 10);
                                                    const years = [];
                                                    for (let year = currentYear; year >= minYear; year--) {
                                                        years.push(
                                                            <option key={year} value={year}>
                                                                {year}
                                                            </option>
                                                        );
                                                    }
                                                    return years;
                                                })()}
                                            </select>
                                        </div>
                                        <div className="overflow-x-auto p-4 bg-gray-50 rounded-lg">
                                            <GitHubContributionHeatmap 
                                                username={githubData.username} 
                                                selectedYear={selectedHeatmapYear}
                                            />
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-200">
                                            <a
                                                href={githubData.profileUrl || `https://github.com/${githubData.username}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                View full profile on GitHub
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                            </a>
                                        </div>
                                    </div>
                                )}
                                
                                {/* GitHub Repositories Section */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                            </svg>
                                            <h4 className="text-lg font-semibold text-gray-900">Public Repositories</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {repositories.length > 0 && (
                                                <button
                                                    onClick={() => fetchRepositories()}
                                                    disabled={loadingRepos}
                                                    className="px-3 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loadingRepos ? 'Refreshing...' : 'Refresh'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Upload Selected Button - shown when a repository is selected */}
                                    {selectedRepoId && (
                                        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm font-medium text-orange-900">
                                                    {repositories.find(r => r.id === selectedRepoId)?.full_name} selected
                                                </span>
                                            </div>
                                            <button
                                                onClick={uploadSelectedRepo}
                                                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm hover:shadow-md"
                                            >
                                                Upload to ProjectBazaar
                                            </button>
                                        </div>
                                    )}
                                    
                                    {loadingRepos && repositories.length === 0 ? (
                                        <div className="flex items-center justify-center py-8">
                                            <svg className="animate-spin h-6 w-6 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="ml-2 text-sm text-gray-500">Loading repositories...</span>
                                        </div>
                                    ) : reposError ? (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-800">{reposError}</p>
                                            <button
                                                onClick={() => fetchRepositories()}
                                                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Try again
                                            </button>
                                        </div>
                                    ) : repositories.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-gray-500 mb-3">No public repositories found.</p>
                                            <button
                                                onClick={() => fetchRepositories()}
                                                className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                                            >
                                                Load Repositories
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {repositories.map((repo) => {
                                                const isSelected = selectedRepoId === repo.id;
                                                return (
                                                    <div
                                                        key={repo.id}
                                                        className={`flex items-center gap-3 p-3 border rounded-lg transition-colors cursor-pointer ${
                                                            isSelected
                                                                ? 'bg-orange-50 border-orange-300 hover:bg-orange-100'
                                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                        }`}
                                                        onClick={() => selectRepo(repo.id)}
                                                    >
                                                        <input
                                                            type="radio"
                                                            name="selected-repo"
                                                            checked={isSelected}
                                                            onChange={() => selectRepo(repo.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500 cursor-pointer flex-shrink-0"
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                                                </svg>
                                                                <a
                                                                    href={repo.html_url}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="font-semibold text-gray-900 hover:text-orange-600 truncate"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {repo.full_name}
                                                                </a>
                                                            </div>
                                                            {repo.description && (
                                                                <p className="text-xs text-gray-600 truncate mb-1">{repo.description}</p>
                                                            )}
                                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                                {repo.language && (
                                                                    <span className="flex items-center gap-1">
                                                                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                                        {repo.language}
                                                                    </span>
                                                                )}
                                                                <span className="flex items-center gap-1">
                                                                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                                    </svg>
                                                                    {repo.stargazers_count}
                                                                </span>
                                                                <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={connectGithub}
                                disabled={connectingGithub}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {connectingGithub ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                                        </svg>
                                        Connect GitHub
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                    
                    {/* Google Drive Integration Section */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">Google Drive Integration</h4>
                                <p className="text-sm text-gray-500">Connect your Google Drive to access and manage your files</p>
                            </div>
                        </div>
                        
                        {/* Setup Instructions */}
                        {!driveData && (
                            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-blue-900 mb-2">Ready to Connect!</p>
                                        <p className="text-xs text-blue-800 mb-2">
                                            The Lambda function URL is already configured as the callback URL in your Google OAuth App.
                                        </p>
                                        <p className="text-xs text-blue-800">
                                            Click "Connect Google Drive" below to authorize and connect your Google Drive account.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {driveData ? (
                            <div className="space-y-4">
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {driveData.user?.picture && (
                                                <img 
                                                    src={driveData.user.picture} 
                                                    alt={driveData.user.name || 'Google Drive'} 
                                                    className="w-12 h-12 rounded-full"
                                                />
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-gray-900">{driveData.user?.name || 'Google Drive User'}</p>
                                                </div>
                                                {driveData.user?.email && (
                                                    <p className="text-sm text-gray-600 mt-1">{driveData.user.email}</p>
                                                )}
                                                {driveData.files && (
                                                    <p className="text-sm text-gray-500 mt-1">{driveData.files.length} files loaded</p>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={disconnectDrive}
                                            disabled={connectingDrive}
                                            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {connectingDrive ? 'Disconnecting...' : 'Disconnect'}
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Google Drive Files Section */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M7.71 2.5L2.5 7.71l5.21 5.21L13.42 7.71 7.71 2.5zm8.79 0L13.42 7.71l5.21 5.21 5.21-5.21L16.5 2.5zM2.5 16.29l5.21 5.21L13.42 16.5 8.21 11.29 2.5 16.29zm13.42 0l5.21 5.21 5.21-5.21-5.21-5.21-5.21 5.21z"/>
                                            </svg>
                                            <h4 className="text-lg font-semibold text-gray-900">Drive Files</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {driveData.files && driveData.files.length > 0 && (
                                                <button
                                                    onClick={() => fetchDriveFiles()}
                                                    disabled={loadingDriveFiles}
                                                    className="px-3 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loadingDriveFiles ? 'Refreshing...' : 'Refresh'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {loadingDriveFiles && (!driveData.files || driveData.files.length === 0) ? (
                                        <div className="flex items-center justify-center py-8">
                                            <svg className="animate-spin h-6 w-6 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="ml-2 text-sm text-gray-500">Loading files...</span>
                                        </div>
                                    ) : driveData.files && driveData.files.length > 0 ? (
                                        <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {driveData.files.map((file) => (
                                                <div
                                                    key={file.id}
                                                    className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                >
                                                    <svg className="w-5 h-5 text-gray-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
                                                    </svg>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                                                        <p className="text-xs text-gray-500">{file.mimeType}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-gray-500 mb-3">No files found.</p>
                                            <button
                                                onClick={() => fetchDriveFiles()}
                                                className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                                            >
                                                Load Files
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={connectDrive}
                                disabled={connectingDrive}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {connectingDrive ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M7.71 2.5L2.5 7.71l5.21 5.21L13.42 7.71 7.71 2.5zm8.79 0L13.42 7.71l5.21 5.21 5.21-5.21L16.5 2.5zM2.5 16.29l5.21 5.21L13.42 16.5 8.21 11.29 2.5 16.29zm13.42 0l5.21 5.21 5.21-5.21-5.21-5.21-5.21 5.21z"/>
                                        </svg>
                                        Connect Google Drive
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                    
                    {/* Freelancer Integration Section */}
                    <div className="border-t border-gray-200 pt-6 mt-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-1">Freelancer Integration</h4>
                                <p className="text-sm text-gray-500">Connect your Freelancer account to showcase your profile and ratings</p>
                            </div>
                        </div>
                        
                        {freelancerData ? (
                            <div className="space-y-4">
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4 flex-1">
                                            {freelancerData.avatar ? (
                                                <img 
                                                    src={freelancerData.avatar} 
                                                    alt={freelancerData.username || 'Freelancer'} 
                                                    className="w-16 h-16 rounded-full border-2 border-gray-200"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center border-2 border-gray-200">
                                                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <p className="text-xl font-bold text-gray-900">{freelancerData.displayName || freelancerData.publicName || freelancerData.username || 'Freelancer User'}</p>
                                                    {freelancerData.role && (
                                                        <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded-full capitalize">
                                                            {freelancerData.role}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600 mb-1">@{freelancerData.username}</p>
                                                {freelancerData.location && (
                                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                        <span>
                                                            {freelancerData.location.city && freelancerData.location.country 
                                                                ? `${freelancerData.location.city}, ${freelancerData.location.country}`
                                                                : freelancerData.location.city || freelancerData.location.country || 'Location not set'}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button
                                            onClick={disconnectFreelancer}
                                            disabled={connectingFreelancer}
                                            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {connectingFreelancer ? 'Disconnecting...' : 'Disconnect'}
                                        </button>
                                    </div>
                                    
                                    {/* Additional Profile Details */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
                                        {freelancerData.rating !== undefined && freelancerData.rating !== null && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-700">Rating:</span>
                                                <div className="flex items-center gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <svg
                                                            key={i}
                                                            className={`w-4 h-4 ${i < Math.round(freelancerData.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                                                            fill="currentColor"
                                                            viewBox="0 0 20 20"
                                                        >
                                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                        </svg>
                                                    ))}
                                                    <span className="text-sm text-gray-600">({freelancerData.rating.toFixed(1)})</span>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {freelancerData.registrationDate && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">Member since: </span>
                                                <span className="text-sm text-gray-600">{freelancerData.registrationDate}</span>
                                            </div>
                                        )}
                                        
                                        {freelancerData.primaryCurrency && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">Currency: </span>
                                                <span className="text-sm text-gray-600">{freelancerData.primaryCurrency}</span>
                                            </div>
                                        )}
                                        
                                        {freelancerData.hourlyRate !== null && freelancerData.hourlyRate !== undefined && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">Hourly Rate: </span>
                                                <span className="text-sm text-gray-600">
                                                    ₹{freelancerData.hourlyRate}/hr
                                                </span>
                                            </div>
                                        )}
                                        
                                        {freelancerData.portfolioCount !== undefined && freelancerData.portfolioCount > 0 && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">Portfolio Items: </span>
                                                <span className="text-sm text-gray-600">{freelancerData.portfolioCount}</span>
                                            </div>
                                        )}
                                        
                                        {freelancerData.jobsCount !== null && freelancerData.jobsCount !== undefined && (
                                            <div>
                                                <span className="text-sm font-medium text-gray-700">Jobs: </span>
                                                <span className="text-sm text-gray-600">{freelancerData.jobsCount}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700">Status:</span>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                {freelancerData.emailVerified && (
                                                    <span className="px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-100 rounded">Email Verified</span>
                                                )}
                                                {freelancerData.paymentVerified && (
                                                    <span className="px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 rounded">Payment Verified</span>
                                                )}
                                                {freelancerData.profileComplete && (
                                                    <span className="px-2 py-1 text-xs font-semibold text-purple-700 bg-purple-100 rounded">Profile Complete</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Tagline and Profile Description */}
                                    {(freelancerData.tagline || freelancerData.profileDescription) && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            {freelancerData.tagline && (
                                                <p className="text-sm font-semibold text-gray-900 mb-2 italic">"{freelancerData.tagline}"</p>
                                            )}
                                            {freelancerData.profileDescription && (
                                                <p className="text-sm text-gray-700 leading-relaxed">{freelancerData.profileDescription}</p>
                                            )}
                                        </div>
                                    )}
                                    
                                    {freelancerData.profileLink && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <a
                                                href={freelancerData.profileLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                </svg>
                                                View Full Profile on Freelancer
                                            </a>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Freelancer Projects Section */}
                                <div className="bg-white border border-gray-200 rounded-xl p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                            <h4 className="text-lg font-semibold text-gray-900">Projects</h4>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {freelancerProjects.length > 0 && (
                                                <button
                                                    onClick={() => fetchFreelancerProjects()}
                                                    disabled={loadingFreelancerProjects}
                                                    className="px-3 py-1.5 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {loadingFreelancerProjects ? 'Refreshing...' : 'Refresh'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {loadingFreelancerProjects && freelancerProjects.length === 0 ? (
                                        <div className="flex items-center justify-center py-8">
                                            <svg className="animate-spin h-6 w-6 text-orange-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <span className="ml-2 text-sm text-gray-500">Loading projects...</span>
                                        </div>
                                    ) : freelancerProjectsError ? (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-800">{freelancerProjectsError}</p>
                                            <button
                                                onClick={() => fetchFreelancerProjects()}
                                                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
                                            >
                                                Try again
                                            </button>
                                        </div>
                                    ) : freelancerProjects.length === 0 ? (
                                        <div className="text-center py-8">
                                            <p className="text-sm text-gray-500 mb-3">No projects found.</p>
                                            <button
                                                onClick={() => fetchFreelancerProjects()}
                                                className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 border border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
                                            >
                                                Load Projects
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3 max-h-96 overflow-y-auto">
                                            {freelancerProjects.map((project) => {
                                                const projectUrl = project.seo_url || project.url || `https://www.freelancer.com/projects/${project.id}`;
                                                let budgetDisplay = 'Budget not specified';
                                                if (project.budget && typeof project.budget === 'object') {
                                                    const budget = project.budget as { minimum?: number; maximum?: number; currency?: { sign?: string } };
                                                    const sign = budget.currency?.sign || project.currency?.sign || '₹';
                                                    if (budget.minimum !== undefined) {
                                                        budgetDisplay = `${sign}${budget.minimum}${budget.maximum ? ` - ${budget.maximum}` : '+'}`;
                                                    }
                                                } else if (project.currency?.sign) {
                                                    budgetDisplay = `${project.currency.sign}N/A`;
                                                }
                                                
                                                return (
                                                    <div
                                                        key={project.id}
                                                        className="flex flex-col gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1 min-w-0">
                                                                <a
                                                                    href={projectUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-base font-semibold text-gray-900 hover:text-orange-600 transition-colors block mb-1"
                                                                >
                                                                    {project.title}
                                                                </a>
                                                                {project.description && (
                                                                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                                                                        {project.description.length > 150 
                                                                            ? `${project.description.substring(0, 150)}...` 
                                                                            : project.description}
                                                                    </p>
                                                                )}
                                                                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                                                    <span className="flex items-center gap-1">
                                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        {budgetDisplay}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                                                        </svg>
                                                                        {project.type || 'Project'}
                                                                    </span>
                                                                    <span className="flex items-center gap-1">
                                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                        </svg>
                                                                        {project.status}
                                                                    </span>
                                                                    {project.time_submitted && (
                                                                        <span>
                                                                            {new Date(project.time_submitted * 1000).toLocaleDateString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <a
                                                                href={projectUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="flex-shrink-0 p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="View on Freelancer"
                                                            >
                                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                </svg>
                                                            </a>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={connectFreelancer}
                                disabled={connectingFreelancer}
                                className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {connectingFreelancer ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Connecting...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Connect Freelancer
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                    
                    {isEditingProfile && (
                        <div className="flex items-center justify-end gap-3">
                            {saveError && (
                                <p className="text-sm text-red-600">{saveError}</p>
                            )}
                            {saveMessage && !saveError && (
                                <p className="text-sm text-green-600">{saveMessage}</p>
                            )}
                            <button
                                type="button"
                                onClick={() => {
                                    setIsEditingProfile(false);
                                    setSaveError(null);
                                    setSaveMessage(null);
                                }}
                                className="py-2.5 px-6 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleProfileSubmit()}
                                disabled={saving || uploading}
                                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold py-2.5 px-6 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    )}
                </div>
            </SectionCard>

            <SectionCard title="Notifications">
                <div className="space-y-4">
                    <ToggleSwitch label="Email Notifications" description="Get emails about new projects and offers." enabled={emailNotifications} setEnabled={setEmailNotifications} />
                    <ToggleSwitch label="Push Notifications" description="Receive push notifications on your device." enabled={pushNotifications} setEnabled={setPushNotifications} />
                </div>
            </SectionCard>

            {/* Premium & Credits Section */}
            <SectionCard title="Premium & Credits" description="Manage your premium subscription and credits.">
                <div className="space-y-6">
                    {/* Premium Status */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-xl">
                        <div className="flex items-center gap-3">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPremium ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gray-200'}`}>
                                {isPremium ? (
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01M12 2v.01M12 20v.01M3 12h.01M21 12h.01M4.207 4.207l.01.01M19.793 4.207l.01.01M4.207 19.793l.01.01M19.793 19.793l.01.01" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">
                                    {isPremium ? 'Premium Member' : 'Free Plan'}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {isPremium ? 'Unlimited projects & features' : 'Up to 5 projects'}
                                </p>
                            </div>
                        </div>
                        {!isPremium && (
                            <button
                                onClick={() => {
                                    navigateTo('home');
                                    setTimeout(() => {
                                        const pricingSection = document.getElementById('pricing');
                                        if (pricingSection) {
                                            pricingSection.scrollIntoView({ behavior: 'smooth' });
                                        }
                                    }, 100);
                                }}
                                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                            >
                                Upgrade to Premium
                            </button>
                        )}
                    </div>

                    {/* Credits Display */}
                    {isPremium && (
                        <div className="p-6 bg-white border-2 border-orange-200 rounded-xl">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 mb-1">Available Credits</h4>
                                    <p className="text-sm text-gray-500">Use credits to upload premium projects and access exclusive features</p>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-bold text-orange-600">{credits}</span>
                                        <span className="text-lg text-gray-500">credits</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                        </svg>
                                        <span className="text-sm font-semibold text-gray-700">Upload Project</span>
                                    </div>
                                    <p className="text-xs text-gray-500">10 credits per project</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-gray-700">Premium Badge</span>
                                    </div>
                                    <p className="text-xs text-gray-500">5 credits per project</p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span className="text-sm font-semibold text-gray-700">Featured Listing</span>
                                    </div>
                                    <p className="text-xs text-gray-500">20 credits per week</p>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        navigateTo('home');
                                        setTimeout(() => {
                                            const pricingSection = document.getElementById('pricing');
                                            if (pricingSection) {
                                                pricingSection.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }, 100);
                                    }}
                                    className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-md hover:shadow-lg"
                                >
                                    Buy More Credits
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </SectionCard>
            
            <SectionCard title="Danger Zone">
                <button className="bg-red-600 text-white font-semibold py-2 px-5 rounded-lg hover:bg-red-700 transition-colors">
                    Delete Account
                </button>
                <p className="text-sm text-gray-500 mt-2">Once you delete your account, there is no going back. Please be certain.</p>
            </SectionCard>

        </div>
    );
};

export default SettingsPage;