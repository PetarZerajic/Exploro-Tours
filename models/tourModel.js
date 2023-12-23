const mongoose = require("mongoose");
const slugify = require("slugify");
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      unique: true,
      trim: true,
      maxLength: [40, "A tour name must have less or equal then 40 characters"],
      minLength: [10, "A tour name must have more or equal then 10 characters"],
    },
    slug: String,

    duration: {
      type: Number,
      required: [true, "A tour must have a duration"],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group size"],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a difficulty"],
      //enum vazi samo za stringove
      enum: {
        values: ["easy", "medium", "difficult"],
        message:
          "{VALUE} is not supported.Difficulty is either: easy, medium ,difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Rating must be above 1.0 "],
      max: [5, "Rating must be below 5.0"],
      set: (val) => Math.round(val * 10) / 10, //4.66 ,46.66 ~~ 47/10=4.7
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (value) {
          //this ce raditi samo trenutnim dokumentom kada ga budemo kreirali (nece raditi za azuriranje)
          return value < this.price;
        },
        message: "Discount price {VALUE} should be below regular price",
      },
    },
    summary: {
      type: String,
      required: [true, "A tour must have a summary"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a image cover"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      coordinates: [Number],
      adress: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        coordinates: [Number],
        adress: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // reviews: [
    //   {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref:"Review"
    //   },
    // ],
  },
  {
    toJSON: {
      virtuals: true,
    },
    toObject: {
      virtuals: true,
    },
  }
);

tourSchema.index({ price: 1, ratingsAverage: 1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: "2dsphere" });
tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

//Uz pomoc virtual svojstva popunjavamo ture recenzijama.Dobijamo pristup na sve recenzije za odredjenu turu.
//Ali bez zadrzavanja niza ID-ova na turama u bazi podataka.Ovo ce resiti problem beskonacnog dodavanja id-ova
// u nizu recenzija (pr: reviews niz gore).Child reference
tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});
//Document Middleware:pokrece se pre .save() naredbe i posle create() naredbe.Nece raditi za update

tourSchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

//QUERY MIDDLEWARE

// tourSchema.pre("save", async function (next) {
//   const guidesPromisses = this.guides.map((id) => User.findById(id));
//   this.guides = await Promise.all(guidesPromisses);
//   next();
// });

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

//populate fukcnija pravi novi query i to moze uticati na performans
tourSchema.pre(/^find/, function (next) {
  this.populate({ path: "guides", select: "-__v -passwordChangedAt" });

  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   // console.log(`Query took ${Date.now() - this.start} milliseconds`);
//   // console.log(docs);
//   next();
// });
// tourSchema.pre("aggregate", function (next) {
//   this.pipeline().unshift({
//     $match: {
//       secretTour: { $ne: true },
//     },
//   });
//   console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model("Tour", tourSchema);

module.exports = { Tour };
