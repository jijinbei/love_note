import {
  createContext, useContext, useEffect, useMemo, useRef, useState, PropsWithChildren
} from "react";
import * as A from "@automerge/automerge";

/** === Types === */
export type Note = { id: string; text: string; updatedAt: number };
export type DocType = { notes: Note[] };

export type SyncStatus = "disconnected" | "connecting" | "connected" | "error";

type Presence = {
  userId: string;
  noteId: string;
  start: number;
  end: number;
  color: string;
  ts: number;
};

type Ctx = {
  doc: A.Doc<DocType>;
  status: SyncStatus;
  error?: string;
  addNote: (text: string) => void;
  updateNote: (id: string, text: string) => void;
  cursors: Map<string, Presence>;
  reportCursor: (editorRoot: HTMLElement, noteId: string) => void;
};

/** === Context Hook === */
const CtxAutomerge = createContext<Ctx | null>(null);
export const useAutomerge = () => {
  const v = useContext(CtxAutomerge);
  if (!v) throw new Error("useAutomerge must be used inside <AutomergeProvider>");
  return v;
};

/** === Utilities === */
const encodeChanges = (changes: Uint8Array[]) =>
  changes.map((c) => btoa(String.fromCharCode(...c)));

const decodeChanges = (encoded: string[]) =>
  encoded.map((b64) => new Uint8Array(atob(b64).split("").map((ch) => ch.charCodeAt(0))));

function getCursorPosition(root: HTMLElement): { start: number; end: number } {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return { start: 0, end: 0 };
  const range = sel.getRangeAt(0);

  if (!root.contains(range.startContainer) || !root.contains(range.endContainer)) {
    return { start: 0, end: 0 };
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let start = 0, end = 0, acc = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const len = node.textContent?.length ?? 0;
    if (node === range.startContainer) start = acc + range.startOffset;
    if (node === range.endContainer)   end   = acc + range.endOffset;
    acc += len;
  }
  if (start > end) [start, end] = [end, start];
  return { start, end };
}

