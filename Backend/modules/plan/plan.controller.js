const asyncHandler = require("../../middlewares/asyncHandler");
const { listPlans, getPlan, createPlan, updatePlan, deletePlan } = require("./plan.service");

const list = asyncHandler(async (req, res) => {
    const plans = await listPlans();
    res.status(200).json({
        success: true,
        message: "Plans fetched",
        data: plans,
    });
});

const getOne = asyncHandler(async (req, res) => {
    const plan = await getPlan(req.params.id);
    res.status(200).json({
        success: true,
        message: "Plan fetched",
        data: plan,
    });
});

const create = asyncHandler(async (req, res) => {
    const plan = await createPlan(req.body, req.user._id);
    res.status(201).json({
        success: true,
        message: "Plan created",
        data: plan,
    });
});

const update = asyncHandler(async (req, res) => {
    const plan = await updatePlan(req.params.id, req.body);
    res.status(200).json({
        success: true,
        message: "Plan updated",
        data: plan,
    });
});

const remove = asyncHandler(async (req, res) => {
    await deletePlan(req.params.id);
    res.status(200).json({
        success: true,
        message: "Plan deleted",
    });
});

module.exports = { list, getOne, create, update, remove };
