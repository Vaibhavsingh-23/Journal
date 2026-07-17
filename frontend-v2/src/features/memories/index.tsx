import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../../context/AuthContext"
import { memoryApi } from "../../services/api/memory"
import type { Memory as MockMemory } from "../../types/models"

import { MemoryHero } from "../../components/memory/MemoryHero"
import { FeaturedMemoryCard } from "../../components/memory/FeaturedMemoryCard"
import { MemoryCategory } from "../../components/memory/MemoryCategory"
import { MemoryGrid } from "../../components/memory/MemoryGrid"
import { MemoryDetailPreview } from "../../components/memory/MemoryDetailPreview"
import { SectionHeader } from "../../components/common/SectionHeader"
import { Body } from "../../components/ui/Typography"

export function MemoryExplorer() {
  const { user } = useAuth()
  const [selectedCategory, setSelectedCategory] = useState<string>("All")
  const [selectedMemory, setSelectedMemory] = useState<MockMemory | null>(null)

  const { data: rawMemories, isLoading } = useQuery({
    queryKey: ["memories", user?.id],
    queryFn: () => memoryApi.getMemories(user!.id),
    enabled: !!user?.id
  })

  // Map API models to UI models
  const mappedMemories = useMemo<MockMemory[]>(() => {
    if (!rawMemories) return []
    return rawMemories.map(m => ({
      id: m.id,
      title: m.title,
      dateRange: `${m.date_range.start} - ${m.date_range.end}`,
      summary: m.summary,
      coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop",
      category: m.category || "General",
      isFeatured: false,
      journalCount: m.fragments.length,
      events: m.fragments.map(f => ({
        id: f.id,
        date: new Date(f.created_at).toLocaleDateString(),
        title: f.extracted_concept,
        excerpt: f.context
      }))
    }))
  }, [rawMemories])

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set<string>()
    mappedMemories.forEach(m => cats.add(m.category))
    return ["All", ...Array.from(cats)]
  }, [mappedMemories])

  const featuredMemories = mappedMemories.slice(0, 2)
  
  const filteredMemories = mappedMemories.filter(m => {
    if (selectedCategory === "All") return true
    return m.category === selectedCategory
  })

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Body className="text-secondary-foreground italic text-lg">Retrieving your memories...</Body>
      </div>
    )
  }

  return (
    <div className="pt-8 pb-32 animate-fade-in">
      
      <MemoryHero />

      {/* Featured Memories Section */}
      {featuredMemories.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 md:px-8 mb-32 mt-16">
          <SectionHeader className="mb-8">Featured Chapters</SectionHeader>
          <div className="flex flex-col gap-12">
            {featuredMemories.map((memory, index) => (
              <FeaturedMemoryCard 
                key={memory.id} 
                memory={memory} 
                index={index} 
                onClick={setSelectedMemory} 
              />
            ))}
          </div>
        </section>
      )}

      {/* Explore All Memories Section */}
      <section className="max-w-6xl mx-auto px-4 md:px-8">
        <SectionHeader className="mb-12">Explore Archive</SectionHeader>
        
        {mappedMemories.length === 0 ? (
          <div className="text-center py-16">
            <Body className="text-secondary-foreground">No memories have been formed yet. Keep journaling to build your archive!</Body>
          </div>
        ) : (
          <>
            <MemoryCategory 
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />

            <MemoryGrid 
              memories={filteredMemories} 
              onMemoryClick={setSelectedMemory} 
            />
          </>
        )}
      </section>

      {/* Detail Modal */}
      <MemoryDetailPreview 
        memory={selectedMemory} 
        onClose={() => setSelectedMemory(null)} 
      />

    </div>
  )
}