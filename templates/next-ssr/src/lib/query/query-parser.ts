import { z } from 'zod';

export const queryParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sort: z.string().optional(),
});

export type QueryParams = z.infer<typeof queryParamsSchema>;

export function parseQueryParams(searchParams: URLSearchParams): QueryParams {
  return queryParamsSchema.parse({
    page: searchParams.get('page') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    sort: searchParams.get('sort') ?? undefined,
  });
}
