import type { GithubRepositoryInput, NangoSync, StarGazer } from "../../models";
import { shouldAbortSync } from "../helpers/check-for-time-limit";
import { waitForGraphQLRateLimitIfNeeded } from "../helpers/wait-for-rate-limit";
import { toStargazer } from "../mappers/to-stargazer";
import { githubRepositoryInputSchema } from "../schema.zod";

export default async function fetchData(nango: NangoSync): Promise<void> {
  const startTime = new Date();

  const repositoryInput = await nango.getMetadata<GithubRepositoryInput>();

  await nango.zodValidateInput({
    zodSchema: githubRepositoryInputSchema,
    input: repositoryInput,
  });

  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    if (shouldAbortSync(startTime)) {
      await nango.log("Aborting sync due to 20 hours time limit", {
        level: "warn",
      });
      break;
    }

    const shouldContinue = await waitForGraphQLRateLimitIfNeeded(
      nango,
      startTime
    );

    if (!shouldContinue) {
      break;
    }

    const query = buildStarGazersQuery(
      repositoryInput.owner,
      repositoryInput.repo,
      cursor
    );

    const gqlResponse = await nango.proxy({
      endpoint: "https://api.github.com/graphql",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      data: { query },
    });

    const rateLimit = gqlResponse.data.data.rateLimit;

    await nango.log(
      `Rate Limit - Remaining: ${rateLimit.remaining}, Cost: ${rateLimit.cost}, Reset At: ${rateLimit.resetAt}`
    );

    const pageData = gqlResponse.data.data.repository.stargazers;
    const edges = pageData.edges;

    const stars: StarGazer[] = edges.map(toStargazer);

    if (stars.length > 0) {
      await nango.batchSave(stars, "StarGazer");
      await nango.log(`Saved ${stars.length} stargazers`);
    }

    hasNextPage = pageData.pageInfo.hasNextPage;
    cursor = pageData.pageInfo.endCursor;
  }
}

function buildStarGazersQuery(
  owner: string,
  repo: string,
  cursor: string | null
): string {
  return `
    query {
      rateLimit {
        limit
        cost
        remaining
        resetAt
      }
      repository(owner: "${owner}", name: "${repo}") {
        stargazers(first: 100${cursor ? `, after: "${cursor}"` : ""}) {
          pageInfo {
            hasNextPage
            endCursor
          }
          edges {
            starredAt
            node {
              id
              url
              bio
              avatarUrl
              location
              organizations(first: 10) {
                nodes {
                  id
                  name
                  url
                  avatarUrl
                  description
                  websiteUrl
                }
              }
            }
          }
        }
      }
    }
  `;
}
