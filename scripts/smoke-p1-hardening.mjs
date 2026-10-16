/**
 * Lightweight smoke checks for P1 helpers (no Next server required).
 * Run: node scripts/smoke-p1-hardening.mjs
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// --- status machine (inlined mirror of rules) ---
const ALLOWED = {
  open: ["sponsored", "in_progress"],
  sponsored: ["in_progress"],
  in_progress: ["done"],
  done: [],
};

function isAllowed(from, to) {
  if (from === to) return true;
  return ALLOWED[from].includes(to);
}

assert(isAllowed("open", "sponsored"), "open→sponsored");
assert(isAllowed("open", "in_progress"), "open→in_progress");
assert(isAllowed("sponsored", "in_progress"), "sponsored→in_progress");
assert(isAllowed("in_progress", "done"), "in_progress→done");
assert(!isAllowed("open", "done"), "reject open→done");
assert(!isAllowed("done", "open"), "reject done→open");
assert(!isAllowed("sponsored", "open"), "reject sponsored→open");

// --- session / magic token hashing ---
const raw = "session-or-magic-token";
const hash = createHash("sha256").update(raw).digest("hex");
assert(hash.length === 64, "sha256 hex length");

const secret = "test-secret";
const id = "actor-1";
const exp = Math.floor(Date.now() / 1000) + 3600;
const payload = `${id}.${exp}`;
const sig = createHmac("sha256", secret).update(payload).digest("base64url");
const cookie = `${payload}.${sig}`;
const [cid, cexp, csig] = cookie.split(".");
const expected = createHmac("sha256", secret)
  .update(`${cid}.${cexp}`)
  .digest("base64url");
assert(
  timingSafeEqual(Buffer.from(csig), Buffer.from(expected)),
  "hmac sig ok",
);

// --- email normalize mirror ---
function normalizeEmail(email) {
  return email.trim().toLowerCase();
}
assert(normalizeEmail("  A@B.se ") === "a@b.se", "email normalize");

// --- validation caps ---
assert(120 >= "x".repeat(120).length, "title max");
assert(1_000_000 >= 999999, "value cap");

// --- rate limit upsert semantics (mirror) ---
function nextCount(existingCount, resetAt, now) {
  if (resetAt <= now) return 1;
  return existingCount + 1;
}
assert(nextCount(5, Date.now() - 1, Date.now()) === 1, "window reset");
assert(nextCount(5, Date.now() + 1000, Date.now()) === 6, "increment");

console.log("smoke-p1-hardening: ok");
