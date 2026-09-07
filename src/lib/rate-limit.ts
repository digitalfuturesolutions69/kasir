// Cheap in-memory fixed-window limiter — good enough for a single pm2
// process at this app's scale. Resets on restart/deploy; that's an
// acceptable trade-off over standing up Redis just to rate-limit a
// couple of auth endpoints. Not safe if the app is ever run with pm2
// cluster mode (multiple processes, each with its own map) — revisit
// then.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function isRateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  bucket.count += 1;
  return bucket.count > max;
}
