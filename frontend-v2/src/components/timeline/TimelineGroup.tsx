import { Heading } from "../ui/Typography"

interface TimelineGroupProps {
  month: string
  children: React.ReactNode
}

export function TimelineGroup({ month, children }: TimelineGroupProps) {
  return (
    <div className="relative mb-20 last:mb-0">
      <div className="sticky top-6 z-20 md:hidden bg-background/95 backdrop-blur-sm py-4 mb-4 -mx-4 px-4 border-b border-border/50">
        <Heading className="text-foreground/90">{month}</Heading>
      </div>
      
      <div className="hidden md:block mb-12 relative">
        <div className="absolute left-[80px] right-0 top-1/2 h-px bg-border/30 -z-10" />
        <Heading className="text-3xl text-foreground/90 bg-background inline-block pr-6">{month}</Heading>
      </div>

      <div className="pl-4 md:pl-0">
        {children}
      </div>
    </div>
  )
}
