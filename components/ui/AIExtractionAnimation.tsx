import React, { useEffect, useRef, useState } from 'react';

const AIExtractionAnimation: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [activeElements, setActiveElements] = useState<Set<string>>(new Set());
    const animationFrameRef = useRef<number | null>(null);
    const timersRef = useRef<NodeJS.Timeout[]>([]);

    const ARROWS = [
        { x1: 185, y1: 83, x2: 263, y2: 83 },   // resume -> row0
        { x1: 185, y1: 138, x2: 263, y2: 145 },  // resume -> row1
        { x1: 185, y1: 278, x2: 263, y2: 207 },  // job -> row2
        { x1: 185, y1: 333, x2: 263, y2: 269 },  // job -> row3
        { x1: 497, y1: 269, x2: 645, y2: 200 },  // row3 -> prep
    ];

    const CLR = '#e07b2a';

    const ease = (t: number) => 1 - Math.pow(1 - t, 4);

    const drawPartial = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, prog: number) => {
        const cx1 = x1 + (x2 - x1) * 0.5, cy1 = y1;
        const cx2 = x1 + (x2 - x1) * 0.5, cy2 = y2;
        const n = Math.max(4, Math.floor(prog * 80));
        const pts = [];

        for (let i = 0; i <= n; i++) {
            const t = (i / n) * prog, m = 1 - t;
            pts.push({
                x: m * m * m * x1 + 3 * m * m * t * cx1 + 3 * m * t * t * cx2 + t * t * t * x2,
                y: m * m * m * y1 + 3 * m * m * t * cy1 + 3 * m * t * t * cy2 + t * t * t * y2
            });
        }

        ctx.save();
        ctx.strokeStyle = CLR;
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.setLineDash([7, 5]);
        ctx.beginPath();
        pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.stroke();

        if (prog > 0.82 && pts.length >= 3) {
            const tip = pts[pts.length - 1];
            const prev = pts[Math.max(0, pts.length - 4)];
            const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x);
            const a = Math.min(1, (prog - 0.82) / 0.18);

            ctx.globalAlpha = a;
            ctx.setLineDash([]);
            ctx.fillStyle = CLR;
            ctx.beginPath();
            ctx.translate(tip.x, tip.y);
            ctx.rotate(ang);
            ctx.moveTo(0, 0);
            ctx.lineTo(-11, -5);
            ctx.lineTo(-11, 5);
            ctx.closePath();
            ctx.fill();
        }
        ctx.restore();
    };

    const startArrows = () => {
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, 860, 390);
        const t0 = performance.now();
        const DUR = 1200, GAP = 300;

        const frame = (now: number) => {
            ctx.clearRect(0, 0, 860, 390);
            let any = false;

            ARROWS.forEach(({ x1, y1, x2, y2 }, i) => {
                const el = now - t0 - i * GAP;
                if (el < 0) { any = true; return; }
                const p = ease(Math.min(1, el / DUR));
                drawPartial(ctx, x1, y1, x2, y2, p);
                if (p < 1) any = true;
            });

            if (any) animationFrameRef.current = requestAnimationFrame(frame);
        };

        animationFrameRef.current = requestAnimationFrame(frame);
    };

    const clearAll = () => {
        timersRef.current.forEach(clearTimeout);
        timersRef.current = [];
        setActiveElements(new Set());

        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.clearRect(0, 0, 860, 390);
        }
    };

    const show = (id: string) => {
        setActiveElements(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    };

    useEffect(() => {
        const LOOP = 12000;

        const run = () => {
            clearAll();

            const sequence: [() => void, number][] = [
                [() => show('resumeCard'), 500],
                [() => show('jobCard'), 1300],
                [() => show('aiPill'), 2000],
                [() => startArrows(), 2600],
                [() => show('row0'), 3000],
                [() => show('row1'), 3500],
                [() => show('row2'), 4000],
                [() => show('row3'), 4500],
                [() => show('prepCard'), 5500],
                [() => show('c0'), 6100],
                [() => show('c1'), 6500],
                [() => show('c2'), 6900],
                [() => show('readyRow'), 7500],
                [() => show('footer'), 8000],
            ];

            sequence.forEach(([fn, ms]) => {
                timersRef.current.push(setTimeout(fn, ms));
            });

            timersRef.current.push(setTimeout(run, LOOP));
        };

        // Start initial loop
        const initialTimer = setTimeout(run, 300);
        timersRef.current.push(initialTimer);

        return () => clearAll();
    }, []);

    const getShowClass = (id: string) => activeElements.has(id) ? ' opacity-100 translate-y-0 translate-x-0 scale-100' : '';
    const getShowClassShadow = (id: string) => activeElements.has(id) ? ' shadow-[0_0_0_5px_rgba(34,197,94,0.1),0_8px_32px_rgba(0,0,0,0.08)]' : '';
    // Blur only when hidden so "shown" state is always crisp (no Tailwind class conflict)
    const getBlurClass = (id: string, row = false) => activeElements.has(id) ? 'blur-none' : row ? 'blur-[5px]' : 'blur-sm';

    return (
        <div className="relative flex items-center justify-center min-h-[280px] transition-transform duration-700 transform scale-[0.28] sm:scale-[0.38] md:scale-[0.48] lg:scale-[0.52] xl:scale-[0.62] origin-center will-change-transform" style={{ backfaceVisibility: 'hidden' as const }}>
            <div className="relative w-[860px] h-[390px] shrink-0">
                {/* Canvas for dotted lines */}
                <canvas ref={canvasRef} width="860" height="390" className="absolute top-0 left-0 w-[860px] h-[390px] pointer-events-none z-10" />

                {/* Resume Card (Left Top) */}
                <div id="resumeCard" className={`absolute w-[185px] left-0 top-[20px] bg-white border-[2.5px] border-[#e07b2a] rounded-[18px] p-[18px_20px] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] z-20 ${activeElements.has('resumeCard') ? 'opacity-100 translate-y-0 translate-x-0' : 'opacity-0 translate-y-[14px]'} ${getBlurClass('resumeCard')}`}>
                    <div className="flex items-center gap-[12px] mb-[14px]">
                        <div className="w-[40px] h-[40px] bg-[#fff4ec] rounded-[10px] flex items-center justify-center text-[20px] shrink-0">📄</div>
                        <div>
                            <div className="font-extrabold text-[15px] text-[#111]">Resume</div>
                            <div className="text-[12px] text-[#bbb] mt-[1px]">PDF uploaded</div>
                        </div>
                    </div>
                    <div className="h-[6px] bg-[#f0ece6] rounded-full mb-[7px] w-[88%]"></div>
                    <div className="h-[6px] bg-[#f0ece6] rounded-full mb-[7px] w-[72%]"></div>
                    <div className="h-[6px] bg-[#f0ece6] rounded-full mb-[7px] w-[80%]"></div>
                </div>

                {/* Job Card (Left Bottom) */}
                <div id="jobCard" className={`absolute w-[185px] left-0 top-[215px] bg-white border-[2.5px] border-[#e07b2a] rounded-[18px] p-[18px_20px] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] z-20 ${activeElements.has('jobCard') ? 'opacity-100 translate-y-0 translate-x-0' : 'opacity-0 translate-y-[14px]'} ${getBlurClass('jobCard')}`}>
                    <div className="flex items-center gap-[12px] mb-[14px]">
                        <div className="w-[40px] h-[40px] bg-[#fff4ec] rounded-[10px] flex items-center justify-center text-[20px] shrink-0">💼</div>
                        <div>
                            <div className="font-extrabold text-[15px] text-[#111]">Job Description</div>
                            <div className="text-[12px] text-[#bbb] whitespace-nowrap mt-[1px]">Frontend Engineer</div>
                        </div>
                    </div>
                    <div className="h-[6px] bg-[#f0ece6] rounded-full mb-[7px] w-[82%]"></div>
                    <div className="h-[6px] bg-[#f0ece6] rounded-full mb-[7px] w-[65%]"></div>
                    <div className="h-[6px] bg-[#f0ece6] rounded-full mb-[7px] w-[74%]"></div>
                </div>

                {/* AI Pill (Middle Top) */}
                <div id="aiPill" className={`absolute left-[293px] top-[8px] bg-[#fde0c0] border-[1.5px] border-[#e8a870] rounded-full px-[22px] py-[10px] flex items-center gap-[8px] transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] opacity-0 -translate-y-2 z-20 ${getShowClass('aiPill')}`}>
                    <span className="text-[#c0601a] text-[14px]">✦</span>
                    <span className="font-bold text-[15px] text-[#c0601a]">AI Extraction</span>
                </div>

                {/* Extracted Rows (Middle) */}
                {/* Row 0 */}
                <div id="row0" className={`absolute left-[263px] w-[234px] top-[58px] bg-white border-[1.5px] border-[#e8b080] rounded-[12px] p-[12px_15px] flex items-center gap-[12px] transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] z-20 ${activeElements.has('row0') ? 'opacity-100 translate-y-0 translate-x-0' : 'opacity-0 -translate-x-3'} ${getBlurClass('row0', true)}`}>
                    <span className="text-[17px]">💼</span>
                    <span className="font-semibold text-[13px] text-[#222] flex-1">Role: Frontend Engineer</span>
                    <span className="w-[9px] h-[9px] bg-[#22c55e] rounded-full shrink-0 animate-[pulse_2s_ease_infinite]"></span>
                </div>

                {/* Row 1 */}
                <div id="row1" className={`absolute left-[263px] w-[234px] top-[120px] bg-white border-[1.5px] border-[#e8b080] rounded-[12px] p-[12px_15px] flex items-center gap-[12px] transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] z-20 ${activeElements.has('row1') ? 'opacity-100 translate-y-0 translate-x-0' : 'opacity-0 -translate-x-3'} ${getBlurClass('row1', true)}`}>
                    <span className="text-[17px] text-[#c0601a]">✦</span>
                    <span className="font-semibold text-[13px] text-[#222] flex-1">React, TypeScript</span>
                    <span className="w-[9px] h-[9px] bg-[#22c55e] rounded-full shrink-0 animate-[pulse_2s_ease_infinite]"></span>
                </div>

                {/* Row 2 */}
                <div id="row2" className={`absolute left-[263px] w-[234px] top-[182px] bg-white border-[1.5px] border-[#e8b080] rounded-[12px] p-[12px_15px] flex items-center gap-[12px] transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] z-20 ${activeElements.has('row2') ? 'opacity-100 translate-y-0 translate-x-0' : 'opacity-0 -translate-x-3'} ${getBlurClass('row2', true)}`}>
                    <span className="text-[17px]">📋</span>
                    <span className="font-semibold text-[13px] text-[#222] flex-1">UI/UX, System Design</span>
                    <span className="w-[9px] h-[9px] bg-[#22c55e] rounded-full shrink-0 animate-[pulse_2s_ease_infinite]"></span>
                </div>

                {/* Row 3 */}
                <div id="row3" className={`absolute left-[263px] w-[234px] top-[244px] bg-white border-[1.5px] border-[#e8b080] rounded-[12px] p-[12px_15px] flex items-center gap-[12px] transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] z-20 ${activeElements.has('row3') ? 'opacity-100 translate-y-0 translate-x-0' : 'opacity-0 -translate-x-3'} ${getBlurClass('row3', true)}`}>
                    <div className="w-[28px] h-[28px] bg-[#2d3748] rounded-full flex items-center justify-center text-white font-extrabold text-[12px] shrink-0">T</div>
                    <span className="font-semibold text-[13px] text-[#222] flex-1">Bazaar Tech</span>
                    <span className="w-[9px] h-[9px] bg-[#22c55e] rounded-full shrink-0 animate-[pulse_2s_ease_infinite]"></span>
                </div>

                {/* Prep Plan Card (Right) - ensure visible and crisp when shown */}
                <div id="prepCard" className={`absolute w-[210px] left-[645px] top-[20px] bg-white border-[2.5px] border-[#22c55e] rounded-[18px] p-[18px_20px] transition-all duration-750 ease-[cubic-bezier(0.22,1,0.36,1)] z-20 ${activeElements.has('prepCard') ? 'opacity-100 translate-y-0 translate-x-0' : 'opacity-0 translate-x-[14px]'} ${getBlurClass('prepCard')} ${getShowClassShadow('prepCard')}`}>
                    <div className="flex items-center justify-between mb-[16px]">
                        <div className="font-extrabold text-[16px] text-[#111] flex items-center gap-[6px]">📋 Prep Plan</div>
                        <div className="bg-[#fef9ec] border border-[#f0d890] rounded-[8px] px-[9px] py-[4px] text-[11px] font-bold text-[#a07000]">📅 5 days</div>
                    </div>

                    <div className="flex flex-col gap-[11px] mb-[14px]">
                        {[
                            { id: 'c0', text: 'System Design Prep' },
                            { id: 'c1', text: 'JavaScript Deep Dive' },
                            { id: 'c2', text: 'Mock Coding Test' },
                        ].map((item) => (
                            <div key={item.id} id={item.id} className={`flex items-center gap-[10px] opacity-0 translate-y-1.5 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${getShowClass(item.id)}`}>
                                <div className="w-[22px] h-[22px] bg-[#22c55e] rounded-full flex items-center justify-center shrink-0">
                                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none"><path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                </div>
                                <span className="text-[13px] text-[#222] font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    <div className="h-[1px] bg-[#eee] mb-[12px]"></div>

                    <div id="readyRow" className={`flex items-center gap-[8px] justify-center opacity-0 translate-y-1.5 transition-all duration-600 ease-[cubic-bezier(0.22,1,0.36,1)] ${getShowClass('readyRow')}`}>
                        <span className="w-[10px] h-[10px] bg-[#22c55e] rounded-full animate-[pulse_1.5s_ease_infinite]"></span>
                        <span className="font-extrabold text-[14px] text-[#22c55e]">Ready to start!</span>
                    </div>
                </div>
            </div>

            <div id="footer" className={`mt-[14px] text-[#b0a898] text-[14px] font-medium text-center transition-opacity duration-600 ${activeElements.has('footer') ? 'opacity-100' : 'opacity-0'}`}>
                AI extracts key info from your profile
            </div>
        </div>
    );
};

export default AIExtractionAnimation;
