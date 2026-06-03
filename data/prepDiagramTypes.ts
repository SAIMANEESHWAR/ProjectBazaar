/** Diagram renderer types for system design content (API-sourced at runtime). */

export interface DiagramNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  fill: string;
  icon?: string;
  lottieUrl?: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label: string;
  dashed: boolean;
}

export interface DiagramLegend {
  color: string;
  label: string;
  icon?: string;
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  legend: DiagramLegend[];
  subtitle?: string;
}
