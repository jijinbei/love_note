import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onCancel: () => void;
  onConnect: (payload: { url: string; name: string }) => void;
};

export default function ConnectWidget({ open, onCancel, onConnect }: Props) {
  const [url, setUrl] = useState("ws://127.0.0.1:8080/ws");
  const [name, setName] = useState("demo-room");

  useEffect(() => {
    if (open) {
      // setUrl("ws://127.0.0.1:8080/ws");
      // setName("demo-room");
    }
  }, [open]);

  if (!open) return null;

  const canConnect = url.trim().length > 0 && name.trim().length > 0;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          background: "white",
          borderRadius: 12,
          boxShadow: "0 6px 24px rgba(0,0,0,0.2)",
          padding: 20,
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
          Connect to Collaboration Server
        </h2>
        <p style={{ color: "#666", marginBottom: 16 }}>
          WebSocket のエンドポイントとサーバ名（部屋名）を入力してください。
        </p>

        <label style={{ display: "block", fontSize: 12, color: "#555" }}>
          Server URL
        </label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="ws://127.0.0.1:8080/ws"
          style={{
            width: "100%",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "10px 12px",
            margin: "6px 0 14px",
          }}
        />

        <label style={{ display: "block", fontSize: 12, color: "#555" }}>
          Server Name (Room)
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="demo-room"
          style={{
            width: "100%",
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: "10px 12px",
            margin: "6px 0 20px",
          }}
        />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              border: "1px solid #ddd",
              background: "#fff",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            disabled={!canConnect}
            onClick={() => onConnect({ url: url.trim(), name: name.trim() })}
            style={{
              border: "none",
              background: canConnect ? "#2563EB" : "#9CA3AF",
              color: "white",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: canConnect ? "pointer" : "not-allowed",
            }}
          >
            Connect
          </button>
        </div>
      </div>
    </div>
  );
}
