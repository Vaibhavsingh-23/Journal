import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../../context/AuthContext"
import { insightApi } from "../../services/api/insight"
import { mockInsightsPageData } from "../../constants/fallbacks" // Fallback images/stats

import { InsightHero } from "../../components/insights/InsightHero"
import { ThemeCard } from "../../components/insights/ThemeCard"
import { MilestoneCard } from "../../components/insights/MilestoneCard"
import { PatternCard } from "../../components/insights/PatternCard"
import { SuggestionCard } from "../../components/insights/SuggestionCard"
import { SectionHeader } from "../../components/common/SectionHeader"
import { Body } from "../../components/ui/Typography"

export function Insights() {
  const { user } = useAuth()
  
  const { data: rawInsights, isLoading } = useQuery({
    queryKey: ["insights", user?.id],
    queryFn: () => insightApi.getInsights(user!.id),
    enabled: !!user?.id
  })

  // Map backend insights to frontend types based on insight.type
  const { themes, patterns, suggestions, milestones } = useMemo(() => {
    if (!rawInsights) return { themes: [], patterns: [], suggestions: [], milestones: [] }
    
    return {
      themes: rawInsights.filter(i => i.type.toLowerCase().includes("theme") || i.type.toLowerCase().includes("category")).map(i => ({
        id: i.id,
        name: i.title,
        frequency: "Recurring",
        trend: "consistent",
        description: i.description,
        explanation: i.evidence.map(e => e.text_snippet).join("\n") || "Based on your recent entries."
      })),
      patterns: rawInsights.filter(i => i.type.toLowerCase().includes("pattern") || i.type.toLowerCase().includes("habit")).map(i => ({
        id: i.id,
        title: i.title,
        text: i.description,
        description: i.description,
        impact: "neutral" as "positive" | "negative" | "neutral"
      })),
      suggestions: rawInsights.filter(i => i.type.toLowerCase().includes("suggestion") || i.type.toLowerCase().includes("growth")).map(i => ({
        id: i.id,
        title: i.title,
        text: i.description,
        rationale: i.description,
        actionable: true
      })),
      milestones: rawInsights.filter(i => i.type.toLowerCase().includes("milestone") || i.type.toLowerCase().includes("journey")).map(i => ({
        id: i.id,
        date: new Date(i.created_at).toLocaleDateString(),
        title: i.title,
        summary: i.description,
        significance: i.description,
        relatedMemories: i.evidence.filter(e => e.memory_id).map(e => e.memory_id!)
      }))
    }
  }, [rawInsights])

  // Fallback if the AI hasn't categorized them perfectly, just group them
  const fallbackThemes = useMemo(() => {
    if (!rawInsights || themes.length > 0) return []
    return rawInsights.slice(0, 3).map(i => ({
      id: i.id,
      name: i.title,
      frequency: "Detected",
      trend: "consistent",
      description: i.description,
      explanation: i.evidence.map(e => e.text_snippet).join("\n") || "Based on your recent entries."
    }))
  }, [rawInsights, themes])

  const activeThemes = themes.length > 0 ? themes : fallbackThemes

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Body className="text-secondary-foreground italic text-lg">Synthesizing insights...</Body>
      </div>
    )
  }

  const hasAnyInsights = rawInsights && rawInsights.length > 0

  return (
    <div className="pt-8 pb-32 animate-fade-in">
      
      <InsightHero 
        title={mockInsightsPageData.hero.title}
        subtitle={mockInsightsPageData.hero.subtitle}
        image={mockInsightsPageData.hero.image}
      />

      {!hasAnyInsights ? (
        <div className="text-center py-24 max-w-2xl mx-auto">
          <Body className="text-secondary-foreground">No long-term patterns have been discovered yet. Keep writing and forming memories for the AI to synthesize insights.</Body>
        </div>
      ) : (
        <>
          {/* Key Themes Section */}
          {activeThemes.length > 0 && (
            <section className="max-w-5xl mx-auto px-4 md:px-8 mb-32 mt-16">
              <SectionHeader className="text-center mb-12">Key Themes</SectionHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {activeThemes.map((theme, index) => (
                  <ThemeCard 
                    key={theme.id}
                    theme={theme}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Growth Timeline Section */}
          {milestones.length > 0 && (
            <section className="max-w-3xl mx-auto px-4 md:px-8 mb-32">
              <SectionHeader className="text-center mb-16">Growth Timeline</SectionHeader>
              <div className="flex flex-col">
                {milestones.map((milestone, index) => (
                  <MilestoneCard 
                    key={milestone.id}
                    milestone={milestone}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Habit Patterns Section */}
          {patterns.length > 0 && (
            <section className="max-w-4xl mx-auto px-4 md:px-8 mb-32">
              <SectionHeader className="text-center mb-12">Habit Patterns</SectionHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                {patterns.map((pattern, index) => (
                  <PatternCard 
                    key={pattern.id}
                    pattern={pattern}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Future Suggestions Section */}
          {suggestions.length > 0 && (
            <section className="max-w-3xl mx-auto px-4 md:px-8">
              <SectionHeader className="text-center mb-12">Future Suggestions</SectionHeader>
              <div className="flex flex-col gap-4">
                {suggestions.map((suggestion, index) => (
                  <SuggestionCard 
                    key={suggestion.id}
                    suggestion={suggestion}
                    index={index}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}

    </div>
  )
}