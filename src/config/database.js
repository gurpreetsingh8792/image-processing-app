const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database(
  "./database.db",
  sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) console.error("Error opening database:", err.message);
    else console.log("Connected to SQLite database.");
  }
);

db.serialize(() => {
  db.run(
    `CREATE TABLE IF NOT EXISTS requests (
        id TEXT PRIMARY KEY,
        status TEXT CHECK( status IN ('Pending', 'In Progress', 'Completed', 'Failed') ),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    (err) => {
      if (err) console.error("Error creating requests table:", err.message);
      else console.log("Requests table created successfully.");
    }
  );

  db.run(
    `CREATE TABLE IF NOT EXISTS images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        request_id TEXT,
        product_name TEXT,
        input_image_url TEXT,
        output_image_url TEXT,
        status TEXT CHECK( status IN ('Pending', 'Processing', 'Completed', 'Failed') ),
        FOREIGN KEY (request_id) REFERENCES requests(id)
    )`,
    (err) => {
      if (err) console.error("Error creating images table:", err.message);
      else console.log("Images table created successfully.");
    }
  );
});

module.exports = db;
