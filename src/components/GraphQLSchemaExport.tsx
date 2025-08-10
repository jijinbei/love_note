import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";

export function GraphQLSchemaExport() {
  const [schema, setSchema] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const loadSchema = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setCopySuccess(false);

      const schemaSDL = await invoke<string>("export_graphql_schema");
      setSchema(schemaSDL);
    } catch (err) {
      console.error("Schema export error:", err);
      setError(`Failed to export schema: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!schema) return;

    try {
      setCopySuccess(false);
      await navigator.clipboard.writeText(schema);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (err) {
      console.error("Clipboard error:", err);
      setError(
        `Failed to copy to clipboard: ${err instanceof Error ? err.message : "Permission denied"}`
      );
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div className="p-5 font-sans max-w-[800px] mx-auto">
      <div className="mb-8 text-center">
        <h2 className="m-0 mb-2 text-2xl text-gray-800">
          📊 GraphQL Schema Export
        </h2>
        <p className="m-0 text-gray-500 text-base">
          Export your GraphQL schema to use with external visualization tools
        </p>
      </div>

      <div className="flex gap-3 justify-center mb-8">
        <button
          onClick={loadSchema}
          disabled={isLoading}
          className="px-6 py-3 text-base font-semibold rounded-lg shadow-md transition-all duration-200 ease-in-out flex items-center justify-center gap-2"
          style={{
            backgroundColor: isLoading ? "#a0aec0" : "#4299e1",
            color: "white",
            cursor: isLoading ? "not-allowed" : "pointer",
          }}
          onMouseOver={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = "#3182ce";
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseOut={(e) => {
            if (!isLoading) {
              e.currentTarget.style.backgroundColor = "#4299e1";
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          {isLoading ? "⏳ Loading..." : "📊 Load Schema"}
        </button>

        {schema && (
          <button
            onClick={copyToClipboard}
            className="px-6 py-3 text-base font-semibold rounded-lg shadow-md transition-all duration-200 ease-in-out flex items-center justify-center gap-2"
            style={{
              backgroundColor: "#48bb78",
              color: "white",
              cursor: "pointer",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#38a169";
              e.currentTarget.style.transform = "translateY(-1px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#48bb78";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            📋 Copy to Clipboard
          </button>
        )}
      </div>

      {/* Status Messages */}
      {copySuccess && (
        <div className="p-3 bg-green-100 border border-green-300 rounded-lg mb-5 text-center text-green-800 text-sm font-medium">
          ✅ Schema copied to clipboard successfully!
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-100 border border-red-300 rounded-lg mb-5 text-center text-red-800 text-sm">
          ❌ {error}
        </div>
      )}

      {/* Schema Preview */}
      {schema && (
        <div className="border border-gray-300 rounded-xl overflow-hidden bg-white shadow-md">
          <div className="p-3 bg-gray-100 border-b border-gray-300 flex justify-between items-center">
            <div className="text-sm font-semibold text-gray-700">
              📄 schema.graphql
            </div>
            <div className="text-xs text-gray-500">
              {schema.length.toLocaleString()} characters |{" "}
              {schema.split("\n").length} lines
            </div>
          </div>
          <div className="p-4 font-mono text-xs leading-relaxed text-gray-800 bg-gray-50 max-h-[300px] overflow-auto whitespace-pre-wrap">
            {schema.substring(0, 1000)}
            {schema.length > 1000 && (
              <div className="text-gray-500 italic mt-2">
                ... ({(schema.length - 1000).toLocaleString()} more characters)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 p-5 bg-gray-100 rounded-xl border-l-4 border-blue-500">
        <h3 className="m-0 mb-3 text-lg text-gray-800">
          🚀 Recommended Visualization Tools
        </h3>
        <ul className="m-0 pl-5 list-disc text-gray-700 leading-relaxed">
          <li>
            <strong>GraphQL Voyager:</strong>{" "}
            <code>https://graphql-kit.com/graphql-voyager/</code>
          </li>
          <li>
            <strong>GraphQL Editor:</strong>{" "}
            <code>https://app.graphqleditor.com/</code>
          </li>
          <li>
            <strong>GraphiQL:</strong> Interactive query interface
          </li>
        </ul>

        <div className="mt-4 p-3 bg-blue-100 rounded-lg text-blue-800 text-sm">
          💡 <strong>Tips:</strong> After copying, paste the schema into any of
          these tools to see an interactive graph visualization of your data
          relationships!
        </div>
      </div>
    </div>
  );
}
