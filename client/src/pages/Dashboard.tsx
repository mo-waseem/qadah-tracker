import { useState, useRef, useEffect } from "react";
import { useQada, useUpdateQadaCount, useImportExport } from "@/hooks/use-qada";
import { PrayerCard } from "@/components/PrayerCard";
import { Sun, Moon, Sunrise, Sunset, CloudSun, Settings, Globe, Info, Download, Upload, FileJson, Share, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguageStore } from "@/hooks/use-language";
import { translations } from "@/lib/translations";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { type QadaData } from "@/lib/idb";

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
  const { exportData, importData } = useImportExport();
  const { language, setLanguage } = useLanguageStore();
  const t = translations[language];

  const [pendingImport, setPendingImport] = useState<QadaData | null>(null);
  const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PWA Install logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;

    if (isIOS && !isStandalone) {
      setShowInstallBtn(true);
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    if (isIOS) {
      setIsIOSModalOpen(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
    }
  };

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        const data = JSON.parse(text) as QadaData;
        if (data.missedStartDate && data.missedEndDate) {
          setPendingImport(data);
          setIsImportAlertOpen(true);
        }
      } catch (err) {
        console.error("Invalid file", err);
      }
    }
  };

  const handleConfirmImport = async () => {
    if (pendingImport && fileInputRef.current?.files?.[0]) {
      await importData(fileInputRef.current.files[0]);
      setIsImportAlertOpen(false);
      setPendingImport(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
          <div className="flex items-center gap-1 sm:gap-2">
            <AnimatePresence>
              {showInstallBtn && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleInstallClick}
                  className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  title={t.installApp}
                >
                  <Smartphone className="w-5 h-5" />
                </motion.button>
              )}
            </AnimatePresence>

            <button
              onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden sm:inline">{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            <button
              onClick={() => exportData()}
              className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              title={t.exportData}
            >
              <Download className="w-5 h-5" />
            </button>

            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                title={t.importData}
              >
                <Upload className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => window.location.hash = '#info'}
              className="p-2 rounded-full hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
              title={t.about}
            >
              <Info className="w-5 h-5" />
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

        {/* Spiritual Hadith */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-12 text-center space-y-3"
        >
          {language === 'ar' ? (
            <>
              <p className="text-sm md:text-base font-medium text-muted-foreground italic">
                قال صلى الله عليه وسلم:
              </p>
              <h3 className="text-2xl md:text-4xl font-display text-primary leading-relaxed px-4 py-2 bg-primary/5 rounded-2xl inline-block border-x-4 border-primary/20">
                فليصلّها إذا ذكرها
              </h3>
            </>
          ) : (
            <p className="text-sm md:text-base font-medium text-muted-foreground italic border-x-2 border-primary/20 px-4 inline-block">
              {t.hadith}
            </p>
          )}
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

      <AlertDialog open={isImportAlertOpen} onOpenChange={setIsImportAlertOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileJson className="w-5 h-5 text-primary" />
              {t.confirmImport}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.confirmImportDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {pendingImport && (
            <div className={`space-y-3 py-4 border-y border-border my-2 ${language === 'ar' ? 'text-right' : ''}`}>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">{t.missedRange}:</span>
                <span className="font-bold">{pendingImport.missedStartDate} - {pendingImport.missedEndDate}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">{t.totalCompleted}:</span>
                <span className="font-bold">
                  {(
                    pendingImport.fajrCompleted +
                    pendingImport.dhuhrCompleted +
                    pendingImport.asrCompleted +
                    pendingImport.maghribCompleted +
                    pendingImport.ishaCompleted
                  ).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground font-medium">{t.lastUpdated}:</span>
                <span className="font-bold">{new Date(pendingImport.updatedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</span>
              </div>
            </div>
          )}

          <AlertDialogFooter className="flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto rounded-xl">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmImport}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 rounded-xl"
            >
              {t.confirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isIOSModalOpen} onOpenChange={setIsIOSModalOpen}>
        <DialogContent className="rounded-2xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-primary" />
              {t.iosInstallTitle}
            </DialogTitle>
            <DialogDescription>
              {t.installDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4 text-sm">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Share className="w-5 h-5" />
              </div>
              <p className="font-medium pt-1">{t.iosInstallStep1}</p>
            </div>
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="p-2 bg-primary/10 rounded-lg text-primary">
                <Upload className="w-5 h-5" />
              </div>
              <p className="font-medium pt-1">{t.iosInstallStep2}</p>
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setIsIOSModalOpen(false)}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold transition-all hover:bg-primary/90"
            >
              {t.close}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
