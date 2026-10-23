type LocalSignOutClient = {
  auth: { signOut: (options: { scope: "local" }) => Promise<unknown> };
};

export async function signOutLocalSession(client: LocalSignOutClient) {
  return client.auth.signOut({ scope: "local" });
}
