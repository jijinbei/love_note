type Props = {
    connected: boolean;
    serverName: string;
    url: string;
  };
  
  export default function ConnectionStatus({ connected, serverName, url }: Props) {
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 10px",
          borderRadius: 999,
          border: "1px solid #e5e7eb",
          background: "#fff",
        }}
        title={connected ? `Connected: ${url} (${serverName})` : "Disconnected"}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: connected ? "#10B981" : "#EF4444",
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: 13, color: "#374151" }}>
          {connected ? (
            <>
              <strong>Connected</strong> to <code>{serverName || "default"}</code>
            </>
          ) : (
            <strong>Disconnected</strong>
          )}
        </span>
        {connected && (
          <span style={{ fontSize: 12, color: "#6B7280" }}>
            (<code>{url}</code>)
          </span>
        )}
      </div>
    );
  }
  