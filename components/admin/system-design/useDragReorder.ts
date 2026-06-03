import { useCallback, useState } from "react";

export interface DragReorderState {
  draggedIndex: number | null;
  dragOverIndex: number | null;
}

export function useDragReorder(
  onReorder: (fromIndex: number, toIndex: number) => void,
  disabled = false,
) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const resetDrag = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  }, []);

  const getHandleProps = useCallback(
    (index: number) => ({
      draggable: !disabled,
      onDragStart: (event: React.DragEvent) => {
        if (disabled) return;
        setDraggedIndex(index);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(index));
      },
      onDragEnd: resetDrag,
    }),
    [disabled, resetDrag],
  );

  const getDropProps = useCallback(
    (index: number) => ({
      onDragOver: (event: React.DragEvent) => {
        if (disabled || draggedIndex === null) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        if (draggedIndex !== index) setDragOverIndex(index);
      },
      onDragLeave: () => {
        if (dragOverIndex === index) setDragOverIndex(null);
      },
      onDrop: (event: React.DragEvent) => {
        event.preventDefault();
        if (disabled || draggedIndex === null || draggedIndex === index) {
          resetDrag();
          return;
        }
        onReorder(draggedIndex, index);
        resetDrag();
      },
    }),
    [disabled, dragOverIndex, draggedIndex, onReorder, resetDrag],
  );

  const itemClassName = useCallback(
    (index: number, baseClassName = "") => {
      const isDragging = draggedIndex === index;
      const isOver = dragOverIndex === index && draggedIndex !== index;
      return [
        baseClassName,
        isDragging ? "opacity-50 ring-2 ring-orange-400 scale-[0.98]" : "",
        isOver ? "ring-2 ring-orange-500 border-orange-400 bg-orange-50/40" : "",
      ]
        .filter(Boolean)
        .join(" ");
    },
    [draggedIndex, dragOverIndex],
  );

  return {
    draggedIndex,
    dragOverIndex,
    getHandleProps,
    getDropProps,
    itemClassName,
  };
}
