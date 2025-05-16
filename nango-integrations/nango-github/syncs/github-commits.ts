import type { GithubRepositoryInput, NangoSync, Commit } from "../../models";
import { shouldAbortSync } from "../helpers/check-for-time-limit";
import { waitForGraphQLRateLimitIfNeeded } from "../helpers/wait-for-rate-limit";
import { toCommit } from "../mappers/to-commit";
import { githubRepositoryInputSchema } from "../schema.zod";
import { CommitGraphQLResponse } from "../types";

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

    const query = buildCommitsQuery(
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

    const defaultBranchRef = gqlResponse.data.data.repository.defaultBranchRef;

    const pageData = defaultBranchRef.target.history;
    const branch = defaultBranchRef.name;
    const edges = pageData.edges;

    const commits: Commit[] = edges.map((edge: CommitGraphQLResponse) =>
      toCommit(edge, branch)
    );

    if (commits.length > 0) {
      await nango.batchSave(commits, "Commit");
      await nango.log(`Saved ${commits.length} commits`);
    }

    hasNextPage = pageData.pageInfo.hasNextPage;
    cursor = pageData.pageInfo.endCursor;
  }
}

function buildCommitsQuery(
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
          defaultBranchRef {
            name
            target {
              ... on Commit {
                history(first: 100${cursor ? `, after: "${cursor}"` : ""}) {
                  pageInfo {
                    hasNextPage
                    endCursor
                  }
                  edges {
                    node {
                      id
                      url
                      message
                      additions
                      deletions
                      changedFiles
                      author {
                        user {
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
              }
            }
          }
        }
      }
    `;
}
