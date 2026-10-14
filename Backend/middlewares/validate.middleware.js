const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

const validate = (req, res, next) => {
    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const errors = result.array().map((err) => ({
        field: err.path,
        message: err.msg,
    }));

    return next(new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors));
};

module.exports = validate;
