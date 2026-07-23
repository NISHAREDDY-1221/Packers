export class APIFeatures {
  query: any;
  queryString: any;

  constructor(query: any, queryString: any) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields", "search"];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Handle standard exact match filters
    if (Object.keys(queryObj).length > 0) {
      this.query = {
        ...this.query,
        where: { ...this.query.where, ...queryObj },
      };
    }

    return this;
  }

  search(searchFields: string[]) {
    if (this.queryString.search && searchFields.length > 0) {
      const search = this.queryString.search;
      const OR = searchFields.map((field) => ({
        [field]: { contains: search, mode: "insensitive" },
      }));

      this.query = {
        ...this.query,
        where: {
          ...this.query.where,
          OR,
        },
      };
    }
    return this;
  }

  sort(defaultSort: any = { createdAt: "desc" }) {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      // Prisma expects an object for sorting: { field: 'asc'|'desc' }
      // This is a simplified sort for single fields right now, can be expanded
      const sortField = sortBy.startsWith("-") ? sortBy.substring(1) : sortBy;
      const sortOrder = sortBy.startsWith("-") ? "desc" : "asc";
      this.query = { ...this.query, orderBy: { [sortField]: sortOrder } };
    } else {
      this.query = { ...this.query, orderBy: defaultSort };
    }
    return this;
  }

  paginate() {
    const page = parseInt(this.queryString.page as string, 10) || 1;
    const limit = parseInt(this.queryString.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    this.query = { ...this.query, skip, take: limit };
    return this;
  }
}
