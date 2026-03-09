import { useState } from "react";
import type { Note } from "../../db.ts";
import { db } from "../../db.ts";
import DrawingCanvas from "./DrawingCanvas.tsx";
import Button from "../../components/ui/Button.tsx";

interface NoteEditorProps {
  note: Note;
  onBack: () => void;
}

export default function NoteEditor({ note, onBack }: NoteEditorProps) {
  const [mode, setMode] = useState<"text" | "draw">("text");
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);

  async function save(updates: Partial<Note>) {
    await db.notes.update(note.id, { ...updates, updatedAt: Date.now() });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <Button variant="ghost" size="sm" onClick={onBack}>
          ← Back
        </Button>

        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            save({ title: e.target.value });
          }}
          className="flex-1 bg-transparent text-lg font-semibold outline-none selectable"
          placeholder="Note title"
        />

        <div className="flex gap-1">
          <Button
            variant={mode === "text" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setMode("text")}
          >
            Text
          </Button>
          <Button
            variant={mode === "draw" ? "primary" : "ghost"}
            size="sm"
            onClick={() => setMode("draw")}
          >
            Draw
          </Button>
        </div>
      </div>

      {/* Content */}
      {mode === "text" ? (
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            save({ content: e.target.value });
          }}
          className="flex-1 bg-bg p-6 text-sm leading-relaxed outline-none resize-none selectable"
          placeholder="Start writing..."
        />
      ) : (
        <DrawingCanvas
          strokes={note.strokes}
          onChange={(strokes) => save({ strokes })}
        />
      )}
    </div>
  );
}
