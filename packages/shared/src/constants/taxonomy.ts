// Tier 1: Industries
export const INDUSTRIES = [
    "Technology",
    "Finance",
    "Healthcare",
    "Marketing",
    "Sales",
    "Operations",
    "Human Resources",
    "Legal",
    "Education",
    "Customer Support",
    "BPO",
    "Logistics",
    "Retail",
    "Media",
    "Government",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

// Tier 2: Functions (with sub-specializations)
export const FUNCTIONS = {
    Engineering: [
        "Frontend",
        "Backend",
        "Full Stack",
        "DevOps",
        "ML/AI",
        "Mobile",
        "Embedded",
        "Security",
        "Data Engineering",
    ],
    Product: ["Product Management", "Product Analytics", "Growth"],
    Design: ["UI Design", "UX Design", "UX Research", "Brand Design"],
    Data: ["Data Science", "Data Analysis", "Business Intelligence"],
    "Quality Assurance": ["Manual QA", "Automation QA", "Performance QA"],
    "Customer Support": [
        "Technical Support",
        "Customer Success",
        "Account Management",
    ],
    Sales: ["Inside Sales", "Enterprise Sales", "Sales Engineering", "BDR/SDR"],
    Marketing: [
        "Digital Marketing",
        "Content Marketing",
        "SEO",
        "Performance Marketing",
        "Brand Marketing",
    ],
    Finance: ["Financial Analysis", "Accounting", "FP&A", "Treasury"],
    "Human Resources": [
        "Talent Acquisition",
        "HR Business Partner",
        "L&D",
        "Compensation & Benefits",
    ],
    Operations: [
        "Business Operations",
        "Supply Chain",
        "Project Management",
        "Strategy & Consulting",
    ],
    Legal: ["Corporate Law", "Compliance", "Contract Management", "IP Law"],
} as const;

export type FunctionCategory = keyof typeof FUNCTIONS;
export type SubFunction<T extends FunctionCategory = FunctionCategory> =
    (typeof FUNCTIONS)[T][number];

export const FUNCTION_CATEGORIES = Object.keys(FUNCTIONS) as FunctionCategory[];

export const ALL_SUBFUNCTIONS = Object.values(FUNCTIONS).flat();

// Tier 3: Seniority Levels
export const SENIORITY_LEVELS = [
    "Intern",
    "Junior",
    "Mid-Level",
    "Senior",
    "Lead",
    "Manager",
    "Director",
    "VP",
    "C-Suite",
] as const;

export type SeniorityLevel = (typeof SENIORITY_LEVELS)[number];

// Experience ranges mapped to seniority
export const SENIORITY_EXPERIENCE_YEARS: Record<
    SeniorityLevel,
    { min: number; max: number }
> = {
    Intern: { min: 0, max: 0 },
    Junior: { min: 0, max: 2 },
    "Mid-Level": { min: 2, max: 5 },
    Senior: { min: 5, max: 8 },
    Lead: { min: 6, max: 10 },
    Manager: { min: 5, max: 12 },
    Director: { min: 10, max: 18 },
    VP: { min: 12, max: 25 },
    "C-Suite": { min: 15, max: 30 },
};

// Voice Accent Models
// Regional accents for the AI interviewer voice (mapped to ElevenLabs voice IDs)
export const VOICE_ACCENTS = [
    { id: "american", label: "American", region: "North America" },
    { id: "british", label: "British", region: "Europe" },
    { id: "australian", label: "Australian", region: "Oceania" },
    { id: "indian", label: "Indian", region: "Asia" },
    { id: "european", label: "European (Neutral)", region: "Europe" },
    { id: "african", label: "African", region: "Africa" },
] as const;

export type VoiceAccentId = (typeof VOICE_ACCENTS)[number]["id"];

// Interviewer Tones
export const INTERVIEWER_TONES = [
    {
        id: "friendly",
        label: "Friendly HR",
        description: "Warm, encouraging, conversational tone",
    },
    {
        id: "tough",
        label: "Tough Technical",
        description: "Direct, probing, challenges every answer",
    },
    {
        id: "balanced",
        label: "Balanced Panel",
        description: "Professional, fair, structured approach",
    },
    {
        id: "case",
        label: "Case Interviewer",
        description: "Structured, analytical, framework-focused",
    },
] as const;

export type InterviewerToneId = (typeof INTERVIEWER_TONES)[number]["id"];

// User Plans
export const USER_PLANS = [
    "free",
    "pro_monthly",
    "pro_annual",
    "pay_per_interview",
    "enterprise",
] as const;
export type UserPlan = (typeof USER_PLANS)[number];

export const PLAN_LIMITS: Record<
    UserPlan,
    {
        maxInterviews: number;
        voiceEnabled: boolean;
        modelAnswers: boolean;
        fullFeedback: boolean;
    }
> = {
    free: {
        maxInterviews: 3,
        voiceEnabled: false,
        modelAnswers: false,
        fullFeedback: false,
    },
    pro_monthly: {
        maxInterviews: Infinity,
        voiceEnabled: true,
        modelAnswers: true,
        fullFeedback: true,
    },
    pro_annual: {
        maxInterviews: Infinity,
        voiceEnabled: true,
        modelAnswers: true,
        fullFeedback: true,
    },
    pay_per_interview: {
        maxInterviews: Infinity,
        voiceEnabled: true,
        modelAnswers: true,
        fullFeedback: true,
    },
    enterprise: {
        maxInterviews: Infinity,
        voiceEnabled: true,
        modelAnswers: true,
        fullFeedback: true,
    },
};
