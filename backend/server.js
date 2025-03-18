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
  database: "smartfarm"
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
app.get("/api/devices", (req, res) => {
  db.query("SELECT * FROM device", (err, results) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: "Lỗi truy vấn database" });
    } else {
      res.json(results);
    }
  });
});

// API thêm thiết bị mới
app.post("/api/devices", (req, res) => {
  const { device_name, state = "active" } = req.body; // Nếu không có state, mặc định là "active"

  db.query(
      "INSERT INTO device (device_name, state) VALUES (?, ?)",
      [device_name, state],
      (err, result) => {
          if (err) {
              console.error("Lỗi khi thêm thiết bị:", err);
              res.status(500).send(err);
          } else {
              res.status(201).send({ message: "Thêm thiết bị thành công!", device_id: result.insertId });
          }
      }
  );
});


// API cập nhật trạng thái thiết bị
app.put("/api/devices/:id", (req, res) => {
  const { id } = req.params;
  const { state } = req.body;
  db.query(
    "UPDATE device SET state = ? WHERE id = ?",
    [state, id],
    (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).send("Cập nhật trạng thái thiết bị thành công!");
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

app.post("/api/chat", (req, res) => {
  const { message, userId } = req.body;
  
  // Lưu tin nhắn vào database
  db.query(
    "INSERT INTO chat_messages (user_id, message, is_bot) VALUES (?, ?, 0)",
    [userId, message],
    (err, result) => {
      if (err) {
        res.status(500).send(err);
        return;
      }
      
      // Xử lý câu trả lời cho chatbot
      processMessage(message, userId)
        .then(botResponse => {
          // Lưu câu trả lời của bot
          db.query(
            "INSERT INTO chat_messages (user_id, message, is_bot) VALUES (?, ?, 1)",
            [userId, botResponse],
            (err, result) => {
              if (err) {
                res.status(500).send(err);
                return;
              }
              
              res.json({
                response: botResponse,
                messageId: result.insertId
              });
            }
          );
        })
        .catch(error => {
          res.status(500).send(error.message);
        });
    }
  );
});

// Lấy lịch sử chat của user
app.get("/api/chat/history/:userId", (req, res) => {
  const { userId } = req.params;
  
  db.query(
    "SELECT * FROM chat_messages WHERE user_id = ? ORDER BY timestamp ASC",
    [userId],
    (err, result) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.json(result);
      }
    }
  );
});

// Hàm xử lý tin nhắn và trả về câu trả lời
async function processMessage(message, userId) {
  message = message.toLowerCase();
  
  // Kiểm tra các lệnh điều khiển
  if (message.includes("tưới nước") || message.includes("bật bơm")) {
    // Bật bơm nước
    db.query("UPDATE device SET state = 'active' WHERE device_name = 'pump'");
    return "Đã bật bơm nước cho khu vườn.";
  }
  
  if (message.includes("tắt bơm") || message.includes("dừng tưới")) {
    // Tắt bơm nước
    db.query("UPDATE device SET state = 'inactive' WHERE device_name = 'pump'");
    return "Đã tắt bơm nước.";
  }
  
  // Truy vấn thông tin
  if (message.includes("nhiệt độ") || message.includes("độ ẩm")) {
    const data = await new Promise((resolve, reject) => {
      db.query(
        "SELECT temperature, humidity FROM environmental_data ORDER BY timestamp DESC LIMIT 1",
        (err, result) => {
          if (err) reject(err);
          else resolve(result[0] || {});
        }
      );
    });
    
    if (data) {
      return `Nhiệt độ hiện tại là ${data.temperature || 'N/A'}°C và độ ẩm là ${data.humidity || 'N/A'}%.`;
    }
  }
  
  if (message.includes("cây trồng") || message.includes("thu hoạch")) {
    const plants = await new Promise((resolve, reject) => {
      db.query(
        "SELECT plant_name, end_date FROM plant",
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    if (plants.length > 0) {
      const plantInfo = plants.map(p => `${p.plant_name} (dự kiến thu hoạch: ${p.end_date})`).join(", ");
      return `Các loại cây đang trồng: ${plantInfo}`;
    }
    return "Hiện chưa có thông tin về cây trồng.";
  }
  
  if (message.includes("thiết bị") || message.includes("trạng thái")) {
    const devices = await new Promise((resolve, reject) => {
      db.query(
        "SELECT device_name, state FROM device",
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    if (devices.length > 0) {
      const deviceInfo = devices.map(d => `${d.device_name} (${d.state})`).join(", ");
      return `Trạng thái thiết bị: ${deviceInfo}`;
    }
    return "Hiện chưa có thông tin về thiết bị.";
  }
  
  // Câu trả lời mặc định
  return "Xin chào! Tôi là trợ lý SmartFarm. Tôi có thể giúp bạn kiểm tra nhiệt độ, độ ẩm, thông tin về cây trồng, điều khiển hệ thống tưới nước và nhiều thứ khác.";
}

// Chạy server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});