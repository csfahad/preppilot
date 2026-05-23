export interface GeneratedQuestion {
    question: string;
    type: string;
    expectedDurationSeconds: number;
    difficulty: number;
    followUp: string | null;
}

export interface EvaluationResult {
    clarity: number;
    relevance: number;
    depth: number;
    structure: number;
    technicalAccuracy: number;
    confidence: number;
    overall: number;
    starCompliance: boolean | null;
    feedbackText: string;
    modelAnswer: string;
    improvementTips: string[];
    fillerWordsDetected: string[];
}

export interface AdaptiveDecision {
    action: "follow_up_easier" | "follow_up_harder" | "next_question";
    followUpQuestion: string | null;
    reason: string;
}

// Question Generator Prompt
export function buildQuestionGeneratorPrompt(params: {
    roleTitle: string;
    industry: string;
    functionCategory: string;
    seniority: string;
    experienceYears: number;
    interviewTypes: string[];
    targetCompany?: string;
    jobDescription?: string;
    questionCount: number;
    skills?: string[];
}): { system: string; user: string } {
    const system = `You are an expert interviewer conducting mock interviews. You have deep expertise across all industries and functions.

Your task is to generate realistic, high-quality interview questions that match the exact profile of the candidate.

IMPORTANT RULES:
- Questions MUST be calibrated for the exact seniority level. Intern questions are fundamentally different from Director questions.
- Mix question types as specified. Each type has distinct characteristics.
- For behavioral questions, expect STAR-format answers.
- For technical questions, include real-world scenarios, not textbook definitions.
- For situational questions, create realistic workplace dilemmas.
- If a target company is provided, mirror their known interview style and values.
- If a job description is provided, tailor questions to the specific requirements mentioned.
- Difficulty should range from 1 (easy) to 10 (hard), calibrated to the seniority level.

Return ONLY a valid JSON array. No other text.`;

    let userPrompt = `Generate ${params.questionCount} interview questions for this candidate:

Role: ${params.roleTitle}
Industry: ${params.industry}
Function: ${params.functionCategory}
Seniority: ${params.seniority}
Experience: ${params.experienceYears} years
Question Types to Include: ${params.interviewTypes.join(", ")}`;

    if (params.targetCompany) {
        userPrompt += `\nTarget Company: ${params.targetCompany}`;
    }

    if (params.jobDescription) {
        userPrompt += `\nJob Description:\n${params.jobDescription}`;
    }

    if (params.skills && params.skills.length > 0) {
        userPrompt += `\nCandidate Skills: ${params.skills.join(", ")}`;
    }

    userPrompt += `

Return a JSON array with this exact schema:
[{
  "question": "The interview question text",
  "type": "behavioral|technical_coding|domain_knowledge|case_study|hr_screening|leadership|situational|culture_fit",
  "expectedDurationSeconds": 120,
  "difficulty": 5,
  "followUp": "A follow-up question to ask if the main answer is vague, or null"
}]`;

    return { system, user: userPrompt };
}

// Adaptive Follow-up Prompt
export function buildAdaptiveFollowUpPrompt(params: {
    question: string;
    answer: string;
    currentScore: number;
    roleTitle: string;
    seniority: string;
}): { system: string; user: string } {
    const system = `You are an expert interviewer evaluating an answer and deciding the next step.

Based on the candidate's answer quality (scored 1-10), decide:
- If score < 5: Generate an EASIER follow-up or provide a gentle hint to help the candidate
- If score > 8: Generate a HARDER probing follow-up to test deeper knowledge
- If score is 5-8: Move to the next question (no follow-up needed)

Return ONLY valid JSON. No other text.`;

    const user = `Role: ${params.roleTitle} (${params.seniority})
Question: ${params.question}
Candidate's Answer: ${params.answer}
Current Score: ${params.currentScore}/10

Return JSON:
{
  "action": "follow_up_easier|follow_up_harder|next_question",
  "followUpQuestion": "The follow-up question, or null if moving on",
  "reason": "Brief explanation of why this decision was made"
}`;

    return { system, user };
}

