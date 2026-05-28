import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, IndianRupee, Landmark, Wallet } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

interface RevenueHeroCardProps {
  collected: number;
  pending: number;
  growthRate?: number;
  type: 'tech' | 'realestate' | 'training' | 'coaching' | 'admin';
}

export const RevenueHeroCard: React.FC<RevenueHeroCardProps> = ({
  collected,
  pending,
  growthRate = 0,
  type
}) => {
  const [animatedCollected, setAnimatedCollected] = useState(0);
  const [animatedPending, setAnimatedPending] = useState(0);

  // Smooth count-up animation on load
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1200; // 1.2s animation

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      setAnimatedCollected(Math.floor(progress * collected));
      setAnimatedPending(Math.floor(progress * pending));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [collected, pending]);

  // Accent mapping
  let borderGlow = 'pulse-glow-purple border-brand-tech/30';
  let gradientBackground = 'from-brand-tech/15 via-brand-dark to-brand-card';
  let badgeAccent = 'bg-brand-tech/10 text-brand-tech border-brand-tech/20';

  if (type === 'realestate') {
    borderGlow = 'pulse-glow-coral border-brand-re/30';
    gradientBackground = 'from-brand-re/15 via-brand-dark to-brand-card';
    badgeAccent = 'bg-brand-re/10 text-brand-re border-brand-re/20';
  } else if (type === 'training') {
    borderGlow = 'pulse-glow-emerald border-brand-training/30';
    gradientBackground = 'from-brand-training/15 via-brand-dark to-brand-card';
    badgeAccent = 'bg-brand-training/10 text-brand-training border-brand-training/20';
  } else if (type === 'coaching') {
    borderGlow = 'pulse-glow-gold border-brand-coaching/30';
    gradientBackground = 'from-brand-coaching/15 via-brand-dark to-brand-card';
    badgeAccent = 'bg-brand-coaching/10 text-brand-coaching border-brand-coaching/20';
  } else if (type === 'admin') {
    borderGlow = 'shadow-[0_0_20px_rgba(168,85,247,0.15)] border-indigo-500/20';
    gradientBackground = 'from-indigo-600/10 via-rose-500/5 to-brand-card';
    badgeAccent = 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
  }

  const isPositiveGrowth = growthRate >= 0;

  return (
    <div className={`revenue-hero-card w-full rounded-2xl border p-6 bg-gradient-to-br ${gradientBackground} ${borderGlow} transition-all duration-300`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Total Collected */}
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Landmark className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-heading">
              Total Revenue Collected
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-emerald-400 mt-1">
              {formatINR(animatedCollected)}
            </h2>
          </div>
        </div>

        {/* Total Pending */}
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-heading">
              Total Pending Outstandings
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-amber-400 mt-1">
              {formatINR(animatedPending)}
            </h2>
          </div>
        </div>

        {/* Growth Stats indicator */}
        <div className="flex flex-col items-start md:items-end justify-center">
          <div className="flex items-center gap-2">
            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
              isPositiveGrowth 
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' 
                : 'bg-rose-950/40 text-rose-400 border-rose-800/40'
            }`}>
              {isPositiveGrowth ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(growthRate)}%
            </span>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
              Month over Month
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 md:text-right">
            Based on active pipelines and closed items.
          </p>
        </div>

      </div>
    </div>
  );
};
