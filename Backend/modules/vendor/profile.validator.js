const { body } = require("express-validator");

const profileRules = [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ min: 2, max: 80 }).withMessage("Name must be at least 2 characters"),
    body("phone").trim().matches(/^\+?[0-9]{10,15}$/).withMessage("Provide a valid phone number"),
    body("companyName")
        .trim()
        .notEmpty()
        .withMessage("Company name is required")
        .isLength({ min: 2, max: 80 })
        .withMessage("Company name must be at least 2 characters"),
    body("currentPassword").optional({ values: "falsy" }).isString(),
    body("newPassword")
        .optional({ values: "falsy" })
        .isLength({ min: 6 })
        .withMessage("New password must be at least 6 characters"),
];

module.exports = { profileRules };
