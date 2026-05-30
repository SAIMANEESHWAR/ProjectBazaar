import { DiagramData } from "../../../data/prepDiagramTypes";

export type SDDesignType = "hld" | "lld";
export type SDContentKind = "concept" | "question" | "practice" | "resource";
export type SDSubSection = "questions" | "concepts" | "practice" | "resources";

export interface AdminSDItem {
  id: string;
  title: string;
  description: string;
  section: string;
  difficulty: string;
  designType: SDDesignType;
  contentKind: SDContentKind;
  topics: string[];
  content: string;
  diagramData?: DiagramData;
  diagramUrl: string;
  additionalImageUrls: string[];
  resourceLinks?: string[];
  pdfUrl?: string;
  thumbnailUrl?: string;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export const SD_SECTIONS_HLD = ["System Design", "Distributed Systems"];
export const SD_SECTIONS_LLD = [
  "Object-Oriented Design",
  "System Design",
  "Game Design",
  "Data Structures",
  "Design Patterns",
];

export const EMPTY_DIAGRAM_TEMPLATE: DiagramData = {
  subtitle: "",
  nodes: [
    {
      id: "node-1",
      x: 60,
      y: 80,
      w: 140,
      h: 48,
      label: "ServiceA",
      fill: "#1e3a8a",
    },
  ],
  edges: [],
  legend: [{ color: "#1e3a8a", label: "Service" }],
};

export const parseDiagramDataShape = (
  value: string,
): { data?: DiagramData; error?: string } => {
  if (!value.trim()) return { data: undefined };

  try {
    const parsed = JSON.parse(value) as Partial<DiagramData>;
    if (typeof parsed !== "object" || parsed === null) {
      return { error: "Diagram data must be a JSON object." };
    }

    const normalized: DiagramData = {
      subtitle:
        typeof parsed.subtitle === "string" ? parsed.subtitle : undefined,
      nodes: Array.isArray(parsed.nodes) ? parsed.nodes : [],
      edges: Array.isArray(parsed.edges) ? parsed.edges : [],
      legend: Array.isArray(parsed.legend) ? parsed.legend : [],
    };

    if (
      !Array.isArray(normalized.nodes) ||
      !Array.isArray(normalized.edges) ||
      !Array.isArray(normalized.legend)
    ) {
      return { error: "Diagram data must include nodes, edges, and legend arrays." };
    }

    return { data: normalized };
  } catch {
    return { error: "Invalid JSON in diagram data." };
  }
};

export type SDTabId =
  | "hld-questions"
  | "hld-concepts"
  | "hld-practice"
  | "hld-resources"
  | "lld-questions"
  | "lld-concepts"
  | "lld-practice"
  | "lld-resources";

export const SD_SUB_SECTIONS: { id: SDSubSection; label: string }[] = [
  { id: "questions", label: "Interview Questions" },
  { id: "concepts", label: "Concepts" },
  { id: "practice", label: "Practice" },
  { id: "resources", label: "Resources" },
];

export const SD_DESIGN_TYPES: { id: SDDesignType; label: string }[] = [
  { id: "hld", label: "High Level Design (HLD)" },
  { id: "lld", label: "Low Level Design (LLD)" },
];

const SUB_TO_KIND: Record<SDSubSection, SDContentKind> = {
  questions: "question",
  concepts: "concept",
  practice: "practice",
  resources: "resource",
};

export function getSdTabId(
  designType: SDDesignType,
  subSection: SDSubSection,
): SDTabId {
  return `${designType}-${subSection}` as SDTabId;
}

export function subSectionFromContentKind(
  contentKind: SDContentKind,
): SDSubSection {
  const map: Record<SDContentKind, SDSubSection> = {
    question: "questions",
    concept: "concepts",
    practice: "practice",
    resource: "resources",
  };
  return map[contentKind] ?? "questions";
}

export const SD_TAB_CONFIG: Record<
  SDTabId,
  {
    designType: SDDesignType;
    contentKind: SDContentKind;
    subSection: SDSubSection;
    label: string;
    addLabel: string;
  }
> = {
  "hld-questions": {
    designType: "hld",
    contentKind: "question",
    subSection: "questions",
    label: "HLD — Interview Questions",
    addLabel: "Add Question",
  },
  "hld-concepts": {
    designType: "hld",
    contentKind: "concept",
    subSection: "concepts",
    label: "HLD — Concepts",
    addLabel: "Add Concept",
  },
  "hld-practice": {
    designType: "hld",
    contentKind: "practice",
    subSection: "practice",
    label: "HLD — Practice",
    addLabel: "Add Practice",
  },
  "hld-resources": {
    designType: "hld",
    contentKind: "resource",
    subSection: "resources",
    label: "HLD — Resources",
    addLabel: "Add Resource",
  },
  "lld-questions": {
    designType: "lld",
    contentKind: "question",
    subSection: "questions",
    label: "LLD — Interview Questions",
    addLabel: "Add Question",
  },
  "lld-concepts": {
    designType: "lld",
    contentKind: "concept",
    subSection: "concepts",
    label: "LLD — Concepts",
    addLabel: "Add Concept",
  },
  "lld-practice": {
    designType: "lld",
    contentKind: "practice",
    subSection: "practice",
    label: "LLD — Practice",
    addLabel: "Add Practice",
  },
  "lld-resources": {
    designType: "lld",
    contentKind: "resource",
    subSection: "resources",
    label: "LLD — Resources",
    addLabel: "Add Resource",
  },
};

export function contentKindFromSubSection(sub: SDSubSection): SDContentKind {
  return SUB_TO_KIND[sub];
}

export const ALL_SD_TAB_IDS = Object.keys(SD_TAB_CONFIG) as SDTabId[];

export function emptySdDataRecord(): Record<SDTabId, AdminSDItem[]> {
  return ALL_SD_TAB_IDS.reduce(
    (acc, id) => {
      acc[id] = [];
      return acc;
    },
    {} as Record<SDTabId, AdminSDItem[]>,
  );
}