/** === Provider === */
export function AutomergeProvider({
  wsUrl,
  roomName,
  children,
  onStatusChange,
}: PropsWithChildren<{ wsUrl: string; roomName: string; onStatusChange?: (status: SyncStatus) => void }>) {
  const [doc, setDoc] = useState<A.Doc<DocType>>(() => A.from<DocType>({ notes: [] }));
  const prevDocRef = useRef<A.Doc<DocType>>(doc);

  const [status, setStatus] = useState<SyncStatus>("disconnected");
  const [error, setError] = useState<string>();
  const wsRef = useRef<WebSocket | null>(null);

  const [cursors, setCursors] = useState<Map<string, Presence>>(new Map());
  const userIdRef = useRef(
    (crypto as any).randomUUID?.() ?? Math.random().toString(36).slice(2)
  );
  const myUserId = userIdRef.current;
  const myColor = useMemo(() => {
    const colors = ["#1e90ff", "#e91e63", "#ff9800", "#4caf50", "#9c27b0"];
    return colors[Math.floor(Math.random() * colors.length)];
  }, []);

  useEffect(() => {
    if (!wsUrl || !roomName) {
      setStatus("disconnected");
      onStatusChange?.("disconnected");
      return;
    }

    setStatus("connecting");
    onStatusChange?.("connecting");
    const ws = new WebSocket(`${wsUrl}?room=${roomName}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus("connected");
      ws.send(JSON.stringify({ type: "join", room: roomName }));
      const snap = A.save(doc);
      ws.send(JSON.stringify({ type: "snapshot", room: roomName, data: Array.from(snap) }));
    };

    ws.onerror = () => {
      setStatus("error");
      setError("WebSocket error");
    };

    ws.onclose = () => {
      setStatus("disconnected");
      wsRef.current = null;
    };

    ws.onmessage = (evt) => {
      try {
        if (typeof evt.data === "string") {
          const msg = JSON.parse(evt.data);
          if (msg.type === "snapshot" && Array.isArray(msg.data)) {
            const loaded = A.load<DocType>(new Uint8Array(msg.data));
            prevDocRef.current = loaded;
            setDoc(loaded);
          } else if (msg.type === "changes" && Array.isArray(msg.changes)) {
            const changes = decodeChanges(msg.changes);
            const [next] = A.applyChanges(doc, changes);
            prevDocRef.current = next;
            setDoc(next);
          } else if (msg.type === "presence") {
            const p: Presence = msg.presence;
            if (!p || p.userId === myUserId) return;
            setCursors((prev) => {
              const m = new Map(prev);
              m.set(p.userId, p);
              return m;
            });
          }
        } else if (evt.data instanceof Blob) {
          (evt.data as Blob).arrayBuffer().then((buf) => {
            const next = A.load<DocType>(new Uint8Array(buf));
            prevDocRef.current = next;
            setDoc(next);
          });
        }
      } catch {
        setError("message handling error");
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [wsUrl, roomName, doc, myUserId]);

  const applyChange = (fn: A.ChangeFn<DocType>) => {
    const next = A.change(doc, fn);
    const changes = A.getChanges(prevDocRef.current, next);
    prevDocRef.current = next;
    setDoc(next);

    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN && changes.length) {
      ws.send(
        JSON.stringify({
          type: "changes",
          room: roomName,
          changes: encodeChanges(changes),
        })
      );
    }
  };

  const reportCursor = (editorRoot: HTMLElement, noteId: string) => {
    if (!editorRoot) return;
    const { start, end } = getCursorPosition(editorRoot);
    const ws = wsRef.current;
    const presence: Presence = {
      userId: myUserId, noteId, start, end, color: myColor, ts: Date.now()
    };
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "presence", room: roomName, presence }));
    }
    setCursors((prev) => {
      const m = new Map(prev);
      m.set(myUserId, presence);
      return m;
    });
  };

  const api = useMemo(
    () => ({
      addNote: (text: string) =>
        applyChange((d) => {
          const id =
            (crypto as any).randomUUID?.() ?? Math.random().toString(36).slice(2);
          d.notes.push({ id, text, updatedAt: Date.now() });
        }),
      updateNote: (id: string, text: string) =>
        applyChange((d) => {
          const n = d.notes.find((n) => n.id === id);
          if (n) {
            n.text = text;
            n.updatedAt = Date.now();
          }
        }),
    }),
    [doc, roomName, wsUrl]
  );

  const value = useMemo(
    () => ({ doc, status, error, ...api, cursors, reportCursor }),
    [doc, status, error, api, cursors]
  );

  return <CtxAutomerge.Provider value={value}>{children}</CtxAutomerge.Provider>;
}

/** === Overlay === */
export function CursorOverlay({
  editorRef,
  noteId,
}: {
  editorRef: React.RefObject<HTMLElement>;
  noteId: string;
}) {
  const { cursors } = useAutomerge();
  const [boxes, setBoxes] = useState<{ key: string; rect: DOMRect; color: string; caret: boolean }[]>([]);

  useEffect(() => {
    const root = editorRef.current;
    if (!root) return;

    function rangeFromOffsets(start: number, end: number): Range | null {
      const r = document.createRange();
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let acc = 0, sNode: Text | null = null, eNode: Text | null = null, sOff = 0, eOff = 0;

      while (walker.nextNode()) {
        const node = walker.currentNode as Text;
        const len = node.textContent?.length ?? 0;
        if (!sNode && start <= acc + len) { sNode = node; sOff = start - acc; }
        if (!eNode && end   <= acc + len) { eNode = node; eOff = end   - acc; break; }
        acc += len;
      }
      if (!sNode) return null;
      if (!eNode) { eNode = sNode; eOff = sOff; }
      try {
        r.setStart(sNode, Math.max(0, Math.min(sNode.length, sOff)));
        r.setEnd  (eNode, Math.max(0, Math.min(eNode.length, eOff)));
        return r;
      } catch { return null; }
    }

    const out: { key: string; rect: DOMRect; color: string; caret: boolean }[] = [];
    cursors.forEach((p, uid) => {
      if (p.noteId !== noteId) return;
      const range = rangeFromOffsets(p.start, p.end);
      if (!range) return;
      const rects = Array.from(range.getClientRects());
      if (rects.length === 0) return;
      rects.forEach((rect, i) => out.push({
        key: uid + ":" + i,
        rect,
        color: p.color,
        caret: p.start === p.end
      }));
    });
    setBoxes(out);
  }, [cursors, editorRef, noteId]);

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 50 }}>
      {boxes.map(({ key, rect, color, caret }) => (
        <div
          key={key}
          style={{
            position: "fixed",
            left: rect.left,
            top: rect.top,
            width: caret ? 2 : rect.width,
            height: rect.height,
            background: caret ? color : `${color}40`,
            borderLeft: caret ? `2px solid ${color}` : "none",
            borderRadius: caret ? 0 : 3,
          }}
        />
      ))}
    </div>
  );
}
