import React, { useEffect } from 'react';

type PublicToolSeoIntroProps = {
  title: string;
  definition: string;
  bullets: string[];
  learnMoreHref: string;
  learnMoreLabel: string;
};

/**
 * Answer-first marketing block shown above gated resume/portfolio tools
 * so public landers remain useful before auth/subscription.
 */
const PublicToolSeoIntro: React.FC<PublicToolSeoIntroProps> = ({
  title,
  definition,
  bullets,
  learnMoreHref,
  learnMoreLabel,
}) => {
  useEffect(() => {
    const id = 'public-tool-howto-jsonld';
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = id;
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: title,
      description: definition,
      isPartOf: { '@type': 'WebSite', name: 'CodeXCareer', url: 'https://codexcareer.com' },
    });
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [title, definition]);

  return (
    <section className="mb-8 rounded-2xl border border-[#eadfce] bg-[#fff8f1] p-6 sm:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a]">{title}</h1>
      <p className="mt-3 text-base text-[#555] leading-relaxed max-w-3xl">{definition}</p>
      <ul className="mt-4 list-disc pl-5 space-y-1 text-[#333] text-sm sm:text-base">
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        <a href={learnMoreHref} className="font-semibold text-[#ff7a00] hover:underline">
          {learnMoreLabel}
        </a>
        {' · '}
        <a href="/pricing" className="text-[#ff7a00] hover:underline">
          View pricing
        </a>
      </p>
    </section>
  );
};

export default PublicToolSeoIntro;
