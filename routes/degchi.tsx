import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { TarkaDB, Recipe } from '../services/db';

const ocrTranslations: Record<string, Record<string, string>> = {
  en: {
    title: "Degchi AI Recipe Standardizer 🤖",
    desc: "Scan handwritten recipe notebooks or physical cookbook snapshots to normalize measurements and save bilingual structured copies.",
    btnFile: "📁 Upload Snapshot",
    btnCamera: "📸 Use Viewfinder Camera",
    dropPrimary: "Drag & drop recipe photo here or click to browse",
    dropSub: "Supports PNG, JPEG (Handwritten notes or book prints)",
    terminalTitle: "Degchi Parser Node Active",
    previewTitleLabel: "Degchi Normalized Bilingual Output",
    btnSaveVault: "🔑 Save to Private Vault (Private)",
    btnPublishFeed: "🌐 Publish to Public Feed (+50 XP)",
    lblRegion: "Origin:",
    lblBudget: "Budget:",
    lblOccasion: "Occasion:",
    lblTime: "Cook Time:",
    lblIngredients: "Normalized Ingredients",
    lblInstructions: "Standardized Instructions",
    saveSuccess: "Saved successfully!"
  },
  ur: {
    title: "دیگچی او سی آر ریسیپی اسٹینڈرڈائزر 🤖",
    desc: "ہاتھ سے لکھی ہوئی ترکیبیں یا کتاب کے صفحات اسکین کریں تاکہ اجزاء کی مقدار کو یکساں کیا جا سکے اور باہمی ترجمہ محفوظ کیا جا سکے۔",
    btnFile: "📁 تصویر اپ لوڈ کریں",
    btnCamera: "📸 کیمرہ ویو فائنڈر استعمال کریں",
    dropPrimary: "ترکیب کی تصویر یہاں کھینچ کر لائیں یا براؤز کریں",
    dropSub: "سپورٹ کرتا ہے: PNG, JPEG (ہاتھ سے لکھی تحریر یا کتاب کے صفحات)",
    terminalTitle: "دیگچی پارسر نوڈ فعال ہے",
    previewTitleLabel: "دیگچی کی معیاری دو لسانی آؤٹ پٹ",
    btnSaveVault: "🔑 ذاتی والٹ میں محفوظ کریں (پرائیویٹ)",
    btnPublishFeed: "🌐 پبلک فیڈ میں شائع کریں (+50 XP)",
    lblRegion: "علاقہ:",
    lblBudget: "بجٹ:",
    lblOccasion: "تہوار:",
    lblTime: "پکانے کا وقت:",
    lblIngredients: "معیاری اجزاء",
    lblInstructions: "معیاری ہدایات",
    saveSuccess: "ترکیب کامیابی سے محفوظ ہو گئی!"
  }
};

interface LogStep {
  prg: number;
  msg: string;
}

