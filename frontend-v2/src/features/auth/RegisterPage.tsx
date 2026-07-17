import { Link } from "react-router-dom"
import { RegisterForm } from "./RegisterForm"
import { motion } from "framer-motion"

export function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background relative overflow-hidden">
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-accent/10 via-background to-background -z-10" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <RegisterForm />
        
        <p className="mt-8 text-center text-sm text-secondary-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-foreground hover:text-accent transition-colors">
            Sign in
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
