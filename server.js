require("dotenv").config();
const express = require("express");
const cors = require("cors");
const requestRoutes = require("./src/routes/requestRoutes");
const processImages = require("./src/services/imageService");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/processed", express.static("processed"));

app.use("/api", requestRoutes);

setInterval(processImages, 30000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

processImages();
