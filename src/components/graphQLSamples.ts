// GraphQL Sample Queries for Testing
// これらのサンプルクエリは、アプリケーションのGraphQL APIをテストするために使用されます

export interface GraphQLSample {
  name: string;
  query: string;
  variables: string;
}

export const graphQLSamples: GraphQLSample[] = [
  // User Queries
  {
    name: 'Get All Users',
    query: `query GetUsers {
  users {
    id
    username
    email
    displayName
    createdAt
    updatedAt
  }
}`,
    variables: '{}'
  },
  {
    name: 'Create User - Full',
    query: `mutation CreateUser($input: CreateUserRequest!) {
  createUser(input: $input) {
    id
    username
    email
    displayName
    createdAt
    updatedAt
  }
}`,
    variables: JSON.stringify({
      input: {
        username: "testuser",
        email: "test@example.com",
        displayName: "Test User"
      }
    }, null, 2)
  },

  // Workspace Queries
  {
    name: 'Get All Workspaces',
    query: `query GetWorkspaces {
  workspaces {
    id
    name
    description
    createdAt
    updatedAt
  }
}`,
    variables: '{}'
  },
  {
    name: 'Create Workspace - Basic',
    query: `mutation CreateWorkspace($input: CreateWorkspaceRequest!) {
  createWorkspace(input: $input) {
    id
    name
    description
    createdAt
    updatedAt
  }
}`,
    variables: JSON.stringify({
      input: {
        name: "GraphQL Test Lab",
        description: "Created via GraphQL"
      }
    }, null, 2)
  },

  // Project Queries
  {
    name: 'Get Projects by Workspace',
    query: `query GetProjects($workspaceId: String!) {
  projects(workspaceId: $workspaceId) {
    id
    name
    description
    workspaceId
    createdAt
    updatedAt
  }
}`,
    variables: JSON.stringify({
      workspaceId: "replace-with-workspace-id"
    }, null, 2)
  },
  {
    name: 'Create Project',
    query: `mutation CreateProject($input: CreateProjectRequest!) {
  createProject(input: $input) {
    id
    name
    description
    workspaceId
    createdAt
    updatedAt
  }
}`,
    variables: JSON.stringify({
      input: {
        workspaceId: "replace-with-workspace-id",
        name: "Protein Analysis Project",
        description: "Analyzing protein structures and interactions"
      }
    }, null, 2)
  },

  // Experiment Queries
  {
    name: 'Get Experiments by Project',
    query: `query GetExperiments($projectId: String!) {
  experiments(projectId: $projectId) {
    id
    title
    projectId
    createdAt
    updatedAt
  }
}`,
    variables: JSON.stringify({
      projectId: "replace-with-project-id"
    }, null, 2)
  },
  {
    name: 'Create Experiment',
    query: `mutation CreateExperiment($input: CreateExperimentRequest!) {
  createExperiment(input: $input) {
    id
    title
    projectId
    createdAt
    updatedAt
  }
}`,
    variables: JSON.stringify({
      input: {
        projectId: "replace-with-project-id",
        title: "Sample Preparation Experiment"
      }
    }, null, 2)
  },

  // Block Queries
  {
    name: 'Get Blocks by Experiment',
    query: `query GetBlocks($experimentId: String!) {
  blocks(experimentId: $experimentId) {
    id
    experimentId
    blockType
    content
    orderIndex
    createdAt
    updatedAt
  }
}`,
    variables: JSON.stringify({
      experimentId: "replace-with-experiment-id"
    }, null, 2)
  },
  {
    name: 'Create Note Block',
    query: `mutation CreateBlock($input: CreateBlockInput!) {
  createBlock(input: $input) {
    id
    experimentId
    blockType
    content
    orderIndex
    createdAt
    updatedAt
  }
}`,
    variables: JSON.stringify({
      input: {
        experimentId: "replace-with-experiment-id",
        blockType: "NoteBlock",
        content: JSON.stringify({
          type: "NoteBlock",
          text: "This is a test note created via GraphQL. It contains important observations about the experiment."
        }),
        orderIndex: 1
      }
    }, null, 2)
  },
  //   {
  //     name: 'Create Table Block',
  //     query: `mutation CreateBlock($input: CreateBlockInput!) {
  //   createBlock(input: $input) {
  //     id
  //     experimentId
  //     blockType
  //     content
  //     orderIndex
  //     createdAt
  //     updatedAt
  //   }
  // }`,
  //     variables: JSON.stringify({
  //       input: {
  //         experimentId: "replace-with-experiment-id",
  //         blockType: "TableBlock",
  //         content: JSON.stringify({
  //           type: "TableBlock",
  //           headers: ["Sample ID", "Concentration (mg/mL)", "pH", "Temperature (°C)"],
  //           rows: [
  //             ["S001", "2.5", "7.4", "25.0"],
  //             ["S002", "3.1", "7.2", "24.8"],
  //             ["S003", "1.8", "7.6", "25.2"],
  //             ["S004", "4.2", "7.0", "24.5"]
  //           ]
  //         }),
  //         orderIndex: 2
  //       }
  //     }, null, 2)
  //   },
  //   {
  //     name: 'Create Image Block',
  //     query: `mutation CreateBlock($input: CreateBlockInput!) {
  //   createBlock(input: $input) {
  //     id
  //     experimentId
  //     blockType
  //     content
  //     orderIndex
  //     createdAt
  //     updatedAt
  //   }
  // }`,
  //     variables: JSON.stringify({
  //       input: {
  //         experimentId: "replace-with-experiment-id",
  //         blockType: "ImageBlock",
  //         content: JSON.stringify({
  //           type: "ImageBlock",
  //           path: "/uploads/microscope_image_001.jpg",
  //           alt: "Microscope image showing cell structure at 400x magnification"
  //         }),
  //         orderIndex: 3
  //       }
  //     }, null, 2)
  //   },
  //   {
  //     name: 'Create Sample Reference Block',
  //     query: `mutation CreateBlock($input: CreateBlockInput!) {
  //   createBlock(input: $input) {
  //     id
  //     experimentId
  //     blockType
  //     content
  //     orderIndex
  //     createdAt
  //     updatedAt
  //   }
  // }`,
  //     variables: JSON.stringify({
  //       input: {
  //         experimentId: "replace-with-experiment-id",
  //         blockType: "SampleRefBlock",
  //         content: JSON.stringify({
  //           type: "SampleRefBlock",
  //           sampleId: "sample-001-uuid"
  //         }),
  //         orderIndex: 4
  //       }
  //     }, null, 2)
  //   },

  // User Introspection
  {
    name: 'Schema Introspection - User Type',
    query: `query IntrospectUser {
  __type(name: "User") {
    name
    kind
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}`,
    variables: '{}'
  },

  // Introspection Queries
  {
    name: 'Schema Introspection - Types',
    query: `query IntrospectTypes {
  __schema {
    types {
      name
      kind
      description
    }
  }
}`,
    variables: '{}'
  },
  {
    name: 'Schema Introspection - Workspace Type',
    query: `query IntrospectWorkspace {
  __type(name: "Workspace") {
    name
    kind
    fields {
      name
      type {
        name
        kind
      }
    }
  }
}`,
    variables: '{}'
  },
];
