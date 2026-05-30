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

export function computeReorderUpdates(
  items: AdminSDItem[],
  fromIndex: number,
  toIndex: number,
): AdminSDItem[] | null {
  const sorted = sortByDisplayOrder(items);
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= sorted.length ||
    toIndex >= sorted.length
  ) {
    return null;
  }

  const reordered = [...sorted];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);

  return reordered.map((item, index) => ({
    ...item,
    displayOrder: (index + 1) * 10,
  }));
}

type TopicGroup = { topic: string; items: AdminSDItem[] };

function renumberTopicGroups(groups: TopicGroup[]): AdminSDItem[] {
  return groups.flatMap((group, groupIndex) =>
    sortByDisplayOrder(group.items).map((item, itemIndex) => ({
      ...item,
      displayOrder: groupIndex * 1000 + (itemIndex + 1) * 10,
    })),
  );
}

export function computeTopicMoveUpdates(
  groups: TopicGroup[],
  topic: string,
  direction: "up" | "down",
): AdminSDItem[] | null {
  const index = groups.findIndex((group) => group.topic === topic);
  if (index < 0) return null;

  const swapIndex = direction === "up" ? index - 1 : index + 1;
  if (swapIndex < 0 || swapIndex >= groups.length) return null;

  const swappedGroups = [...groups];
  [swappedGroups[index], swappedGroups[swapIndex]] = [
    swappedGroups[swapIndex],
    swappedGroups[index],
  ];

  const groupA = groups[index];
  const groupB = groups[swapIndex];
  const aSorted = sortByDisplayOrder(groupA.items);
  const bSorted = sortByDisplayOrder(groupB.items);
  const aOrders = aSorted.map(getDisplayOrder);
  const bOrders = bSorted.map(getDisplayOrder);
  const aMin = Math.min(...aOrders);
  const aMax = Math.max(...aOrders);
  const bMin = Math.min(...bOrders);
  const bMax = Math.max(...bOrders);

  if (aMin === bMin && aMax === bMax) {
    return renumberTopicGroups(swappedGroups);
  }

  const aSpan = aMax - aMin || 1;
  const bSpan = bMax - bMin || 1;
  const updates: AdminSDItem[] = [];

  aSorted.forEach((item) => {
    const relative = (getDisplayOrder(item) - aMin) / aSpan;
    updates.push({
      ...item,
      displayOrder: Math.round(bMin + relative * bSpan),
    });
  });

  bSorted.forEach((item) => {
    const relative = (getDisplayOrder(item) - bMin) / bSpan;
    updates.push({
      ...item,
      displayOrder: Math.round(aMin + relative * bSpan),
    });
  });

  return updates;
}

export function computeTopicReorderUpdates(
  groups: TopicGroup[],
  fromIndex: number,
  toIndex: number,
): AdminSDItem[] | null {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= groups.length ||
    toIndex >= groups.length
  ) {
    return null;
  }

  const reordered = [...groups];
  const [moved] = reordered.splice(fromIndex, 1);
  reordered.splice(toIndex, 0, moved);

  return renumberTopicGroups(reordered);
}
