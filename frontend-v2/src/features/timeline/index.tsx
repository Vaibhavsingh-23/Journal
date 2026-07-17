import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { useAuth } from "../../context/AuthContext"
import { timelineApi } from "../../services/api/timeline"
import { mockTimelineFilters } from "../../constants/fallbacks"

import { TimelineHero } from "../../components/timeline/TimelineHero"
import { TimelineFilter } from "../../components/timeline/TimelineFilter"
import { TimelineStats } from "../../components/timeline/TimelineStats"
import { TimelineEventItem } from "../../components/timeline/TimelineEventItem"
import { TimelineGroup } from "../../components/timeline/TimelineGroup"
import { Body } from "../../components/ui/Typography"

export function Timeline() {
  const { user } = useAuth()
  const [selectedFilter, setSelectedFilter] = useState("All Time")

  const { data: timelineEvents, isLoading } = useQuery({
    queryKey: ["timeline", user?.id],
    queryFn: () => timelineApi.getTimelineEvents(user!.id),
    enabled: !!user?.id
  })

  const stats = useMemo(() => {
    if (!timelineEvents) return { journals: 0, memories: 0, insights: 0, reflections: 0, streak: 0 }
    const journals = timelineEvents.filter(e => e.type === "JOURNAL").length
    const memories = timelineEvents.filter(e => e.type === "MEMORY").length
    const insights = timelineEvents.filter(e => e.type === "INSIGHT").length

    const reflections = timelineEvents.filter(e => e.type === "REFLECTION").length

    return {
      journals,
      memories,
      insights,
      reflections,
      streak: 0 // Fetch from dashboard API if needed, or leave as 0
    }
  }, [timelineEvents])

  // Group events by monthGroup
  const groupedEvents = useMemo(() => {
    if (!timelineEvents) return {}

    let filteredEvents = timelineEvents
    
    if (selectedFilter === "Journals") filteredEvents = timelineEvents.filter(e => e.type === "JOURNAL" || e.type === "REFLECTION")
    if (selectedFilter === "Memories") filteredEvents = timelineEvents.filter(e => e.type === "MEMORY")
    if (selectedFilter === "Insights") filteredEvents = timelineEvents.filter(e => e.type === "INSIGHT")

    const groups: { [key: string]: typeof timelineEvents } = {}
    
    filteredEvents.forEach(event => {
      if (!groups[event.monthGroup]) {
        groups[event.monthGroup] = []
      }
      groups[event.monthGroup].push(event)
    })

    return groups
  }, [selectedFilter, timelineEvents])

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Body className="text-secondary-foreground italic text-lg">Weaving your timeline...</Body>
      </div>
    )
  }

  return (
    <div className="pt-8 pb-32 animate-fade-in">
      
      <TimelineHero />
      <TimelineStats stats={stats} />
      
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <TimelineFilter 
          filters={mockTimelineFilters} 
          selectedFilter={selectedFilter} 
          onSelect={setSelectedFilter} 
        />
        
        <div className="mt-16">
          {Object.entries(groupedEvents).length === 0 ? (
            <div className="text-center py-24 text-secondary-foreground font-serif text-lg">
              No events found for this filter. Start journaling to fill your timeline!
            </div>
          ) : (
            Object.entries(groupedEvents).map(([monthGroup, events]) => (
              <TimelineGroup key={monthGroup} month={monthGroup}>
                {events.map((event, index) => (
                  <TimelineEventItem 
                    key={event.id} 
                    event={event} 
                    index={index} 
                    isLast={index === events.length - 1} 
                  />
                ))}
              </TimelineGroup>
            ))
          )}
        </div>
      </div>
    </div>
  )
}