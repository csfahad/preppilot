import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL!;
const FEATURE_LIST_STYLE =
    "list-style:none;padding:0;margin:16px 0;color:#111827;";

function featureItem(content: string) {
    return `
          <li style="margin:0 0 12px 0;padding:0;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
              <tr>
                <td style="vertical-align:top;padding:1px 10px 0 0;">
                  <span style="display:inline-block;width:18px;height:18px;line-height:18px;border-radius:50%;background:#ecfccb;color:#65a30d;font-size:12px;font-weight:700;text-align:center;">✓</span>
                </td>
                <td style="vertical-align:top;color:#111827;font-size:16px;line-height:24px;">${content}</td>
              </tr>
            </table>
          </li>`;
}

export async function sendWelcomeEmail(to: string, name: string) {
    return resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: "Welcome to PrepPilot!",
        html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #65a30d;">Welcome aboard, ${name}!</h1>
        <p>You've taken the first step toward acing your next interview.</p>
        <p>Here's what you can do right now:</p>
        <ul style="${FEATURE_LIST_STYLE}">
          ${featureItem("Complete your profile to get personalized questions")}
          ${featureItem("Start your first mock interview")}
          ${featureItem("Get detailed feedback on every answer")}
        </ul>
        <a href="${process.env.WEB_URL}/dashboard" 
           style="display:inline-block;padding:12px 24px;background:#65a30d;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">
          Start Your First Interview →
        </a>
        <p style="color:#6b7280;margin-top:24px;font-size:14px;">
          You have 3 free interviews to get started. Make them count!
        </p>
      </div>
    `,
    });
}

export async function sendFeedbackReadyEmail(
    to: string,
    name: string,
    interviewId: string,
) {
    return resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: "Your interview feedback is ready!",
        html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #65a30d;">Your feedback is in, ${name}!</h1>
        <p>We've analyzed your interview answers and prepared detailed feedback.</p>
        <a href="${process.env.WEB_URL}/interview/${interviewId}/report" 
           style="display:inline-block;padding:12px 24px;background:#65a30d;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">
          View Your Report →
        </a>
      </div>
    `,
    });
}

export async function sendTrialEndingEmail(
    to: string,
    name: string,
    interviewsUsed: number,
) {
    return resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: "You've used all your free interviews",
        html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #65a30d;">You're out of free interviews, ${name}</h1>
        <p>You've completed ${interviewsUsed} interviews and built real momentum. Don't stop now!</p>
        <p>Upgrade to Pro for:</p>
        <ul style="${FEATURE_LIST_STYLE}">
          ${featureItem("Unlimited interviews")}
          ${featureItem("Voice mode with AI interviewer")}
          ${featureItem("Model answers for every question")}
          ${featureItem("Full analytics and growth tracking")}
        </ul>
        <a href="${process.env.WEB_URL}/pricing" 
           style="display:inline-block;padding:12px 24px;background:#65a30d;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">
          Upgrade to Pro →
        </a>
      </div>
    `,
    });
}

export async function sendTeamInvitationEmail(
    to: string,
    inviterName: string,
    teamName: string,
    inviteUrl: string,
) {
    return resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `${inviterName} invited you to ${teamName} on PrepPilot`,
        html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #65a30d;">You're invited to join ${teamName}!</h1>
        <p><strong>${inviterName}</strong> has invited you to their team on PrepPilot.</p>
        <p>As a team member, you'll get:</p>
        <ul style="${FEATURE_LIST_STYLE}">
          ${featureItem("Enterprise plan features")}
          ${featureItem("Team analytics & leaderboard")}
          ${featureItem("Unlimited mock interviews")}
          ${featureItem("Voice mode with 6 accents")}
        </ul>
        <a href="${inviteUrl}" 
           style="display:inline-block;padding:12px 24px;background:#65a30d;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">
          Accept Invitation →
        </a>
        <p style="color:#6b7280;margin-top:24px;font-size:14px;">
          This invitation expires in 7 days.
        </p>
      </div>
    `,
    });
}

export async function sendWeeklySummaryEmail(
    to: string,
    name: string,
    stats: {
        interviewsThisWeek: number;
        avgScore: number;
        streak: number;
        topImprovement: string;
    },
) {
    return resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Your weekly interview prep summary`,
        html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #65a30d;">Weekly Summary for ${name}</h1>
        <div style="background:#f3f4f6;border-radius:12px;padding:20px;margin:16px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:8px;text-align:center;">
                <div style="font-size:24px;font-weight:bold;color:#111827;">${stats.interviewsThisWeek}</div>
                <div style="font-size:12px;color:#6b7280;">Interviews</div>
              </td>
              <td style="padding:8px;text-align:center;">
                <div style="font-size:24px;font-weight:bold;color:#111827;">${stats.avgScore}/100</div>
                <div style="font-size:12px;color:#6b7280;">Avg Score</div>
              </td>
              <td style="padding:8px;text-align:center;">
                <div style="font-size:24px;font-weight:bold;color:#111827;">${stats.streak}</div>
                <div style="font-size:12px;color:#6b7280;">Day Streak</div>
              </td>
            </tr>
          </table>
        </div>
        ${stats.topImprovement ? `<p>📈 <strong>Biggest improvement:</strong> ${stats.topImprovement}</p>` : ""}
        <a href="${process.env.WEB_URL}/dashboard" 
           style="display:inline-block;padding:12px 24px;background:#65a30d;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">
          Continue Practicing →
        </a>
      </div>
    `,
    });
}

export async function sendInterviewReminderEmail(
    to: string,
    name: string,
    daysSinceLastInterview: number,
) {
    return resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Don't lose your momentum, ${name}!`,
        html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #65a30d;">We miss you, ${name}!</h1>
        <p>It's been <strong>${daysSinceLastInterview} days</strong> since your last practice interview.</p>
        <p>Consistency is key — even 15 minutes of practice can make a real difference:</p>
        <ul style="${FEATURE_LIST_STYLE}">
          ${featureItem("Keep your answers sharp and structured")}
          ${featureItem("Build confidence through repetition")}
          ${featureItem("Track your improvement over time")}
        </ul>
        <a href="${process.env.WEB_URL}/interview/new" 
           style="display:inline-block;padding:12px 24px;background:#65a30d;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">
          Start a Quick Interview →
        </a>
      </div>
    `,
    });
}

export async function sendSubscriptionConfirmationEmail(
    to: string,
    name: string,
    planName: string,
) {
    return resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Welcome to PrepPilot Pro!`,
        html: `
      <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #65a30d;">You're on the ${planName} plan!</h1>
        <p>Thanks for upgrading, ${name}! Here's what's now unlocked:</p>
        <ul style="${FEATURE_LIST_STYLE}">
          ${featureItem("<strong>Unlimited</strong> mock interviews")}
          ${featureItem("<strong>Voice mode</strong> with 6 regional accents")}
          ${featureItem("<strong>Model answers</strong> for every question")}
          ${featureItem("<strong>Full feedback</strong> with improvement tips")}
          ${featureItem("<strong>Performance analytics</strong> dashboard")}
        </ul>
        <a href="${process.env.WEB_URL}/interview/new" 
           style="display:inline-block;padding:12px 24px;background:#65a30d;color:#fff;text-decoration:none;border-radius:8px;margin-top:16px;">
          Start Your First Pro Interview →
        </a>
        <p style="color:#6b7280;margin-top:24px;font-size:14px;">
          Questions? Reply to this email — we're here to help.
        </p>
      </div>
    `,
    });
}
