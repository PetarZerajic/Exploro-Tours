const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({
  path: "./config.env",
});
const app = require("./app");

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connection to database established");
  })
  .catch((err) => {
    console.log(`${err}`);
  });

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port: ${port}...`);
});

process.on("unhandledRejection", (error) => {
  console.log(error);
  //Graceful Shutdown
  //Prvo zatvaramo server pa tek onda gasimo aplikaciju.
  server.close(() => {
    process.exit(1); //0 znači završiti proces bez ikakvog kvara, a 1 znači završiti proces s nekim neuspjehom.
  });
});
