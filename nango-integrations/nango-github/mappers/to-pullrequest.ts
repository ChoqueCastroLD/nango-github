import type { PullRequest, Organization } from "../../models";
import { toOrganization } from "./to-organization";

export function toPullRequest(edge: any): PullRequest {
  const node = edge.node;

  const organizations: Organization[] =
    node.author?.organizations?.nodes.map(toOrganization) || [];

  return {
    id: node.id,
    url: node.url,
    title: node.title,
    author: {
      id: node.author?.id || "",
      url: node.author?.url || "",
      bio: node.author?.bio || "",
      avatarUrl: node.author?.avatarUrl || "",
      location: node.author?.location || "",
      organizations: organizations,
    },
    labels: node.labels?.nodes.map((label: any) => label.name) || [],
    numberOfComments: node.comments.totalCount,
  };
}
