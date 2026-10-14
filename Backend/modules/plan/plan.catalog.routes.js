const express = require("express");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../constants/roles");
const { list } = require("./plan.controller");

const router = express.Router();

router.get("/", authenticate, authorize(ROLES.SUPERADMIN, ROLES.VENDOR), list);

module.exports = router;
