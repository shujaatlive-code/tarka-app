import React, { useState, useEffect } from 'react';
import { Outlet, Link } from '@tanstack/react-router';
import { TarkaDB } from '../services/db';
import { auth } from '../services/firebase';
import { 
  EmailAuthProvider, 
  linkWithCredential, 
  signInWithEmailAndPassword, 
  signOut,
  createUserWithEmailAndPassword
} from 'firebase/auth';

// Main bilingual dictionaries
const menuTranslations: Record<string, Record<string, string>> = {
  en: {
    logo: "ت",
    title: "Tarka",
    sub: "تڑکا",
    navFeed: "🍲 Dastarkhwan",
    navMatcher: "🎯 Tarka Matcher",
    navDegchi: "🍳 Degchi AI",
    level: "Level",
    xp: "XP",
    authModalTitle: "Culinary Identity",
    authGuestAlert: "Guest session active. Secure your levels, XP, and digitized private vault recipes by linking to a cloud account.",
    authSecureBtn: "🔑 Create Account / Link Progress",
    authLoginBtn: "Already have an account? Log In",
    authLoggedAs: "Logged in securely as:",
    authLogoutBtn: "🚪 Log Out",
    authSaveBtn: "✓ Save Profile Details",
    authSignupTitle: "Create Tarka Account",
    authLoginTitle: "Log In to Tarka",
    authEmailPlaceholder: "Email address",
    authPasswordPlaceholder: "Secure password",
    authNamePlaceholder: "Your full name",
    authSwitchSignup: "Need an account? Sign Up",
    authSwitchLogin: "Have an account? Log In",
    authBtnSubmitLogin: "Log In",
    authBtnSubmitSignup: "Sign Up & Link",
    authBack: "← Back",
    authErrorHeader: "Auth Error:"
  },
  ur: {
    logo: "ت",
    title: "تڑکا",
    sub: "Tarka",
    navFeed: "دسترخوان 🍲",
    navMatcher: "تڑکا میچر 🎯",
    navDegchi: "دیگچی اے آئی 🍳",
    level: "لیول",
    xp: "ایکس پی",
    authModalTitle: "شناخت اور اکاؤنٹ",
    authGuestAlert: "مہمان سیشن فعال ہے۔ بادل اکاؤنٹ بنا کر اپنی ترقی، ایکس پی اور ذاتی والٹ کی ترکیبیں محفوظ کریں۔",
    authSecureBtn: "🔑 اکاؤنٹ بنائیں / سیشن محفوظ کریں",
    authLoginBtn: "پہلے سے اکاؤنٹ ہے؟ لاگ ان کریں",
    authLoggedAs: "کامیابی سے لاگ ان ہیں:",
    authLogoutBtn: "🚪 لاگ آؤٹ کریں",
    authSaveBtn: "✓ معلومات محفوظ کریں",
    authSignupTitle: "تڑکا اکاؤنٹ بنائیں",
    authLoginTitle: "تڑکا میں لاگ ان کریں",
    authEmailPlaceholder: "ای میل ایڈریس",
    authPasswordPlaceholder: "خفیہ پاس ورڈ",
    authNamePlaceholder: "آپ کا پورا نام",
    authSwitchSignup: "اکاؤنٹ نہیں ہے؟ سائن اپ کریں",
    authSwitchLogin: "اکاؤنٹ ہے؟ لاگ ان کریں",
    authBtnSubmitLogin: "لاگ ان کریں",
    authBtnSubmitSignup: "سائن اپ اور لنک کریں",
    authBack: "← واپس",
    authErrorHeader: "غلطی:"
  }
};

const avatarPresets = ['🥗', '🍛', '🍳', '🍕', '🍔', '🍰', '🌶️', '🍲', '👩‍🍳', '👨‍🍳', '🥣', '🍞'];

