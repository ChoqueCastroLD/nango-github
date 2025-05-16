import { NangoSync } from "../../models";
import { RateLimitGraphQLResponse } from "../types";
import { shouldAbortSync } from "./check-for-time-limit";

const rateLimitQuery = `
query {
  rateLimit {
    limit
    cost
    remaining
    resetAt
  }
}
`;

export async function waitForGraphQLRateLimitIfNeeded(
  nango: NangoSync,
  startTime: Date
): Promise<boolean> {
  try {
    if (shouldAbortSync(startTime)) {
      await nango.log(
        "Aborting sync while waiting for rate limit due to 20 hours time limit",
        {
          level: "warn",
        }
      );
      return false;
    }
    const resp = await nango.proxy<RateLimitGraphQLResponse>({
      endpoint: "https://api.github.com/graphql",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: { query: rateLimitQuery },
    });

    const rateLimit = resp.data.data.rateLimit;
    const remaining = rateLimit.remaining;
    const cost = rateLimit.cost;
    const resetAt = new Date(rateLimit.resetAt).getTime();

    if (remaining < cost) {
      const waitTime = resetAt - Date.now();
      await nango.log(
        `Rate limit low (remaining: ${remaining}, cost: ${cost}), waiting ${Math.ceil(
          waitTime / 1000
        )}s until reset`
      );
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
      return await waitForGraphQLRateLimitIfNeeded(nango, startTime);
    }
  } catch (error: any) {
    const status = error?.response?.status;
    const message = error?.response?.data?.message || "";

    if (status === 403 && message.includes("rate limit")) {
      await nango.log("Rate limit hit (403). Waiting 60s before retry...");
      await new Promise((resolve) => setTimeout(resolve, 60 * 1000));
      return await waitForGraphQLRateLimitIfNeeded(nango, startTime);
    }

    throw error;
  } finally {
    return true;
  }
}
