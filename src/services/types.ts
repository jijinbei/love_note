// 共通のサービス層で使用する型定義

export interface Block {
  id: string;
  type: string;
  content: any;
  metadata?: {
    experimentId: string;
    orderIndex: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBlockRequest {
  type: string;
  content: any;
  experimentId: string;
}

export interface UpdateBlockRequest {
  id: string;
  content: any;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}

export interface GraphQLError extends Error {
  graphQLErrors?: Array<{
    message: string;
    locations?: Array<{ line: number; column: number }>;
    path?: string[];
  }>;
}
