import { print } from 'graphql';
import type { DocumentNode } from 'graphql';

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

// Utility function to extract query string from TypedDocumentNode
export const getQueryString = (document: any): string => {
  // For GraphQL Code Generator client preset documents
  if (document?.definitions && Array.isArray(document.definitions)) {
    return print(document as DocumentNode);
  }
  // Try to extract from .loc.source.body (for parsed documents)
  if (document?.loc?.source?.body) {
    return document.loc.source.body;
  }
  // Try to use print() function for AST documents
  if (document?.kind === 'Document') {
    return print(document as DocumentNode);
  }
  // Fallback: if it's already a string, return it
  if (typeof document === 'string') {
    return document;
  }

  console.error(
    'Failed to extract query string. Document structure:',
    document
  );
  throw new Error('Unable to extract query string from document');
};
