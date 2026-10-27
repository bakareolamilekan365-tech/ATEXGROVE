import { navigateAfterAuth } from "@/lib/auth/redirect";

type PasswordAuthClient = {
  signInWithPassword: (credentials: {
    email: string;
    password: string;
  }) => Promise<{ error: { message: string } | null }>;
};

export async function signInWithFreshNavigation(
  auth: PasswordAuthClient,
  credentials: { email: string; password: string },
  requestedPath: string | null | undefined,
  navigate: (destination: string) => void,
) {
  const { error } = await auth.signInWithPassword(credentials);
  if (error) return { destination: null, error: error.message };

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
