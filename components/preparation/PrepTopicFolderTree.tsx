import { useMemo, useState } from "react";
import { File, Folder, FolderOpen } from "lucide-react";
import { type SDQuestion } from "./SDDetailPanel";
import { groupByTopic } from "./prepTopicGrouping";

export interface PrepTopicFolderTreeProps {
  items: SDQuestion[];
  onSelect: (item: SDQuestion) => void;
}

export default function PrepTopicFolderTree({
  items,
  onSelect,
}: PrepTopicFolderTreeProps) {
  const groups = useMemo(() => groupByTopic(items), [items]);
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (groups.length === 0) return new Set<string>();
    return new Set([groups[0].topic]);
  });

  const toggleTopic = (topic: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(topic)) next.delete(topic);
      else next.add(topic);
      return next;
    });
  };

  const totalConcepts = items.length;

  return (
    <div className="prep-topic-tree">
      <div className="prep-topic-tree__header">
        <div className="prep-topic-tree__header-left">
          <span className="prep-topic-tree__mode-badge">Folder view</span>
          <span className="prep-topic-tree__meta">
            {groups.length} topic{groups.length === 1 ? "" : "s"} · {totalConcepts} concept
            {totalConcepts === 1 ? "" : "s"}
          </span>
        </div>
        <div className="prep-topic-tree__header-actions">
          <button
            type="button"
            className="prep-topic-tree__action"
            onClick={() => setExpanded(new Set(groups.map((g) => g.topic)))}
          >
            Expand all
          </button>
          <button
            type="button"
            className="prep-topic-tree__action"
            onClick={() => setExpanded(new Set())}
          >
            Collapse all
          </button>
        </div>
      </div>

      <div className="prep-topic-tree__shell">
        {groups.map((group, groupIndex) => {
          const isOpen = expanded.has(group.topic);

          return (
            <div
              key={group.topic}
              className={`prep-topic-tree__group ${isOpen ? "prep-topic-tree__group--open" : ""} ${
                groupIndex > 0 ? "prep-topic-tree__group--bordered" : ""
              }`}
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => toggleTopic(group.topic)}
                className={`prep-topic-tree__folder ${isOpen ? "prep-topic-tree__folder--open" : ""}`}
              >
                <span className="prep-topic-tree__folder-icon" aria-hidden>
                  {isOpen ? (
                    <FolderOpen className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  ) : (
                    <Folder className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  )}
                </span>
                <span className="prep-topic-tree__folder-title">{group.topic}</span>
                <span className="prep-topic-tree__count">{group.items.length}</span>
              </button>

              <div
                className={`prep-topic-tree__panel ${isOpen ? "prep-topic-tree__panel--open" : ""}`}
              >
                <div className="prep-topic-tree__panel-inner">
                  <ul className="prep-topic-tree__list">
                    {group.items.map((item, itemIndex) => (
                      <li
                        key={item.id}
                        className="prep-topic-tree__item-wrap"
                        style={{ animationDelay: `${itemIndex * 35}ms` }}
                      >
                        <button
                          type="button"
                          onClick={() => onSelect(item)}
                          className="prep-topic-tree__item"
                        >
                          <span className="prep-topic-tree__file-icon" aria-hidden>
                            <File className="h-[18px] w-[18px]" strokeWidth={1.5} />
                          </span>
                          <span className="prep-topic-tree__item-label">{item.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
