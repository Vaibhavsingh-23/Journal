import { Outlet } from 'react-router-dom';
import { Brain } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex">
      {/* Left — Branding panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-1 via-surface-0 to-surface-2" />
        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[hsl(var(--primary))] flex items-center justify-center">
              <Brain className="w-5 h-5 text-[hsl(var(--primary-foreground))]" />
            </div>
            <span className="font-serif text-xl font-semibold text-[hsl(var(--foreground))]">
              Second Brain
            </span>
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl font-semibold text-[hsl(var(--foreground))] leading-tight mb-6">
            Understand your mind.
            <br />
            <span className="text-[hsl(var(--primary))]">One entry at a time.</span>
          </h1>
          <p className="text-[hsl(var(--muted-foreground))] text-lg leading-relaxed max-w-md">
            A reflective journaling experience with AI-powered mood analysis, 
            memory formation, and personal insights — designed to help you grow every day.
          </p>

          <div className="mt-12 space-y-4">
            {[
              {
                title: 'Reflective Journaling',
                desc: 'Write freely. Your entries are analyzed for mood, sentiment, and patterns.',
              },
              {
                title: 'Living Memory',
                desc: 'Your experiences form evolving memories that connect and grow over time.',
              },
              {
                title: 'Personal Insights',
                desc: 'AI discovers patterns you might miss — habits, trends, and growth.',
              },
            ].map((feature) => (
              <div key={feature.title} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] mt-2 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[hsl(var(--foreground))]">
                    {feature.title}
                  </p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
