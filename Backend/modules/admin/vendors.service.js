const User = require("../../models/User");
const Plan = require("../../models/Plan");
const PlanPurchase = require("../../models/PlanPurchase");
const ApiError = require("../../utils/ApiError");
const { ROLES } = require("../../constants/roles");
const { sessionVersionOf } = require("../../utils/session");
const { EXPIRING_DAYS, DAY_MS, planWindow, parsePlanDate } = require("../../utils/planWindow");
const { setVendorImage, removeVendorImage } = require("../vendor/profile.service");

const dayStamp = (date) => Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());

const toVendorPlan = (purchase, now) => {
    const endsAt = purchase.endsAt ? new Date(purchase.endsAt) : null;
    const active = purchase.status === "PAID" || purchase.status === "CHOSEN";
    const daysLeft = endsAt ? (dayStamp(endsAt) - dayStamp(now)) / DAY_MS : null;
    return {
        planName: purchase.planName,
        amount: purchase.amount,
        currency: purchase.currency,
        status: purchase.status,
        startsAt: purchase.startsAt || null,
        endsAt: purchase.endsAt || null,
        expiring: Boolean(active && daysLeft !== null && daysLeft >= 0 && daysLeft <= EXPIRING_DAYS),
        expired: Boolean(active && daysLeft !== null && daysLeft < 0),
        updatedAt: purchase.updatedAt,
    };
};

const vendorMatches = (vendor, plans, query) => {
    const needle = String(query || "").trim().toLowerCase();
    if (!needle) return true;
    const haystack = [
        vendor.name,
        vendor.username,
        vendor.phone,
        vendor.companyName,
        vendor.businessName,
        ...plans.map((plan) => plan.planName),
    ].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(needle);
};

const ensureWindows = async (purchases, plansById) => {
    await Promise.all(purchases.map(async (purchase) => {
        if (!["PAID", "CHOSEN"].includes(purchase.status) || purchase.endsAt) return;
        const plan = plansById.get(String(purchase.plan));
        const window = planWindow(plan || { durationDays: 30 }, purchase.createdAt);
        purchase.startsAt = window.startsAt;
        purchase.endsAt = window.endsAt;
        await purchase.save();
    }));
};

const listVendors = async (query) => {
    const vendors = await User.find({ role: ROLES.VENDOR })
        .select("name username phone companyName businessName status createdAt imageUrl")
        .sort({ createdAt: -1 });
    const plans = await Plan.find();
    const plansById = new Map(plans.map((plan) => [String(plan._id), plan]));
    const purchases = await PlanPurchase.find({
        vendor: { $in: vendors.map((vendor) => vendor._id) },
        status: { $ne: "CANCELLED" },
    }).sort({ updatedAt: -1 });
    await ensureWindows(purchases, plansById);

    const now = new Date();
    const plansByVendor = new Map();
    purchases.forEach((purchase) => {
        const key = String(purchase.vendor);
        const list = plansByVendor.get(key) || [];
        list.push(toVendorPlan(purchase, now));
        plansByVendor.set(key, list);
    });

    const rows = vendors.map((vendor) => ({
        id: vendor._id,
        name: vendor.name,
        username: vendor.username,
        phone: vendor.phone,
        companyName: vendor.companyName || vendor.businessName || "",
        status: vendor.status,
        imageUrl: vendor.imageUrl || null,
        createdAt: vendor.createdAt,
        plans: plansByVendor.get(String(vendor._id)) || [],
    }));

    const expiringCount = rows.filter((vendor) => vendor.plans.some((plan) => plan.expiring)).length;
    return {
        count: rows.length,
        expiringCount,
        vendors: rows.filter((vendor) => vendorMatches(vendor, vendor.plans, query)),
    };
};

const findVendor = async (vendorId) => {
    const vendor = await User.findOne({ _id: vendorId, role: ROLES.VENDOR });
    if (!vendor) throw new ApiError(404, "Vendor not found", "VENDOR_NOT_FOUND");
    return vendor;
};

const setVendorStatus = async (vendorId, status) => {
    const vendor = await findVendor(vendorId);
    vendor.status = status;
    if (status === "BLOCKED") {
        vendor.sessionVersion = sessionVersionOf(vendor) + 1;
    }
    await vendor.save({ validateModifiedOnly: true });
    return { id: vendor._id, status: vendor.status };
};

const assignVendorPlan = async (vendorId, { planId, startsAt, endsAt }) => {
    const vendor = await findVendor(vendorId);
    const plan = await Plan.findById(planId);
    if (!plan) throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");

    const hasStart = Boolean(startsAt);
    const hasEnd = Boolean(endsAt);
    if (hasStart !== hasEnd) {
        throw new ApiError(400, "Set both the start date and the end date", "PLAN_DATES_REQUIRED");
    }

    let window;
    if (hasStart) {
        const start = parsePlanDate(startsAt, false);
        const end = parsePlanDate(endsAt, true);
        if (!start || !end || end <= start) {
            throw new ApiError(400, "The end date must be after the start date", "PLAN_DATES_INVALID");
        }
        window = { startsAt: start, endsAt: end };
    } else {
        window = planWindow(plan);
    }

    await PlanPurchase.updateMany(
        { vendor: vendor._id, status: { $ne: "CANCELLED" } },
        { $set: { status: "CANCELLED" } },
    );

    await PlanPurchase.create({
        vendor: vendor._id,
        plan: plan._id,
        planName: plan.name,
        amount: plan.price,
        currency: "INR",
        status: plan.price > 0 ? "PAID" : "CHOSEN",
        startsAt: window.startsAt,
        endsAt: window.endsAt,
    });

    return listVendors();
};

const setVendorLogo = async (vendorId, buffer) => {
    await findVendor(vendorId);
    const vendor = await setVendorImage(vendorId, buffer);
    return { id: vendor._id, imageUrl: vendor.imageUrl || null };
};

const clearVendorLogo = async (vendorId) => {
    await findVendor(vendorId);
    await removeVendorImage(vendorId);
    return { id: vendorId, imageUrl: null };
};

module.exports = { listVendors, setVendorStatus, assignVendorPlan, setVendorLogo, clearVendorLogo };
