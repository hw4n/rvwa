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
              className={`text-3xl md:text-4xl font-black text-foreground tracking-tight leading-none ${
                titleClassName ?? ""
              }`}
            >
              {title}
            </h1>
            {description ? (
              <p className="mt-4 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground">
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
        <div className="relative h-56 w-full shrink-0 overflow-hidden border border-border bg-surface-low p-6 md:h-72 md:w-48 md:p-8 flex flex-col items-center justify-center group">
           <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity" />
           <span className="mb-4 select-none text-7xl font-black uppercase tracking-tighter text-foreground/10 transition-transform group-hover:scale-110 md:text-9xl">
             {title.charAt(0)}
           </span>
           <div className="mt-auto flex flex-col items-center gap-2">
             <span className="text-xs md:text-sm font-black text-primary/40 uppercase tracking-[0.4em]">카탈로그</span>
           </div>
        </div>

        <div className="flex-1 pb-1">
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            <span className="text-primary text-xs md:text-sm font-black tracking-[0.3em] uppercase">
              {eyebrow}
            </span>
          </div>
          <h1 className="mb-6 text-5xl font-black uppercase leading-[0.9] tracking-tighter text-foreground md:mb-8 md:text-7xl">
            {title}
          </h1>
          {description ? (
            <p className="max-w-2xl text-base font-medium leading-relaxed text-muted-foreground md:text-lg">
              {description}
            </p>
          ) : null}
          {actions && <div className="mt-8 md:mt-10">{actions}</div>}
        </div>
      </section>
    </div>
  );
}
