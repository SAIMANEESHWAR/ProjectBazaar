import { useCallback, useEffect, useRef, useState } from "react";
import type { Editor } from "@tiptap/core";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { uploadSdMediaFile } from "./system-design/uploadMedia";
import {
  PrepCodeSnippetExtension,
  insertPrepCodeSnippet,
} from "./prepCodeSnippetExtension";

const MANUAL_NUMBERED_LINE = /^\s*\d+[.)]\s*(.*)$/;

function parseManualNumberedLines(text: string): string[] | null {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;

  const items: string[] = [];
  for (const line of lines) {
    const match = line.match(MANUAL_NUMBERED_LINE);
    if (!match) return null;
    items.push(match[1].trim());
  }
  return items;
}

function toggleOrderedListSmart(editor: Editor) {
  const { from, to, empty } = editor.state.selection;

  if (!empty) {
    const selectedText = editor.state.doc.textBetween(from, to, "\n");
    const items = parseManualNumberedLines(selectedText);
    if (items) {
      editor
        .chain()
        .focus()
        .deleteRange({ from, to })
        .insertContent({
          type: "orderedList",
          content: items.map((text) => ({
            type: "listItem",
            content: [
              {
                type: "paragraph",
                content: text ? [{ type: "text", text }] : [],
              },
            ],
          })),
        })
        .run();
      return;
    }
  }

  editor.chain().focus().toggleOrderedList().run();
}

/** Inline images with a visible remove control (no S3 delete — only removes from content). */
const PrepImage = Image.extend({
  selectable: true,
  addNodeView() {
    return ({ node, getPos, editor }) => {
      const wrapper = document.createElement("div");
      wrapper.className = "prep-editor-image-wrapper";

      const img = document.createElement("img");
      img.src = node.attrs.src || "";
      img.alt = node.attrs.alt || "";
      img.className = "prep-editor-image";
      img.draggable = false;

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "prep-editor-image-remove";
      removeBtn.title = "Remove image";
      removeBtn.setAttribute("aria-label", "Remove image");
      removeBtn.textContent = "×";
      removeBtn.addEventListener("mousedown", (e) => e.preventDefault());
      removeBtn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        const pos = getPos();
        if (typeof pos === "number") {
          editor
            .chain()
            .focus()
            .deleteRange({ from: pos, to: pos + node.nodeSize })
            .run();
        }
      });

      wrapper.appendChild(img);
      wrapper.appendChild(removeBtn);

      return {
        dom: wrapper,
        update(updatedNode) {
          if (updatedNode.type.name !== "image") return false;
          img.src = updatedNode.attrs.src || "";
          img.alt = updatedNode.attrs.alt || "";
          return true;
        },
      };
    };
  },
});

export interface PrepRichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  disabled?: boolean;
}

type ToolbarButton = {
  label: string;
  title: string;
  action: () => void;
  isActive?: boolean;
};

function isImageFile(file: File): boolean {
  return file.type.toLowerCase().startsWith("image/");
}

function getImageFilesFromList(files: FileList | null | undefined): File[] {
  if (!files) return [];
  return Array.from(files).filter(isImageFile);
}

