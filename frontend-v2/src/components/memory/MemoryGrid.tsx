import { MemoryCard } from "./MemoryCard"
import type { Memory } from "../../types/models"

interface MemoryGridProps {
  memories: Memory[]
  onMemoryClick: (memory: Memory) => void
}

export function MemoryGrid({ memories, onMemoryClick }: MemoryGridProps) {
  if (memories.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-secondary-foreground font-serif text-xl italic">No memories found in this category.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
      {memories.map((memory, index) => (
        <MemoryCard 
          key={memory.id} 
          memory={memory} 
          index={index} 
          onClick={onMemoryClick} 
        />
      ))}
    </div>
  )
}
