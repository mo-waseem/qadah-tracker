import { useState, useRef, useEffect } from "react";
import { format, parseISO, differenceInCalendarDays } from "date-fns";
import { useQada, useUpdateQadaCount, useSetQadaCount, useUpdateRange, useDeleteRange, useImportExport, aggregateRanges, countFridays, type AggregatedQada } from "@/hooks/use-qada";
import { PrayerCard } from "@/components/PrayerCard";
import { Sun, Moon, Sunrise, Sunset, CloudSun, Settings, Globe, Info, Download, Upload, FileJson, Share, Smartphone, Plus, Trash2, CalendarRange, Pencil } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type QadaStore } from "@/lib/idb";

const prayers = [
  { id: 'fajr', name: 'Fajr', arabic: 'الفجر', icon: <Sunrise />, color: 'bg-emerald-500' },
  { id: 'dhuhr', name: 'Dhuhr', arabic: 'الظهر', icon: <Sun />, color: 'bg-amber-500' },
  { id: 'asr', name: 'Asr', arabic: 'العصر', icon: <CloudSun />, color: 'bg-orange-500' },
  { id: 'maghrib', name: 'Maghrib', arabic: 'المغرب', icon: <Sunset />, color: 'bg-red-500' },
  { id: 'isha', name: 'Isha', arabic: 'العشاء', icon: <Moon />, color: 'bg-indigo-600' },
] as const;