export default function PrepRichTextEditor({
  value,
  onChange,
  placeholder = "Write content here…",
  minHeight = "280px",
  disabled = false,
}: PrepRichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const insertImagesRef = useRef<(files: File[]) => Promise<void>>(async () => {});
  const dragCounterRef = useRef(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageSelected, setImageSelected] = useState(false);
  const [toolbarRevision, setToolbarRevision] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        codeBlock: false,
      }),
      PrepCodeSnippetExtension,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      PrepImage.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    editable: !disabled,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    onSelectionUpdate: ({ editor: ed }) => {
      setImageSelected(ed.isActive("image"));
      setToolbarRevision((revision) => revision + 1);
    },
    onTransaction: () => {
      setToolbarRevision((revision) => revision + 1);
    },
    editorProps: {
      handlePaste: (_view, event) => {
        if (disabled) return false;
        const images = getImageFilesFromList(event.clipboardData?.files);
        if (images.length === 0) return false;
        event.preventDefault();
        void insertImagesRef.current(images);
        return true;
      },
    },
  });

  const insertImages = useCallback(
    async (files: File[]) => {
      if (!editor || files.length === 0) return;
      setUploadError(null);
      setUploading(true);
      try {
        for (const file of files) {
          const url = await uploadSdMediaFile(file, "image");
          editor.chain().focus().setImage({ src: url, alt: file.name }).run();
        }
      } catch (err) {
        setUploadError(
          err instanceof Error ? err.message : "Image upload failed.",
        );
      } finally {
        setUploading(false);
        setIsDragOver(false);
        dragCounterRef.current = 0;
      }
    },
    [editor],
  );

  useEffect(() => {
    insertImagesRef.current = insertImages;
  }, [insertImages]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value !== current) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const removeSelectedImage = () => {
    if (!editor) return;
    if (editor.isActive("image")) {
      editor.chain().focus().deleteSelection().run();
      return;
    }
    editor.chain().focus().deleteNode("image").run();
  };

  const onImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = getImageFilesFromList(e.target.files);
    e.target.value = "";
    if (files.length > 0) await insertImages(files);
  };

  const setLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const hasDraggedImages = (event: React.DragEvent) => {
    const types = Array.from(event.dataTransfer?.types ?? []);
    return types.includes("Files");
  };

  const onDragEnter = (event: React.DragEvent) => {
    if (disabled || !hasDraggedImages(event)) return;
    event.preventDefault();
    dragCounterRef.current += 1;
    setIsDragOver(true);
  };

  const onDragLeave = (event: React.DragEvent) => {
    if (disabled || !hasDraggedImages(event)) return;
    event.preventDefault();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setIsDragOver(false);
    }
  };

  const onDragOver = (event: React.DragEvent) => {
    if (disabled || !hasDraggedImages(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  };

  const onDrop = (event: React.DragEvent) => {
    if (disabled) return;
    const images = getImageFilesFromList(event.dataTransfer?.files);
    if (images.length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);
    editor?.chain().focus();
    void insertImages(images);
  };

  if (!editor) return null;

  void toolbarRevision;

  const runToolbarAction = (action: () => void) => {
    action();
    setToolbarRevision((revision) => revision + 1);
  };

  const buttons: ToolbarButton[] = [
    {
      label: "H1",
      title: "Heading 1",
      action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      isActive: editor.isActive("heading", { level: 1 }),
    },
    {
      label: "H2",
      title: "Heading 2",
      action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      isActive: editor.isActive("heading", { level: 2 }),
    },
    {
      label: "H3",
      title: "Heading 3",
      action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      isActive: editor.isActive("heading", { level: 3 }),
    },
    {
      label: "B",
      title: "Bold",
      action: () => editor.chain().focus().toggleBold().run(),
      isActive: editor.isActive("bold"),
    },
    {
      label: "I",
      title: "Italic",
      action: () => editor.chain().focus().toggleItalic().run(),
      isActive: editor.isActive("italic"),
    },
    {
      label: "•",
      title: "Bullet list",
      action: () => editor.chain().focus().toggleBulletList().run(),
      isActive: editor.isActive("bulletList"),
    },
    {
      label: "1.",
      title: "Numbered list (select 1. lines to convert)",
      action: () => toggleOrderedListSmart(editor),
      isActive: editor.isActive("orderedList"),
    },
    {
      label: "{ }",
      title: "Insert multi-language code snippet",
      action: () => insertPrepCodeSnippet(editor),
      isActive: editor.isActive("prepCodeSnippet"),
    },
    {
      label: "❝",
      title: "Blockquote",
      action: () => editor.chain().focus().toggleBlockquote().run(),
      isActive: editor.isActive("blockquote"),
    },
    {
      label: "Link",
      title: "Insert link",
      action: setLink,
      isActive: editor.isActive("link"),
    },
    {
      label: uploading ? "…" : "Img",
      title: "Insert image",
      action: () => fileInputRef.current?.click(),
    },
    {
      label: "✕ Img",
      title: "Remove selected image",
      action: removeSelectedImage,
      isActive: imageSelected,
    },
  ];

  return (
    <div
      className={`rounded-xl border overflow-hidden bg-white transition-colors ${
        isDragOver
          ? "border-orange-400 ring-2 ring-orange-200"
          : "border-gray-200"
      }`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50">
        {buttons.map((btn) => (
          <button
            key={btn.label}
            type="button"
            title={btn.title}
            disabled={
              disabled ||
              uploading ||
              (btn.label === "Img" && uploading) ||
              (btn.label === "✕ Img" && !imageSelected)
            }
            onMouseDown={(event) => {
              event.preventDefault();
            }}
            onClick={() => runToolbarAction(btn.action)}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
              btn.isActive
                ? "bg-orange-100 border-orange-300 text-orange-700"
                : "bg-white border-gray-200 text-gray-700 hover:bg-gray-100"
            } disabled:opacity-50`}
          >
            {btn.label}
          </button>
        ))}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
          className="hidden"
          onChange={onImageFileChange}
        />
      </div>

      <div className="relative">
        {isDragOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-orange-50/90 border-2 border-dashed border-orange-400 rounded-lg m-2 pointer-events-none">
            <p className="text-sm font-medium text-orange-700">
              Drop images here to upload
            </p>
          </div>
        )}
        {uploading && !isDragOver && (
          <div className="absolute top-2 right-2 z-10 flex items-center gap-2 rounded-md bg-white/95 border border-orange-200 px-2.5 py-1 text-xs text-orange-700 shadow-sm">
            <span className="h-3 w-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            Uploading…
          </div>
        )}
        <EditorContent
          editor={editor}
          className="prep-rich-editor px-4 py-3 text-sm text-gray-800 focus:outline-none"
          style={{ minHeight }}
        />
      </div>

      <p className="px-4 pb-2 text-xs text-gray-400">
        Use {"{ }"} for tabbed code snippets (Java, Python, SQL, etc.). Select lines like 1. Item and click 1. to convert to a numbered list.
      </p>

      {uploadError && (
        <p className="px-4 pb-3 text-xs text-red-600">{uploadError}</p>
      )}

      <style>{`
        .prep-rich-editor .ProseMirror {
          min-height: ${minHeight};
          outline: none;
        }
        .prep-rich-editor .ProseMirror p.is-editor-empty:first-child::before {
          color: #9ca3af;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .prep-rich-editor .ProseMirror h1 { font-size: 1.5rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .prep-rich-editor .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 0.875rem 0 0.5rem; }
        .prep-rich-editor .ProseMirror h3 { font-size: 1.1rem; font-weight: 600; margin: 0.75rem 0 0.375rem; }
        .prep-rich-editor .ProseMirror p { margin: 0.5rem 0; line-height: 1.6; }
        .prep-rich-editor .ProseMirror strong,
        .prep-rich-editor .ProseMirror b {
          font-weight: 700;
        }
        .prep-rich-editor .ProseMirror em,
        .prep-rich-editor .ProseMirror i {
          font-style: italic;
        }
        .prep-rich-editor .ProseMirror ul,
        .prep-rich-editor .ProseMirror ol { margin: 0.5rem 0; padding-left: 1.5rem; }
        .prep-rich-editor .ProseMirror ul { list-style-type: disc; }
        .prep-rich-editor .ProseMirror ol { list-style-type: decimal; }
        .prep-rich-editor .ProseMirror li { margin: 0.25rem 0; display: list-item; }
        .prep-rich-editor .prep-code-snippet-node { margin: 0.75rem 0; overflow: visible; }
        .prep-rich-editor .ProseMirror { overflow: visible; }
        .prep-rich-editor .ProseMirror blockquote {
          border-left: 3px solid #f97316;
          margin: 0.75rem 0;
          padding-left: 1rem;
          color: #4b5563;
        }
        .prep-rich-editor .prep-editor-image-wrapper {
          position: relative;
          display: block;
          max-width: 100%;
          margin: 0.75rem 0;
        }
        .prep-rich-editor .prep-editor-image {
          display: block;
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
        }
        .prep-rich-editor .prep-editor-image-wrapper:hover .prep-editor-image,
        .prep-rich-editor .prep-editor-image-wrapper.ProseMirror-selectednode .prep-editor-image {
          outline: 2px solid #f97316;
          outline-offset: 2px;
        }
        .prep-rich-editor .prep-editor-image-remove {
          position: absolute;
          top: 0.5rem;
          right: 0.5rem;
          width: 1.75rem;
          height: 1.75rem;
          border-radius: 9999px;
          border: none;
          background: rgba(17, 24, 39, 0.75);
          color: white;
          font-size: 1.125rem;
          line-height: 1;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .prep-rich-editor .prep-editor-image-wrapper:hover .prep-editor-image-remove,
        .prep-rich-editor .prep-editor-image-wrapper.ProseMirror-selectednode .prep-editor-image-remove {
          opacity: 1;
        }
        .prep-rich-editor .prep-editor-image-remove:hover {
          background: #dc2626;
        }
        .prep-rich-editor .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.75rem 0;
        }
        .prep-rich-editor .ProseMirror a { color: #ea580c; text-decoration: underline; }
      `}</style>
    </div>
  );
}
