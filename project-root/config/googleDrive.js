const { google } = require("googleapis");
const path = require("path");

const KEY_PATH = path.join(__dirname, "../credentials/credentials.json");
const SCOPES = ["https://www.googleapis.com/auth/drive.file"];

async function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: SCOPES,
  });

  return google.drive({ version: "v3", auth });
}

module.exports = { getDriveClient };
