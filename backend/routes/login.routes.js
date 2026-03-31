const express = require("express");
const router = express.Router();

const loginController = require("../controllers/login.controller");

// POST /auth/register
router.post("/register", loginController.register);

// POST /auth/login
router.post("/login", loginController.login);

// DELETE /auth/:id
router.delete("/:id", loginController.deleteAccount);

// UPDATE /auth/:id
router.put("/:id", loginController.updateProfile);

// POST /auth/forgot-password
router.post("/forgot-password", loginController.forgotPassword);

// POST /auth/reset-password
router.post("/reset-password", loginController.resetPassword);

module.exports = router;