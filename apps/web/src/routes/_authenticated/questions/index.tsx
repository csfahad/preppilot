import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { FUNCTIONS } from "@repo/shared/constants/taxonomy";
import { INTERVIEW_TYPES } from "@repo/shared/constants/interview-types";
import type { InterviewTypeId } from "@repo/shared/constants/interview-types";
import {
    IconSearch,
    IconChevronRight,
    IconSparkles,
    IconFilter,
} from "@tabler/icons-react";

export const Route = createFileRoute("/_authenticated/questions/")({
    component: AuthenticatedQuestionsPage,
});

const SAMPLE_QUESTIONS: Record<
    string,
    { role: string; type: string; question: string; tip: string }[]
> = {
    Engineering: [
        {
            role: "Frontend Engineer",
            type: "Technical",
            question:
                "Explain the difference between SSR and CSR. When would you choose one over the other?",
            tip: "Mention SEO, time-to-first-byte, hydration costs, and use cases like e-commerce vs dashboards.",
        },
        {
            role: "Backend Engineer",
            type: "System Design",
            question:
                "Design a URL shortener that handles 100M daily active users.",
            tip: "Cover: hashing, collision handling, read/write ratio, caching layer, database sharding, analytics pipeline.",
        },
        {
            role: "Full Stack Engineer",
            type: "Behavioral",
            question:
                "Tell me about a time you had to make a critical architectural decision under time pressure.",
            tip: "Use the STAR format. Quantify the impact (performance gain, cost savings, reduced downtime).",
        },
        {
            role: "DevOps Engineer",
            type: "Domain Knowledge",
            question:
                "How would you implement a zero-downtime deployment pipeline?",
            tip: "Cover blue-green deployments, canary releases, health checks, rollback strategies, and infrastructure as code.",
        },
    ],
    Product: [
        {
            role: "Product Manager",
            type: "Case Study",
            question:
                "You're the PM for Google Maps. How would you improve the experience for delivery drivers?",
            tip: "Start with user research, define metrics (delivery time, route accuracy), then prioritize features using RICE.",
        },
        {
            role: "Product Manager",
            type: "Behavioral",
            question:
                "Describe a time when you had to say no to a stakeholder. How did you handle it?",
            tip: "Show data-driven decision making, empathy, and clear communication of trade-offs.",
        },
    ],
    Design: [
        {
            role: "UX Designer",
            type: "Behavioral",
            question:
                "Walk me through your design process for a recent project from research to handoff.",
            tip: "Mention user interviews, personas, wireframes, usability testing, design system usage, and developer collaboration.",
        },
    ],
    Data: [
        {
            role: "Data Scientist",
            type: "Technical",
            question:
                "Explain the bias-variance tradeoff. How does it affect model selection?",
            tip: "Use concrete examples: overfitting (high variance) vs underfitting (high bias). Mention cross-validation.",
        },
    ],
    Sales: [
        {
            role: "Sales Executive",
            type: "Situational",
            question:
                "A prospect says they love your product but their budget was just cut. What do you do?",
            tip: "Show creative problem solving: phased rollout, ROI demonstration, executive sponsorship, bridge deal.",
        },
    ],
};

const QUESTION_TYPE_TO_INTERVIEW_TYPE_ID: Record<string, InterviewTypeId> = {
    Behavioral: "behavioral",
    Technical: "technical_coding",
    "System Design": "technical_coding",
    "Domain Knowledge": "domain_knowledge",
    "Case Study": "case_study",
    Situational: "situational",
    "Culture Fit": "culture_fit",
};

function getInterviewTypeId(questionType: string): InterviewTypeId {
    return QUESTION_TYPE_TO_INTERVIEW_TYPE_ID[questionType] ?? "behavioral";
}

function AuthenticatedQuestionsPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(
        null,
    );

    const categories = Object.keys(FUNCTIONS);

    const filteredQuestions = useMemo(() => {
        const allQuestions = Object.entries(SAMPLE_QUESTIONS).flatMap(
            ([category, questions]) =>
                questions.map((q) => ({ ...q, category })),
        );

        return allQuestions.filter((q) => {
            const matchesSearch =
                !searchQuery ||
                q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.type.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory =
                !selectedCategory || q.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    }, [searchQuery, selectedCategory]);

    return (
        <main className="flex-1 px-6 lg:px-10 py-8 max-w-[1400px] mx-auto w-full">
            {/* Hero section */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 text-center"
            >
                <h1 className="font-heading text-4xl md:text-5xl font-bold text-foreground mb-4">
                    Interview Questions Library
                </h1>
                <p className="text-muted-foreground text-lg max-w-lg mx-auto mb-8">
                    Browse {Object.values(SAMPLE_QUESTIONS).flat().length}+ real
                    interview questions across {categories.length} functions.
                    Practice {INTERVIEW_TYPES.length} interview formats with AI
                    scoring and feedback.
                </p>

                {/* Search */}
                <div className="relative max-w-md mx-auto">
                    <IconSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search questions, roles, types..."
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                    />
                </div>
            </motion.div>

            {/* Category filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                        !selectedCategory
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                >
                    All
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() =>
                            setSelectedCategory(
                                selectedCategory === cat ? null : cat,
                            )
                        }
                        className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                            selectedCategory === cat
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Question cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredQuestions.map((q, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-sm transition-all flex flex-col"
                    >
                        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                                {q.category}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                {q.role}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                                {q.type}
                            </span>
                        </div>
                        <h3 className="font-heading text-sm font-semibold text-foreground mb-3 line-clamp-3 flex-1">
                            {q.question}
                        </h3>
                        <div className="bg-muted/50 rounded-lg p-2.5 mb-3">
                            <p className="text-xs font-semibold text-primary mb-0.5 flex items-center gap-1">
                                <IconSparkles className="w-3 h-3" /> Pro Tip
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                                {q.tip}
                            </p>
                        </div>
                        <Link
                            to="/interview/new"
                            search={{
                                roleTitle: q.role,
                                interviewType: getInterviewTypeId(q.type),
                                focusQuestion: q.question,
                            }}
                            className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all w-full"
                        >
                            Practice{" "}
                            <IconChevronRight className="w-3.5 h-3.5" />
                        </Link>
                    </motion.div>
                ))}
            </div>

            {filteredQuestions.length === 0 && (
                <div className="text-center py-16">
                    <IconFilter className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="font-heading text-lg font-semibold text-foreground">
                        No questions found
                    </h3>
                    <p className="text-muted-foreground mt-1">
                        Try adjusting your search or filters
                    </p>
                </div>
            )}
        </main>
    );
}
