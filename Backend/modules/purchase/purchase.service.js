const Plan = require("../../models/Plan");
const PlanPurchase = require("../../models/PlanPurchase");
const Payment = require("../../models/Payment");
const ApiError = require("../../utils/ApiError");
const { credentials, razorpayClient, razorpayMessage, verifyPaymentSignature } = require("../../utils/razorpay");
const { planWindow, planTiming } = require("../../utils/planWindow");

const OPEN_STATUSES = ["AWAITING_PAYMENT", "CHOSEN"];
const CAPTURED_STATUSES = ["captured", "authorized"];

const amountPaiseOf = (amount) => Math.round(Number(amount) * 100);

const toPublicPurchase = (purchase) => ({
    id: purchase._id,
    planId: purchase.plan,
    planName: purchase.planName,
    amount: purchase.amount,
    amountPaise: amountPaiseOf(purchase.amount),
    currency: purchase.currency,
    status: purchase.status,
    startsAt: purchase.startsAt || null,
    endsAt: purchase.endsAt || null,
    razorpayOrderId: purchase.razorpayOrderId || null,
    createdAt: purchase.createdAt,
    updatedAt: purchase.updatedAt,
});

const checkoutFor = (purchase) => {
    if (purchase.status !== "AWAITING_PAYMENT" || !purchase.razorpayOrderId) return null;
    const { keyId } = credentials();
    return {
        keyId,
        orderId: purchase.razorpayOrderId,
        amount: amountPaiseOf(purchase.amount),
        currency: purchase.currency,
        name: "Keyrank",
        description: purchase.planName,
    };
};

const withCheckout = (purchase) => ({
    ...toPublicPurchase(purchase),
    checkout: checkoutFor(purchase),
});

const getPaidPlanIds = async (vendorId) => {
    const ids = await PlanPurchase.distinct("plan", { vendor: vendorId, status: "PAID" });
    return ids.map(String);
};

const getCurrentPurchase = async (vendorId) => {
    const awaiting = await PlanPurchase.findOne({ vendor: vendorId, status: "AWAITING_PAYMENT" }).sort({ updatedAt: -1 });
    if (awaiting) return toPublicPurchase(awaiting);

    const paid = await PlanPurchase.findOne({ vendor: vendorId, status: "PAID" }).sort({ updatedAt: -1 });
    if (paid) return toPublicPurchase(paid);

    const chosen = await PlanPurchase.findOne({ vendor: vendorId, status: "CHOSEN" }).sort({ updatedAt: -1 });
    return chosen ? toPublicPurchase(chosen) : null;
};

