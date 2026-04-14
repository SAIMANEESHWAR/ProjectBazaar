import React, { useEffect, useState, useRef } from 'react';

const WalkInReadyAnimation: React.FC = () => {
    const [activeElements, setActiveElements] = useState<Set<string>>(new Set());
    const [counts, setCounts] = useState({ v0: 0, v1: 0, v2: 0 });
    const [progress, setProgress] = useState({ p0: 0, p1: 0, p2: 0 });
    const timersRef = useRef<NodeJS.Timeout[]>([]);
    const rafRef = useRef<number[]>([]);

    const show = (id: string) => {
        setActiveElements(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    const animCount = (key: 'v0' | 'v1' | 'v2', target: number, dur: number, delay: number) => {
        const timer = setTimeout(() => {
            const t0 = performance.now();
            const tick = (now: number) => {
                const p = Math.min(1, (now - t0) / dur);
                const e = 1 - Math.pow(1 - p, 4);
                setCounts(prev => ({ ...prev, [key]: Math.round(e * target) }));
                if (p < 1) rafRef.current.push(requestAnimationFrame(tick));
            };
            rafRef.current.push(requestAnimationFrame(tick));
        }, delay);
        timersRef.current.push(timer);
    };

    const fillBar = (key: 'p0' | 'p1' | 'p2', pct: number, delay: number) => {
        const timer = setTimeout(() => {
            setProgress(prev => ({ ...prev, [key]: pct }));
        }, delay);
        timersRef.current.push(timer);
    };

    const clearAll = () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
        rafRef.current.forEach(cancelAnimationFrame);
        rafRef.current = [];
        setActiveElements(new Set());
        setCounts({ v0: 0, v1: 0, v2: 0 });
        setProgress({ p0: 0, p1: 0, p2: 0 });
    };

    useEffect(() => {
        const LOOP = 9500;

        const run = () => {
            clearAll();

            const seq: [() => void, number][] = [
                [() => show('readyCard'), 250],
                [() => { show('stat0'); animCount('v0', 82, 1100, 0); }, 900],
                [() => { show('stat1'); animCount('v1', 9, 850, 0); }, 1130],
                [() => { show('stat2'); animCount('v2', 14, 950, 0); }, 1360],
                [() => show('improvedBox'), 1750],
                [() => show('tag0'), 1980],
                [() => show('tag1'), 2200],
                [() => show('tag2'), 2420],
                [() => { fillBar('p0', 88, 0); fillBar('p1', 74, 180); fillBar('p2', 91, 360); }, 2650],
                [() => show('reviewBox'), 3050],
                [() => show('ri0'), 3300],
                [() => show('ri1'), 3560],
                [() => show('ri2'), 3820],
            ];

            seq.forEach(([fn, ms]) => {
                timersRef.current.push(setTimeout(fn, ms));
            });

            timersRef.current.push(setTimeout(run, LOOP));
        };

        const initialTimer = setTimeout(run, 150);
        timersRef.current.push(initialTimer);

        return () => clearAll();
    }, []);

    const getShowClass = (id: string) => activeElements.has(id) ? 'opacity-100 translate-y-0 blur-none' : 'opacity-0 translate-y-5 blur-md';
    const getShowClassX = (id: string) => activeElements.has(id) ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2.5';
    const getShowClassScale = (id: string) => activeElements.has(id) ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-90';

    return (
        <div className="relative flex items-center justify-center h-[280px] transition-transform duration-700 transform scale-[0.22] sm:scale-[0.28] md:scale-[0.36] lg:scale-[0.40] xl:scale-[0.48] origin-top">
            <div className="w-[540px] flex flex-col gap-[14px]">
                {/* READY CARD */}
                <div
                    className={`bg-white border-[2.5px] border-[#22c55e] rounded-[22px] p-[28px_32px] flex flex-col items-center gap-[10px] relative overflow-hidden transition-all duration-800 ease-out shadow-sm ${activeElements.has('readyCard') ? 'opacity-100 translate-y-0 blur-none shadow-[0_0_0_6px_rgba(34,197,94,0.08),0_12px_40px_rgba(0,0,0,0.07)]' : 'opacity-0 translate-y-5 blur-md'}`}
                >
                    {/* Green glow sweep */}
                    <div className={`absolute bottom-[-40px] left-1/2 -translate-x-1/2 w-[80%] h-[80px] bg-[radial-gradient(ellipse,_rgba(34,197,94,0.18)_0%,_transparent_70%)] rounded-full transition-transform duration-1000 delay-300 pointer-events-none ${activeElements.has('readyCard') ? 'scale-x-100' : 'scale-x-0'}`} />

                    <div className="flex items-center gap-[14px] relative z-10">
                        <div className={`w-[44px] h-[44px] bg-[#22c55e] rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(34,197,94,0.4)] transition-transform duration-600 delay-200 ${activeElements.has('readyCard') ? 'scale-100 animate-pulse' : 'scale-0'}`}>
                            <svg width="20" height="16" viewBox="0 0 20 16" fill="none">
                                <path d="M2 8L7.5 13.5L18 2" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <div className="font-extrabold text-[26px] text-[#111] tracking-tight">Ready for interview</div>
                    </div>
                    <div className="text-[14px] text-[#aaa] font-medium flex items-center gap-[6px] relative z-10">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <rect x="1.5" y="2.5" width="11" height="10" rx="2" stroke="#bbb" strokeWidth="1.4" />
                            <path d="M4.5 1.5v2M9.5 1.5v2M1.5 6h11" stroke="#bbb" strokeWidth="1.4" strokeLinecap="round" />
                        </svg>
                        Microsoft · Jan 19 · 2:00 PM
                    </div>
                </div>

                {/* STATS ROW */}
                <div className="flex gap-[12px]">
                    {[0, 1, 2].map(i => (
                        <div
                            key={i}
                            className={`flex-1 bg-white border border-[#efefef] rounded-[18px] p-[18px_20px] transition-all duration-700 ease-out ${getShowClass(`stat${i}`)}`}
                        >
                            <div className="flex items-center gap-[7px] text-[12px] text-[#aaa] font-medium mb-[10px]">
                                {i === 0 && (
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                                        <circle cx="7.5" cy="7.5" r="6" stroke="#bbb" strokeWidth="1.4" />
                                        <circle cx="7.5" cy="7.5" r="2.5" stroke="#bbb" strokeWidth="1.4" />
                                        <path d="M7.5 1.5v2M7.5 11.5v2M1.5 7.5h2M11.5 7.5h2" stroke="#bbb" strokeWidth="1.2" strokeLinecap="round" />
                                    </svg>
                                )}
                                {i === 1 && (
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                                        <path d="M13 9c0 2-2.5 4-5.5 4S2 11 2 9V6c0-2 2.5-4 5.5-4S13 4 13 6v3z" stroke="#bbb" strokeWidth="1.4" />
                                        <path d="M5 9.5s.8 1 2.5 1 2.5-1 2.5-1" stroke="#bbb" strokeWidth="1.2" strokeLinecap="round" />
                                    </svg>
                                )}
                                {i === 2 && (
                                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                                        <path d="M3 12l3.5-3.5M8.5 6.5L12 3M6.5 8.5l2-2" stroke="#bbb" strokeWidth="1.4" strokeLinecap="round" />
                                        <circle cx="12" cy="3" r="1.5" stroke="#bbb" strokeWidth="1.2" />
                                        <circle cx="3" cy="12" r="1.5" stroke="#bbb" strokeWidth="1.2" />
                                    </svg>
                                )}
                                {['Answer score avg', 'Stories practiced', 'Weak spots fixed'][i]}
                            </div>
                            <div className="font-extrabold text-[38px] text-[#111] tracking-tighter leading-none tabular-nums">
                                {counts[`v${i}` as keyof typeof counts]}
                            </div>
                        </div>
                    ))}
                </div>

                {/* MOST IMPROVED */}
                <div className={`bg-white border border-[#efefef] rounded-[18px] p-[20px_22px] transition-all duration-700 ease-out ${getShowClass('improvedBox')}`}>
                    <div className="flex items-center gap-[7px] text-[13px] text-[#888] font-semibold mb-[14px]">
                        <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                            <path d="M2 11L5.5 6.5l3 3L13 2" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M10 2h3v3" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        Most improved
                    </div>
                    <div className="flex gap-[10px] flex-wrap mb-4">
                        {['Structure', 'Clarity', 'Impact'].map((text, i) => (
                            <div key={i} className={`bg-[#f0fdf7] border-[1.5px] border-[#b8ead0] color-[#1a8c50] text-[13px] font-bold px-[16px] py-[7px] rounded-full flex items-center gap-[6px] transition-all duration-600 ${getShowClassScale(`tag${i}`)}`}>
                                {text} <span className="text-[14px]">↗</span>
                            </div>
                        ))}
                    </div>

                    <div className="mt-[16px] pt-[14px] border-top border-[#f5f5f5] flex flex-col gap-[10px]">
                        {[
                            { label: 'Structure', pct: 88, val: 88, key: 'p0' },
                            { label: 'Clarity', pct: 74, val: 74, key: 'p1' },
                            { label: 'Impact', pct: 91, val: 91, key: 'p2' },
                        ].map((bar, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-[11px] font-semibold mb-[4px]">
                                    <span className="text-[#555]">{bar.label}</span>
                                    <span className="text-[#22c55e] font-bold">{bar.val}</span>
                                </div>
                                <div className="h-[5px] bg-[#f0f0f0] rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#22c55e] rounded-full transition-all duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                                        style={{
                                            width: `${progress[bar.key as keyof typeof progress]}%`,
                                            transitionDelay: `${i * 150}ms`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* QUICK REVIEW */}
                <div className={`bg-white border border-[#efefef] rounded-[18px] p-[20px_22px] transition-all duration-700 ease-out ${getShowClass('reviewBox')}`}>
                    <div className="flex items-center justify-between mb-[16px]">
                        <div className="text-[14px] font-bold text-[#222]">Quick review before you go</div>
                        <div className="text-[12px] font-bold text-[#e07b2a] bg-[#fff4ec] border border-[#f5d4aa] rounded-full px-[12px] py-[4px]">10 min</div>
                    </div>
                    <div className="flex flex-col">
                        {[
                            'Microsoft culture deep-dive',
                            'Leadership story #3',
                            'Product case walkthrough'
                        ].map((text, i) => (
                            <div key={i} className={`flex items-center gap-[12px] py-[8px] border-b border-[#f5f5f5] last:border-none transition-all duration-600 ${getShowClassX(`ri${i}`)}`}>
                                <div className={`w-[24px] h-[24px] bg-[#22c55e] rounded-full flex items-center justify-center shrink-0 transition-transform duration-500 delay-100 ${activeElements.has(`ri${i}`) ? 'scale-100' : 'scale-0'}`}>
                                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <span className="text-[14px] text-[#999] font-medium line-through decoration-[#ccc] decoration-1.5">{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalkInReadyAnimation;
