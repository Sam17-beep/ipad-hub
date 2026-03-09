import { useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { v4 as uuidv4 } from "uuid";
import { format } from "date-fns";
import { db, type Note } from "../../db.ts";
import Card from "../../components/ui/Card.tsx";
import Button from "../../components/ui/Button.tsx";
import Modal from "../../components/ui/Modal.tsx";
import NoteEditor from "./NoteEditor.tsx";

export default function NotesPage() {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [folderName, setFolderName] = useState("");

  const folders = useLiveQuery(() => db.folders.toArray());

  const notes = useLiveQuery(
    () => {
      if (selectedFolder) {
        return db.notes.where("folderId").equals(selectedFolder).reverse().sortBy("updatedAt");
      }
      return db.notes.orderBy("updatedAt").reverse().toArray();
    },
    [selectedFolder]
  );

  // Keep editing note in sync with DB
  const liveEditingNote = useLiveQuery(
    () => (editingNote ? db.notes.get(editingNote.id) : undefined),
    [editingNote?.id]
  );

  async function createNote() {
    const note: Note = {
      id: uuidv4(),
      title: "Untitled",
      content: "",
      strokes: [],
      folderId: selectedFolder,
      tags: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.notes.add(note);
    setEditingNote(note);
  }

  async function deleteNote(id: string) {
    await db.notes.delete(id);
    if (editingNote?.id === id) setEditingNote(null);
  }

  async function addFolder() {
    if (!folderName.trim()) return;
    await db.folders.add({
      id: uuidv4(),
      name: folderName.trim(),
      parentId: null,
      color: "#3b82f6",
    });
    setFolderName("");
    setShowAddFolder(false);
  }

  // Show editor full-screen if editing
  if (editingNote && liveEditingNote) {
    return <NoteEditor note={liveEditingNote} onBack={() => setEditingNote(null)} />;
  }

  return (
    <div className="p-6 min-h-full flex flex-col">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-sm text-text-muted mt-0.5">{notes?.length ?? 0} notes</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowAddFolder(true)} className="px-4 py-2.5">
            + Folder
          </Button>
          <Button onClick={createNote} className="px-6 py-2.5 text-base">+ New Note</Button>
        </div>
      </div>

      {/* Folder tabs — horizontal scroll */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedFolder(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
            selectedFolder === null
              ? "bg-accent-blue text-white"
              : "bg-surface text-text-muted hover:text-text border border-border"
          }`}
        >
          All Notes
        </button>
        {folders?.map((folder) => (
          <button
            key={folder.id}
            onClick={() => setSelectedFolder(folder.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              selectedFolder === folder.id
                ? "bg-accent-blue text-white"
                : "bg-surface text-text-muted hover:text-text border border-border"
            }`}
          >
            {folder.name}
          </button>
        ))}
      </div>

      {/* Note grid — 2 columns for portrait */}
      <div className="flex-1 grid grid-cols-2 gap-4 auto-rows-min">
        {notes?.map((note) => (
          <Card
            key={note.id}
            hover
            onClick={() => setEditingNote(note)}
            className="group relative p-5 min-h-[140px] flex flex-col"
          >
            <h3 className="font-semibold text-base mb-2 truncate">{note.title}</h3>
            <p className="text-sm text-text-muted line-clamp-4 flex-1">
              {note.content || (note.strokes.length > 0 ? `${note.strokes.length} drawing strokes` : "Empty note")}
            </p>
            <div className="text-xs text-text-muted mt-3">
              {format(new Date(note.updatedAt), "MMM d, h:mm a")}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNote(note.id);
              }}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-coral transition-all text-lg"
            >
              ✕
            </button>
          </Card>
        ))}

        {notes?.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-32 text-text-muted">
            <div className="text-6xl mb-4">✎</div>
            <div className="text-lg">No notes yet</div>
            <div className="text-sm mt-1">Tap "New Note" to create one</div>
          </div>
        )}
      </div>

      {/* Add Folder Modal */}
      <Modal open={showAddFolder} onClose={() => setShowAddFolder(false)} title="New Folder">
        <div className="space-y-5">
          <input
            autoFocus
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addFolder()}
            placeholder="Folder name"
            className="w-full bg-bg border border-border rounded-xl px-4 py-3.5 text-base text-text placeholder:text-text-muted outline-none focus:border-accent-blue selectable"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowAddFolder(false)} className="px-6">Cancel</Button>
            <Button onClick={addFolder} disabled={!folderName.trim()} className="px-6">Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
