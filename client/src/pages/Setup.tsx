import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { Calendar, ArrowRight, Calculator, Globe, Info } from "lucide-react";
import { useSetupQada, useQada, countFridays, calculatePeriodDays } from "@/hooks/use-qada";
import { useLanguageStore } from "@/hooks/use-language";
import { translations } from "@/lib/translations";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const setupSchema = z.object({
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid date"),
  excludeJomaa: z.boolean().default(false),
  excludePeriod: z.boolean().default(false),
  periodDays: z.number().min(1).max(15).optional().default(7),
}).refine((data) => new Date(data.startDate) < new Date(data.endDate), {
  message: "Start date must be before end date",
  path: ["endDate"],
});

type SetupForm = z.infer<typeof setupSchema>;

export default function Setup() {
  const { data: store } = useQada();
  const { mutate: setup, isPending } = useSetupQada();
  const { language, setLanguage } = useLanguageStore();
  const t = translations[language as 'en' | 'ar'];

  const hasExistingRanges = store && store.ranges.length > 0;

  const form = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
  });

  const onSubmit = (data: SetupForm) => {
    setup({
      missedStartDate: data.startDate,
      missedEndDate: data.endDate,
      excludeJomaa: data.excludeJomaa,
      excludePeriod: data.excludePeriod,
      periodDays: data.excludePeriod ? data.periodDays : undefined,
    });
  };

  const watchStartDate = form.watch("startDate");
  const watchEndDate = form.watch("endDate");
  const watchExcludeJomaa = form.watch("excludeJomaa");
  const watchExcludePeriod = form.watch("excludePeriod");
  const watchPeriodDays = form.watch("periodDays");

  const estimatedDays = watchStartDate && watchEndDate && !isNaN(Date.parse(watchStartDate)) && !isNaN(Date.parse(watchEndDate))
    ? Math.max(0, differenceInCalendarDays(parseISO(watchEndDate), parseISO(watchStartDate)) + 1)
    : 0;

  const fridayCount = (watchExcludeJomaa && watchStartDate && watchEndDate && !isNaN(Date.parse(watchStartDate)) && !isNaN(Date.parse(watchEndDate)))
    ? countFridays(watchStartDate, watchEndDate)
    : 0;

  const periodDaysCount = (watchExcludePeriod && watchPeriodDays && watchStartDate && watchEndDate && !isNaN(Date.parse(watchStartDate)) && !isNaN(Date.parse(watchEndDate)))
    ? calculatePeriodDays(watchStartDate, watchEndDate, watchPeriodDays)
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="absolute top-6 right-6 flex items-center gap-2">
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
          <h1 className="text-3xl font-bold font-display mb-2">
            {hasExistingRanges ? t.addRange : t.setupTitle}
          </h1>
          <p className="text-muted-foreground">
            {hasExistingRanges ? t.addRangeDesc : t.setupDesc}
          </p>
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

          {/* Exclude Jomaa Checkbox */}
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="excludeJomaa"
              {...form.register("excludeJomaa")}
              className="mt-1 w-5 h-5 rounded border-2 border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
            />
            <div className="flex-1 flex items-start justify-between">
              <label htmlFor="excludeJomaa" className="cursor-pointer">
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
              {watchExcludeJomaa && fridayCount > 0 && (
                <span className="shrink-0 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                  {fridayCount} {language === 'ar' ? 'جمعة' : fridayCount === 1 ? 'Friday' : 'Fridays'}
                </span>
              )}
            </div>
          </div>

          {/* Exclude Period Checkbox */}
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="excludePeriod"
                {...form.register("excludePeriod")}
                className="mt-1 w-5 h-5 rounded border-2 border-border text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
              <div className="flex-1 flex items-start justify-between">
                <label htmlFor="excludePeriod" className="cursor-pointer">
                  <span className="text-sm font-medium text-foreground">{t.excludePeriod}</span>
                  <p className="text-xs text-muted-foreground mt-0.5">{t.excludePeriodHint}</p>
                </label>
                {watchExcludePeriod && periodDaysCount > 0 && (
                  <span className="shrink-0 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {periodDaysCount} {language === 'ar' ? 'يوم' : periodDaysCount === 1 ? 'Day' : 'Days'}
                  </span>
                )}
              </div>
            </div>

            {/* Period Days Input */}
            <AnimatePresence>
              {watchExcludePeriod && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden pl-8"
                >
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {t.periodDaysPerMonth}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    {...form.register("periodDays", { valueAsNumber: true })}
                    className="w-full max-w-[120px] px-4 py-2 rounded-xl bg-background border-2 border-border focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
                  />
                  {form.formState.errors.periodDays && (
                    <p className="text-sm text-destructive mt-1">{form.formState.errors.periodDays.message}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
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

          <div className="flex gap-3">
            {hasExistingRanges && (
              <button
                type="button"
                onClick={() => window.location.hash = ''}
                className="px-6 py-4 rounded-xl border border-border text-muted-foreground font-bold text-lg hover:bg-accent/50 transition-all"
              >
                {t.cancel}
              </button>
            )}
            <button
              type="submit"
              disabled={isPending || estimatedDays <= 0}
              className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground font-bold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isPending ? t.calculating : (hasExistingRanges ? t.addRange : t.createPlan)}
              {!isPending && <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />}
            </button>
          </div>
        </form>
      </motion.div>
    </div >
  );
}
