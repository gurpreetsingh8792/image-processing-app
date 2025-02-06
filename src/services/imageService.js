const sharp = require("sharp");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const db = require("../config/database");
const { Parser } = require("json2csv");

const processImages = async () => {
  db.all(
    `SELECT DISTINCT request_id FROM images WHERE status='Pending'`,
    async (err, requests) => {
      if (err) return console.error("Error fetching requests:", err);

      if (requests.length === 0) {
        console.log("No pending images to process.");
        return;
      }

      for (let req of requests) {
        db.all(
          `SELECT * FROM images WHERE request_id=?`,
          [req.request_id],
          async (err, rows) => {
            if (err)
              return console.error(
                `Error fetching images for ${req.request_id}:`,
                err
              );

            let processedData = [];
            for (let row of rows) {
              try {
                console.log(`Downloading image: ${row.input_image_url}`);

                const response = await axios({
                  url: row.input_image_url,
                  responseType: "arraybuffer",
                });

                console.log(`Image downloaded: ${row.input_image_url}`);

                const compressedImage = await sharp(response.data)
                  .jpeg({ quality: 50 })
                  .toBuffer();

                console.log(`Image compressed: ${row.input_image_url}`);

                const outputFilePath = path.join(
                  __dirname,
                  "../../processed",
                  `${row.id}.jpg`
                );
                fs.writeFileSync(outputFilePath, compressedImage);

                const outputUrl = `http://localhost:3000/processed/${row.id}.jpg`;

                db.run(
                  `UPDATE images SET output_image_url=?, status='Completed' WHERE id=?`,
                  [outputUrl, row.id]
                );

                processedData.push({
                  "S. No.": row.id,
                  "Product Name": row.product_name,
                  "Input Image Urls": row.input_image_url,
                  "Output Image Urls": outputUrl,
                });

                console.log(`Processed and saved: ${outputUrl}`);
              } catch (error) {
                console.error(
                  ` Error processing ${row.input_image_url}:`,
                  error.message
                );
                db.run(`UPDATE images SET status='Failed' WHERE id=?`, [
                  row.id,
                ]);
              }
            }

            if (processedData.length > 0) {
              const csvParser = new Parser();
              const csvData = csvParser.parse(processedData);
              const outputCsvPath = path.join(
                __dirname,
                "../../output/",
                `${req.request_id}.csv`
              );

              if (!fs.existsSync(path.dirname(outputCsvPath))) {
                fs.mkdirSync(path.dirname(outputCsvPath), { recursive: true });
              }

              fs.writeFileSync(outputCsvPath, csvData);
              console.log(` Output CSV saved: ${outputCsvPath}`);
            }

            db.run(`UPDATE requests SET status='Completed' WHERE id=?`, [
              req.request_id,
            ]);
          }
        );
      }
    }
  );
};

module.exports = processImages;
