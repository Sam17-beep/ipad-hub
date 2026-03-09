import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format } from "date-fns";
import type { Todo } from "../../db.ts";
import Checkbox from "../../components/ui/Checkbox.tsx";
import Badge from "../../components/ui/Badge.tsx";

const priorityDots: Record<string, string> = {
  high: "bg-accent-coral",
  medium: "bg-accent-yellow",
  low: "bg-accent-green",
};

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 bg-surface border border-border rounded-2xl px-5 py-4 group"
    >
      <button
        {...attributes}
        {...listeners}
        className="text-text-muted hover:text-text cursor-grab active:cursor-grabbing touch-none text-lg"
      >
        ⠿
      </button>

      <Checkbox checked={todo.completed} onChange={(c) => onToggle(todo.id, c)} />

      <div className="flex-1 min-w-0">
        <span className={`block text-[15px] ${todo.completed ? "line-through text-text-muted" : ""}`}>
          {todo.title}
        </span>
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-2 h-2 rounded-full ${priorityDots[todo.priority]}`} />
          <span className="text-xs text-text-muted capitalize">{todo.priority}</span>
          {todo.dueDate && (
            <>
              <span className="text-border">·</span>
              <span className="text-xs text-text-muted">
                {format(new Date(todo.dueDate), "MMM d")}
              </span>
            </>
          )}
        </div>
      </div>

      {todo.category && (
        <Badge color="bg-accent-purple/20 text-accent-purple">{todo.category}</Badge>
      )}

      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-coral transition-all text-lg p-1"
      >
        ✕
      </button>
    </div>
  );
}
