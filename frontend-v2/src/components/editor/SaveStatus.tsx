import { motion } from "framer-motion"
import { CheckCircle2, Cloud } from "lucide-react"
import { Caption } from "../ui/Typography"

interface SaveStatusProps {
  status: "saved" | "saving" | "error"
}

export function SaveStatus({ status }: SaveStatusProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="flex items-center space-x-2 text-secondary-foreground"
    >
      {status === "saved" ? (
        <>
          <CheckCircle2 className="w-3.5 h-3.5" />
          <Caption>Saved</Caption>
        </>
      ) : status === "saving" ? (
        <>
          <Cloud className="w-3.5 h-3.5 animate-pulse" />
          <Caption>Saving...</Caption>
        </>
      ) : (
        <Caption className="text-destructive">Unsaved changes</Caption>
      )}
    </motion.div>
  )
}
