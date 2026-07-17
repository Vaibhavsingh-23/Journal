import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { Outlet } from "react-router-dom"

export function AppLayout() {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 md:py-12 max-w-[1200px] mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
