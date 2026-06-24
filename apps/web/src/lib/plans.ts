export const PLAN_LABELS: Record<string, string> = {
    free: "Free",
    mini_pack: "Mini",
    standard_pack: "Standard",
    premium_pack: "Premium",
    enterprise: "Enterprise",
};

export const PLAN_FULL_LABELS: Record<string, string> = {
    free: "Free Plan",
    mini_pack: "Mini Pack",
    standard_pack: "Standard Pack",
    premium_pack: "Premium Pack",
    enterprise: "Enterprise Plan",
};

export function getPlanLabel(plan?: string | null) {
    return PLAN_LABELS[plan || "free"] || "Free";
}

export function getPlanFullLabel(plan?: string | null) {
    return PLAN_FULL_LABELS[plan || "free"] || "Free Plan";
}

export function isPaidPlan(plan?: string | null) {
    return !!plan && plan !== "free";
}
