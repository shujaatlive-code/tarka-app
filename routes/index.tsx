import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { TarkaDB, Recipe, getVerificationWeight, seedShorts, seedChefs } from '../services/db';

const textTranslations: Record<string, Record<string, string>> = {
  en: {
    shortsTitle: "Tarka Shorts 📹",
    shortsDesc: "Watch viral short recipes. Tap to see tips & ingredients.",
    switchTitle: "Recipe Repository",
    switchSubtitle: "Browse community posts or access your private digitized vault.",
    btnPublic: "🌐 Public Pool",
    btnPrivate: "🔑 Private Vault",
    dashTitle: "Smart Filter Dashboard",
    dashDesc: "Collapse duplicates. Filter by relative budget and regional seasonal occasions.",
    lblOccasion: "Occasion:",
    lblCost: "Budget Tier:",
    allOccasions: "All Occasions",
    quickMeals: "Quick Meals",
    allBudgets: "All Budgets",
    cuisineLabel: "Browse by Cuisine",
    trendingLabel: "Trending Recipes ⚡",
    directoryLabel: "Recipe Directory 🌐",
    directoryDesc: "Sorted by Verification Weight.",
    leaderLabel: "Chef Leaderboard 🏆",
    leaderDesc: "Ranked by verified Cooked It counts.",
    level: "Level",
    xp: "XP",
    cooked: "cooked",
    weight: "weight",
    alternativeText: "alternative version",
    alternativesText: "alternative versions"
  },
  ur: {
    shortsTitle: "تڑکا شارٹس 📹",
    shortsDesc: "کمیونٹی کے باورچیوں کی وائرل ویڈیوز دیکھیں۔",
    switchTitle: "ترکیبوں کا خزانہ",
    switchSubtitle: "کمیونٹی پوسٹس براؤز کریں یا اپنے نجی والٹ تک رسائی حاصل کریں۔",
    btnPublic: "🌐 پبلک پول",
    btnPrivate: "🔑 ذاتی والٹ",
    dashTitle: "اسمارٹ فلٹر ڈیش بورڈ",
    dashDesc: "شور کو ختم کریں۔ بجٹ اور علاقائی موسمی مواقع کے مطابق ترتیب دیں۔",
    lblOccasion: "تہوار / موقع:",
    lblCost: "بجٹ کی درجہ بندی:",
    allOccasions: "تمام مواقع",
    quickMeals: "تیار کھانا",
    allBudgets: "تمام بجٹ",
    cuisineLabel: "پکوان کے لحاظ سے براؤز کریں",
    trendingLabel: "مقبول ترین ترکیبیں ⚡",
    directoryLabel: "ترکیبوں کی ڈائریکٹری 🌐",
    directoryDesc: "تصدیقی وزن کے لحاظ سے ترتیب دیا گیا ہے۔",
    leaderLabel: "درجہ بندی 🏆",
    leaderDesc: "کامیابی سے پکانے کی تعداد پر مبنی۔",
    level: "لیول",
    xp: "ایکس پی",
    cooked: "مرتبہ پکایا",
    weight: "وزن",
    alternativeText: "متبادل نسخہ",
    alternativesText: "متبادل نسخے"
  }
};

