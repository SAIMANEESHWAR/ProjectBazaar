import React, { useState, useEffect } from 'react';
import {
    TrendingCareer,
    ProjectIdea,
    defaultTrendingCareers,
    defaultProjectIdeas,
} from '../CareerGuidancePage';

const API_ENDPOINT = 'https://kuxbswn0c9.execute-api.ap-south-2.amazonaws.com/default/Trendingcarrers_ProjectIdeas';

type CareerTab = 'trending' | 'projects';

type AIProvider = 'gemini' | 'groq';

interface APIKeyConfig {
    provider: AIProvider;
    geminiKey: string;
    groqKey: string;
}

const createEmptyCareer = (): TrendingCareer => ({
    title: '',
    avgSalary: '',
    growth: '',
    demand: 'High',
    skills: [],
    companies: [],
    description: '',
    links: [],
});

const createEmptyProject = (): ProjectIdea => ({
    title: '',
    difficulty: 'Intermediate',
    duration: '',
    technologies: [],
    description: '',
    features: [],
    githubLinks: [],
    demoLinks: [],
});

const CareerContentManagementPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<CareerTab>('trending');
    const [trendingCareers, setTrendingCareers] = useState<TrendingCareer[]>([]);
    const [projectIdeas, setProjectIdeas] = useState<ProjectIdea[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [editingCareerIndex, setEditingCareerIndex] = useState<number | null>(null);
    const [careerForm, setCareerForm] = useState<TrendingCareer>(createEmptyCareer());

    const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
    const [projectForm, setProjectForm] = useState<ProjectIdea>(createEmptyProject());

    // API Key Configuration
    const [apiKeyConfig, setApiKeyConfig] = useState<APIKeyConfig>({
        provider: 'gemini',
        geminiKey: '',
        groqKey: '',
    });
    const [isGeneratingCareer, setIsGeneratingCareer] = useState(false);
    const [isGeneratingProject, setIsGeneratingProject] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    // API Helper Functions
    const fetchData = async (section: 'trending' | 'projects') => {
        try {
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    section,
                    action: 'list',
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch ${section}`);
            }

            const data = await response.json();
            if (data.success && data.items) {
                return data.items;
            }
            return [];
        } catch (err) {
            console.error(`Error fetching ${section}:`, err);
            return section === 'trending' ? defaultTrendingCareers : defaultProjectIdeas;
        }
    };

    const saveData = async (section: 'trending' | 'projects', items: TrendingCareer[] | ProjectIdea[]) => {
        try {
            setSaving(true);
            setError(null);

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    section,
                    action: 'put',
                    items: items.map((item: any) => {
                        // Remove id if it's a new item (empty string or undefined)
                        const { id, ...rest } = item;
                        if (!id || id === '') {
                            return rest;
                        }
                        return item;
                    }),
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to save ${section}`);
            }

            const data = await response.json();
            if (data.success && data.items) {
                return data.items;
            }
            throw new Error('Invalid response from server');
        } catch (err: any) {
            console.error(`Error saving ${section}:`, err);
            setError(err.message || `Failed to save ${section}. Please try again.`);
            throw err;
        } finally {
            setSaving(false);
        }
    };

    const deleteItem = async (section: 'trending' | 'projects', id: string) => {
        try {
            setSaving(true);
            setError(null);

            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    section,
                    action: 'delete',
                    id,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to delete item`);
            }

            const data = await response.json();
            return data.success;
        } catch (err: any) {
            console.error(`Error deleting item:`, err);
            setError(err.message || 'Failed to delete item. Please try again.');
            throw err;
        } finally {
            setSaving(false);
        }
    };

    // Load API key configuration on mount
    useEffect(() => {
        const loadApiKeyConfig = async () => {
            try {
                const storedConfig = localStorage.getItem('ai_api_config');
                if (storedConfig) {
                    const config = JSON.parse(storedConfig);
                    setApiKeyConfig(config);
                }
            } catch (error) {
                console.error('Failed to load API key config:', error);
            }
        };
        loadApiKeyConfig();
    }, []);

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const [careers, projects] = await Promise.all([
                    fetchData('trending'),
                    fetchData('projects'),
                ]);
                setTrendingCareers(careers as TrendingCareer[]);
                setProjectIdeas(projects as ProjectIdea[]);
            } catch (err) {
                setError('Failed to load data. Using default values.');
                setTrendingCareers(defaultTrendingCareers);
                setProjectIdeas(defaultProjectIdeas);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleCareerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalized: TrendingCareer = {
            ...careerForm,
            skills: (careerForm.skills || []).map((s) => s.trim()).filter(Boolean),
            companies: (careerForm.companies || []).map((c) => c.trim()).filter(Boolean),
            links: (careerForm.links || []).map((l) => l.trim()).filter(Boolean),
        };

        let next = [...trendingCareers];
        if (editingCareerIndex != null) {
            // Preserve the id if editing
            const existingId = (trendingCareers[editingCareerIndex] as any).id;
            next[editingCareerIndex] = { ...normalized, ...(existingId ? { id: existingId } : {}) } as any;
        } else {
            next.push(normalized);
        }

        try {
            const savedItems = await saveData('trending', next);
            setTrendingCareers(savedItems as TrendingCareer[]);
            setCareerForm(createEmptyCareer());
            setEditingCareerIndex(null);
        } catch (err) {
            // Error already handled in saveData
        }
    };

    const handleProjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalized: ProjectIdea = {
            ...projectForm,
            technologies: (projectForm.technologies || []).map((t) => t.trim()).filter(Boolean),
            features: (projectForm.features || []).map((f) => f.trim()).filter(Boolean),
            githubLinks: (projectForm.githubLinks || []).map((l) => l.trim()).filter(Boolean),
            demoLinks: (projectForm.demoLinks || []).map((l) => l.trim()).filter(Boolean),
        };

        let next = [...projectIdeas];
        if (editingProjectIndex != null) {
            // Preserve the id if editing
            const existingId = (projectIdeas[editingProjectIndex] as any).id;
            next[editingProjectIndex] = { ...normalized, ...(existingId ? { id: existingId } : {}) } as any;
        } else {
            next.push(normalized);
        }

        try {
            const savedItems = await saveData('projects', next);
            setProjectIdeas(savedItems as ProjectIdea[]);
            setProjectForm(createEmptyProject());
            setEditingProjectIndex(null);
        } catch (err) {
            // Error already handled in saveData
        }
    };

    const handleCareerEdit = (index: number) => {
        const item = trendingCareers[index];
        setCareerForm({ ...item });
        setEditingCareerIndex(index);
    };

    const handleProjectEdit = (index: number) => {
        const item = projectIdeas[index];
        setProjectForm({ ...item });
        setEditingProjectIndex(index);
    };

    const handleCareerDelete = async (index: number) => {
        const item = trendingCareers[index];
        const itemId = (item as any).id;

        if (!itemId) {
            // If no id, just remove from local state (fallback)
            const next = trendingCareers.filter((_, i) => i !== index);
            setTrendingCareers(next);
            try {
                await saveData('trending', next);
            } catch (err) {
                // Error handled
            }
        } else {
            // Delete via API
            try {
                await deleteItem('trending', itemId);
                // Reload data to get updated list
                const updated = await fetchData('trending');
                setTrendingCareers(updated as TrendingCareer[]);
            } catch (err) {
                // Error already handled
                return;
            }
        }

        if (editingCareerIndex === index) {
            setEditingCareerIndex(null);
            setCareerForm(createEmptyCareer());
        }
    };

    const handleProjectDelete = async (index: number) => {
        const item = projectIdeas[index];
        const itemId = (item as any).id;

        if (!itemId) {
            // If no id, just remove from local state (fallback)
            const next = projectIdeas.filter((_, i) => i !== index);
            setProjectIdeas(next);
            try {
                await saveData('projects', next);
            } catch (err) {
                // Error handled
            }
        } else {
            // Delete via API
            try {
                await deleteItem('projects', itemId);
                // Reload data to get updated list
                const updated = await fetchData('projects');
                setProjectIdeas(updated as ProjectIdea[]);
            } catch (err) {
                // Error already handled
                return;
            }
        }

        if (editingProjectIndex === index) {
            setEditingProjectIndex(null);
            setProjectForm(createEmptyProject());
        }
    };

    const aiSuggestCareerDescription = () => {
        if (!careerForm.title) return;
        const base = careerForm.title;
        const skills = (careerForm.skills || []).join(', ');
        const companies = (careerForm.companies || []).join(', ');
        const description =
            `As a ${base}, you will work on real-world problems using modern technologies. ` +
            (skills ? `Key skills include ${skills}. ` : '') +
            (companies ? `Top companies hiring for this role include ${companies}. ` : '') +
            'This role offers strong growth, impact, and opportunities to build an excellent portfolio.';
        setCareerForm((prev) => ({ ...prev, description }));
    };

    const aiSuggestProjectDescription = () => {
        if (!projectForm.title) return;
        const tech = (projectForm.technologies || []).join(', ');
        const difficulty = projectForm.difficulty || 'Intermediate';
        const description =
            `${projectForm.title} is a ${difficulty.toLowerCase()}-level project that helps you practice practical, end-to-end development skills. ` +
            (tech ? `You will primarily use technologies like ${tech}. ` : '') +
            'This project can be showcased in your resume and portfolio to demonstrate your hands-on experience.';
        const features =
            projectForm.features && projectForm.features.length
                ? projectForm.features
                : ['User-friendly UI', 'Responsive design', 'Error handling & validation', 'Documentation & README'];
        setProjectForm((prev) => ({ ...prev, description, features }));
    };

    // Generate Trending Career with AI
    const generateCareerWithAI = async () => {
        setIsGeneratingCareer(true);
        setAiError(null);

        const activeKey = apiKeyConfig.provider === 'gemini' ? apiKeyConfig.geminiKey : apiKeyConfig.groqKey;
        if (!activeKey) {
            setAiError(`Please configure your ${apiKeyConfig.provider === 'gemini' ? 'Gemini' : 'Groq'} API key in Coding Questions settings.`);
            setIsGeneratingCareer(false);
            return;
        }

        const prompt = `Generate a trending career profile in JSON format with the following structure:
{
  "title": "Career title (e.g., AI/ML Engineer, Full Stack Developer)",
  "avgSalary": "Salary range (e.g., ₹8-25 LPA)",
  "growth": "Growth percentage (e.g., +40%)",
  "demand": "Very High" | "High" | "Medium",
  "skills": ["Skill 1", "Skill 2", "Skill 3", "Skill 4", "Skill 5"],
  "companies": ["Company 1", "Company 2", "Company 3", "Company 4"],
  "description": "A comprehensive 2-3 sentence description of this career, what they do, and why it's trending",
  "links": ["https://roadmap.sh/...", "https://..."]
}

Generate a realistic, trending tech career profile. Include relevant skills, top companies hiring for this role, and helpful roadmap/learning resource links.
Return ONLY the JSON object, no additional text or markdown.`;

        try {
            let response;
            
            if (apiKeyConfig.provider === 'gemini') {
                response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeyConfig.geminiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.8,
                                topK: 40,
                                topP: 0.95,
                                maxOutputTokens: 2048,
                            }
                        })
                    }
                );
            } else {
                response = await fetch(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKeyConfig.groqKey}`,
                        },
                        body: JSON.stringify({
                            model: 'llama-3.3-70b-versatile',
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are a career guidance assistant. Generate career profiles in valid JSON format only, no additional text or markdown.'
                                },
                                {
                                    role: 'user',
                                    content: prompt
                                }
                            ],
                            temperature: 0.8,
                            max_tokens: 2048,
                        })
                    }
                );
            }

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait 1-2 minutes and try again.');
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
            }

            const data = await response.json();
            
            // Extract text based on provider
            let generatedText;
            if (apiKeyConfig.provider === 'gemini') {
                generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            } else {
                generatedText = data.choices?.[0]?.message?.content || '';
            }

            // Parse JSON from response (may have markdown code blocks)
            let jsonText = generatedText.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const generated = JSON.parse(jsonText);

            // Fill the form with generated data
            setCareerForm({
                title: generated.title || '',
                avgSalary: generated.avgSalary || '',
                growth: generated.growth || '',
                demand: generated.demand || 'High',
                skills: Array.isArray(generated.skills) ? generated.skills : [],
                companies: Array.isArray(generated.companies) ? generated.companies : [],
                description: generated.description || '',
                links: Array.isArray(generated.links) ? generated.links : [],
            });

        } catch (err: any) {
            console.error('AI generation error:', err);
            setAiError(err.message || 'Failed to generate career data. Please try again.');
        } finally {
            setIsGeneratingCareer(false);
        }
    };

    // Generate Project Idea with AI
    const generateProjectWithAI = async () => {
        setIsGeneratingProject(true);
        setAiError(null);

        const activeKey = apiKeyConfig.provider === 'gemini' ? apiKeyConfig.geminiKey : apiKeyConfig.groqKey;
        if (!activeKey) {
            setAiError(`Please configure your ${apiKeyConfig.provider === 'gemini' ? 'Gemini' : 'Groq'} API key in Coding Questions settings.`);
            setIsGeneratingProject(false);
            return;
        }

        const prompt = `Generate a project idea in JSON format with the following structure:
{
  "title": "Project title (e.g., AI-Powered Resume Analyzer, Real-time Collaborative Code Editor)",
  "difficulty": "Beginner" | "Intermediate" | "Advanced",
  "duration": "Duration estimate (e.g., 4-6 weeks, 2-3 months)",
  "technologies": ["Technology 1", "Technology 2", "Technology 3", "Technology 4"],
  "description": "A comprehensive 2-3 sentence description of what this project does and why it's valuable",
  "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4"],
  "githubLinks": ["https://github.com/example/similar-project"],
  "demoLinks": ["https://demo.example.com"]
}

Generate a realistic, practical project idea that students can build. Include relevant technologies, key features, and example GitHub/demo links.
Return ONLY the JSON object, no additional text or markdown.`;

        try {
            let response;
            
            if (apiKeyConfig.provider === 'gemini') {
                response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKeyConfig.geminiKey}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: prompt }] }],
                            generationConfig: {
                                temperature: 0.8,
                                topK: 40,
                                topP: 0.95,
                                maxOutputTokens: 2048,
                            }
                        })
                    }
                );
            } else {
                response = await fetch(
                    'https://api.groq.com/openai/v1/chat/completions',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${apiKeyConfig.groqKey}`,
                        },
                        body: JSON.stringify({
                            model: 'llama-3.3-70b-versatile',
                            messages: [
                                {
                                    role: 'system',
                                    content: 'You are a project idea generator. Generate project ideas in valid JSON format only, no additional text or markdown.'
                                },
                                {
                                    role: 'user',
                                    content: prompt
                                }
                            ],
                            temperature: 0.8,
                            max_tokens: 2048,
                        })
                    }
                );
            }

            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please wait 1-2 minutes and try again.');
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`API request failed: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
            }

            const data = await response.json();
            
            // Extract text based on provider
            let generatedText;
            if (apiKeyConfig.provider === 'gemini') {
                generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
            } else {
                generatedText = data.choices?.[0]?.message?.content || '';
            }

            // Parse JSON from response (may have markdown code blocks)
            let jsonText = generatedText.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const generated = JSON.parse(jsonText);

            // Fill the form with generated data
            setProjectForm({
                title: generated.title || '',
                difficulty: generated.difficulty || 'Intermediate',
                duration: generated.duration || '',
                technologies: Array.isArray(generated.technologies) ? generated.technologies : [],
                description: generated.description || '',
                features: Array.isArray(generated.features) ? generated.features : [],
                githubLinks: Array.isArray(generated.githubLinks) ? generated.githubLinks : [],
                demoLinks: Array.isArray(generated.demoLinks) ? generated.demoLinks : [],
            });

        } catch (err: any) {
            console.error('AI generation error:', err);
            setAiError(err.message || 'Failed to generate project data. Please try again.');
        } finally {
            setIsGeneratingProject(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-sm text-gray-600">Loading career content...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Error Message */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    <div className="flex items-center justify-between">
                        <span>{error}</span>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-500 hover:text-red-700 font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* AI Error Message */}
            {aiError && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-sm">
                    <div className="flex items-center justify-between">
                        <span>{aiError}</span>
                        <button
                            onClick={() => setAiError(null)}
                            className="text-yellow-500 hover:text-yellow-700 font-bold"
                        >
                            ×
                        </button>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {saving && (
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg text-sm">
                    Saving changes...
                </div>
            )}

            {/* Tabs for sections */}
            <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setActiveTab('trending')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                        activeTab === 'trending'
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    Trending Careers
                </button>
                <button
                    onClick={() => setActiveTab('projects')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                        activeTab === 'projects'
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                    Project Ideas
                </button>
            </div>

            {activeTab === 'trending' && (
                <div className="grid lg:grid-cols-[2fr,3fr] gap-6">
                    {/* Form */}
                    <form onSubmit={handleCareerSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {editingCareerIndex != null ? 'Edit Trending Career' : 'Add Trending Career'}
                            </h2>
                            <button
                                type="button"
                                onClick={generateCareerWithAI}
                                disabled={isGeneratingCareer || (!apiKeyConfig.geminiKey && !apiKeyConfig.groqKey)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                {isGeneratingCareer ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span>
                                        Generate with AI
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={careerForm.title}
                                    onChange={(e) => setCareerForm({ ...careerForm, title: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="e.g., AI/ML Engineer"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Average Salary</label>
                                    <input
                                        type="text"
                                        value={careerForm.avgSalary}
                                        onChange={(e) => setCareerForm({ ...careerForm, avgSalary: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="₹8-25 LPA"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Growth %</label>
                                    <input
                                        type="text"
                                        value={careerForm.growth}
                                        onChange={(e) => setCareerForm({ ...careerForm, growth: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="+35%"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Demand</label>
                                    <select
                                        value={careerForm.demand}
                                        onChange={(e) =>
                                            setCareerForm({ ...careerForm, demand: e.target.value as TrendingCareer['demand'] })
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="Very High">Very High</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Skills (comma separated)</label>
                                <input
                                    type="text"
                                    value={careerForm.skills.join(', ')}
                                    onChange={(e) =>
                                        setCareerForm({
                                            ...careerForm,
                                            skills: e.target.value.split(',').map((s) => s.trim()),
                                        })
                                    }
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Python, Machine Learning, TensorFlow"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Top Companies (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={careerForm.companies.join(', ')}
                                    onChange={(e) =>
                                        setCareerForm({
                                            ...careerForm,
                                            companies: e.target.value.split(',').map((c) => c.trim()),
                                        })
                                    }
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Google, Microsoft, Amazon"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-semibold text-gray-600">Description</label>
                                    <button
                                        type="button"
                                        onClick={aiSuggestCareerDescription}
                                        className="text-xs font-medium text-orange-600 hover:text-orange-700"
                                    >
                                        ⚡ Generate text with AI
                                    </button>
                                </div>
                                <textarea
                                    value={careerForm.description}
                                    onChange={(e) => setCareerForm({ ...careerForm, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Short summary that appears under the career title..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Roadmap Links (comma separated URLs)
                                </label>
                                <input
                                    type="text"
                                    value={(careerForm.links || []).join(', ')}
                                    onChange={(e) =>
                                        setCareerForm({
                                            ...careerForm,
                                            links: e.target.value.split(',').map((l) => l.trim()),
                                        })
                                    }
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="https://..., https://..."
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setCareerForm(createEmptyCareer());
                                    setEditingCareerIndex(null);
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 text-sm font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : editingCareerIndex != null ? 'Save Changes' : 'Add Career'}
                            </button>
                        </div>
                    </form>

                    {/* Existing items */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-gray-900">Live in Career Guidance dashboard</h2>
                            <span className="text-xs text-gray-500">
                                {trendingCareers.length} career{trendingCareers.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="space-y-3 max-h-[520px] overflow-y-auto">
                            {trendingCareers.map((career, index) => (
                                <div
                                    key={career.title + index}
                                    className="border border-gray-200 rounded-lg px-3 py-2.5 flex items-start justify-between gap-3"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-gray-900">{career.title}</p>
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                {career.demand} demand
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{career.description}</p>
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            {career.avgSalary} · {career.growth} growth
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleCareerEdit(index)}
                                            className="text-xs text-orange-600 hover:text-orange-700"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCareerDelete(index)}
                                            className="text-xs text-red-500 hover:text-red-600"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {trendingCareers.length === 0 && (
                                <p className="text-xs text-gray-500 text-center py-6">
                                    No careers configured yet. Add your first trending career using the form.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'projects' && (
                <div className="grid lg:grid-cols-[2fr,3fr] gap-6">
                    {/* Form */}
                    <form onSubmit={handleProjectSubmit} className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
                        <div className="flex items-center justify-between mb-1">
                            <h2 className="text-lg font-semibold text-gray-900">
                                {editingProjectIndex != null ? 'Edit Project Idea' : 'Add Project Idea'}
                            </h2>
                            <button
                                type="button"
                                onClick={generateProjectWithAI}
                                disabled={isGeneratingProject || (!apiKeyConfig.geminiKey && !apiKeyConfig.groqKey)}
                                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                {isGeneratingProject ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span>
                                        Generate with AI
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={projectForm.title}
                                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="e.g., AI-Powered Resume Analyzer"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Difficulty</label>
                                    <select
                                        value={projectForm.difficulty}
                                        onChange={(e) =>
                                            setProjectForm({
                                                ...projectForm,
                                                difficulty: e.target.value as ProjectIdea['difficulty'],
                                            })
                                        }
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    >
                                        <option value="Beginner">Beginner</option>
                                        <option value="Intermediate">Intermediate</option>
                                        <option value="Advanced">Advanced</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Duration</label>
                                    <input
                                        type="text"
                                        value={projectForm.duration}
                                        onChange={(e) => setProjectForm({ ...projectForm, duration: e.target.value })}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        placeholder="4-6 weeks"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Technologies (comma separated)
                                </label>
                                <input
                                    type="text"
                                    value={projectForm.technologies.join(', ')}
                                    onChange={(e) =>
                                        setProjectForm({
                                            ...projectForm,
                                            technologies: e.target.value.split(',').map((t) => t.trim()),
                                        })
                                    }
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="React, Node.js, MongoDB"
                                />
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs font-semibold text-gray-600">Description & Features</label>
                                    <button
                                        type="button"
                                        onClick={aiSuggestProjectDescription}
                                        className="text-xs font-medium text-orange-600 hover:text-orange-700"
                                    >
                                        ⚡ Generate text with AI
                                    </button>
                                </div>
                                <textarea
                                    value={projectForm.description}
                                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                                    rows={4}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-2"
                                    placeholder="Short explanation of the project idea..."
                                />
                                <input
                                    type="text"
                                    value={projectForm.features.join(', ')}
                                    onChange={(e) =>
                                        setProjectForm({
                                            ...projectForm,
                                            features: e.target.value.split(',').map((f) => f.trim()),
                                        })
                                    }
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Key features (comma separated)"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Helpful GitHub Links (comma separated URLs)
                                </label>
                                <input
                                    type="text"
                                    value={(projectForm.githubLinks || []).join(', ')}
                                    onChange={(e) =>
                                        setProjectForm({
                                            ...projectForm,
                                            githubLinks: e.target.value.split(',').map((l) => l.trim()),
                                        })
                                    }
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="https://github.com/..., https://github.com/..."
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">
                                    Demo Links (comma separated URLs)
                                </label>
                                <input
                                    type="text"
                                    value={(projectForm.demoLinks || []).join(', ')}
                                    onChange={(e) =>
                                        setProjectForm({
                                            ...projectForm,
                                            demoLinks: e.target.value.split(',').map((l) => l.trim()),
                                        })
                                    }
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="https://demo.example.com, https://live.example.com..."
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setProjectForm(createEmptyProject());
                                    setEditingProjectIndex(null);
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                Reset
                            </button>
                            <button
                                type="submit"
                                disabled={saving}
                                className="px-4 py-2 text-sm font-semibold rounded-lg bg-orange-500 text-white hover:bg-orange-600 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : editingProjectIndex != null ? 'Save Changes' : 'Add Project Idea'}
                            </button>
                        </div>
                    </form>

                    {/* Existing items */}
                    <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-sm font-semibold text-gray-900">Live in Career Guidance dashboard</h2>
                            <span className="text-xs text-gray-500">
                                {projectIdeas.length} idea{projectIdeas.length !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <div className="space-y-3 max-h-[520px] overflow-y-auto">
                            {projectIdeas.map((project, index) => (
                                <div
                                    key={project.title + index}
                                    className="border border-gray-200 rounded-lg px-3 py-2.5 flex items-start justify-between gap-3"
                                >
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold text-gray-900">{project.title}</p>
                                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                                {project.difficulty}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{project.description}</p>
                                        <p className="text-[11px] text-gray-500 mt-1">{project.duration}</p>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <button
                                            type="button"
                                            onClick={() => handleProjectEdit(index)}
                                            className="text-xs text-orange-600 hover:text-orange-700"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleProjectDelete(index)}
                                            className="text-xs text-red-500 hover:text-red-600"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {projectIdeas.length === 0 && (
                                <p className="text-xs text-gray-500 text-center py-6">
                                    No project ideas configured yet. Add your first idea using the form.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CareerContentManagementPage;


