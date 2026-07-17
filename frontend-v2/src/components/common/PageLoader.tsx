import { Loader2 } from "lucide-react"
import { Body } from "../ui/Typography"

export function PageLoader() {
  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] w-full items-center justify-center animate-fade-in space-y-4">
      <Loader2 className="w-8 h-8 animate-spin text-secondary-foreground" />
      <Body className="text-secondary-foreground italic text-lg tracking-wide">
        Loading...
      </Body>
    </div>
  )
}
