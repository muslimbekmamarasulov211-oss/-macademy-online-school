/**
 * Homepage content (Uzbek, Latin script).
 *
 * ⚠️ SAMPLE DATA — every block marked `isSample: true` is illustrative content
 * approved by the project owner as a placeholder. It is labelled "Namuna"
 * (sample) in the UI and MUST be replaced with real data before launch:
 *   - subjects       → real course list
 *   - koreanCourse   → real Korean programme details
 *   - teachers       → real teachers (names, subjects, experience)
 *   - resultStats    → real, verifiable statistics
 *   - achievements   → real student results (with their consent)
 * Replace the values here; the components need no changes.
 */

/* --------------------------------------------------------------------------
   Courses — 18 subjects
   -------------------------------------------------------------------------- */

export type SubjectCategoryId = "aniq" | "tabiiy" | "tillar" | "ijtimoiy" | "imtihon";

export type SubjectCategory = { id: SubjectCategoryId; label: string };

export type Subject = {
  name: string;
  /** Short monogram shown on the course tile */
  symbol: string;
  category: SubjectCategoryId;
  description: string;
  featured?: boolean;
};

export const subjectCategories: SubjectCategory[] = [
  { id: "aniq", label: "Aniq fanlar" },
  { id: "tabiiy", label: "Tabiiy fanlar" },
  { id: "tillar", label: "Tillar" },
  { id: "ijtimoiy", label: "Ijtimoiy fanlar" },
  { id: "imtihon", label: "Xalqaro imtihonlar" },
];

export const subjectsAreSample = true;

export const subjects: Subject[] = [
  {
    name: "Matematika",
    symbol: "Mt",
    category: "aniq",
    description: "Algebra va geometriyadan olimpiada darajasigacha.",
  },
  {
    name: "Fizika",
    symbol: "Fz",
    category: "aniq",
    description: "Mexanikadan zamonaviy fizikagacha — masala va tajribalar orqali.",
  },
  {
    name: "Informatika",
    symbol: "If",
    category: "aniq",
    description: "Algoritmik fikrlash va kompyuter savodxonligi.",
  },
  {
    name: "Dasturlash",
    symbol: "</>",
    category: "aniq",
    description: "Python va web asoslaridan real loyihalargacha.",
  },
  {
    name: "Kimyo",
    symbol: "Ki",
    category: "tabiiy",
    description: "Nazariya, reaksiyalar va masala yechish koʻnikmalari.",
  },
  {
    name: "Biologiya",
    symbol: "Bi",
    category: "tabiiy",
    description: "Hujayradan ekotizimgacha — tizimli va qiziqarli.",
  },
  {
    name: "Geografiya",
    symbol: "Ge",
    category: "tabiiy",
    description: "Tabiiy va iqtisodiy geografiya, xaritalar bilan ishlash.",
  },
  {
    name: "Ingliz tili",
    symbol: "En",
    category: "tillar",
    description: "Boshlangʻichdan yuqori darajagacha: nutq, grammatika, yozuv.",
  },
  {
    name: "Koreys tili",
    symbol: "Ko",
    category: "tillar",
    description: "Hangul alifbosidan TOPIK imtihonigacha.",
    featured: true,
  },
  {
    name: "Rus tili",
    symbol: "Ru",
    category: "tillar",
    description: "Erkin muloqot va savodli yozish.",
  },
  {
    name: "Nemis tili",
    symbol: "De",
    category: "tillar",
    description: "A1 dan B2 gacha bosqichma-bosqich.",
  },
  {
    name: "Arab tili",
    symbol: "Ar",
    category: "tillar",
    description: "Alifbo, grammatika va oʻqish malakasi.",
  },
  {
    name: "Ona tili va adabiyot",
    symbol: "Ot",
    category: "tillar",
    description: "Imlo, grammatika va adabiy tahlil.",
  },
  {
    name: "Tarix",
    symbol: "Tx",
    category: "ijtimoiy",
    description: "Oʻzbekiston va jahon tarixi — sabab va oqibatlar.",
  },
  {
    name: "Huquq",
    symbol: "Hq",
    category: "ijtimoiy",
    description: "Davlat va huquq asoslari, fuqarolik savodxonligi.",
  },
  {
    name: "Iqtisodiyot",
    symbol: "Iq",
    category: "ijtimoiy",
    description: "Iqtisodiy fikrlash va moliyaviy savodxonlik.",
  },
  {
    name: "IELTS",
    symbol: "IE",
    category: "imtihon",
    description: "Toʻrt koʻnikma boʻyicha strategiya va mock testlar.",
  },
  {
    name: "SAT",
    symbol: "SA",
    category: "imtihon",
    description: "Math va Reading & Writing boʻlimlariga tayyorgarlik.",
  },
];

/* --------------------------------------------------------------------------
   Featured course — Korean
   -------------------------------------------------------------------------- */

export const koreanCourse = {
  isSample: true,
  title: "Koreys tili",
  hangul: "한국어",
  subtitle: "Hangul alifbosidan TOPIK sertifikatigacha",
  description:
    "Koreya madaniyati, taʼlimi va karyera imkoniyatlariga yoʻl ochuvchi tizimli dastur: oʻqish, yozish, tinglash va soʻzlashuv bir maromda rivojlanadi.",
  levels: [
    { name: "Boshlangʻich", exam: "TOPIK I", grade: "1–2 daraja" },
    { name: "Oʻrta", exam: "TOPIK II", grade: "3–4 daraja" },
    { name: "Yuqori", exam: "TOPIK II", grade: "5–6 daraja" },
  ],
  highlights: [
    "Hangul — oʻqish va yozishni noldan oʻrganish",
    "Kundalik muloqot va toʻgʻri talaffuz",
    "TOPIK formatidagi mashq va sinov testlari",
    "Koreya madaniyati bilan yaqindan tanishuv",
  ],
} as const;

