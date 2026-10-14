const { body } = require("express-validator");

const planRules = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Plan name is required")
        .isLength({ min: 2, max: 40 })
        .withMessage("Plan name must be 2 to 40 characters"),
    body("subtitle")
        .trim()
        .notEmpty()
        .withMessage("Subtitle is required")
        .isLength({ min: 2, max: 120 })
        .withMessage("Subtitle must be 2 to 120 characters"),
    body("price")
        .notEmpty()
        .withMessage("Price is required")
        .isFloat({ min: 0, max: 10000000 })
        .withMessage("Price must be 0 or greater")
        .toFloat(),
    body("durationDays")
        .notEmpty()
        .withMessage("Plan length is required")
        .isInt({ min: 1, max: 3650 })
        .withMessage("Plan length must be 1 to 3650 days")
        .toInt(),
    body("features")
        .isArray({ min: 1, max: 30 })
        .withMessage("Add between 1 and 30 features"),
    body("features.*")
        .trim()
        .notEmpty()
        .withMessage("Feature text is required")
        .isLength({ max: 160 })
        .withMessage("Each feature must be 160 characters or fewer"),
];

module.exports = { planRules };
