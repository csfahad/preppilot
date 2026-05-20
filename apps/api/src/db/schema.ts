import {
    pgTable,
    uuid,
    text,
    varchar,
    integer,
    boolean,
    timestamp,
    jsonb,
    pgEnum,
    smallint,
    real,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const user = pgTable("user", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified").notNull().default(false),
    image: text("image"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPlanEnum = pgEnum("user_plan", [
    "free",
    "pro_monthly",
    "pro_annual",
    "pay_per_interview",
    "enterprise",
]);

export const interviewStatusEnum = pgEnum("interview_status", [
    "configuring",
    "active",
    "processing",
    "completed",
    "cancelled",
]);

export const interviewModeEnum = pgEnum("interview_mode", ["text", "voice"]);

export const interviewerToneEnum = pgEnum("interviewer_tone", [
    "friendly",
    "tough",
    "balanced",
    "case",
]);

export const questionTypeEnum = pgEnum("question_type", [
    "behavioral",
    "technical_coding",
    "domain_knowledge",
    "case_study",
    "hr_screening",
    "leadership",
    "situational",
    "culture_fit",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
    "active",
    "cancelled",
    "paused",
    "expired",
    "pending",
]);

export const users = pgTable("users", {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    avatarUrl: text("avatar_url"),
    plan: userPlanEnum("plan").notNull().default("free"),
    interviewCount: integer("interview_count").notNull().default(0),
    onboardingCompleted: boolean("onboarding_completed")
        .notNull()
        .default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const profiles = pgTable("profiles", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .unique()
        .references(() => users.id, { onDelete: "cascade" }),
    industry: varchar("industry", { length: 100 }).notNull(),
    functionCategory: varchar("function_category", { length: 100 }).notNull(),
    subFunction: varchar("sub_function", { length: 100 }).notNull(),
    seniority: varchar("seniority", { length: 50 }).notNull(),
    experienceYears: integer("experience_years").notNull().default(0),
    resumeUrl: text("resume_url"),
    resumeParsedData: jsonb("resume_parsed_data"),
    targetCompanies: text("target_companies").array().notNull().default([]),
    careerGoal: text("career_goal"),
    skills: text("skills").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const interviews = pgTable("interviews", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    roleTitle: varchar("role_title", { length: 255 }).notNull(),
    industry: varchar("industry", { length: 100 }).notNull(),
    functionCategory: varchar("function_category", { length: 100 }).notNull(),
    seniority: varchar("seniority", { length: 50 }).notNull(),
    interviewTypes: text("interview_types").array().notNull(),
    status: interviewStatusEnum("status").notNull().default("configuring"),
    interviewerTone: interviewerToneEnum("interviewer_tone")
        .notNull()
        .default("balanced"),
    mode: interviewModeEnum("mode").notNull().default("text"),
    voiceAccent: varchar("voice_accent", { length: 50 }),
    durationMinutes: integer("duration_minutes").notNull().default(30),
    timerEnabled: boolean("timer_enabled").notNull().default(true),
    warmupMode: boolean("warmup_mode").notNull().default(false),
    targetCompany: varchar("target_company", { length: 200 }),
    jobDescription: text("job_description"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const questions = pgTable("questions", {
    id: uuid("id").primaryKey().defaultRandom(),
    interviewId: uuid("interview_id")
        .notNull()
        .references(() => interviews.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    type: questionTypeEnum("type").notNull(),
    order: integer("order").notNull(),
    timeLimitSeconds: integer("time_limit_seconds"),
    difficulty: smallint("difficulty").notNull().default(5),
    expectedDurationSeconds: integer("expected_duration_seconds")
        .notNull()
        .default(120),
    followUpTo: uuid("follow_up_to"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const answers = pgTable("answers", {
    id: uuid("id").primaryKey().defaultRandom(),
    questionId: uuid("question_id")
        .notNull()
        .references(() => questions.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    text: text("text").notNull(),
    audioUrl: text("audio_url"),
    durationSeconds: integer("duration_seconds"),
    isRedo: boolean("is_redo").notNull().default(false),
    fillerWordCount: integer("filler_word_count"),
    paceWpm: real("pace_wpm"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const scores = pgTable("scores", {
    id: uuid("id").primaryKey().defaultRandom(),
    answerId: uuid("answer_id")
        .notNull()
        .unique()
        .references(() => answers.id, { onDelete: "cascade" }),
    clarity: smallint("clarity").notNull(),
    relevance: smallint("relevance").notNull(),
    depth: smallint("depth").notNull(),
    structure: smallint("structure").notNull(),
    technicalAccuracy: smallint("technical_accuracy").notNull(),
    confidence: smallint("confidence").notNull(),
    overall: smallint("overall").notNull(),
    starCompliance: boolean("star_compliance"),
    feedbackText: text("feedback_text").notNull(),
    modelAnswer: text("model_answer"),
    improvementTips: text("improvement_tips").array().notNull().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const interviewReports = pgTable("interview_reports", {
    id: uuid("id").primaryKey().defaultRandom(),
    interviewId: uuid("interview_id")
        .notNull()
        .unique()
        .references(() => interviews.id, { onDelete: "cascade" }),
    summaryText: text("summary_text").notNull(),
    radarScores: jsonb("radar_scores")
        .notNull()
        .$type<Record<string, number>>(),
    strengths: text("strengths").array().notNull().default([]),
    weaknesses: text("weaknesses").array().notNull().default([]),
    overallScore: integer("overall_score").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const subscriptions = pgTable("subscriptions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    razorpaySubscriptionId: varchar("razorpay_subscription_id", {
        length: 255,
    }).notNull(),
    razorpayPlanId: varchar("razorpay_plan_id", { length: 255 }).notNull(),
    plan: userPlanEnum("plan").notNull(),
    status: subscriptionStatusEnum("status").notNull().default("pending"),
    currentPeriodStart: timestamp("current_period_start", {
        withTimezone: true,
    }),
    currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
    profile: one(profiles, {
        fields: [users.id],
        references: [profiles.userId],
    }),
    interviews: many(interviews),
    answers: many(answers),
    subscriptions: many(subscriptions),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
    user: one(users, {
        fields: [profiles.userId],
        references: [users.id],
    }),
}));

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
    user: one(users, {
        fields: [interviews.userId],
        references: [users.id],
    }),
    questions: many(questions),
    report: one(interviewReports, {
        fields: [interviews.id],
        references: [interviewReports.interviewId],
    }),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
    interview: one(interviews, {
        fields: [questions.interviewId],
        references: [interviews.id],
    }),
    answers: many(answers),
}));

export const answersRelations = relations(answers, ({ one }) => ({
    question: one(questions, {
        fields: [answers.questionId],
        references: [questions.id],
    }),
    user: one(users, {
        fields: [answers.userId],
        references: [users.id],
    }),
    score: one(scores, {
        fields: [answers.id],
        references: [scores.answerId],
    }),
}));

export const scoresRelations = relations(scores, ({ one }) => ({
    answer: one(answers, {
        fields: [scores.answerId],
        references: [answers.id],
    }),
}));

export const interviewReportsRelations = relations(
    interviewReports,
    ({ one }) => ({
        interview: one(interviews, {
            fields: [interviewReports.interviewId],
            references: [interviews.id],
        }),
    }),
);

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    user: one(users, {
        fields: [subscriptions.userId],
        references: [users.id],
    }),
}));

// Enterprise: Teams

export const teamRoleEnum = pgEnum("team_role", ["owner", "admin", "member"]);

export const teams = pgTable("teams", {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 100 }).notNull().unique(),
    ownerId: uuid("owner_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    plan: userPlanEnum("plan").notNull().default("enterprise"),
    maxMembers: integer("max_members").notNull().default(25),
    logoUrl: text("logo_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const teamMembers = pgTable("team_members", {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
        .notNull()
        .references(() => teams.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    role: teamRoleEnum("role").notNull().default("member"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

export const teamInvitations = pgTable("team_invitations", {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id")
        .notNull()
        .references(() => teams.id, { onDelete: "cascade" }),
    email: varchar("email", { length: 255 }).notNull(),
    role: teamRoleEnum("role").notNull().default("member"),
    invitedBy: uuid("invited_by")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    token: varchar("token", { length: 255 }).notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
        .notNull()
        .defaultNow(),
});

// Enterprise Relations

export const teamsRelations = relations(teams, ({ one, many }) => ({
    owner: one(users, {
        fields: [teams.ownerId],
        references: [users.id],
    }),
    members: many(teamMembers),
    invitations: many(teamInvitations),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
    team: one(teams, {
        fields: [teamMembers.teamId],
        references: [teams.id],
    }),
    user: one(users, {
        fields: [teamMembers.userId],
        references: [users.id],
    }),
}));

export const teamInvitationsRelations = relations(
    teamInvitations,
    ({ one }) => ({
        team: one(teams, {
            fields: [teamInvitations.teamId],
            references: [teams.id],
        }),
        inviter: one(users, {
            fields: [teamInvitations.invitedBy],
            references: [users.id],
        }),
    }),
);
