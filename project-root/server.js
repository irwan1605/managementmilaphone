const express = require("express");
const bodyParser = require("body-parser");
const syncRoutes = require("./routes/syncRoutes");

const app = express();
app.use(bodyParser.json());

// Routes
app.use("/api", syncRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
