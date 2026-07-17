import * as React from "react"
import { motion } from "framer-motion"
import type { HTMLMotionProps } from "framer-motion"
import { cn } from "../../lib/utils"

interface JournalEditorProps extends HTMLMotionProps<"textarea"> {}

export const JournalEditor = React.forwardRef<HTMLTextAreaElement, JournalEditorProps>(
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
        transition={{ duration: 0.8, delay: 0.2 }}
        onChange={handleInput}
        placeholder="Start writing..."
        className={cn(
          "w-full min-h-[50vh] resize-none bg-transparent border-none outline-none focus:ring-0 pb-32",
          "font-serif text-lg md:text-xl leading-relaxed text-foreground placeholder:text-secondary-foreground/40",
          className
        )}
        {...props}
      />
    )
  }
)
JournalEditor.displayName = "JournalEditor"
