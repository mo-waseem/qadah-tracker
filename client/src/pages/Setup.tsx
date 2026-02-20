import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { differenceInDays } from "date-fns";
import { Calendar, ArrowRight, Calculator, Globe, Download, Upload, Settings, Info } from "lucide-react";
import { useSetupQada, useQada, useImportExport } from "@/hooks/use-qada";
import { useLanguageStore } from "@/hooks/use-language";
import { translations } from "@/lib/translations";

const setupSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: "Start date must be before end date",
  path: ["endDate"],
});

type SetupForm = z.infer<typeof setupSchema>;

export default function Setup() {
  const [step, setStep] = useState<1 | 2>(1);
  const { data: currentProgress } = useQada();
  const { mutate: setup, isPending } = useSetupQada();
  const { exportData, importData } = useImportExport();
  const { language, setLanguage } = useLanguageStore();
  const t = translations[language as 'en' | 'ar'];

  const form = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
  });

  useEffect(() => {
    if (currentProgress) {
      form.reset({
        startDate: currentProgress.missedStartDate,
        endDate: currentProgress.missedEndDate,
      });
    }
  }, [currentProgress, form]);

  const onSubmit = (data: SetupForm) => {
    setup({
      missedStartDate: data.startDate,
      missedEndDate: data.endDate,
    });
  };

  const watchStartDate = form.watch("startDate");
  const watchEndDate = form.watch("endDate");

  const estimatedDays = watchStartDate && watchEndDate && !isNaN(Date.parse(watchStartDate)) && !isNaN(Date.parse(watchEndDate))
    ? Math.max(0, differenceInDays(new Date(watchEndDate), new Date(watchStartDate)))
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="absolute top-6 right-6">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
        >
          <Globe className="w-4 h-4" />
          {language === 'en' ? 'العربية' : 'English'}
        </button>
        <button
          onClick={() => window.location.hash = '#info'}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium text-muted-foreground hover:text-foreground"
          title={t.about}
        >
          <Info className="w-4 h-4" />
          {t.about}
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-card rounded-3xl shadow-xl border border-border p-8 md:p-12 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary to-accent" />

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
            <Calculator className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold font-display mb-2">{t.setupTitle}</h1>
          <p className="text-muted-foreground">{t.setupDesc}</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">
                {t.stopPraying}
              </label>
              <div className="relative">
                <Calendar className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-3.5 w-5 h-5 text-muted-foreground`} />
                <input
                  type="date"
                  {...form.register("startDate")}
                  className={`w-full ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all`}
                />
              </div>
              {form.formState.errors.startDate && (
                <p className="text-sm text-destructive ml-1">{form.formState.errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground ml-1">
                {t.startPraying}
              </label>
              <div className="relative">
                <Calendar className={`absolute ${language === 'ar' ? 'right-4' : 'left-4'} top-3.5 w-5 h-5 text-muted-foreground`} />
                <input
                  type="date"
                  {...form.register("endDate")}
                  className={`w-full ${language === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all`}
                />
              </div>
              {form.formState.errors.endDate && (
                <p className="text-sm text-destructive ml-1">{form.formState.errors.endDate.message}</p>
              )}
            </div>
          </div>

          {estimatedDays > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-accent/10 rounded-2xl p-6 border border-accent/20"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-accent-foreground font-medium">{t.estDuration}</span>
                <span className="text-2xl font-bold text-accent-foreground">{estimatedDays} {t.days}</span>
              </div>
              <p className="text-sm text-accent-foreground/80">
                {language === 'en' ? `That's approximately ${(estimatedDays / 365).toFixed(1)} years of missed prayers.` : `هذا يعادل تقريباً ${(estimatedDays / 365).toFixed(1)} سنوات من الصلوات الفائتة.`}
                <br />
                {t.footer}
              </p>
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isPending || estimatedDays <= 0}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {isPending ? t.calculating : t.createPlan}
            {!isPending && <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-border">
          <h2 className="text-xl font-bold font-display mb-6 flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            {t.dataManagement}
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => exportData()}
              className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all font-medium"
            >
              <Download className="w-5 h-5" />
              {t.exportData}
            </button>
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    await importData(file);
                  }
                }}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <button
                className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all font-medium"
              >
                <Upload className="w-5 h-5" />
                {t.importData}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
