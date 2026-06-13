// --- TypeScript Domain Typings ---

export interface Recipe {
  id: string;
  titleEn: string;
  titleUr: string;
  descriptionEn: string;
  descriptionUr: string;
  ingredientsEn: string[];
  ingredientsUr: string[];
  instructionsEn: string[];
  instructionsUr: string[];
  regionEn: string;
  regionUr: string;
  cuisineEn: string;
  cuisineUr: string;
  timeEn: string;
  timeUr: string;
  difficultyEn: string;
  difficultyUr: string;
  image?: string;
  upvotes: number;
  views: number;
  cookedSafely: number;
  costTier: '$' | '$$' | '$$$';
  occasions: string[];
  authorName: string;
  authorTierEn?: string;
  authorTierUr?: string;
  isTrending?: boolean;
  markets: ('PK' | 'UK' | 'EU')[];
  isParentRecipe?: boolean;
  parentRecipeId?: string;
  duplicatesGroup?: string[];
  communityTipsEn?: string[];
  communityTipsUr?: string[];
}

export interface UserProfile {
  name: string;
  avatar: string;
  xp: number;
  level: number;
  badge: string;
  badgesUnlocked: string[];
}

export interface TarkaShort {
  id: string;
  creatorHandle: string;
  creatorAvatar: string;
  creatorAvatarClass?: string;
  recipeId: string;
  titleEn: string;
  titleUr: string;
  views: string;
  upvotes: number;
  socialPlatform: string;
  socialLink: string;
  featuredDishEn: string;
  featuredDishUr: string;
  market: 'PK' | 'UK' | 'EU';
  isVerified?: boolean;
}

