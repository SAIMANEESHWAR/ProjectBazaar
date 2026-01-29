// AI Resume Service - Uses OpenAI/Gemini for content generation
// For demo purposes, includes fallback mock responses

type ViteEnv = { VITE_AI_API_ENDPOINT?: string; VITE_OPENAI_API_KEY?: string; VITE_GEMINI_API_KEY?: string };
const getEnv = (): ViteEnv => {
  try {
    return (import.meta.env ?? {}) as ViteEnv;
  } catch {
    return {};
  }
};
const env = getEnv();
const AI_API_ENDPOINT = env.VITE_AI_API_ENDPOINT ?? '';
const AI_API_KEY = env.VITE_OPENAI_API_KEY ?? env.VITE_GEMINI_API_KEY ?? '';

interface SummaryResponse {
  summary: string;
  experience_level: string;
}

interface ExperienceBulletPoints {
  bullets: string[];
}

// Fallback prompts for different experience levels
const SUMMARY_TEMPLATES = {
  fresher: (jobTitle: string) => [
    `Enthusiastic ${jobTitle} with strong foundational knowledge and passion for learning. Quick learner with excellent problem-solving abilities and eagerness to contribute to team success. Committed to continuous improvement and staying current with industry best practices.`,
    `Recent graduate aspiring to become a proficient ${jobTitle}. Equipped with strong theoretical knowledge and hands-on project experience. Eager to apply academic skills in a professional environment while growing and developing new competencies.`,
    `Motivated entry-level ${jobTitle} with a solid educational background and relevant project experience. Strong analytical and communication skills combined with a collaborative mindset. Ready to bring fresh perspectives and enthusiasm to a dynamic team.`,
  ],
  mid: (jobTitle: string) => [
    `Results-driven ${jobTitle} with 3-5 years of professional experience delivering high-quality solutions. Proven track record in designing, developing, and maintaining complex systems. Strong collaborator with excellent communication skills and ability to mentor junior team members.`,
    `Experienced ${jobTitle} combining technical expertise with business acumen. Skilled in multiple technologies and frameworks with a focus on scalable, maintainable solutions. Track record of successfully delivering projects on time and exceeding expectations.`,
    `Dynamic ${jobTitle} with extensive hands-on experience in agile environments. Expert in translating business requirements into technical solutions. Known for innovative problem-solving and ability to optimize processes for improved efficiency.`,
  ],
  senior: (jobTitle: string) => [
    `Senior ${jobTitle} with 7+ years of experience leading technical initiatives and driving innovation. Expert in architecting enterprise-level solutions and mentoring development teams. Strategic thinker with proven ability to align technical decisions with business objectives.`,
    `Accomplished ${jobTitle} with extensive experience in system design and team leadership. Track record of delivering mission-critical projects and transforming technical organizations. Expert in modern development practices and emerging technologies.`,
    `Visionary ${jobTitle} combining deep technical expertise with strong leadership capabilities. Proven success in building high-performing teams and delivering complex, scalable solutions. Passionate about innovation and driving continuous improvement across organizations.`,
  ],
};

const EXPERIENCE_BULLET_TEMPLATES: Record<string, string[]> = {
  'software developer': [
    'Developed and maintained web applications using modern frameworks, resulting in 40% improvement in page load times',
    'Collaborated with cross-functional teams to deliver features on schedule, consistently meeting sprint goals',
    'Implemented RESTful APIs and microservices architecture, improving system scalability',
    'Conducted code reviews and mentored junior developers, improving team code quality by 30%',
    'Optimized database queries and implemented caching strategies, reducing response times by 50%',
    'Led migration of legacy systems to cloud infrastructure, reducing operational costs by 25%',
  ],
  'frontend developer': [
    'Built responsive and accessible user interfaces using React, TypeScript, and modern CSS frameworks',
    'Improved Core Web Vitals scores by 40% through performance optimization techniques',
    'Implemented state management solutions using Redux/Zustand for complex application workflows',
    'Collaborated with UX designers to translate wireframes into pixel-perfect, interactive components',
    'Developed reusable component library that reduced development time by 35% across teams',
    'Integrated third-party APIs and implemented real-time features using WebSockets',
  ],
  'backend developer': [
    'Designed and implemented scalable microservices handling millions of requests daily',
    'Built secure authentication and authorization systems using OAuth 2.0 and JWT',
    'Optimized database performance through indexing, query optimization, and connection pooling',
    'Developed automated testing pipelines achieving 90%+ code coverage',
    'Implemented event-driven architecture using message queues for asynchronous processing',
    'Created comprehensive API documentation and maintained OpenAPI specifications',
  ],
  'full stack developer': [
    'Developed end-to-end features from database design to frontend implementation',
    'Built and deployed containerized applications using Docker and Kubernetes',
    'Implemented CI/CD pipelines reducing deployment time from hours to minutes',
    'Designed database schemas and optimized queries for high-traffic applications',
    'Created responsive single-page applications with modern JavaScript frameworks',
    'Integrated payment gateways, analytics, and third-party services into platform',
  ],
  'data scientist': [
    'Developed machine learning models achieving 95% accuracy in predictive analytics',
    'Built data pipelines processing terabytes of data using Apache Spark and Python',
    'Created interactive dashboards and visualizations for stakeholder reporting',
    'Implemented A/B testing frameworks to optimize product features and user experience',
    'Applied NLP techniques to extract insights from unstructured text data',
    'Collaborated with engineering teams to deploy models into production environments',
  ],
  'product manager': [
    'Led product roadmap development and prioritization for B2B SaaS platform',
    'Conducted user research and competitive analysis to identify market opportunities',
    'Collaborated with engineering and design teams to deliver features used by 100K+ users',
    'Defined and tracked KPIs, achieving 40% improvement in user retention',
    'Managed stakeholder communication and presented quarterly product updates to executives',
    'Implemented agile methodologies reducing time-to-market by 30%',
  ],
  default: [
    'Delivered high-quality work consistently meeting deadlines and exceeding expectations',
    'Collaborated effectively with cross-functional teams to achieve project objectives',
    'Identified and implemented process improvements resulting in increased efficiency',
    'Demonstrated strong problem-solving skills in complex and ambiguous situations',
    'Communicated effectively with stakeholders at all levels of the organization',
    'Contributed to team knowledge sharing and documentation efforts',
  ],
};

