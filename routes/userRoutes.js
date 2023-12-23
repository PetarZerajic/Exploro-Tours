const express = require("express");
const {
  register,
  logIn,
  forgotPasword,
  resetPassword,
  updatePassword,
  protect,
  restrictTo,
} = require("../controllers/authController");
const {
  getAllUsers,
  getUser,
  getMe,
  updateUser,
  updateMe,
  deleteMe,
  deleteUser,
} = require("../controllers/userController");

const router = express.Router();

router.post("/register", register);
router.post("/login", logIn);
router.post("/forgotPasword", forgotPasword),
  router.patch("/resetPassword/:token", resetPassword);

router.patch("/updateMyPassword", protect, updatePassword);
router.patch("/updateMe", protect, updateMe);
router.get("/getMe", protect, getMe, getUser);
router.delete("/deleteMe", protect, deleteMe);

router.route("/").get(protect, restrictTo("admin"), getAllUsers);
router
  .route("/:id")
  .get(protect, restrictTo("admin"), getUser)
  .patch(protect, restrictTo("admin"), updateUser)
  .delete(protect, restrictTo("admin"), deleteUser);
module.exports = router;
