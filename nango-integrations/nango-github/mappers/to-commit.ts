import type { Commit, Organization } from "../../models";
import { CommitGraphQLResponse } from "../types";
import { toOrganization } from "./to-organization";

export function toCommit(edge: CommitGraphQLResponse, branch: string): Commit {
  const node = edge.node;

  const organizations: Organization[] =
    node.author.user?.organizations?.nodes.map(toOrganization) || [];

  const authorObject = node.author?.user
    ? {
        author: {
          id: node.author.user.id,
          url: node.author.user.url,
          bio: node.author.user.bio || "",
          avatarUrl: node.author.user.avatarUrl,
          location: node.author.user.location || "",
          organizations: organizations,
        },
      }
    : {};

  return {
    id: node.id,
    url: node.url,
    message: node.message,
    additions: node.additions,
    deletions: node.deletions,
    changedFiles: node.changedFiles,
    branch: branch,
    ...authorObject,
  };
}
