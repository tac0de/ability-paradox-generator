import type { Handler } from "@netlify/functions";
import { extractBearerToken, verifyFirebaseIdToken } from "./_lib/firebaseAuth";

function json(statusCode: number, body: Record<string, unknown>) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== "GET") {
      return json(405, { error: "Method not allowed" });
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCP_PROJECT_ID || "";
    if (!projectId) {
      return json(500, { error: "Missing FIREBASE_PROJECT_ID/GCP_PROJECT_ID" });
    }

    const token = extractBearerToken(event.headers.authorization || event.headers.Authorization);
    const claims = await verifyFirebaseIdToken(token, projectId);
    const userId = String(claims.sub);

    // DB repository integration point:
    // 1) initialize DbAbilityRepository with real DB client
    // 2) load user progress by userId
    // For now returns safe stub until DB client wiring is complete.
    return json(200, {
      ok: true,
      user: {
        userId,
        email: claims.email || null,
      },
      progress: {
        attitude: 50,
        totalGenerated: 0,
        comboCount: 0,
        dailyStreak: 0,
        achievements: [],
        treasury: [],
      },
    });
  } catch (error) {
    return json(401, {
      ok: false,
      error: String((error as Error)?.message || error),
    });
  }
};

