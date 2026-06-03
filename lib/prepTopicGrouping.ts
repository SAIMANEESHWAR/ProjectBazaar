import { getDisplayOrder } from "./sdDisplayOrder";

export interface TopicGroupable {
  title: string;
  section?: string;
  topics?: string[];
  displayOrder?: number;
  thumbnailUrl?: string;
}

export function getPrimaryTopic(item: TopicGroupable): string {
  const topics = item.topics?.map((t) => t.trim()).filter(Boolean) ?? [];
  if (topics.length > 0) return topics[0];
  if (item.section?.trim()) return item.section.trim();
  return "General";
}

export function groupByTopic<T extends TopicGroupable>(items: T[]) {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const topic = getPrimaryTopic(item);
    if (!map.has(topic)) map.set(topic, []);
    map.get(topic)!.push(item);
  }

  return Array.from(map.entries())
    .map(([topic, groupedItems]) => ({
      topic,
      items: groupedItems.sort((a, b) => {
        const orderDiff = getDisplayOrder(a) - getDisplayOrder(b);
        if (orderDiff !== 0) return orderDiff;
        return a.title.localeCompare(b.title);
      }),
    }))
    .sort((a, b) => {
      const aOrder = a.items.length > 0 ? getDisplayOrder(a.items[0]) : 0;
      const bOrder = b.items.length > 0 ? getDisplayOrder(b.items[0]) : 0;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return a.topic.localeCompare(b.topic);
    });
}

export function getGroupThumbnail(items: { thumbnailUrl?: string }[]): string | undefined {
  return items.find((item) => item.thumbnailUrl?.trim())?.thumbnailUrl;
}
