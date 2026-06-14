import { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { TarkaDB, Recipe, getVerificationWeight, seedShorts, seedChefs } from '../services/db';

const textTranslations: Record<string, Record<string, string>> = {
  en: {
    bannerTitle: "YOUR CULINARY COMMONS",
    bannerDesc: "Trusted recipes, family secrets and regional wisdom — distilled into one calm place.",
    shortsTitle: "TARKA SHORTS",
    shortsDesc: "60 seconds to something delicious",
    switchTitle: "Filter the noise",
    switchSubtitle: "Recipes for you",
    leaderLabel: "LEADERBOARD",
    leaderDesc: "Top dastarkhwan keepers",
    level: "Level",
    xp: "XP",
    alternativeText: "alternative version",
    alternativesText: "alternative versions"
  },
  ur: {
    bannerTitle: "آپ کا دسترخوان",
    bannerDesc: "قابل اعتماد ترکیبیں، خاندانی راز اور علاقائی حکمت — ایک پرسکون جگہ پر یکجا۔",
    shortsTitle: "تڑکا شارٹس",
    shortsDesc: "60 سیکنڈ میں کچھ لذیذ تیار کریں",
    switchTitle: "شور کو ختم کریں",
    switchSubtitle: "ترکیبیں آپ کے لیے",
    leaderLabel: "درجہ بندی",
    leaderDesc: "دسترخوان کے سرکردہ محافظ",
    level: "لیول",
    xp: "ایکس پی",
    alternativeText: "متبادل نسخہ",
    alternativesText: "متبادل نسخے"
  }
};

export default function FeedView() {
  const [lang, setLang] = useState<string>(localStorage.getItem('tarka_lang') || 'en');
  const [market, setMarket] = useState<string>(localStorage.getItem('tarka_market') || 'PK');
  const [viewMode, setViewMode] = useState<'public' | 'private'>('public');

  // Interactive filters
  const [occasion, setOccasion] = useState<string>('ALL');
  const [trait, setTrait] = useState<string>('ALL');

  const [recipes, setRecipes] = useState<Recipe[]>(TarkaDB.getRecipes());
  const [vaultIds, setVaultIds] = useState<string[]>(TarkaDB.getVaultIds());
  const [profile, setProfile] = useState(TarkaDB.getProfile());
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const syncCloudData = async () => {
      setLoading(true);
      const cloudRecipes = await TarkaDB.fetchRecipesFromCloud();
      setRecipes(cloudRecipes);
      const cloudVault = await TarkaDB.fetchUserVaultCloud();
      setVaultIds(cloudVault);
      const cloudProfile = await TarkaDB.fetchUserProfileCloud();
      setProfile(cloudProfile);
      setLoading(false);
    };

    syncCloudData();

    const handleProfileChange = () => {
      setProfile(TarkaDB.getProfile());
    };

    window.addEventListener('authReady', syncCloudData);
    window.addEventListener('profileChange', handleProfileChange);
    return () => {
      window.removeEventListener('authReady', syncCloudData);
      window.removeEventListener('profileChange', handleProfileChange);
    };
  }, []);

  useEffect(() => {
    const handleMarket = () => setMarket(localStorage.getItem('tarka_market') || 'PK');
    const handleLang = () => setLang(localStorage.getItem('tarka_lang') || 'en');

    window.addEventListener('marketChange', handleMarket);
    window.addEventListener('langChange', handleLang);
    return () => {
      window.removeEventListener('marketChange', handleMarket);
      window.removeEventListener('langChange', handleLang);
    };
  }, []);

  const dict = textTranslations[lang] || textTranslations.en;

  // Filter calculations
  let filtered = recipes.filter(r => r.markets.includes(market as any));
  if (viewMode === 'private') {
    filtered = filtered.filter(r => vaultIds.includes(r.id));
  } else {
    filtered = filtered.filter(r => r.isParentRecipe !== false);
  }

  // Row 1: Occasions Filter
  if (occasion !== 'ALL') {
    filtered = filtered.filter(r => r.occasions && r.occasions.includes(occasion));
  }

  // Row 2: Traits Filter
  if (trait !== 'ALL') {
    if (trait === 'Spicy') {
      filtered = filtered.filter(r => 
        r.ingredientsEn.some(i => i.toLowerCase().includes('chili') || i.toLowerCase().includes('pepper') || i.toLowerCase().includes('masala'))
      );
    } else if (trait === 'Mild') {
      filtered = filtered.filter(r => 
        !r.ingredientsEn.some(i => i.toLowerCase().includes('chili') || i.toLowerCase().includes('masala'))
      );
    } else if (trait === 'Vegetarian') {
      filtered = filtered.filter(r => 
        !r.ingredientsEn.some(i => i.toLowerCase().includes('chicken') || i.toLowerCase().includes('mutton') || i.toLowerCase().includes('beef') || i.toLowerCase().includes('meat') || i.toLowerCase().includes('fish'))
      );
    } else if (trait === 'Quick') {
      filtered = filtered.filter(r => {
        const mins = parseInt(r.timeEn);
        return !isNaN(mins) && mins <= 30;
      });
    } else if (trait === 'Budget-friendly') {
      filtered = filtered.filter(r => r.costTier === '$');
    }
  }

  const weightedRecipes = filtered.map(r => ({
    ...r,
    weight: getVerificationWeight(r)
  })).sort((a, b) => b.weight - a.weight);

  const occasions = ['ALL', 'Ramadan', 'Eid-ul-Fitr', 'Wedding Season', 'Monsoon Comforts', 'Quick'];
  const traits = ['ALL', 'Spicy', 'Mild', 'Vegetarian', 'Quick', 'Budget-friendly'];

  return (
    <div className="flex flex-col gap-8">
      
      {/* 1. Header Profile Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-zinc-900/40 border border-orange-500/15 p-8 rounded-3xl gap-6 relative overflow-hidden glassmorphism">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-orange-500/5 blur-3xl rounded-full pointer-events-none"></div>
        
        <div className="flex flex-col gap-2 max-w-xl text-left">
          <div className="text-[10px] font-bold text-orange-500 tracking-widest uppercase">{dict.bannerTitle}</div>
          <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
            {lang === 'ur' ? 'دستارخوان پر کیا سجایا جائے گا؟' : 'What will grace the '}
            {lang !== 'ur' && <span className="bg-gradient-to-r from-orange-400 to-amber-400 text-transparent bg-clip-text">dastarkhwan?</span>}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 max-w-md">{dict.bannerDesc}</p>
        </div>

        {/* Profile Card on the right */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 p-5 rounded-2xl flex flex-col gap-3 min-w-[240px] w-full md:w-auto relative shadow-2xl">
          <div className="flex justify-between items-start gap-4">
            <div className="flex flex-col text-left">
              <span className="text-[10px] text-zinc-500 font-bold">{profile.name} • Level {profile.level}</span>
              <h3 className="text-base font-extrabold text-white mt-0.5">
                {lang === 'ur' ? (profile.badge === 'Rising Star' ? 'رائزنگ اسٹار' : 'صوفی شیف') : profile.badge}
              </h3>
            </div>
            <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400 text-sm font-bold shadow-lg">
              ⭐
            </div>
          </div>
          <div className="flex flex-col gap-1 mt-1">
            <div className="flex justify-between text-[10px] font-bold text-zinc-500">
              <span>{profile.xp} XP</span>
              <span>100</span>
            </div>
            <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500" style={{ width: `${profile.xp}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Video Shorts Section */}
      <div className="flex flex-col gap-3">
        <div className="text-left">
          <div className="text-[10px] uppercase font-bold tracking-wider text-orange-500">{dict.shortsTitle}</div>
          <h2 className="text-lg font-extrabold text-white mt-0.5">{dict.shortsDesc}</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {seedShorts.filter(s => s.market === market).map(s => {
            const title = lang === 'ur' ? s.titleUr : s.titleEn;
            const featured = lang === 'ur' ? s.featuredDishUr : s.featuredDishEn;
            return (
              <Link 
                to="/recipes/$recipeId" 
                params={{ recipeId: s.recipeId }} 
                key={s.id} 
                className="flex items-center gap-3 bg-zinc-900/40 border border-zinc-800/80 hover:border-orange-500/30 px-4 py-2.5 rounded-2xl flex-shrink-0 transition-all cursor-pointer hover:bg-zinc-900/60"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-bold text-white text-xs border border-orange-500/20">
                  {s.creatorAvatar}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-bold text-orange-400">{s.creatorHandle}</span>
                  <span className="text-[11px] text-white font-medium max-w-[150px] truncate">{title}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 3. Filter and Recipe Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 mt-4">
        
        {/* Main Feed Container */}
        <div className="flex flex-col gap-6">
          {/* Smart Filters Container */}
          <div className="flex flex-col gap-4 text-left">
            <div className="flex justify-between items-start md:items-center flex-wrap gap-4 border-b border-zinc-800/60 pb-4">
              <div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-orange-500">{dict.switchTitle}</div>
                <h3 className="text-xl font-extrabold text-white mt-0.5">{dict.switchSubtitle}</h3>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex bg-zinc-950 border border-zinc-800 p-1 rounded-xl">
                <button 
                  onClick={() => setViewMode('public')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'public' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Public pool
                </button>
                <button 
                  onClick={() => setViewMode('private')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'private' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Private vault ({vaultIds.length})
                </button>
              </div>
            </div>

            {/* Occasion Row */}
            <div className="flex flex-wrap gap-2">
              {occasions.map(occ => (
                <button
                  key={occ}
                  onClick={() => setOccasion(occ)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    occasion === occ 
                      ? 'bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-500/10' 
                      : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {occ === 'ALL' ? 'All' : occ}
                </button>
              ))}
            </div>

            {/* Trait Row */}
            <div className="flex flex-wrap gap-2">
              {traits.map(tr => (
                <button
                  key={tr}
                  onClick={() => setTrait(tr)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    trait === tr 
                      ? 'bg-orange-500 text-white border-orange-600 shadow-md shadow-orange-500/10' 
                      : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {tr === 'ALL' ? 'All' : tr}
                </button>
              ))}
            </div>
          </div>

          {/* Grid of Recipe Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
            {weightedRecipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} lang={lang} dict={dict} />
            ))}
          </div>
        </div>

        {/* Right Sidebar Leaderboard */}
        <aside className="bg-zinc-900/20 border border-zinc-800/80 p-5 rounded-2xl flex flex-col gap-4 self-start">
          <div className="text-left">
            <div className="text-[10px] uppercase font-bold tracking-wider text-orange-500">{dict.leaderLabel}</div>
            <h4 className="font-extrabold text-white text-sm mt-0.5">{dict.leaderDesc}</h4>
          </div>
          <div className="flex flex-col gap-3">
            {seedChefs.map((chef: any, idx: number) => {
              const rankColor = idx === 0 ? 'bg-orange-500 text-white font-black' : idx === 1 ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-900 text-zinc-500';
              return (
                <div key={chef.name} className="flex justify-between items-center p-3 rounded-xl border border-zinc-855/50 bg-zinc-950/20 hover:bg-zinc-950/40 transition-all text-left">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${rankColor}`}>
                      {idx + 1}
                    </div>
                    <div className="w-7 h-7 bg-zinc-800 border border-zinc-700 rounded-full flex items-center justify-center text-xs font-bold text-white uppercase">{chef.avatar}</div>
                    <div>
                      <div className="text-xs font-bold text-white">{chef.name}</div>
                      <span className="text-[9px] text-zinc-500 font-semibold">{lang === 'ur' ? chef.badgeUr : chef.badgeEn}</span>
                    </div>
                  </div>
                  <div className="text-right text-[10px] flex flex-col gap-0.5">
                    <div className="font-extrabold text-white">{chef.xp.toLocaleString()} XP</div>
                    <span className="text-emerald-500 font-bold">✓ {chef.cookedCount} cooks</span>
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
  
  const hasAlts = recipe.duplicatesGroup && recipe.duplicatesGroup.length > 0;
  const altText = hasAlts
    ? `+ ${recipe.duplicatesGroup?.length} rolled-up alternative${recipe.duplicatesGroup?.length === 1 ? '' : 's'}`
    : '';

  // Determine occasion tags
  const tags: string[] = [];
  if (recipe.occasions && recipe.occasions.length > 0 && recipe.occasions[0] !== 'Quick') {
    tags.push(recipe.occasions[0]);
  }
  
  // Tag spicy/mild based on ingredients
  const isSpicy = recipe.ingredientsEn.some(i => i.toLowerCase().includes('chili') || i.toLowerCase().includes('pepper') || i.toLowerCase().includes('masala'));
  if (isSpicy) {
    tags.push(lang === 'ur' ? 'مسالہ دار' : 'Spicy');
  } else {
    tags.push(lang === 'ur' ? 'ہلکا مسالہ' : 'Mild');
  }

  return (
    <Link to="/recipes/$recipeId" params={{ recipeId: recipe.id }} className="bg-zinc-900/30 border border-zinc-800/85 hover:border-orange-500/30 rounded-3xl overflow-hidden flex flex-col transition-all cursor-pointer relative hover:-translate-y-0.5 group">
      <div className="h-48 w-full bg-zinc-950 relative overflow-hidden">
        <img 
          src={recipe.image || 'mediterranean_hummus.png'} 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* Cost Tier floating top-left */}
        <span className="absolute top-4 left-4 text-xs font-bold bg-zinc-950/80 border border-zinc-800 px-3 py-1 rounded-xl text-orange-400 shadow-md">
          {recipe.costTier}
        </span>
        {/* Vignette overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent opacity-80"></div>
      </div>
      
      <div className="p-5 flex flex-col flex-1 gap-2.5 text-left">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, idx) => (
            <span key={idx} className="text-[9px] bg-zinc-950/40 border border-zinc-850/60 font-bold px-2.5 py-0.5 rounded-full text-zinc-400">
              {tag}
            </span>
          ))}
        </div>

        <h4 className="font-extrabold text-white text-base leading-snug tracking-tight mt-1">{title}</h4>
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{desc}</p>
        
        {/* Stats Row */}
        <div className="flex gap-4 text-[10px] text-zinc-500 font-bold mt-auto pt-3 border-t border-zinc-850/50">
          <span>🕒 {recipe.timeEn}</span>
          <span>✓ {recipe.cookedSafely} cooked</span>
          <span>🔥 {weight} weight</span>
        </div>

        {/* Footer info & Rolled up alternatives */}
        <div className="flex justify-between items-center text-[9px] text-zinc-500 font-semibold mt-1">
          <span>by {recipe.authorName}</span>
          {hasAlts && <span className="text-orange-400 font-bold tracking-tight">{altText}</span>}
        </div>
      </div>
    </Link>
  );
}
