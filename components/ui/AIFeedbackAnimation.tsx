import React, { useState, useEffect } from "react";

const suggestions = [
    { icon: "✓", label: "Opening is strong", type: "success", delay: 0 },
    { icon: "!", label: "Add 1 metric here", type: "warning", delay: 400 },
    { icon: "!", label: "Clarify your role vs team", type: "warning", delay: 800 },
];

const AIFeedbackAnimation: React.FC = () => {
    const [step, setStep] = useState(0);
    const [score, setScore] = useState(0);
    const [wordIndex, setWordIndex] = useState(0);
    const [visibleSuggestions, setVisibleSuggestions] = useState(0);

    const fullText = "I optimized our CI/CD pipeline by migrating to GitHub Actions. This reduced build times by 40%, and I also implemented automated testing for all core services.";
    const words = fullText.split(" ");

    useEffect(() => {
        let timers: NodeJS.Timeout[] = [];

        const run = () => {
            setStep(0);
            setScore(0);
            setWordIndex(0);
            setVisibleSuggestions(0);

            const timings = [
                300,   // step 1: label
                600,   // step 2: start typing
                2800,  // step 3: green highlight
                3400,  // step 4: orange highlight
                4000,  // step 5: legend
                4400,  // step 6: suggestions
                5800,  // step 7: score
                7200,  // step 8: +17 badge
                7600,  // step 9: improved version
            ];

            timings.forEach((t, i) => {
                timers.push(setTimeout(() => setStep(i + 1), t));
            });

            timers.push(setTimeout(run, 11000));
        };

        run();

        return () => timers.forEach(clearTimeout);
    }, []);

    // Word-by-word typing (step 2)
    useEffect(() => {
        if (step < 2) return;
        if (wordIndex >= words.length) return;
        const t = setTimeout(() => setWordIndex((w) => w + 1), 50);
        return () => clearTimeout(t);
    }, [step, wordIndex, words.length]);

    // Score animation (step 7)
    useEffect(() => {
        if (step < 7) return;
        let frame: number;
        const start = performance.now();
        const animate = (now: number) => {
            const progress = Math.min((now - start) / 1200, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setScore(Math.round(ease * 81));
            if (progress < 1) frame = requestAnimationFrame(animate);
        };
        frame = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frame);
    }, [step]);

    // Suggestions stagger (step 6)
    useEffect(() => {
        if (step < 6) return;
        const timers: NodeJS.Timeout[] = [];
        setVisibleSuggestions(0);
        suggestions.forEach((s) => {
            timers.push(setTimeout(() => setVisibleSuggestions((v) => v + 1), s.delay));
        });
        return () => timers.forEach(clearTimeout);
    }, [step]);

    const circumference = 2 * Math.PI * 30;
    const strokeDash = (score / 100) * circumference;

    const getWordHighlight = (index: number) => {
        const joinedSoFar = words.slice(0, index + 1).join(" ");
        if (step >= 3 && joinedSoFar.includes("optimized our CI/CD") && index <= 5) return "#c8f0d8";
        if (step >= 4 && index >= 14 && index < words.length) return "#fde8c8";
        return "transparent";
    };

    return (
        <div className="flex flex-col items-center justify-center font-sans w-[800px] max-w-full overflow-hidden bg-transparent transform scale-[0.22] sm:scale-[0.28] md:scale-[0.36] lg:scale-[0.40] xl:scale-[0.48] origin-top py-2">
            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(24px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.6); }
          70% { transform: scale(1.15); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .card-wrap {
          opacity: 0;
          animation: fadeUp 0.6s ease 0.2s forwards;
        }
        .label-tag {
          opacity: 0;
        }
        .label-tag.show {
          animation: fadeIn 0.4s ease forwards;
        }
        .suggestion-chip {
          opacity: 0;
        }
        .suggestion-chip.show {
          animation: slideRight 0.45s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .score-ring {
          opacity: 0;
        }
        .score-ring.show {
          animation: fadeIn 0.5s ease forwards;
        }
        .delta-badge {
          opacity: 0;
        }
        .delta-badge.show {
          animation: popIn 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards;
        }
        .improved-card {
          opacity: 0;
          transform: translateY(14px);
        }
        .improved-card.show {
          animation: fadeUp 0.55s cubic-bezier(0.34,1.2,0.64,1) forwards;
          border-color: #22a06b !important;
        }
        .legend {
          opacity: 0;
        }
        .legend.show {
          animation: fadeIn 0.4s ease forwards;
        }
        .cursor {
          display: inline-block;
          width: 2px;
          height: 1em;
          background: #333;
          margin-left: 2px;
          vertical-align: middle;
          animation: cursor-blink 0.7s infinite;
        }
        .footer-text {
          opacity: 0;
        }
        .footer-text.show {
          animation: fadeIn 0.5s ease 0.3s forwards;
        }
      `}</style>

            <div style={{ width: "100%", maxWidth: "860px" }}>
                {/* Main card */}
                <div
                    className="card-wrap"
                    style={{
                        background: "white",
                        borderRadius: "22px",
                        padding: "28px",
                        boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
                        marginBottom: "14px",
                    }}
                >
                    {/* Header row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                            <div style={{
                                width: 48, height: 48,
                                background: "linear-gradient(135deg, #fff4ec, #ffe8d6)",
                                borderRadius: "14px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "22px", boxShadow: "0 2px 8px #f5c09933"
                            }}>
                                ✦
                            </div>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: "18px", color: "#111" }}>AI Feedback</div>
                                <div style={{ color: "#aaa", fontSize: "13px", marginTop: "2px" }}>Inline suggestions on your answer</div>
                            </div>
                        </div>

                        {/* Score */}
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div className={`delta-badge ${step >= 8 ? "show" : ""}`}
                                style={{
                                    background: "#e6f9f0", color: "#22a06b",
                                    fontWeight: 800, fontSize: "14px",
                                    padding: "6px 14px", borderRadius: "999px",
                                    border: "1.5px solid #b6ecd4"
                                }}>
                                +17
                            </div>

                            <div className={`score-ring ${step >= 7 ? "show" : ""}`}
                                style={{ position: "relative", width: 68, height: 68 }}>
                                <svg width="68" height="68" style={{ transform: "rotate(-90deg)" }}>
                                    <circle cx="34" cy="34" r="30" fill="none" stroke="#f0f0f0" strokeWidth="5" />
                                    <circle
                                        cx="34" cy="34" r="30" fill="none"
                                        stroke="#22a06b" strokeWidth="5" strokeLinecap="round"
                                        strokeDasharray={`${strokeDash} ${circumference}`}
                                        style={{ transition: "stroke-dasharray 0.04s linear" }}
                                    />
                                </svg>
                                <div style={{
                                    position: "absolute", inset: 0,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontWeight: 800, fontSize: "19px", color: "#111"
                                }}>
                                    {score}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content area */}
                    <div style={{ display: "flex", gap: "18px" }}>
                        {/* Answer box */}
                        <div style={{
                            flex: 1,
                            background: "#fafaf8",
                            border: "1px solid #ececec",
                            borderRadius: "16px",
                            padding: "22px",
                            minHeight: "220px",
                        }}>
                            <div className={`label-tag ${step >= 1 ? "show" : ""}`}
                                style={{
                                    fontSize: "10px", fontWeight: 700,
                                    letterSpacing: "0.12em", color: "#bbb",
                                    marginBottom: "14px"
                                }}>
                                YOUR ANSWER
                            </div>

                            {/* Typed text with highlights */}
                            <p style={{
                                fontSize: "17px", lineHeight: 1.75,
                                color: "#2a2a2a",
                                minHeight: "90px"
                            }}>
                                {step >= 2 && words.slice(0, wordIndex).map((word, i) => (
                                    <span key={i} style={{
                                        background: getWordHighlight(i),
                                        borderRadius: "3px",
                                        padding: getWordHighlight(i) !== "transparent" ? "1px 1px" : "0",
                                        transition: "background 0.3s ease",
                                    }}>
                                        {word}{" "}
                                    </span>
                                ))}
                                {step >= 2 && wordIndex < words.length && <span className="cursor" />}
                            </p>

                            {/* Legend */}
                            <div className={`legend ${step >= 5 ? "show" : ""}`}
                                style={{
                                    marginTop: "20px", paddingTop: "14px",
                                    borderTop: "1px solid #ececec",
                                    display: "flex", gap: "18px"
                                }}>
                                {[["#c8f0d8", "Strong"], ["#fde8c8", "Improve"]].map(([color, label]) => (
                                    <div key={label} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                        <span style={{ width: 11, height: 11, background: color, borderRadius: "3px", display: "inline-block" }} />
                                        <span style={{ fontSize: "13px", color: "#777" }}>{label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Suggestions */}
                        <div style={{ width: "210px", display: "flex", flexDirection: "column", gap: "10px" }}>
                            {suggestions.map((s, i) => {
                                const isSuccess = s.type === "success";
                                const c = isSuccess
                                    ? { bg: "#f0fdf7", border: "#b6ecd4", icon: "#22a06b", text: "#1a6b42" }
                                    : { bg: "#fff9f3", border: "#f5d4aa", icon: "#d97706", text: "#b45309" };
                                return (
                                    <div
                                        key={i}
                                        className={`suggestion-chip ${visibleSuggestions > i ? "show" : ""}`}
                                        style={{
                                            background: c.bg,
                                            border: `1.5px solid ${c.border}`,
                                            borderRadius: "12px",
                                            padding: "13px 16px",
                                            display: "flex", alignItems: "center", gap: "10px",
                                        }}
                                    >
                                        <span style={{
                                            width: 20, height: 20, borderRadius: "50%",
                                            border: `2px solid ${c.icon}`, color: c.icon,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            fontSize: "10px", fontWeight: 800, flexShrink: 0,
                                        }}>
                                            {s.icon}
                                        </span>
                                        <span style={{ color: c.text, fontWeight: 600, fontSize: "13px" }}>{s.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Improved version */}
                <div
                    className={`improved-card ${step >= 9 ? "show" : ""}`}
                    style={{
                        background: "white",
                        borderRadius: "16px",
                        border: "2px solid #e0e0e0",
                        padding: "20px 24px",
                        marginBottom: "16px",
                        transition: "border-color 0.4s ease",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                        <span style={{
                            background: "#e6f9f0", color: "#22a06b",
                            fontWeight: 700, fontSize: "10px",
                            letterSpacing: "0.1em", padding: "4px 10px",
                            borderRadius: "999px", border: "1px solid #b6ecd4"
                        }}>
                            IMPROVED VERSION
                        </span>
                        <span style={{ color: "#22a06b", fontSize: "16px" }}>→</span>
                    </div>
                    <p style={{
                        fontStyle: "italic",
                        fontSize: "16px", color: "#333", lineHeight: 1.65
                    }}>
                        "...which I achieved by containerizing the legacy app and implementing parallel build stages..."
                    </p>
                </div>

                {/* Footer */}
                <p className={`footer-text ${step >= 9 ? "show" : ""}`}
                    style={{ textAlign: "center", color: "#aaa", fontSize: "14px" }}>
                    We don't just grade—we show you exactly what to change
                </p>
            </div>
        </div>
    );
}

export default AIFeedbackAnimation;
