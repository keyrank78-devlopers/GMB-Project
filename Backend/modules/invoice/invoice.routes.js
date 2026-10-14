const express = require("express");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../constants/roles");
const { list, getOne } = require("./invoice.controller");

const router = express.Router();

router.use(authenticate, authorize(ROLES.VENDOR));
router.get("/", list);
router.get("/:invoiceId", getOne);

module.exports = router;
