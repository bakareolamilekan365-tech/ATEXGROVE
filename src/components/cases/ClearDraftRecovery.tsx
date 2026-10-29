"use client";

import { useEffect } from "react";
import { clearDraftRecovery } from "@/lib/verification-cases/draft-recovery";

export function ClearDraftRecovery({ userId }: Readonly<{ userId: string }>) {
  useEffect(() => {
    try {
      clearDraftRecovery(window.localStorage, userId);
    } catch {
      // Draft creation already succeeded. Storage cleanup is best effort.
    }
  }, [userId]);

  return null;
}
