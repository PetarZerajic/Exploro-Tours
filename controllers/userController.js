const { User } = require("../models/userModel");
const { AppError } = require("../utils/appError");
const { getAll, deleteOne, updateOne, getOne } = require("./handlerFactory");
const multer = require("multer");
const sharp = require("sharp");

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

const resizeUserPhoto = async (req, res, next) => {
  try {
    if (!req.file) return next();

    req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

    await sharp(req.file.buffer)
      .resize(500, 500)
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toFile(`public/img/users/${req.file.filename}`);

    next();
  } catch (err) {
    next(err);
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
  req.params.id = req.user.id;
  next();
};

const updateUser = updateOne(User);

const updateMe = async (req, res, next) => {
  try {
    const { password, confirmPassword } = req.body;

    if (password || confirmPassword) {
      return next(
        new AppError(
          400,
          "This route is not for password updates.Please use /updateMyPassword"
        )
      );
    }
    const filteredBody = filterObj(req.body, "name", "email");

    if (req.file) filteredBody.photo = req.file.filename;

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
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
    await User.findByIdAndUpdate(req.user.id, { active: false });

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    next(err);
  }
};

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
