import { useEffect, useRef, useState } from "react";

export function WebSocketClient({
  url,
  onStatusChange,
  onDisconnect,
}: {
  url: string;
  onStatusChange?: (connected: boolean) => void;
  onDisconnect?: (reason: "manual" | "closed" | "error") => void;
}) {
  const [input, setInput] = useState("Hello WebSocket!");
  const [log, setLog] = useState<string[]>([]);
  const [wsState, setWsState] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const append = (message: string) => setLog((prev) => [...prev, message]);

  const notifyStatus = (connected: boolean) => {
    onStatusChange?.(connected);
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close(1000, "bye");
      notifyStatus(false);
      console.log("aaaa");
      onDisconnect?.("manual"); // 手動切断として通知
    }
  };

  const send = () => {
    const ws = wsRef.current;
    console.log("WebSocket readyState:", ws?.readyState, wsState, wsRef.current?.readyState);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(input);
      append(`📤 送信: ${input}`);
      setInput("");
    } else {
      append("⚠️ 未接続です。");
    }
  };

  useEffect(() => {
    if (!url) return;

    if (wsRef.current) {
      // すでに同じURLに接続しているなら再接続しない
      if (wsRef.current.url === url && wsRef.current.readyState === WebSocket.OPEN) {
        console.log("既に接続済み");
        return;
      }
  
      // 古い接続を明示的に閉じる
      wsRef.current.close(1000, "reconnect");
    }

    // disconnect(); // URL変更時に既存接続を閉じる

    const ws = new WebSocket(url);
    console.log(ws);
    wsRef.current = ws;
    setWsState(ws.readyState);
    console.log(wsRef?.current)

    ws.onopen = () => {
      append(`✅ 接続: ${url}`);
      setWsState(ws.readyState);
      notifyStatus(true);
    };

    ws.onmessage = (e) =>
      append(`📩 受信: ${typeof e.data === "string" ? e.data : "[binary]"}`);

    ws.onclose = (e) => {
      append(`🔌 切断: code=${e.code}`);
      setWsState(ws.readyState);
      notifyStatus(false);
      onDisconnect?.("closed"); // 自然切断
    };

    ws.onerror = () => {
      append("❌ エラーが発生しました");
      setWsState(ws.readyState);
      notifyStatus(false);
      onDisconnect?.("error"); // エラー切断
    };

    return () => {
      if (wsRef.current) {
        // wsRef.current.close(1000, "bye");
        // setWsState(WebSocket.CLOSING);
        console.log("useEffectクリーンアップ: WebSocket close()");
        ws.close(1000, "cleanup");
      }
    };
  }, [url]);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">Collaborative Server</h2>
      <p className="text-sm text-gray-600">URL: {url}</p>
      <p className="text-xs">状態: {wsState !== null ? getReadyStateString(wsState) : "N/A"}</p>

      <div className="flex gap-2">
        <input
          className="border px-2 py-1 flex-1"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="メッセージを入力"
        />
        <button className="border px-3 py-1" onClick={send}>
          送信
        </button>
      </div>

      <ul className="bg-gray-100 p-2 rounded h-48 overflow-y-auto text-sm">
        {log.map((l, i) => (
          <li key={i}>{l}</li>
        ))}
      </ul>

      <button className="border px-3 py-1 mt-2" onClick={disconnect}>
        サーバ切断
      </button>
    </div>
  );
}

function getReadyStateString(state: number): string {
  switch (state) {
    case 0:
      return "CONNECTING";
    case 1:
      return "OPEN";
    case 2:
      return "CLOSING";
    case 3:
      return "CLOSED";
    default:
      return "UNKNOWN";
  }
}