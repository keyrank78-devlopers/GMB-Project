const { body } = require("express-validator");

const vendorStatusRules = [
    body("status")
        .isIn(["ACTIVE", "BLOCKED"])
        .withMessage("Status must be active or blocked"),
];

const assignPlanRules = [
    body("planId").trim().notEmpty().withMessage("Choose a plan").isMongoId().withMessage("Choose a plan"),
    body("startsAt").optional({ values: "falsy" }).trim(),
    body("endsAt").optional({ values: "falsy" }).trim(),
];

module.exports = { vendorStatusRules, assignPlanRules };
