/** UI-only config for preparation mode — no content arrays. */

export type PrepSubTabKey = 'interview' | 'dsa' | 'aptitude' | 'sql' | 'corecs';

export const positionResourcesSubTabConfig: {
  key: PrepSubTabKey;
  label: string;
  titleTemplate: string;
  subtitleTemplate: string;
}[] = [
  {
    key: 'interview',
    label: 'Interview Questions',
    titleTemplate: 'Interview Questions for {role}',
    subtitleTemplate: 'Most asked Interview Questions at {role}.',
  },
  {
    key: 'dsa',
    label: 'DSA Questions',
    titleTemplate: 'Data Structures & Algorithms for {role}',
    subtitleTemplate:
      'Most asked Data Structures & Algorithms questions in interviews at {role}.',
  },
  {
    key: 'aptitude',
    label: 'Aptitude Questions',
    titleTemplate: 'Aptitude Questions for {role}',
    subtitleTemplate: 'Most asked aptitude & reasoning questions for {role}.',
  },
  {
    key: 'sql',
    label: 'SQL Questions',
    titleTemplate: 'SQL & Database for {role}',
    subtitleTemplate: 'Most asked SQL & Database questions in interviews at {role}.',
  },
  {
    key: 'corecs',
    label: 'Core CS Questions',
    titleTemplate: 'Core CS Subjects for {role}',
    subtitleTemplate:
      'Most asked Core CS Subjects questions in interviews at {role}.',
  },
];

export const massRecruitmentSubTabConfig: {
  key: PrepSubTabKey;
  label: string;
  titleTemplate: string;
  subtitleTemplate: string;
}[] = [
  {
    key: 'interview',
    label: 'Interview Questions',
    titleTemplate: 'Interview Questions for {company}',
    subtitleTemplate:
      'Most asked interview questions in interviews at {company}. Prepare with role-specific questions.',
  },
  {
    key: 'dsa',
    label: 'DSA',
    titleTemplate: 'DSA Questions for {company}',
    subtitleTemplate:
      'Most asked DSA questions in interviews at {company}. Practice problem-solving skills.',
  },
  {
    key: 'aptitude',
    label: 'Aptitude',
    titleTemplate: 'Aptitude Questions for {company}',
    subtitleTemplate:
      'Most asked aptitude questions in assessments at {company}. Sharpen your logical reasoning.',
  },
  {
    key: 'sql',
    label: 'SQL',
    titleTemplate: 'SQL Questions for {company}',
    subtitleTemplate:
      'Most asked SQL questions in interviews at {company}. Master database querying.',
  },
  {
    key: 'corecs',
    label: 'Core CS',
    titleTemplate: 'Core CS Subjects for {company}',
    subtitleTemplate:
      'Most asked Core CS Subjects questions in interviews at {company}. Build a strong foundation in computer science fundamentals.',
  },
];
