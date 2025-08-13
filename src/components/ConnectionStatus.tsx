// import React from "react";

type Kind = 'connected' | 'disconnected' | 'error';

type Props = {
  show: boolean;
  kind: Kind;
  message?: string;
  onClose: () => void;
};

const stylesByKind: Record<Kind, { wrap: string; dot: string; title: string }> =
  {
    connected: {
      wrap: 'bg-emerald-50 border-emerald-200 text-emerald-900',
      dot: 'bg-emerald-500',
      title: '接続されました',
    },
    disconnected: {
      wrap: 'bg-gray-50 border-gray-200 text-gray-900',
      dot: 'bg-gray-500',
      title: '切断されました',
    },
    error: {
      wrap: 'bg-rose-50 border-rose-200 text-rose-900',
      dot: 'bg-rose-500',
      title: '接続エラー',
    },
  };

export default function StatusBanner({ show, kind, message, onClose }: Props) {
  const s = stylesByKind[kind];

  return (
    <div
      className={`fixed top-4 right-0 transform transition-transform duration-300 z-50 ${
        show ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div
        className={`border px-4 py-3 rounded-l-lg shadow-md w-80 flex items-center gap-3 ${s.wrap}`}
      >
        {/* 左側の × ボタン */}
        <button
          onClick={onClose}
          className="border rounded px-2 py-1 text-xs hover:bg-white/40"
          aria-label="バナーを閉じる"
          title="バナーを閉じる"
        >
          ×
        </button>

        {/* 中央に状態タイトルとメッセージ */}
        <div className="flex-1 text-center">
          <div className="flex items-center justify-center gap-2 font-semibold">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${s.dot}`}
            />
            <span>{s.title}</span>
          </div>
          {kind !== 'connected' && message && (
            <div className="mt-1 text-sm break-all">{message}</div>
          )}
        </div>
      </div>
    </div>
  );
}
