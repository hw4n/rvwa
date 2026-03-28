import type { ReactNode } from "react";

type Crumb = {
  label: string;
  href?: string;
};

export function PlatformHeader({
  crumbs,
  eyebrow,
  title,
  description,
  actions,
  titleClassName,
  variant = "hero",
  actionsOutside = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  crumbs?: Crumb[];
  actions?: ReactNode;
  actionsOutside?: boolean;
  titleClassName?: string;
  variant?: "hero" | "compact";
}) {
  void crumbs;

  if (variant === "compact") {
    const actionsElement = actions ? (
      <div className="shrink-0 w-full md:w-auto">{actions}</div>
    ) : null;

    return (
      <div className="mb-8 md:mb-10">
        {actionsOutside ? (
          <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="min-w-0 flex-1" />
            {actionsElement}
          </section>
        ) : null}
        <section className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div className="min-w-0 flex-1">
            {eyebrow ? (
              <div className="flex items-center gap-3 mb-3">
                <span className="text-primary text-xs md:text-sm font-black tracking-[0.2em] uppercase">
                  {eyebrow}
                </span>
              </div>
            ) : null}
            <h1
              className={`text-3xl md:text-4xl font-black text-white tracking-tight leading-none ${
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
          {actionsOutside ? null : actionsElement}
        </section>
      </div>
    );
  }

  return (
    <div className="mb-12 md:mb-20">
      <section className="flex flex-col md:flex-row md:items-end gap-8 md:gap-12">
        <div className="w-full h-56 md:w-48 md:h-72 bg-surface-low shrink-0 border border-white/5 flex flex-col items-center justify-center p-6 md:p-8 relative overflow-hidden group">
           <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
           <span className="text-7xl md:text-9xl font-black text-white/5 tracking-tighter uppercase mb-4 select-none group-hover:scale-110 transition-transform">
             {title.charAt(0)}
           </span>
           <div className="mt-auto flex flex-col items-center gap-2">
             <span className="text-xs md:text-sm font-black text-primary/40 uppercase tracking-[0.4em]">카탈로그</span>
             <div className="w-8 h-px bg-primary/20" />
           </div>
        </div>

        <div className="flex-1 pb-1">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <span className="text-primary text-xs md:text-sm font-black tracking-[0.3em] uppercase">
              {eyebrow}
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 md:mb-8 leading-[0.9] uppercase">
            {title}
          </h1>
          {description ? (
            <p className="text-[#c2c6d8]/60 text-base md:text-lg max-w-2xl leading-relaxed font-medium">
              {description}
            </p>
          ) : null}
          {actions && <div className="mt-8 md:mt-10">{actions}</div>}
        </div>
      </section>
    </div>
  );
}
