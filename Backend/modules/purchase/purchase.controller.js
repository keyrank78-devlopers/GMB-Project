const asyncHandler = require("../../middlewares/asyncHandler");
const {
    getCurrentPurchase,
    getPaidPlanIds,
    getVendorDesk,
    startPurchase,
    renewPlan,
    confirmPayment,
    recordFailedPayment,
} = require("./purchase.service");

const respond = (res, statusCode, message, purchase, paidPlanIds, invoiceId) => {
    res.status(statusCode).json({
        success: true,
        message,
        data: purchase,
        paidPlanIds,
        ...(invoiceId ? { invoiceId } : {}),
    });
};

const current = asyncHandler(async (req, res) => {
    const [purchase, paidPlanIds] = await Promise.all([
        getCurrentPurchase(req.user._id),
        getPaidPlanIds(req.user._id),
    ]);
    respond(res, 200, "Current plan choice", purchase, paidPlanIds);
});

const create = asyncHandler(async (req, res) => {
    const purchase = await startPurchase(req.user._id, req.params.planId);
    const paidPlanIds = await getPaidPlanIds(req.user._id);
    const message = purchase.status === "PAID"
        ? "This plan is already paid"
        : purchase.status === "AWAITING_PAYMENT"
            ? "Plan selected and waiting for payment"
            : "Plan chosen";
    respond(res, 201, message, purchase, paidPlanIds);
});

const renew = asyncHandler(async (req, res) => {
    const result = await renewPlan(req.user._id);
    const paidPlanIds = await getPaidPlanIds(req.user._id);
    const awaiting = result.purchase.status === "AWAITING_PAYMENT";
    respond(res, 200, awaiting ? "Renewal is ready for payment" : "Plan renewed", result.purchase, paidPlanIds);
});

const verify = asyncHandler(async (req, res) => {
    const result = await confirmPayment(req.user._id, req.params.purchaseId, req.body);
    const paidPlanIds = await getPaidPlanIds(req.user._id);
    respond(res, 200, "Payment received", result.purchase, paidPlanIds, result.invoiceId);
});

const failed = asyncHandler(async (req, res) => {
    const result = await recordFailedPayment(req.user._id, req.params.purchaseId, req.body);
    const paidPlanIds = await getPaidPlanIds(req.user._id);
    respond(res, 200, "Payment declined", result.purchase, paidPlanIds, result.invoiceId);
});

const desk = asyncHandler(async (req, res) => {
    const summary = await getVendorDesk(req.user._id);
    res.status(200).json({ success: true, data: summary });
});

module.exports = { current, create, renew, verify, failed, desk };
