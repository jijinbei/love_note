import {
  createContext, useContext, useEffect, useMemo, useRef, useState, PropsWithChildren,
} from "react";
import * as A from "@automerge/automerge";

export type Note = { id: string; text: string; updatedAt: number };
export type DocType = { notes: Note[] };

export type SyncStatus = "disconnected" | "connecting" | "connected" | "error";

type Ctx = {
  doc: A.Doc<DocType>;
  status: SyncStatus;
  error?: string;
  addNote: (text: string) => void;
  updateNote: (id: string, text: string) => void;
};

const CtxAutomerge = createContext<Ctx | null>(null);
export const useAutomerge = () => {
  const v = useContext(CtxAutomerge);
  if (!v) throw new Error("useAutomerge must be used inside <AutomergeProvider>");
  return v;
};

const encodeChanges = (changes: Uint8Array[]) =>
  changes.map((c) => btoa(String.fromCharCode(...c)));

const decodeChanges = (encoded: string[]) =>
  encoded.map((b64) => new Uint8Array(atob(b64).split("").map((ch) => ch.charCodeAt(0))));

export function AutomergeProvider({
  wsUrl,
  roomName,
  children,
}: PropsWithChildren<{ wsUrl: string; roomName: string }>) {
  const [doc, setDoc] = useState<A.Doc<DocType>>(() => A.from<DocType>({ notes: [] }));
  const prevDocRef = useRef<A.Doc<DocType>>(doc);

  const [status, setStatus] = useState<SyncStatus>("disconnected");
  const [error, setError] = useState<string>();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!wsUrl || !roomName) {
      setStatus("disconnected");
      return;
    }

    setStatus("connecting");
    const ws = new WebSocket(wsUrl);
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
  }, [wsUrl, roomName]);

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

  const value = useMemo(() => ({ doc, status, error, ...api }), [doc, status, error, api]);

  return <CtxAutomerge.Provider value={value}>{children}</CtxAutomerge.Provider>;
}
