"use client";

import { signOutAction } from "@/app/actions";
import { clearDraftRecovery } from "@/lib/verification-cases/draft-recovery";

export function SignOutButton({ userId }: Readonly<{ userId?: string }>) {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        onClick={() => {
          if (!userId) return;
          try {
            clearDraftRecovery(window.localStorage, userId);
          } catch {
            // Signing out must not depend on browser storage availability.
          }
        }}
      >
        Sign out
      </button>
    </form>
  );
}
