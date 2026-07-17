import { createContext, useContext, useEffect, useState } from "react"
import type { ReactNode } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { authApi } from "../services/api/auth"
import type { UserProfile } from "../services/api/auth"

interface AuthContextType {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (token: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(localStorage.getItem("jwt_token"))

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["currentUser"],
    queryFn: authApi.getCurrentUser,
    enabled: !!token,
    retry: false,
  })

  // Handle unauthorized event from axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => {
      logout()
    }
    window.addEventListener("auth:unauthorized", handleUnauthorized)
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized)
  }, [])

  // Auto-logout if the fetch fails (e.g. token expired)
  useEffect(() => {
    if (isError) {
      logout()
    }
  }, [isError])

  const login = (newToken: string) => {
    localStorage.setItem("jwt_token", newToken)
    setToken(newToken)
    // We invalidate so React Query fetches the real user profile using the new token
    queryClient.invalidateQueries({ queryKey: ["currentUser"] })
  }

  const logout = () => {
    localStorage.removeItem("jwt_token")
    setToken(null)
    queryClient.clear() // Clear all cached data across the app
  }

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: isLoading && !!token,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
