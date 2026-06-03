import { useState } from "react";
import PrepRichContentRenderer, {
  isRichHtmlContent,
  richHtmlToPlainText,
} from "./PrepRichContentRenderer";
import { type SDQuestion } from "./SDDetailPanel";

export interface PrepSystemDesignResourcesViewProps {
  resources: SDQuestion[];
  loading: boolean;
  viewMode: "table" | "grid";
}

export default function PrepSystemDesignResourcesView({
  resources,
  loading,
  viewMode,
}: PrepSystemDesignResourcesViewProps) {
  const [selected, setSelected] = useState<SDQuestion | null>(null);

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-500">Loading resources...</p>
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
        <p className="text-gray-500 font-medium">No resources available yet.</p>
      </div>
    );
  }

  if (selected) {
    const links = selected.resourceLinks ?? [];
    return (
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-200">
          <div>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-sm text-orange-600 hover:text-orange-700 mb-2"
            >
              ← Back to resources
            </button>
            <h2 className="text-xl font-bold text-gray-900">{selected.title}</h2>
            {isRichHtmlContent(selected.description) ? (
              <PrepRichContentRenderer
                html={selected.description}
                className="text-sm text-gray-500 mt-1"
              />
            ) : (
              <p className="text-sm text-gray-500 mt-1">{selected.description}</p>
            )}
          </div>
          {selected.thumbnailUrl && (
            <img
              src={selected.thumbnailUrl}
              alt=""
              className="w-24 h-24 rounded-lg object-cover border border-gray-200 shrink-0"
            />
          )}
        </div>
        <div className="p-5 space-y-4">
          {links.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Links</h3>
              <ul className="space-y-2">
                {links.map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-orange-600 hover:underline break-all"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {selected.pdfUrl && (
            <div>
              <a
                href={selected.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg"
              >
                Download PDF
              </a>
            </div>
          )}
          {selected.content?.trim() && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Notes</h3>
              <PrepRichContentRenderer html={selected.content} />
            </div>
          )}
        </div>
      </div>
    );
  }

  if (viewMode === "grid") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {resources.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setSelected(r)}
            className="text-left bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md hover:border-gray-300 transition-all"
          >
            {r.thumbnailUrl ? (
              <img src={r.thumbnailUrl} alt="" className="w-full h-36 object-cover" />
            ) : (
              <div className="w-full h-36 bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
                <span className="text-3xl">📚</span>
              </div>
            )}
            <div className="p-4">
              <h4 className="font-semibold text-gray-900 text-sm">{r.title}</h4>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{richHtmlToPlainText(r.description)}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(r.resourceLinks?.length ?? 0) > 0 && (
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                    {r.resourceLinks!.length} link{r.resourceLinks!.length > 1 ? "s" : ""}
                  </span>
                )}
                {r.pdfUrl && (
                  <span className="text-xs px-2 py-0.5 bg-rose-50 text-rose-600 rounded-full">PDF</span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Resource</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Section</th>
            <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Assets</th>
          </tr>
        </thead>
        <tbody>
          {resources.map((r) => (
            <tr
              key={r.id}
              onClick={() => setSelected(r)}
              className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50 cursor-pointer"
            >
              <td className="px-5 py-4">
                <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{richHtmlToPlainText(r.description)}</p>
              </td>
              <td className="px-5 py-4 text-sm text-gray-500">{r.section}</td>
              <td className="px-5 py-4 text-xs text-gray-500">
                {[
                  (r.resourceLinks?.length ?? 0) > 0 && `${r.resourceLinks!.length} links`,
                  r.pdfUrl && "PDF",
                ]
                  .filter(Boolean)
                  .join(" · ") || "Notes"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
