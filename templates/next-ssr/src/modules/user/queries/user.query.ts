import { QueryBuilder } from "@/lib/query/query-builder";
import type { SearchUserInput } from "../schemas/user.schema";

export function buildUserQuery(params: SearchUserInput) {
  const builder = new QueryBuilder({
    page: params.page,
    limit: params.limit,
    search: params.search,
    sort: params.sort,
  });

  const result = builder
    .withSearch(["name", "email"])
    .withSort(["name", "email", "createdAt", "updatedAt"])
    .build();

  // Add module-specific filters
  const where = { ...result.where, deletedAt: null } as Record<string, unknown>;

  if (params.role) {
    where.role = { name: params.role };
  }

  if (params.isActive !== undefined) {
    where.isActive = params.isActive;
  }

  return { ...result, where };
}
