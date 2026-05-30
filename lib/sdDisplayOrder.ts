export function getDisplayOrder(item: { displayOrder?: number }): number {
  const value = item.displayOrder;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function sortByDisplayOrder<T extends { displayOrder?: number; title?: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const orderDiff = getDisplayOrder(a) - getDisplayOrder(b);
    if (orderDiff !== 0) return orderDiff;
    return (a.title ?? "").localeCompare(b.title ?? "");
  });
}
