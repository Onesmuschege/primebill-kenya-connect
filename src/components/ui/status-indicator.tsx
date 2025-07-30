
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const statusIndicatorVariants = cva(
  "inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
        neutral: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
      },
      size: {
        sm: "text-xs px-1.5 py-0.5",
        default: "text-xs px-2 py-1",
        lg: "text-sm px-3 py-1.5",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  }
)

const dotVariants = cva(
  "h-2 w-2 rounded-full",
  {
    variants: {
      variant: {
        success: "bg-green-500",
        error: "bg-red-500",
        warning: "bg-yellow-500",
        info: "bg-blue-500",
        neutral: "bg-gray-500",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface StatusIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusIndicatorVariants> {
  showDot?: boolean
  label: string
}

const StatusIndicator = React.forwardRef<HTMLDivElement, StatusIndicatorProps>(
  ({ className, variant, size, showDot = true, label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statusIndicatorVariants({ variant, size }), className)}
        {...props}
      >
        {showDot && (
          <span className={cn(dotVariants({ variant }))} aria-hidden="true" />
        )}
        <span>{label}</span>
      </div>
    )
  }
)
StatusIndicator.displayName = "StatusIndicator"

export { StatusIndicator, statusIndicatorVariants }
