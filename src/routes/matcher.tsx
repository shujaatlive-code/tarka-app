import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { TarkaDB, getVerificationWeight } from '../services/db';

const matcherTranslations: Record<string, Record<string, string>> = {
  en: {
    title: "Tarka Cabinet Matcher 🎯",
    desc: "Select what's in your fridge. We'll suggest recipes ranked by matching score.",
    cabinet: "Pantry Cabinet 🥩",
    cabinetDesc: "Tick items you have in stock:",
    regionLabel: "Regional Taste:",
    resultsCount: "matching recipes",
    allRegions: "All Regions",
    weight: "weight",
    matchLabel: "match",
    missingLabel: "Missing items:",
    by: "by"
  },
  ur: {
    title: "تڑکا کیبنٹ میچر 🎯",
    desc: "وہ اجزاء منتخب کریں جو آپ کے فریج میں ہیں۔ ہم ملاپ کے اسکور کے مطابق ترکیبیں تجویز کریں گے۔",
    cabinet: "باورچی خانہ کیبنٹ 🥩",
    cabinetDesc: "ان اشیاء کو منتخب کریں جو آپ کے پاس موجود ہیں:",
    regionLabel: "علاقائی ذائقہ:",
    resultsCount: "ترکیبیں ملیں",
    allRegions: "تمام علاقے",
    weight: "وزن",
    matchLabel: "ملاپ",
    missingLabel: "باقی اجزاء:",
    by: "بذریعہ"
  }
};

const ingredientGroups: Record<string, Record<string, string[]>> = {
  PK: {
    Proteins: ["Chicken", "Beef Shank", "Mutton", "Chickpeas", "Lentils"],
    Vegetables: ["Tomatoes", "Onions", "Potatoes", "Ginger", "Garlic", "Lemon"],
    Spices: ["Biryani Masala", "Nihari Masala", "Chaat Masala", "Black Pepper", "Cumin Seeds", "Salt"],
    Grains: ["Basmati Rice", "Wheat Flour", "Semolina", "Yogurt", "Oil"]
  },
  UK: {
    Proteins: ["Cod Fish", "Chicken", "Beef Shank", "Feta Cheese", "Chickpeas"],
    Vegetables: ["Potatoes", "Green Peas", "Lemon", "Tomatoes", "Onions", "Cucumbers"],
    Spices: ["Black Pepper", "Salt", "Vinegar", "Cumin Seeds", "Oregano"],
    Grains: ["Flour", "Yeast", "Basmati Rice", "Oil", "Yogurt"]
  },
  EU: {
    Proteins: ["Eggs", "Feta Cheese", "Chickpeas", "Chicken", "Mozzarella Cheese"],
    Vegetables: ["Tomatoes", "Cucumbers", "Green Chilies", "Onions", "Garlic", "Olives", "Basil Leaves"],
    Spices: ["Salt", "Black Pepper", "Cumin Seeds", "Paprika", "Oregano"],
    Grains: ["Yeast", "Flour", "Tahini Paste", "Oil", "Water"]
  }
};

