import React, { useState, useEffect, useRef, useCallback } from 'react';
import { fetchHackathons } from '../../services/buyerApi';
import type { Hackathon } from '../HackathonCard';
import { useAuth, useNavigation } from '../../App';
import { useDashboard } from '../../context/DashboardContext';

const HackathonCarouselSection: React.FC = () => {
    const { isLoggedIn } = useAuth();
    const { navigateTo } = useNavigation();
    const { setDashboardMode, setActiveView } = useDashboard();

    const handleExploreAllHackathons = () => {
        if (!isLoggedIn) {
            navigateTo('auth');
        } else {
            setDashboardMode('buyer');
            setActiveView('hackathons');
            navigateTo('dashboard');
        }
    };

    const handleCardClick = (hackathon: Hackathon) => {
        if (!isLoggedIn) {
            navigateTo('auth');
        } else {
            window.open(hackathon.official_url, '_blank', 'noopener,noreferrer');
        }
    };
    const [hackathons, setHackathons] = useState<Hackathon[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isPaused, setIsPaused] = useState(false);
    const animationRef = useRef<number | null>(null);
    const scrollPositionRef = useRef(0);
    const SCROLL_SPEED = 0.5; // px per frame

    useEffect(() => {
        const load = async () => {
            try {
                const result = await fetchHackathons();
                if (result.success && result.data?.hackathons) {
                    const withImages = result.data.hackathons
                        .filter((h) => h.image_url && h.image_url.trim() !== '')
                        .sort((a, b) => {
                            const dateA = a.end_date ? new Date(a.end_date).getTime() : a.created_at;
                            const dateB = b.end_date ? new Date(b.end_date).getTime() : b.created_at;
                            return dateB - dateA; // newest first
                        })
                        .slice(0, 15);
                    setHackathons(withImages);
                }
            } catch (err) {
                console.error('Error loading hackathons for carousel:', err);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    /* Auto-scroll logic */
    const tick = useCallback(() => {
        const el = scrollRef.current;
        if (!el || isPaused) {
            animationRef.current = requestAnimationFrame(tick);
            return;
        }
        scrollPositionRef.current += SCROLL_SPEED;
        // When we've scrolled past the first set (half of the doubled content), reset
        const halfWidth = el.scrollWidth / 2;
        if (scrollPositionRef.current >= halfWidth) {
            scrollPositionRef.current = 0;
        }
        el.scrollLeft = scrollPositionRef.current;
        animationRef.current = requestAnimationFrame(tick);
    }, [isPaused]);

    useEffect(() => {
        if (hackathons.length === 0) return;
        animationRef.current = requestAnimationFrame(tick);
        return () => {
            if (animationRef.current) cancelAnimationFrame(animationRef.current);
        };
    }, [hackathons, tick]);

    const formatDate = (dateStr: string | null): string => {
        if (!dateStr) return 'TBA';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: '2-digit',
                year: 'numeric',
            });
        } catch {
            return 'TBA';
        }
    };

    const getStatusBadge = (status: string) => {
        const isLive = status?.toLowerCase() === 'live';
        return (
            <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase ${isLive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                    : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                    }`}
            >
                {isLive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                )}
                {isLive ? 'Live' : 'Upcoming'}
            </span>
        );
    };

    /* Duplicate the list so it loops seamlessly */
    const displayItems = hackathons.length > 0 ? [...hackathons, ...hackathons] : [];

    const scrollByCards = (direction: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        const cardWidth = 310;
        const amount = direction === 'right' ? cardWidth : -cardWidth;
        scrollPositionRef.current += amount;
        el.scrollTo({ left: scrollPositionRef.current, behavior: 'smooth' });
    };

    if (isLoading) {
        return (
            <section className="py-16 md:py-24 bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
                <div className="max-w-[1200px] mx-auto px-5 md:px-8">
                    <div className="text-center mb-12">
                        <div className="h-10 w-80 mx-auto bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
                    </div>
                    <div className="flex gap-6 overflow-hidden">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="flex-shrink-0 w-[280px] h-[370px] rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse"
                            />
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    if (hackathons.length === 0) return null;

    return (
        <section className="py-16 md:py-24 bg-white dark:bg-[#0a0a0a] transition-colors duration-300 overflow-hidden">
            <div className="max-w-[1200px] mx-auto px-5 md:px-8">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <h2
                        className="text-3xl md:text-[2.8rem] font-bold text-[#1a1a1a] dark:text-white tracking-[-0.02em] leading-tight"
                        style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                        Build, Compete & <span className="text-orange-500">Win Big</span>
                    </h2>
                    <p className="mt-3 text-base md:text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Join the hottest <span className="text-orange-500 font-semibold">hackathons</span> from top platforms — ship projects, sharpen your skills, and stand out
                    </p>
                </div>

                {/* Carousel */}
                <div className="relative group">
                    {/* Left Arrow */}
                    <button
                        onClick={() => scrollByCards('left')}
                        className="absolute -left-2 md:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-50 dark:hover:bg-[#222]"
                        aria-label="Scroll left"
                    >
                        <svg className="w-5 h-5 text-orange-500 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    {/* Right Arrow */}
                    <button
                        onClick={() => scrollByCards('right')}
                        className="absolute -right-2 md:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-gray-50 dark:hover:bg-[#222]"
                        aria-label="Scroll right"
                    >
                        <svg className="w-5 h-5 text-orange-500 dark:text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>

                    {/* Edge Gradients */}
                    <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-white dark:from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
                    <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white dark:from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

                    {/* Scrollable Track */}
                    <div
                        ref={scrollRef}
                        onMouseEnter={() => setIsPaused(true)}
                        onMouseLeave={() => setIsPaused(false)}
                        className="flex gap-6 overflow-x-hidden py-4"
                        style={{ scrollBehavior: 'auto' }}
                    >
                        {displayItems.map((hackathon, index) => (
                            <div
                                key={`${hackathon.id}-${index}`}
                                onClick={() => handleCardClick(hackathon)}
                                className="flex-shrink-0 w-[270px] group/card cursor-pointer"
                            >
                                <div className="bg-white dark:bg-[#141414] rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
                                    {/* Image */}
                                    <div className="relative w-full h-[180px] overflow-hidden bg-gray-100 dark:bg-gray-800">
                                        <img
                                            src={hackathon.image_url!}
                                            alt={hackathon.name}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                                            loading="lazy"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                        {/* Status Badge */}
                                        <div className="absolute top-3 left-3">
                                            {getStatusBadge(hackathon.status)}
                                        </div>
                                        {/* Mode Tag */}
                                        <div className="absolute top-3 right-3">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-white/90 dark:bg-black/60 text-gray-700 dark:text-gray-300 backdrop-blur-sm">
                                                {hackathon.mode}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex flex-col flex-1 p-5">
                                        <h3 className="text-[0.95rem] font-bold text-[#1a1a1a] dark:text-white leading-snug line-clamp-2 mb-2 group-hover/card:text-orange-500 transition-colors">
                                            {hackathon.name}
                                        </h3>

                                        <div className="mt-auto space-y-2">
                                            {/* Platform */}
                                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">
                                                <span>{hackathon.platform}</span>
                                                <span className="text-gray-300 dark:text-gray-600">|</span>
                                                <span>{hackathon.mode}</span>
                                            </div>

                                            {/* Date */}
                                            <div className="text-[0.8rem] text-gray-500 dark:text-gray-400">
                                                <span className="font-semibold text-gray-600 dark:text-gray-300">Registration Ends on</span>
                                                <br />
                                                <span>{formatDate(hackathon.end_date)}</span>
                                            </div>
                                        </div>

                                        {/* CTA Button */}
                                        <button
                                            className={`mt-4 w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${hackathon.status?.toLowerCase() === 'live'
                                                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm shadow-orange-200 dark:shadow-orange-900/30'
                                                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                        >
                                            {hackathon.status?.toLowerCase() === 'live' ? 'Register Now' : 'Registration closed'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Our Initiatives CTA */}
                <div className="flex justify-center mt-10">
                    <button
                        type="button"
                        onClick={handleExploreAllHackathons}
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-[#1a1a1a] dark:border-white text-[#1a1a1a] dark:text-white font-semibold text-sm hover:bg-[#1a1a1a] hover:text-white dark:hover:bg-white dark:hover:text-[#1a1a1a] transition-all duration-300"
                    >
                        Explore All Hackathons
                        <span className="w-7 h-7 rounded-full bg-orange-500 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                            </svg>
                        </span>
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HackathonCarouselSection;
