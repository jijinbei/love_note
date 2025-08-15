import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

export const markdownPlugins = {
  remarkPlugins: [remarkGfm, remarkMath],
  rehypePlugins: [rehypeKatex],
};

export const createCodeComponent = () => {
  return function CodeBlock(props: any) {
    const { inline, className, children, ...otherProps } = props;
    const match = /language-(\w+)/.exec(className || '');
    return !inline ? (
      <SyntaxHighlighter
        style={oneDark as any}
        language={match ? match[1] : 'text'}
        PreTag="div"
        {...otherProps}
      >
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    ) : (
      <code className={className} {...otherProps}>
        {children}
      </code>
    );
  };
};

export const markdownComponents = {
  code: createCodeComponent(),
};
