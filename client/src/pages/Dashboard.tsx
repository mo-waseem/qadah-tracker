import { useQada, useUpdateQadaCount } from "@/hooks/use-qada";
import { PrayerCard } from "@/components/PrayerCard";
import { Sun, Moon, Sunrise, Sunset, CloudSun, Star, Settings, Globe } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguageStore } from "@/hooks/use-language";
import { translations } from "@/lib/translations";

const prayers = [
  { id: 'fajr', name: 'Fajr', arabic: 'الفجر', icon: <Sunrise />, color: 'bg-emerald-500' },
  { id: 'dhuhr', name: 'Dhuhr', arabic: 'الظهر', icon: <Sun />, color: 'bg-amber-500' },
  { id: 'asr', name: 'Asr', arabic: 'العصر', icon: <CloudSun />, color: 'bg-orange-500' },
  { id: 'maghrib', name: 'Maghrib', arabic: 'المغرب', icon: <Sunset />, color: 'bg-red-500' },
  { id: 'isha', name: 'Isha', arabic: 'العشاء', icon: <Moon />, color: 'bg-indigo-600' },
] as const;

export default function Dashboard() {
  const { data: qada, isLoading } = useQada();
  const updateMutation = useUpdateQadaCount();
  const { language, setLanguage } = useLanguageStore();
  const t = translations[language];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!qada) return null;

  const totalCompleted = 
    qada.fajrCompleted + qada.dhuhrCompleted + qada.asrCompleted + 
    qada.maghribCompleted + qada.ishaCompleted;

  const totalMissed = 
    qada.fajrCount + qada.dhuhrCount + qada.asrCount + 
    qada.maghribCount + qada.ishaCount;

  const handleUpdate = (prayer: typeof prayers[number]['id'], action: 'increment' | 'decrement') => {
    updateMutation.mutate({ prayer, action });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <Moon className="w-5 h-5" />
            </div>
            <span className="font-bold font-display tracking-tight">{t.appName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              {language === 'en' ? 'العربية' : 'English'}
            </button>
            <button 
              onClick={() => window.location.hash = '#setup'}
              className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              title={t.adjustDates}
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Summary Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary to-emerald-700 rounded-3xl p-8 mb-10 text-white shadow-xl shadow-primary/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
            <div className={language === 'ar' ? 'text-right' : ''}>
              <p className="text-primary-foreground/80 font-medium mb-1">{t.totalProg}</p>
              <h2 className="text-4xl md:text-5xl font-bold font-display">{totalCompleted.toLocaleString()} <span className="text-2xl opacity-60 font-sans font-normal">{t.prayersDone}</span></h2>
            </div>
            <div className={language === 'ar' ? 'text-left' : 'text-right'}>
              <p className="text-primary-foreground/80 font-medium mb-1">{t.remaining}</p>
              <p className="text-3xl font-bold">{(totalMissed - totalCompleted).toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-8 h-3 bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(totalCompleted / totalMissed) * 100}%` }}
            />
          </div>
        </motion.div>

        {/* Prayer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prayers.map((prayer, index) => (
            <motion.div
              key={prayer.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <PrayerCard
                name={language === 'ar' ? prayer.arabic : prayer.name}
                arabicName={language === 'ar' ? prayer.name : prayer.arabic}
                icon={prayer.icon}
                color={prayer.color}
                // @ts-ignore - dynamic key access
                total={qada[`${prayer.id}Count`]}
                // @ts-ignore - dynamic key access
                completed={qada[`${prayer.id}Completed`]}
                onIncrement={() => handleUpdate(prayer.id, 'increment')}
                onDecrement={() => handleUpdate(prayer.id, 'decrement')}
                isUpdating={updateMutation.isPending}
              />
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Summary Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary to-emerald-700 rounded-3xl p-8 mb-10 text-white shadow-xl shadow-primary/20 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end md:items-center gap-6">
            <div>
              <p className="text-primary-foreground/80 font-medium mb-1">Total Progress</p>
              <h2 className="text-4xl md:text-5xl font-bold font-display">{totalCompleted.toLocaleString()} <span className="text-2xl opacity-60 font-sans font-normal">prayers done</span></h2>
            </div>
            <div className="text-right">
              <p className="text-primary-foreground/80 font-medium mb-1">Remaining</p>
              <p className="text-3xl font-bold">{(totalMissed - totalCompleted).toLocaleString()}</p>
            </div>
          </div>

          <div className="mt-8 h-3 bg-black/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(totalCompleted / totalMissed) * 100}%` }}
            />
          </div>
        </motion.div>

        {/* Prayer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {prayers.map((prayer, index) => (
            <motion.div
              key={prayer.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <PrayerCard
                name={prayer.name}
                arabicName={prayer.arabic}
                icon={prayer.icon}
                color={prayer.color}
                // @ts-ignore - dynamic key access
                total={qada[`${prayer.id}Count`]}
                // @ts-ignore - dynamic key access
                completed={qada[`${prayer.id}Completed`]}
                onIncrement={() => handleUpdate(prayer.id, 'increment')}
                onDecrement={() => handleUpdate(prayer.id, 'decrement')}
                isUpdating={updateMutation.isPending}
              />
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
