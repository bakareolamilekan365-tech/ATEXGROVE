"use server";

import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { signOutLocalSession } from "@/lib/auth/sign-out";

export async function signOutAction() {
  const { supabase } = await requireAuthenticatedUser();
  const { error } = await signOutLocalSession(supabase);
  if (error) {
    console.warn("[auth.sign_out_failed]", { reason: "local_session_clear_failed" });
    redirect("/dashboard?signout=failed");
  }
  redirect("/login");
}
