import React, { useState, useEffect, useCallback } from "react";
import { prepAdminApi, type ContentType } from "../../services/preparationApi";
import SDConceptModal from "./system-design/SDConceptModal";
import SDQuestionModal from "./system-design/SDQuestionModal";
import SDResourceModal from "./system-design/SDResourceModal";
import SystemDesignAdminPanel from "./system-design/SystemDesignAdminPanel";
import CoreSubjectsAdminPanel from "./core-subjects/CoreSubjectsAdminPanel";
import CoreSubjectCategoryModal from "./core-subjects/CoreSubjectCategoryModal";
import CoreSubjectQuizModal from "./core-subjects/CoreSubjectQuizModal";
import {
  mapCoreSubjectQuizFromApi,
  mapCoreSubjectQuizToApi,
  type CoreSubjectTopicQuiz,
} from "../../data/coreSubjectQuizTypes";
import {
  mapCoreSubjectFromApi,
  mapCoreSubjectToApi,
  mapCoreSubjectCategoryFromApi,
  mapCoreSubjectCategoryToApi,
  getCoreSubjectTitle,
  type AdminCoreSubjectItem,
  type CoreSubject,
} from "./core-subjects/coreSubjectsAdmin";
import {
  computeReorderUpdates,
  computeSdMoveUpdates,
  computeTopicMoveUpdates,
  computeTopicReorderUpdates,
  nextDisplayOrder,
  sortByDisplayOrder,
} from "./system-design/sdDisplayOrder";
import { groupByTopic } from "../../lib/prepTopicGrouping";
import {
  type AdminSDItem,
  type SDDesignType,
  type SDSubSection,
  type SDTabId,
  SD_TAB_CONFIG,
  ALL_SD_TAB_IDS,
  emptySdDataRecord,
  getSdTabId,
  subSectionFromContentKind,
} from "./system-design/types";

type PrepTab =
  | "overview"
  | "interview-questions"
  | "dsa"
  | "quizzes"
  | "cold-dms"
  | "job-portals"
  | "notes"
  | "roadmaps"
  | "mass-recruitment"
  | "positions"
  | "system-design"
  | "oops"
  | "language"
  | "core-subjects";

const tabs: { id: PrepTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "interview-questions", label: "Interview Qs" },
  { id: "dsa", label: "DSA" },
  { id: "system-design", label: "System Design" },
  { id: "oops", label: "OOPs" },
  { id: "language", label: "Language" },
  { id: "core-subjects", label: "Core Subjects" },
  { id: "quizzes", label: "Quizzes" },
  { id: "cold-dms", label: "Cold DMs" },
  { id: "job-portals", label: "Job Portals" },
  { id: "notes", label: "Notes" },
  { id: "roadmaps", label: "Roadmaps" },
  { id: "mass-recruitment", label: "Mass Recruit" },
  { id: "positions", label: "Positions" },
];

const EditIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
    />
  </svg>
);

const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-4 w-4"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const ActionBtns: React.FC<{
  name: string;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ name, onEdit, onDelete }) => (
  <div className="flex gap-1">
    <button
      onClick={onEdit}
      title={`Edit ${name}`}
      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
    >
      <EditIcon />
    </button>
    <button
      onClick={onDelete}
      title={`Delete ${name}`}
      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
    >
      <DeleteIcon />
    </button>
  </div>
);

const DiffBadge: React.FC<{ d: string }> = ({ d }) => (
  <span
    className={`px-2.5 py-1 text-xs font-semibold rounded-full ${d === "Easy" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : d === "Medium" ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" : "bg-red-50 text-red-700 ring-1 ring-red-200"}`}
  >
    {d}
  </span>
);

const ViewToggle: React.FC<{
  view: "table" | "grid";
  onChange: (v: "table" | "grid") => void;
}> = ({ view, onChange }) => (
  <div className="flex rounded-lg border border-gray-200 overflow-hidden">
    <button
      onClick={() => onChange("table")}
      className={`p-1.5 transition-all ${view === "table" ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:text-gray-600"}`}
      title="Table view"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 6h16M4 10h16M4 14h16M4 18h16"
        />
      </svg>
    </button>
    <button
      onClick={() => onChange("grid")}
      className={`p-1.5 transition-all ${view === "grid" ? "bg-gray-900 text-white" : "bg-white text-gray-400 hover:text-gray-600"}`}
      title="Grid view"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
        />
      </svg>
    </button>
  </div>
);

const SectionHeader: React.FC<{
  title: string;
  count: number;
  btnLabel: string;
  view: "table" | "grid";
  onViewChange: (v: "table" | "grid") => void;
  onAdd?: () => void;
}> = ({ title, count, btnLabel, view, onViewChange, onAdd }) => (
  <div className="p-5 border-b border-gray-200 flex items-center justify-between gap-3">
    <h3 className="text-lg font-semibold text-gray-900">
      {title}{" "}
      <span className="text-sm font-normal text-gray-400">({count})</span>
    </h3>
    <div className="flex items-center gap-3">
      <ViewToggle view={view} onChange={onViewChange} />
      <button
        onClick={onAdd}
        className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors shadow-sm"
      >
        {btnLabel}
      </button>
    </div>
  </div>
);

const CardShell: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => (
  <div
    className={`group bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md hover:border-gray-300 transition-all duration-200 ${className}`}
  >
    {children}
  </div>
);

const PrepContentManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PrepTab>("overview");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "info";
  } | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const [iqData, setIqData] = useState<any[]>([]);
  const [dsaData, setDsaData] = useState<any[]>([]);
  const [quizData, setQuizData] = useState<any[]>([]);
  const [dmData, setDmData] = useState<any[]>([]);
  const [jpData, setJpData] = useState<any[]>([]);
  const [noteData, setNoteData] = useState<any[]>([]);
  const [rmData, setRmData] = useState<any[]>([]);
  const [mrData, setMrData] = useState<any[]>([]);
  const [posData, setPosData] = useState<any[]>([]);
  const [sdData, setSdData] = useState<Record<SDTabId, AdminSDItem[]>>(emptySdDataRecord);
  const [sdDesignType, setSdDesignType] = useState<SDDesignType>("hld");
  const [sdSubSection, setSdSubSection] = useState<SDSubSection>("questions");
  const [sdLoading, setSdLoading] = useState(false);
  const [sdError, setSdError] = useState<string | null>(null);
  const [oopsData, setOopsData] = useState<any[]>([]);
  const [langData, setLangData] = useState<any[]>([]);
  const [coreSubjectsData, setCoreSubjectsData] = useState<AdminCoreSubjectItem[]>([]);
  const [coreSubjectCategories, setCoreSubjectCategories] = useState<CoreSubject[]>([]);
  const [csSubject, setCsSubject] = useState("");
  const [csCategoriesLoading, setCsCategoriesLoading] = useState(false);
  const [csLoading, setCsLoading] = useState(false);
  const [csError, setCsError] = useState<string | null>(null);
  const [csReordering, setCsReordering] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);

  // SD modal state
  const [sdModal, setSdModal] = useState<{
    open: boolean;
    tabId: SDTabId;
    item?: AdminSDItem | null;
  }>({ open: false, tabId: "hld-questions" });
  const [sdSaving, setSdSaving] = useState(false);
  const [sdReordering, setSdReordering] = useState(false);
  // Delete confirmation modal state (for SD; other tabs use window.confirm for now)
  const [deleteModal, setDeleteModal] = useState<{
    id: string;
    name: string;
    tabId: SDTabId;
  } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [csModal, setCsModal] = useState<{
    open: boolean;
    item?: AdminCoreSubjectItem | null;
  }>({ open: false });
  const [csSaving, setCsSaving] = useState(false);
  const [csDeleteModal, setCsDeleteModal] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [csCategoryModal, setCsCategoryModal] = useState<{
    open: boolean;
    item?: CoreSubject | null;
  }>({ open: false });
  const [csCategorySaving, setCsCategorySaving] = useState(false);
  const [csCategoryDeleteModal, setCsCategoryDeleteModal] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [csTopicQuizzes, setCsTopicQuizzes] = useState<CoreSubjectTopicQuiz[]>([]);
  const [csQuizModal, setCsQuizModal] = useState<{
    open: boolean;
    topic: string;
    quiz: CoreSubjectTopicQuiz | null;
  }>({ open: false, topic: "", quiz: null });
  const [csQuizSaving, setCsQuizSaving] = useState(false);

  const loadTabContent = useCallback(async (tab: PrepTab) => {
    const tabMap: Partial<Record<PrepTab, { type: ContentType; setter: React.Dispatch<React.SetStateAction<any[]>> }>> = {
      "interview-questions": { type: "interview_questions", setter: setIqData },
      dsa: { type: "dsa_problems", setter: setDsaData },
      quizzes: { type: "quizzes", setter: setQuizData },
      "cold-dms": { type: "cold_dm_templates", setter: setDmData },
      "job-portals": { type: "job_portals", setter: setJpData },
      notes: { type: "handwritten_notes", setter: setNoteData },
      roadmaps: { type: "roadmaps", setter: setRmData },
      "mass-recruitment": { type: "mass_recruitment", setter: setMrData },
      positions: { type: "position_resources", setter: setPosData },
      oops: { type: "fundamentals", setter: setOopsData },
      language: { type: "fundamentals", setter: setLangData },
    };

    const config = tabMap[tab];
    if (!config) return;

    setContentLoading(true);
    try {
      const resp = await prepAdminApi.listContent(config.type, { limit: 500 });
      if (resp.success) {
        config.setter(resp.items ?? []);
      }
    } catch {
      config.setter([]);
    }
    setContentLoading(false);
  }, []);

  const loadCoreSubjects = useCallback(async () => {
    setCsLoading(true);
    setCsCategoriesLoading(true);
    setCsError(null);
    try {
      const [catResp, conceptResp, quizResp] = await Promise.all([
        prepAdminApi.listContent("core_subjects", {
          limit: 200,
          contentKind: "category",
          sortBy: "displayOrder",
          sortOrder: "asc",
        }),
        prepAdminApi.listContent("core_subjects", {
          limit: 500,
          contentKind: "concept",
          sortBy: "displayOrder",
          sortOrder: "asc",
        }),
        prepAdminApi.listContent("quizzes", {
          limit: 500,
          scope: "core_subjects",
        }),
      ]);

      const categories = catResp.success
        ? (catResp.items ?? []).map((item) =>
            mapCoreSubjectCategoryFromApi(item as Record<string, unknown>),
          )
        : [];

      setCoreSubjectCategories(categories);
      setCsSubject((current) => {
        if (current && categories.some((cat) => cat.subject === current)) return current;
        return categories[0]?.subject ?? "";
      });

      if (conceptResp.success) {
        setCoreSubjectsData(
          (conceptResp.items ?? []).map((item) =>
            mapCoreSubjectFromApi(item as Record<string, unknown>, categories),
          ),
        );
      } else {
        setCsError("Failed to load core subject concepts. Please try again.");
        setCoreSubjectsData([]);
      }

      if (!catResp.success) {
        setCsError("Failed to load subjects. Please try again.");
      }

      setCsTopicQuizzes(
        quizResp.success
          ? (quizResp.items ?? []).map((item) =>
              mapCoreSubjectQuizFromApi(item as Record<string, unknown>),
            )
          : [],
      );
    } catch {
      setCsError("Network error loading core subjects.");
      setCoreSubjectsData([]);
      setCoreSubjectCategories([]);
      setCsTopicQuizzes([]);
      setCsSubject("");
    }
    setCsLoading(false);
    setCsCategoriesLoading(false);
  }, []);

  useEffect(() => {
    if (
      activeTab !== "overview" &&
      activeTab !== "system-design" &&
      activeTab !== "core-subjects"
    ) {
      loadTabContent(activeTab);
    }
  }, [activeTab, loadTabContent]);

  useEffect(() => {
    if (activeTab === "core-subjects") {
      loadCoreSubjects();
    }
  }, [activeTab, loadCoreSubjects]);

  const activeSdTabId = getSdTabId(sdDesignType, sdSubSection);

  const loadSdTab = useCallback(async (tabId: SDTabId) => {
    const { designType, contentKind } = SD_TAB_CONFIG[tabId];
    setSdLoading(true);
    setSdError(null);
    try {
      const resp = await prepAdminApi.listContent<AdminSDItem>("system_design", {
        designType,
        contentKind,
        limit: 200,
      });
      if (resp.success) {
        setSdData((prev) => ({
          ...prev,
          [tabId]: sortByDisplayOrder(resp.items ?? []),
        }));
      } else {
        setSdError(`Failed to load ${SD_TAB_CONFIG[tabId].label}. Please try again.`);
      }
    } catch {
      setSdError("Network error loading system design content.");
    }
    setSdLoading(false);
  }, []);

  useEffect(() => {
    if (activeTab === "system-design") {
      loadSdTab(activeSdTabId);
    }
  }, [activeTab, activeSdTabId, loadSdTab]);

  useEffect(() => {
    ALL_SD_TAB_IDS.forEach((tabId) => {
      loadSdTab(tabId);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (message: string, type: "success" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const confirmDelete = (
    name: string,
    id: string | number,
    setter: React.Dispatch<React.SetStateAction<any[]>>,
  ) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${name}"? This action cannot be undone.`,
      )
    ) {
      setter((prev: any[]) => prev.filter((item: any) => item.id !== id));
      showToast(`"${name}" deleted successfully`, "success");
    }
  };

  const triggerEdit = (name: string) => {
    showToast(`Editing "${name}" — editor modal coming soon`, "info");
  };

  // SD-specific: open delete confirmation modal
  const tabIdForItem = (item: AdminSDItem): SDTabId =>
    getSdTabId(
      item.designType === "lld" ? "lld" : "hld",
      subSectionFromContentKind(item.contentKind),
    );

  const openSdDeleteModal = (item: AdminSDItem, tabId?: SDTabId) => {
    setDeleteModal({
      id: item.id,
      name: item.title,
      tabId: tabId ?? tabIdForItem(item),
    });
  };

  // SD-specific: open add/edit modal
  const openSdAddModal = (tabId: SDTabId) => {
    setSdModal({ open: true, tabId, item: null });
  };
  const openSdEditModal = (item: AdminSDItem, tabId?: SDTabId) => {
    setSdModal({ open: true, tabId: tabId ?? tabIdForItem(item), item });
  };

  // SD delete confirmed
  const handleSdDeleteConfirm = async () => {
    if (!deleteModal) return;
    setDeleteLoading(true);
    const ok = await prepAdminApi.deleteContent(
      "system_design",
      deleteModal.id,
    );
    setDeleteLoading(false);
    if (ok) {
      setSdData((prev) => ({
        ...prev,
        [deleteModal.tabId]: prev[deleteModal.tabId].filter((q) => q.id !== deleteModal.id),
      }));
      showToast(`"${deleteModal.name}" deleted successfully`, "success");
    } else {
      showToast("Delete failed. Please try again.", "info");
    }
    setDeleteModal(null);
  };

  // SD add/edit saved
  const handleSdSave = async (
    formData: Omit<AdminSDItem, "id" | "createdAt" | "updatedAt"> & {
      id?: string;
    },
  ) => {
    setSdSaving(true);
    const tabId = sdModal?.tabId ?? (formData.id ? tabIdForItem(formData as AdminSDItem) : activeSdTabId);
    const isEdit = !!sdModal?.item?.id;
    const payload = {
      ...formData,
      displayOrder:
        typeof formData.displayOrder === "number" && Number.isFinite(formData.displayOrder)
          ? formData.displayOrder
          : isEdit
            ? sdModal?.item?.displayOrder ?? 0
            : nextDisplayOrder(sdData[tabId]),
    };
    const item = await prepAdminApi.putContentSingle<AdminSDItem>(
      "system_design",
      payload as Record<string, unknown>,
    );
    setSdSaving(false);
    if (item) {
      const resolvedTabId = sdModal?.tabId ?? tabIdForItem(item);
      setSdData((prev) => ({
        ...prev,
        [resolvedTabId]: sortByDisplayOrder(
          isEdit
            ? prev[resolvedTabId].map((q) => (q.id === item.id ? item : q))
            : [...prev[resolvedTabId], item],
        ),
      }));
      showToast(
        `"${item.title}" ${isEdit ? "updated" : "added"} successfully`,
        "success",
      );
      setSdModal({ open: false, tabId: sdModal?.tabId ?? "hld-questions" });
    } else {
      showToast("Save failed. Please try again.", "info");
    }
  };

  const applySdDisplayOrderUpdates = async (
    tabId: SDTabId,
    updates: AdminSDItem[] | null,
  ) => {
    if (!updates?.length) return;

    setSdReordering(true);
    try {
      const saved = await Promise.all(
        updates.map((entry) =>
          prepAdminApi.putContentSingle<AdminSDItem>(
            "system_design",
            entry as unknown as Record<string, unknown>,
          ),
        ),
      );

      if (saved.some((entry) => !entry)) {
        showToast("Reorder failed. Please try again.", "info");
        await loadSdTab(tabId);
        return;
      }

      setSdData((prev) => {
        const byId = new Map(saved.filter(Boolean).map((entry) => [entry!.id, entry!]));
        return {
          ...prev,
          [tabId]: sortByDisplayOrder(
            prev[tabId].map((entry) => byId.get(entry.id) ?? entry),
          ),
        };
      });
    } catch {
      showToast("Reorder failed. Please try again.", "info");
      await loadSdTab(tabId);
    } finally {
      setSdReordering(false);
    }
  };

  const handleSdMove = async (
    item: AdminSDItem,
    tabId: SDTabId,
    direction: "up" | "down",
    scopeItems?: AdminSDItem[],
  ) => {
    const list = scopeItems ?? sdData[tabId];
    const updates = computeSdMoveUpdates(list, item.id, direction);
    await applySdDisplayOrderUpdates(tabId, updates);
  };

  const handleSdMoveTopic = async (
    topic: string,
    tabId: SDTabId,
    direction: "up" | "down",
  ) => {
    const groups = groupByTopic(sortByDisplayOrder(sdData[tabId]));
    const updates = computeTopicMoveUpdates(groups, topic, direction);
    await applySdDisplayOrderUpdates(tabId, updates);
  };

  const handleSdReorderItems = async (
    fromIndex: number,
    toIndex: number,
    tabId: SDTabId,
    scopeItems?: AdminSDItem[],
  ) => {
    const list = scopeItems ?? sdData[tabId];
    const updates = computeReorderUpdates(list, fromIndex, toIndex);
    await applySdDisplayOrderUpdates(tabId, updates);
  };

  const handleSdReorderTopics = async (
    fromIndex: number,
    toIndex: number,
    tabId: SDTabId,
  ) => {
    const groups = groupByTopic(sortByDisplayOrder(sdData[tabId]));
    const updates = computeTopicReorderUpdates(groups, fromIndex, toIndex);
    await applySdDisplayOrderUpdates(tabId, updates);
  };

  const activeCoreSubjectItems = coreSubjectsData.filter(
    (item) => item.subject === csSubject,
  );
  const activeCoreSubjectQuizzes = csTopicQuizzes.filter(
    (quiz) => quiz.subject === csSubject,
  );

  const openCsAddModal = () => {
    if (!csSubject) {
      showToast("Add a subject first, then add concepts under it.", "info");
      return;
    }
    setCsModal({ open: true, item: null });
  };

  const openCsCategoryAddModal = () => {
    setCsCategoryModal({ open: true, item: null });
  };

  const openCsCategoryEditModal = (category: CoreSubject) => {
    setCsCategoryModal({ open: true, item: category });
  };

  const openCsCategoryDeleteModal = (category: CoreSubject) => {
    setCsCategoryDeleteModal({ id: category.id, name: category.title });
  };

  const handleCsCategoryDeleteConfirm = async () => {
    if (!csCategoryDeleteModal) return;
    setDeleteLoading(true);
    const ok = await prepAdminApi.deleteContent(
      "core_subjects",
      csCategoryDeleteModal.id,
    );
    setDeleteLoading(false);
    if (ok) {
      setCoreSubjectCategories((prev) =>
        prev.filter((item) => item.id !== csCategoryDeleteModal.id),
      );
      if (csSubject && coreSubjectCategories.find((c) => c.id === csCategoryDeleteModal.id)?.subject === csSubject) {
        const remaining = coreSubjectCategories.filter((c) => c.id !== csCategoryDeleteModal.id);
        setCsSubject(remaining[0]?.subject ?? "");
      }
      showToast(`"${csCategoryDeleteModal.name}" deleted`, "success");
    } else {
      showToast("Delete failed. Please try again.", "info");
    }
    setCsCategoryDeleteModal(null);
  };

  const handleCsCategorySave = async (formData: Omit<CoreSubject, "id"> & { id?: string }) => {
    setCsCategorySaving(true);
    const isEdit = !!csCategoryModal?.item?.id;
    const payload = mapCoreSubjectCategoryToApi({
      ...formData,
      displayOrder:
        formData.displayOrder ??
        (isEdit
          ? csCategoryModal?.item?.displayOrder ?? 0
          : (coreSubjectCategories.reduce((max, c) => Math.max(max, c.displayOrder ?? 0), 0) + 10)),
    });
    const item = await prepAdminApi.putContentSingle<Record<string, unknown>>(
      "core_subjects",
      payload,
    );
    setCsCategorySaving(false);
    if (item) {
      const mapped = mapCoreSubjectCategoryFromApi(item);
      setCoreSubjectCategories((prev) => {
        const next = isEdit
          ? prev.map((entry) => (entry.id === mapped.id ? mapped : entry))
          : [...prev, mapped];
        return next.sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
      });
      if (!csSubject) setCsSubject(mapped.subject);
      showToast(`"${mapped.title}" ${isEdit ? "updated" : "added"} successfully`, "success");
      setCsCategoryModal({ open: false });
    } else {
      showToast("Save failed. Please try again.", "info");
    }
  };

  const openCsTopicQuizModal = (topic: string, quiz: CoreSubjectTopicQuiz | null) => {
    setCsQuizModal({ open: true, topic, quiz });
  };

  const handleCsTopicQuizSave = async (
    formData: Omit<CoreSubjectTopicQuiz, "questionCount" | "id"> & { id?: string },
  ) => {
    setCsQuizSaving(true);
    const isEdit = !!csQuizModal.quiz?.id;
    const payload = mapCoreSubjectQuizToApi({
      ...formData,
      subject: csSubject,
      topic: csQuizModal.topic,
      scope: "core_subjects",
    });
    const item = await prepAdminApi.putContentSingle<Record<string, unknown>>("quizzes", payload);
    setCsQuizSaving(false);
    if (item) {
      const mapped = mapCoreSubjectQuizFromApi(item);
      setCsTopicQuizzes((prev) => {
        const next = isEdit
          ? prev.map((entry) => (entry.id === mapped.id ? mapped : entry))
          : [...prev, mapped];
        return next.sort((a, b) => a.topic.localeCompare(b.topic));
      });
      showToast(`"${mapped.title}" ${isEdit ? "updated" : "added"} successfully`, "success");
      setCsQuizModal({ open: false, topic: "", quiz: null });
    } else {
      showToast("Quiz save failed. Please try again.", "info");
    }
  };

  const handleCsTopicQuizDelete = async (quiz: CoreSubjectTopicQuiz) => {
    if (!window.confirm(`Delete quiz "${quiz.title}"?`)) return;
    setDeleteLoading(true);
    const ok = await prepAdminApi.deleteContent("quizzes", quiz.id);
    setDeleteLoading(false);
    if (ok) {
      setCsTopicQuizzes((prev) => prev.filter((entry) => entry.id !== quiz.id));
      showToast(`"${quiz.title}" deleted`, "success");
    } else {
      showToast("Delete failed. Please try again.", "info");
    }
  };

  const openCsEditModal = (item: AdminCoreSubjectItem) => {
    setCsModal({ open: true, item });
  };

  const openCsDeleteModal = (item: AdminCoreSubjectItem) => {
    setCsDeleteModal({ id: item.id, name: item.title });
  };

  const handleCsDeleteConfirm = async () => {
    if (!csDeleteModal) return;
    setDeleteLoading(true);
    const ok = await prepAdminApi.deleteContent("core_subjects", csDeleteModal.id);
    setDeleteLoading(false);
    if (ok) {
      setCoreSubjectsData((prev) => prev.filter((item) => item.id !== csDeleteModal.id));
      showToast(`"${csDeleteModal.name}" deleted successfully`, "success");
    } else {
      showToast("Delete failed. Please try again.", "info");
    }
    setCsDeleteModal(null);
  };

  const handleCsSave = async (
    formData: Omit<AdminSDItem, "id" | "createdAt" | "updatedAt"> & { id?: string },
  ) => {
    setCsSaving(true);
    const isEdit = !!csModal?.item?.id;
    const subject = csModal?.item?.subject ?? csSubject;
    const subjectTitle = getCoreSubjectTitle(subject, coreSubjectCategories);
    const payload = mapCoreSubjectToApi({
      ...(formData.id ? { id: formData.id } : csModal?.item?.id ? { id: csModal.item.id } : {}),
      title: formData.title,
      description: formData.description,
      section: subjectTitle,
      difficulty: formData.difficulty,
      designType: "lld",
      contentKind: "concept",
      topics: formData.topics ?? [],
      content: formData.content,
      diagramUrl: "",
      additionalImageUrls: [],
      thumbnailUrl: formData.thumbnailUrl,
      subject,
      displayOrder:
        typeof formData.displayOrder === "number" && Number.isFinite(formData.displayOrder)
          ? formData.displayOrder
          : isEdit
            ? csModal?.item?.displayOrder ?? 0
            : nextDisplayOrder(activeCoreSubjectItems),
    });
    const item = await prepAdminApi.putContentSingle<Record<string, unknown>>(
      "core_subjects",
      payload,
    );
    setCsSaving(false);
    if (item) {
      const mapped = mapCoreSubjectFromApi(item, coreSubjectCategories);
      setCoreSubjectsData((prev) =>
        sortByDisplayOrder(
          isEdit
            ? prev.map((entry) => (entry.id === mapped.id ? mapped : entry))
            : [...prev, mapped],
        ),
      );
      showToast(`"${mapped.title}" ${isEdit ? "updated" : "added"} successfully`, "success");
      setCsModal({ open: false });
    } else {
      showToast("Save failed. Please try again.", "info");
    }
  };

  const applyCoreDisplayOrderUpdates = async (updates: AdminCoreSubjectItem[] | null) => {
    if (!updates?.length) return;

    setCsReordering(true);
    try {
      const saved = await Promise.all(
        updates.map((entry) =>
          prepAdminApi.putContentSingle<Record<string, unknown>>(
            "core_subjects",
            mapCoreSubjectToApi(entry),
          ),
        ),
      );

      if (saved.some((entry) => !entry)) {
        showToast("Reorder failed. Please try again.", "info");
        await loadCoreSubjects();
        return;
      }

      setCoreSubjectsData((prev) => {
        const byId = new Map(
          saved.filter(Boolean).map((entry) => [
            String(entry!.id),
            mapCoreSubjectFromApi(entry as Record<string, unknown>, coreSubjectCategories),
          ]),
        );
        return sortByDisplayOrder(prev.map((entry) => byId.get(entry.id) ?? entry));
      });
    } catch {
      showToast("Reorder failed. Please try again.", "info");
      await loadCoreSubjects();
    } finally {
      setCsReordering(false);
    }
  };

  const handleCsMove = async (
    item: AdminCoreSubjectItem,
    direction: "up" | "down",
    scopeItems?: AdminCoreSubjectItem[],
  ) => {
    const list = scopeItems ?? activeCoreSubjectItems;
    const updates = computeSdMoveUpdates(list, item.id, direction);
    await applyCoreDisplayOrderUpdates(updates as AdminCoreSubjectItem[] | null);
  };

  const handleCsMoveTopic = async (topic: string, direction: "up" | "down") => {
    const groups = groupByTopic(sortByDisplayOrder(activeCoreSubjectItems));
    const updates = computeTopicMoveUpdates(groups, topic, direction);
    await applyCoreDisplayOrderUpdates(updates as AdminCoreSubjectItem[] | null);
  };

  const handleCsReorderItems = async (
    fromIndex: number,
    toIndex: number,
    scopeItems?: AdminCoreSubjectItem[],
  ) => {
    const list = scopeItems ?? activeCoreSubjectItems;
    const updates = computeReorderUpdates(list, fromIndex, toIndex);
    await applyCoreDisplayOrderUpdates(updates as AdminCoreSubjectItem[] | null);
  };

  const handleCsReorderTopics = async (fromIndex: number, toIndex: number) => {
    const groups = groupByTopic(sortByDisplayOrder(activeCoreSubjectItems));
    const updates = computeTopicReorderUpdates(groups, fromIndex, toIndex);
    await applyCoreDisplayOrderUpdates(updates as AdminCoreSubjectItem[] | null);
  };

  const overviewStats = [
    {
      label: "Interview Questions",
      value: iqData.length,
      color: "bg-blue-500",
    },
    { label: "DSA Problems", value: dsaData.length, color: "bg-green-500" },
    {
      label: "System Design (HLD)",
      value: ALL_SD_TAB_IDS.filter((id) => id.startsWith("hld-")).reduce((n, id) => n + sdData[id].length, 0),
      color: "bg-cyan-500",
    },
    {
      label: "System Design (LLD)",
      value: ALL_SD_TAB_IDS.filter((id) => id.startsWith("lld-")).reduce((n, id) => n + sdData[id].length, 0),
      color: "bg-sky-500",
    },
    { label: "OOPs Concepts", value: oopsData.length, color: "bg-violet-500" },
    {
      label: "Language Concepts",
      value: langData.length,
      color: "bg-fuchsia-500",
    },
    {
      label: "Core Subjects",
      value: coreSubjectCategories.length,
      color: "bg-teal-500",
    },
    { label: "Quizzes", value: quizData.length, color: "bg-purple-500" },
    {
      label: "Cold DM Templates",
      value: dmData.length,
      color: "bg-orange-500",
    },
    { label: "Job Portals", value: jpData.length, color: "bg-pink-500" },
    {
      label: "Handwritten Notes",
      value: noteData.length,
      color: "bg-indigo-500",
    },
    { label: "Roadmaps", value: rmData.length, color: "bg-teal-500" },
    {
      label: "Companies (Mass Recruit)",
      value: mrData.length,
      color: "bg-red-500",
    },
    {
      label: "Position Resources",
      value: posData.length,
      color: "bg-yellow-500",
    },
  ];

  const isGrid = viewMode === "grid";

  return (
    <div className="space-y-6 relative">
      <style>{`@keyframes slideIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>
      {toast && (
        <div
          style={{ animation: "slideIn 0.3s ease-out" }}
          className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${toast.type === "success" ? "bg-green-600" : "bg-blue-600"}`}
        >
          <div className="flex items-center gap-2">
            {toast.type === "success" ? (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            {toast.message}
          </div>
        </div>
      )}

      {contentLoading && activeTab !== "overview" && (
        <p className="text-sm text-gray-500 mb-4">Loading content…</p>
      )}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-orange-500 text-white shadow-sm"
                : "text-gray-600 hover:bg-orange-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Overview ─── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {overviewStats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                  <span className="text-sm text-gray-500">{stat.label}</span>
                </div>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Preparation Content Status
            </h3>
            <div className="space-y-3">
              {overviewStats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-4">
                  <span className="text-sm text-gray-600 w-48">
                    {stat.label}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className={`${stat.color} h-2 rounded-full transition-all`}
                      style={{ width: `${Math.min(100, stat.value / 10)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-12 text-right">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── Interview Questions ─── */}
      {activeTab === "interview-questions" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Interview Questions"
            count={iqData.length}
            btnLabel="Add Question"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {iqData.map((q) => (
                <CardShell key={q.id}>
                  <div className="flex items-start justify-between mb-3">
                    <DiffBadge d={q.difficulty} />
                    <ActionBtns
                      name={q.question}
                      onEdit={() => triggerEdit(q.question)}
                      onDelete={() =>
                        confirmDelete(q.question, q.id, setIqData)
                      }
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                    {q.question}
                  </h4>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full ring-1 ring-blue-100">
                      {q.category}
                    </span>
                  </div>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Question
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {iqData.map((q, i) => (
                    <tr key={q.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                        {q.question}
                      </td>
                      <td className="px-6 py-4">
                        <DiffBadge d={q.difficulty} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {q.category}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={q.question}
                          onEdit={() => triggerEdit(q.question)}
                          onDelete={() =>
                            confirmDelete(q.question, q.id, setIqData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── DSA Problems ─── */}
      {activeTab === "dsa" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="DSA Problems"
            count={dsaData.length}
            btnLabel="Add Problem"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {dsaData.map((p) => (
                <CardShell key={p.id}>
                  <div className="flex items-start justify-between mb-3">
                    <DiffBadge d={p.difficulty} />
                    <ActionBtns
                      name={p.title}
                      onEdit={() => triggerEdit(p.title)}
                      onDelete={() => confirmDelete(p.title, p.id, setDsaData)}
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {p.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {p.description}
                  </p>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full ring-1 ring-indigo-100">
                      {p.topic}
                    </span>
                    {p.company.slice(0, 2).map((c: string) => (
                      <span
                        key={c}
                        className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 rounded-full ring-1 ring-gray-200"
                      >
                        {c}
                      </span>
                    ))}
                    {p.company.length > 2 && (
                      <span className="text-xs text-gray-400">
                        +{p.company.length - 2}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    Acceptance: {p.acceptance}%
                  </div>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Topic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Companies
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dsaData.map((p, i) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {p.title}
                      </td>
                      <td className="px-6 py-4">
                        <DiffBadge d={p.difficulty} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {p.topic}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-1 flex-wrap">
                          {p.company.slice(0, 2).map((c: string) => (
                            <span
                              key={c}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={p.title}
                          onEdit={() => triggerEdit(p.title)}
                          onDelete={() =>
                            confirmDelete(p.title, p.id, setDsaData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Quizzes ─── */}
      {activeTab === "quizzes" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Quizzes"
            count={quizData.length}
            btnLabel="Add Quiz"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {quizData.map((quiz) => (
                <CardShell key={quiz.id}>
                  <div className="flex items-start justify-between mb-3">
                    <DiffBadge d={quiz.difficulty} />
                    <ActionBtns
                      name={quiz.title}
                      onEdit={() => triggerEdit(quiz.title)}
                      onDelete={() =>
                        confirmDelete(quiz.title, quiz.id, setQuizData)
                      }
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {quiz.title}
                  </h4>
                  <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {quiz.questionCount} questions
                    </span>
                    <span className="flex items-center gap-1">
                      <svg
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {quiz.duration} min
                    </span>
                  </div>
                  <span className="mt-3 inline-block text-xs px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full ring-1 ring-purple-100">
                    {quiz.category}
                  </span>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Questions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Difficulty
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {quizData.map((quiz, i) => (
                    <tr key={quiz.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {quiz.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {quiz.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {quiz.questionCount}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {quiz.duration} min
                      </td>
                      <td className="px-6 py-4">
                        <DiffBadge d={quiz.difficulty} />
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={quiz.title}
                          onEdit={() => triggerEdit(quiz.title)}
                          onDelete={() =>
                            confirmDelete(quiz.title, quiz.id, setQuizData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Cold DMs ─── */}
      {activeTab === "cold-dms" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Cold DM Templates"
            count={dmData.length}
            btnLabel="Add Template"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {dmData.map((dm) => (
                <CardShell key={dm.id}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full ring-1 ring-blue-100">
                      {dm.category}
                    </span>
                    <ActionBtns
                      name={dm.title}
                      onEdit={() => triggerEdit(dm.title)}
                      onDelete={() => confirmDelete(dm.title, dm.id, setDmData)}
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {dm.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1.5 line-clamp-3">
                    {dm.content}
                  </p>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dmData.map((dm, i) => (
                    <tr key={dm.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {dm.title}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                          {dm.category}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={dm.title}
                          onEdit={() => triggerEdit(dm.title)}
                          onDelete={() =>
                            confirmDelete(dm.title, dm.id, setDmData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Job Portals ─── */}
      {activeTab === "job-portals" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Job Portals"
            count={jpData.length}
            btnLabel="Add Portal"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {jpData.map((portal) => (
                <CardShell key={portal.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-2">
                      <span className="text-xs px-2.5 py-0.5 bg-teal-50 text-teal-600 rounded-full ring-1 ring-teal-100">
                        {portal.category}
                      </span>
                      <span className="text-xs px-2.5 py-0.5 bg-gray-50 text-gray-500 rounded-full ring-1 ring-gray-200">
                        {portal.region}
                      </span>
                    </div>
                    <ActionBtns
                      name={portal.name}
                      onEdit={() => triggerEdit(portal.name)}
                      onDelete={() =>
                        confirmDelete(portal.name, portal.id, setJpData)
                      }
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {portal.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    {portal.description}
                  </p>
                  {portal.url && (
                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-blue-500 hover:underline mt-2 inline-block truncate max-w-full"
                    >
                      {portal.url}
                    </a>
                  )}
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Region
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {jpData.map((portal) => (
                    <tr key={portal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {portal.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {portal.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {portal.region}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={portal.name}
                          onEdit={() => triggerEdit(portal.name)}
                          onDelete={() =>
                            confirmDelete(portal.name, portal.id, setJpData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Notes ─── */}
      {activeTab === "notes" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Handwritten Notes"
            count={noteData.length}
            btnLabel="Upload Note"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {noteData.map((note) => (
                <CardShell key={note.id}>
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-full ring-1 ring-indigo-100">
                      {note.topic}
                    </span>
                    <ActionBtns
                      name={note.title}
                      onEdit={() => triggerEdit(note.title)}
                      onDelete={() =>
                        confirmDelete(note.title, note.id, setNoteData)
                      }
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {note.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {note.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    {note.pageCount} pages
                  </div>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Topic
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Pages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {noteData.map((note, i) => (
                    <tr key={note.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {note.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                          {note.description}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full">
                          {note.topic}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {note.pageCount}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={note.title}
                          onEdit={() => triggerEdit(note.title)}
                          onDelete={() =>
                            confirmDelete(note.title, note.id, setNoteData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Roadmaps ─── */}
      {activeTab === "roadmaps" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Roadmaps"
            count={rmData.length}
            btnLabel="Add Roadmap"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {rmData.map((rm) => (
                <CardShell key={rm.id}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex gap-2">
                      <span className="text-xs px-2.5 py-0.5 bg-gray-50 text-gray-600 rounded-full ring-1 ring-gray-200">
                        {rm.category}
                      </span>
                      {rm.isFree && (
                        <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-600 rounded-full ring-1 ring-emerald-100">
                          Free
                        </span>
                      )}
                    </div>
                    <ActionBtns
                      name={rm.title}
                      onEdit={() => triggerEdit(rm.title)}
                      onDelete={() => confirmDelete(rm.title, rm.id, setRmData)}
                    />
                  </div>
                  <h4 className="font-semibold text-gray-900 text-sm">
                    {rm.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {rm.description}
                  </p>
                  <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    {rm.steps.length} steps
                  </div>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Steps
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Free
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {rmData.map((rm, i) => (
                    <tr key={rm.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {i + 1}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">
                          {rm.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                          {rm.description}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {rm.category}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {rm.steps.length}
                      </td>
                      <td className="px-6 py-4">
                        {rm.isFree ? (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                            Free
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Paid</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={rm.title}
                          onEdit={() => triggerEdit(rm.title)}
                          onDelete={() =>
                            confirmDelete(rm.title, rm.id, setRmData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Mass Recruitment ─── */}
      {activeTab === "mass-recruitment" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <SectionHeader
            title="Mass Recruitment Companies"
            count={mrData.length}
            btnLabel="Add Company"
            view={viewMode}
            onViewChange={setViewMode}
          />
          {isGrid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
              {mrData.map((company) => (
                <CardShell key={company.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden ring-1 ring-gray-200">
                        <img
                          src={company.logo}
                          alt=""
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                            (
                              e.target as HTMLImageElement
                            ).parentElement!.innerHTML =
                              `<span class="text-sm font-bold text-gray-400">${company.name.charAt(0)}</span>`;
                          }}
                        />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm">
                        {company.name}
                      </h4>
                    </div>
                    <ActionBtns
                      name={company.name}
                      onEdit={() => triggerEdit(company.name)}
                      onDelete={() =>
                        confirmDelete(company.name, company.id, setMrData)
                      }
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    <div className="bg-blue-50 rounded-lg p-2.5 text-center ring-1 ring-blue-100">
                      <p className="text-lg font-bold text-blue-700">
                        {company.interviewQuestions}
                      </p>
                      <p className="text-[10px] text-blue-500 mt-0.5">
                        Interview
                      </p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-2.5 text-center ring-1 ring-emerald-100">
                      <p className="text-lg font-bold text-emerald-700">
                        {company.dsaProblems}
                      </p>
                      <p className="text-[10px] text-emerald-500 mt-0.5">DSA</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-2.5 text-center ring-1 ring-amber-100">
                      <p className="text-lg font-bold text-amber-700">
                        {company.aptitudeQuestions}
                      </p>
                      <p className="text-[10px] text-amber-500 mt-0.5">
                        Aptitude
                      </p>
                    </div>
                  </div>
                </CardShell>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Company
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Interview Qs
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      DSA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Aptitude
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {mrData.map((company) => (
                    <tr key={company.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {company.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {company.interviewQuestions}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {company.dsaProblems}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {company.aptitudeQuestions}
                      </td>
                      <td className="px-6 py-4">
                        <ActionBtns
                          name={company.name}
                          onEdit={() => triggerEdit(company.name)}
                          onDelete={() =>
                            confirmDelete(company.name, company.id, setMrData)
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "core-subjects" && (
        <CoreSubjectsAdminPanel
          categories={coreSubjectCategories}
          categoriesLoading={csCategoriesLoading}
          selectedSubject={csSubject}
          onSubjectChange={setCsSubject}
          onAddCategory={openCsCategoryAddModal}
          onEditCategory={openCsCategoryEditModal}
          onDeleteCategory={openCsCategoryDeleteModal}
          items={activeCoreSubjectItems}
          loading={csLoading}
          error={csError}
          viewMode={viewMode}
          onViewChange={setViewMode}
          onAdd={openCsAddModal}
          onRetry={loadCoreSubjects}
          onEdit={openCsEditModal}
          onDelete={openCsDeleteModal}
          onMoveItem={handleCsMove}
          onMoveTopic={handleCsMoveTopic}
          onReorderItems={handleCsReorderItems}
          onReorderTopics={handleCsReorderTopics}
          reordering={csReordering}
          topicQuizzes={activeCoreSubjectQuizzes}
          onManageTopicQuiz={openCsTopicQuizModal}
          onDeleteTopicQuiz={handleCsTopicQuizDelete}
        />
      )}

      {activeTab === "system-design" && (
        <SystemDesignAdminPanel
          designType={sdDesignType}
          subSection={sdSubSection}
          onDesignTypeChange={setSdDesignType}
          onSubSectionChange={setSdSubSection}
          sdData={sdData}
          loading={sdLoading}
          error={sdError}
          viewMode={viewMode}
          onViewChange={setViewMode}
          onAdd={openSdAddModal}
          onRetry={loadSdTab}
          onEdit={openSdEditModal}
          onDelete={openSdDeleteModal}
          onMoveItem={handleSdMove}
          onMoveTopic={handleSdMoveTopic}
          onReorderItems={handleSdReorderItems}
          onReorderTopics={handleSdReorderTopics}
          reordering={sdReordering}
        />
      )}

      {/* ─── Core Subjects Add/Edit Modal ─── */}
      {csModal.open && (
        <SDConceptModal
          designType="lld"
          contentKind="concept"
          item={csModal.item ?? null}
          defaultDisplayOrder={nextDisplayOrder(activeCoreSubjectItems)}
          coreSubject={{
            slug: csModal.item?.subject ?? csSubject,
            title: getCoreSubjectTitle(csModal.item?.subject ?? csSubject, coreSubjectCategories),
          }}
          saving={csSaving}
          onSave={handleCsSave}
          onClose={() => setCsModal({ open: false })}
        />
      )}

      {/* ─── SD Add/Edit Modal ─── */}
      {sdModal.open &&
        (SD_TAB_CONFIG[sdModal.tabId].contentKind === "question" ? (
          <SDQuestionModal
            designType={SD_TAB_CONFIG[sdModal.tabId].designType}
            item={sdModal.item ?? null}
            saving={sdSaving}
            onSave={handleSdSave}
            onClose={() => setSdModal({ open: false, tabId: sdModal.tabId })}
          />
        ) : SD_TAB_CONFIG[sdModal.tabId].contentKind === "resource" ? (
          <SDResourceModal
            designType={SD_TAB_CONFIG[sdModal.tabId].designType}
            item={sdModal.item ?? null}
            saving={sdSaving}
            onSave={handleSdSave}
            onClose={() => setSdModal({ open: false, tabId: sdModal.tabId })}
          />
        ) : (
          <SDConceptModal
            designType={SD_TAB_CONFIG[sdModal.tabId].designType}
            contentKind={SD_TAB_CONFIG[sdModal.tabId].contentKind as "concept" | "practice"}
            item={sdModal.item ?? null}
            defaultDisplayOrder={nextDisplayOrder(sdData[sdModal.tabId])}
            saving={sdSaving}
            onSave={handleSdSave}
            onClose={() => setSdModal({ open: false, tabId: sdModal.tabId })}
          />
        ))}

      {/* ─── Delete Confirmation Modal ─── */}
      {csCategoryModal.open && (
        <CoreSubjectCategoryModal
          item={csCategoryModal.item ?? null}
          saving={csCategorySaving}
          defaultDisplayOrder={
            coreSubjectCategories.reduce((max, c) => Math.max(max, c.displayOrder ?? 0), 0) + 10
          }
          onSave={handleCsCategorySave}
          onClose={() => setCsCategoryModal({ open: false })}
        />
      )}

      {csQuizModal.open && csSubject && (
        <CoreSubjectQuizModal
          topic={csQuizModal.topic}
          subjectSlug={csSubject}
          subjectTitle={getCoreSubjectTitle(csSubject, coreSubjectCategories)}
          quiz={csQuizModal.quiz}
          saving={csQuizSaving}
          onSave={handleCsTopicQuizSave}
          onClose={() => setCsQuizModal({ open: false, topic: "", quiz: null })}
        />
      )}

      {csCategoryDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Subject</h3>
            <p className="text-sm text-gray-600 mb-6">
              Delete <span className="font-medium text-gray-900">"{csCategoryDeleteModal.name}"</span>?
              Concepts under this subject will remain in the database but won&apos;t appear until reassigned.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCsCategoryDeleteModal(null)}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCsCategoryDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {csDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Concept</h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">"{csDeleteModal.name}"</span>? This
              action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setCsDeleteModal(null)}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCsDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Question
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">
                "{deleteModal.name}"
              </span>
              ? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSdDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {deleteLoading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrepContentManagementPage;
