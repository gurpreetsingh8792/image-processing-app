const express = require("express");
const {
  upload,
  uploadCSV,
  getStatus,
} = require("../controllers/requestController");

const router = express.Router();

router.post("/upload", upload.single("file"), uploadCSV);
router.get("/status/:requestId", getStatus);

module.exports = router;
