const Payment = require("../../models/Payment");
const User = require("../../models/User");
const ApiError = require("../../utils/ApiError");

const invoiceNumber = (id) => `KR-${String(id).slice(-8).toUpperCase()}`;

const toPublicInvoice = (payment, vendor) => ({
    id: payment._id,
    number: invoiceNumber(payment._id),
    status: payment.status,
    vendorName: vendor.name,
    companyName: vendor.companyName || vendor.businessName || "",
    phone: vendor.phone,
    email: payment.email || vendor.email || "",
    username: vendor.username || "",
    planName: payment.planName,
    amount: payment.amount,
    currency: payment.currency,
    orderId: payment.razorpayOrderId,
    paymentId: payment.razorpayPaymentId || null,
    method: payment.method || null,
    cardNetwork: payment.cardNetwork || null,
    cardLast4: payment.cardLast4 || null,
    bank: payment.bank || null,
    wallet: payment.wallet || null,
    vpa: payment.vpa || null,
    note: payment.status === "FAILED" ? payment.errorDescription || "Payment was declined" : null,
    paidAt: payment.paidAt || null,
    createdAt: payment.createdAt,
});

const vendorOf = async (vendorId) => {
    const vendor = await User.findById(vendorId);
    if (!vendor) throw new ApiError(404, "Vendor not found", "VENDOR_NOT_FOUND");
    return vendor;
};

const listInvoices = async (vendorId) => {
    const vendor = await vendorOf(vendorId);
    const payments = await Payment.find({
        vendor: vendorId,
        status: { $in: ["PAID", "FAILED"] },
    }).sort({ createdAt: -1 });
    return payments.map((payment) => toPublicInvoice(payment, vendor));
};

const getInvoice = async (vendorId, invoiceId) => {
    const vendor = await vendorOf(vendorId);
    const payment = await Payment.findOne({
        _id: invoiceId,
        vendor: vendorId,
        status: { $in: ["PAID", "FAILED"] },
    });
    if (!payment) throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
    return toPublicInvoice(payment, vendor);
};

module.exports = { listInvoices, getInvoice };
