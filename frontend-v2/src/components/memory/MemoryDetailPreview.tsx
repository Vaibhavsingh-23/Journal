import { motion, AnimatePresence } from "framer-motion"
import { Display, Heading, Subheading, Body, Caption, Quote } from "../ui/Typography"
import { X, Calendar } from "lucide-react"
import type { Memory } from "../../types/models"
import { useEffect } from "react"

interface MemoryDetailPreviewProps {
  memory: Memory | null
  onClose: () => void
}

export function MemoryDetailPreview({ memory, onClose }: MemoryDetailPreviewProps) {
  
  // Lock body scroll when modal is open
  useEffect(() => {
    if (memory) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [memory])

  return (
    <AnimatePresence>
      {memory && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 top-12 md:top-24 z-50 bg-background border-t border-border/50 rounded-t-3xl shadow-2xl overflow-y-auto"
          >
            <div className="absolute top-6 right-6 md:top-8 md:right-8 z-20">
              <button 
                onClick={onClose}
                className="p-3 bg-background/50 backdrop-blur-md rounded-full border border-border/50 text-secondary-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-w-4xl mx-auto pb-32">
              {/* Hero Image */}
              <div className="w-full h-64 md:h-96 relative">
                <img 
                  src={memory.coverImage} 
                  alt={memory.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
              </div>

              <div className="px-6 md:px-12 -mt-16 relative z-10">
                
                <div className="flex items-center space-x-3 mb-6">
                  <span className="px-3 py-1 bg-accent/10 text-accent rounded-full text-xs font-medium uppercase tracking-wider">
                    {memory.category}
                  </span>
                  <Caption className="text-secondary-foreground flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1.5" />
                    {memory.dateRange}
                  </Caption>
                </div>

                <Display className="mb-8">{memory.title}</Display>
                
                <Body className="text-xl md:text-2xl text-foreground/80 leading-relaxed mb-16 border-l-2 border-accent/30 pl-6">
                  {memory.summary}
                </Body>

                {memory.detail && (
                  <div className="space-y-16">
                    
                    {/* Themes */}
                    <section>
                      <Subheading className="mb-6">Key Themes</Subheading>
                      <div className="flex flex-wrap gap-3">
                        {memory.detail?.themes?.map((theme: any, i: number) => (
                          <span key={i} className="px-4 py-2 bg-secondary/30 rounded-lg text-sm text-foreground/80">
                            {theme}
                          </span>
                        ))}
                      </div>
                    </section>

                    {/* Timeline */}
                    <section>
                      <Subheading className="mb-8">Journal Timeline</Subheading>
                      <div className="border-l border-border/50 ml-3 space-y-8 py-2">
                        {memory.detail?.timeline?.map((entry: any, i: number) => (
                          <div key={i} className="relative pl-8">
                            <div className="absolute w-2 h-2 bg-accent rounded-full -left-[4px] top-2" />
                            <Caption className="text-secondary-foreground mb-1">{entry.date}</Caption>
                            <Heading className="text-lg">{entry.title}</Heading>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* Reflections */}
                    <section>
                      <Subheading className="mb-8">Reflections</Subheading>
                      <div className="space-y-6">
                        {memory.detail?.reflectionSnippets?.map((snippet: any, i: number) => (
                          <div key={i} className="p-8 bg-accent/5 rounded-2xl border border-accent/10">
                            <Quote className="text-foreground/90">{snippet}</Quote>
                          </div>
                        ))}
                      </div>
                    </section>

                  </div>
                )}
                
                {!memory.detail && (
                  <div className="py-12 text-center border-t border-border/50 mt-12">
                    <Caption>No detailed timeline available for this memory mock.</Caption>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
