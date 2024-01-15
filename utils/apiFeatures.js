class ApiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    const pattern = /\b(gte|gt|lte|lt|eq)\b/g;
    queryStr = queryStr.replace(pattern, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(",").join(" ");
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort("-createdAt");
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(",").join(" ");
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select("-__v");
    }

    return this;
  }

  paginate() {
    //  page=1&limit=10 , 1-10, page 1 , 11-20, page 2, 21-30 page 3
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 100;

    const start = (page - 1) * limit;
    this.query = this.query.skip(start).limit(limit);

    return this;
  }
}

module.exports = { ApiFeatures };
