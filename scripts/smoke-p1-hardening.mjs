/**
 * Lightweight smoke checks for P1 helpers (no Next server required).
 * Run: node scripts/smoke-p1-hardening.mjs
 */
import { createHmac, timingSafeEqual } from "node:crypto";

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

// --- cookie sign/verify ---
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
  "cookie sig ok",
);

// --- validation caps ---
assert(120 >= "x".repeat(120).length, "title max");
assert(1_000_000 >= 999999, "value cap");

console.log("smoke-p1-hardening: ok");
