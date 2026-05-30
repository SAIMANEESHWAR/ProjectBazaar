import { NodeViewWrapper } from "@tiptap/react";
import type { ReactNodeViewProps } from "@tiptap/react";
import PrepCodeSnippet from "../preparation/PrepCodeSnippet";
import type { PrepCodeSnippetData } from "../preparation/prepCodeSnippetTypes";

export default function PrepCodeSnippetNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
}: ReactNodeViewProps) {
  const data: PrepCodeSnippetData = {
    tabs: node.attrs.tabs,
    activeTab: node.attrs.activeTab,
  };

  return (
    <NodeViewWrapper className="my-3">
      <div
        className={`rounded-xl transition-shadow ${
          selected ? "ring-2 ring-orange-400 ring-offset-2 ring-offset-white" : ""
        }`}
      >
        <PrepCodeSnippet
          tabs={data.tabs}
          activeTab={data.activeTab}
          editable
          onChange={updateAttributes}
          onRemove={() => deleteNode()}
        />
      </div>
    </NodeViewWrapper>
  );
}
