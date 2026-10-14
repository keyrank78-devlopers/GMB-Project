const asyncHandler = require("../../middlewares/asyncHandler");
const { listInvoices, getInvoice } = require("./invoice.service");

const list = asyncHandler(async (req, res) => {
    const invoices = await listInvoices(req.user._id);
    res.status(200).json({ success: true, data: invoices });
});

const getOne = asyncHandler(async (req, res) => {
    const invoice = await getInvoice(req.user._id, req.params.invoiceId);
    res.status(200).json({ success: true, data: invoice });
});

module.exports = { list, getOne };
