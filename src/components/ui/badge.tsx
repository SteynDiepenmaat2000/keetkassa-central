import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-white/20 px-3 py-0.5 text-xs font-semibold backdrop-blur-xl shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary/90 text-primary-foreground hover:bg-primary shadow-primary/20",
        secondary: "bg-white/70 dark:bg-white/10 text-secondary-foreground hover:bg-white/90 dark:hover:bg-white/20",
        destructive: "bg-destructive/90 text-destructive-foreground hover:bg-destructive shadow-destructive/20",
        outline: "bg-white/50 dark:bg-white/5 text-foreground hover:bg-white/70 dark:hover:bg-white/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
