import type { ReactNode } from "react";
import Link from "next/link";

type Crumb = {
  label: string;
  href?: string;
};

export function PlatformHeader({
  eyebrow,
  title,
  description,
  crumbs,
  actions,
  titleClassName,
  variant = "hero",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  titleClassName?: string;
  variant?: "hero" | "compact";
}) {
  if (variant === "compact") {
    return (
      <div className="mb-10">
        <section className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <div className="flex items-center gap-3 mb-3">
                <span className="text-primary text-sm font-black tracking-[0.2em] uppercase">
                  {eyebrow}
                </span>
              </div>
            ) : null}
            <h1
              className={`text-4xl font-black text-white tracking-tight leading-none ${
                titleClassName ?? ""
              }`}
            >
              {title}
            </h1>
            {description ? (
              <p className="mt-4 text-sm max-w-2xl leading-relaxed text-[#c2c6d8]/60 font-medium">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </section>
      </div>
    );
  }

  return (
    <div className="mb-20">
      <section className="flex flex-col md:flex-row md:items-end gap-12">
        <div className="w-48 h-72 bg-surface-low shrink-0 border border-white/5 flex flex-col items-center justify-center p-8 relative overflow-hidden group">
           <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
           <span className="text-9xl font-black text-white/5 tracking-tighter uppercase mb-4 select-none group-hover:scale-110 transition-transform select-none">
             {title.charAt(0)}
           </span>
           <div className="mt-auto flex flex-col items-center gap-2">
             <span className="text-sm font-black text-primary/40 uppercase tracking-[0.4em]">카탈로그</span>
             <div className="w-8 h-px bg-primary/20" />
           </div>
        </div>

        <div className="flex-1 pb-1">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-primary text-sm font-black tracking-[0.3em] uppercase">
              {eyebrow}
            </span>
          </div>
          <h1 className="text-7xl font-black text-white tracking-tighter mb-8 leading-[0.9] uppercase">
            {title}
          </h1>
          {description ? (
            <p className="text-[#c2c6d8]/60 text-lg max-w-2xl leading-relaxed font-medium">
              {description}
            </p>
          ) : null}
          {actions && <div className="mt-10">{actions}</div>}
        </div>
      </section>
    </div>
  );
}
