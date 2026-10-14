const express = require("express");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../constants/roles");
const { list } = require("./payments.controller");

const router = express.Router();

router.use(authenticate, authorize(ROLES.SUPERADMIN));
router.get("/", list);

module.exports = router;
