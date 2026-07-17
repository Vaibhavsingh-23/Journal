import { motion } from "framer-motion"
import { Quote } from "../ui/Typography"
import { HelpCircle } from "lucide-react"

interface ReflectionQuestionProps {
  question: string
}

export function ReflectionQuestion({ question }: ReflectionQuestionProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8 }}
      className="bg-accent/5 p-10 md:p-14 rounded-2xl border border-accent/10 text-center relative overflow-hidden"
    >
      <div className="flex justify-center mb-6">
        <div className="p-3 bg-background rounded-full border border-border shadow-sm">
          <HelpCircle className="w-5 h-5 text-accent stroke-[1.5]" />
        </div>
      </div>
      <Quote className="text-foreground md:text-4xl text-balance">{question}</Quote>
    </motion.div>
  )
}
