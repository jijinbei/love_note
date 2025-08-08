import { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./src-tauri/schema.graphql",
  generates: {
    "./src/generated/graphql.ts": {
      plugins: ["typescript", "typescript-operations"],
      config: {
        useIndexSignature: true,
        mappers: {
          DateTime: "string",
          UUID: "string",
        },
        scalars: {
          DateTime: "string",
          UUID: "string",
        },
      },
    },
  },
  hooks: {
    afterOneFileWrite: ["prettier --write"],
  },
};

export default config;
