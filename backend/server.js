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
  try {
    // Forward the request to the Flask chatbot API
    const axios = require('axios');
    const response = await axios.post('http://localhost:5000/api/chatbot', {
      message: message,
      userId: userId
    });
    
    // Return the response from the chatbot
    return response.data.response;
  } catch (error) {
    console.error("Error calling chatbot service:", error);
    
    // Fallback to the existing logic if Flask server is unavailable
    message = message.toLowerCase();
    
    // Enhanced fallback logic with more device controls
    if (message.includes("bật bơm") || message.includes("bat bom")) {
      db.query("UPDATE device SET state = 'active' WHERE device_name = 'pump'");
      return "Đã bật bơm nước cho khu vườn.";
    }
    
    if (message.includes("tắt bơm") || message.includes("tat bom")) {
      db.query("UPDATE device SET state = 'inactive' WHERE device_name = 'pump'");
      return "Đã tắt bơm nước.";
    }
    
    if (message.includes("bật quạt") || message.includes("bat quat")) {
      db.query("UPDATE device SET state = 'active' WHERE device_name = 'fan'");
      return "Đã bật quạt thông gió.";
    }
    
    if (message.includes("tắt quạt") || message.includes("tat quat")) {
      db.query("UPDATE device SET state = 'inactive' WHERE device_name = 'fan'");
      return "Đã tắt quạt thông gió.";
    }
    
    if (message.includes("bật đèn") || message.includes("bat den") || 
        message.includes("bật led") || message.includes("bat led")) {
      db.query("UPDATE device SET state = 'active' WHERE device_name = 'led'");
      return "Đã bật đèn chiếu sáng.";
    }
    
    if (message.includes("tắt đèn") || message.includes("tat den") ||
        message.includes("tắt led") || message.includes("tat led")) {
      db.query("UPDATE device SET state = 'inactive' WHERE device_name = 'led'");
      return "Đã tắt đèn chiếu sáng.";
    }
    
    if (message.includes("mở máy che") || message.includes("mo may che")) {
      db.query("UPDATE device SET state = 'active' WHERE device_name = 'cover'");
      return "Đã mở máy che cho khu vườn.";
    }
    
    if (message.includes("đóng máy che") || message.includes("dong may che")) {
      db.query("UPDATE device SET state = 'inactive' WHERE device_name = 'cover'");
      return "Đã đóng máy che.";
    }
    
    // Default fallback response if everything fails
    return "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.";
  }
}

// Chạy server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});