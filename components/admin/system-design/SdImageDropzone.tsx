import React, { useCallback, useEffect, useRef, useState } from "react";

const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

const ACCEPT_ATTR = "image/png,image/jpeg,image/gif,image/webp";

function isAcceptedImage(file: File): boolean {
  if (ACCEPTED_TYPES.has(file.type)) return true;
  return /\.(png|jpe?g|gif|webp)$/i.test(file.name);
}

export interface SdImageDropzoneProps {
  label: string;
  hint?: string;
  existingUrl?: string;
  pendingFile: File | null;
  disabled?: boolean;
  onFileSelect: (file: File) => void;
  onRemove?: () => void;
}

export default function SdImageDropzone({
  label,
  hint,
  existingUrl,
  pendingFile,
  disabled = false,
  onFileSelect,
  onRemove,
}: SdImageDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!pendingFile) {
      setPendingPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPendingPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  const previewUrl = pendingPreviewUrl ?? existingUrl ?? null;

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file || disabled) return;
      if (!isAcceptedImage(file)) {
        setLocalError("Please drop a PNG, JPEG, GIF, or WebP image.");
        return;
      }
      setLocalError(null);
      onFileSelect(file);
    },
    [disabled, onFileSelect],
  );

  const handleDrag = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (disabled) return;
      if (event.type === "dragenter" || event.type === "dragover") {
        setDragActive(true);
      } else if (event.type === "dragleave") {
        setDragActive(false);
      }
    },
    [disabled],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      setDragActive(false);
      if (disabled) return;
      handleFile(event.dataTransfer.files?.[0]);
    },
    [disabled, handleFile],
  );

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {hint && <p className="text-xs text-gray-500 mb-3">{hint}</p>}

      {previewUrl && (
        <div className="mb-3 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
          <img src={previewUrl} alt="" className="w-full h-36 object-cover" />
        </div>
      )}

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors cursor-pointer ${
          disabled
            ? "opacity-60 cursor-not-allowed border-gray-200 bg-gray-50"
            : dragActive
              ? "border-orange-500 bg-orange-50"
              : "border-gray-300 bg-gray-50/80 hover:border-orange-400 hover:bg-orange-50/60"
        }`}
      >
        <svg
          className="mx-auto mb-2 h-8 w-8 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <p className="text-sm font-medium text-gray-700">
          {dragActive ? "Drop image here" : "Drag and drop an image"}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          or{" "}
          <span className="font-medium text-orange-600">click to browse</span>
        </p>
        <p className="mt-2 text-[11px] text-gray-400">PNG, JPEG, GIF, WebP · max 8 MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        disabled={disabled}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          handleFile(file);
        }}
      />

      {localError && <p className="mt-2 text-xs text-red-600">{localError}</p>}

      {existingUrl && !pendingFile && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="mt-2 text-xs text-red-600 disabled:opacity-60"
        >
          Remove image
        </button>
      )}
    </div>
  );
}
