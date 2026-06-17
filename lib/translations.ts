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
  nextClip: "Next clip",
  playAgain: "Play again",
  resetZoom: "Reset zoom",
  contribute: "Contribute",
  dialectMap: "Dialect Map",
  dialectMapSubtitle: "Explore Arabic dialects across the Arab world. Click any city or dialect to learn more.",
  clickToExplore: "Click a city or dialect to explore",
  citiesLabel: "Cities",
  macroGroupName: (id: string): string =>
    ({ maghrebi: "Maghrebi", egyptian: "Egyptian", levantine: "Levantine",
       mesopotamian: "Mesopotamian", peninsular: "Gulf & Peninsular",
       yemeni: "Yemeni", sudanese: "Sudanese",
       creole: "Creole & Mixed", peripheral: "Peripheral",
       classical: "Classical / Quranic" }[id] ?? id),

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

  // Contribute page
  contributeTitle: "Contribute a clip",
  contributeSubtitle: "Are you a native Arabic speaker? Record a quick audio clip in your browser, or upload a video of yourself speaking. Your clip may be used in the game.",
  guidelinesTitle: "Recording guidelines",
  guidelineNo1: "Don't mention your country, city, or region by name",
  guidelineNo2: "Avoid referencing local landmarks or places that would give away your location",
  guidelineYes1: "Talk naturally about everyday topics — food, family, weather, daily life",
  guidelineYes2: "Cultural references, traditions, and expressions are welcome",
  guidelineYes3: "Aim for 10–30 seconds of natural, conversational speech",
  tabRecord: "Record audio",
  tabUpload: "Upload video",
  orDivider: "or",
  uploadAudioHint: "Upload an audio file",
  uploadAudioFormats: "MP3, M4A, WAV — max 50 MB",
  tapToRecord: "Tap to start recording",
  recordingLabel: (time: string) => `Recording ${time}`,
  recordedLabel: (time: string) => `${time} recorded`,
  reRecord: "Re-record",
  uploadVideoHint: "Upload a short video of yourself speaking — face on camera or just audio-over-video is fine.",
  uploadFormats: "MP4, WebM, MOV — max 50 MB",
  countryLabel: "Country",
  countryPlaceholder: "Select your country",
  cityLabel: "City",
  cityPlaceholder: "e.g. Cairo",
  nameLabel: "Your name",
  nameOptional: "(optional)",
  namePlaceholder: "e.g. Ahmed",
  uploading: "Uploading…",
  submitClip: "Submit clip",
  successTitle: "Clip submitted",
  successBody: "Thank you for contributing. We'll review your clip and add it to the game.",
  submitAnother: "Submit another",
  backToHome: "Back to home",
  backLink: "← Back",
  signInToContributeTitle: "Sign in to contribute",
  signInToContributeBody: "You need an account to submit a clip. This lets us credit your contributions and keep the library spam-free.",
  signInCta: "Sign in or create account",
  micDenied: "Microphone access denied — please allow mic access and try again.",
  networkError: "Network error, please try again",
  somethingWrong: "Something went wrong",

  // Timer
  timesUp: "Time's up — 0 points",

  // Sound toggle
  muteSound: "Mute sounds",
  unmuteSound: "Unmute sounds",

  // Speed-bonus timer
  speedBonus: "Speed bonus",
  multiplierBreakdown: (base: number, mult: string, final: number) =>
    `${base.toLocaleString()} × ${mult} = ${final.toLocaleString()}`,

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
  nextClip: "المقطع التالي",
  playAgain: "العب مجدداً",
  resetZoom: "إعادة ضبط التكبير",
  contribute: "ساهم",
  dialectMap: "خريطة اللهجات",
  dialectMapSubtitle: "استكشف اللهجات العربية عبر العالم العربي. انقر على أي مدينة أو لهجة لمعرفة المزيد.",
  clickToExplore: "انقر على مدينة أو لهجة للاستكشاف",
  citiesLabel: "المدن",
  macroGroupName: (id: string): string =>
    ({ maghrebi: "المغاربية", egyptian: "المصرية", levantine: "الشامية",
       mesopotamian: "العراقية", peninsular: "الخليجية",
       yemeni: "اليمنية", sudanese: "السودانية",
       creole: "الكريولية والمختلطة", peripheral: "الهامشية",
       classical: "الفصحى / القرآنية" }[id] ?? id),

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

  // Contribute page
  contributeTitle: "ساهم بمقطع",
  contributeSubtitle: "هل أنت متحدث عربي أصلي؟ سجّل مقطعاً صوتياً سريعاً في متصفحك، أو ارفع فيديو لنفسك وأنت تتحدث. قد يُستخدم مقطعك في اللعبة.",
  guidelinesTitle: "إرشادات التسجيل",
  guidelineNo1: "لا تذكر اسم دولتك أو مدينتك أو منطقتك",
  guidelineNo2: "تجنّب الإشارة إلى معالم أو أماكن محلية تكشف موقعك",
  guidelineYes1: "تحدّث بشكل طبيعي عن مواضيع يومية — الطعام، العائلة، الطقس، الحياة اليومية",
  guidelineYes2: "المراجع الثقافية والتقاليد والتعبيرات مرحّب بها",
  guidelineYes3: "استهدف 10–30 ثانية من الكلام الطبيعي والعفوي",
  tabRecord: "تسجيل صوتي",
  tabUpload: "رفع فيديو",
  orDivider: "أو",
  uploadAudioHint: "ارفع ملفاً صوتياً",
  uploadAudioFormats: "MP3، M4A، WAV — الحد الأقصى 50 ميغابايت",
  tapToRecord: "اضغط للبدء",
  recordingLabel: (time: string) => `يُسجَّل ${time}`,
  recordedLabel: (time: string) => `تم تسجيل ${time}`,
  reRecord: "إعادة التسجيل",
  uploadVideoHint: "ارفع فيديو قصيراً لنفسك وأنت تتحدث — وجهاً للكاميرا أو صوتاً فقط.",
  uploadFormats: "MP4، WebM، MOV — الحد الأقصى 50 ميغابايت",
  countryLabel: "الدولة",
  countryPlaceholder: "اختر دولتك",
  cityLabel: "المدينة",
  cityPlaceholder: "مثال: القاهرة",
  nameLabel: "اسمك",
  nameOptional: "(اختياري)",
  namePlaceholder: "مثال: أحمد",
  uploading: "يُرفع…",
  submitClip: "إرسال المقطع",
  successTitle: "تم إرسال المقطع",
  successBody: "شكراً على مساهمتك. سنراجع مقطعك ونضيفه إلى اللعبة.",
  submitAnother: "أرسل مقطعاً آخر",
  backToHome: "العودة للرئيسية",
  backLink: "رجوع →",
  signInToContributeTitle: "سجّل الدخول للمساهمة",
  signInToContributeBody: "تحتاج إلى حساب لإرسال مقطع. هذا يتيح لنا نسب مساهماتك إليك والحفاظ على المكتبة خالية من العبث.",
  signInCta: "سجّل الدخول أو أنشئ حساباً",
  micDenied: "تم رفض الوصول إلى الميكروفون — يرجى السماح بالوصول والمحاولة مجدداً.",
  networkError: "خطأ في الشبكة، يرجى المحاولة مرة أخرى",
  somethingWrong: "حدث خطأ ما",

  // Timer
  timesUp: "انتهى الوقت — صفر نقاط",

  // Sound toggle
  muteSound: "كتم الأصوات",
  unmuteSound: "تفعيل الأصوات",

  // Speed-bonus timer
  speedBonus: "مكافأة السرعة",
  multiplierBreakdown: (base: number, mult: string, final: number) =>
    `${base.toLocaleString()} × ${mult} = ${final.toLocaleString()}`,

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
