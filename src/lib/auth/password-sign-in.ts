import { navigateAfterAuth } from "@/lib/auth/redirect";

type PasswordAuthClient = {
  signInWithPassword: (credentials: {
    email: string;
    password: string;
  }) => Promise<{ error: { message: string; status?: number; code?: string } | null }>;
};

export function signInErrorMessage(error: { message: string; status?: number; code?: string }) {
  const message = error.message.toLowerCase();
  if (error.code === "invalid_credentials" || (error.status === 400 && message === "invalid login credentials") || message === "invalid login credentials") {
    return "Incorrect email or password. Please try again.";
  }
  if (error.status === 429 || error.code === "over_request_rate_limit" || error.code === "over_email_send_rate_limit") {
    return "Too many attempts. Please wait a little before trying again.";
  }
  if (message.includes("email not confirmed")) return "Please verify your email before signing in.";
  if (message.includes("fetch failed") || message.includes("failed to fetch") || message.includes("network")) {
    return "We could not connect. Check your connection and try again.";
  }
  return "Sign in could not be completed. Please try again or contact support if this continues.";
}

export async function signInWithFreshNavigation(
  auth: PasswordAuthClient,
  credentials: { email: string; password: string },
  requestedPath: string | null | undefined,
  navigate: (destination: string) => void,
) {
  let response: Awaited<ReturnType<PasswordAuthClient["signInWithPassword"]>>;
  try {
    response = await auth.signInWithPassword(credentials);
  } catch {
    return { destination: null, error: "We could not connect. Check your connection and try again." };
  }
  const { error } = response;
  if (error) return { destination: null, error: signInErrorMessage(error) };

  try {
    const destination = navigateAfterAuth(requestedPath, navigate);
    return { destination, error: null };
  } catch {
    return {
      destination: null,
      error: "You are signed in, but the next page could not be opened. Please try again.",
    };
  }
}