export default function RootLayout() {
  const [lang, setLang] = useState<string>(localStorage.getItem('tarka_lang') || 'en');
  const [market, setMarket] = useState<string>(localStorage.getItem('tarka_market') || 'PK');
  const [profile, setProfile] = useState(TarkaDB.getProfile());

  // Auth/Profile Modal States
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authView, setAuthView] = useState<'profile' | 'login' | 'signup'>('profile');
  const [editName, setEditName] = useState<string>(profile.name);
  const [editAvatar, setEditAvatar] = useState<string>(profile.avatar);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [modalLoading, setModalLoading] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  useEffect(() => {
    // Apply lang direction details to document HTML
    const dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', dir);
    localStorage.setItem('tarka_lang', lang);
    window.dispatchEvent(new Event('langChange'));
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('tarka_market', market);
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

  const openAuthModal = () => {
    const p = TarkaDB.getProfile();
    setEditName(p.name);
    setEditAvatar(p.avatar);
    setEmail('');
    setPassword('');
    setModalError(null);
    setAuthView('profile');
    setShowAuthModal(true);
  };

  // --- Auth submit actions ---
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError(null);
    try {
      const p = TarkaDB.getProfile();
      p.name = editName;
      p.avatar = editAvatar;
      await TarkaDB.saveUserProfileCloud(p);
      setProfile(p);
      window.dispatchEvent(new Event('profileChange'));
      setShowAuthModal(false);
    } catch (err) {
      setModalError(err instanceof Error ? err.message : String(err));
    } finally {
      setModalLoading(false);
    }
  };

  const handleSignUpAndLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setModalError("Please enter both email and password.");
      return;
    }
    setModalLoading(true);
    setModalError(null);
    try {
      const currentUserObj = auth.currentUser;
      const credential = EmailAuthProvider.credential(email, password);
      
      if (currentUserObj && currentUserObj.isAnonymous) {
        // Upgrades anonymous guest credentials to permanent email/password
        await linkWithCredential(currentUserObj, credential);
        console.log("Guest progress successfully linked to new account!");
      } else {
        // Standard email registration fallback
        await createUserWithEmailAndPassword(auth, email, password);
      }

      // Update name/avatar
      const p = TarkaDB.getProfile();
      p.name = editName;
      p.avatar = editAvatar;
      await TarkaDB.saveUserProfileCloud(p);
      setProfile(p);
      window.dispatchEvent(new Event('profileChange'));
      setAuthView('profile');
      alert("Account registered and progress secured!");
    } catch (err) {
      console.error("Sign up failure:", err);
      let msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("email-already-in-use")) {
        msg = "This email is already registered. Select 'Log In' instead.";
      } else if (msg.includes("weak-password")) {
        msg = "Password must be at least 6 characters.";
      } else if (msg.includes("invalid-email")) {
        msg = "Please enter a valid email address.";
      }
      setModalError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleLogIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setModalError("Please enter both email and password.");
      return;
    }
    setModalLoading(true);
    setModalError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Fetch user data from database and cache locally
      const cloudProfile = await TarkaDB.fetchUserProfileCloud();
      await TarkaDB.fetchUserVaultCloud();
      setProfile(cloudProfile);
      window.dispatchEvent(new Event('profileChange'));
      window.dispatchEvent(new Event('authReady'));
      setShowAuthModal(false);
      alert("Logged in successfully!");
    } catch (err) {
      console.error("Login failure:", err);
      let msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("invalid-credential") || msg.includes("user-not-found") || msg.includes("wrong-password")) {
        msg = "Invalid email or password. Please verify credentials.";
      }
      setModalError(msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleLogOut = async () => {
    if (!confirm("Are you sure you want to log out? Local data caches will be reset.")) return;
    setModalLoading(true);
    setModalError(null);
    try {
      await signOut(auth);
      // Reset local caches
      localStorage.removeItem('tarka_profile');
      localStorage.removeItem('tarka_vault_ids');
      localStorage.removeItem('tarka_recipes'); // Clears memory so fresh cloud sync runs
      
      const newProfile = TarkaDB.getProfile();
      setProfile(newProfile);
      window.dispatchEvent(new Event('profileChange'));
      window.dispatchEvent(new Event('authReady'));
      setShowAuthModal(false);
      alert("Logged out successfully! Guest session initialized.");
    } catch (err) {
      setModalError(err instanceof Error ? err.message : String(err));
    } finally {
      setModalLoading(false);
    }
  };

  const dict = menuTranslations[lang] || menuTranslations.en;
  const isAnonymousUser = !auth.currentUser || auth.currentUser.isAnonymous;

  return (
    <div className={`min-h-screen text-[oklch(var(--text-main))] bg-zinc-950/20 ${lang === 'ur' ? 'font-urdu-nastaliq' : 'font-sans'}`}>
      {/* Premium Header Shell */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-[oklch(var(--border))] glassmorphism">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 font-extrabold text-white rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 tarka-glow">
            {dict.logo}
          </div>
          <div className="flex flex-col text-left">
            <h1 className="text-xl font-extrabold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-white to-amber-400 leading-none">{dict.title}</h1>
            <span className="text-xs text-[oklch(var(--secondary))] tracking-wider mt-[1px]">{dict.sub}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* User profile badges */}
          <div 
            onClick={openAuthModal}
            className="flex items-center gap-3 px-3 py-1.5 rounded-full border border-[oklch(var(--border))] bg-white/5 cursor-pointer hover:bg-white/10 transition-all"
          >
            <div className="flex items-center justify-center w-7 h-7 text-xs font-bold text-white rounded-full bg-gradient-to-br from-orange-500 to-amber-500 shadow-md">
              {profile.avatar}
            </div>
            <div className="flex flex-col text-[10px] text-left">
              <span className="font-bold text-white leading-tight">{dict.level} {profile.level}</span>
              <div className="w-16 h-1 bg-white/10 rounded-full mt-0.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-500 to-amber-500" style={{ width: `${profile.xp}%` }}></div>
              </div>
            </div>
          </div>

          {/* Market selector */}
          <select 
            value={market} 
            onChange={handleMarketChange}
            className="bg-white/5 border border-[oklch(var(--border))] rounded-lg px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-orange-500 text-white cursor-pointer"
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
            className="px-5 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
            activeProps={{ className: 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' }}
            inactiveProps={{ className: 'text-zinc-400 hover:text-white hover:bg-white/5' }}
          >
            {dict.navFeed}
          </Link>
          <Link 
            to="/matcher" 
            className="px-5 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
            activeProps={{ className: 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' }}
            inactiveProps={{ className: 'text-zinc-400 hover:text-white hover:bg-white/5' }}
          >
            {dict.navMatcher}
          </Link>
          <Link 
            to="/degchi" 
            className="px-5 py-2 text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
            activeProps={{ className: 'bg-orange-500 text-white shadow-lg shadow-orange-500/25' }}
            inactiveProps={{ className: 'text-zinc-400 hover:text-white hover:bg-white/5' }}
          >
            {dict.navDegchi}
          </Link>
        </div>
      </nav>

      {/* Page Content Outlet */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>

      {/* --- Account & Identity Management Modal --- */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-3xl max-w-sm w-full relative shadow-2xl flex flex-col gap-5 text-left text-zinc-300">
            {/* Close */}
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 w-7 h-7 bg-zinc-950/40 hover:bg-zinc-800 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition-all text-xs font-bold"
            >
              ✕
            </button>

            {/* View A: Profile Details & Link Invitation */}
            {authView === 'profile' && (
              <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                <h3 className="font-extrabold text-white text-base tracking-tight">{dict.authModalTitle}</h3>
                
                {/* Error Box */}
                {modalError && (
                  <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl text-red-400 text-xs leading-relaxed">
                    <strong>{dict.authErrorHeader}</strong> {modalError}
                  </div>
                )}

                {/* Display Name */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">{dict.authNamePlaceholder}</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                    className="bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl text-white outline-none focus:border-orange-500/50 text-xs"
                  />
                </div>

                {/* Emojis Preset Selector */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Choose Cooking Avatar</label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {avatarPresets.map(av => (
                      <button
                        key={av}
                        type="button"
                        onClick={() => setEditAvatar(av)}
                        className={`w-9 h-9 text-lg rounded-lg flex items-center justify-center border transition-all ${editAvatar === av ? 'bg-orange-500/15 border-orange-500 text-orange-400' : 'bg-zinc-950 border-zinc-850 hover:bg-zinc-800'}`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save details */}
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-orange-500/10 flex items-center justify-center"
                >
                  {modalLoading ? "Saving..." : dict.authSaveBtn}
                </button>

                {/* Account Security Mappings */}
                <div className="border-t border-zinc-800/80 pt-4 mt-1 flex flex-col gap-3">
                  {isAnonymousUser ? (
                    <>
                      <div className="bg-orange-500/5 border border-orange-500/15 p-3 rounded-xl text-[10px] text-orange-400/90 leading-relaxed">
                        ⚠️ {dict.authGuestAlert}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setModalError(null); setAuthView('signup'); }}
                        className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
                      >
                        {dict.authSecureBtn}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setModalError(null); setAuthView('login'); }}
                        className="text-[10px] text-orange-400 font-bold hover:underline text-center"
                      >
                        {dict.authLoginBtn}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">
                        {dict.authLoggedAs} <span className="text-white normal-case font-normal ml-1">{auth.currentUser?.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleLogOut}
                        disabled={modalLoading}
                        className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs py-2.5 px-4 rounded-xl transition-all"
                      >
                        {dict.authLogoutBtn}
                      </button>
                    </>
                  )}
                </div>
              </form>
            )}

            {/* View B: Sign Up & Link */}
            {authView === 'signup' && (
              <form onSubmit={handleSignUpAndLink} className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => { setModalError(null); setAuthView('profile'); }}
                    className="text-orange-400 font-bold text-xs hover:underline"
                  >
                    {dict.authBack}
                  </button>
                  <span className="text-zinc-600 text-xs">|</span>
                  <h3 className="font-extrabold text-white text-base tracking-tight">{dict.authSignupTitle}</h3>
                </div>

                {modalError && (
                  <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl text-red-400 text-xs leading-relaxed">
                    <strong>{dict.authErrorHeader}</strong> {modalError}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">{dict.authEmailPlaceholder}</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="user@example.com"
                    className="bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl text-white outline-none focus:border-orange-500/50 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">{dict.authPasswordPlaceholder}</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min 6 characters"
                    className="bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl text-white outline-none focus:border-orange-500/50 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={modalLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-orange-500/10 flex items-center justify-center mt-2"
                >
                  {modalLoading ? "Securing Progress..." : dict.authBtnSubmitSignup}
                </button>

                <button
                  type="button"
                  onClick={() => { setModalError(null); setAuthView('login'); }}
                  className="text-[10px] text-orange-400 font-bold hover:underline text-center mt-1"
                >
                  {dict.authSwitchLogin}
                </button>
              </form>
            )}

            {/* View C: Log In */}
            {authView === 'login' && (
              <form onSubmit={handleLogIn} className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <button 
                    type="button" 
                    onClick={() => { setModalError(null); setAuthView('profile'); }}
                    className="text-orange-400 font-bold text-xs hover:underline"
                  >
                    {dict.authBack}
                  </button>
                  <span className="text-zinc-600 text-xs">|</span>
                  <h3 className="font-extrabold text-white text-base tracking-tight">{dict.authLoginTitle}</h3>
                </div>

                {modalError && (
                  <div className="bg-red-500/10 border border-red-500/25 p-3 rounded-xl text-red-400 text-xs leading-relaxed">
                    <strong>{dict.authErrorHeader}</strong> {modalError}
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">{dict.authEmailPlaceholder}</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="user@example.com"
                    className="bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl text-white outline-none focus:border-orange-500/50 text-xs"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">{dict.authPasswordPlaceholder}</label>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter password"
                    className="bg-zinc-950 border border-zinc-850 p-2.5 rounded-xl text-white outline-none focus:border-orange-500/50 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={modalLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-md shadow-orange-500/10 flex items-center justify-center mt-2"
                >
                  {modalLoading ? "Logging In..." : dict.authBtnSubmitLogin}
                </button>

                <button
                  type="button"
                  onClick={() => { setModalError(null); setAuthView('signup'); }}
                  className="text-[10px] text-orange-400 font-bold hover:underline text-center mt-1"
                >
                  {dict.authSwitchSignup}
                </button>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
