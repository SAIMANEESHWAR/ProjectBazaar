import React from 'react';
import { LOREM_SHORT } from './lorem';

/** Static hackathons layout — matches real page structure, soft placeholders */
const HackathonsPreview: React.FC = () => (
  <div className="bg-white min-h-full p-6 md:p-8">
    <p className="text-gray-600 text-sm mb-5 max-w-2xl">{LOREM_SHORT}</p>

    <div className="rounded-xl bg-gradient-to-r from-orange-50/80 to-amber-50/50 border border-orange-100/80 px-5 py-3.5 mb-5 flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Hackathons integrated from:</span>
      <div className="flex gap-2">
        {['U', 'D', 'H', 'T', 'S'].map((l) => (
          <span
            key={l}
            className="w-9 h-9 rounded-full bg-white border border-gray-200/80 shadow-sm flex items-center justify-center text-[10px] font-bold text-gray-500"
          >
            {l}
          </span>
        ))}
      </div>
    </div>

    <div className="flex flex-wrap gap-2 mb-5">
      {['unstop', 'devfolio', 'hackerrank', 'techgig', 'skillenza'].map((p, i) => (
        <span
          key={p}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium ${
            i === 0
              ? 'bg-[#ff7a00] text-white shadow-sm'
              : 'bg-gray-50 text-gray-600 border border-gray-200/80'
          }`}
        >
          {p}
        </span>
      ))}
    </div>

    <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3.5 mb-8">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white border border-gray-200 text-gray-400 text-sm">
        ⌕
      </span>
      <span className="text-sm text-gray-400">
        Search hackathons by name, platform, organizer, or tags…
      </span>
    </div>

    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
      <aside className="xl:col-span-3">
        <div className="rounded-xl border border-gray-200/90 bg-gray-50/30 p-5">
          <p className="font-bold text-gray-900 mb-4">Filters</p>
          {['Status', 'Event Type'].map((section) => (
            <div key={section} className="mb-4 last:mb-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {section}
              </p>
              <div className="flex flex-wrap gap-1.5">
                <span className="px-2.5 py-1 rounded-md bg-[#ff7a00] text-white text-xs font-medium">
                  All
                </span>
                <span className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-xs text-gray-600">
                  Live
                </span>
                <span className="px-2.5 py-1 rounded-md border border-gray-200 bg-white text-xs text-gray-600">
                  Upcoming
                </span>
              </div>
            </div>
          ))}
        </div>
      </aside>

      <div className="xl:col-span-6 space-y-4">
        <p className="text-sm text-gray-500 font-medium">Showing 12 hackathons</p>
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="rounded-xl border border-gray-200/90 bg-white p-5 flex gap-5 shadow-sm"
          >
            <div className="flex-1 min-w-0 space-y-2">
              <h3 className="font-bold text-gray-900 text-lg leading-snug">
                Lorem ipsum hackathon challenge {n}
              </h3>
              <p className="text-sm text-blue-600/90">platform.example.com</p>
              <p className="text-xs text-gray-500">Online · Remote</p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 text-xs font-medium">
                  Online Hackathon
                </span>
                <span className="text-xs text-gray-400">Posted May 13, 2026</span>
                <span className="text-xs font-medium text-orange-600">5 days left</span>
              </div>
            </div>
            <div className="w-[88px] h-[88px] rounded-xl bg-gradient-to-br from-orange-100 via-orange-50 to-amber-50 border border-orange-100/60 shrink-0 flex items-center justify-center">
              <span className="text-2xl opacity-40">🏆</span>
            </div>
          </div>
        ))}
      </div>

      <aside className="xl:col-span-3">
        <p className="font-bold text-gray-900 mb-4">Featured</p>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="rounded-xl border border-gray-200/90 bg-white p-3.5 flex gap-3 shadow-sm"
            >
              <div className="w-11 h-11 rounded-lg bg-gradient-to-br from-orange-100 to-amber-50 border border-orange-100/50 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  Lorem event {n}
                </p>
                <p className="text-xs text-blue-600/80 truncate">devfolio.com</p>
                <span className="inline-block mt-1.5 text-[10px] font-medium px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">
                  Upcoming
                </span>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  </div>
);

export default HackathonsPreview;
