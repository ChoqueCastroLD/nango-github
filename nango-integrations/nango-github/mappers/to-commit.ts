import type { Commit, Organization } from "../../models";
import { CommitGraphQLResponse, OrganizationGraphQLResponse } from "../types";

export function toCommit(edge: CommitGraphQLResponse, branch: string): Commit {
  const node = edge.node;

  const organizations: Organization[] =
    node.author.user?.organizations.nodes.map(
      (org: OrganizationGraphQLResponse) => ({
        id: org.id,
        name: org.name,
        url: org.url,
        avatarUrl: org.avatarUrl,
        description: org.description || "",
        websiteUrl: org.websiteUrl || "",
      })
    );

  return {
    id: node.id,
    url: node.url,
    message: node.message,
    additions: node.additions,
    deletions: node.deletions,
    changedFiles: node.changedFiles,
    branch: branch,
    author: {
      id: node.author.user.id,
      url: node.author.user.url,
      bio: node.author.user.bio || "",
      avatarUrl: node.author.user.avatarUrl,
      location: node.author.user.location || "",
      organizations: organizations,
    },
  };
}