// Evaluation & Feedback Prompt
export function buildEvaluationPrompt(params: {
    question: string;
    questionType: string;
    answer: string;
    roleTitle: string;
    seniority: string;
    industry: string;
}): { system: string; user: string } {
    const system = `You are an expert interview evaluator. Your feedback is what makes candidates improve.

EVALUATION CRITERIA (each scored 1-10):
- Clarity: How clearly was the answer communicated? Look for concise, jargon-appropriate language.
- Relevance: Does the answer actually address what was asked? Watch for tangential responses.
- Depth: Level of detail and thoroughness. Seniors should demonstrate deeper insight than juniors.
- Structure: Organization and logical flow. For behavioral Qs, check STAR compliance.
- Technical Accuracy: Is the technical content correct? (Score 5 if N/A for non-technical Qs)
- Confidence: Based on language patterns — hedging words, definitive statements, etc.
- Overall: Holistic score, not just an average.

FEEDBACK RULES:
- Write exactly 3 sentences of constructive feedback. Be specific, not generic.
- Focus on what to IMPROVE, not just what was wrong.
- Include quantified impact where possible ("adding metrics would strengthen your answer by...")
- For behavioral questions, explicitly check STAR compliance.
- Model answer should be what an excellent candidate at this exact seniority would say.
- Improvement tips should be 2-3 actionable, specific items.

FILLER WORD DETECTION:
- Identify any filler words in the text: "um", "uh", "like" (when used as filler), "you know", "basically", "actually", "literally", "sort of", "kind of"

Return ONLY valid JSON. No other text.`;

    const user = `Evaluate this interview answer:

Role: ${params.roleTitle} (${params.seniority}) in ${params.industry}
Question Type: ${params.questionType}
Question: ${params.question}
Candidate's Answer: ${params.answer}

Return JSON:
{
  "clarity": 7,
  "relevance": 8,
  "depth": 6,
  "structure": 7,
  "technicalAccuracy": 5,
  "confidence": 7,
  "overall": 7,
  "starCompliance": true,
  "feedbackText": "Three sentences of specific feedback...",
  "modelAnswer": "What an excellent answer looks like...",
  "improvementTips": ["Specific tip 1", "Specific tip 2"],
  "fillerWordsDetected": ["like", "you know"]
}`;

    return { system, user };
}

// Resume Parsing Prompt

export function buildResumeParsingPrompt(resumeText: string): {
    system: string;
    user: string;
} {
    const system = `You are an expert resume parser. Extract structured information from the resume text provided.

Return ONLY valid JSON. No other text.`;

    const user = `Parse this resume and extract structured data:

${resumeText}

Return JSON:
{
  "name": "Full name",
  "email": "Email if found",
  "skills": ["skill1", "skill2"],
  "experienceYears": 5,
  "currentRole": "Current job title",
  "currentCompany": "Current employer",
  "education": [{"degree": "BS CS", "institution": "MIT", "year": 2020}],
  "experiences": [{"title": "SWE", "company": "Google", "duration": "2 years", "highlights": ["Led..."]}],
  "suggestedIndustry": "Technology",
  "suggestedFunction": "Engineering",
  "suggestedSubFunction": "Full Stack",
  "suggestedSeniority": "Senior"
}`;

    return { system, user };
}

// Report Summary Prompt

export function buildReportSummaryPrompt(params: {
    roleTitle: string;
    seniority: string;
    questionsAndScores: Array<{
        question: string;
        type: string;
        score: number;
        feedbackText: string;
    }>;
    overallAverage: number;
}): { system: string; user: string } {
    const system = `You are a career coach providing actionable interview feedback summaries.

Write a concise but insightful summary that:
1. Highlights 2-3 specific strengths with examples from the interview
2. Identifies 2-3 specific areas for improvement with actionable advice
3. Gives an overall assessment calibrated to the target seniority level
4. Provides radar scores (1-100) for: Communication, Technical, Problem Solving, Leadership, Culture Fit

Be encouraging but honest. Job seekers need motivation AND truth.

Return ONLY valid JSON. No other text.`;

    const user = `Summarize this interview for a ${params.roleTitle} (${params.seniority}):

${params.questionsAndScores.map((q, i) => `Q${i + 1} (${q.type}): "${q.question}" → Score: ${q.score}/10 | ${q.feedbackText}`).join("\n")}

Overall Average Score: ${params.overallAverage}/10

Return JSON:
{
  "summaryText": "3-4 paragraph summary...",
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "weaknesses": ["Specific area to improve 1", "Specific area to improve 2"],
  "radarScores": {
    "Communication": 75,
    "Technical": 60,
    "Problem Solving": 80,
    "Leadership": 50,
    "Culture Fit": 85
  },
  "overallScore": 72
}`;

    return { system, user };
}
