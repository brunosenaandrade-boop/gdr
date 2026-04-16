import posthog from "posthog-js";

export function trackCTAClick(ctaName: string, page: string) {
  posthog.capture("cta_click", { cta_name: ctaName, page });
}

export function trackCheckoutRedirect(source: string, email?: string) {
  posthog.capture("checkout_redirect", { source, has_email: !!email });
}

export function trackSignup() {
  posthog.capture("signup_completed");
}

export function trackLogin() {
  posthog.capture("login_completed");
}
