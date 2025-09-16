const express = require("express");
const { syncToDrive, googleDriveWebhook } = require("../controllers/syncController");

const router = express.Router();

// Sinkronisasi Aplikasi → Google Drive
router.post("/sync-to-drive", syncToDrive);

// Webhook Google Drive → Aplikasi
router.post("/google-drive-webhook", googleDriveWebhook);

module.exports = router;
