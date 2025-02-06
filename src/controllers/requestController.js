const multer = require("multer");
const csv = require("csv-parser");
const fs = require("fs");
const path = require("path");

const { v4: uuidv4 } = require("uuid");
const db = require("../config/database");

const upload = multer({ dest: "uploads/" });

const uploadCSV = (req, res) => {
  if (!req.file) return res.status(400).json({ error: "CSV file is required" });

  const requestId = uuidv4();
  const filePath = req.file.path;
  const newFilePath = path.join(
    __dirname,
    "../../uploads/",
    `${requestId}.csv`
  );

  fs.renameSync(filePath, newFilePath);

  db.run(`INSERT INTO requests (id, status) VALUES (?, ?)`, [
    requestId,
    "Pending",
  ]);

  fs.createReadStream(newFilePath)
    .pipe(csv())
    .on("data", (row) => {
      const {
        "S. No.": serialNumber,
        "Product Name": productName,
        "Input Image Urls": inputImageUrls,
      } = row;
      const urls = inputImageUrls.split(",").map((url) => url.trim());

      urls.forEach((url) => {
        db.run(
          `INSERT INTO images (request_id, product_name, input_image_url, status) VALUES (?, ?, ?, ?)`,
          [requestId, productName, url, "Pending"]
        );
      });
    })
    .on("end", () => {
      res.json({ requestId, message: "CSV received and processing started." });
    });
};

const getStatus = (req, res) => {
  const { requestId } = req.params;

  db.get(`SELECT status FROM requests WHERE id=?`, [requestId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });

    db.all(
      `SELECT input_image_url, output_image_url FROM images WHERE request_id=?`,
      [requestId],
      (err, images) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ requestId, status: row.status, images });
      }
    );
  });
};

module.exports = { upload, uploadCSV, getStatus };
