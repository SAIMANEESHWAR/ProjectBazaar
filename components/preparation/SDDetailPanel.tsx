import { useState } from "react";
import SDDiagramRenderer from "./SDDiagramRenderer";
import { DiagramData } from "../../data/prepDiagramTypes";
import PrepRichContentRenderer, {
  isRichHtmlContent,
} from "./PrepRichContentRenderer";
import PrepLockedPremiumBlock from "./PrepLockedPremiumBlock";
import { usePrepContentAccess } from "./prepContentAccess";

export interface SDQuestion {
  id: string;
  title: string;
  description: string;
  section: string;
  difficulty: "Easy" | "Medium" | "Hard";
  designType: string;
  contentKind?: "concept" | "question" | "practice" | "resource";
  isSolved?: boolean;
  isBookmarked?: boolean;
  content?: string;
  diagramUrl?: string;
  diagramData?: DiagramData;
  additionalImageUrls?: string[];
  resourceLinks?: string[];
  pdfUrl?: string;
  thumbnailUrl?: string;
  displayOrder?: number;
  topics?: string[];
}

type MediaTab = "solution" | "diagram" | "images";

export function SDDetailPanel({
  q,
  variant = "default",
}: {
  q: SDQuestion;
  variant?: "default" | "nocturnal";
}) {
  const isNocturnal = variant === "nocturnal";
  const { canViewAnswers, promptUpgrade } = usePrepContentAccess();
  const rawContent = q.content ?? "";
  const embeddedRegex = /__DIAGRAM_DATA_START__([\s\S]*?)__DIAGRAM_DATA_END__/;
  const embMatch = rawContent.match(embeddedRegex);

  let displayContent = rawContent;
  let embeddedData: DiagramData | null = null;
  if (embMatch) {
    displayContent = rawContent.replace(embeddedRegex, "").trim();
    try {
      embeddedData = JSON.parse(embMatch[1]);
    } catch {
      /* ignore */
    }
  }

  const finalDiagramData = q.diagramData || embeddedData;
  const hasDiagram = !!(finalDiagramData || q.diagramUrl);
  const hasImages = !!q.additionalImageUrls?.length;
  const hasSolution = !!displayContent;

  const visibleTabs: { id: MediaTab; label: string }[] = [
    ...(hasSolution ? [{ id: "solution" as MediaTab, label: "Solution" }] : []),
    ...(hasDiagram ? [{ id: "diagram" as MediaTab, label: "Diagram" }] : []),
    ...(hasImages
      ? [
          {
            id: "images" as MediaTab,
            label: `Images (${q.additionalImageUrls!.length})`,
          },
        ]
      : []),
  ];

  const [activeTab, setActiveTab] = useState<MediaTab>(
    visibleTabs[0]?.id ?? "solution",
  );
  const solutionText = displayContent.startsWith("Solution:")
    ? displayContent.substring(9).trim()
    : displayContent;
  const isPointwise = /\(\d+\)/.test(solutionText);

  const labelClass = isNocturnal
    ? "mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500"
    : "font-semibold text-gray-900 dark:text-white mb-1";
  const bodyClass = isNocturnal
    ? "text-[15px] leading-relaxed text-neutral-200 md:text-base"
    : "text-sm text-gray-600 dark:text-gray-300";
  const mutedClass = isNocturnal ? "text-neutral-400" : "text-gray-400";
  const tabBorder = isNocturnal ? "border-white/10" : "border-gray-600 dark:border-gray-700";

  return (
    <div
      className={`leading-relaxed space-y-4 ${isNocturnal ? "text-neutral-200" : "text-sm text-gray-700 dark:text-gray-300 space-y-3"}`}
    >
      <div>
        <p className={labelClass}>Description</p>
        {isRichHtmlContent(q.description) ? (
          <PrepRichContentRenderer
            html={q.description}
            variant={variant}
            className={isNocturnal ? "text-[15px]" : "text-sm"}
          />
        ) : (
          <p className={bodyClass}>{q.description}</p>
        )}
      </div>

      {visibleTabs.length > 1 && (
        <div className={`flex gap-0 border-b ${tabBorder}`}>
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                if (!canViewAnswers) {
                  promptUpgrade();
                  return;
                }
                setActiveTab(t.id);
              }}
              className={`px-4 py-2 text-xs font-semibold border-b-2 transition-colors ${
                activeTab === t.id
                  ? "text-orange-400 border-orange-400"
                  : `${mutedClass} border-transparent hover:text-neutral-200`
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === "solution" && hasSolution && (
        <div>
          {visibleTabs.length === 1 && <p className={labelClass}>Solution</p>}
          {canViewAnswers ? (
            isRichHtmlContent(solutionText) ? (
              <PrepRichContentRenderer
                html={solutionText}
                variant={isNocturnal ? "nocturnal" : "default"}
              />
            ) : isPointwise ? (
              <ul className="list-none space-y-2 mt-1">
                {solutionText
                  .split(/\s*(?=\(\d+\))/)
                  .filter((p) => p.trim())
                  .map((point, idx) => (
                    <li
                      key={idx}
                      className={`flex gap-2 ${isNocturnal ? bodyClass : "text-gray-600 dark:text-gray-300 text-sm"}`}
                    >
                      <span className="shrink-0 text-orange-500 font-bold">•</span>
                      <span>{point.replace(/^\(\d+\)\s*/, "")}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className={`whitespace-pre-wrap ${bodyClass}`}>{solutionText}</p>
            )
          ) : (
            <PrepLockedPremiumBlock
              title="Solution locked"
              message="Upgrade to Premium to view system design solutions and diagrams."
              onUpgrade={promptUpgrade}
            />
          )}
        </div>
      )}

      {activeTab === "diagram" && (
        <div className="mt-1">
          {canViewAnswers ? (
            finalDiagramData ? (
              <SDDiagramRenderer data={finalDiagramData} />
            ) : q.diagramUrl ? (
              /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(q.diagramUrl) ? (
                <img
                  src={q.diagramUrl}
                  alt="Architecture diagram"
                  className={`max-w-full rounded-lg shadow-sm max-h-80 object-contain ${isNocturnal ? "border border-white/10" : "border border-gray-600"}`}
                />
              ) : (
                <a
                  href={q.diagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:underline text-sm"
                >
                  View diagram ↗
                </a>
              )
            ) : null
          ) : (
            <PrepLockedPremiumBlock
              compact
              title="Diagram locked"
              message="Upgrade to Premium to view architecture diagrams."
              onUpgrade={promptUpgrade}
            />
          )}
        </div>
      )}

      {activeTab === "images" &&
        q.additionalImageUrls &&
        q.additionalImageUrls.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            {canViewAnswers ? (
              q.additionalImageUrls.map((url, i) => (
                <div
                  key={i}
                  className={`rounded-lg overflow-hidden ${isNocturnal ? "border border-white/10 bg-[#141414]" : "border border-gray-600 bg-gray-900"}`}
                >
                  <img
                    src={url}
                    alt={`Additional image ${i + 1}`}
                    className="w-full object-contain max-h-64"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      if (el.parentElement)
                        el.parentElement.innerHTML =
                          '<p class="text-xs text-red-400 p-3">Image failed to load</p>';
                    }}
                  />
                </div>
              ))
            ) : (
              <PrepLockedPremiumBlock
                compact
                title="Images locked"
                message="Upgrade to Premium to view reference images."
                onUpgrade={promptUpgrade}
              />
            )}
          </div>
        )}

      {q.topics && q.topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {q.topics.map((t) => (
            <span
              key={t}
              className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full shadow-sm transition-transform hover:scale-105 ${
                isNocturnal
                  ? "bg-white/5 text-neutral-300 border border-white/10"
                  : "bg-gray-800 dark:bg-gray-700 text-white border border-gray-700 dark:border-gray-600"
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
