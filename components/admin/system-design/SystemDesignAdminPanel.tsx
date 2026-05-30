import SDContentSection from "./SDContentSection";
import {
  type AdminSDItem,
  type SDDesignType,
  type SDSubSection,
  type SDTabId,
  SD_DESIGN_TYPES,
  SD_SUB_SECTIONS,
  SD_TAB_CONFIG,
  getSdTabId,
} from "./types";

export interface SystemDesignAdminPanelProps {
  designType: SDDesignType;
  subSection: SDSubSection;
  onDesignTypeChange: (type: SDDesignType) => void;
  onSubSectionChange: (section: SDSubSection) => void;
  sdData: Record<SDTabId, AdminSDItem[]>;
  loading: boolean;
  error: string | null;
  viewMode: "table" | "grid";
  onViewChange: (mode: "table" | "grid") => void;
  onAdd: (tabId: SDTabId) => void;
  onRetry: (tabId: SDTabId) => void;
  onEdit: (item: AdminSDItem, tabId: SDTabId) => void;
  onDelete: (item: AdminSDItem, tabId: SDTabId) => void;
  onMoveItem: (item: AdminSDItem, tabId: SDTabId, direction: "up" | "down", scopeItems?: AdminSDItem[]) => void;
  reordering: boolean;
}

export default function SystemDesignAdminPanel({
  designType,
  subSection,
  onDesignTypeChange,
  onSubSectionChange,
  sdData,
  loading,
  error,
  viewMode,
  onViewChange,
  onAdd,
  onRetry,
  onEdit,
  onDelete,
  onMoveItem,
  reordering,
}: SystemDesignAdminPanelProps) {
  const tabId = getSdTabId(designType, subSection);
  const cfg = SD_TAB_CONFIG[tabId];
  const isQuestion = cfg.contentKind === "question";

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            System Design
          </p>
          <div className="flex flex-wrap gap-2">
            {SD_DESIGN_TYPES.map((dt) => (
              <button
                key={dt.id}
                type="button"
                onClick={() => onDesignTypeChange(dt.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  designType === dt.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {dt.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">
            Content type
          </p>
          <div className="flex flex-wrap gap-2">
            {SD_SUB_SECTIONS.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => onSubSectionChange(sub.id)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  subSection === sub.id
                    ? "bg-orange-500 text-white shadow-sm"
                    : "text-gray-600 hover:bg-orange-50 border border-gray-200"
                }`}
              >
                {sub.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <SDContentSection
        title={cfg.label}
        count={sdData[tabId].length}
        btnLabel={cfg.addLabel}
        items={sdData[tabId]}
        loading={loading}
        error={error}
        viewMode={viewMode}
        onViewChange={onViewChange}
        onAdd={() => onAdd(tabId)}
        onRetry={() => onRetry(tabId)}
        onEdit={(item) => onEdit(item, tabId)}
        onDelete={(item) => onDelete(item, tabId)}
        onMoveItem={(item, direction, scopeItems) => onMoveItem(item, tabId, direction, scopeItems)}
        reordering={reordering}
        showImagesColumn={isQuestion}
        contentKind={cfg.contentKind}
      />
    </div>
  );
}
