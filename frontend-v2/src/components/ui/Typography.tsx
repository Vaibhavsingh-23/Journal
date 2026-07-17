import * as React from "react"
import { cn } from "../../lib/utils"

export const Display = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h1
      ref={ref}
      className={cn("font-serif text-4xl md:text-5xl leading-tight text-foreground tracking-tight font-normal", className)}
      {...props}
    />
  )
)
Display.displayName = "Display"

export const Heading = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h2
      ref={ref}
      className={cn("font-serif text-2xl md:text-3xl leading-snug text-foreground font-medium", className)}
      {...props}
    />
  )
)
Heading.displayName = "Heading"

export const Subheading = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("font-sans text-sm md:text-base leading-relaxed text-secondary-foreground uppercase tracking-widest font-medium", className)}
      {...props}
    />
  )
)
Subheading.displayName = "Subheading"

export const Body = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("font-serif text-lg md:text-xl leading-relaxed text-foreground", className)}
      {...props}
    />
  )
)
Body.displayName = "Body"

export const Caption = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("font-sans text-xs md:text-sm leading-normal text-secondary-foreground", className)}
      {...props}
    />
  )
)
Caption.displayName = "Caption"

export const Quote = React.forwardRef<HTMLQuoteElement, React.BlockquoteHTMLAttributes<HTMLQuoteElement>>(
  ({ className, ...props }, ref) => (
    <blockquote
      ref={ref}
      className={cn("font-serif text-2xl md:text-3xl italic leading-snug text-accent", className)}
      {...props}
    />
  )
)
Quote.displayName = "Quote"
