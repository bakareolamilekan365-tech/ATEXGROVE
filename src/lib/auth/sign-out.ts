type LocalSignOutClient = {
  auth: { signOut: (options: { scope: "local" }) => Promise<{ error: { message?: string } | null }> };
};

export async function signOutLocalSession(client: LocalSignOutClient) {
  return client.auth.signOut({ scope: "local" });
}
