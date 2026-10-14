const { body } = require("express-validator");

const loginRules = [
    body("email").trim().isEmail().withMessage("Provide a valid email").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
];

module.exports = { loginRules };
