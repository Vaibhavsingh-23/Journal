import { cn } from "../../lib/utils"

interface TimelineFilterProps {
  filters: string[]
  selectedFilter: string
  onSelect: (filter: string) => void
}

export function TimelineFilter({ filters, selectedFilter, onSelect }: TimelineFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 mb-16">
      {filters.map((filter) => {
        const isSelected = filter === selectedFilter
        return (
          <button
            key={filter}
            onClick={() => onSelect(filter)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-medium transition-all duration-300 border",
              isSelected 
                ? "bg-foreground text-background border-foreground shadow-sm" 
                : "bg-transparent text-secondary-foreground border-border/60 hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {filter}
          </button>
        )
      })}
    </div>
  )
}
