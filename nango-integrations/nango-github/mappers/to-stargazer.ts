import type { StarGazer, Author, Organization } from "../../models";
import type { StargazerGraphQLResponse } from "../types";
import { toOrganization } from "./to-organization";

export function toStargazer(edge: StargazerGraphQLResponse): StarGazer {
  const organizations: Organization[] =
    edge.node.organizations.nodes.map(toOrganization);

  const user: Author = {
    id: edge.node.id,
    url: edge.node.url,
    bio: edge.node.bio || "",
    avatarUrl: edge.node.avatarUrl,
    location: edge.node.location || "",
    organizations,
  };

  return {
    id: `${edge.node.id}_${edge.starredAt}`,
    user,
    createdAt: new Date(edge.starredAt),
  };
}
