import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./src-tauri/schema.graphql",
  documents: ["src/**/*.{ts,tsx}", "src/**/*.graphql"],
  ignoreNoDocuments: true,
  generates: {
    "./src/generated/": {
      preset: "client",
      config: {
        scalars: {
          UUID: "string",
          DateTime: "string",
        },
      },
    },
  },
  hooks: {
    afterOneFileWrite: ["prettier --write"],
  },
};

export default config;

