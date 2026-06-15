export type Lang = "en" | "ar";

const en = {
  // Header / nav
  langToggle: "العربية",

  // Game page
  subtitle: "Classic Mode — listen to the clip, then drop a pin where you think the speaker is from.",
  clipOf: (current: number, total: number) => `Clip ${current} of ${total}`,

  // Video player
  clickToListen: "Click to listen",

  // Map instructions
  instructionsBefore: "Click anywhere on the map to drop your guess pin, then submit.",
  instructionsAfter: "Green pin = actual location. Dashed line shows how far off your guess was.",

  // Buttons
  submitGuess: "Submit guess",
  resetPin: "Reset pin",
  nextClip: "Next clip →",
  playAgain: "Play again",
  resetZoom: "Reset zoom",

  // Score panel
  points: (score: number, max: number) =>
    `${score.toLocaleString()} / ${max.toLocaleString()} points`,
  kmFrom: (km: number, city: string, country: string) =>
    `${km.toLocaleString()} km from ${city}, ${country}`,
  distanceLabel: "Distance",
  dialectLabel: "Dialect",
  cityBonusLabel: "City bonus",
  relExact: "Right dialect",
  relAdjacent: "Closely related dialect",
  relMacro: "Same broad family",
  relNone: "Different dialect family",
  guessedNearest: (city: string, cluster: string) =>
    `Your guess landed nearest to ${city} (${cluster}).`,
  revealFallback: "Reveal text coming soon.",

  // Summary screen
  summaryTitle: "Round complete",
  viewResults: "View results",
  tierLabel: (pct: number): string => {
    if (pct >= 0.9) return "Dialect Master";
    if (pct >= 0.75) return "Regional Expert";
    if (pct >= 0.6) return "Solid Guesser";
    if (pct >= 0.4) return "Still Learning";
    return "Just Starting";
  },
  clipLabel: (n: number) => `Clip ${n}`,

  // Home page
  homeSubtitle:
    "Listen to a short clip of Arabic speech and drop a pin where you think the speaker is from. Scoring rewards dialect knowledge, not just geography.",
  playClassic: "Play Classic Mode",
};

const ar: typeof en = {
  langToggle: "English",

  subtitle: "الوضع الكلاسيكي — استمع إلى المقطع، ثم ضع دبوسك على الخريطة حيث تظنّ أن المتحدث من هناك.",
  clipOf: (current: number, total: number) => `مقطع ${current} من ${total}`,

  clickToListen: "انقر للاستماع",

  instructionsBefore: "انقر في أي مكان على الخريطة لوضع دبوس تخمينك، ثم أرسل.",
  instructionsAfter: "الدبوس الأخضر = الموقع الفعلي. يُظهر الخط المتقطع مدى بُعد تخمينك.",

  submitGuess: "أرسل تخمينك",
  resetPin: "أعد تعيين الدبوس",
  nextClip: "← المقطع التالي",
  playAgain: "العب مجدداً",
  resetZoom: "إعادة ضبط التكبير",

  points: (score: number, max: number) =>
    `${score.toLocaleString()} / ${max.toLocaleString()} نقطة`,
  kmFrom: (km: number, city: string, country: string) =>
    `${km.toLocaleString()} كم من ${city}، ${country}`,
  distanceLabel: "المسافة",
  dialectLabel: "اللهجة",
  cityBonusLabel: "مكافأة المدينة",
  relExact: "اللهجة الصحيحة",
  relAdjacent: "لهجة قريبة",
  relMacro: "نفس المجموعة اللغوية الكبرى",
  relNone: "مجموعة لهجة مختلفة",
  guessedNearest: (city: string, cluster: string) =>
    `وقع تخمينك بالقرب من ${city} (${cluster}).`,
  revealFallback: "نص الكشف قادم قريباً.",

  // Summary screen
  summaryTitle: "انتهت الجولة",
  viewResults: "عرض النتائج",
  tierLabel: (pct: number): string => {
    if (pct >= 0.9) return "عارف اللهجات";
    if (pct >= 0.75) return "خبير إقليمي";
    if (pct >= 0.6) return "مخمّن جيد";
    if (pct >= 0.4) return "في طور التعلم";
    return "بداية الطريق";
  },
  clipLabel: (n: number) => `مقطع ${n}`,

  homeSubtitle:
    "استمع إلى مقطع قصير من الكلام العربي وضع دبوساً على الخريطة حيث تعتقد أن المتحدث من هناك. يكافئ التسجيل معرفة اللهجة، وليس الجغرافيا وحدها.",
  playClassic: "ابدأ اللعب",
};

export const translations: Record<Lang, typeof en> = { en, ar };
