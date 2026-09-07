/**
 * Admin access is gated by email, not a DB role — set ADMIN_EMAIL (comma
 * separated for multiple owners) in .env. No env var set = admin dashboard
 * is inaccessible to everyone.
 */
export function isAdminEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  const allowed = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}
