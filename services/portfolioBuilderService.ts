/**
 * Portfolio Builder v2 API client.
 */

/** Read a File as base64 (no data URL prefix). */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result;
      if (typeof r !== 'string') {
        reject(new Error('Could not read file'));
        return;
      }
      const comma = r.indexOf(',');
      resolve(comma >= 0 ? r.slice(comma + 1) : r);
    };
    reader.onerror = () => reject(reader.error || new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

const PORTFOLIO_BUILDER_DIRECT =
  (import.meta.env?.VITE_PORTFOLIO_BUILDER_ENDPOINT as string) ||
  'https://e2ptkiquz2.execute-api.ap-south-2.amazonaws.com/default/portfolio-builder';

/** Lambda returns CORS * — use direct URL in dev too (avoids broken Vite proxy). */
export const PORTFOLIO_BUILDER_ENDPOINT = PORTFOLIO_BUILDER_DIRECT;

export interface PortfolioTemplate {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  previewColor: string;
  thumbnail: string;
  inspiration?: string;
  previewHtml: string;
}

export interface PortfolioPersonal {
  name?: string;
  title?: string;
  tagline?: string;
  email?: string;
  phone?: string;
  location?: string;
  bio?: string;
}

export interface PortfolioData {
  personal?: PortfolioPersonal;
  about?: { headline?: string; description?: string; highlights?: string[] };
  skills?: Record<string, Array<{ name: string; level?: number } | string>>;
  experience?: Array<{
    company?: string;
    title?: string;
    period?: string;
    description?: string;
    highlights?: string[];
  }>;
  education?: Array<{ institution?: string; degree?: string; year?: string }>;
  projects?: Array<{
    name?: string;
    description?: string;
    technologies?: string[];
    url?: string;
    github?: string;
  }>;
  certifications?: Array<{ name?: string; issuer?: string; year?: string }>;
  links?: { github?: string; linkedin?: string; twitter?: string; website?: string; email?: string };
}

export interface PortfolioHistoryItem {
  portfolioId: string;
  userId: string;
  name: string;
  title: string;
  templateId: string;
  liveUrl: string;
  fileName: string;
  createdAt: string;
  summary?: {
    skillCount: number;
    experienceCount: number;
    projectCount: number;
    educationCount: number;
  };
}

async function postPortfolio<T>(body: Record<string, unknown>): Promise<T> {
  let res: Response;
  try {
    res = await fetch(PORTFOLIO_BUILDER_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error(
      'Cannot reach portfolio API. Check your internet or API Gateway URL in Settings / .env.local'
    );
  }

  let data: { success?: boolean; error?: string };
  try {
    data = await res.json();
  } catch {
    throw new Error(`Portfolio API returned invalid response (HTTP ${res.status})`);
  }

  if (!data.success) {
    throw new Error(data.error || `Portfolio API request failed (HTTP ${res.status})`);
  }
  return data as T;
}

export async function getPortfolioTemplates(): Promise<PortfolioTemplate[]> {
  const data = await postPortfolio<{ templates: PortfolioTemplate[] }>({ action: 'getTemplates' });
  return data.templates;
}

export async function generateFromResume(params: {
  userId: string;
  userEmail?: string;
  templateId: string;
  file: File;
}): Promise<{ portfolioData: PortfolioData; extractedText: string; provider: string }> {
  const fileContent = await fileToBase64(params.file);
  return postPortfolio({
    action: 'generateFromResume',
    userId: params.userId,
    userEmail: params.userEmail || '',
    templateId: params.templateId,
    fileName: params.file.name,
    fileType: params.file.type || 'application/pdf',
    fileContent,
  });
}

export async function previewPortfolio(
  templateId: string,
  portfolioData: PortfolioData
): Promise<string> {
  const data = await postPortfolio<{ html: string }>({
    action: 'previewPortfolio',
    templateId,
    portfolioData,
  });
  return data.html;
}

export async function deployPortfolio(params: {
  userId: string;
  userEmail?: string;
  templateId: string;
  portfolioData: PortfolioData;
  fileName?: string;
}): Promise<{ portfolioId: string; liveUrl: string; previewUrl: string }> {
  return postPortfolio({
    action: 'deployPortfolio',
    userId: params.userId,
    userEmail: params.userEmail || '',
    templateId: params.templateId,
    portfolioData: params.portfolioData,
    fileName: params.fileName || 'resume.pdf',
  });
}

export async function getPortfolioHistory(userId: string): Promise<PortfolioHistoryItem[]> {
  const data = await postPortfolio<{ history: PortfolioHistoryItem[] }>({
    action: 'getPortfolioHistory',
    userId,
  });
  return data.history;
}

export async function deletePortfolio(userId: string, portfolioId: string): Promise<void> {
  await postPortfolio({ action: 'deletePortfolio', userId, portfolioId });
}

export const PORTFOLIO_TEMPLATE_INFO: Record<string, { name: string; thumbnail: string; color: string }> = {
  editorial: { name: 'Editorial', thumbnail: '🅴', color: '#0c0c0c' },
  aurora: { name: 'Aurora', thumbnail: '🌌', color: '#8b5cf6' },
  slate: { name: 'Slate', thumbnail: '📐', color: '#1e293b' },
  momentum: { name: 'Momentum', thumbnail: '⚡', color: '#f97316' },
  minimal: { name: 'Minimal', thumbnail: '📄', color: '#f97316' },
  modern: { name: 'Modern Dark', thumbnail: '🌙', color: '#ea580c' },
  professional: { name: 'Professional', thumbnail: '💼', color: '#fb923c' },
  creative: { name: 'Creative', thumbnail: '🎨', color: '#f59e0b' },
  developer: { name: 'Developer', thumbnail: '💻', color: '#d97706' },
  elegant: { name: 'Elegant', thumbnail: '✨', color: '#fbbf24' },
};
