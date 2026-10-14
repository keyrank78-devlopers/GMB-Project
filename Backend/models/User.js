const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES, ROLE_VALUES, resolveRole } = require("../constants/roles");

const addressSchema = new mongoose.Schema({
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    locality: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true },
    landmark: { type: String, trim: true },
}, { _id: false });

const userSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        required: function requiredEmail() {
            return this.role === ROLES.SUPERADMIN;
        },
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
        lowercase: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
        match: /^[a-z0-9._]+$/,
        required: function requiredUsername() {
            return this.role === ROLES.VENDOR || this.role === ROLES.SUPERADMIN;
        },
    },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
        type: String,
        enum: ROLE_VALUES,
        required: true,
    },
    // Kept so accounts created before role existed (userType: "ADMIN") still sign in.
    userType: {
        type: String,
        enum: ["ADMIN", ...ROLE_VALUES],
        select: false,
    },
    companyName: {
        type: String,
        trim: true,
        required: function requiredCompanyName() {
            return this.role === ROLES.VENDOR;
        },
    },
    businessName: { type: String, trim: true },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "BLOCKED"],
        default: "ACTIVE",
    },
    address: {
        type: addressSchema,
    },
    sessionVersion: { type: Number, default: 0 },
    refreshToken: { type: String, select: false },
    // Google OAuth — only populated after vendor connects their account
    googleId: { type: String, unique: true, sparse: true, select: false },
    googleEmail: { type: String, trim: true, lowercase: true },
    imageUrl: { type: String, trim: true },
    imagePublicId: { type: String, trim: true, select: false },
}, { timestamps: true });


userSchema.pre("validate", function mapLegacyAdmin() {
    const role = resolveRole(this);
    if (role) this.role = role;
});

userSchema.pre("save", async function hashPassword() {
    if (!this.isModified("password")) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = function matchPassword(enteredPassword) {
    return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
