import React, { useState, useEffect, useRef } from 'react';
import { useAuth, useNavigation, usePremium } from '../App';

const UPDATE_SETTINGS_ENDPOINT = 'https://ydcdsqspm3.execute-api.ap-south-2.amazonaws.com/default/Update_userdetails_in_settings';
const GET_USER_ENDPOINT = 'https://6omszxa58g.execute-api.ap-south-2.amazonaws.com/default/Get_user_Details_by_his_Id';
const GITHUB_OAUTH_CALLBACK = 'https://ksngma8ixd.execute-api.ap-south-2.amazonaws.com/default/Github_OAuth_Callback';
const GITHUB_CLIENT_ID = 'Ov23liWkZ6bJwdgaeJta';

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
    } | null>(null);
    const [connectingGithub, setConnectingGithub] = useState(false);
    const githubCallbackProcessed = useRef(false);

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
                        setGithubData(user.githubData);
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
                        setGithubData(decodedData.github);
                        setGithubUrl(decodedData.github.profileUrl || '');
                        
                        // Save GitHub data to user profile
                        const saveResponse = await fetch(UPDATE_SETTINGS_ENDPOINT, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                action: 'updateSettings',
                                userId,
                                githubUrl: decodedData.github.profileUrl,
                                githubData: decodedData.github,
                            }),
                        });
                        
                        const saveData = await saveResponse.json();
                        if (saveData.success) {
                            setSaveMessage('GitHub account connected successfully!');
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