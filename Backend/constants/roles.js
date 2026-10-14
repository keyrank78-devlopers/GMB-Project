const ROLES = {
    SUPERADMIN: "SUPERADMIN",
    VENDOR: "VENDOR",
};

const ROLE_VALUES = Object.values(ROLES);

// Old accounts were stored as userType "ADMIN". Treat that as superadmin.
const resolveRole = (user) => {
    if (!user) return null;
    if (user.role === ROLES.VENDOR || user.userType === ROLES.VENDOR) return ROLES.VENDOR;
    if (
        user.role === ROLES.SUPERADMIN ||
        user.role === "ADMIN" ||
        user.userType === "ADMIN" ||
        user.userType === ROLES.SUPERADMIN
    ) {
        return ROLES.SUPERADMIN;
    }
    return null;
};

module.exports = { ROLES, ROLE_VALUES, resolveRole };
