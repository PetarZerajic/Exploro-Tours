class ApiFeatures {
  //query pripada mongusa, a queryString dobijamo od ekspresa
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ["page", "sort", "limit", "fields"];
    excludedFields.forEach((el) => delete queryObj[el]);

    let queryStr = JSON.stringify(queryObj);
    const pattern = /\b(gte|gt|lte|lt)\b/g; //Zelimo da uskladimo reci.Bez g bi samo uzeo prvu rec
    queryStr = queryStr.replace(pattern, (match) => `$${match}`); //Podudaramo reci sa obrascem i dodajemo mu $ znak

    this.query = this.query.find(JSON.parse(queryStr));

    return this; //Odnosi se na instancu objekta na kojoj se metoda trenutno poziva. Koristi se za ulančavanje
  }

  sort() {
    if (this.queryString.sort) {
      console.log(this.queryString);
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
      this.query = this.query.select("-__v"); // - ovde oznacava da ce polje biti iskljuceno
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
