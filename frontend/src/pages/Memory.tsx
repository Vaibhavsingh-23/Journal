import { useRef, useCallback, useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { mockGraphData, mockMemories } from '@/data/mock';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { Memory } from '@/types/models';
import ForceGraph2D from 'react-force-graph-2d';

const typeColors: Record<string, string> = {
  memory: '#c4956a',
  entity: '#7c9a92',
  insight: '#b8a9c9',
};

export default function MemoryExplorer() {
  const graphRef = useRef<any>(null);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const handleNodeClick = useCallback((node: any) => {
    const mem = mockMemories.find((m) => m.id === node.id);
    if (mem) setSelectedMemory(mem);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 500);
      graphRef.current.zoom(2, 500);
    }
  }, []);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D) => {
    const size = (node.val || 4) * 1.5;
    const color = typeColors[node.type] || '#666';

    // Glow
    ctx.beginPath();
    ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
    ctx.fillStyle = color + '20';
    ctx.fill();

    // Node
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    // Label
    ctx.font = `${Math.max(3, size * 0.6)}px Inter, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#e0d5c5';
    ctx.fillText(node.label, node.x, node.y + size + 3);
  }, []);

  return (
    <div>
      <PageHeader
        title="Memory Explorer"
        description="Your experiences, connected. Click a node to explore a memory."
      />

      <div className="flex gap-6">
        {/* Graph */}
        <div className="flex-1 rounded-xl border border-[hsl(var(--border))] bg-surface-0 overflow-hidden relative" style={{ height: 'calc(100vh - 220px)' }}>
          <ForceGraph2D
            ref={graphRef}
            graphData={mockGraphData}
            nodeCanvasObject={paintNode}
            nodePointerAreaPaint={(node: any, color: string, ctx: CanvasRenderingContext2D) => {
              const size = (node.val || 4) * 1.5;
              ctx.beginPath();
              ctx.arc(node.x, node.y, size + 4, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
            }}
            onNodeClick={handleNodeClick}
            linkColor={() => 'rgba(196, 149, 106, 0.15)'}
            linkWidth={1}
            backgroundColor="transparent"
            cooldownTicks={80}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
          />

          {/* Legend */}
          <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
            {Object.entries(typeColors).map(([type, color]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="capitalize">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedMemory && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-[340px] flex-shrink-0"
            >
              <div className="sticky top-24 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]">
                      {selectedMemory.memoryType}
                    </span>
                    <h3 className="font-serif text-lg font-medium text-[hsl(var(--foreground))] mt-2">
                      {selectedMemory.title}
                    </h3>
                  </div>
                  <button onClick={() => setSelectedMemory(null)} className="p-1 rounded hover:bg-[hsl(var(--accent))]">
                    <X className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  </button>
                </div>

                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed mb-4">
                  {selectedMemory.summary}
                </p>

                <div className="space-y-2 mb-4">
                  <p className="text-xs font-medium text-[hsl(var(--foreground))] uppercase tracking-wider">Timeline</p>
                  {selectedMemory.timeline.map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--primary))] mt-1.5 flex-shrink-0" />
                      <p className="text-sm text-[hsl(var(--muted-foreground))]">{point}</p>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    selectedMemory.status === 'ACTIVE' ? 'bg-emerald-400/10 text-emerald-400' :
                    selectedMemory.status === 'EMERGING' ? 'bg-amber-400/10 text-amber-400' :
                    'bg-zinc-400/10 text-zinc-400'
                  }`}>
                    {selectedMemory.status}
                  </span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    · {selectedMemory.fragmentIds.length} fragments
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
