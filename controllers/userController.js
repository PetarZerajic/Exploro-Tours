const { User } = require("../models/userModel");
const { AppError } = require("../utils/appError");
const { getAll, deleteOne, updateOne, getOne } = require("./handlerFactory");
const multer = require("multer");
const sharp = require("sharp");

// const multerStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, "public/img/users");
//   },
//   filename: function (req, file, cb) {
//     const extension = file.mimetype.split("/")[1];
//     cb(null, `user-${req.user.id}-${Date.now()}.${extension}`);
//   },
// });

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new AppError(400, "Not an image! Please upload only images"), false);
  }
};
const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
});

const uploadUserPhoto = upload.single("photo");

const resizeUserPhoto = (req, res, next) => {
  console.log(req.file);
  if (!req.file) {
    return next();
  } else {
    const extension = req.file.mimetype.split("/")[1];

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpg`;

    sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);
  }
};

const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      newObj[el] = obj[el];
    }
  });
  return newObj;
};
const getAllUsers = getAll(User);

const getUser = getOne(User);

const getMe = (req, res, next) => {
  //Id iz parametra se dobija kada se korisnik uloguje.
  req.params.id = req.user.id;

  next();
};

//Samo za admina .NE azurirati sifre sa ovim
const updateUser = updateOne(User);

const updateMe = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;
    //1) Create error if user POSTS password data
    if (password || confirmPassword) {
      return next(
        new AppError(
          400,
          "This route is not for password updates.Please use /updateMyPassword"
        )
      );
    }
    //2) Filtered out unwanted fields name that are not allowed to be updated
    const filteredBody = filterObj(req.body, "name", "email", "photo");
    if (req.file) filteredBody.photo = req.file.filename;
    //3) Update user document
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true, //U slucaju da postavimo nevazecu adresu ona bi trebala biti uhvacena od strane validatora
      }
    );

    res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    next(err);
  }
};

const deleteMe = async (req, res, next) => {
  try {
    //Cilje je da ih oznacimo kao neaktivne a ne da ih izbirisemo iz BP (primer ako neko hoce da vrati svoj nalog)
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

//Samo za admina
const deleteUser = deleteOne(User);

module.exports = {
  uploadUserPhoto,
  resizeUserPhoto,
  getAllUsers,
  getUser,
  getMe,
  updateMe,
  deleteMe,
  updateUser,
  deleteUser,
};
