// require("dotenv").config();
// const express = require("express");
// const mysql = require("mysql2");
// const cors = require("cors");

// const app = express();
// app.use(cors());
// app.use(express.json());

// // Kết nối MySQL
// const db = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "",  // Đổi thành mật khẩu MySQL của bạn
//   database: "smartfarm_db"
// });

// db.connect((err) => {
//   if (err) {
//     console.error("Lỗi kết nối MySQL:", err);
//   } else {
//     console.log("Kết nối MySQL thành công!");
//   }
// });

// // API lấy danh sách cây trồng
// app.get("/plants", (req, res) => {
//   db.query(
//     "SELECT id, plant_name, DATE_FORMAT(start_date, '%d-%m-%Y') AS start_date, DATE_FORMAT(end_date, '%d-%m-%Y') AS end_date FROM plant",
//     (err, result) => {
//       if (err) {
//         res.status(500).send(err);
//       } else {
//         res.json(result);
//       }
//     }
//   );
// });

// // API thêm cây trồng mới
// app.post("/plants", (req, res) => {
//   const { plant_name, start_date, end_date } = req.body;
//   db.query(
//     "INSERT INTO plant (plant_name, start_date, end_date) VALUES (?, ?, ?)",
//     [plant_name, start_date, end_date],
//     (err, result) => {
//       if (err) {
//         res.status(500).send(err);
//       } else {
//         res.status(201).send("Thêm cây trồng thành công!");
//       }
//     }
//   );
// });

// // API xóa cây trồng
// app.delete("/plants/:id", (req, res) => {
//   const { id } = req.params;
//   db.query(
//     "DELETE FROM plant WHERE id = ?",
//     [id],
//     (err, result) => {
//       if (err) {
//         res.status(500).send(err);
//       } else {
//         res.status(200).send("Xóa cây trồng thành công!");
//       }
//     }
//   );
// });

// //-------------------device-------------------
// app.get('/api/devices', (req, res) => {
//   db.query('SELECT * FROM device', (err, results) => {
//       if (err) {
//           console.error(err);
//           res.status(500).json({ error: 'Lỗi truy vấn database' });
//       } else {
//           res.json(results);
//       }
//   });
// });

// // Chạy server
// const PORT = 5000;
// app.listen(PORT, () => {
//   console.log(`Server chạy tại http://localhost:${PORT}`);
// });


require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",  // Đổi thành mật khẩu MySQL của bạn
  database: "smartfarm_db"
});

db.connect((err) => {
  if (err) {
    console.error("Lỗi kết nối MySQL:", err);
  } else {
    console.log("Kết nối MySQL thành công!");
  }
});

// API lấy danh sách cây trồng
app.get("/plants", (req, res) => {
  db.query(
    "SELECT id, plant_name, DATE_FORMAT(start_date, '%d-%m-%Y') AS start_date, DATE_FORMAT(end_date, '%d-%m-%Y') AS end_date FROM plant",
    (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json(result);
      }
    }
  );
});

// API thêm cây trồng mới
app.post("/plants", (req, res) => {
  const { plant_name, start_date, end_date } = req.body;
  db.query(
    "INSERT INTO plant (plant_name, start_date, end_date) VALUES (?, ?, ?)",
    [plant_name, start_date, end_date],
    (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(201).send("Thêm cây trồng thành công!");
      }
    }
  );
});

// API xóa cây trồng
app.delete("/plants/:id", (req, res) => {
  const { id } = req.params;
  db.query(
    "DELETE FROM plant WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send("Xóa cây trồng thành công!");
      }
    }
  );
});

// API lấy danh sách thiết bị
app.get('/api/devices', (req, res) => {
  db.query('SELECT * FROM device', (err, results) => {
      if (err) {
          console.error(err);
          res.status(500).json({ error: 'Lỗi truy vấn database' });
      } else {
          res.json(results);
      }
  });
});

// API thêm thiết bị mới
app.post("/api/devices", (req, res) => {
  const { device_name } = req.body;
  db.query(
    "INSERT INTO device (device_name) VALUES (?)",
    [device_name],
    (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(201).send("Thêm thiết bị thành công!");
      }
    }
  );
});

// API xóa thiết bị
app.delete("/api/devices/:id", (req, res) => {
  const { id } = req.params;
  db.query(
    "DELETE FROM device WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send("Xóa thiết bị thành công!");
      }
    }
  );
});

// Chạy server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});