export default function MatcherRouteComponent() {
  const [lang, setLang] = useState<string>(localStorage.getItem('tarka_lang') || 'en');
  const [market, setMarket] = useState<string>(localStorage.getItem('tarka_market') || 'PK');
  const [pantry, setPantry] = useState<string[]>(TarkaDB.getPantry());
  const [regionFilter, setRegionFilter] = useState<string>('ALL');

  useEffect(() => {
    const handleMarket = () => setMarket(localStorage.getItem('tarka_market') || 'PK');
    const handleLang = () => setLang(localStorage.getItem('tarka_lang') || 'en');
    window.addEventListener('marketChange', handleMarket);
    window.addEventListener('storage', handleLang);
    return () => {
      window.removeEventListener('marketChange', handleMarket);
      window.removeEventListener('storage', handleLang);
    };
  }, []);

  const dict = matcherTranslations[lang] || matcherTranslations.en;
  const activeGroup = ingredientGroups[market] || ingredientGroups.PK;
  const recipes = TarkaDB.getRecipes();

  // Handle checking items
  const handleCheck = (ingredient: string, isChecked: boolean) => {
    let nextPantry = [...pantry];
    if (isChecked) {
      if (!nextPantry.includes(ingredient)) nextPantry.push(ingredient);
    } else {
      nextPantry = nextPantry.filter(x => x !== ingredient);
    }
    setPantry(nextPantry);
    TarkaDB.savePantry(nextPantry);
  };

  // Compile unique regions
  const regionsSet = new Set<string>();
  recipes.filter(r => r.markets.includes(market as any)).forEach(r => {
    regionsSet.add(lang === 'ur' ? r.regionUr : r.regionEn);
  });
  const regionsList = Array.from(regionsSet);

  // Compute matched overlaps
  let filteredRecipes = recipes.filter(r => r.markets.includes(market as any));
  if (regionFilter !== 'ALL') {
    filteredRecipes = filteredRecipes.filter(r => (lang === 'ur' ? r.regionUr : r.regionEn) === regionFilter);
  }

  const matches = filteredRecipes.map(recipe => {
    const listIng = recipe.ingredientsEn || [];
    const matched = listIng.filter(ing => pantry.some(p => p.toLowerCase() === ing.toLowerCase()));
    const missing = listIng.filter(ing => !pantry.some(p => p.toLowerCase() === ing.toLowerCase()));
    const coverage = listIng.length > 0 ? Number(((matched.length / listIng.length) * 100).toFixed(0)) : 0;
    
    return {
      recipe,
      coverage,
      matchedCount: matched.length,
      missing,
      weight: getVerificationWeight(recipe)
    };
  }).sort((a, b) => b.coverage - a.coverage || b.weight - a.weight);

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-zinc-800 pb-4">
        <h2 className="text-xl font-extrabold text-white">{dict.title}</h2>
        <p className="text-xs text-zinc-500 mt-1">{dict.desc}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
        {/* Left: Cabinet checkboxes */}
        <aside className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-2xl glassmorphism flex flex-col gap-5">
          <h3 className="font-extrabold text-white border-b border-zinc-800 pb-2">{dict.cabinet}</h3>
          <p className="text-[10px] text-zinc-500 mt-[-10px]">{dict.cabinetDesc}</p>
          
          <div className="flex flex-col gap-5">
            {Object.keys(activeGroup).map(groupName => (
              <div key={groupName} className="flex flex-col gap-2">
                <h4 className="text-xs font-extrabold text-orange-400 uppercase tracking-wider">{groupName}</h4>
                <div className="flex flex-col gap-1.5">
                  {activeGroup[groupName].map(ing => {
                    const isChecked = pantry.includes(ing);
                    return (
                      <label key={ing} className="flex items-center gap-2 text-xs font-semibold text-zinc-300 cursor-pointer hover:text-white">
                        <input 
                          type="checkbox" 
                          checked={isChecked}
                          onChange={e => handleCheck(ing, e.target.checked)}
                          className="rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-0 w-3.5 h-3.5"
                        />
                        <span>{ing}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right: Results List */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center bg-zinc-900/10 border border-zinc-800 p-3.5 rounded-xl">
            <span className="text-xs font-bold text-white">{matches.length} {dict.resultsCount}</span>
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-zinc-500 font-bold">{dict.regionLabel}</label>
              <select 
                value={regionFilter}
                onChange={e => setRegionFilter(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-2 py-1 text-white focus:outline-none"
              >
                <option value="ALL">{dict.allRegions}</option>
                {regionsList.map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map(m => {
              const r = m.recipe;
              const title = lang === 'ur' ? r.titleUr : r.titleEn;
              const desc = lang === 'ur' ? r.descriptionUr : r.descriptionEn;
              return (
                <Link 
                  to={`/recipes/${r.id}`} 
                  key={r.id}
                  className="bg-zinc-900/40 border border-zinc-800/80 hover:border-orange-500/30 rounded-2xl overflow-hidden flex flex-col transition-all cursor-pointer"
                >
                  <div className="h-40 w-full bg-zinc-950 relative">
                    <img src={r.image || 'mediterranean_hummus.png'} alt={title} className="w-full h-full object-cover" />
                    <span className="absolute top-3 right-3 text-[10px] bg-orange-500 font-extrabold px-2 py-0.5 rounded-full text-white">
                      {m.coverage}% {dict.matchLabel}
                    </span>
                  </div>
                  <div className="p-4 flex flex-col flex-1 gap-3">
                    <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
                      <span className="text-orange-400">{dict.missingLabel} {m.missing.length}</span>
                      <span>{r.costTier}</span>
                    </div>
                    <h4 className="font-bold text-white text-base leading-snug">{title}</h4>
                    <p className="text-xs text-zinc-400 line-clamp-2">{desc}</p>
                    
                    <div className="flex gap-3 text-[10px] text-zinc-500 font-bold mt-auto pt-2 border-t border-zinc-800/50">
                      <span>🔥 {m.weight} {dict.weight}</span>
                      <span>👍 {r.upvotes}</span>
                    </div>
                    <div className="text-[9px] text-zinc-500 font-semibold">{dict.by} {r.authorName}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
