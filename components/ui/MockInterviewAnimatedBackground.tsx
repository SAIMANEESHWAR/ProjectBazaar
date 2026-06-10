import React, { useEffect, useRef } from 'react';

type ArcDef = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  startAngle: number;
  endAngle: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  pulsePhase: number;
};

type ArcTraveler = {
  t: number;
  speed: number;
  arcIndex: number;
};

const ARCS: ArcDef[] = [
  { cx: 0.5, cy: 0.52, rx: 0.44, ry: 0.3, startAngle: Math.PI * 0.12, endAngle: Math.PI * 0.88 },
  { cx: 0.12, cy: 0.38, rx: 0.28, ry: 0.38, startAngle: -Math.PI * 0.25, endAngle: Math.PI * 0.55 },
  { cx: 0.88, cy: 0.42, rx: 0.26, ry: 0.34, startAngle: Math.PI * 0.45, endAngle: Math.PI * 1.35 },
  { cx: 0.35, cy: 0.65, rx: 0.2, ry: 0.15, startAngle: Math.PI * 0.05, endAngle: Math.PI * 0.95 },
];

const BOKEH_SPOTS = [
  { x: 0.1, y: 0.22, r: 130, a: 0.07 },
  { x: 0.9, y: 0.68, r: 160, a: 0.06 },
  { x: 0.78, y: 0.12, r: 90, a: 0.05 },
  { x: 0.28, y: 0.82, r: 110, a: 0.055 },
  { x: 0.55, y: 0.3, r: 200, a: 0.04 },
];

function isDarkMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.documentElement.classList.contains('dark');
}

function getArcPoint(arc: ArcDef, t: number, width: number, height: number) {
  const angle = arc.startAngle + (arc.endAngle - arc.startAngle) * t;
  return {
    x: width * arc.cx + Math.cos(angle) * width * arc.rx,
    y: height * arc.cy + Math.sin(angle) * height * arc.ry,
  };
}

type MockInterviewAnimatedBackgroundProps = {
  className?: string;
  /** When true, renders a static gradient only (accessibility / perf). */
  staticOnly?: boolean;
};

