import type { QueryParams } from "./query-parser";

type SortDirection = "asc" | "desc";

interface SortConfig {
  field: string;
  direction: SortDirection;
}

interface QueryBuilderResult {
  skip: number;
  take: number;
  where: Record<string, unknown>;
  orderBy: Record<string, SortDirection>;
}

export class QueryBuilder {
  private params: QueryParams;
  private searchFields: string[];
  private allowedSortFields: string[];
  private defaultSort: SortConfig;

  constructor(params: QueryParams) {
    this.params = params;
    this.searchFields = [];
    this.allowedSortFields = [];
    this.defaultSort = { field: "createdAt", direction: "desc" };
  }

  withSearch(fields: string[]): this {
    this.searchFields = fields;
    return this;
  }

  withSort(allowedFields: string[], defaultSort?: SortConfig): this {
    this.allowedSortFields = allowedFields;
    if (defaultSort) this.defaultSort = defaultSort;
    return this;
  }

  build(): QueryBuilderResult {
    const skip = (this.params.page - 1) * this.params.limit;
    const take = this.params.limit;

    const where: Record<string, unknown> = {};

    if (this.params.search && this.searchFields.length > 0) {
      where.OR = this.searchFields.map((field) => ({
        [field]: { contains: this.params.search },
      }));
    }

    let orderBy: Record<string, SortDirection> = {
      [this.defaultSort.field]: this.defaultSort.direction,
    };

    if (this.params.sort) {
      const isDesc = this.params.sort.startsWith("-");
      const field = isDesc ? this.params.sort.slice(1) : this.params.sort;
      const direction: SortDirection = isDesc ? "desc" : "asc";

      if (this.allowedSortFields.includes(field)) {
        orderBy = { [field]: direction };
      }
    }

    return { skip, take, where, orderBy };
  }
}
