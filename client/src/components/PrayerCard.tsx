import { motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";
import { CircularProgressbarWithChildren, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { cn } from "@/lib/utils";
import { useLanguageStore } from "@/hooks/use-language";
import { translations } from "@/lib/translations";

interface PrayerCardProps {
  name: string;
  arabicName: string;
  total: number;
  completed: number;
  color: string;
  icon: React.ReactNode;
  onIncrement: () => void;
  onDecrement: () => void;
  isUpdating: boolean;
}

export function PrayerCard({
  name,
  arabicName,
  total,
  completed,
  color,
  icon,
  onIncrement,
  onDecrement,
  isUpdating
}: PrayerCardProps) {
  const percentage = Math.min(100, Math.round((completed / total) * 100));
  const remaining = Math.max(0, total - completed);
  const { language } = useLanguageStore();
  const t = translations[language];

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="relative overflow-hidden rounded-3xl bg-white dark:bg-card border border-border/50 shadow-lg hover:shadow-xl transition-all duration-300"
    >
      {/* Background decoration */}
      <div className={cn("absolute top-0 right-0 w-32 h-32 opacity-5 rounded-bl-full pointer-events-none", color)} />
      
      <div className="p-6 flex flex-col items-center">
        <div className="w-full flex justify-between items-start mb-6">
          <div className="flex flex-col">
            <h3 className="text-2xl font-bold font-display text-foreground">{name}</h3>
            <span className="text-sm font-display text-muted-foreground opacity-80">{arabicName}</span>
          </div>
          <div className={cn("p-2 rounded-xl bg-opacity-10", color.replace('bg-', 'bg-opacity-10 bg-'))}>
             <div className={cn("text-current", color.replace('bg-', 'text-'))}>{icon}</div>
          </div>
        </div>

        <div className="w-40 h-40 mb-6 relative">
          <CircularProgressbarWithChildren
            value={percentage}
            styles={buildStyles({
              pathColor: `var(--primary)`,
              trailColor: 'rgba(0,0,0,0.05)',
              strokeLinecap: 'round',
              pathTransitionDuration: 0.5,
            })}
          >
            <div className="text-center flex flex-col items-center justify-center">
              <span className="text-3xl font-bold text-foreground">{percentage}%</span>
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t.done}</span>
            </div>
          </CircularProgressbarWithChildren>
        </div>

        <div className="w-full grid grid-cols-2 gap-4 mb-6">
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t.left}</p>
            <p className="text-lg font-bold text-foreground">{remaining.toLocaleString()}</p>
          </div>
          <div className="bg-muted/50 rounded-xl p-3 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t.done}</p>
            <p className="text-lg font-bold text-primary">{completed.toLocaleString()}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onDecrement}
            disabled={isUpdating || completed === 0}
            className="p-3 rounded-xl bg-muted hover:bg-muted/80 text-muted-foreground disabled:opacity-50 transition-colors"
          >
            <Minus className="w-5 h-5" />
          </button>
          
          <button
            onClick={onIncrement}
            disabled={isUpdating || remaining === 0}
            className={cn(
              "flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-white shadow-lg shadow-black/5 hover:shadow-xl active:scale-[0.98] transition-all",
              color
            )}
          >
            <Plus className="w-5 h-5" />
            <span>{t.done}</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