export const MockInterviewAnimatedBackground: React.FC<MockInterviewAnimatedBackgroundProps> = ({
  className = '',
  staticOnly = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const darkRef = useRef(isDarkMode());

  useEffect(() => {
    if (staticOnly) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let time = 0;

    const particles: Particle[] = [];
    const arcTravelers: ArcTraveler[] = [];

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const initParticles = () => {
      particles.length = 0;
      const count = Math.max(24, Math.floor((width * height) / 18000));
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.08 - 0.04,
          size: Math.random() * 1.8 + 0.4,
          opacity: Math.random() * 0.45 + 0.15,
          pulsePhase: Math.random() * Math.PI * 2,
        });
      }

      arcTravelers.length = 0;
      for (let i = 0; i < 14; i++) {
        arcTravelers.push({
          t: Math.random(),
          speed: 0.00025 + Math.random() * 0.00045,
          arcIndex: i % ARCS.length,
        });
      }
    };

    const drawBackground = () => {
      const dark = darkRef.current;
      const cx = width * 0.5;
      const cy = height * 0.34;
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.78);

      if (dark) {
        grad.addColorStop(0, '#1a1714');
        grad.addColorStop(0.35, '#15121a');
        grad.addColorStop(0.7, '#12111a');
        grad.addColorStop(1, '#0e0d12');
      } else {
        grad.addColorStop(0, '#FFFCF8');
        grad.addColorStop(0.3, '#FFF7EE');
        grad.addColorStop(0.65, '#F5EBE0');
        grad.addColorStop(1, '#EDE3D6');
      }

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    };

    const drawArc = (arc: ArcDef, alpha: number, lineWidth: number) => {
      const dark = darkRef.current;
      ctx.beginPath();
      const steps = 90;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const pt = getArcPoint(arc, t, width, height);
        if (i === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = dark
        ? `rgba(251, 146, 60, ${alpha * 0.85})`
        : `rgba(249, 150, 60, ${alpha})`;
      ctx.lineWidth = lineWidth;
      ctx.shadowColor = dark ? 'rgba(251, 146, 60, 0.35)' : 'rgba(249, 115, 22, 0.45)';
      ctx.shadowBlur = dark ? 6 : 10;
      ctx.stroke();
      ctx.shadowBlur = 0;
    };

    const drawMeshCorner = (side: 'left' | 'right', now: number) => {
      const dark = darkRef.current;
      const ox = side === 'left' ? 0 : width;
      const dir = side === 'left' ? 1 : -1;
      const lineAlpha = dark ? 0.1 : 0.14;

      ctx.strokeStyle = `rgba(234, 150, 80, ${lineAlpha})`;
      ctx.lineWidth = 0.6;

      for (let i = 0; i < 20; i++) {
        const y1 = (i / 20) * height * 0.48;
        const x2 = ox + dir * (70 + Math.sin(now * 0.00025 + i * 0.7) * 18);
        const y2 = y1 + 55 + i * 9;
        ctx.beginPath();
        ctx.moveTo(ox, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      for (let i = 0; i < 14; i++) {
        const x1 = ox + dir * (16 + i * 11);
        const x2 = ox + dir * (95 + Math.cos(now * 0.00018 + i) * 22);
        const y2 = height * 0.42;
        ctx.beginPath();
        ctx.moveTo(x1, 0);
        ctx.bezierCurveTo(
          ox + dir * 55,
          height * 0.14,
          ox + dir * 38,
          height * 0.26,
          x2,
          y2,
        );
        ctx.stroke();
      }
    };

    const drawBokeh = (now: number) => {
      const dark = darkRef.current;
      for (const spot of BOKEH_SPOTS) {
        const pulse = 0.82 + 0.18 * Math.sin(now * 0.0009 + spot.x * 12);
        const sx = spot.x * width;
        const sy = spot.y * height;
        const r = spot.r * pulse;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
        const a = spot.a * pulse * (dark ? 0.65 : 1);

        grad.addColorStop(0, `rgba(251, 191, 36, ${a})`);
        grad.addColorStop(0.45, `rgba(249, 115, 22, ${a * 0.45})`);
        grad.addColorStop(1, 'rgba(249, 115, 22, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const animate = (now: number) => {
      if (!time) time = now;

      ctx.clearRect(0, 0, width, height);
      drawBackground();
      drawBokeh(now);

      ARCS.forEach((arc, i) => {
        const breathe = 0.72 + 0.28 * Math.sin(now * 0.00075 + i * 1.4);
        drawArc(arc, 0.16 * breathe, 1.1);
        drawArc(arc, 0.07 * breathe, 2.4);
      });

      drawMeshCorner('left', now);
      drawMeshCorner('right', now);

      arcTravelers.forEach((traveler) => {
        traveler.t += traveler.speed;
        if (traveler.t > 1) traveler.t = 0;
        const pt = getArcPoint(ARCS[traveler.arcIndex], traveler.t, width, height);
        const glow = 0.55 + 0.45 * Math.sin(now * 0.0028 + traveler.t * 12);
        const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 14);
        const dark = darkRef.current;

        grad.addColorStop(0, dark ? `rgba(255, 210, 140, ${0.75 * glow})` : `rgba(255, 220, 150, ${0.9 * glow})`);
        grad.addColorStop(0.4, `rgba(249, 150, 60, ${0.45 * glow})`);
        grad.addColorStop(1, 'rgba(249, 115, 22, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7 + glow * 5, 0, Math.PI * 2);
        ctx.fill();
      });

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -4) p.x = width + 4;
        if (p.x > width + 4) p.x = -4;
        if (p.y < -4) p.y = height + 4;
        if (p.y > height + 4) p.y = -4;

        const twinkle = p.opacity * (0.45 + 0.55 * Math.sin(now * 0.0018 + p.pulsePhase));
        const dark = darkRef.current;
        ctx.fillStyle = dark ? `rgba(251, 191, 36, ${twinkle * 0.7})` : `rgba(255, 200, 120, ${twinkle})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    const onThemeChange = () => {
      darkRef.current = isDarkMode();
    };

    resize();
    initParticles();
    rafRef.current = requestAnimationFrame(animate);

    const ro = new ResizeObserver(() => {
      resize();
      initParticles();
    });
    ro.observe(canvas);

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', onThemeChange);

    const observer = new MutationObserver(onThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      mq.removeEventListener('change', onThemeChange);
      observer.disconnect();
    };
  }, [staticOnly]);

  if (staticOnly) {
    return (
      <div
        className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,#FFFCF8_0%,#FFF7EE_35%,#F5EBE0_70%,#EDE3D6_100%)] dark:bg-[radial-gradient(ellipse_80%_60%_at_50%_35%,#1a1714_0%,#15121a_40%,#12111a_75%,#0e0d12_100%)]" />
      </div>
    );
  }

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
};

export default MockInterviewAnimatedBackground;
