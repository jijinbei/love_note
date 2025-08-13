import { useEffect, useRef, useState } from 'react';

export function WebSocketClient({
  url,
  onStatusChange,
  onDisconnect,
}: {
  url: string;
  onStatusChange?: (connected: boolean) => void;
  onDisconnect?: (reason: 'manual' | 'closed' | 'error') => void;
}) {
  const [input, setInput] = useState('Hello WebSocket!');
  const [log, setLog] = useState<string[]>([]);
  const [wsState, setWsState] = useState<number | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ★ 手動切断時だけ close するためのフラグ
  const manualCloseRef = useRef(false);

  const append = (message: string) => setLog(prev => [...prev, message]);
  const notifyStatus = (connected: boolean) => onStatusChange?.(connected);

  const disconnect = () => {
    manualCloseRef.current = true;
    if (wsRef.current) {
      wsRef.current.close(1000, 'manual');
      notifyStatus(false);
      onDisconnect?.('manual');
    }
  };

  const send = () => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(input);
      append(`📤 送信: ${input}`);
      setInput('');
    } else {
      append('⚠️ 未接続です。');
    }
  };

  useEffect(() => {
    if (!url) return;

    // 既存接続があり URL が変わる場合だけ閉じる
    if (wsRef.current) {
      if (
        wsRef.current.url === url &&
        wsRef.current.readyState === WebSocket.OPEN
      ) {
        append('✅ 既に接続済み');
        return;
      }
      wsRef.current.close(1000, 'reconnect');
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;
    setWsState(ws.readyState);

    ws.onopen = () => {
      append(`✅ 接続: ${url}`);
      setWsState(ws.readyState);
      notifyStatus(true);
    };

    ws.onmessage = e =>
      append(`📩 受信: ${typeof e.data === 'string' ? e.data : '[binary]'}`);

    ws.onclose = e => {
      append(`🔌 切断: code=${e.code}`);
      setWsState(ws.readyState);
      notifyStatus(false);
      // アンマウント由来では呼ばれない（アンマウントで close しないため）
      onDisconnect?.('closed');
    };

    ws.onerror = () => {
      append('❌ エラーが発生しました');
      setWsState(ws.readyState);
      notifyStatus(false);
      onDisconnect?.('error');
    };

    return () => {
      // ★ アンマウント時は close しない（表示を離れても接続維持）
      // 手動切断の後にアンマウントされた場合のみ後追いで close（保険）
      if (manualCloseRef.current && ws.readyState === WebSocket.OPEN) {
        ws.close(1000, 'cleanup-after-manual');
      }
      // ハンドラだけ外してリーク防止
      ws.onopen = ws.onclose = ws.onerror = ws.onmessage = null;
    };
  }, [url]);

  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold">Collaborative Server</h2>
      <p className="text-sm text-gray-600">URL: {url}</p>
      <p className="text-xs">
        状態: {wsState !== null ? getReadyStateString(wsState) : 'N/A'}
      </p>

      <div className="flex gap-2">
        <input
          className="border px-2 py-1 flex-1"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
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
      return 'CONNECTING';
    case 1:
      return 'OPEN';
    case 2:
      return 'CLOSING';
    case 3:
      return 'CLOSED';
    default:
      return 'UNKNOWN';
  }
}
