import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-blue-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-ocean-blue-500 text-white hover:bg-forest-green-500 hover:shadow-lg active:scale-95",
        destructive:
          "bg-alert-red-500 text-white hover:bg-alert-red-600 hover:shadow-lg active:scale-95",
        outline:
          "border border-ocean-blue-400/30 bg-transparent text-ocean-blue-600 hover:bg-ocean-blue-50 hover:border-ocean-blue-500 hover:shadow-md",
        secondary:
          "bg-light-grey-500 text-charcoal-grey-500 hover:bg-sand-gold-100 hover:text-charcoal-grey-600 hover:shadow-md",
        ghost: "text-ocean-blue-600 hover:bg-ocean-blue-50 hover:text-ocean-blue-700",
        link: "text-ocean-blue-500 underline-offset-4 hover:underline hover:text-forest-green-600",
        cyber: "bg-gradient-cyber text-white hover:shadow-cyber hover:scale-105 border border-ocean-blue-400/20",
        kenyan: "bg-gradient-kenyan text-white hover:bg-sand-gold-600 hover:shadow-lg active:scale-95",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-lg px-3",
        lg: "h-11 rounded-lg px-8 text-base",
        icon: "h-10 w-10 rounded-lg",
        xl: "h-12 rounded-xl px-10 text-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
