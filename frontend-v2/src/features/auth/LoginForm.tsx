import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { authApi } from "../../services/api/auth"
import { useAuth } from "../../context/AuthContext"
import { Heading, Body, Caption } from "../../components/ui/Typography"

const loginSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      login(data.token)
      navigate("/")
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Invalid username or password."
      setErrorMsg(msg)
    },
  })

  const onSubmit = (data: LoginValues) => {
    setErrorMsg(null)
    loginMutation.mutate(data)
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 md:p-12 bg-background border border-border/50 rounded-2xl shadow-sm">
      <Heading className="mb-2 text-center text-3xl">Welcome back</Heading>
      <Body className="text-secondary-foreground text-center mb-8">Enter your details to access your journal.</Body>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Username</label>
          <input
            {...register("username")}
            type="text"
            className="w-full px-4 py-3 bg-transparent border border-border rounded-lg focus:outline-none focus:border-accent transition-colors"
            placeholder="johndoe"
          />
          {errors.username && <Caption className="text-red-500 mt-2 block">{errors.username.message}</Caption>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Password</label>
          <input
            {...register("password")}
            type="password"
            className="w-full px-4 py-3 bg-transparent border border-border rounded-lg focus:outline-none focus:border-accent transition-colors"
            placeholder="••••••••"
          />
          {errors.password && <Caption className="text-red-500 mt-2 block">{errors.password.message}</Caption>}
        </div>

        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full py-3.5 bg-foreground text-background font-medium rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {loginMutation.isPending ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  )
}
