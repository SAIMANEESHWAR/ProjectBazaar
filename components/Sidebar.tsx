import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import type { DashboardView } from './DashboardPage';
import { useCart } from './DashboardPage';
import { useDashboard } from '../context/DashboardContext';
import { cachedFetchUserProfile } from '../services/buyerApi';

const LogoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M14.293 3.293L12 1.00001L3.29297 9.70704C3.10547 9.89454 3.00006 10.149 3.00006 10.414V20C3.00006 20.552 3.44806 21 4.00006 21H12V13H14V21H20C20.552 21 21 20.552 21 20V10.414C21 10.149 20.8946 9.89452 20.7071 9.70702L14.293 3.293Z" fill="url(#paint0_linear_sidebar)" />
        <defs>
            <linearGradient id="paint0_linear_sidebar" x1="3" y1="1" x2="21" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F97316" />
                <stop offset="1" stopColor="#EA580C" />
            </linearGradient>
        </defs>
    </svg>
);

const DashboardIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>;
const ProjectsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>;

const EarningsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
const AnalyticsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>;
const SettingsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;

const PayoutsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const HelpCenterIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const CoursesIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const HackathonsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>;
const PortfolioIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const ResumeIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;
/** Gauge / dial — reads as “score & fit”, distinct from AI Resume Builder (document) icon. Paths match lucide-react Gauge. */
const ATSScorerIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m12 14 4-4" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
);
const CareerGuidanceIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const CompanyPostsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h6m-6 4h4M5 5a2 2 0 00-2 2v11l3-3h11a2 2 0 002-2V7a2 2 0 00-2-2H5z" /></svg>;
const MockAssessmentIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const CodingQuestionsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
const PostProjectIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const MyBidsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>;

const InterviewQIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const DSAIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
const QuizIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>;
const ColdDMIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const CollectionsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>;
const MassRecruitIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const JobPortalIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
const NotesIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>;
const RoadmapIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>;
const PositionIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>;
const ActivityIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;
const LanguageIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>;
const OOPsIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>;
const HLDIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const LLDIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>;

const buyerNavItems = [
    { name: 'Dashboard', view: 'dashboard' as DashboardView, icon: DashboardIcon },
    { name: 'Career Guidance', view: 'career-guidance' as DashboardView, icon: CareerGuidanceIcon },
    { name: 'Company Posts', view: 'company-posts' as DashboardView, icon: CompanyPostsIcon },
    { name: 'Mock Assessment', view: 'mock-assessment' as DashboardView, icon: MockAssessmentIcon },
    { name: 'Coding Questions', view: 'coding-questions' as DashboardView, icon: CodingQuestionsIcon },
    { name: 'Build Portfolio', view: 'build-portfolio' as DashboardView, icon: PortfolioIcon },
    { name: 'AI Resume Builder', view: 'build-resume' as DashboardView, icon: ResumeIcon },
    { name: 'ATS Scorer', view: 'ats-scorer' as DashboardView, icon: ATSScorerIcon },
    { name: 'Hackathons', view: 'hackathons' as DashboardView, icon: HackathonsIcon },
    { name: 'Courses', view: 'courses' as DashboardView, icon: CoursesIcon },
    { name: 'Analytics', view: 'analytics' as DashboardView, icon: AnalyticsIcon },
    { name: 'Help Center', view: 'help-center' as DashboardView, icon: HelpCenterIcon },
    { name: 'Settings', view: 'settings' as DashboardView, icon: SettingsIcon },
];

interface PrepNavItem { name: string; view: DashboardView; icon: JSX.Element; }
interface PrepNavGroup { label: string; items: PrepNavItem[]; }

const prepNavGroups: PrepNavGroup[] = [
    {
        label: 'Library',
        items: [
            { name: 'All Interview Questions', view: 'prep-interview-questions' as DashboardView, icon: InterviewQIcon },
            { name: 'Role Wise Resources', view: 'prep-position-resources' as DashboardView, icon: PositionIcon },
            { name: 'Company Wise Resources', view: 'prep-mass-recruitment' as DashboardView, icon: MassRecruitIcon },
            { name: 'DSA Questions', view: 'prep-dsa' as DashboardView, icon: DSAIcon },
            { name: 'Aptitude Questions', view: 'prep-quizzes' as DashboardView, icon: QuizIcon },
            { name: 'Handwritten Notes', view: 'prep-notes' as DashboardView, icon: NotesIcon },
            { name: 'Quiz', view: 'prep-collections' as DashboardView, icon: CollectionsIcon },
        ],
    },
    {
        label: 'Fundamentals',
        items: [
            { name: 'Language', view: 'prep-language' as DashboardView, icon: LanguageIcon },
            { name: 'OOPs Concepts', view: 'prep-oops' as DashboardView, icon: OOPsIcon },
        ],
    },
    {
        label: 'System Design',
        items: [
            { name: 'High Level Design', view: 'prep-hld' as DashboardView, icon: HLDIcon },
            { name: 'Low Level Design', view: 'prep-lld' as DashboardView, icon: LLDIcon },
        ],
    },
    {
        label: 'Research',
        items: [
            { name: 'Job Portals', view: 'prep-job-portals' as DashboardView, icon: JobPortalIcon },
            { name: 'Roadmap', view: 'prep-roadmaps' as DashboardView, icon: RoadmapIcon },
            { name: 'Cold DMs / Emails', view: 'prep-cold-dms' as DashboardView, icon: ColdDMIcon },
        ],
    },
    {
        label: 'Platform',
        items: [
            { name: 'My Activity', view: 'prep-activity' as DashboardView, icon: ActivityIcon },
        ],
    },
];

