const asyncHandler = require("../../middlewares/asyncHandler");
const { listPayments } = require("./payments.service");

const list = asyncHandler(async (req, res) => {
    const report = await listPayments();
    res.status(200).json({ success: true, data: report });
});

module.exports = { list };
