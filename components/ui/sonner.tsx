"use client"

import { Toaster as Sonner, type ToasterProps } from "sonner"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      richColors
      theme="system"
      toastOptions={{
        classNames: {
          toast: "group toast rounded-none border border-border bg-surface-low text-foreground shadow-lg",
          title: "text-sm font-black tracking-tight",
          description: "text-sm text-muted-foreground",
          content: "gap-1",
          actionButton: cn(buttonVariants({ size: "sm" }), "rounded-none"),
          cancelButton: cn(buttonVariants({ size: "sm", variant: "outline" }), "rounded-none"),
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
