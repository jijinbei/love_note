import { useState, useEffect } from 'react';

type Props = {
  connected: boolean;
  show: boolean;
  serverName: string;
  wsUrl: string;
  onConnect: (payload: { url: string; name: string }) => void;
  onHide: () => void;
  onShow: () => void;
};

export default function ConnectWidget({
  connected,
  show,
  serverName,
  wsUrl,
  onConnect,
  onHide,
  onShow,
}: Props) {
  const [name, setName] = useState(serverName || '');
  const [url, setUrl] = useState(wsUrl || '');

  // 接続状態が変わったらフォーム初期値を追従
  useEffect(() => {
    if (!connected) {
      setName(serverName || '');
      setUrl(wsUrl || '');
    }
  }, [connected, serverName, wsUrl]);

  if (!show) {
    return (
      <div className="flex justify-end mb-3">
        <button
          onClick={onShow}
          className="text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded px-2 py-1 text-sm"
        >
          バナーを表示
        </button>
      </div>
    );
  }

  if (connected) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded mb-4 flex items-center gap-3">
        <span className="font-semibold">Connected</span>
        <span className="text-sm break-all">
          Server: <b>{serverName || '(unnamed)'}</b>
        </span>
        <span className="text-sm break-all">
          URL: <b>{wsUrl}</b>
        </span>
        <div className="flex-1" />
        <button
          onClick={onHide}
          className="text-emerald-700 hover:text-emerald-900 border border-emerald-300 hover:border-emerald-400 rounded px-2 py-1 text-sm"
          title="バナーを隠す"
        >
          非表示
        </button>
      </div>
    );
  }

  // 未接続時：入力＋接続ボタン
  return (
    <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded mb-4">
      <div className="flex items-center gap-3">
        <span className="font-semibold">Not connected</span>
        <div className="flex-1" />
        <button
          onClick={onHide}
          className="text-amber-700 hover:text-amber-900 border border-amber-300 hover:border-amber-400 rounded px-2 py-1 text-sm"
          title="バナーを隠す"
        >
          非表示
        </button>
      </div>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2">
        <label className="text-sm text-gray-700">
          Server Name
          <input
            className="mt-1 w-full border border-gray-300 rounded px-2 py-1"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="my-collab-room"
          />
        </label>
        <label className="text-sm text-gray-700 md:col-span-2">
          WebSocket URL
          <input
            className="mt-1 w-full border border-gray-300 rounded px-2 py-1"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="ws://127.0.0.1:8080/ws"
          />
        </label>
      </div>
      <div className="mt-3 flex justify-end">
        <button
          onClick={() => onConnect({ url, name })}
          className="bg-emerald-600 text-white rounded px-3 py-1 text-sm hover:bg-emerald-700"
        >
          接続
        </button>
      </div>
    </div>
  );
}