export default function FeedView() {
  const [lang, setLang] = useState<string>(localStorage.getItem('tarka_lang') || 'en');
  const [market, setMarket] = useState<string>(localStorage.getItem('tarka_market') || 'PK');
  const [viewMode, setViewMode] = useState<'public' | 'private'>('public');

  // Filters
  const [occasion, setOccasion] = useState<string>('ALL');
  const [budget, setBudget] = useState<string>('ALL');
  const activeCuisine = 'ALL';

  const recipes = TarkaDB.getRecipes();
  const vaultIds = TarkaDB.getVaultIds();

  useEffect(() => {
    // Listen to market changes or language toggles from header shell
    const handleMarket = () => setMarket(localStorage.getItem('tarka_market') || 'PK');
    const handleLang = () => setLang(localStorage.getItem('tarka_lang') || 'en');

    window.addEventListener('marketChange', handleMarket);
    window.addEventListener('langChange', handleLang);
    return () => {
      window.removeEventListener('marketChange', handleMarket);
      window.removeEventListener('langChange', handleLang);
    };
  }, []);

  const profile = TarkaDB.getProfile();
  const dict = textTranslations[lang] || textTranslations.en;

  // Gather filter combinations
  let filtered = recipes.filter(r => r.markets.includes(market as any));
  if (viewMode === 'private') {
    filtered = filtered.filter(r => vaultIds.includes(r.id));
  } else {
    // Collapse duplicates under parent cards
    filtered = filtered.filter(r => r.isParentRecipe !== false);
  }

  if (occasion !== 'ALL') {
    filtered = filtered.filter(r => r.occasions && r.occasions.includes(occasion));
  }
  if (budget !== 'ALL') {
    filtered = filtered.filter(r => r.costTier === budget);
  }
  if (activeCuisine !== 'ALL') {
    filtered = filtered.filter(r => r.cuisineEn === activeCuisine || r.cuisineUr === activeCuisine);
  }

  // Rank by Weight
  const weightedRecipes = filtered.map(r => ({
    ...r,
    weight: getVerificationWeight(r)
  })).sort((a, b) => b.weight - a.weight);

  const trendingList = weightedRecipes.filter(r => r.isTrending);

  return (
    <div className="flex flex-col gap-8">
      
      {/* 1. Header Profile Banner */}
      <div className="flex justify-between items-center bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl glassmorphism">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-500 rounded-full flex items-center justify-center font-bold text-white text-xl border-2 border-orange-500/30">
            {profile.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-lg">{profile.name}</h3>
              <span className="text-[10px] bg-orange-500/10 border border-orange-500/30 text-orange-400 font-bold px-2 py-0.5 rounded-full">
                {lang === 'ur' ? (profile.badge === 'Rising Star' ? 'رائزنگ اسٹار' : 'صوفی شیف') : profile.badge}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1">Digitizing your family recipes since day one.</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 min-w-[200px]">
          <div className="flex justify-between w-full text-xs font-semibold">
            <span className="text-white">{profile.xp} / 100 {dict.xp}</span>
            <span className="text-orange-400">{dict.level} {profile.level}</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500" style={{ width: `${profile.xp}%` }}></div>
          </div>
        </div>
      </div>

      {/* 2. Video Reels Section */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white">{dict.shortsTitle}</h2>
          <p className="text-xs text-zinc-500 mt-1">{dict.shortsDesc}</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {seedShorts.filter(s => s.market === market).map(s => {
            const title = lang === 'ur' ? s.titleUr : s.titleEn;
            const featured = lang === 'ur' ? s.featuredDishUr : s.featuredDishEn;
            return (
              <div key={s.id} className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden hover:border-orange-500/30 transition-all flex flex-col">
                <div className="aspect-[9/16] bg-zinc-950 flex items-center justify-center relative">
                  <iframe 
                    src={s.socialLink} 
                    title={title}
                    className="w-full h-full border-0 absolute top-0 left-0"
                    allowFullScreen
                  ></iframe>
                </div>
                <div className="p-3 flex flex-col gap-2 mt-auto">
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold">
                    <span className="w-4 h-4 bg-orange-500 text-white rounded-full flex items-center justify-center text-[8px]">{s.creatorAvatar}</span>
                    {s.creatorHandle}
                  </div>
                  <p className="text-[11px] font-bold text-white leading-snug">{title}</p>
                  <Link to="/recipes/$recipeId" params={{ recipeId: s.recipeId }} className="text-[10px] text-orange-400 font-bold hover:underline">
                    🍲 {featured}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Vault vs Public switches */}
      <div className="flex justify-between items-center border-b border-zinc-800 pb-4 flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">{dict.switchTitle}</h3>
          <p className="text-xs text-zinc-500">{dict.switchSubtitle}</p>
        </div>
        <div className="flex bg-zinc-900 border border-zinc-800 p-1 rounded-full">
          <button 
            onClick={() => setViewMode('public')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === 'public' ? 'bg-orange-500 text-white' : 'text-zinc-400'}`}
          >
            {dict.btnPublic}
          </button>
          <button 
            onClick={() => setViewMode('private')}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${viewMode === 'private' ? 'bg-orange-500 text-white' : 'text-zinc-400'}`}
          >
            {dict.btnPrivate} ({vaultIds.length})
          </button>
        </div>
      </div>

      {/* 4. Smart Filters */}
      <div className="bg-zinc-900/30 border border-zinc-800/80 p-5 rounded-2xl flex flex-col gap-4">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <div>
            <h4 className="font-extrabold text-white text-sm flex items-center gap-1.5">🛡️ {dict.dashTitle}</h4>
            <p className="text-xs text-zinc-500 mt-0.5">{dict.dashDesc}</p>
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-bold">{dict.lblOccasion}</label>
              <select 
                value={occasion} 
                onChange={e => setOccasion(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-2.5 py-1 text-white focus:outline-none"
              >
                <option value="ALL">{dict.allOccasions}</option>
                <option value="Eid-ul-Fitr">🌙 Eid-ul-Fitr</option>
                <option value="Eid-ul-Adha">🥩 Eid-ul-Adha</option>
                <option value="Ramadan">🕌 Ramadan</option>
                <option value="Wedding Season">🎻 Wedding Season</option>
                <option value="Monsoon Comforts">🌧️ Monsoon Comforts</option>
                <option value="Quick">{dict.quickMeals}</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-zinc-500 font-bold">{dict.lblCost}</label>
              <select 
                value={budget} 
                onChange={e => setBudget(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 text-xs rounded-lg px-2.5 py-1 text-white focus:outline-none"
              >
                <option value="ALL">{dict.allBudgets}</option>
                <option value="$">🪙 Budget Friendly ($)</option>
                <option value="$$">🪙 Mid-Range ($$)</option>
                <option value="$$$">🪙 Premium/Feast ($$$)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Trending Section */}
      {viewMode === 'public' && trendingList.length > 0 && (
        <div className="flex flex-col gap-4">
          <h3 className="font-bold text-white">{dict.trendingLabel}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trendingList.slice(0, 3).map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} lang={lang} dict={dict} />
            ))}
          </div>
        </div>
      )}

      {/* 6. Directory and Leaderboard split */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        {/* Pool feed */}
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="text-lg font-bold text-white">{dict.directoryLabel}</h3>
            <p className="text-xs text-zinc-500">{dict.directoryDesc}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {weightedRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} lang={lang} dict={dict} />
            ))}
          </div>
        </div>

        {/* Leaderboard sidebar */}
        <aside className="bg-zinc-900/20 border border-zinc-800/80 p-5 rounded-2xl flex flex-col gap-4 self-start">
          <div>
            <h4 className="font-extrabold text-white text-sm">{dict.leaderLabel}</h4>
            <p className="text-[10px] text-zinc-500 mt-0.5">{dict.leaderDesc}</p>
          </div>
          <div className="flex flex-col gap-3">
            {seedChefs.map((chef: any, idx: number) => {
              const rank = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx+1}`;
              return (
                <div key={chef.name} className="flex justify-between items-center p-2.5 rounded-xl border border-zinc-800/50 bg-white/[0.01] hover:bg-white/[0.04] transition-all cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-extrabold">{rank}</span>
                    <span className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">{chef.avatar}</span>
                    <div>
                      <div className="text-xs font-bold text-white">{chef.name}</div>
                      <span className="text-[9px] text-orange-400 font-semibold">{lang === 'ur' ? chef.badgeUr : chef.badgeEn}</span>
                    </div>
                  </div>
                  <div className="text-right text-[10px]">
                    <div className="font-extrabold text-white">{chef.xp} {dict.xp}</div>
                    <span className="text-zinc-500">{chef.cookedCount} {dict.cooked}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

    </div>
  );
}

// Sub Component RecipeCard
function RecipeCard({ recipe, lang, dict }: { recipe: Recipe; lang: string; dict: any }) {
  const title = lang === 'ur' ? recipe.titleUr : recipe.titleEn;
  const desc = lang === 'ur' ? recipe.descriptionUr : recipe.descriptionEn;
  const weight = getVerificationWeight(recipe);
  const diff = lang === 'ur' ? recipe.difficultyUr : recipe.difficultyEn;
  
  const hasAlts = recipe.duplicatesGroup && recipe.duplicatesGroup.length > 0;
  const altText = hasAlts
    ? `${recipe.duplicatesGroup?.length} ${recipe.duplicatesGroup?.length === 1 ? dict.alternativeText : dict.alternativesText}`
    : '';

  return (
    <Link to="/recipes/$recipeId" params={{ recipeId: recipe.id }} className="bg-zinc-900/40 border border-zinc-800/80 hover:border-orange-500/30 rounded-2xl overflow-hidden flex flex-col transition-all cursor-pointer">
      <div className="h-44 w-full bg-zinc-950 relative">
        <img 
          src={recipe.image || 'mediterranean_hummus.png'} 
          alt={title} 
          className="w-full h-full object-cover"
        />
        <span className="absolute top-3 right-3 text-[9px] bg-black/60 border border-white/10 font-bold px-2 py-0.5 rounded-full text-white">{recipe.markets.join(', ')}</span>
      </div>
      <div className="p-4 flex flex-col flex-1 gap-3">
        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
          <span>{diff}</span>
          <span className="text-orange-400">{recipe.costTier}</span>
        </div>
        <h4 className="font-bold text-white text-base leading-snug">{title}</h4>
        <p className="text-xs text-zinc-400 line-clamp-2">{desc}</p>
        
        <div className="flex gap-3 text-[10px] text-zinc-500 font-bold mt-auto pt-2 border-t border-zinc-800/50">
          <span>🔥 {weight} {dict.weight}</span>
          <span>👍 {recipe.upvotes}</span>
          <span>✓ {recipe.cookedSafely} {dict.cooked}</span>
        </div>

        <div className="flex justify-between items-center text-[9px] text-zinc-500 font-semibold mt-1">
          <span>by {recipe.authorName}</span>
          {hasAlts && <span className="text-orange-500 font-bold">{altText}</span>}
        </div>
      </div>
    </Link>
  );
}
