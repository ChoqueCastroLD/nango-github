export interface StargazerGraphQLResponse {
  starredAt: string;
  node: {
    id: string;
    url: string;
    bio: string | null;
    avatarUrl: string;
    location: string | null;
    organizations: {
      nodes: {
        id: string;
        name: string;
        url: string;
        avatarUrl: string;
        description: string | null;
        websiteUrl: string | null;
      }[];
    };
  };
}

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
