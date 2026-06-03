import { Node, mergeAttributes } from "@tiptap/core";
import type { Editor } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import PrepCodeSnippetNodeView from "./PrepCodeSnippetNodeView";
import { createDefaultPrepCodeSnippet } from "../preparation/prepCodeSnippetTypes";

export const PrepCodeSnippetExtension = Node.create({
  name: "prepCodeSnippet",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    const defaults = createDefaultPrepCodeSnippet();
    return {
      tabs: {
        default: defaults.tabs,
        parseHTML: (element) => {
          try {
            return JSON.parse(element.getAttribute("data-tabs") || "[]");
          } catch {
            return defaults.tabs;
          }
        },
        renderHTML: (attributes) => ({
          "data-tabs": JSON.stringify(attributes.tabs),
        }),
      },
      activeTab: {
        default: 0,
        parseHTML: (element) =>
          Number.parseInt(element.getAttribute("data-active-tab") ?? "0", 10) || 0,
        renderHTML: (attributes) => ({
          "data-active-tab": String(attributes.activeTab),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-prep-code-snippet]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        class: "prep-code-snippet",
        "data-prep-code-snippet": "",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PrepCodeSnippetNodeView);
  },
});

export function insertPrepCodeSnippet(editor: Editor) {
  const defaults = createDefaultPrepCodeSnippet();
  editor
    .chain()
    .focus()
    .insertContent({
      type: "prepCodeSnippet",
      attrs: defaults,
    })
    .run();
}
