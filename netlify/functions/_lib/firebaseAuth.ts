import * as crypto from "node:crypto";

type FirebaseClaims = {
  aud: string;
  iss: string;
  sub: string;
  iat: number;
  exp: number;
  email?: string;
  email_verified?: boolean;
  firebase?: Record<string, unknown>;
  [key: string]: unknown;
};

type CertCache = {
  expiresAtMs: number;
  certs: Record<string, string>;
};

let certCache: CertCache = { expiresAtMs: 0, certs: {} };

function base64UrlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(`${normalized}${pad}`, "base64");
}

function parseJwt(token: string): { header: Record<string, unknown>; payload: FirebaseClaims; signed: string; signature: Buffer } {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT format");
  const [h, p, s] = parts;
  const header = JSON.parse(base64UrlDecode(h).toString("utf8"));
  const payload = JSON.parse(base64UrlDecode(p).toString("utf8"));
  const signature = base64UrlDecode(s);
  return { header, payload, signed: `${h}.${p}`, signature };
}

function parseMaxAgeSeconds(cacheControl: string | null): number {
  if (!cacheControl) return 300;
  const m = cacheControl.match(/max-age=(\d+)/i);
  return m ? Number.parseInt(m[1], 10) : 300;
}

async function fetchGoogleCerts(): Promise<Record<string, string>> {
  const now = Date.now();
  if (now < certCache.expiresAtMs && Object.keys(certCache.certs).length > 0) {
    return certCache.certs;
  }

  const res = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch Firebase certs: ${res.status}`);
  }
  const certs = (await res.json()) as Record<string, string>;
  const maxAge = parseMaxAgeSeconds(res.headers.get("cache-control"));
  certCache = {
    certs,
    expiresAtMs: now + maxAge * 1000,
  };
  return certs;
}

function assertClaimRules(claims: FirebaseClaims, projectId: string) {
  const nowSec = Math.floor(Date.now() / 1000);
  if (claims.aud !== projectId) throw new Error("Invalid aud claim");
  if (claims.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error("Invalid iss claim");
  }
  if (!claims.sub || claims.sub.length === 0) throw new Error("Missing sub claim");
  if (claims.exp < nowSec) throw new Error("Expired token");
  if (claims.iat > nowSec + 60) throw new Error("Token issued in the future");
}

export async function verifyFirebaseIdToken(idToken: string, projectId: string): Promise<FirebaseClaims> {
  if (!projectId) throw new Error("projectId is required");
  const { header, payload, signed, signature } = parseJwt(idToken);
  const alg = String(header.alg || "");
  const kid = String(header.kid || "");

  if (alg !== "RS256") throw new Error("Unsupported token alg");
  if (!kid) throw new Error("Missing JWT kid");

  const certs = await fetchGoogleCerts();
  const cert = certs[kid];
  if (!cert) throw new Error("Unknown signing kid");

  const verify = crypto.createVerify("RSA-SHA256");
  verify.update(signed);
  verify.end();
  const valid = verify.verify(cert, signature);
  if (!valid) throw new Error("Invalid Firebase token signature");

  assertClaimRules(payload, projectId);
  return payload;
}

export function extractBearerToken(authHeader: string | undefined): string {
  if (!authHeader) throw new Error("Missing authorization header");
  const [scheme, token] = authHeader.split(" ");
  if ((scheme || "").toLowerCase() !== "bearer" || !token) {
    throw new Error("Invalid authorization header format");
  }
  return token;
}
