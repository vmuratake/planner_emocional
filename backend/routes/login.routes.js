const express = require("express");
const router = express.Router();

const loginController = require("../controllers/login.controller");

// POST /auth/register
router.post("/register", loginController.register);

// POST /auth/login
router.post("/login", loginController.login);

module.exports = router;