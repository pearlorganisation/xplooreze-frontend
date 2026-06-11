const AI_NOTE_MAKER_DRAFT_KEY = "aiNoteMakerDraft";
const POST_LOGIN_REDIRECT_KEY = "postLoginRedirect";
const POST_LOGIN_REDIRECT_KEY_LS = "xplorzee_postLoginRedirect";
const REDIRECT_SOURCE = "ai-note-maker";
const REDIRECT_TTL_MS = 10 * 60 * 1000;

export { AI_NOTE_MAKER_DRAFT_KEY };

function redirectPayload() {
  return JSON.stringify({
    path: "/ai-note-maker",
    source: REDIRECT_SOURCE,
    ts: Date.now(),
  });
}

export function setPostLoginReturnToAiNoteMaker() {
  const payload = redirectPayload();
  try {
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, payload);
  } catch {
    // ignore
  }
  try {
    localStorage.setItem(POST_LOGIN_REDIRECT_KEY_LS, payload);
  } catch {
    // ignore
  }
}

export function clearPostLoginReturnMarkers() {
  try {
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(POST_LOGIN_REDIRECT_KEY_LS);
  } catch {
    // ignore
  }
}

function readPostLoginRedirectRaw() {
  try {
    return (
      sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY) ||
      localStorage.getItem(POST_LOGIN_REDIRECT_KEY_LS)
    );
  } catch {
    return null;
  }
}

/** Returns "/ai-note-maker" if valid pending redirect, else null. */
export function getPostLoginRedirectPathOrNull() {
  const raw = readPostLoginRedirectRaw();
  if (!raw) return null;
  try {
    const parsed = raw.startsWith("/")
      ? { path: raw.trim(), source: REDIRECT_SOURCE, ts: Date.now() }
      : JSON.parse(raw);
    const ok =
      parsed?.source === REDIRECT_SOURCE &&
      typeof parsed.path === "string" &&
      parsed.path.startsWith("/") &&
      typeof parsed.ts === "number" &&
      Date.now() - parsed.ts < REDIRECT_TTL_MS;
    return ok ? parsed.path : null;
  } catch {
    return null;
  }
}

export function setPostLoginReturnIfOnAiNoteMaker(pathname) {
  if (pathname === "/ai-note-maker") {
    setPostLoginReturnToAiNoteMaker();
  }
}
