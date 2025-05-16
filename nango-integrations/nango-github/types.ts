export interface RateLimitGraphQLResponse {
  data: {
    rateLimit: {
      limit: number;
      cost: number;
      remaining: number;
      resetAt: string;
    };
  };
}

export interface OrganizationGraphQLResponse {
  id: string;
  name: string;
  url: string;
  avatarUrl: string;
  description: string | null;
  websiteUrl: string | null;
}

export interface StargazerGraphQLResponse {
  starredAt: string;
  node: {
    id: string;
    url: string;
    bio: string | null;
    avatarUrl: string;
    location: string | null;
    organizations: {
      nodes: OrganizationGraphQLResponse[];
    };
  };
}

export interface CommitGraphQLResponse {
  node: {
    id: string;
    url: string;
    message: string;
    additions: number;
    deletions: number;
    changedFiles: number;
    author: {
      user: {
        id: string;
        url: string;
        bio: string | null;
        avatarUrl: string;
        location: string | null;
        organizations: {
          nodes: OrganizationGraphQLResponse[];
        };
      };
    };
  };
}
