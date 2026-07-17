import { useState, useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { journalApi } from "../../services/api/journal"
import { useDebounce } from "../../hooks/useDebounce"

import { PromptCard } from "../../components/editor/PromptCard"
import { JournalTitle } from "../../components/editor/JournalTitle"
import { JournalEditor } from "../../components/editor/JournalEditor"
import { WritingToolbar } from "../../components/editor/WritingToolbar"
import { WordCounter } from "../../components/editor/WordCounter"
import { SaveStatus } from "../../components/editor/SaveStatus"
import { RecentEntryCard } from "../../components/editor/RecentEntryCard"
import { Subheading, Caption } from "../../components/ui/Typography"
import { motion } from "framer-motion"

export function Journal() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const entryId = searchParams.get("id")

  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error">("saved")

  // Load Recent Entries for Sidebar
  const { data: recentEntriesPage } = useQuery({
    queryKey: ["journals", { page: 0, size: 10 }],
    queryFn: () => journalApi.getEntries(0, 10),
  })
  const recentEntries = recentEntriesPage?.content || []

  // Load specific entry if ID is present
  const { data: activeEntry, isLoading: loadingEntry } = useQuery({
    queryKey: ["journal", entryId],
    queryFn: () => journalApi.getEntry(entryId!),
    enabled: !!entryId,
  })

  useEffect(() => {
    if (activeEntry) {
      setTitle(activeEntry.title)
      setBody(activeEntry.content)
    } else if (!entryId) {
      setTitle("")
      setBody("")
    }
  }, [activeEntry, entryId])

  const debouncedTitle = useDebounce(title, 1000)
  const debouncedBody = useDebounce(body, 1000)

  // Mutations
  const createMutation = useMutation({
    mutationFn: journalApi.createEntry,
    onMutate: () => setSaveState("saving"),
    onSuccess: (data) => {
      setSaveState("saved")
      queryClient.invalidateQueries({ queryKey: ["journals"] })
      // Redirect to the new ID so subsequent saves are updates
      navigate(`/journal?id=${data.id}`, { replace: true })
    },
    onError: () => setSaveState("error")
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string, title: string, content: string }) => journalApi.updateEntry(data.id, data),
    onMutate: () => setSaveState("saving"),
    onSuccess: () => {
      setSaveState("saved")
      queryClient.invalidateQueries({ queryKey: ["journals"] })
      if (entryId) {
        queryClient.invalidateQueries({ queryKey: ["journal", entryId] })
      }
    },
    onError: () => setSaveState("error")
  })

  // Auto-save logic
  useEffect(() => {
    // Prevent saving empty initial state
    if (!debouncedTitle && !debouncedBody) return
    // Prevent saving if it matches the active entry (avoids infinite save loop on load)
    if (activeEntry && debouncedTitle === activeEntry.title && debouncedBody === activeEntry.content) return

    if (entryId) {
      updateMutation.mutate({ id: entryId, title: debouncedTitle || "Untitled", content: debouncedBody })
    } else {
      // Only create if we actually typed something
      if (debouncedTitle.trim() || debouncedBody.trim()) {
        createMutation.mutate({ title: debouncedTitle || "Untitled", content: debouncedBody })
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, debouncedBody])

  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0
  const charCount = body.length
  
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  if (loadingEntry) {
    return <div className="flex items-center justify-center h-full">Loading...</div>
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 h-full max-w-6xl mx-auto pt-4 md:pt-8 animate-fade-in pb-32">
      
      {/* Main Writing Column */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full relative">
        <header className="mb-8 flex flex-col">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="flex items-center justify-between mb-8"
          >
            <Caption className="text-secondary-foreground uppercase tracking-wider font-medium">
              {activeEntry ? new Date(activeEntry.createdAt || activeEntry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : currentDate}
            </Caption>
            <SaveStatus status={saveState} />
          </motion.div>

          {!activeEntry && <PromptCard prompt="What's on your mind today?" />}
          
          <JournalTitle 
            value={title} 
            onChange={(e) => {
              setTitle(e.target.value)
              if (saveState === "saved") setSaveState("saving")
            }} 
          />
        </header>

        <div className="flex-1 flex flex-col relative">
          <JournalEditor 
            value={body}
            onChange={(e) => {
              setBody(e.target.value)
              if (saveState === "saved") setSaveState("saving")
            }}
          />
        </div>

        <footer className="fixed bottom-0 left-0 right-0 lg:left-64 p-6 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none flex justify-center lg:justify-start lg:pl-12 lg:pb-8">
          <div className="pointer-events-auto flex items-center space-x-4">
            <WordCounter 
              words={wordCount}
              chars={charCount}
              readingTime={Math.max(1, Math.ceil(wordCount / 200)) + " min read"}
            />
          </div>
        </footer>
        
        <WritingToolbar />
      </div>

      {/* Sidebar for Recent Entries (Desktop Only) */}
      <aside className="hidden lg:block w-72 flex-shrink-0 sticky top-12 self-start pl-8 border-l border-border/50 h-[calc(100vh-6rem)] overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6 border-b border-border/50 pb-2">
            <Subheading>Recent Entries</Subheading>
            <button 
              onClick={() => navigate("/journal")}
              className="text-xs text-secondary-foreground hover:text-foreground transition-colors font-medium uppercase tracking-wider bg-secondary/30 px-2 py-1 rounded"
            >
              New
            </button>
          </div>
          <div className="flex flex-col">
            {recentEntries.map((entry, idx) => (
              <RecentEntryCard key={entry.id} entry={entry} index={idx} />
            ))}
          </div>
        </motion.div>
      </aside>
    </div>
  )
}