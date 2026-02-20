import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Moon, Sun, CheckCircle2, Globe, Download } from "lucide-react";
import { useLanguageStore } from "@/hooks/use-language";
import { translations } from "@/lib/translations";
import { useEffect, useState } from "react";

export default function Landing() {
  const { language, setLanguage } = useLanguageStore();
  const t = translations[language as 'en' | 'ar'];

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero Section */}
      <header className="w-full px-6 py-8 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
            <Moon className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold font-display tracking-tight">{t.appName}</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-accent transition-colors text-sm font-medium"
          >
            <Globe className="w-4 h-4" />
            {language === 'en' ? 'العربية' : 'English'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

        <div className="max-w-4xl w-full mx-auto text-center z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-sm font-medium mb-6">
              {t.subtitle}
            </span>
            <h1 className="text-5xl md:text-7xl font-bold font-display text-foreground tracking-tight leading-tight">
              {t.heroTitle}
            </h1>
            <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t.heroDesc}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
          >
            <button
              onClick={() => window.location.hash = '#setup'}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg shadow-lg shadow-primary/25 hover:shadow-xl hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center justify-center gap-2"
            >
              {t.startBtn}
              <ArrowRight className={`w-5 h-5 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
            {canInstall && (
              <button
                onClick={handleInstall}
                className="w-full sm:w-auto px-8 py-4 rounded-xl border border-primary/30 text-primary font-semibold text-lg hover:bg-primary/5 hover:translate-y-[-2px] active:translate-y-0 transition-all flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                {t.installApp}
              </button>
            )}
          </motion.div>
        </div>

        {/* Feature Grid */}
        <div className="max-w-7xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 px-4 w-full">
          {[
            {
              icon: <Moon className="w-6 h-6 text-primary" />,
              title: t.smartCalc,
              desc: t.smartCalcDesc
            },
            {
              icon: <CheckCircle2 className="w-6 h-6 text-accent" />,
              title: t.visualProg,
              desc: t.visualProgDesc
            },
            {
              icon: <Sun className="w-6 h-6 text-orange-500" />,
              title: t.dailyMotiv,
              desc: t.dailyMotivDesc
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.4 }}
              className="p-8 rounded-3xl bg-white/50 dark:bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-card/80 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-background shadow-sm flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold font-display mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Jurisprudence Section */}
        <div className="max-w-7xl mx-auto mt-32 px-4 w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">{t.rulingTitle}</h2>
            <p className="text-muted-foreground">{t.rulingScholars}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/10"
            >
              <h4 className="text-lg font-bold mb-3 text-emerald-600 dark:text-emerald-400">{t.malikiHanbali}</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{t.malikiHanbaliDesc}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/10"
            >
              <h4 className="text-lg font-bold mb-3 text-indigo-600 dark:text-indigo-400">{t.shafii}</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{t.shafiiDesc}</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/10"
            >
              <h4 className="text-lg font-bold mb-3 text-amber-600 dark:text-amber-400">{t.hanafi}</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{t.hanafiDesc}</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="mt-12 p-8 rounded-3xl bg-primary text-primary-foreground shadow-xl shadow-primary/20 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6" />
              {t.practicalGuidance}
            </h4>
            <p className="text-lg leading-relaxed opacity-90 max-w-3xl">
              {t.guidanceDesc}
            </p>
          </motion.div>
        </div>
      </main>

      <footer className="py-8 text-center text-sm text-muted-foreground border-t border-border/40 mt-20">
        <p>&copy; {new Date().getFullYear()} {t.appName}. {t.footer}</p>
      </footer>
    </div >
  );
}
