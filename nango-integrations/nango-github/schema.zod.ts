import { z } from 'zod';

export const githubRepositoryInputSchema = z.object({
    owner: z.string(),
    repo: z.string(),
});