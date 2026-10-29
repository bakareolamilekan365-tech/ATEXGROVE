"use client";

import { signOutAction } from "@/app/actions";
import { clearDraftRecovery } from "@/lib/verification-cases/draft-recovery";

export function SignOutButton({ userId }: Readonly<{ userId?: string }>) {
  const clearDeviceDraft = () => {
    if (!userId) return;
    try {
      clearDraftRecovery(window.localStorage, userId);
    } catch {
      // Signing out must not depend on browser storage availability.
    }
  };

  return (
    <form action={signOutAction} onSubmit={clearDeviceDraft}>
      <button type="submit">Sign out</button>
    </form>
  );
}
