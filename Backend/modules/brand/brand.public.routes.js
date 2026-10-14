const express = require("express");
const { show } = require("./brand.controller");

const router = express.Router();

router.get("/", show);

module.exports = router;