/* --------------------------------------------------------------------------
   Teachers
   -------------------------------------------------------------------------- */

export type Teacher = {
  name: string;
  subject: string;
  experience: string;
  credential: string;
};

export const teachersAreSample = true;

export const teachers: Teacher[] = [
  {
    name: "Dilnoza R.",
    subject: "Ingliz tili · IELTS",
    experience: "9 yillik tajriba",
    credential: "IELTS 8.5",
  },
  {
    name: "Jasur T.",
    subject: "Matematika",
    experience: "11 yillik tajriba",
    credential: "Olimpiada murabbiyi",
  },
  {
    name: "Malika A.",
    subject: "Koreys tili",
    experience: "7 yillik tajriba",
    credential: "TOPIK II · 6-daraja",
  },
  {
    name: "Sardor K.",
    subject: "Fizika",
    experience: "8 yillik tajriba",
    credential: "Magistr, fizika",
  },
  {
    name: "Kamola Y.",
    subject: "Kimyo va biologiya",
    experience: "10 yillik tajriba",
    credential: "Tibbiyotga tayyorlov",
  },
  {
    name: "Bekzod N.",
    subject: "Dasturlash",
    experience: "6 yillik tajriba",
    credential: "Senior dasturchi",
  },
];

/* --------------------------------------------------------------------------
   Results
   -------------------------------------------------------------------------- */

export type ResultStat = { value: number; suffix?: string; label: string };

export type Achievement = {
  student: string;
  exam: string;
  score: string;
  note: string;
};

export const resultsAreSample = true;

export const resultStats: ResultStat[] = [
  { value: 1200, suffix: "+", label: "Oʻquvchilar" },
  { value: 150, suffix: "+", label: "IELTS 7.0 va undan yuqori" },
  { value: 80, suffix: "+", label: "TOPIK sertifikatlari" },
  { value: 300, suffix: "+", label: "Oliy taʼlimga kirganlar" },
];

export const achievements: Achievement[] = [
  { student: "Aziza S.", exam: "IELTS", score: "8.0", note: "Ingliz tili kursi bitiruvchisi" },
  { student: "Temur M.", exam: "TOPIK II", score: "6-daraja", note: "Koreys tili kursi" },
  { student: "Nodira X.", exam: "SAT", score: "1520", note: "Xalqaro universitetga grant" },
  { student: "Ulugʻbek R.", exam: "DTM", score: "189 ball", note: "Davlat granti" },
  {
    student: "Madina O.",
    exam: "Olimpiada",
    score: "1-oʻrin",
    note: "Respublika, matematika",
  },
  { student: "Javohir E.", exam: "CEFR", score: "C1", note: "Nemis tili kursi" },
];

/* --------------------------------------------------------------------------
   Learning journey (describes the intended process — not a claim of data)
   -------------------------------------------------------------------------- */

export const journeySteps = [
  { title: "Tanishuv", body: "Maqsadingiz va bilim darajangizni birgalikda aniqlaymiz." },
  { title: "Shaxsiy reja", body: "Siz uchun mos dastur, surʼat va dars jadvali tuziladi." },
  { title: "Tizimli darslar", body: "Ustoz bilan bosqichma-bosqich, amaliyot bilan mustahkamlab." },
  { title: "Nazorat va tahlil", body: "Muntazam testlar, fikr-mulohaza va shaxsiy tavsiyalar." },
  { title: "Natija", body: "Sertifikat, imtihon yoki yangi daraja — maqsadga erishish." },
] as const;

/* --------------------------------------------------------------------------
   About — principles (values, not claims)
   -------------------------------------------------------------------------- */

export const principles = [
  {
    title: "Tizimli taʼlim",
    body: "Har bir dastur aniq maqsad va bosqichlarga ega yoʻl sifatida quriladi.",
  },
  {
    title: "Eʼtiborli oʻqitish",
    body: "Sifat birinchi oʻrinda: tushunarli tushuntirish, maqsadli amaliyot, chuqur tahlil.",
  },
  {
    title: "Xalqaro yondashuv",
    body: "Istalgan davlatdagi oʻquvchi uchun — xalqaro standartlarga mos mazmun.",
  },
  {
    title: "Diqqat markazida — oʻquvchi",
    body: "Har qanday qurilmada sokin, chalgʻitmaydigan va qulay oʻquv muhiti.",
  },
] as const;

/* --------------------------------------------------------------------------
   NIGINA — AI assistant (planned, not live)
   -------------------------------------------------------------------------- */

export const nigina = {
  name: "NIGINA",
  role: "Shaxsiy AI yordamchingiz",
  status: "Tez orada",
  intro:
    "Assalomu alaykum! Men NIGINA — M.ACADEMY ning AI yordamchisiman. Tez orada sizga kurs tanlash, dars rejasi va savollaringizda yordam beraman.",
  plannedFeatures: [
    { title: "Kurs tanlash", body: "Maqsadingizga mos kursni topishda maslahat." },
    { title: "Oʻqishda yordam", body: "Mavzularni tushuntirish va uy vazifasida yoʻnaltirish." },
    { title: "Reja va eslatmalar", body: "Dars jadvali, takrorlash va muddatlarni eslatish." },
    { title: "Kun-u tun", body: "Savollaringizga istalgan vaqtda javob." },
  ],
  suggestions: [
    "Qaysi kurs menga mos?",
    "IELTS ga qanday tayyorlanaman?",
    "TOPIK haqida aytib ber",
  ],
} as const;
