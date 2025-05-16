import type {
  GithubRepositoryInput,
  NangoSync,
  PullRequest,
} from "../../models";
import { shouldAbortSync } from "../helpers/check-for-time-limit";
import { waitForGraphQLRateLimitIfNeeded } from "../helpers/wait-for-rate-limit";
import { toPullRequest } from "../mappers/to-pullrequest";
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

    const query = buildPullRequestsQuery(
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

    const data = gqlResponse?.data?.data;
    if (!data || !data.repository || !data.repository.pullRequests) {
      await nango.log("No data returned for pull requests. Exiting.", {
        level: "error",
      });
      break;
    }

    const rateLimit = data.rateLimit;
    await nango.log(
      `Rate Limit - Remaining: ${rateLimit.remaining}, Cost: ${rateLimit.cost}, Reset At: ${rateLimit.resetAt}`
    );

    const pageData = data.repository.pullRequests;
    const edges = pageData.edges || [];

    const pullRequests: PullRequest[] = edges.map(toPullRequest);

    if (pullRequests.length > 0) {
      await nango.batchSave(pullRequests, "PullRequest");
      await nango.log(`Saved ${pullRequests.length} pull requests`);
    }

    hasNextPage = pageData.pageInfo.hasNextPage;
    cursor = pageData.pageInfo.endCursor;
  }
}

function buildPullRequestsQuery(
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
          pullRequests(first: 100${cursor ? `, after: "${cursor}"` : ""}) {
            pageInfo {
              hasNextPage
              endCursor
            }
            edges {
              node {
                id
                url
                title
                author {
                  ... on User {
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
                labels(first: 10) {
                  nodes {
                    name
                  }
                }
                comments {
                  totalCount
                }
              }
            }
          }
        }
      }
    `;
}
