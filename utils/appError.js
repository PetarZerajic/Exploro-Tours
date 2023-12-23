class AppError extends Error {
  constructor(statusCode, message) {
    // Da bismo pristupili svojstvima iz roditeljske klase, moramo pozvati super()
    // Konstruktor child klase ne može koristiti this dok super() se ne pozove
    super();
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "Fail" : "Error";
    this.message = message;
    this.isOperational = true; //Ovo su greske koje znamo i kojima verujemo (korisnik pristupa pogresnoj ruti koja ne postoji ili pokusa uneti nevazece podatke)
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
