const { resolveRole } = require("../constants/roles");

const toPublicUser = (user) => {
    const role = resolveRole(user);
    return {
        id: user._id,
        role,
        name: user.name,
        phone: user.phone,
        status: user.status,
        ...(user.username ? { username: user.username } : {}),
        ...(user.email ? { email: user.email } : {}),
        ...((user.companyName || user.businessName) ? { companyName: user.companyName || user.businessName } : {}),
        ...(user.address ? { address: user.address } : {}),
        // Google OAuth — tell the client whether the vendor has connected Google
        googleConnected: Boolean(user.googleEmail),
        ...(user.googleEmail ? { googleEmail: user.googleEmail } : {}),
        ...(user.imageUrl ? { imageUrl: user.imageUrl } : {}),
    };
};

module.exports = { toPublicUser };