const createRazorpayOrder = async (purchase) => {
    const paise = amountPaiseOf(purchase.amount);
    if (paise < 100) {
        throw new ApiError(400, "Paid plans must cost at least ₹1", "AMOUNT_TOO_SMALL");
    }

    let order;
    try {
        order = await razorpayClient().orders.create({
            amount: paise,
            currency: purchase.currency,
            receipt: String(purchase._id),
            notes: {
                purchaseId: String(purchase._id),
                planId: String(purchase.plan),
                vendorId: String(purchase.vendor),
            },
        });
    } catch (error) {
        throw new ApiError(502, razorpayMessage(error), "RAZORPAY_ORDER_FAILED");
    }

    purchase.razorpayOrderId = order.id;
    await purchase.save();

    await Payment.findOneAndUpdate(
        { purchase: purchase._id, razorpayOrderId: order.id },
        {
            vendor: purchase.vendor,
            purchase: purchase._id,
            plan: purchase.plan,
            planName: purchase.planName,
            amount: purchase.amount,
            amountPaise: paise,
            currency: purchase.currency,
            razorpayOrderId: order.id,
            razorpayStatus: order.status,
            status: "CREATED",
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    return order;
};

const startPurchase = async (vendorId, planId) => {
    const plan = await Plan.findById(planId);
    if (!plan) {
        throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
    }

    const alreadyPaid = await PlanPurchase.findOne({ vendor: vendorId, plan: plan._id, status: "PAID" });
    if (alreadyPaid) return withCheckout(alreadyPaid);

    await PlanPurchase.updateMany(
        {
            vendor: vendorId,
            status: { $in: OPEN_STATUSES },
            plan: { $ne: plan._id },
        },
        { $set: { status: "CANCELLED" } },
    );

    const status = plan.price > 0 ? "AWAITING_PAYMENT" : "CHOSEN";
    let purchase = await PlanPurchase.findOne({
        vendor: vendorId,
        plan: plan._id,
        status: { $in: OPEN_STATUSES },
    });

    const dates = status === "CHOSEN" ? planWindow(plan) : {};
    if (!purchase) {
        purchase = await PlanPurchase.create({
            vendor: vendorId,
            plan: plan._id,
            planName: plan.name,
            amount: plan.price,
            currency: "INR",
            status,
            ...dates,
        });
    } else if (purchase.amount !== plan.price || (status === "CHOSEN" && !purchase.endsAt)) {
        const priceChanged = purchase.amount !== plan.price;
        purchase.amount = plan.price;
        purchase.planName = plan.name;
        purchase.status = status;
        if (priceChanged) {
            purchase.razorpayOrderId = null;
            purchase.startsAt = null;
            purchase.endsAt = null;
        }
        if (status === "CHOSEN") {
            purchase.startsAt = dates.startsAt;
            purchase.endsAt = dates.endsAt;
        }
        await purchase.save();
    }

    if (status === "AWAITING_PAYMENT" && !purchase.razorpayOrderId) {
        await createRazorpayOrder(purchase);
    }

    return withCheckout(purchase);
};

const findOwnedPurchase = async (vendorId, purchaseId) => {
    const purchase = await PlanPurchase.findOne({ _id: purchaseId, vendor: vendorId });
    if (!purchase) {
        throw new ApiError(404, "Purchase not found", "PURCHASE_NOT_FOUND");
    }
    return purchase;
};

const paymentFieldsFromRemote = (remote) => ({
    razorpayStatus: remote.status,
    method: remote.method,
    email: remote.email,
    contact: remote.contact,
    bank: remote.bank,
    wallet: remote.wallet,
    vpa: remote.vpa,
    cardNetwork: remote.card?.network,
    cardLast4: remote.card?.last4,
});

const confirmPayment = async (vendorId, purchaseId, { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature }) => {
    const purchase = await findOwnedPurchase(vendorId, purchaseId);

    if (purchase.status === "PAID") {
        const payment = await Payment.findOne({ purchase: purchase._id, status: "PAID" }).sort({ updatedAt: -1 });
        return { purchase: withCheckout(purchase), invoiceId: payment?._id || null };
    }
    if (purchase.razorpayOrderId !== orderId) {
        throw new ApiError(400, "Payment does not match this order", "PAYMENT_ORDER_MISMATCH");
    }
    if (!verifyPaymentSignature(orderId, paymentId, signature)) {
        await Payment.findOneAndUpdate(
            { purchase: purchase._id, razorpayOrderId: orderId },
            {
                vendor: purchase.vendor,
                plan: purchase.plan,
                planName: purchase.planName,
                amount: purchase.amount,
                amountPaise: amountPaiseOf(purchase.amount),
                currency: purchase.currency,
                razorpayPaymentId: paymentId,
                razorpaySignature: signature,
                status: "FAILED",
                errorCode: "SIGNATURE_INVALID",
                errorDescription: "Payment signature did not match",
            },
            { upsert: true },
        );
        throw new ApiError(400, "Payment signature is invalid", "PAYMENT_SIGNATURE_INVALID");
    }

    let remote;
    try {
        remote = await razorpayClient().payments.fetch(paymentId);
    } catch (error) {
        throw new ApiError(502, razorpayMessage(error), "RAZORPAY_PAYMENT_LOOKUP_FAILED");
    }

    if (remote.order_id !== orderId || Number(remote.amount) !== amountPaiseOf(purchase.amount)) {
        throw new ApiError(400, "Payment amount does not match the plan", "PAYMENT_AMOUNT_MISMATCH");
    }
    if (!CAPTURED_STATUSES.includes(remote.status)) {
        throw new ApiError(400, "Payment was not captured", "PAYMENT_NOT_CAPTURED");
    }

    const payment = await Payment.findOneAndUpdate(
        { razorpayOrderId: orderId, purchase: purchase._id },
        {
            vendor: purchase.vendor,
            plan: purchase.plan,
            planName: purchase.planName,
            amount: purchase.amount,
            amountPaise: amountPaiseOf(purchase.amount),
            currency: purchase.currency,
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: signature,
            status: "PAID",
            paidAt: new Date(),
            ...paymentFieldsFromRemote(remote),
        },
        { upsert: true, new: true },
    );

    const paidPlan = await Plan.findById(purchase.plan);
    const earlier = await PlanPurchase.findOne({
        _id: { $ne: purchase._id },
        vendor: purchase.vendor,
        plan: purchase.plan,
        status: "PAID",
    }).sort({ endsAt: -1 });
    const base = earlier?.endsAt && earlier.endsAt > new Date() ? earlier.endsAt : new Date();
    const window = planWindow(paidPlan || { durationDays: 30 }, base);
    purchase.startsAt = window.startsAt;
    purchase.endsAt = window.endsAt;
    purchase.status = "PAID";
    await purchase.save();
    return { purchase: withCheckout(purchase), invoiceId: payment._id };
};

const recordFailedPayment = async (vendorId, purchaseId, body) => {
    const purchase = await findOwnedPurchase(vendorId, purchaseId);
    const orderId = body.razorpay_order_id || purchase.razorpayOrderId;
    if (!orderId) {
        throw new ApiError(400, "This purchase has no payment order", "PAYMENT_ORDER_MISSING");
    }

    const payment = await Payment.findOneAndUpdate(
        { purchase: purchase._id, razorpayOrderId: orderId },
        {
            vendor: purchase.vendor,
            plan: purchase.plan,
            planName: purchase.planName,
            amount: purchase.amount,
            amountPaise: amountPaiseOf(purchase.amount),
            currency: purchase.currency,
            razorpayOrderId: orderId,
            razorpayPaymentId: body.razorpay_payment_id || undefined,
            status: "FAILED",
            errorCode: body.code,
            errorDescription: body.description,
            errorSource: body.source,
            errorStep: body.step,
            errorReason: body.reason,
        },
        { upsert: true, new: true },
    );

    return { purchase: withCheckout(purchase), invoiceId: payment._id };
};

const activePlan = (vendorId) => PlanPurchase.findOne({
    vendor: vendorId,
    status: { $in: ["PAID", "CHOSEN"] },
}).sort({ endsAt: -1, updatedAt: -1 });

const getVendorDesk = async (vendorId) => {
    const [purchase, paid] = await Promise.all([
        activePlan(vendorId),
        PlanPurchase.exists({ vendor: vendorId, status: "PAID" }),
    ]);
    const canConnectGoogle = Boolean(paid);
    if (!purchase) return { plan: null, invoiceId: null, canConnectGoogle };

    const invoice = await Payment.findOne({
        vendor: vendorId,
        plan: purchase.plan,
        status: "PAID",
    }).sort({ paidAt: -1, createdAt: -1 });

    const timing = planTiming(purchase.endsAt);
    return {
        plan: {
            ...toPublicPurchase(purchase),
            ...timing,
        },
        invoiceId: invoice?._id || null,
        canConnectGoogle,
    };
};

const renewPlan = async (vendorId) => {
    const current = await activePlan(vendorId);
    if (!current) {
        throw new ApiError(400, "Choose a plan before renewing", "PLAN_REQUIRED");
    }

    const plan = await Plan.findById(current.plan);
    if (!plan) throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");

    if (!(plan.price > 0)) {
        const base = current.endsAt && current.endsAt > new Date() ? current.endsAt : new Date();
        const window = planWindow(plan, base);
        current.startsAt = current.startsAt || new Date();
        current.endsAt = window.endsAt;
        await current.save();
        return { purchase: withCheckout(current), invoiceId: null };
    }

    let renewal = await PlanPurchase.findOne({
        vendor: vendorId,
        plan: plan._id,
        status: "AWAITING_PAYMENT",
    });
    if (!renewal) {
        renewal = await PlanPurchase.create({
            vendor: vendorId,
            plan: plan._id,
            planName: plan.name,
            amount: plan.price,
            currency: "INR",
            status: "AWAITING_PAYMENT",
        });
    } else if (renewal.amount !== plan.price) {
        renewal.amount = plan.price;
        renewal.planName = plan.name;
        renewal.razorpayOrderId = null;
        await renewal.save();
    }

    if (!renewal.razorpayOrderId) await createRazorpayOrder(renewal);
    return { purchase: withCheckout(renewal), invoiceId: null };
};

module.exports = {
    getCurrentPurchase,
    getPaidPlanIds,
    getVendorDesk,
    startPurchase,
    renewPlan,
    confirmPayment,
    recordFailedPayment,
};
