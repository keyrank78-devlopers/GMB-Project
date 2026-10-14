class ApiError extends Error {
    constructor(statusCode, message, code = "ERROR", errors) {
        super(message);
        this.name = "ApiError";
        this.statusCode = statusCode;
        this.code = code;
        this.errors = errors;
        this.isOperational = true;
    }
}

module.exports = ApiError;
