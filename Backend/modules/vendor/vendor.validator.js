const { body } = require("express-validator");

const vendorRegisterRules = [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2 }).withMessage("Name must be at least 2 characters"),
    body("phone").trim().matches(/^\+?[0-9]{10,15}$/).withMessage("Provide a valid phone number"),
    body("username")
        .trim()
        .toLowerCase()
        .isLength({ min: 3, max: 30 })
        .withMessage("Username must be 3 to 30 characters")
        .matches(/^[a-z0-9._]+$/)
        .withMessage("Username can use letters, numbers, dots, and underscores"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("companyName")
        .trim()
        .notEmpty()
        .withMessage("Company name is required")
        .isLength({ min: 2 })
        .withMessage("Company name must be at least 2 characters"),
];

const vendorLoginRules = [
    body("username").trim().toLowerCase().notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
];

module.exports = { vendorRegisterRules, vendorLoginRules };
