import { NavLink, useNavigate } from "react-router-dom"
import { BookOpen, Compass, History, LayoutDashboard, Lightbulb, Search, Settings, User, LogOut } from "lucide-react"
import { useAuth } from "../../context/AuthContext"

const NAV_ITEMS = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Journal", path: "/journal", icon: BookOpen },
  { label: "Reflection", path: "/reflection", icon: Compass },
  { label: "Memories", path: "/memories", icon: History },
  { label: "Insights", path: "/insights", icon: Lightbulb },
  { label: "Search", path: "/search", icon: Search },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/login")
  }

  return (
    <aside className="w-64 border-r border-border bg-background flex flex-col pt-8 pb-6 px-4">
      <div className="px-4 mb-10">
        <h1 className="font-serif text-xl tracking-wide font-medium text-foreground">Second Brain</h1>
      </div>
      
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors ${
                isActive 
                  ? "bg-secondary text-foreground font-medium" 
                  : "text-secondary-foreground hover:bg-secondary/50 hover:text-foreground"
              }`
            }
          >
            <item.icon className="w-4 h-4 stroke-[1.5]" />
            <span className="text-sm tracking-wide">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="space-y-1 mt-auto">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors ${
              isActive 
                ? "bg-secondary text-foreground font-medium" 
                : "text-secondary-foreground hover:bg-secondary/50 hover:text-foreground"
            }`
          }
        >
          <User className="w-4 h-4 stroke-[1.5]" />
          <span className="text-sm tracking-wide">Profile</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors ${
              isActive 
                ? "bg-secondary text-foreground font-medium" 
                : "text-secondary-foreground hover:bg-secondary/50 hover:text-foreground"
            }`
          }
        >
          <Settings className="w-4 h-4 stroke-[1.5]" />
          <span className="text-sm tracking-wide">Settings</span>
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-md transition-colors text-secondary-foreground hover:bg-red-500/10 hover:text-red-500"
        >
          <LogOut className="w-4 h-4 stroke-[1.5]" />
          <span className="text-sm tracking-wide">Log out</span>
        </button>
      </div>

      {user && (
        <div className="mt-6 pt-6 border-t border-border px-4">
          <p className="text-xs text-secondary-foreground uppercase tracking-widest mb-1">Signed in as</p>
          <p className="text-sm font-medium text-foreground truncate">{user.username}</p>
        </div>
      )}
    </aside>
  )
}
