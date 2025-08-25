export type BlockType = 'markdown' | 'code' | 'image' | 'data';

export interface BlockTypeConfig {
  type: BlockType;
  icon: string;
  label: string;
  description: string;
}

export const defaultBlockTypes: BlockTypeConfig[] = [
  {
    type: 'markdown',
    icon: '📝',
    label: 'Text',
    description: 'Rich text with markdown support',
  },
  {
    type: 'code',
    icon: '💻',
    label: 'Code',
    description: 'Code block with syntax highlighting',
  },
  {
    type: 'image',
    icon: '🖼️',
    label: 'Image',
    description: 'Upload and display images',
  },
  {
    type: 'data',
    icon: '📊',
    label: 'Data',
    description: 'Structured data and tables',
  },
];

export const getDefaultContent = (type: BlockType) => {
  switch (type) {
    case 'markdown':
      return { text: '# New Block\n\nStart writing here...' };
    case 'code':
      return {
        language: 'javascript',
        code: '// Write your code here\nconsole.log("Hello, World!");',
      };
    case 'image':
      return { url: '', alt: '', caption: '' };
    case 'data':
      return { data: [], schema: {} };
    default:
      return {};
  }
};
