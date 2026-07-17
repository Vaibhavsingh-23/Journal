import * as React from "react"
import { Subheading } from "../ui/Typography"
import { cn } from "../../lib/utils"

export const SectionHeader = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, children, ...props }, ref) => (
    <div className={cn("mb-6 border-b border-border/50 pb-2", className)}>
      <Subheading ref={ref} {...props}>
        {children}
      </Subheading>
    </div>
  )
)
SectionHeader.displayName = "SectionHeader"
