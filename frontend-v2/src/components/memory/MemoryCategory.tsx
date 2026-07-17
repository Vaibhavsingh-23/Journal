import { cn } from "../../lib/utils"

interface MemoryCategoryProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export function MemoryCategory({ categories, selectedCategory, onSelectCategory }: MemoryCategoryProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-12">
      {categories.map((category) => {
        const isSelected = category === selectedCategory
        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 border",
              isSelected 
                ? "bg-foreground text-background border-foreground shadow-md" 
                : "bg-transparent text-secondary-foreground border-border/60 hover:border-foreground/30 hover:text-foreground"
            )}
          >
            {category}
          </button>
        )
      })}
    </div>
  )
}
