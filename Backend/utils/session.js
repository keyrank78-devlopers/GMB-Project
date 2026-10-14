const ApiError = require("./ApiError");

const sessionVersionOf = (user) => Number(user?.sessionVersion) || 0;

const assertSessionCurrent = (user, decoded) => {
    const tokenVersion = Number(decoded?.sv) || 0;
    if (tokenVersion !== sessionVersionOf(user)) {
        throw new ApiError(401, "Session ended — please login again", "SESSION_ENDED");
    }
};

module.exports = { sessionVersionOf, assertSessionCurrent };
