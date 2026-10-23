"use server";

import { redirect } from "next/navigation";
import { requireAuthenticatedUser } from "@/lib/auth/guards";
import { signOutLocalSession } from "@/lib/auth/sign-out";

export async function signOutAction() {
  const { supabase } = await requireAuthenticatedUser();
  await signOutLocalSession(supabase);
  redirect("/login");
}
