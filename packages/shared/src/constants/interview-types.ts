export const INTERVIEW_TYPES = [
    {
        id: "behavioral",
        label: "Behavioral",
        description: "STAR-format questions, culture fit, soft skills",
        questionCountRange: { min: 3, max: 8 },
        applicableToAll: true,
    },
    {
        id: "technical_coding",
        label: "Technical Coding",
        description: "DSA, system design, code walkthroughs",
        questionCountRange: { min: 2, max: 5 },
        applicableToAll: false,
        applicableFunctions: ["Engineering"],
    },
    {
        id: "domain_knowledge",
        label: "Domain Knowledge",
        description:
            "Role-specific technical questions (e.g., SQL for analysts)",
        questionCountRange: { min: 3, max: 6 },
        applicableToAll: true,
    },
    {
        id: "case_study",
        label: "Case Study",
        description:
            "Consulting, PM, strategy roles — structured problem solving",
        questionCountRange: { min: 1, max: 3 },
        applicableToAll: false,
        applicableFunctions: ["Product", "Operations"],
    },
    {
        id: "hr_screening",
        label: "HR Screening",
        description: "Salary expectations, availability, motivation",
        questionCountRange: { min: 2, max: 4 },
        applicableToAll: true,
    },
    {
        id: "leadership",
        label: "Leadership",
        description: "Management philosophy, team dynamics, strategic thinking",
        questionCountRange: { min: 2, max: 5 },
        applicableToAll: false,
        applicableSeniorities: ["Lead", "Manager", "Director", "VP", "C-Suite"],
    },
    {
        id: "situational",
        label: "Situational",
        description: '"What would you do if…" scenarios',
        questionCountRange: { min: 2, max: 5 },
        applicableToAll: true,
    },
    {
        id: "culture_fit",
        label: "Culture Fit",
        description: "Values, work style, team dynamics",
        questionCountRange: { min: 2, max: 4 },
        applicableToAll: true,
    },
] as const;

export type InterviewTypeId = (typeof INTERVIEW_TYPES)[number]["id"];

export const INTERVIEW_STATUSES = [
    "configuring",
    "active",
    "processing",
    "completed",
    "cancelled",
] as const;

export type InterviewStatus = (typeof INTERVIEW_STATUSES)[number];

export const INTERVIEW_MODES = ["text", "voice"] as const;
export type InterviewMode = (typeof INTERVIEW_MODES)[number];

export const SCORING_DIMENSIONS = [
    {
        id: "clarity",
        label: "Clarity",
        description: "How clearly the answer was communicated",
    },
    {
        id: "relevance",
        label: "Relevance",
        description: "How well the answer addresses the question",
    },
    {
        id: "depth",
        label: "Depth",
        description: "Level of detail and thoroughness",
    },
    {
        id: "structure",
        label: "Structure",
        description: "Organization and logical flow",
    },
    {
        id: "technical_accuracy",
        label: "Technical Accuracy",
        description: "Correctness of technical content",
    },
    {
        id: "confidence",
        label: "Confidence",
        description: "Tone, pace, and conviction",
    },
] as const;

export type ScoringDimensionId = (typeof SCORING_DIMENSIONS)[number]["id"];

export const RADAR_CATEGORIES = [
    "Communication",
    "Technical",
    "Problem Solving",
    "Leadership",
    "Culture Fit",
] as const;

export type RadarCategory = (typeof RADAR_CATEGORIES)[number];

function includesString(values: readonly string[] | undefined, value: string) {
    return values?.includes(value) ?? false;
}

export function getApplicableInterviewTypes(
    functionCategory: string,
    seniority: string,
): (typeof INTERVIEW_TYPES)[number][] {
    return INTERVIEW_TYPES.filter((type) => {
        if (type.applicableToAll) return true;
        if ("applicableFunctions" in type && type.applicableFunctions) {
            return includesString(type.applicableFunctions, functionCategory);
        }
        if ("applicableSeniorities" in type && type.applicableSeniorities) {
            return includesString(type.applicableSeniorities, seniority);
        }
        return false;
    });
}
