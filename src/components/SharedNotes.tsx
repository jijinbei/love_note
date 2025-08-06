import { useAutomerge } from "./AutomergeRepo";

export default function SharedNotes() {
  const { doc, addNote, updateNote } = useAutomerge();

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <button
        onClick={() => addNote("New note")}
        className="px-3 py-1 rounded border"
      >
        + Add Note
      </button>

      <div style={{ display: "grid", gap: 8 }}>
        {doc.notes.map((n) => (
          <div key={n.id} className="border rounded p-2">
            <input
              className="w-full"
              value={n.text}
              onChange={(e) => updateNote(n.id, e.target.value)}
            />
            <div className="text-xs text-gray-500">updated: {new Date(n.updatedAt).toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
