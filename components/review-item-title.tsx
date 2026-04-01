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
          "font-black leading-tight tracking-tight",
          spoiler ? "text-[var(--spoiler)]" : "text-foreground",
          titleClassName
        )}
      >
        {displayTitle}
      </div>
    </div>
  );
}
