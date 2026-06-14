import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { TarkaDB, Recipe } from '../services/db';
import { standardizeRecipeWithGemini, fetchRecipeCoverPhoto } from '../services/ai';
import { auth } from '../services/firebase';

const ocrTranslations: Record<string, Record<string, string>> = {
  en: {
    title: "Degchi AI Recipe Standardizer 🤖",
    desc: "Scan handwritten recipe notebooks or physical cookbook snapshots to normalize measurements and save bilingual structured copies.",
    btnFile: "📁 Upload Snapshot",
    btnCamera: "📸 Use Viewfinder Camera",
    dropPrimary: "Drag & drop recipe photo here or click to browse",
    dropSub: "Supports PNG, JPEG, WebP, PDF (Handwritten notes or card prints)",
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
    saveSuccess: "Saved successfully!",
    lblEditTitleEn: "Title (English)",
    lblEditTitleUr: "Title (Urdu)",
    lblEditDescEn: "Description (English)",
    lblEditDescUr: "Description (Urdu)",
    lblEditRegionEn: "Region (English)",
    lblEditRegionUr: "Region (Urdu)",
    lblEditCuisineEn: "Cuisine (English)",
    lblEditCuisineUr: "Cuisine (Urdu)",
    lblEditTimeEn: "Cook Time (English)",
    lblEditTimeUr: "Cook Time (Urdu)",
    lblEditCost: "Cost Tier",
    lblEditOccasion: "Occasions (Comma Separated)",
    btnEdit: "✏️ Edit Recipe Details",
    btnDone: "✓ Save & Preview",
    btnAddIngredient: "➕ Add Ingredient Row",
    btnAddStep: "➕ Add Instruction Step",
    lblIngEn: "Ingredient (English)",
    lblIngUr: "Ingredient (Urdu)",
    lblStepEn: "Step (English)",
    lblStepUr: "Step (Urdu)",
    errTitle: "OCR Engine Error ⚠️",
    cameraErrTitle: "Camera Unavailable 📹",
    cameraErrText: "Webcam stream could not be acquired (blocked, denied, or not supported). Use 'Upload Snapshot' or trigger Simulation Mode instead.",
    btnSimulation: "🚀 Run Simulation Mode",
    btnRetry: "🔄 Upload Another File"
  },
  ur: {
    title: "دیگچی او سی آر ریسیپی اسٹینڈرڈائزر 🤖",
    desc: "ہاتھ سے لکھی ہوئی ترکیبیں یا کتاب کے صفحات اسکین کریں تاکہ اجزاء کی مقدار کو یکساں کیا جا سکے اور باہمی ترجمہ محفوظ کیا جا سکے۔",
    btnFile: "📁 تصویر اپ لوڈ کریں",
    btnCamera: "📸 کیمرہ ویو فائنڈر استعمال کریں",
    dropPrimary: "ترکیب کی تصویر یہاں کھینچ کر لائیں یا براؤز کریں",
    dropSub: "سپورٹ کرتا ہے: PNG, JPEG, WebP, PDF (ہاتھ سے لکھی تحریر یا کتاب کے صفحات)",
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
    saveSuccess: "ترکیب کامیابی سے محفوظ ہو گئی!",
    lblEditTitleEn: "عنوان (انگریزی)",
    lblEditTitleUr: "عنوان (اردو)",
    lblEditDescEn: "تفصیل (انگریزی)",
    lblEditDescUr: "تفصیل (اردو)",
    lblEditRegionEn: "علاقہ (انگریزی)",
    lblEditRegionUr: "علاقہ (اردو)",
    lblEditCuisineEn: "کھانا (انگریزی)",
    lblEditCuisineUr: "کھانا (اردو)",
    lblEditTimeEn: "پکانے کا وقت (انگریزی)",
    lblEditTimeUr: "پکانے کا وقت (اردو)",
    lblEditCost: "بجٹ کا درجہ",
    lblEditOccasion: "تہوار (کوما سے الگ کریں)",
    btnEdit: "✏️ معلومات تبدیل کریں",
    btnDone: "✓ محفوظ اور پیش نظارہ",
    btnAddIngredient: "➕ نیا جزو شامل کریں",
    btnAddStep: "➕ نیا مرحلہ شامل کریں",
    lblIngEn: "جزو (انگریزی)",
    lblIngUr: "جزو (اردو)",
    lblStepEn: "مرحلہ (انگریزی)",
    lblStepUr: "مرحلہ (اردو)",
    errTitle: "او سی آر انجن کی غلطی ⚠️",
    cameraErrTitle: "کیمرہ غیر فعال ہے 📹",
    cameraErrText: "ویب کیم کی تصویر حاصل نہیں ہوسکی (اجازت نہیں ملی یا سپورٹ نہیں ہے)۔ 'تصویر اپ لوڈ کریں' استعمال کریں یا سیمولیشن موڈ چلائیں۔",
    btnSimulation: "🚀 سیمولیشن موڈ چلائیں",
    btnRetry: "🔄 دوسری فائل اپ لوڈ کریں"
  }
};