export default function DegchiRouteComponent() {
  const [lang, setLang] = useState<string>(localStorage.getItem('tarka_lang') || 'en');
  const [market, setMarket] = useState<string>(localStorage.getItem('tarka_market') || 'PK');
  const [ocrMode, setOCRMode] = useState<'file' | 'camera'>('file');
  const [cameraFlash, setCameraFlash] = useState<boolean>(false);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  
  // Simulated logs
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Results
  const [result, setResult] = useState<Recipe | null>(null);
  const [previewLang, setPreviewLang] = useState<'en' | 'ur'>('en');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

  const dict = ocrTranslations[lang] || ocrTranslations.en;

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      startSimulatedParser();
    }
  };

  const triggerShutter = () => {
    setFlashActive(true);
    setTimeout(() => {
      setFlashActive(false);
      startSimulatedParser();
    }, 150);
  };

  const startSimulatedParser = () => {
    setResult(null);
    setProcessing(true);
    setProgress(0);
    setLogs([]);

    const steps: LogStep[] = [
      { prg: 15, msg: "[SCANNING IMAGE CANVASES...] Deskewing and aligning text sheets..." },
      { prg: 40, msg: "[DETECTING LANGUAGE SCRIPTS AND CORRECTIONS...] Detected bilingual inputs: Perso-Arabic Nastaliq + English." },
      { prg: 70, msg: "[EXTRACTING TAXONOMY STRUCTURES...] Classifying ingredients, quantities, instructions, and cooking tips." },
      { prg: 100, msg: "[COMPILING TARKA CHIP SCHEMATICS...] Normalizing measurements (dahi -> yogurt). Schema output compiled." }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setProgress(step.prg);
        setLogs(prev => [...prev, step.msg]);

        if (idx === steps.length - 1) {
          setTimeout(() => {
            setProcessing(false);
            compileResultMock();
          }, 800);
        }
      }, (idx + 1) * 750);
    });
  };

  const compileResultMock = () => {
    const mockOut: Recipe = {
      id: "ocr_scanned_" + Date.now(),
      titleEn: "Nanis Chicken Karahi (Standardized)",
      titleUr: "نانی اماں کی چکن کڑاہی (معیاری)",
      descriptionEn: "A traditional chicken Karahi passed down from grandmother, standardized with measurements and formatted in bilingual text.",
      descriptionUr: "دادی اماں کی روایتی چکن کڑاہی، جس کی پیمائش کو یکساں کیا گیا ہے اور دو لسانی متن میں فارمیٹ کیا گیا ہے۔",
      ingredientsEn: ["Chicken", "Tomatoes", "Ginger", "Garlic", "Green Chilies", "Black Pepper", "Oil", "Salt"],
      ingredientsUr: ["چکن", "ٹماٹر", "ادرک", "لہسن", "ہری مرچیں", "کالی مرچ", "تیل", "نمک"],
      instructionsEn: [
        "Chop tomatoes in half. Fry chicken in wok with oil and ginger garlic paste.",
        "Add tomatoes over chicken, cover and steam for 10 minutes until skins loosen.",
        "Remove skin of tomatoes, mash them well, and cook on high heat until dry.",
        "Add freshly ground black pepper and sliced green chilies before serving."
      ],
      instructionsUr: [
        "ٹماٹروں کو درمیان سے آدھا کاٹ لیں۔ کڑاہی میں تیل اور ادرک لہسن کے پیسٹ کے ساتھ چکن فرائی کریں۔",
        "چکن پر ٹماٹر رکھیں، برتن ڈھانپیں اور 10 منٹ تک بھاپ دیں جب تک چھلکے نرم نہ ہو جائیں۔",
        "ٹماٹر کے چھلکے اتاریں، انہیں چمچ سے اچھی طرح میش کریں، اور تیز آنچ پر بھونیں۔",
        "پیش کرنے سے پہلے پسی ہوئی کالی مرچ اور لمبی کٹی ہری مرچیں شامل کریں۔"
      ],
      regionEn: "Lahore",
      regionUr: "لاہور",
      cuisineEn: "Pakistani",
      cuisineUr: "پاکستانی",
      timeEn: "35 mins",
      timeUr: "35 منٹ",
      difficultyEn: "Medium",
      difficultyUr: "درمیانہ",
      upvotes: 1,
      views: 1,
      cookedSafely: 1,
      costTier: "$",
      occasions: ["Quick"],
      authorName: "Shujat Ali",
      authorTierEn: "Rising Star",
      authorTierUr: "رائزنگ اسٹار",
      markets: [market as any]
    };
    setResult(mockOut);
    setPreviewLang('en');
  };

  const handleSaveRecipe = (saveToPrivateOnly: boolean) => {
    if (!result) return;
    const recipes = TarkaDB.getRecipes();
    const vaultIds = TarkaDB.getVaultIds();
    const profile = TarkaDB.getProfile();

    recipes.push(result);
    TarkaDB.saveRecipes(recipes);

    if (saveToPrivateOnly) {
      vaultIds.push(result.id);
      TarkaDB.saveVaultIds(vaultIds);
      console.log(`Saved privately: ${result.id}`);
      alert(dict.saveSuccess);
      navigate({ to: '/' });
    } else {
      // Award User +50 XP for publishing
      profile.xp += 50;
      if (profile.xp >= 100) {
        profile.level += 1;
        profile.xp = profile.xp - 100;
        profile.badge = "Sufi Chef";
      }
      TarkaDB.saveProfile(profile);
      window.dispatchEvent(new Event('profileChange'));
      alert(dict.saveSuccess + " +50 XP awarded!");
      navigate({ to: '/' });
    }
    setResult(null);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
        <h2 className="text-xl font-extrabold text-white">{dict.title}</h2>
        <p className="text-xs text-zinc-500">{dict.desc}</p>
      </div>

      <div className="max-w-xl mx-auto w-full bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl flex flex-col gap-6 glassmorphism">
        
        {/* Toggle Mode */}
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setOCRMode('file')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${ocrMode === 'file' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
          >
            {dict.btnFile}
          </button>
          <button 
            onClick={() => setOCRMode('camera')}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${ocrMode === 'camera' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
          >
            {dict.btnCamera}
          </button>
        </div>

        {/* Option A: Drop zone */}
        {ocrMode === 'file' && (
          <div 
            onClick={triggerUpload}
            className="border-2 border-dashed border-zinc-800 hover:border-orange-500/30 bg-zinc-950/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-all"
          >
            <span className="text-3xl mb-3">📥</span>
            <h3 className="text-sm font-bold text-white mb-1">{dict.dropPrimary}</h3>
            <p className="text-[10px] text-zinc-500">{dict.dropSub}</p>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*" 
            />
          </div>
        )}

        {/* Option B: Camera Viewfinder */}
        {ocrMode === 'camera' && (
          <div className="relative aspect-[4/3] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col items-center justify-center">
            
            {/* Shutter flash overlay */}
            <div className={`absolute inset-0 bg-white z-50 transition-opacity duration-150 pointer-events-none ${flashActive ? 'opacity-100' : 'opacity-0'}`}></div>
            
            {/* Contour guidelines */}
            <div className="absolute inset-8 border border-white/15 rounded-lg pointer-events-none flex items-center justify-center">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/60"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/60"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/60"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/60"></div>
            </div>

            {/* Grid overlay */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20 pointer-events-none">
              <div className="border border-white/30"></div>
              <div className="border border-white/30"></div>
              <div className="border border-white/30"></div>
              <div className="border border-white/30"></div>
              <div className="border border-white/30"></div>
              <div className="border border-white/30"></div>
              <div className="border border-white/30"></div>
              <div className="border border-white/30"></div>
              <div className="border border-white/30"></div>
            </div>

            {/* Simulated paper subject in focus */}
            <div className="w-[180px] bg-zinc-900 border border-zinc-800 shadow-2xl p-3 text-left font-serif leading-normal select-none pointer-events-none transform -rotate-1 opacity-70">
              <h5 className="text-[10px] font-bold text-orange-400 border-b border-zinc-800 pb-1">نانی اماں کی کڑاہی</h5>
              <p className="text-[8px] text-zinc-400 mt-1.5">- آدھا کلو چکن</p>
              <p className="text-[8px] text-zinc-400">- ٹماٹر 4 عدد (پیاز نہیں ڈالنی!)</p>
              <p className="text-[8px] text-zinc-400">- کالی مرچ آدھا چمچ</p>
            </div>

            {/* Shutter controls overlay */}
            <div className="absolute bottom-4 left-0 right-0 px-6 flex justify-between items-center z-30">
              <button 
                onClick={() => setCameraFlash(f => !f)} 
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm transition-all ${cameraFlash ? 'bg-orange-500 text-white' : 'bg-zinc-900/90 text-zinc-300'}`}
              >
                ⚡
              </button>
              <button 
                onClick={triggerShutter}
                className="w-14 h-14 bg-white border-4 border-zinc-900 rounded-full flex items-center justify-center active:scale-95 transition-all shadow-xl"
              ></button>
              <button 
                onClick={() => setOCRMode('file')}
                className="w-9 h-9 rounded-full bg-zinc-900/90 text-zinc-300 flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

          </div>
        )}

        {/* AI logs Terminal */}
        {processing && (
          <div className="bg-black/80 border border-zinc-800 p-4 rounded-xl font-mono text-[10px] flex flex-col gap-2">
            <div className="flex items-center gap-1.5 border-b border-zinc-800 pb-2">
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span>
              <span className="w-2.5 h-2.5 bg-yellow-500 rounded-full"></span>
              <span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span>
              <span className="text-zinc-400 ml-2">{dict.terminalTitle}</span>
            </div>
            
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="flex flex-col gap-1.5 mt-2 h-24 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-zinc-300">
                  <span className="text-orange-500">[LOG]</span> {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview result */}
        {result && (
          <div className="flex flex-col gap-4">
            <div className="text-xs font-bold text-orange-400 flex items-center gap-1">
              <span>✨</span> {dict.previewTitleLabel}
            </div>

            {/* Preview Lang tabs */}
            <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 self-start">
              <button 
                onClick={() => setPreviewLang('en')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${previewLang === 'en' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
              >
                English
              </button>
              <button 
                onClick={() => setPreviewLang('ur')}
                className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${previewLang === 'ur' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
              >
                اردو
              </button>
            </div>

            {/* Structured view */}
            <div className={`border border-zinc-800 p-4 rounded-2xl bg-zinc-950/30 flex flex-col gap-3 ${previewLang === 'ur' ? 'font-urdu-nastaliq text-right' : 'font-sans'}`} dir={previewLang === 'ur' ? 'rtl' : 'ltr'}>
              <h3 className="font-extrabold text-white text-base">{previewLang === 'ur' ? result.titleUr : result.titleEn}</h3>
              <p className="text-xs text-zinc-400 leading-relaxed">{previewLang === 'ur' ? result.descriptionUr : result.descriptionEn}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 border-t border-b border-zinc-800 py-3 text-[10px] text-zinc-500">
                <div><strong>{dict.lblRegion}</strong> {previewLang === 'ur' ? result.regionUr : result.regionEn}</div>
                <div><strong>{dict.lblBudget}</strong> {result.costTier}</div>
                <div><strong>{dict.lblOccasion}</strong> {result.occasions.join(', ')}</div>
                <div><strong>{dict.lblTime}</strong> {previewLang === 'ur' ? result.timeUr : result.timeEn}</div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="text-xs font-bold text-white">{dict.lblIngredients}</div>
                <div className="flex flex-wrap gap-1">
                  {(previewLang === 'ur' ? result.ingredientsUr : result.ingredientsEn).map(ing => (
                    <span key={ing} className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full text-zinc-300">{ing}</span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="text-xs font-bold text-white">{dict.lblInstructions}</div>
                <ol className="list-decimal list-inside text-xs text-zinc-400 flex flex-col gap-1">
                  {(previewLang === 'ur' ? result.instructionsUr : result.instructionsEn).map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 flex-wrap mt-2">
              <button 
                onClick={() => handleSaveRecipe(true)}
                className="flex-1 bg-white/5 border border-zinc-800 hover:bg-zinc-800 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all"
              >
                {dict.btnSaveVault}
              </button>
              <button 
                onClick={() => handleSaveRecipe(false)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-3 px-4 rounded-xl transition-all shadow-lg shadow-orange-500/20"
              >
                {dict.btnPublishFeed}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
