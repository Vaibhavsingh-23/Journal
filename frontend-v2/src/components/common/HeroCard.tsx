import { motion } from "framer-motion"
import { Display, Subheading } from "../ui/Typography"

interface HeroCardProps {
  name: string
  date: string
  prompt: string
  imageUrl: string
}

export function HeroCard({ name, date, prompt, imageUrl }: HeroCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative rounded-lg overflow-hidden h-[400px] mb-12 group"
    >
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] group-hover:scale-105"
        style={{ backgroundImage: `url(${imageUrl})` }}
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end text-white">
        <Subheading className="text-white/80 mb-2">{date}</Subheading>
        <Display className="text-white mb-6">Good Morning, {name}.</Display>
        <p className="font-serif italic text-xl md:text-2xl text-white/90">
          {prompt}
        </p>
      </div>
    </motion.div>
  )
}
