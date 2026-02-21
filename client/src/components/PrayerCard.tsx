import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Minus, Pencil, Check, X } from "lucide-react";
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
  onSetCount: (count: number) => void;
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
  onSetCount,
  isUpdating
}: PrayerCardProps) {
  const percentage = Math.min(100, Math.round((completed / total) * 100));
  const remaining = Math.max(0, total - completed);
  const { language } = useLanguageStore();
  const t = translations[language];

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setEditValue(String(completed));
    setIsEditing(true);
  };

  const handleConfirmEdit = () => {
    const num = parseInt(editValue, 10);
    if (!isNaN(num)) {
      onSetCount(Math.max(0, Math.min(num, total)));
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleConfirmEdit();
    if (e.key === "Escape") handleCancelEdit();
  };

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
          <div
            className="bg-muted/50 rounded-xl p-3 text-center cursor-pointer hover:bg-muted/80 transition-colors group relative"
            onClick={!isEditing ? handleStartEdit : undefined}
            title={t.editCount}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{t.done}</p>
            {isEditing ? (
              <div className="flex items-center gap-1 justify-center">
                <input
                  ref={inputRef}
                  type="number"
                  min={0}
                  max={total}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-20 text-center text-lg font-bold bg-background border border-border rounded-lg px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={(e) => { e.stopPropagation(); handleConfirmEdit(); }}
                  className="p-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
                  className="p-1 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-1">
                <p className="text-lg font-bold text-primary">{completed.toLocaleString()}</p>
                <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
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

