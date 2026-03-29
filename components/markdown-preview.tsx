import type { ComponentPropsWithoutRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownPreview({ body }: { body: string }) {
  return (
    <div className="max-w-none space-y-4 text-[#c2c6d8]">
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-8 text-3xl font-semibold tracking-[-0.03em] text-white first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-7 text-2xl font-semibold tracking-[-0.03em] text-white first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-3 mt-6 text-xl font-semibold tracking-[-0.03em] text-white first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="mb-2 mt-5 text-lg font-semibold tracking-[-0.03em] text-white first:mt-0">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-5 leading-7 text-[#c2c6d8]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-5 list-disc space-y-2 pl-6 text-[#c2c6d8] marker:text-white/45">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-5 list-decimal space-y-2 pl-6 text-[#c2c6d8] marker:text-white/45">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-7">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="my-6 border-l border-primary/30 pl-4 italic text-[#c2c6d8]">
              {children}
            </blockquote>
          ),
          a: ({ children, href }) => (
            <a className="font-medium text-primary underline" href={href}>
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">
              {children}
            </strong>
          ),
          pre: ({ children }) => (
            <pre className="my-6 overflow-x-auto rounded-[24px] border border-white/6 bg-[#0f1117] p-4 text-sm leading-6 text-[#d7dbe8]">
              {children}
            </pre>
          ),
          code: ({ children, className, ...props }: ComponentPropsWithoutRef<"code">) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="rounded bg-white/6 px-1 py-0.5 text-[0.9em] text-foreground" {...props}>
                {children}
              </code>
            );
          },
        }}
        remarkPlugins={[remarkGfm]}
      >
        {body}
      </ReactMarkdown>
    </div>
  );
}
