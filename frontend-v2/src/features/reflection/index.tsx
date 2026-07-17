import { useSearchParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { journalApi } from "../../services/api/journal"

import { ReflectionHeader } from "../../components/reflection/ReflectionHeader"
import { JournalPreview } from "../../components/reflection/JournalPreview"
import { ReflectionCard } from "../../components/reflection/ReflectionCard"
import { ReflectionQuestion } from "../../components/reflection/ReflectionQuestion"
import { SectionHeader } from "../../components/common/SectionHeader"
import { Subheading, Body } from "../../components/ui/Typography"

export function Reflection() {
  const [searchParams] = useSearchParams()
  const entryId = searchParams.get("id")
  const queryClient = useQueryClient()

  // If no ID is passed, we fetch the latest journal to reflect on
  const { data: latestJournals, isLoading: loadingJournals } = useQuery({
    queryKey: ["journals", { page: 0, size: 1 }],
    queryFn: () => journalApi.getEntries(0, 1),
    enabled: !entryId
  })

  const targetId = entryId || latestJournals?.content?.[0]?.id

  const { data: journal, isLoading: loadingEntry } = useQuery({
    queryKey: ["journal", targetId],
    queryFn: () => journalApi.getEntry(targetId!),
    enabled: !!targetId
  })

  const reanalyzeMutation = useMutation({
    mutationFn: (id: string) => journalApi.reanalyzeEntry(id),
    onSuccess: (data) => {
      queryClient.setQueryData(["journal", data.id], data)
      queryClient.invalidateQueries({ queryKey: ["journals"] })
    }
  })

  if (loadingJournals || loadingEntry) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Body className="text-secondary-foreground italic text-lg">Gathering reflections...</Body>
      </div>
    )
  }

  if (!journal) {
    return (
      <div className="flex flex-col h-64 w-full items-center justify-center">
        <Body className="text-secondary-foreground mb-4">No journal entry found to reflect on.</Body>
      </div>
    )
  }

  const observations = [
    { id: '1', category: 'Mood', text: journal.mood || 'Neutral' },
    { id: '2', category: 'Emotions', text: journal.emotions || 'No emotions detected' },
    { id: '3', category: 'Sentiment', text: `Score: ${journal.sentimentScore ?? 'N/A'}` },
  ]

  return (
    <div className="max-w-4xl mx-auto pt-8 pb-32 px-4 md:px-0 animate-fade-in">
      <ReflectionHeader 
        title="Today's Reflection"
        date={new Date(journal.createdAt || journal.date).toLocaleDateString()}
        heroImage="https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?q=80&w=2070&auto=format&fit=crop"
        groundingSentence="Sometimes the best insights come after writing."
      />

      <div className="mb-24 relative">
        <Subheading className="text-center mb-8 text-secondary-foreground">Reflecting On</Subheading>
        <JournalPreview journal={{
          id: journal.id,
          title: journal.title,
          paragraphs: journal.content.split('\n').filter(p => p.trim() !== ''),
          date: new Date(journal.createdAt || journal.date).toLocaleDateString()
        }} />
      </div>

      <div className="mb-24">
        <SectionHeader className="text-center mb-12">Insights & Patterns</SectionHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 max-w-3xl mx-auto mb-8">
          {observations.map((obs, index) => (
            <ReflectionCard 
              key={obs.id}
              category={obs.category}
              text={obs.text}
              index={index}
            />
          ))}
        </div>
        <div className="text-center mt-8">
          <button
            onClick={() => reanalyzeMutation.mutate(journal.id)}
            disabled={reanalyzeMutation.isPending}
            className="px-6 py-2 border border-border/50 rounded-full text-sm font-medium hover:bg-secondary/50 transition-colors disabled:opacity-50"
          >
            {reanalyzeMutation.isPending ? "Reanalyzing..." : "Reanalyze with AI"}
          </button>
        </div>
      </div>

      <div className="mb-32 max-w-3xl mx-auto">
        <ReflectionQuestion question={journal.motivationalThought || "What is one small step you can take today based on this entry?"} />
      </div>
    </div>
  )
}