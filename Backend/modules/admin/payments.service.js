const Payment = require("../../models/Payment");
const User = require("../../models/User");

const listPayments = async () => {
    const payments = await Payment.find({ status: { $in: ["PAID", "FAILED"] } }).sort({ createdAt: -1 });
    const vendors = await User.find({ _id: { $in: payments.map((payment) => payment.vendor) } })
        .select("name username companyName businessName");
    const vendorsById = new Map(vendors.map((vendor) => [String(vendor._id), vendor]));

    const rows = payments.map((payment) => {
        const vendor = vendorsById.get(String(payment.vendor));
        return {
            id: payment._id,
            status: payment.status,
            vendorName: vendor?.name || "",
            companyName: vendor?.companyName || vendor?.businessName || "",
            username: vendor?.username || "",
            planName: payment.planName,
            amount: payment.amount,
            currency: payment.currency,
            orderId: payment.razorpayOrderId,
            paymentId: payment.razorpayPaymentId || null,
            method: payment.method || null,
            note: payment.status === "FAILED" ? payment.errorDescription || "Payment was declined" : null,
            paidAt: payment.paidAt || null,
            createdAt: payment.createdAt,
        };
    });

    const paid = rows.filter((payment) => payment.status === "PAID");
    return {
        received: paid.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
        paidCount: paid.length,
        declinedCount: rows.length - paid.length,
        payments: rows,
    };
};

module.exports = { listPayments };
