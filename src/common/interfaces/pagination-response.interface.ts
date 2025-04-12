export interface PaginationResponse<T> {
    items: T[];
    meta: {
      totalItems: number;
      itemCount: number;
      itemsPerPage: number;
      totalPages: number;
      currentPage: number;
    };
    links?: {
      first?: string;
      previous?: string;
      current: string;
      next?: string;
      last?: string;
    };
  }