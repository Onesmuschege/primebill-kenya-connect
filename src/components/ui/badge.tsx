import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold font-mono tracking-wider transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-neonBlue text-black hover:bg-neonBlue/90 hover:shadow-glow-cyan",
        secondary:
          "border-transparent bg-[#1A1A2E] text-cyan-400 border border-cyan-500/20 hover:bg-[#2A2A3E] hover:shadow-glow-cyan",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80 hover:shadow-glow",
        outline: "text-cyan-400 border-cyan-500/20 hover:bg-cyan-400/10 hover:border-cyan-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
