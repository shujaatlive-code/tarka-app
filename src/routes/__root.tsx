import React, { useState, useEffect } from 'react';
import { Outlet, Link } from '@tanstack/react-router';
import { TarkaDB } from '../services/db';

// Main bilingual dictionaries
const menuTranslations: Record<string, Record<string, string>> = {
  en: {
    logo: "ت",
    title: "Tarka",
    sub: "تڑکا",
    navFeed: "🍲 Dastarkhwan Feed",
    navMatcher: "🎯 Tarka Matcher",
    navDegchi: "🍳 Degchi OCR",
    level: "Level",
    xp: "XP"
  },
  ur: {
    logo: "ت",
    title: "تڑکا",
    sub: "Tarka",
    navFeed: "دسترخوان فیڈ 🍲",
    navMatcher: "تڑکا میچر 🎯",
    navDegchi: "دیگچی او سی آر 🍳",
    level: "لیول",
    xp: "ایکس پی"
  }
};

export default function RootLayout() {
  const [lang, setLang] = useState<string>(localStorage.getItem('tarka_lang') || 'en');
  const [market, setMarket] = useState<string>(localStorage.getItem('tarka_market') || 'PK');
  const [profile, setProfile] = useState(TarkaDB.getProfile());

  useEffect(() => {
    // Apply lang direction details to document HTML
    const dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
    localStorage.setItem('tarka_lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('tarka_market', market);
    // Reload state if market changes
    window.dispatchEvent(new Event('marketChange'));
  }, [market]);

  // Sync profile details
  useEffect(() => {
    const handleStorage = () => {
      setProfile(TarkaDB.getProfile());
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('profileChange', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('profileChange', handleStorage);
    };
  }, []);

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'ur' : 'en');
  };

  const handleMarketChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMarket(e.target.value);
  };

  const dict = menuTranslations[lang] || menuTranslations.en;

  return (
    <div className={`min-h-screen text-[oklch(var(--text-main))] ${lang === 'ur' ? 'font-urdu-nastaliq' : 'font-sans'}`}>
      {/* Premium Header Shell */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-[oklch(var(--border))] glassmorphism">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 font-extrabold text-white rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 tarka-glow">
            {dict.logo}
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-400">{dict.title}</h1>
            <span className="text-xs text-[oklch(var(--secondary))] tracking-wider mt-[-2px]">{dict.sub}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* User profile badges */}
          <div className="flex items-center gap-3 px-3 py-1.5 rounded-full border border-[oklch(var(--border))] bg-white/5 cursor-pointer hover:bg-white/10 transition-all">
            <div className="flex items-center justify-center w-7 h-7 text-xs font-bold text-white rounded-full bg-gradient-to-br from-orange-500 to-amber-500">
              {profile.avatar}
            </div>
            <div className="flex flex-col text-[10px]">
              <span className="font-bold text-white">{dict.level} {profile.level}</span>
              <div className="w-16 h-1.5 bg-white/10 rounded-full mt-0.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500" style={{ width: `${profile.xp}%` }}></div>
              </div>
            </div>
          </div>

          {/* Market selector */}
          <select 
            value={market} 
            onChange={handleMarketChange}
            className="bg-white/5 border border-[oklch(var(--border))] rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-orange-500"
          >
            <option value="PK" className="bg-zinc-900 text-white">🇵🇰 Pakistan</option>
            <option value="UK" className="bg-zinc-900 text-white">🇬🇧 United Kingdom</option>
            <option value="EU" className="bg-zinc-900 text-white">🇪🇺 Europe</option>
          </select>

          {/* Bilingual Toggle */}
          <button 
            onClick={toggleLang}
            className="px-3 py-1 text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300 border border-orange-500/30 rounded-lg hover:border-orange-500 transition-all"
          >
            {lang === 'en' ? 'اردو' : 'English'}
          </button>
        </div>
      </header>

      {/* Tabs navigation */}
      <nav className="flex justify-center border-b border-[oklch(var(--border))] bg-zinc-950/60 sticky top-[73px] z-40">
        <div className="flex gap-4 p-2">
          <Link 
            to="/" 
            activeProps={{ className: 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' }}
            className="px-5 py-2 text-sm font-semibold rounded-xl text-zinc-400 hover:text-white transition-all flex items-center gap-2"
          >
            {dict.navFeed}
          </Link>
          <Link 
            to="/matcher" 
            activeProps={{ className: 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' }}
            className="px-5 py-2 text-sm font-semibold rounded-xl text-zinc-400 hover:text-white transition-all flex items-center gap-2"
          >
            {dict.navMatcher}
          </Link>
          <Link 
            to="/degchi" 
            activeProps={{ className: 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' }}
            className="px-5 py-2 text-sm font-semibold rounded-xl text-zinc-400 hover:text-white transition-all flex items-center gap-2"
          >
            {dict.navDegchi}
          </Link>
        </div>
      </nav>

      {/* Page Content Outlet */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
