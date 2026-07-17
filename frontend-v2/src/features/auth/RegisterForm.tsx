import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useNavigate } from "react-router-dom"
import { useMutation } from "@tanstack/react-query"
import { authApi } from "../../services/api/auth"
import { Heading, Body, Caption } from "../../components/ui/Typography"

const registerSchema = z.object({
  userName: z.string().min(3, "Username must be at least 3 characters").max(30, "Username is too long"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterForm() {
  const navigate = useNavigate()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  })

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      navigate("/login", { state: { message: "Account created successfully. Please log in." } })
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Failed to create account. Please try again."
      setErrorMsg(msg)
    },
  })

  const onSubmit = (data: RegisterValues) => {
    setErrorMsg(null)
    registerMutation.mutate({
      userName: data.userName,
      email: data.email,
      password: data.password
    })
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 md:p-12 bg-background border border-border/50 rounded-2xl shadow-sm">
      <Heading className="mb-2 text-center text-3xl">Create an account</Heading>
      <Body className="text-secondary-foreground text-center mb-8">Begin your journaling journey.</Body>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Username</label>
          <input
            {...register("userName")}
            type="text"
            className="w-full px-4 py-3 bg-transparent border border-border rounded-lg focus:outline-none focus:border-accent transition-colors"
            placeholder="johndoe"
          />
          {errors.userName && <Caption className="text-red-500 mt-1.5 block">{errors.userName.message}</Caption>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
          <input
            {...register("email")}
            type="email"
            className="w-full px-4 py-3 bg-transparent border border-border rounded-lg focus:outline-none focus:border-accent transition-colors"
            placeholder="john@example.com"
          />
          {errors.email && <Caption className="text-red-500 mt-1.5 block">{errors.email.message}</Caption>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
          <input
            {...register("password")}
            type="password"
            className="w-full px-4 py-3 bg-transparent border border-border rounded-lg focus:outline-none focus:border-accent transition-colors"
            placeholder="••••••••"
          />
          {errors.password && <Caption className="text-red-500 mt-1.5 block">{errors.password.message}</Caption>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Confirm Password</label>
          <input
            {...register("confirmPassword")}
            type="password"
            className="w-full px-4 py-3 bg-transparent border border-border rounded-lg focus:outline-none focus:border-accent transition-colors"
            placeholder="••••••••"
          />
          {errors.confirmPassword && <Caption className="text-red-500 mt-1.5 block">{errors.confirmPassword.message}</Caption>}
        </div>

        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full py-3.5 mt-2 bg-foreground text-background font-medium rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {registerMutation.isPending ? "Creating account..." : "Sign up"}
        </button>
      </form>
    </div>
  )
}
