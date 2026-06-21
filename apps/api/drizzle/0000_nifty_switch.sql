CREATE TYPE "public"."interview_status" AS ENUM('configuring', 'active', 'processing', 'completed', 'cancelled');
CREATE TYPE "public"."interviewer_tone" AS ENUM('friendly', 'tough', 'balanced', 'case');
CREATE TYPE "public"."pack_type" AS ENUM('mini', 'standard', 'premium');
CREATE TYPE "public"."question_type" AS ENUM('behavioral', 'technical_coding', 'domain_knowledge', 'case_study', 'hr_screening', 'leadership', 'situational', 'culture_fit');
CREATE TYPE "public"."realtime_session_status" AS ENUM('pending', 'active', 'ended', 'failed');
CREATE TYPE "public"."subscription_status" AS ENUM('active', 'cancelled', 'paused', 'expired', 'pending');
CREATE TYPE "public"."team_role" AS ENUM('owner', 'admin', 'member');
CREATE TYPE "public"."user_plan" AS ENUM('free', 'mini_pack', 'standard_pack', 'premium_pack', 'enterprise');
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE "answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"text" text NOT NULL,
	"audio_url" text,
	"duration_seconds" integer,
	"is_redo" boolean DEFAULT false NOT NULL,
	"filler_word_count" integer,
	"pace_wpm" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "conversation_turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"speaker" text NOT NULL,
	"text" text NOT NULL,
	"turn_index" integer NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"duration_ms" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "interview_credits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pack_type" "pack_type" NOT NULL,
	"total_credits" integer NOT NULL,
	"used_credits" integer DEFAULT 0 NOT NULL,
	"duration_minutes" integer NOT NULL,
	"razorpay_order_id" varchar(255),
	"razorpay_payment_id" varchar(255),
	"purchased_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone
);

CREATE TABLE "interview_recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"video_url" text,
	"audio_url" text,
	"duration_seconds" integer,
	"file_size_bytes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_recordings_interview_id_unique" UNIQUE("interview_id")
);

CREATE TABLE "interview_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"summary_text" text NOT NULL,
	"radar_scores" jsonb NOT NULL,
	"strengths" text[] DEFAULT '{}' NOT NULL,
	"weaknesses" text[] DEFAULT '{}' NOT NULL,
	"overall_score" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_reports_interview_id_unique" UNIQUE("interview_id")
);

CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"role_title" varchar(255) NOT NULL,
	"industry" varchar(100) NOT NULL,
	"function_category" varchar(100) NOT NULL,
	"seniority" varchar(50) NOT NULL,
	"interview_types" text[] NOT NULL,
	"status" "interview_status" DEFAULT 'configuring' NOT NULL,
	"interviewer_tone" "interviewer_tone" DEFAULT 'balanced' NOT NULL,
	"voice_accent" varchar(50) DEFAULT 'american' NOT NULL,
	"duration_minutes" integer DEFAULT 30 NOT NULL,
	"target_company" varchar(200),
	"job_description" text,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"industry" varchar(100) NOT NULL,
	"function_category" varchar(100) NOT NULL,
	"sub_function" varchar(100) NOT NULL,
	"seniority" varchar(50) NOT NULL,
	"experience_years" integer DEFAULT 0 NOT NULL,
	"resume_url" text,
	"resume_parsed_data" jsonb,
	"target_companies" text[] DEFAULT '{}' NOT NULL,
	"career_goal" text,
	"skills" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);

CREATE TABLE "questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"text" text NOT NULL,
	"type" "question_type" NOT NULL,
	"order" integer NOT NULL,
	"time_limit_seconds" integer,
	"difficulty" smallint DEFAULT 5 NOT NULL,
	"expected_duration_seconds" integer DEFAULT 120 NOT NULL,
	"follow_up_to" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "realtime_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"convai_agent_id" text,
	"convai_conversation_id" text,
	"status" realtime_session_status DEFAULT 'pending' NOT NULL,
	"started_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"total_turns" integer DEFAULT 0,
	"token_usage" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "realtime_sessions_interview_id_unique" UNIQUE("interview_id")
);

CREATE TABLE "scores" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"answer_id" uuid NOT NULL,
	"clarity" smallint NOT NULL,
	"relevance" smallint NOT NULL,
	"depth" smallint NOT NULL,
	"structure" smallint NOT NULL,
	"technical_accuracy" smallint NOT NULL,
	"confidence" smallint NOT NULL,
	"overall" smallint NOT NULL,
	"star_compliance" boolean,
	"feedback_text" text NOT NULL,
	"model_answer" text,
	"improvement_tips" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scores_answer_id_unique" UNIQUE("answer_id")
);

CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);

CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"razorpay_order_id" varchar(255) NOT NULL,
	"razorpay_payment_id" varchar(255),
	"plan" "user_plan" NOT NULL,
	"status" "subscription_status" DEFAULT 'pending' NOT NULL,
	"current_period_start" timestamp with time zone,
	"current_period_end" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "team_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"role" "team_role" DEFAULT 'member' NOT NULL,
	"invited_by" uuid NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_invitations_token_unique" UNIQUE("token")
);

CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "team_role" DEFAULT 'member' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"owner_id" uuid NOT NULL,
	"plan" "user_plan" DEFAULT 'enterprise' NOT NULL,
	"max_members" integer DEFAULT 25 NOT NULL,
	"logo_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);

CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);

CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"avatar_url" text,
	"plan" "user_plan" DEFAULT 'free' NOT NULL,
	"interview_count" integer DEFAULT 0 NOT NULL,
	"onboarding_completed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);

CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "answers" ADD CONSTRAINT "answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "answers" ADD CONSTRAINT "answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "conversation_turns" ADD CONSTRAINT "conversation_turns_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "interview_credits" ADD CONSTRAINT "interview_credits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "interview_recordings" ADD CONSTRAINT "interview_recordings_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "interview_recordings" ADD CONSTRAINT "interview_recordings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "interview_reports" ADD CONSTRAINT "interview_reports_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "questions" ADD CONSTRAINT "questions_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "realtime_sessions" ADD CONSTRAINT "realtime_sessions_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "scores" ADD CONSTRAINT "scores_answer_id_answers_id_fk" FOREIGN KEY ("answer_id") REFERENCES "public"."answers"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "teams" ADD CONSTRAINT "teams_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;