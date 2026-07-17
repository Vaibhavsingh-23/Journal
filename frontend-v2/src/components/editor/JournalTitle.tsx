import * as React from "react"
import { motion } from "framer-motion"
import type { HTMLMotionProps } from "framer-motion"
import { cn } from "../../lib/utils"

interface JournalTitleProps extends HTMLMotionProps<"textarea"> {}

export const JournalTitle = React.forwardRef<HTMLTextAreaElement, JournalTitleProps>(
  ({ className, onChange, ...props }, ref) => {
    
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      e.target.style.height = "auto"
      e.target.style.height = `${e.target.scrollHeight}px`
      if (onChange) onChange(e)
    }

    return (
      <motion.textarea
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.1 }}
        onChange={handleInput}
        rows={1}
        placeholder="Title"
        className={cn(
          "w-full resize-none overflow-hidden bg-transparent border-none outline-none focus:ring-0",
          "font-serif text-4xl md:text-5xl leading-tight text-foreground tracking-tight font-normal placeholder:text-secondary-foreground/40",
          className
        )}
        {...props}
      />
    )
  }
)
JournalTitle.displayName = "JournalTitle"
