import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownPreview({ body }: { body: string }) {
  return (
    <div className="prose prose-invert max-w-none prose-headings:font-sans prose-headings:font-semibold prose-headings:tracking-[-0.03em] prose-p:leading-7 prose-li:leading-7 prose-a:text-primary prose-code:rounded prose-code:bg-white/6 prose-code:px-1 prose-code:py-0.5 prose-pre:rounded-[24px] prose-pre:border prose-pre:border-white/6 prose-pre:bg-[#0f1117] prose-strong:text-foreground">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{body}</ReactMarkdown>
    </div>
  );
}