// Generate AI-powered summary suggestions
export async function generateSummarySuggestions(jobTitle: string): Promise<SummaryResponse[]> {
  // Try to use real AI if configured
  if (AI_API_KEY && AI_API_ENDPOINT) {
    try {
      const response = await fetch(AI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional resume writer. Generate professional summaries.',
            },
            {
              role: 'user',
              content: `Generate 3 professional resume summaries for a ${jobTitle} position. Each summary should be 3-4 sentences. Return as JSON array with objects containing "summary" and "experience_level" (Fresher, Mid-Level, Senior) fields.`,
            },
          ],
          temperature: 0.8,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return JSON.parse(content);
        }
      }
    } catch (error) {
      console.log('AI API unavailable, using fallback templates');
    }
  }

  // Fallback to template-based generation
  return [
    { summary: SUMMARY_TEMPLATES.fresher(jobTitle)[0], experience_level: 'Fresher' },
    { summary: SUMMARY_TEMPLATES.mid(jobTitle)[1], experience_level: 'Mid-Level' },
    { summary: SUMMARY_TEMPLATES.senior(jobTitle)[0], experience_level: 'Senior' },
  ];
}

// Generate AI-powered experience bullet points
export async function generateExperienceBullets(positionTitle: string): Promise<ExperienceBulletPoints> {
  // Try to use real AI if configured
  if (AI_API_KEY && AI_API_ENDPOINT) {
    try {
      const response = await fetch(AI_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a professional resume writer. Generate impactful bullet points for work experience.',
            },
            {
              role: 'user',
              content: `Generate 5-7 professional bullet points for a resume work experience section for a ${positionTitle} position. Each bullet should start with an action verb and include quantifiable results where possible. Return as JSON with a "bullets" array of strings.`,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) {
          return JSON.parse(content);
        }
      }
    } catch (error) {
      console.log('AI API unavailable, using fallback templates');
    }
  }

  // Fallback to template-based generation
  const normalizedTitle = positionTitle.toLowerCase();
  const matchingTemplate = Object.entries(EXPERIENCE_BULLET_TEMPLATES).find(([key]) =>
    normalizedTitle.includes(key)
  );

  const bullets = matchingTemplate
    ? matchingTemplate[1].slice(0, 6)
    : EXPERIENCE_BULLET_TEMPLATES.default;

  return { bullets };
}

// Generate skills suggestions based on job title
export async function generateSkillsSuggestions(jobTitle: string): Promise<string[]> {
  const skillsMap: Record<string, string[]> = {
    developer: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Git', 'SQL', 'REST APIs', 'Agile/Scrum'],
    frontend: ['HTML5', 'CSS3', 'JavaScript', 'React', 'TypeScript', 'Tailwind CSS', 'Redux', 'Webpack'],
    backend: ['Node.js', 'Python', 'Java', 'PostgreSQL', 'MongoDB', 'Redis', 'Docker', 'AWS'],
    fullstack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL', 'CI/CD'],
    data: ['Python', 'SQL', 'Machine Learning', 'TensorFlow', 'Pandas', 'Tableau', 'Statistics', 'R'],
    product: ['Product Strategy', 'User Research', 'Agile/Scrum', 'Roadmapping', 'Analytics', 'Jira', 'A/B Testing'],
    design: ['Figma', 'Adobe XD', 'UI/UX Design', 'Prototyping', 'User Research', 'Design Systems', 'Sketch'],
    default: ['Communication', 'Problem Solving', 'Team Collaboration', 'Project Management', 'Leadership'],
  };

  const normalizedTitle = jobTitle.toLowerCase();
  const matchingKey = Object.keys(skillsMap).find(key => normalizedTitle.includes(key));

  return matchingKey ? skillsMap[matchingKey] : skillsMap.default;
}

export default {
  generateSummarySuggestions,
  generateExperienceBullets,
  generateSkillsSuggestions,
};
