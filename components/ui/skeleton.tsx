import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-none bg-surface-low border border-white/5", className)}
      {...props}
    />
  )
}

export { Skeleton }
