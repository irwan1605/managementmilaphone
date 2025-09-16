const fs = require("fs");
const path = require("path");
const { getDriveClient } = require("../config/googleDrive");

const dbPath = path.join(__dirname, "../data/database.json");

// 📌 Simulasi Database Local
function getDatabase() {
  return JSON.parse(fs.readFileSync(dbPath, "utf-8"));
}

// ✅ Sync dari Aplikasi → Google Drive
async function syncToDrive(req, res) {
  try {
    const database = getDatabase();
    const drive = await getDriveClient();

    const fileMetadata = {
      name: "database.json",
      mimeType: "application/json",
    };

    const media = {
      mimeType: "application/json",
      body: JSON.stringify(database),
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media,
      fields: "id",
    });

    return res.json({ success: true, fileId: response.data.id });
  } catch (error) {
    console.error("❌ Error syncing to Google Drive:", error);
    res.status(500).send("Error syncing to Google Drive");
  }
}

// ✅ Webhook Google Drive → Update Aplikasi
async function googleDriveWebhook(req, res) {
  try {
    console.log("📩 Webhook from Google Drive:", req.body);

    // TODO: Ambil file terbaru dari Google Drive & update database.json
    // const drive = await getDriveClient();
    // const file = await drive.files.get({ fileId: "YOUR_FILE_ID", alt: "media" });

    res.status(200).send("OK");
  } catch (error) {
    console.error("❌ Webhook error:", error);
    res.status(500).send("Error processing webhook");
  }
}

module.exports = { syncToDrive, googleDriveWebhook };
