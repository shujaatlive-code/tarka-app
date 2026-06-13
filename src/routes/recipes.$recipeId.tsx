import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from '@tanstack/react-router';
import { TarkaDB, Recipe, getVerificationWeight } from '../services/db';
import { WebWakeLock } from '../services/wakelock';
import { auth } from '../services/firebase';

const detailTranslations: Record<string, Record<string, string>> = {
  en: {
    back: "← Back to Recipes",
    wakeActive: "Kitchen Mode Active",
    wakeSub: "Device screen lock disabled. Happy cooking!",
    wakeFallback: "Kitchen Mode Active (Simulated)",
    wakeFallbackSub: "Device sleep block simulated. Happy cooking!",
    upvoteAction: "Upvote Recipe",
    cookedAction: "I Cooked This",
    weight: "Verification Weight",
    upvotes: "Upvotes",
    cooked: "Cooked Safely",
    proofTitle: "Show off your recreation! 📸",
    proofDesc: "Upload a photo of your dish to reward the author +20 XP and build recipe verification weight.",
    chooseProofBtn: "Upload Photo",
    noPhoto: "No photo chosen",
    variantsTitle: "Alternative Recipes (Duplicates)",
    variantsDesc: "These are duplicate submissions collapsed to reduce noise. Tap to view them:",
    tipsTitle: "💡 Community Consensus Tips",
    ingredientsTitle: "Ingredients",
    ingredientsSub: "Ticked items match your cabinet selection.",
    stepsTitle: "Cooking Steps",
    stepsSub: "Check off steps as you proceed to dim completed steps.",
    kitchenPill: "Kitchen Mode",
    by: "by",
    stocked: "stocked",
    matchedAlert: "* Green highlighted items match ingredients selected in your cabinet."
  },
  ur: {
    back: "ترکیبوں پر واپس جائیں →",
    wakeActive: "کچن موڈ آن ہے",
    wakeSub: "اسکرین کا سونا معطل کر دیا گیا ہے۔ خوشی سے پکائیں!",
    wakeFallback: "کچن موڈ آن ہے (سیمیولیٹڈ)",
    wakeFallbackSub: "آلے کی سلیپ بلاک ہے۔ خوشی سے پکائیں!",
    upvoteAction: "پسند کریں",
    cookedAction: "میں نے یہ پکایا",
    weight: "تصدیقی وزن",
    upvotes: "پسندیدگی",
    cooked: "کامیابی سے پکایا",
    proofTitle: "اپنی ڈش کی تصویر دکھائیں! 📸",
    proofDesc: "مصنف کو +25 XP دینے اور ترکیب کی تصدیق بڑھانے کے لیے اپنے تیار کردہ کھانے کی تصویر اپ لوڈ کریں۔",
    chooseProofBtn: "تصویر اپ لوڈ کریں",
    noPhoto: "کوئی تصویر منتخب نہیں ہے",
    variantsTitle: "متبادل ترکیبیں (ڈپلیکیٹ)",
    variantsDesc: "شور کو کم کرنے کے لیے یکجا کی گئی متبادل ترکیبیں دیکھیں۔",
    tipsTitle: "💡 کمیونٹی کی اہم تجاویز",
    ingredientsTitle: "اجزاء",
    ingredientsSub: "سبز رنگ کے اجزاء آپ کے کیبنٹ سے مطابقت رکھتے ہیں۔",
    stepsTitle: "پکانے کے مراحل",
    stepsSub: "پکانے کے ساتھ ساتھ مراحل پر نشان لگائیں تاکہ وہ مدہم ہو جائیں۔",
    kitchenPill: "کچن موڈ",
    by: "بذریعہ",
    stocked: "موجود ہے",
    matchedAlert: "* سبز رنگ کی نشان دہی والے اجزاء آپ کی کیبنٹ میں موجود ہیں۔"
  }
};

