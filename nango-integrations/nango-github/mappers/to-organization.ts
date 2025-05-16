import type { Organization } from "../../models";
import { OrganizationGraphQLResponse } from "../types";

export function toOrganization(
  organization: OrganizationGraphQLResponse
): Organization {
  return {
    id: organization.id,
    name: organization.name,
    url: organization.url,
    avatarUrl: organization.avatarUrl,
    description: organization.description || "",
    websiteUrl: organization.websiteUrl || "",
  };
}
