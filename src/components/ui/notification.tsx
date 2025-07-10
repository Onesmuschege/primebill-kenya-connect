
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

const notificationVariants = cva(
  "relative flex items-start gap-3 rounded-lg border p-4 shadow-lg transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-background border-border",
        success: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
        error: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
        info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
      },
      size: {
        default: "text-sm",
        sm: "text-xs",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  default: Info,
}

export interface NotificationProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof notificationVariants> {
  title?: string
  description?: string
  action?: React.ReactNode
  onClose?: () => void
  closable?: boolean
}

const Notification = React.forwardRef<HTMLDivElement, NotificationProps>(
  ({ className, variant = "default", size, title, description, action, onClose, closable = true, children, ...props }, ref) => {
    const Icon = iconMap[variant || "default"]

    return (
      <div
        ref={ref}
        className={cn(notificationVariants({ variant, size }), className)}
        role="alert"
        aria-live="polite"
        {...props}
      >
        <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-1">
          {title && (
            <div className="font-medium leading-none tracking-tight">
              {title}
            </div>
          )}
          {description && (
            <div className="text-sm opacity-90">
              {description}
            </div>
          )}
          {children}
          {action && (
            <div className="mt-2">
              {action}
            </div>
          )}
        </div>
        {closable && onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
            onClick={onClose}
            aria-label="Close notification"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }
)
Notification.displayName = "Notification"

export { Notification, notificationVariants }
