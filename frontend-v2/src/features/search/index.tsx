import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useAuth } from "../../context/AuthContext"
import { searchApi } from "../../services/api/search"
import { Search as SearchIcon, Loader2, BookOpen } from "lucide-react"
import { Body, Heading, Subheading } from "../../components/ui/Typography"

export function Search() {
  const { user } = useAuth()
  const [query, setQuery] = useState("")

  const searchMutation = useMutation({
    mutationFn: (q: string) => searchApi.query(user!.id, q),
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return
    searchMutation.mutate(query)
  }

  return (
    <div className="pt-8 pb-32 max-w-4xl mx-auto animate-fade-in">
      <div className="text-center mb-16">
        <Heading className="mb-4">Semantic Search</Heading>
        <Body className="text-secondary-foreground text-lg">
          Ask questions about your past entries, memories, and insights.
        </Body>
      </div>

      <form onSubmit={handleSearch} className="relative mb-16 max-w-2xl mx-auto">
        <div className="relative flex items-center">
          <SearchIcon className="absolute left-6 w-6 h-6 text-secondary-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. When was I happiest? or What did I learn in Bangalore?"
            className="w-full bg-secondary/30 border border-border/50 text-foreground text-lg rounded-full py-4 pl-16 pr-6 focus:outline-none focus:ring-1 focus:ring-accent transition-all placeholder:text-secondary-foreground/50"
            disabled={searchMutation.isPending}
          />
          <button 
            type="submit"
            disabled={searchMutation.isPending || !query.trim()}
            className="absolute right-2 px-6 py-2 bg-foreground text-background rounded-full font-medium hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            {searchMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
          </button>
        </div>
      </form>

      {searchMutation.isError && (
        <div className="p-8 border border-red-500/20 bg-red-500/5 rounded-2xl text-center">
          <Body className="text-red-500">
            An error occurred while searching. Please try again.
          </Body>
        </div>
      )}

      {searchMutation.isSuccess && searchMutation.data && (
        <div className="space-y-12 animate-fade-in">
          {/* Answer Section */}
          <div className="p-8 md:p-12 border border-border/50 rounded-2xl bg-secondary/10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
            <Subheading className="mb-6 text-accent">AI Answer</Subheading>
            <Body className="text-lg leading-relaxed">{searchMutation.data.answer}</Body>
            <div className="mt-6 pt-6 border-t border-border/50 flex justify-end">
              <span className="text-xs text-secondary-foreground uppercase tracking-widest font-medium">
                Engine: {searchMutation.data.engine_used}
              </span>
            </div>
          </div>

          {/* Sources Section */}
          {searchMutation.data.sources && searchMutation.data.sources.length > 0 && (
            <div>
              <Subheading className="mb-6">Sources</Subheading>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {searchMutation.data.sources.map((source, idx) => (
                  <div key={idx} className="p-6 border border-border/50 rounded-xl hover:border-border transition-colors">
                    <div className="flex items-center space-x-2 mb-4">
                      <BookOpen className="w-4 h-4 text-secondary-foreground" />
                      <span className="text-xs uppercase tracking-wider font-medium text-secondary-foreground">
                        Relevance: {Math.round(source.score * 100)}%
                      </span>
                    </div>
                    <Body className="text-sm text-foreground/80 line-clamp-4 leading-relaxed">
                      "{source.text}"
                    </Body>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}