// --- Seed Data ---
export const seedRecipes: Recipe[] = [
  {
    id: "r1",
    titleEn: "Sindhi Chicken Biryani",
    titleUr: "سندھی چکن بریانی",
    descriptionEn: "A classic Karachi street-style Biryani, layered with fragrant basmati rice, tender spiced chicken, potatoes, sliced lemons, and mint.",
    descriptionUr: "ایک کلاسک کراچی اسٹریٹ اسٹائل بریانی، جس میں خوشبودار باسنتی چاول، نرم مسالہ دار چکن، آلو، لیموں کے سلائس اور پودینے کی تہیں لگی ہوتی ہیں۔",
    ingredientsEn: ["Basmati Rice", "Chicken", "Onions", "Tomatoes", "Yogurt", "Ginger Garlic Paste", "Biryani Masala", "Mint Leaves", "Green Chilies", "Oil", "Potatoes", "Lemon"],
    ingredientsUr: ["باسنتی چاول", "چکن", "پیاز", "ٹماٹر", "دہی", "ادرک لہسن کا پیسٹ", "بریانی مصالحہ", "پودینہ", "ہری مرچیں", "تیل", "آلو", "لیمو"],
    instructionsEn: [
      "Boil rice with whole spices until 70% cooked; drain and set aside.",
      "In a separate pot, fry onions until golden brown. Add ginger-garlic paste and chicken, sauteing until white.",
      "Add tomatoes, yogurt, potatoes, and Biryani Masala. Cook on medium heat until the chicken is tender and oil separates.",
      "Layer the cooked chicken gravy with lemon slices, green chilies, mint leaves, and the boiled rice on top.",
      "Drizzle saffron water/food coloring, cover tightly (Dam), and cook on low heat for 15 minutes."
    ],
    instructionsUr: [
      "چاولوں کو گرم مصالحوں کے ساتھ ابالیں جب تک کہ وہ 70 فیصد پک جائیں؛ پھر پانی نتھار کر الگ رکھ دیں۔",
      "ایک الگ برتن میں پیاز سنہری ہونے تک فرائی کریں۔ ادرک لہسن کا پیسٹ اور چکن شامل کریں اور سفید ہونے تک بھونیں۔",
      "ٹماٹر، دہی، آلو اور بریانی مصالحہ ڈالیں۔ درمیانی آنچ پر پکائیں یہاں تک کہ چکن نرم ہو جائے اور تیل الگ ہو جائے۔",
      "پکے ہوئے چکن کے سالن پر لیموں کے ٹکڑے، ہری مرچیں، پودینے کے پتے اور ابلے ہوئے چاولوں کی تہہ لگائیں۔",
      "زعفران کا پانی یا زردہ رنگ چھڑکیں، برتن کو اچھی طرح ڈھانپ دیں (دم پر رکھیں)، اور 15 منٹ تک ہلکی آنچ پر پکائیں۔"
    ],
    regionEn: "Karachi",
    regionUr: "کراچی",
    cuisineEn: "Pakistani",
    cuisineUr: "پاکستانی",
    timeEn: "50 mins",
    timeUr: "50 منٹ",
    difficultyEn: "Hard",
    difficultyUr: "مشکل",
    image: "chicken_biryani.png",
    upvotes: 245,
    views: 1890,
    cookedSafely: 160,
    costTier: "$$",
    occasions: ["Eid-ul-Fitr"],
    authorName: "Ayesha Khan",
    authorTierEn: "Sufi Chef",
    authorTierUr: "صوفی شیف",
    isTrending: true,
    markets: ["PK", "UK", "EU"],
    isParentRecipe: true,
    duplicatesGroup: ["r1_dup"],
    communityTipsEn: [
      "84% of home cooks recommend reducing salt in the chicken gravy by 1/2 tsp if using packed Biryani masala.",
      "Add 2 sliced yellow lemons directly under the rice layer during 'Dam' (steaming) for a authentic sour Sindhi touch.",
      "Using pre-soaked sella basmati rice ensures long, non-sticky grains."
    ],
    communityTipsUr: [
      "اگر آپ بازار کا ڈبہ بند بریانی مصالحہ استعمال کر رہے ہیں تو 84 فیصد باورچیوں کے مطابق نمک آدھا چائے کا چمچ کم رکھیں۔",
      "دم کے دوران چاولوں کے نیچے لیموں کے دو ٹکڑے رکھیں تاکہ روایتی سندھی کھٹا ذائقہ حاصل ہو سکے۔",
      "پہلے سے بھیگے ہوئے سیلا باسنتی چاول استعمال کرنے سے دانے لمبے اور غیر چپکنے والے بنتے ہیں۔"
    ]
  },
  {
    id: "r1_dup",
    titleEn: "Easy Chicken Biryani (Alternative)",
    titleUr: "آسان چکن بریانی (متبادل)",
    descriptionEn: "A simplified version of chicken Biryani for fast cooking. Uses instant pressure cooker methods.",
    descriptionUr: "تیز رفتاری سے پکانے کے لیے چکن بریانی کا ایک آسان ورژن۔ انسٹنٹ پریشر کوکر کا طریقہ استعمال کرتا ہے۔",
    ingredientsEn: ["Basmati Rice", "Chicken", "Onions", "Tomatoes", "Yogurt", "Ginger Garlic Paste", "Biryani Masala", "Oil"],
    ingredientsUr: ["باسنتی چاول", "چکن", "پیاز", "ٹماٹر", "دہی", "ادرک لہسن کا پیسٹ", "بریانی مصالحہ", "تیل"],
    instructionsEn: [
      "Sauté onions and chicken in pressure cooker. Add spices and tomatoes.",
      "Add soaked rice and water. Close lid and pressure cook for 2 whistles."
    ],
    instructionsUr: [
      "پریشر کوکر میں پیاز اور چکن کو بھونیں۔ مسالے اور ٹماٹر شامل کریں۔",
      "بھیگے ہوئے چاول اور پانی شامل کریں۔ ڈھکن بند کریں اور 2 سیٹیوں تک پکائیں۔"
    ],
    regionEn: "Lahore",
    regionUr: "لاہور",
    cuisineEn: "Pakistani",
    cuisineUr: "پاکستانی",
    timeEn: "25 mins",
    timeUr: "25 منٹ",
    difficultyEn: "Easy",
    difficultyUr: "آسان",
    image: "",
    upvotes: 42,
    views: 310,
    cookedSafely: 20,
    costTier: "$",
    occasions: ["Quick"],
    authorName: "Ali Raza",
    authorTierEn: "Rising Star",
    authorTierUr: "رائزنگ اسٹار",
    isTrending: false,
    markets: ["PK"],
    isParentRecipe: false,
    parentRecipeId: "r1"
  },
  {
    id: "r2",
    titleEn: "Peshawari Chicken Karahi",
    titleUr: "پشاورى چکن کڑاہی",
    descriptionEn: "Authentic highway-style Karahi cooked in a wok with fresh tomatoes, ginger juliennes, green chilies, and black pepper. No onions used!",
    descriptionUr: "شاہراہوں پر ملنے والی مستند پشاوری کڑاہی جو لوہے کی کڑاہی میں تازہ ٹماٹر، ادرک، ہری مرچ اور کالی مرچ کے ساتھ تیار کی جاتی ہے۔ پیاز کا استعمال نہیں ہوتا!",
    ingredientsEn: ["Chicken", "Tomatoes", "Ginger", "Garlic", "Green Chilies", "Black Pepper", "Salt", "Oil"],
    ingredientsUr: ["چکن", "ٹماٹر", "ادرک", "لہسن", "ہری مرچیں", "کالی مرچ", "نمک", "تیل"],
    instructionsEn: [
      "Heat oil in a wok (karahi) and fry chicken on high heat for 5 minutes with ginger-garlic paste until color changes.",
      "Cut tomatoes in halves and lay them skin-side up over the chicken. Cover and simmer for 10 minutes.",
      "Remove tomato skins and mash them into the chicken. Stir fry on high heat to dry the excess water.",
      "Add slit green chilies, julienned ginger, and freshly crushed black pepper.",
      "Sauté until the gravy clings to the chicken and oil separates on the sides."
    ],
    instructionsUr: [
      "کڑاہی میں تیل گرم کریں اور چکن کو تیز آنچ پر ادرک لہسن کے پیسٹ کے ساتھ 5 منٹ تک فرائی کریں جب تک رنگ تبدیل نہ ہو جائے۔",
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
    image: "chicken_karahi.png",
    upvotes: 189,
    views: 1420,
    cookedSafely: 130,
    costTier: "$$",
    occasions: ["Wedding Season"],
    authorName: "Zia-ur-Rehman",
    authorTierEn: "Tarka Master",
    authorTierUr: "تڑکا ماسٹر",
    isTrending: true,
    markets: ["PK", "UK"],
    isParentRecipe: true,
    duplicatesGroup: ["r2_dup"],
    communityTipsEn: [
      "78% of cooks recommend high heat stir frying at the end to ensure the tomato paste clings to the chicken properly.",
      "Do not add water at any point; the chicken cooks entirely in its own juices and tomato pulp.",
      "Using iron wok (Loha Karahi) adds a distinct smokey street flavor."
    ],
    communityTipsUr: [
      "78 فیصد باورچیوں کے مطابق آخر میں تیز آنچ پر بھونیں تاکہ ٹماٹر کا پیسٹ چکن کے ساتھ اچھی طرح لپٹ جائے۔",
      "کسی بھی مرحلے پر پانی شامل نہ کریں؛ چکن مکمل طور پر اپنے رس اور ٹماٹر کے گودے میں پکتا ہے۔",
      "لوہے کی کڑاہی کا استعمال سڑک کنارے ملنے والا منفرد اسموکی ذائقہ فراہم کرتا ہے۔"
    ]
  }
];

export const seedShorts: TarkaShort[] = [
  {
    id: "s1",
    creatorHandle: "@ayesha_cooks",
    creatorAvatar: "A",
    recipeId: "r1",
    titleEn: "My secret 3-step Biryani Dum! 🤫🍛",
    titleUr: "میری بریانی کے دم کا خفیہ طریقہ! 🤫🍛",
    views: "18.4K",
    upvotes: 1240,
    socialPlatform: "youtube",
    socialLink: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    featuredDishEn: "Sindhi Chicken Biryani",
    featuredDishUr: "سندھی چکن بریانی",
    market: "PK"
  }
];

// --- Local Repository Implementation ---
export const TarkaDB = {
  getRecipes(): Recipe[] {
    const raw = localStorage.getItem('tarka_recipes');
    return raw ? JSON.parse(raw) : seedRecipes;
  },

  saveRecipes(recipes: Recipe[]) {
    localStorage.setItem('tarka_recipes', JSON.stringify(recipes));
  },

  getProfile(): UserProfile {
    const raw = localStorage.getItem('tarka_profile');
    return raw ? JSON.parse(raw) : { name: "Shujat Ali", avatar: "S", xp: 45, level: 1, badge: "Rising Star", badgesUnlocked: ["First Digitization"] };
  },

  saveProfile(profile: UserProfile) {
    localStorage.setItem('tarka_profile', JSON.stringify(profile));
  },

  getPantry(): string[] {
    const raw = localStorage.getItem('tarka_pantry');
    return raw ? JSON.parse(raw) : ["Chicken", "Onions", "Tomatoes"];
  },

  savePantry(pantry: string[]) {
    localStorage.setItem('tarka_pantry', JSON.stringify(pantry));
  },

  getVaultIds(): string[] {
    const raw = localStorage.getItem('tarka_vault_ids');
    return raw ? JSON.parse(raw) : [];
  },

  saveVaultIds(vaultIds: string[]) {
    localStorage.setItem('tarka_vault_ids', JSON.stringify(vaultIds));
  },

  getUpvotes(): string[] {
    const raw = localStorage.getItem('tarka_upvoted_ids');
    return raw ? JSON.parse(raw) : [];
  },

  saveUpvotes(ids: string[]) {
    localStorage.setItem('tarka_upvoted_ids', JSON.stringify(ids));
  },

  getCooked(): string[] {
    const raw = localStorage.getItem('tarka_cooked_ids');
    return raw ? JSON.parse(raw) : [];
  },

  saveCooked(ids: string[]) {
    localStorage.setItem('tarka_cooked_ids', JSON.stringify(ids));
  },

  getCompletedSteps(): Record<string, number[]> {
    const raw = localStorage.getItem('tarka_completed_steps');
    return raw ? JSON.parse(raw) : {};
  },

  saveCompletedSteps(steps: Record<string, number[]>) {
    localStorage.setItem('tarka_completed_steps', JSON.stringify(steps));
  }
};

// --- Scoring Utilities ---
export function getVerificationWeight(recipe: Recipe): number {
  const upvotes = recipe.upvotes || 0;
  const cooked = recipe.cookedSafely || 0;
  const views = Math.max(recipe.views || 0, 1);
  return Number((upvotes * (cooked / views)).toFixed(2));
}
