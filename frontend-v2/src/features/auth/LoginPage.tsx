import { Link, useLocation } from "react-router-dom"
import { LoginForm } from "./LoginForm"
import { motion } from "framer-motion"

export function LoginPage() {
  const location = useLocation()
  const message = location.state?.message

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/10 via-background to-background -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        {message && (
          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-green-600 text-sm text-center font-medium">
            {message}
          </div>
        )}

        <LoginForm />
        
        <p className="mt-8 text-center text-sm text-secondary-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-foreground hover:text-accent transition-colors">
            Sign up
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
