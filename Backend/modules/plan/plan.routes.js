const express = require("express");
const validate = require("../../middlewares/validate.middleware");
const { authenticate, authorize } = require("../../middlewares/auth.middleware");
const { ROLES } = require("../../constants/roles");
const { planRules } = require("./plan.validator");
const { list, getOne, create, update, remove } = require("./plan.controller");

const router = express.Router();

router.use(authenticate, authorize(ROLES.SUPERADMIN));

router.get("/", list);
router.post("/", planRules, validate, create);
router.get("/:id", getOne);
router.patch("/:id", planRules, validate, update);
router.delete("/:id", remove);

module.exports = router;