export default function Dashboard() {
  const { data: store, isLoading } = useQada();
  const updateMutation = useUpdateQadaCount();
  const setCountMutation = useSetQadaCount();
  const updateRangeMutation = useUpdateRange();
  const deleteMutation = useDeleteRange();
  const { exportData, importData } = useImportExport();
  const { language, setLanguage } = useLanguageStore();
  const t = translations[language];

  const [pendingImport, setPendingImport] = useState<QadaStore | null>(null);
  const [isImportAlertOpen, setIsImportAlertOpen] = useState(false);
  const [deleteRangeIndex, setDeleteRangeIndex] = useState<number | null>(null);
  const [editRangeIndex, setEditRangeIndex] = useState<number | null>(null);
  const [editStartDate, setEditStartDate] = useState("");
  const [editEndDate, setEditEndDate] = useState("");
  const [editExcludeJomaa, setEditExcludeJomaa] = useState(false);
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

  if (!store || store.ranges.length === 0) return null;

  const agg = aggregateRanges(store.ranges);
  const lastRangeIndex = store.ranges.length - 1;

  const totalCompleted =
    agg.fajrCompleted + agg.dhuhrCompleted + agg.asrCompleted +
    agg.maghribCompleted + agg.ishaCompleted;

  const totalMissed =
    agg.fajrCount + agg.dhuhrCount + agg.asrCount +
    agg.maghribCount + agg.ishaCount;

  const handleUpdate = (prayer: typeof prayers[number]['id'], action: 'increment' | 'decrement') => {
    updateMutation.mutate({ prayer, action });
  };

  const handleSetCount = (prayer: typeof prayers[number]['id'], count: number) => {
    setCountMutation.mutate({ prayer, count });
  };

  const handleDeleteRange = (index: number) => {
    setDeleteRangeIndex(index);
  };

  const handleEditRange = (index: number) => {
    const range = store.ranges[index];
    setEditRangeIndex(index);
    setEditStartDate(range.missedStartDate);
    setEditEndDate(range.missedEndDate);
    setEditExcludeJomaa(range.excludeJomaa || false);
  };

  const confirmDeleteRange = () => {
    if (deleteRangeIndex !== null) {
      deleteMutation.mutate(deleteRangeIndex);
      setDeleteRangeIndex(null);
    }
  };

  const confirmEditRange = () => {
    if (editRangeIndex !== null) {
      updateRangeMutation.mutate({
        rangeIndex: editRangeIndex,
        missedStartDate: editStartDate,
        missedEndDate: editEndDate,
        excludeJomaa: editExcludeJomaa,
      });
      setEditRangeIndex(null);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        // Accept both old and new formats for preview
        if ((data.missedStartDate && data.missedEndDate) || (data.ranges && Array.isArray(data.ranges))) {
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
              style={{ width: `${totalMissed > 0 ? (totalCompleted / totalMissed) * 100 : 0}%` }}
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
          {prayers.map((prayer) => (
            <motion.div
              key={prayer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <PrayerCard
                name={language === 'ar' ? prayer.arabic : prayer.name}
                arabicName={language === 'ar' ? prayer.name : prayer.arabic}
                // @ts-ignore - dynamic key access
                total={agg[`${prayer.id}Count`]}
                // @ts-ignore - dynamic key access
                completed={agg[`${prayer.id}Completed`]}
                color={prayer.color}
                icon={prayer.icon}
                onIncrement={() => handleUpdate(prayer.id as any, 'increment')}
                onDecrement={() => handleUpdate(prayer.id as any, 'decrement')}
                onSetCount={(count) => handleSetCount(prayer.id as any, count)}
                isUpdating={updateMutation.isPending || setCountMutation.isPending || updateRangeMutation.isPending}
              />
            </motion.div>
          ))}
        </div>

        {/* Ranges Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-display flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-primary" />
              {t.ranges}
            </h3>
            <button
              onClick={() => window.location.hash = '#setup'}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              {t.addRange}
            </button>
          </div>

          <div className="space-y-3">
            {store.ranges.map((range, index) => {
              const rangeCompleted = range.fajrCompleted + range.dhuhrCompleted + range.asrCompleted + range.maghribCompleted + range.ishaCompleted;
              const rangeTotal = range.fajrCount + range.dhuhrCount + range.asrCount + range.maghribCount + range.ishaCount;
              const rangePercent = rangeTotal > 0 ? Math.round((rangeCompleted / rangeTotal) * 100) : 0;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card border border-border/50 rounded-2xl p-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        #{index + 1}
                      </span>
                      <span className="text-sm font-medium text-foreground truncate">
                        {range.missedStartDate} → {range.missedEndDate}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${rangePercent}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                        {rangeCompleted.toLocaleString()} / {rangeTotal.toLocaleString()} ({rangePercent}%)
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleEditRange(index)}
                      className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors touch-manipulation"
                      title={t.editRange}
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteRange(index)}
                      className="p-2.5 rounded-xl bg-muted/50 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors touch-manipulation"
                      title={t.deleteRange}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </main>

      {/* Edit Range Dialog */}
      <Dialog open={editRangeIndex !== null} onOpenChange={(open) => !open && setEditRangeIndex(null)}>
        <DialogContent className="rounded-2xl max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              {t.editRange}
            </DialogTitle>
            <DialogDescription>
              {t.setupDesc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.stopPraying}</label>
              <input
                type="date"
                value={editStartDate}
                onChange={(e) => setEditStartDate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-background border-2 border-border focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t.startPraying}</label>
              <input
                type="date"
                value={editEndDate}
                onChange={(e) => setEditEndDate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-background border-2 border-border focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          {/* Exclude Jomaa Checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="editExcludeJomaa"
              checked={editExcludeJomaa}
              onChange={(e) => setEditExcludeJomaa(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-2 border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
            />
            <div className="flex-1 flex items-start justify-between">
              <label htmlFor="editExcludeJomaa" className="cursor-pointer">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-foreground">{t.excludeJomaa}</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="text-muted-foreground hover:text-primary transition-colors">
                        <Info className="w-4 h-4" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" className="max-w-xs text-center border-border bg-white dark:bg-zinc-950 opacity-100 shadow-2xl z-[70] p-3">
                      <p className="text-sm font-medium">{t.excludeJomaaTooltip}</p>
                    </PopoverContent>
                  </Popover>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t.excludeJomaaHint}</p>
              </label>
              {editExcludeJomaa && editStartDate && editEndDate && !isNaN(Date.parse(editStartDate)) && !isNaN(Date.parse(editEndDate)) && countFridays(editStartDate, editEndDate) > 0 && (
                <span className="shrink-0 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {countFridays(editStartDate, editEndDate)} {language === 'ar' ? 'جمعة' : countFridays(editStartDate, editEndDate) === 1 ? 'Friday' : 'Fridays'}
                </span>
              )}
            </div>
          </div>

          <DialogFooter>
            <button
              onClick={() => setEditRangeIndex(null)}
              className="w-full sm:w-auto px-6 py-2 rounded-xl border border-border font-medium hover:bg-accent transition-all"
            >
              {t.cancel}
            </button>
            <button
              onClick={confirmEditRange}
              disabled={!editStartDate || !editEndDate || new Date(editStartDate) >= new Date(editEndDate)}
              className="w-full sm:w-auto px-6 py-2 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all disabled:opacity-50"
            >
              {t.save}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Range Confirmation */}
      <AlertDialog open={deleteRangeIndex !== null} onOpenChange={(open) => !open && setDeleteRangeIndex(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="w-5 h-5 text-destructive" />
              {t.deleteRange}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteRangeDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto rounded-xl">
              {t.cancel}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteRange}
              className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 rounded-xl"
            >
              {t.deleteRange}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Confirmation */}
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
