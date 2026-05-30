import { type AdminSDItem } from "./types";
import { getDisplayOrder, sortByDisplayOrder } from "../../../lib/sdDisplayOrder";

export { getDisplayOrder, sortByDisplayOrder } from "../../../lib/sdDisplayOrder";

export function nextDisplayOrder(items: AdminSDItem[]): number {
  if (items.length === 0) return 10;
  return Math.max(...items.map(getDisplayOrder), 0) + 10;
}

export function computeSdMoveUpdates(
  items: AdminSDItem[],
  itemId: string,
  direction: "up" | "down",
): AdminSDItem[] | null {
  const sorted = sortByDisplayOrder(items);
  const index = sorted.findIndex((item) => item.id === itemId);
  if (index < 0) return null;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= sorted.length) return null;

  const current = sorted[index];
  const adjacent = sorted[swapIndex];
  const currentOrder = getDisplayOrder(current);
  const adjacentOrder = getDisplayOrder(adjacent);

  if (currentOrder === adjacentOrder) {
    return sorted.map((item, i) => ({ ...item, displayOrder: (i + 1) * 10 }));
  }

  return [
    { ...current, displayOrder: adjacentOrder },
    { ...adjacent, displayOrder: currentOrder },
  ];
}
