const Plan = require("../../models/Plan");
const ApiError = require("../../utils/ApiError");

const toPublicPlan = (plan) => ({
    id: plan._id,
    name: plan.name,
    subtitle: plan.subtitle,
    price: plan.price,
    durationDays: plan.durationDays || 30,
    features: plan.features,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
});

const normalizePrice = (price) => Math.round(Number(price) * 100) / 100;

const normalizeFeatures = (features) => features.map((item) => String(item).trim()).filter(Boolean);

const savePlan = async (plan) => {
    try {
        return await plan.save();
    } catch (error) {
        if (error.code === 11000) {
            throw new ApiError(409, "A plan with this name already exists", "DUPLICATE_PLAN");
        }
        throw error;
    }
};

const assertNameAvailable = async (name, ignoreId) => {
    const nameKey = name.trim().toLowerCase();
    const query = { nameKey };
    if (ignoreId) query._id = { $ne: ignoreId };
    const existing = await Plan.findOne(query).select("_id");
    if (existing) {
        throw new ApiError(409, "A plan with this name already exists", "DUPLICATE_PLAN");
    }
};

const listPlans = async () => {
    const plans = await Plan.find().sort({ price: 1, name: 1 });
    return plans.map(toPublicPlan);
};

const getPlan = async (id) => {
    const plan = await Plan.findById(id);
    if (!plan) {
        throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
    }
    return toPublicPlan(plan);
};

const createPlan = async ({ name, subtitle, price, durationDays, features }, createdBy) => {
    const trimmedName = name.trim();
    await assertNameAvailable(trimmedName);
    const plan = new Plan({
        name: trimmedName,
        subtitle: subtitle.trim(),
        price: normalizePrice(price),
        durationDays,
        features: normalizeFeatures(features),
        createdBy,
    });
    await savePlan(plan);
    return toPublicPlan(plan);
};

const updatePlan = async (id, { name, subtitle, price, durationDays, features }) => {
    const plan = await Plan.findById(id);
    if (!plan) {
        throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
    }

    const trimmedName = name.trim();
    await assertNameAvailable(trimmedName, plan._id);
    plan.name = trimmedName;
    plan.subtitle = subtitle.trim();
    plan.price = normalizePrice(price);
    plan.durationDays = durationDays;
    plan.features = normalizeFeatures(features);
    await savePlan(plan);
    return toPublicPlan(plan);
};

const deletePlan = async (id) => {
    const plan = await Plan.findByIdAndDelete(id);
    if (!plan) {
        throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
    }
    return toPublicPlan(plan);
};

module.exports = {
    listPlans,
    getPlan,
    createPlan,
    updatePlan,
    deletePlan,
};