const preparationNavItems = prepNavGroups.flatMap(g => g.items);

const sellerNavItems = [
    { name: 'Dashboard', view: 'dashboard' as DashboardView, icon: DashboardIcon },
    { name: 'Post Project Bid', view: 'post-project' as DashboardView, icon: PostProjectIcon },
    { name: 'My Bids', view: 'my-bids' as DashboardView, icon: MyBidsIcon },
    { name: 'My Projects', view: 'my-projects' as DashboardView, icon: ProjectsIcon },
    { name: 'Purchased Courses', view: 'my-courses' as DashboardView, icon: CoursesIcon },
    { name: 'Earnings', view: 'earnings' as DashboardView, icon: EarningsIcon },
    { name: 'Payouts', view: 'payouts' as DashboardView, icon: PayoutsIcon },
    { name: 'Analytics', view: 'analytics' as DashboardView, icon: AnalyticsIcon },
    { name: 'Help Center', view: 'help-center' as DashboardView, icon: HelpCenterIcon },
    { name: 'Settings', view: 'settings' as DashboardView, icon: SettingsIcon },
];

interface SidebarProps {
    dashboardMode?: 'buyer' | 'seller' | 'preparation';
    activeView?: DashboardView;
    setActiveView?: (view: DashboardView) => void;
    isOpen: boolean;
    isCollapsed: boolean;
    onClose: () => void;
    onToggle: () => void;
    onCollapseToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, isCollapsed, onCollapseToggle, onClose }) => {
    const { userEmail, userId, logout } = useAuth();
    // Use global state
    const { dashboardMode, activeView, setActiveView, setDashboardMode, prepDarkMode, togglePrepDarkMode } = useDashboard();

    const [isHovered, setIsHovered] = useState(false);
    const [userProfileImage, setUserProfileImage] = useState<string | null>(null);
    const [userFullName, setUserFullName] = useState<string>('');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const prevModeRef = useRef(dashboardMode);

    // Always call the hook (React rules), but only use cartCount in buyer mode
    const cart = useCart();
    const cartCount = dashboardMode === 'buyer' ? cart.cartCount : 0;

    const navItems = dashboardMode === 'preparation' ? preparationNavItems : dashboardMode === 'buyer' ? buyerNavItems : sellerNavItems;
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ Library: true, Fundamentals: true, 'System Design': true, Research: true, Platform: true });
    const toggleGroup = (label: string) => setExpandedGroups(prev => ({ ...prev, [label]: !prev[label] }));

    useEffect(() => {
        if (prevModeRef.current !== dashboardMode) {
            setIsTransitioning(true);
            const timer = setTimeout(() => setIsTransitioning(false), 400);
            prevModeRef.current = dashboardMode;
            return () => clearTimeout(timer);
        }
    }, [dashboardMode]);

    // Fetch user profile (shared cache -- if DashboardContent already fetched, this is instant)
    useEffect(() => {
        if (!userId) return;
        cachedFetchUserProfile(userId).then((user) => {
            if (user) {
                setUserProfileImage(user.profilePictureUrl || null);
                setUserFullName(user.fullName || user.name || '');
            }
        }).catch(() => { });
    }, [userId]);

    // When collapsed and hovered, show expanded version
    const isExpanded = isOpen && (!isCollapsed || isHovered);
    const sidebarWidth = isExpanded ? 'w-64' : 'w-16';
    const isDark = dashboardMode === 'preparation' && prepDarkMode;

    return (
        <>
            <div
                className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-500 ease-in-out ${isDark
                    ? 'bg-black border-r border-[#1c1c1e] shadow-[0_0_15px_rgba(0,0,0,0.5)]'
                    : 'bg-white border-r border-gray-200 shadow-sm'
                    } ${isOpen ? 'translate-x-0' : '-translate-x-full'
                    } ${sidebarWidth} ${isCollapsed && isHovered ? 'shadow-xl z-[60]' : ''}`}
                onMouseEnter={() => {
                    if (isCollapsed && isOpen) {
                        setIsHovered(true);
                    }
                }}
                onMouseLeave={() => {
                    if (isCollapsed) {
                        setIsHovered(false);
                    }
                }}
            >
                {/* Header with logo */}
                <div className={`flex items-center ${isExpanded ? 'justify-start' : 'justify-center'} h-16 ${isDark ? 'border-b border-[#1c1c1e]' : 'border-b border-gray-200'} ${isExpanded ? 'px-4' : 'px-2'}`}>
                    {isExpanded && (
                        <div className="flex items-center gap-2">
                            <LogoIcon />
                            <span className={`text-lg font-bold whitespace-nowrap transition-colors duration-300 ${isDark ? 'text-white' : ''}`}>ProjectBazaar</span>
                        </div>
                    )}
                    {!isExpanded && (
                        <div className="flex items-center justify-center">
                            <LogoIcon />
                        </div>
                    )}
                </div>
                {/* Preparation Mode Toggle */}
                {isExpanded && (
                    <div className="px-4 pt-3">
                        <button
                            onClick={() => {
                                setDashboardMode(dashboardMode === 'preparation' ? 'buyer' : 'preparation');
                            }}
                            className={`relative overflow-hidden w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${dashboardMode === 'preparation'
                                ? isDark
                                    ? 'bg-white text-black shadow-lg shadow-white/10'
                                    : 'bg-black text-white shadow-lg shadow-black/20 ring-1 ring-white/10'
                                : isDark
                                    ? 'bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] border border-[#38383a]'
                                    : 'bg-black text-white hover:bg-gray-900 shadow-md'
                                }`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 relative z-10">
                                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                                <path d="M5 3v4" />
                                <path d="M7 5H3" />
                                <path d="M21 17v4" />
                                <path d="M23 19h-4" />
                            </svg>
                            <span className="relative z-10">{dashboardMode === 'preparation' ? 'Exit Prep Mode' : 'Preparation Mode'}</span>
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] animate-[shine_2s_infinite]" />
                        </button>
                    </div>
                )}
                <style>{`
                    @keyframes shine {
                        0% { transform: translateX(-100%) skewX(-20deg); }
                        100% { transform: translateX(200%) skewX(-20deg); }
                    }
                    @keyframes navSlideIn {
                        from { opacity: 0; transform: translateX(-12px); }
                        to { opacity: 1; transform: translateX(0); }
                    }
                    .nav-item-animate {
                        animation: navSlideIn 0.3s ease-out forwards;
                    }
                `}</style>
                {dashboardMode === 'preparation' && isExpanded && (
                    <div className="px-4 pb-2">
                        <div className={`flex items-center justify-between px-3 py-1.5 rounded-lg transition-all duration-300 ${isDark
                            ? 'bg-[#1c1c1e] border border-[#2c2c2e]'
                            : 'bg-orange-50 border border-orange-100'
                            }`}>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full animate-pulse ${isDark ? 'bg-white' : 'bg-orange-500'}`} />
                                <span className={`text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-white' : 'text-orange-600'}`}>Prep Mode</span>
                            </div>
                            <button
                                onClick={togglePrepDarkMode}
                                className={`p-1.5 rounded-lg transition-all duration-300 ${isDark
                                    ? 'text-yellow-300 hover:bg-[#2c2c2e]'
                                    : 'text-gray-500 hover:bg-orange-100'
                                    }`}
                                title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            >
                                {isDark ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <circle cx="12" cy="12" r="4" />
                                        <path d="M12 2v2" />
                                        <path d="M12 20v2" />
                                        <path d="m4.93 4.93 1.41 1.41" />
                                        <path d="m17.66 17.66 1.41 1.41" />
                                        <path d="M2 12h2" />
                                        <path d="M20 12h2" />
                                        <path d="m6.34 17.66-1.41 1.41" />
                                        <path d="m19.07 4.93-1.41 1.41" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                )}
                <nav className={`flex-1 ${isExpanded ? 'px-4' : 'px-2'} py-4 space-y-1 overflow-y-auto custom-scrollbar`}>
                    {dashboardMode === 'preparation' && isExpanded ? (
                        <div className="space-y-1">
                            {prepNavGroups.map((group) => {
                                const isGroupExpanded = expandedGroups[group.label] ?? true;
                                const hasActiveItem = group.items.some(i => i.view === activeView);
                                return (
                                    <div key={group.label}>
                                        <button
                                            onClick={() => toggleGroup(group.label)}
                                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${hasActiveItem
                                                ? isDark ? 'text-white' : 'text-gray-900'
                                                : isDark ? 'text-[#8e8e93] hover:text-white' : 'text-gray-700 hover:text-gray-900'
                                                }`}
                                        >
                                            <span>{group.label}</span>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className={`h-4 w-4 transition-transform duration-200 ${isGroupExpanded ? 'rotate-90' : ''}`}
                                                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                        {isGroupExpanded && (
                                            <div className="mt-0.5 ml-2 space-y-0.5">
                                                {group.items.map((item) => (
                                                    <button
                                                        key={item.name}
                                                        onClick={() => {
                                                            setActiveView(item.view);
                                                            if (window.innerWidth < 1024) onClose();
                                                        }}
                                                        className={`w-full flex items-center gap-2.5 pl-4 pr-3 py-2 text-sm rounded-lg transition-all duration-200 ${activeView === item.view
                                                            ? isDark
                                                                ? 'bg-[#1c1c1e] text-white font-medium'
                                                                : 'bg-orange-500 text-white font-medium'
                                                            : isDark
                                                                ? 'text-[#8e8e93] hover:bg-[#1c1c1e] hover:text-white'
                                                                : 'text-gray-600 hover:bg-orange-50'
                                                            }`}
                                                    >
                                                        <div className="flex-shrink-0">{item.icon}</div>
                                                        <span className="whitespace-nowrap truncate">{item.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        navItems.map((item, index) => (
                            <button
                                key={item.name}
                                onClick={() => {
                                    setActiveView(item.view);
                                    if (window.innerWidth < 1024) {
                                        onClose();
                                    }
                                    if (isCollapsed && !isHovered) {
                                        onCollapseToggle();
                                    }
                                }}
                                className={`w-full flex items-center ${isExpanded ? 'px-4' : 'px-2 justify-center'} py-2.5 text-sm font-medium rounded-lg transition-all duration-200 relative group ${activeView === item.view
                                    ? isDark
                                        ? 'bg-white text-black'
                                        : 'bg-orange-500 text-white'
                                    : isDark
                                        ? 'text-[#8e8e93] hover:bg-[#1c1c1e] hover:text-white'
                                        : 'text-gray-600 hover:bg-orange-50'
                                    } ${isTransitioning ? 'nav-item-animate' : ''}`}
                                style={isTransitioning ? { animationDelay: `${index * 30}ms`, opacity: 0 } : undefined}
                            >
                                <div className="flex-shrink-0 relative">
                                    {item.icon}
                                    {item.view === 'cart' && cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                            {cartCount > 9 ? '9+' : cartCount}
                                        </span>
                                    )}
                                </div>
                                {isExpanded && (
                                    <span className="ml-3 whitespace-nowrap">
                                        {item.name}
                                    </span>
                                )}
                                {!isExpanded && (
                                    <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                                        {item.name}
                                        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </nav>
                <div className={`${isExpanded ? 'px-4' : 'px-2'} py-4 ${isDark ? 'border-t border-[#1c1c1e]' : 'border-t border-gray-200'}`}>
                    {isExpanded ? (
                        <div className={`flex items-center p-2 rounded-lg ${isDark ? 'bg-[#1c1c1e]' : 'bg-orange-50'}`}>
                            <button
                                onClick={() => setActiveView('settings')}
                                className="relative flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold overflow-hidden">
                                    {userProfileImage ? (
                                        <img
                                            src={userProfileImage}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span>{userFullName ? userFullName.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase() || 'U'}</span>
                                    )}
                                </div>
                                {userProfileImage && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                            </button>
                            <div className="ml-3 flex-1 min-w-0">
                                <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{userFullName || 'User'}</p>
                                <p className={`text-xs truncate ${isDark ? 'text-[#8e8e93]' : 'text-gray-500'}`}>{userEmail ?? 'user@example.com'}</p>
                            </div>
                            <button
                                onClick={logout}
                                className={`ml-2 p-2 rounded-full flex-shrink-0 relative group ${isDark ? 'text-[#8e8e93] hover:bg-[#2c2c2e]' : 'text-gray-500 hover:bg-orange-100'}`}
                                title="Logout"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                                    Logout
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                </div>
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <button
                                onClick={() => setActiveView('settings')}
                                className="relative cursor-pointer hover:opacity-80 transition-opacity group"
                            >
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold overflow-hidden">
                                    {userProfileImage ? (
                                        <img
                                            src={userProfileImage}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span>{userFullName ? userFullName.charAt(0).toUpperCase() : userEmail?.charAt(0).toUpperCase() || 'U'}</span>
                                    )}
                                </div>
                                {userProfileImage && (
                                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
                                )}
                                <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                                    Settings
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                </div>
                            </button>
                            <button
                                onClick={logout}
                                className={`p-2 rounded-full relative group ${isDark ? 'text-[#8e8e93] hover:bg-[#2c2c2e]' : 'text-gray-500 hover:bg-orange-100'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                <div className="absolute left-full ml-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg">
                                    Logout
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
                                </div>
                            </button>
                        </div>
                    )}
                </div>
            </div >
        </>
    );
};

export default Sidebar;
