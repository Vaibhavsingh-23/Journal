import { PageHeader } from '@/components/common/PageHeader';
import { InsightCard } from '@/components/common/InsightCard';
import { mockInsights, mockSentimentData, mockMoodDistribution } from '@/data/mock';
import { motion } from 'framer-motion';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

export default function Insights() {
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <PageHeader
        title="Insights"
        description="Patterns your Second Brain has discovered across your experiences."
      />

      {/* Charts */}
      <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sentiment Over Time */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <h3 className="font-serif text-base font-medium text-[hsl(var(--foreground))] mb-4">
            Sentiment Trend
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockSentimentData}>
                <defs>
                  <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(32, 45%, 65%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(32, 45%, 65%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: 'hsl(30, 5%, 55%)' }}
                  axisLine={{ stroke: 'hsl(0, 0%, 16%)' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[-1, 1]}
                  tick={{ fontSize: 11, fill: 'hsl(30, 5%, 55%)' }}
                  axisLine={{ stroke: 'hsl(0, 0%, 16%)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 9%)',
                    border: '1px solid hsl(0, 0%, 16%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(35, 15%, 88%)',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(32, 45%, 65%)"
                  strokeWidth={2}
                  fill="url(#sentimentGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mood Distribution */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
          <h3 className="font-serif text-base font-medium text-[hsl(var(--foreground))] mb-4">
            Mood Distribution
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockMoodDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 16%)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: 'hsl(30, 5%, 55%)' }}
                  axisLine={{ stroke: 'hsl(0, 0%, 16%)' }}
                  tickLine={false}
                />
                <YAxis
                  dataKey="mood"
                  type="category"
                  tick={{ fontSize: 11, fill: 'hsl(30, 5%, 55%)' }}
                  axisLine={{ stroke: 'hsl(0, 0%, 16%)' }}
                  tickLine={false}
                  width={75}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(0, 0%, 9%)',
                    border: '1px solid hsl(0, 0%, 16%)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: 'hsl(35, 15%, 88%)',
                  }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Insight Cards */}
      <motion.div variants={item}>
        <h2 className="font-serif text-lg font-medium text-[hsl(var(--foreground))] mb-4">
          All Insights
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
