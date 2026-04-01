import { cn } from "@/lib/utils";

export function ReviewItemTitle({
  title,
  spoiler = false,
  align = "left",
  className,
  titleClassName,
}: {
  title: string;
  spoiler?: boolean;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
}) {
  const wrapperClassName = cn(
    "space-y-0.5",
    align === "center" ? "text-center" : "text-left",
    className
  );
  const displayTitle = spoiler ? `<${title}>` : title;

  return (
    <div className={wrapperClassName}>
      <div
        className={cn(
          "font-black leading-snug tracking-tight break-keep [word-break:keep-all]",
          align === "center" ? "mx-auto text-[clamp(0.72rem,2vw,0.875rem)] sm:text-sm" : null,
          spoiler ? "text-[var(--spoiler)]" : "text-foreground",
          titleClassName
        )}
      >
        {displayTitle}
      </div>
    </div>
  );
}
