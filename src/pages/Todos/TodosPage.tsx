import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { v4 as uuidv4 } from "uuid";
import { db, type Todo } from "../../db.ts";
import TodoItem from "./TodoItem.tsx";
import Button from "../../components/ui/Button.tsx";
import Modal from "../../components/ui/Modal.tsx";

const categories = ["All", "Work", "Personal", "Health", "Learning"];
const priorities = ["low", "medium", "high"] as const;

export default function TodosPage() {
  const [filter, setFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<Todo["priority"]>("medium");
  const [category, setCategory] = useState("Personal");
  const [dueDate, setDueDate] = useState("");

  const todos = useLiveQuery(async () => {
    const query = db.todos.orderBy("sortOrder");
    const all = await query.toArray();
    if (filter === "All") return all;
    return all.filter((t) => t.category === filter);
  }, [filter]);

  async function addTodo() {
    if (!title.trim()) return;
    const maxOrder = (await db.todos.orderBy("sortOrder").last())?.sortOrder ?? 0;
    await db.todos.add({
      id: uuidv4(),
      title: title.trim(),
      completed: false,
      priority,
      dueDate: dueDate || null,
      category,
      sortOrder: maxOrder + 1,
      createdAt: Date.now(),
    });
    setTitle("");
    setDueDate("");
    setShowAdd(false);
  }

  async function toggleTodo(id: string, completed: boolean) {
    await db.todos.update(id, { completed });
  }

  async function deleteTodo(id: string) {
    await db.todos.delete(id);
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !todos) return;

    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);
    const reordered = arrayMove(todos, oldIndex, newIndex);

    await db.transaction("rw", db.todos, async () => {
      for (let i = 0; i < reordered.length; i++) {
        await db.todos.update(reordered[i].id, { sortOrder: i });
      }
    });
  }

  const activeTodos = todos?.filter((t) => !t.completed) ?? [];
  const completedTodos = todos?.filter((t) => t.completed) ?? [];

  return (
    <div className="p-6 min-h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl font-bold">Todos</h1>
          <p className="text-sm text-text-muted mt-0.5">
            {activeTodos.length} active · {completedTodos.length} done
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="px-6 py-2.5 text-base">+ Add Todo</Button>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 mb-5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === c
                ? "bg-accent-blue text-white"
                : "bg-surface text-text-muted hover:text-text border border-border"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Todo list */}
      <div className="flex-1 space-y-2.5">
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={activeTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            {activeTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
            ))}
          </SortableContext>
        </DndContext>

        {completedTodos.length > 0 && (
          <>
            <div className="text-sm text-text-muted pt-6 pb-2 font-medium">
              Completed ({completedTodos.length})
            </div>
            {completedTodos.map((todo) => (
              <TodoItem key={todo.id} todo={todo} onToggle={toggleTodo} onDelete={deleteTodo} />
            ))}
          </>
        )}

        {todos?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-text-muted">
            <div className="text-6xl mb-4">☑</div>
            <div className="text-lg">No todos yet</div>
            <div className="text-sm mt-1">Tap "Add Todo" to get started</div>
          </div>
        )}
      </div>

      <Modal open={showAdd} onClose={() => setShowAdd(false)} title="Add Todo">
        <div className="space-y-5">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTodo()}
            placeholder="What needs to be done?"
            className="w-full bg-bg border border-border rounded-xl px-4 py-3.5 text-base text-text placeholder:text-text-muted outline-none focus:border-accent-blue selectable"
          />

          <div>
            <label className="text-sm text-text-muted block mb-2">Priority</label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-colors ${
                    priority === p ? "bg-accent-blue text-white" : "bg-surface-hover text-text-muted"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted block mb-2">Category</label>
            <div className="flex gap-2">
              {categories.filter((c) => c !== "All").map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    category === c ? "bg-accent-purple text-white" : "bg-surface-hover text-text-muted"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-text-muted block mb-2">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-bg border border-border rounded-xl px-4 py-2.5 text-base text-text outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setShowAdd(false)} className="px-6">Cancel</Button>
            <Button onClick={addTodo} disabled={!title.trim()} className="px-6">Add</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
