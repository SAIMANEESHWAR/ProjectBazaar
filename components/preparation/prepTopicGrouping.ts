import { type SDQuestion } from "./SDDetailPanel";

export function getPrimaryTopic(item: SDQuestion): string {
  const topics = item.topics?.map((t) => t.trim()).filter(Boolean) ?? [];
  if (topics.length > 0) return topics[0];
  if (item.section?.trim()) return item.section.trim();
  return "General";
}

export function groupByTopic(items: SDQuestion[]) {
  const map = new Map<string, SDQuestion[]>();

  for (const item of items) {
    const topic = getPrimaryTopic(item);
    if (!map.has(topic)) map.set(topic, []);
    map.get(topic)!.push(item);
  }

  return Array.from(map.entries())
    .map(([topic, groupedItems]) => ({
      topic,
      items: groupedItems.sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => a.topic.localeCompare(b.topic));
}
