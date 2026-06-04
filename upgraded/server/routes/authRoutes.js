const express = require("express");
const authMiddleware = require("../middleware/authMiddleware")
const { signup , login } = require("../controllers/authController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login" , login);
router.get("/me" , authMiddleware);

module.exports = router;