export default function DegchiRouteComponent() {
  const [lang, setLang] = useState<string>(localStorage.getItem('tarka_lang') || 'en');
  const [market, setMarket] = useState<string>(localStorage.getItem('tarka_market') || 'PK');
  const [ocrMode, setOCRMode] = useState<'file' | 'camera'>('file');
  const [cameraFlash, setCameraFlash] = useState<boolean>(false);
  const [flashActive, setFlashActive] = useState<boolean>(false);
  
  // WebRTC camera states
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<boolean>(false);

  // Processing logs
  const [processing, setProcessing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Results & Errors
  const [result, setResult] = useState<Recipe | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [previewLang, setPreviewLang] = useState<'en' | 'ur'>('en');
  const [isEditing, setIsEditing] = useState<boolean>(false);

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

  // Control WebRTC Camera Stream based on mode
  useEffect(() => {
    if (ocrMode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [ocrMode]);

  // Bind WebRTC stream to video element when it becomes available
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => console.warn("Video play error:", err));
    }
  }, [stream]);

  const startCamera = async () => {
    setCameraError(false);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
    } catch (err) {
      console.warn("Failed to capture WebRTC stream:", err);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const dict = ocrTranslations[lang] || ocrTranslations.en;

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      startRealParser(e.target.files[0]);
    }
  };

  // Draw frame on canvas, convert to blob/File, and trigger OCR parser
  const triggerShutter = () => {
    setFlashActive(true);
    setTimeout(() => {
      setFlashActive(false);

      if (stream && videoRef.current) {
        const video = videoRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          canvas.toBlob((blob) => {
            if (blob) {
              const file = new File([blob], `camera_snapshot_${Date.now()}.jpg`, { type: 'image/jpeg' });
              startRealParser(file);
            } else {
              setError("Failed to process captured camera snapshot frame.");
            }
          }, 'image/jpeg', 0.9);
        }
      } else {
        // Fallback warning if shutter is clicked but stream is blocked
        setError("Camera feed is not active. Please connect a camera or upload a file.");
      }
    }, 150);
  };

  const startRealParser = async (file: File) => {
    setResult(null);
    setError(null);
    setIsEditing(false);
    setProcessing(true);
    setProgress(10);
    setLogs(["[DEGCHI NODE INITIALIZED] Booting transcription engine..."]);

    try {
      // Step 1: Uploading snapshot (Base64 compression saved to Firestore)
      setProgress(25);
      setLogs(prev => [...prev, "[STORAGE NODE] Compressing image snapshot to Base64..."]);
      const rawImageUrl = await TarkaDB.uploadFile(file, "");
      
      // Step 2: Gemini OCR Multimodal analysis
      setProgress(55);
      setLogs(prev => [...prev, "[GEMINI AI NODE] Submitting document to Gemini 1.5 Flash for vision analysis..."]);
      const parsedRecipe = await standardizeRecipeWithGemini(file);
      
      // Step 3: Unsplash cover photo search
      setProgress(85);
      setLogs(prev => [...prev, `[UNSPLASH API NODE] Standardized: "${parsedRecipe.titleEn}". Querying default cover artwork...`]);
      const coverUrl = await fetchRecipeCoverPhoto(parsedRecipe.titleEn);
      
      // Step 4: Finalize recipe object
      setProgress(100);
      setLogs(prev => [...prev, "[DEGCHI NODE COMPLETE] Recipe compiled and localized successfully!"]);
      
      const finalizedRecipe: Recipe = {
        ...parsedRecipe,
        id: "ocr_scanned_" + Date.now(),
        image: coverUrl,
        upvotes: 0,
        views: 0,
        cookedSafely: 0,
        authorName: TarkaDB.getProfile().name,
        authorTierEn: TarkaDB.getProfile().badge,
        authorTierUr: lang === 'ur' ? 'رائزنگ اسٹار' : 'Rising Star',
        markets: [market as any]
      };

      setTimeout(() => {
        setProcessing(false);
        setResult(finalizedRecipe);
        setPreviewLang('en');
      }, 500);

    } catch (err) {
      console.error("Degchi AI Standardizer error:", err);
      setProcessing(false);
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  // Safe Simulated OCR fallback for testing saving / publishing flows without keys
  const runSimulation = () => {
    setResult(null);
    setError(null);
    setIsEditing(false);
    setProcessing(true);
    setProgress(10);
    setLogs(["[DEGCHI NODE INITIALIZED] Booting simulated engine..."]);

    setTimeout(() => {
      setProgress(40);
      setLogs(prev => [...prev, "[STORAGE NODE] Uploading raw image snapshot (Simulated)..."]);
    }, 450);

    setTimeout(() => {
      setProgress(75);
      setLogs(prev => [...prev, "[GEMINI AI NODE] Standardizing with simulated multimodal analysis..."]);
    }, 900);

    setTimeout(() => {
      setProgress(100);
      setLogs(prev => [...prev, "[DEGCHI NODE COMPLETE] Compilation simulated successfully!"]);
      
      const fallbackId = "ocr_fallback_" + Date.now();
      const fallbackRecipe: Recipe = {
        id: fallbackId,
        titleEn: "Nanis Chicken Karahi (Standardized)",
        titleUr: "نانی اماں کی چکن کڑاہی (معیاری)",
        descriptionEn: "A traditional chicken Karahi passed down from grandmother, standardized with measurements and formatted in bilingual text.",
        descriptionUr: "دادی اماں کی روایتی چکن کڑاہی، جس کی پیمائش کو یکساں کیا گیا ہے اور دو لسانی متن میں فارمیٹ کیا گیا ہے۔",
        ingredientsEn: ["Chicken 500g", "Tomatoes 4 units (no onions)", "Ginger 1 tbsp", "Garlic 1 tbsp", "Green Chilies 4 units", "Black Pepper 1/2 tsp", "Oil 4 tbsp", "Salt 1 tsp"],
        ingredientsUr: ["چکن 500 گرام", "ٹماٹر 4 عدد (پیاز نہیں ڈالنی!)", "ادرک 1 چمچ", "لہسن 1 چمچ", "ہری مرچیں 4 عدد", "کالی مرچ آدھا چمچ", "تیل 4 چمچ", "نمک 1 چمچ"],
        instructionsEn: [
          "Heat oil in a wok (karahi) and fry chicken on high heat for 5 minutes with ginger-garlic paste until color changes.",
          "Cut tomatoes in halves and lay them skin-side up over the chicken. Cover and simmer for 10 minutes.",
          "Remove tomato skins and mash them into the chicken. Stir fry on high heat to dry the excess water.",
          "Add slit green chilies, julienned ginger, and freshly crushed black pepper.",
          "Sauté until the gravy clings to the chicken and oil separates on the sides."
        ],
        instructionsUr: [
          "کڑاہی میں تیل گرم کریں اور چکن کو تیز آنچ پر ادرک لہسن کے پیسٹ کے ساتھ 5 منٹ تک فرائی کریں جب تک رنگ تغییر نہ ہو جائے۔",
          "ٹماٹروں کو درمیان سے کاٹ کر چکن کے اوپر رکھ دیں۔ برتن ڈھانپیں اور 10 منٹ تک ہلکی آنچ پر پکنے دیں۔",
          "ٹماٹر کے چھلکے اتار کر انہیں چکن میں اچھی طرح میش کریں۔ اضافی پانی خشک کرنے کے لیے تیز آنچ پر بھونیں۔",
          "لمبائی میں کٹی ہری مرچیں، باریک کٹی ادرک اور تازہ پسی ہوئی کالی مرچ شامل کریں۔",
          "یہاں تک بھونیں کہ مصالحہ چکن کے ساتھ لگ جائے اور اطراف میں تیل الگ ہو جائے۔"
        ],
        regionEn: "Peshawar",
        regionUr: "پشاور",
        cuisineEn: "Pakistani",
        cuisineUr: "پاکستانی",
        timeEn: "30 mins",
        timeUr: "30 منٹ",
        difficultyEn: "Medium",
        difficultyUr: "درمیانہ",
        upvotes: 1,
        views: 1,
        cookedSafely: 1,
        costTier: "$$",
        occasions: ["Quick"],
        authorName: TarkaDB.getProfile().name,
        authorTierEn: TarkaDB.getProfile().badge,
        authorTierUr: lang === 'ur' ? 'رائزنگ اسٹار' : 'Rising Star',
        markets: [market as any]
      };
      
      setTimeout(() => {
        setProcessing(false);
        setResult(fallbackRecipe);
        setPreviewLang('en');
      }, 300);
    }, 1350);
  };

  const handleSaveRecipe = async (saveToPrivateOnly: boolean) => {
    if (!result) return;
    
    try {
      await TarkaDB.publishRecipeToCloud(result);
      
      if (saveToPrivateOnly) {
        const vaultIds = TarkaDB.getVaultIds();
        if (!vaultIds.includes(result.id)) {
          vaultIds.push(result.id);
        }
        await TarkaDB.saveUserVaultCloud(vaultIds);
        alert(dict.saveSuccess);
      } else {
        // Award User +50 XP for publishing
        const profile = TarkaDB.getProfile();
        profile.xp += 50;
        if (profile.xp >= 100) {
          profile.level += 1;
          profile.xp = profile.xp - 100;
          profile.badge = "Sufi Chef";
        }
        await TarkaDB.saveUserProfileCloud(profile);
        window.dispatchEvent(new Event('profileChange'));
        alert(dict.saveSuccess + " +50 XP awarded!");
      }
      navigate({ to: '/' });
    } catch (err) {
      console.error("Save recipe failed:", err);
      alert("Failed to save recipe: " + String(err));
    }
    setResult(null);
  };

  // --- Interactive Editing Handlers ---
  const handleIngredientChange = (idx: number, isUr: boolean, val: string) => {
    if (!result) return;
    const arrayKey = isUr ? 'ingredientsUr' : 'ingredientsEn';
    const updated = [...result[arrayKey]];
    updated[idx] = val;
    setResult({ ...result, [arrayKey]: updated });
  };

  const handleAddIngredient = () => {
    if (!result) return;
    setResult({
      ...result,
      ingredientsEn: [...result.ingredientsEn, ""],
      ingredientsUr: [...result.ingredientsUr, ""]
    });
  };

  const handleRemoveIngredient = (idx: number) => {
    if (!result) return;
    setResult({
      ...result,
      ingredientsEn: result.ingredientsEn.filter((_, i) => i !== idx),
      ingredientsUr: result.ingredientsUr.filter((_, i) => i !== idx)
    });
  };

  const handleStepChange = (idx: number, isUr: boolean, val: string) => {
    if (!result) return;
    const arrayKey = isUr ? 'instructionsUr' : 'instructionsEn';
    const updated = [...result[arrayKey]];
    updated[idx] = val;
    setResult({ ...result, [arrayKey]: updated });
  };

  const handleAddStep = () => {
    if (!result) return;
    setResult({
      ...result,
      instructionsEn: [...result.instructionsEn, ""],
      instructionsUr: [...result.instructionsUr, ""]
    });
  };

  const handleRemoveStep = (idx: number) => {
    if (!result) return;
    setResult({
      ...result,
      instructionsEn: result.instructionsEn.filter((_, i) => i !== idx),
      instructionsUr: result.instructionsUr.filter((_, i) => i !== idx)
    });
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
              accept="image/*,application/pdf" 
            />
          </div>
        )}

        {/* Option B: Camera Viewfinder */}
        {ocrMode === 'camera' && (
          <div className="relative aspect-[4/3] bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden flex flex-col items-center justify-center">
            
            {/* Shutter flash overlay */}
            <div className={`absolute inset-0 bg-white z-50 transition-opacity duration-150 pointer-events-none ${flashActive ? 'opacity-100' : 'opacity-0'}`}></div>
            
            {/* WebRTC Video or Simulation Guide */}
            {stream && !cameraError ? (
              <video 
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover z-10"
                playsInline
                muted
              />
            ) : (
              <div className="flex flex-col items-center gap-3 p-4 z-10 text-center select-none pointer-events-none">
                <div className="w-[180px] bg-zinc-900 border border-zinc-800 shadow-2xl p-3 text-left font-serif leading-normal transform -rotate-1 opacity-70">
                  <h5 className="text-[10px] font-bold text-orange-400 border-b border-zinc-800 pb-1">نانی اماں کی کڑاہی</h5>
                  <p className="text-[8px] text-zinc-400 mt-1.5">- آدھا کلو چکن</p>
                  <p className="text-[8px] text-zinc-400">- ٹماٹر 4 عدد (پیاز نہیں ڈالنی!)</p>
                  <p className="text-[8px] text-zinc-400">- کالی مرچ آدھا چمچ</p>
                </div>
                {cameraError && (
                  <p className="text-[9px] text-zinc-500 max-w-xs">{dict.cameraErrText}</p>
                )}
              </div>
            )}

            {/* Contour guidelines */}
            <div className="absolute inset-8 border border-white/15 rounded-lg pointer-events-none flex items-center justify-center z-20">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/60"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/60"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/60"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/60"></div>
            </div>

            {/* Grid overlay */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-20 pointer-events-none z-20">
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

        {/* Error State with options to Simulation or Retry */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 p-5 rounded-2xl flex flex-col gap-4 text-left">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <h3 className="font-bold text-white text-sm">{dict.errTitle}</h3>
            </div>
            <p className="text-xs text-red-200/80 leading-relaxed">{error}</p>
            
            {/* Context help for missing keys */}
            {error.includes("not configured") && (
              <p className="text-[10px] text-zinc-400 bg-zinc-950/40 p-2.5 rounded-lg">
                💡 Set `VITE_GEMINI_API_KEY` on your development environment to connect live, or run in Simulation Mode to mock the OCR parser step.
              </p>
            )}

            <div className="flex gap-2.5 mt-2">
              <button 
                onClick={runSimulation}
                className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs py-2 px-3 rounded-xl font-bold transition-all"
              >
                {dict.btnSimulation}
              </button>
              <button 
                onClick={() => { setError(null); triggerUpload(); }}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-zinc-800 text-white text-xs py-2 px-3 rounded-xl font-bold transition-all"
              >
                {dict.btnRetry}
              </button>
            </div>
          </div>
        )}

        {/* Preview result */}
        {result && (
          <div className="flex flex-col gap-4">
            <div className="text-xs font-bold text-orange-400 flex items-center justify-between">
              <span className="flex items-center gap-1">✨ {dict.previewTitleLabel}</span>
              
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg border border-zinc-700 transition-all"
              >
                {isEditing ? dict.btnDone : dict.btnEdit}
              </button>
            </div>

            {/* Language tabs */}
            {!isEditing && (
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
            )}

            {/* Editable Form Mode */}
            {isEditing ? (
              <div className="border border-zinc-800 p-5 rounded-2xl bg-zinc-950/50 flex flex-col gap-4 text-left text-xs text-zinc-300">
                {/* Titles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-bold">{dict.lblEditTitleEn}</label>
                    <input 
                      type="text" 
                      value={result.titleEn}
                      onChange={(e) => setResult({ ...result, titleEn: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-white outline-none focus:border-orange-500/50 text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[10px] text-zinc-400 font-bold">{dict.lblEditTitleUr}</label>
                    <input 
                      type="text" 
                      value={result.titleUr}
                      onChange={(e) => setResult({ ...result, titleUr: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-white outline-none focus:border-orange-500/50 text-xs text-right font-urdu-nastaliq"
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-bold">{dict.lblEditDescEn}</label>
                    <textarea 
                      value={result.descriptionEn}
                      onChange={(e) => setResult({ ...result, descriptionEn: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-white outline-none focus:border-orange-500/50 text-xs h-20 resize-none"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[10px] text-zinc-400 font-bold">{dict.lblEditDescUr}</label>
                    <textarea 
                      value={result.descriptionUr}
                      onChange={(e) => setResult({ ...result, descriptionUr: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-white outline-none focus:border-orange-500/50 text-xs h-20 resize-none text-right font-urdu-nastaliq"
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-bold">{dict.lblEditRegionEn}</label>
                    <input 
                      type="text" 
                      value={result.regionEn}
                      onChange={(e) => setResult({ ...result, regionEn: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 p-2 rounded-xl text-white outline-none focus:border-orange-500/50 text-[11px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[10px] text-zinc-400 font-bold">{dict.lblEditRegionUr}</label>
                    <input 
                      type="text" 
                      value={result.regionUr}
                      onChange={(e) => setResult({ ...result, regionUr: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 p-2 rounded-xl text-white outline-none focus:border-orange-500/50 text-[11px] text-right font-urdu-nastaliq"
                      dir="rtl"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-bold">{dict.lblEditCuisineEn}</label>
                    <input 
                      type="text" 
                      value={result.cuisineEn}
                      onChange={(e) => setResult({ ...result, cuisineEn: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 p-2 rounded-xl text-white outline-none focus:border-orange-500/50 text-[11px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[10px] text-zinc-400 font-bold">{dict.lblEditCuisineUr}</label>
                    <input 
                      type="text" 
                      value={result.cuisineUr}
                      onChange={(e) => setResult({ ...result, cuisineUr: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 p-2 rounded-xl text-white outline-none focus:border-orange-500/50 text-[11px] text-right font-urdu-nastaliq"
                      dir="rtl"
                    />
                  </div>
                </div>

                {/* Additional metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 border-b border-zinc-800 pb-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-bold">{dict.lblEditTimeEn}</label>
                    <input 
                      type="text" 
                      value={result.timeEn}
                      onChange={(e) => setResult({ ...result, timeEn: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 p-2 rounded-xl text-white outline-none focus:border-orange-500/50 text-[11px]"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-right">
                    <label className="text-[10px] text-zinc-400 font-bold">{dict.lblEditTimeUr}</label>
                    <input 
                      type="text" 
                      value={result.timeUr}
                      onChange={(e) => setResult({ ...result, timeUr: e.target.value })}
                      className="bg-zinc-950 border border-zinc-800 p-2 rounded-xl text-white outline-none focus:border-orange-500/50 text-[11px] text-right font-urdu-nastaliq"
                      dir="rtl"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-bold">{dict.lblEditCost}</label>
                    <select 
                      value={result.costTier}
                      onChange={(e) => setResult({ ...result, costTier: e.target.value as any })}
                      className="bg-zinc-950 border border-zinc-800 p-2 rounded-xl text-white outline-none focus:border-orange-500/50 text-[11px]"
                    >
                      <option value="$">$</option>
                      <option value="$$">$$</option>
                      <option value="$$$">$$$</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-zinc-400 font-bold">{dict.lblOccasion}</label>
                    <input 
                      type="text" 
                      value={result.occasions.join(', ')}
                      onChange={(e) => setResult({ ...result, occasions: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="bg-zinc-950 border border-zinc-800 p-2 rounded-xl text-white outline-none focus:border-orange-500/50 text-[11px]"
                    />
                  </div>
                </div>

                {/* Ingredients section */}
                <div className="flex flex-col gap-2.5">
                  <div className="font-bold text-white text-[11px] uppercase tracking-wider">{dict.lblIngredients}</div>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {result.ingredientsEn.map((ing, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          type="text" 
                          placeholder={dict.lblIngEn}
                          value={ing}
                          onChange={(e) => handleIngredientChange(idx, false, e.target.value)}
                          className="flex-1 bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-white text-[11px] outline-none"
                        />
                        <input 
                          type="text" 
                          placeholder={dict.lblIngUr}
                          value={result.ingredientsUr[idx] || ''}
                          onChange={(e) => handleIngredientChange(idx, true, e.target.value)}
                          className="flex-1 bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-white text-[11px] outline-none text-right font-urdu-nastaliq"
                          dir="rtl"
                        />
                        <button 
                          onClick={() => handleRemoveIngredient(idx)}
                          className="w-7 h-7 bg-red-950/30 hover:bg-red-900/40 border border-red-900/30 text-red-400 rounded-lg font-bold flex items-center justify-center text-[10px]"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleAddIngredient}
                    className="self-start text-[10px] bg-zinc-950 hover:bg-zinc-900 text-orange-400 border border-zinc-800 px-3 py-1.5 rounded-lg transition-all font-semibold"
                  >
                    {dict.btnAddIngredient}
                  </button>
                </div>

                {/* Steps section */}
                <div className="flex flex-col gap-2.5 border-t border-zinc-800 pt-4">
                  <div className="font-bold text-white text-[11px] uppercase tracking-wider">{dict.lblInstructions}</div>
                  <div className="flex flex-col gap-3 max-h-48 overflow-y-auto pr-1">
                    {result.instructionsEn.map((step, idx) => (
                      <div key={idx} className="flex gap-2 items-start">
                        <span className="text-[10px] text-zinc-500 font-mono mt-2">{idx + 1}.</span>
                        <textarea 
                          placeholder={dict.lblStepEn}
                          value={step}
                          onChange={(e) => handleStepChange(idx, false, e.target.value)}
                          className="flex-1 bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-white text-[11px] outline-none h-14 resize-none"
                        />
                        <textarea 
                          placeholder={dict.lblStepUr}
                          value={result.instructionsUr[idx] || ''}
                          onChange={(e) => handleStepChange(idx, true, e.target.value)}
                          className="flex-1 bg-zinc-950 border border-zinc-800 p-2 rounded-lg text-white text-[11px] outline-none h-14 resize-none text-right font-urdu-nastaliq"
                          dir="rtl"
                        />
                        <button 
                          onClick={() => handleRemoveStep(idx)}
                          className="w-7 h-7 bg-red-950/30 hover:bg-red-900/40 border border-red-900/30 text-red-400 rounded-lg font-bold flex items-center justify-center text-[10px] mt-3"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={handleAddStep}
                    className="self-start text-[10px] bg-zinc-950 hover:bg-zinc-900 text-orange-400 border border-zinc-800 px-3 py-1.5 rounded-lg transition-all font-semibold"
                  >
                    {dict.btnAddStep}
                  </button>
                </div>
              </div>
            ) : (
              /* Beautiful Formatted Card Mode */
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
                    {(previewLang === 'ur' ? result.ingredientsUr : result.ingredientsEn).map((ing, idx) => (
                      ing.trim() && (
                        <span key={idx} className="text-[10px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full text-zinc-300">{ing}</span>
                      )
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="text-xs font-bold text-white">{dict.lblInstructions}</div>
                  <ol className="list-decimal list-inside text-xs text-zinc-400 flex flex-col gap-1">
                    {(previewLang === 'ur' ? result.instructionsUr : result.instructionsEn).map((step, idx) => (
                      step.trim() && (
                        <li key={idx}>{step}</li>
                      )
                    ))}
                  </ol>
                </div>
              </div>
            )}

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