export default function RecipeDetailRouteComponent() {
  const { recipeId } = useParams({ from: '/recipes/$recipeId' });
  const navigate = useNavigate();

  const [lang, setLang] = useState<string>(localStorage.getItem('tarka_lang') || 'en');
  const [recipes, setRecipes] = useState<Recipe[]>(TarkaDB.getRecipes());
  const [upvotedIds, setUpvotedIds] = useState<string[]>(TarkaDB.getUpvotes());
  const [cookedIds, setCookedIds] = useState<string[]>(TarkaDB.getCooked());
  const [completedSteps, setCompletedSteps] = useState<Record<string, number[]>>(TarkaDB.getCompletedSteps());
  
  // Wake lock
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const [wakeLockIsFallback, setWakeLockIsFallback] = useState<boolean>(false);

  // Detail view language
  const [detailLang, setDetailLang] = useState<'en' | 'ur'>('en');

  // Proof upload
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string>('');

  const recipe = recipes.find(r => r.id === recipeId);

  useEffect(() => {
    if (!recipe) {
      navigate({ to: '/' });
      return;
    }

    const syncCloudData = async () => {
      const cloudRecipes = await TarkaDB.fetchRecipesFromCloud();
      setRecipes(cloudRecipes);
      const cloudUpvoted = TarkaDB.getUpvotes();
      setUpvotedIds(cloudUpvoted);
      const cloudCooked = TarkaDB.getCooked();
      setCookedIds(cloudCooked);
      const cloudCompleted = TarkaDB.getCompletedSteps();
      setCompletedSteps(cloudCompleted);

      // Increment views on load
      const updatedRecipes = cloudRecipes.map(r => {
        if (r.id === recipeId) {
          const updated = { ...r, views: (r.views || 0) + 1 };
          TarkaDB.updateRecipeInCloud(updated);
          return updated;
        }
        return r;
      });
      setRecipes(updatedRecipes);
    };

    syncCloudData();

    // Request Wake Lock
    WebWakeLock.request((active, isFallback) => {
      setWakeLockActive(active);
      setWakeLockIsFallback(!!isFallback);
    });

    const handleLang = () => setLang(localStorage.getItem('tarka_lang') || 'en');
    window.addEventListener('langChange', handleLang);

    // Clean up
    return () => {
      WebWakeLock.release(() => {
        setWakeLockActive(false);
      });
      window.removeEventListener('langChange', handleLang);
    };
  }, [recipeId]);

  useEffect(() => {
    setDetailLang(lang === 'ur' ? 'ur' : 'en');
  }, [lang]);

  if (!recipe) return null;

  const dict = detailTranslations[lang] || detailTranslations.en;
  const pantry = TarkaDB.getPantry();
  const weightVal = getVerificationWeight(recipe);
  const title = lang === 'ur' ? recipe.titleUr : recipe.titleEn;

  const isUpvoted = upvotedIds.includes(recipe.id);
  const isCooked = cookedIds.includes(recipe.id);

  // Upvote trigger
  const handleUpvote = async () => {
    let nextUpvoted = [...upvotedIds];
    let updatedRecipeObj: Recipe | undefined;

    const updatedRecipes = recipes.map(r => {
      if (r.id === recipe.id) {
        const diff = isUpvoted ? -1 : 1;
        updatedRecipeObj = { ...r, upvotes: Math.max((r.upvotes || 0) + diff, 0) };
        return updatedRecipeObj;
      }
      return r;
    });

    if (isUpvoted) {
      nextUpvoted = nextUpvoted.filter(id => id !== recipe.id);
    } else {
      nextUpvoted.push(recipe.id);
    }

    setRecipes(updatedRecipes);
    TarkaDB.saveUpvotes(nextUpvoted);
    setUpvotedIds(nextUpvoted);

    if (updatedRecipeObj) {
      await TarkaDB.updateRecipeInCloud(updatedRecipeObj);
    }
  };

  // Cooked It trigger
  const handleCookedIt = async (proofUrl?: string) => {
    if (isCooked && !proofUrl) return;
    
    const nextCooked = isCooked ? cookedIds : [...cookedIds, recipe.id];
    let updatedRecipeObj: Recipe | undefined;

    const updatedRecipes = recipes.map(r => {
      if (r.id === recipe.id) {
        updatedRecipeObj = { 
          ...r, 
          cookedSafely: isCooked ? r.cookedSafely : (r.cookedSafely || 0) + 1,
          image: proofUrl || r.image
        };
        return updatedRecipeObj;
      }
      return r;
    });

    // Update Profile XP
    const profile = TarkaDB.getProfile();
    if (!isCooked) {
      profile.xp += 20;
      if (profile.xp >= 100) {
        profile.level += 1;
        profile.xp = profile.xp - 100;
        profile.badge = "Sufi Chef";
      }
      await TarkaDB.saveUserProfileCloud(profile);
      window.dispatchEvent(new Event('profileChange'));
    }

    setRecipes(updatedRecipes);
    TarkaDB.saveCooked(nextCooked);
    setCookedIds(nextCooked);

    if (updatedRecipeObj) {
      await TarkaDB.updateRecipeInCloud(updatedRecipeObj);
    }
  };

  // Check off step
  const handleStepCheck = (stepIdx: number, isChecked: boolean) => {
    const nextCompleted = { ...completedSteps };
    let list = nextCompleted[recipe.id] || [];

    if (isChecked) {
      if (!list.includes(stepIdx)) list.push(stepIdx);
    } else {
      list = list.filter(x => x !== stepIdx);
    }

    nextCompleted[recipe.id] = list;
    setCompletedSteps(nextCompleted);
    TarkaDB.saveCompletedSteps(nextCompleted);
  };

  // Handle Photo proof
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      setProofPreview(URL.createObjectURL(file));
      
      try {
        const uploadPath = `proofs/${recipe.id}/${auth.currentUser?.uid || 'guest'}_${Date.now()}_${file.name}`;
        const downloadUrl = await TarkaDB.uploadFile(file, uploadPath);
        await handleCookedIt(downloadUrl);
      } catch (err) {
        console.error("Storage proof upload failed:", err);
        await handleCookedIt();
      }
    }
  };

  const removeProof = () => {
    setProofFile(null);
    setProofPreview('');
  };

  const childRecipes = recipes.filter(r => r.parentRecipeId === recipe.id);
  const completedList = completedSteps[recipe.id] || [];

  return (
    <div className="flex flex-col gap-6">
      
      {/* Back button */}
      <Link to="/" className="flex items-center gap-2 px-4 py-2 border border-zinc-800 rounded-full text-xs font-semibold text-zinc-400 hover:text-white transition-all self-start">
        {dict.back}
      </Link>

      {/* Wake Lock Active banner */}
      {wakeLockActive && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl flex items-center gap-3 shadow-lg shadow-emerald-500/5 animate-pulse">
          <span className="text-xl">⚡</span>
          <div className="flex flex-col">
            <strong className="text-sm font-extrabold">{wakeLockIsFallback ? dict.wakeFallback : dict.wakeActive}</strong>
            <span className="text-xs opacity-80">{wakeLockIsFallback ? dict.wakeFallbackSub : dict.wakeSub}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-start">
        
        {/* Left Column: Media & details */}
        <div className="flex flex-col gap-6">
          <div className="relative aspect-[16/10] rounded-3xl overflow-hidden border border-zinc-800 shadow-xl">
            <img src={recipe.image || 'mediterranean_hummus.png'} alt={title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/30 to-transparent"></div>
            <div className="absolute bottom-5 left-5 right-5 flex flex-col gap-2">
              <div className="flex gap-2">
                <span className="bg-zinc-800/80 border border-zinc-700 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                  {detailLang === 'ur' ? recipe.regionUr : recipe.regionEn}
                </span>
                <span className="bg-orange-500/20 border border-orange-500/40 text-orange-400 font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                  {recipe.costTier}
                </span>
              </div>
              <h2 className="text-2xl font-extrabold text-white">{detailLang === 'ur' ? recipe.titleUr : recipe.titleEn}</h2>
              <p className="text-xs text-zinc-400">by {recipe.authorName}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 bg-zinc-900/10 border border-zinc-800 p-4 rounded-2xl text-center">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-extrabold text-orange-400">{weightVal}</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase">{dict.weight}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-extrabold text-orange-400">{recipe.upvotes}</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase">{dict.upvotes}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-lg font-extrabold text-orange-400">{recipe.cookedSafely}</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase">{dict.cooked}</span>
            </div>
          </div>

          {/* Interactions */}
          <div className="flex gap-4">
            <button 
              onClick={handleUpvote}
              className={`flex-1 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 border transition-all ${isUpvoted ? 'bg-orange-500 text-white border-orange-600' : 'bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20'}`}
            >
              🔥 {dict.upvoteAction}
            </button>
            <button 
              onClick={handleCookedIt}
              disabled={isCooked}
              className={`flex-1 font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-2 border transition-all ${isCooked ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'}`}
            >
              ✓ {dict.cookedAction}
            </button>
          </div>

          {/* Cooked Proof Upload */}
          <div className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3">
            <h4 className="text-sm font-bold text-white">{dict.proofTitle}</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">{dict.proofDesc}</p>
            <div className="flex items-center gap-4">
              <label className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white font-semibold text-xs py-2 px-4 rounded-lg cursor-pointer transition-all">
                {dict.chooseProofBtn}
                <input type="file" onChange={handleFileChange} className="hidden" accept="image/*" />
              </label>
              <span className="text-[10px] text-zinc-500 truncate max-w-[200px]">{proofFile ? proofFile.name : dict.noPhoto}</span>
            </div>
            {proofPreview && (
              <div className="relative mt-2 aspect-video rounded-xl overflow-hidden border border-zinc-800">
                <img src={proofPreview} alt="Proof upload preview" className="w-full h-full object-cover" />
                <button onClick={removeProof} className="absolute top-2 right-2 w-7 h-7 bg-black/80 rounded-full flex items-center justify-center text-white font-bold text-xs">✕</button>
              </div>
            )}
          </div>

          {/* Collapsible duplicates alternative variants */}
          {recipe.isParentRecipe && childRecipes.length > 0 && (
            <div className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3">
              <h4 className="text-sm font-bold text-white">{dict.variantsTitle}</h4>
              <p className="text-xs text-zinc-500">{dict.variantsDesc}</p>
              <div className="flex flex-col gap-2">
                {childRecipes.map(child => (
                  <Link 
                    to="/recipes/$recipeId"
                    params={{ recipeId: child.id }}
                    key={child.id}
                    className="flex justify-between items-center bg-zinc-950/40 border border-zinc-850 p-3 rounded-xl hover:border-orange-500/30 hover:translate-x-1 transition-all cursor-pointer text-xs"
                  >
                    <span className="font-bold text-white">{lang === 'ur' ? child.titleUr : child.titleEn}</span>
                    <span className="text-zinc-500 text-[10px]">{dict.by} {child.authorName}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Community Consensus Tips */}
          {((detailLang === 'ur' ? recipe.communityTipsUr : recipe.communityTipsEn)?.length || 0) > 0 && (
            <div className="bg-zinc-900/30 border border-zinc-800 p-5 rounded-2xl flex flex-col gap-3">
              <h4 className="text-sm font-bold text-white">{dict.tipsTitle}</h4>
              <ul className="list-disc list-inside text-xs text-zinc-400 flex flex-col gap-2">
                {(detailLang === 'ur' ? recipe.communityTipsUr : recipe.communityTipsEn)?.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* Right Column: Steps (Kitchen Mode toggle) */}
        <div className="flex flex-col gap-6">
          
          {/* Tabs switch lang */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 self-start">
            <button 
              onClick={() => setDetailLang('en')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${detailLang === 'en' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            >
              English Guide
            </button>
            <button 
              onClick={() => setDetailLang('ur')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${detailLang === 'ur' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
            >
              اردو (Urdu)
            </button>
          </div>

          {/* Ingredients list */}
          <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-3xl flex flex-col gap-4">
            <h3 className="text-lg font-bold text-white">{dict.ingredientsTitle}</h3>
            <p className="text-xs text-zinc-500 mt-[-10px]">{dict.ingredientsSub}</p>
            <ul className="flex flex-col gap-2 text-xs">
              {(detailLang === 'ur' ? recipe.ingredientsUr : recipe.ingredientsEn).map((ing, idx) => {
                const isMatched = pantry.some(p => p.toLowerCase() === ing.toLowerCase());
                return (
                  <li key={idx} className={`flex justify-between items-center p-3 rounded-xl border ${isMatched ? 'bg-emerald-500/5 border-emerald-500/30 text-emerald-400' : 'bg-zinc-950/20 border-zinc-800/80 text-zinc-300'}`}>
                    <span className="font-semibold">{ing}</span>
                    {isMatched && <span className="text-[10px] font-bold">✓ {dict.stocked}</span>}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Steps checklist */}
          <div className="bg-zinc-900/30 border border-zinc-800 p-6 rounded-3xl flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
              <h3 className="text-lg font-bold text-white">{dict.stepsTitle}</h3>
              <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                {dict.kitchenPill}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-[-10px]">{dict.stepsSub}</p>

            <div className="flex flex-col gap-4">
              {(detailLang === 'ur' ? recipe.instructionsUr : recipe.instructionsEn).map((step, idx) => {
                const isCompleted = completedList.includes(idx);
                return (
                  <div 
                    key={idx} 
                    onClick={() => handleStepCheck(idx, !isCompleted)}
                    className={`flex gap-3.5 p-4 border rounded-2xl cursor-pointer transition-all ${isCompleted ? 'bg-black/10 border-zinc-800/80 opacity-40 line-through' : 'bg-zinc-950/20 border-zinc-800 hover:border-orange-500/30'}`}
                  >
                    <div className="pt-0.5">
                      <input 
                        type="checkbox" 
                        checked={isCompleted}
                        onChange={e => handleStepCheck(idx, e.target.checked)}
                        className="rounded border-zinc-700 bg-zinc-950 text-orange-500 focus:ring-0 w-4 h-4 cursor-pointer"
                      />
                    </div>
                    <div className="flex flex-col gap-1 text-xs">
                      <span className="font-extrabold text-orange-400 uppercase tracking-wider">
                        {detailLang === 'ur' ? `مرحلہ ${idx+1}` : `Step ${idx+1}`}
                      </span>
                      <p className="text-zinc-300 leading-relaxed font-medium">{step}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
