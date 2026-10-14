const { body } = require("express-validator");

const adminRegisterRules = [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("username")
        .trim()
        .toLowerCase()
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be 3 to 30 characters")
        .matches(/^[a-z0-9._]+$/)
        .withMessage("Username can use letters, numbers, dots, and underscores"),
    body("phone").trim().matches(/^\+?[0-9]{10,15}$/).withMessage("Provide a valid phone number"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("email").trim().isEmail().withMessage("Provide a valid email").normalizeEmail(),
];

module.exports = { adminRegisterRules };
