const validator = require("validator");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required field"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Email is required field"],
    validate: [
      validator.default.isEmail,
      "Please provide a valid email adress",
    ],
    unique: true,
    lowercase: true,
    trim: true,
  },
  photo: { type: String, default: "default.jpg" },
  role: {
    type: String,
    enum: ["user", "guide", "lead-guide", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Password is a required field"],
    minlength: [8, "Password must be at least 8 characters"],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      // This only wokrs on CREATE and SAVE !
      validator: function (value) {
        return value === this.password;
      },
      message: "Passwords are not the same! ",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const saltRounds = 10;
  this.password = await bcrypt.hash(this.password, saltRounds);

  this.passwordConfirm = undefined;
  next();
});

//pre("save") funkcija ce se pokrenuti pre nego sto se novi dokument sacuva
userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; //stavljanje 1 sekunde manje ce osigurati da se token uvek
  // kreira( signToken(user._id) za resetPassword) nakon sto je lozinka promenjna.
  //Razlog je to sto se podaci u bazi podataka sporije sacuvavaju nego izdavanje JWT-a.
  // Ako se desi da vremenska oznaka postavi posle kreiranja JWT-a korisnik NECE moci da se prijavi pomocu
  // novog tokena .
  next();
});
userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } }); //Da smo postavili eq:true ne bi bilo rezultata.
  //Zato sto ostali korisnici nemoju svojstvu za active postavljeno na true
  next();
});
//Ne mozemo koristit this jer smo password objektu porsledili select: false .Stoga moramo koristiti ovaj pristup
//Ovo funkcija predstavlja instancu metoda(methods) ,stoga bice dostupna svim user dokumentima.
//Cilj je uporediti sifre i vratiti true ili false

userSchema.methods.correctPassword = async function (
  reqBodyPassword,
  userPassword
) {
  return await bcrypt.compare(reqBodyPassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (jwtIssuedAt) {
  if (this.passwordChangedAt) {
    const changedTimestamp = +this.passwordChangedAt.getTime() / 1000; //Zelimo sekunde

    return jwtIssuedAt < changedTimestamp; // 100 < 200
  } //pr:Token je izdat u vermenu 100 a onda smo promenili lozinku u trenutku 200 tj lozinku nakon sto je token
  //izdat.Stoga ovo je true

  //False znaci da nije promenjeno
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  //Ovaj token cemo poslati korsniku i to je kao resetovanje lozinke koju korisnik tada moze koristiti
  //za kreiranje nove prave lozinke.Samo ce korisnik imati pristup ovoj lozinki

  const resetToken = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 15 * 60 * 1000; //token istice za 10 min (kao mera sigurnosti)

  return resetToken;
};
const User = mongoose.model("User", userSchema);

module.exports = { User };
