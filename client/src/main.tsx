import { createRoot } from "react-dom/client";
import { useEffect } from "react";
import App from "./App";
import "./index.css";
import { useLanguageStore } from "./hooks/use-language";

function Main() {
  const { language } = useLanguageStore();
  
  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  return <App />;
}

createRoot(document.getElementById("root")!).render(<Main />);
