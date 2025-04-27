require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/smartfarm', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("Kết nối MongoDB thành công!"))
.catch(err => console.error("Lỗi kết nối MongoDB:", err));

// Định nghĩa các Schema cho MongoDB
const deviceSchema = new mongoose.Schema({
  device_name: { type: String, required: true, unique: true },
  state: { type: String, default: 'active' }
});

const plantSchema = new mongoose.Schema({
  plant_name: { type: String, required: true },
  start_date: { type: Date, required: true },
  end_date: { type: Date, required: true }
});

const chatMessageSchema = new mongoose.Schema({
  user_id: { type: String, required: true },
  message: { type: String, required: true },
  is_bot: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

const environmentalDataSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  temperature: Number,
  humidity: Number,
  soil_moisture: Number,
  lux: Number
});

// Tạo các Model
const Device = mongoose.model('Device', deviceSchema);
const Plant = mongoose.model('Plant', plantSchema);
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
const EnvironmentalData = mongoose.model('EnvironmentalData', environmentalDataSchema);

// API lấy danh sách cây trồng
app.get("/plants", async (req, res) => {
  try {
    const plants = await Plant.find();
    // Format dates như SQL để tương thích với frontend hiện tại
    const formattedPlants = plants.map(plant => {
      const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth()+1).toString().padStart(2, '0')}-${d.getFullYear()}`;
      };
      
      return {
        id: plant._id,
        plant_name: plant.plant_name,
        start_date: formatDate(plant.start_date),
        end_date: formatDate(plant.end_date)
      };
    });
    
    res.json(formattedPlants);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API thêm cây trồng mới
app.post("/plants", async (req, res) => {
  try {
    const { plant_name, start_date, end_date } = req.body;
    const newPlant = new Plant({ 
      plant_name, 
      start_date: new Date(start_date), 
      end_date: new Date(end_date) 
    });
    await newPlant.save();
    res.status(201).send("Thêm cây trồng thành công!");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API xóa cây trồng
app.delete("/plants/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Plant.findByIdAndDelete(id);
    res.status(200).send("Xóa cây trồng thành công!");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API lấy danh sách thiết bị
app.get("/api/devices", async (req, res) => {
  try {
    const devices = await Device.find();
    res.json(devices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lỗi truy vấn database" });
  }
});

// API thêm thiết bị mới
app.post("/api/devices", async (req, res) => {
  try {
    const { device_name, state = "active" } = req.body;
    const newDevice = new Device({ device_name, state });
    const savedDevice = await newDevice.save();
    res.status(201).send({ 
      message: "Thêm thiết bị thành công!", 
      device_id: savedDevice._id 
    });
  } catch (err) {
    console.error("Lỗi khi thêm thiết bị:", err);
    res.status(500).send(err.message);
  }
});

// API cập nhật trạng thái thiết bị
app.put("/api/devices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { state } = req.body;
    await Device.findByIdAndUpdate(id, { state });
    res.status(200).send("Cập nhật trạng thái thiết bị thành công!");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API xóa thiết bị
app.delete("/api/devices/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await Device.findByIdAndDelete(id);
    res.status(200).send("Xóa thiết bị thành công!");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    // Lưu tin nhắn vào database
    const userMessage = new ChatMessage({
      user_id: userId,
      message,
      is_bot: false
    });
    await userMessage.save();
    
    // Xử lý câu trả lời cho chatbot
    const botResponse = await processMessage(message, userId);
    
    // Lưu câu trả lời của bot
    const botMessage = new ChatMessage({
      user_id: userId,
      message: botResponse,
      is_bot: true
    });
    const savedBotMessage = await botMessage.save();
    
    res.json({
      response: botResponse,
      messageId: savedBotMessage._id
    });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Lấy lịch sử chat của user
app.get("/api/chat/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const messages = await ChatMessage.find({ user_id: userId }).sort('timestamp');
    res.json(messages);
  } catch (err) {
    res.status(500).send(err.message);
  }
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
      await Device.findOneAndUpdate({ device_name: 'pump' }, { state: 'active' });
      return "Đã bật bơm nước cho khu vườn.";
    }
    
    if (message.includes("tắt bơm") || message.includes("tat bom")) {
      await Device.findOneAndUpdate({ device_name: 'pump' }, { state: 'inactive' });
      return "Đã tắt bơm nước.";
    }
    
    if (message.includes("bật quạt") || message.includes("bat quat")) {
      await Device.findOneAndUpdate({ device_name: 'fan' }, { state: 'active' });
      return "Đã bật quạt thông gió.";
    }
    
    if (message.includes("tắt quạt") || message.includes("tat quat")) {
      await Device.findOneAndUpdate({ device_name: 'fan' }, { state: 'inactive' });
      return "Đã tắt quạt thông gió.";
    }
    
    if (message.includes("bật đèn") || message.includes("bat den") || 
        message.includes("bật led") || message.includes("bat led")) {
      await Device.findOneAndUpdate({ device_name: 'led' }, { state: 'active' });
      return "Đã bật đèn chiếu sáng.";
    }
    
    if (message.includes("tắt đèn") || message.includes("tat den") ||
        message.includes("tắt led") || message.includes("tat led")) {
      await Device.findOneAndUpdate({ device_name: 'led' }, { state: 'inactive' });
      return "Đã tắt đèn chiếu sáng.";
    }
    
    if (message.includes("mở máy che") || message.includes("mo may che")) {
      await Device.findOneAndUpdate({ device_name: 'cover' }, { state: 'active' });
      return "Đã mở máy che cho khu vườn.";
    }
    
    if (message.includes("đóng máy che") || message.includes("dong may che")) {
      await Device.findOneAndUpdate({ device_name: 'cover' }, { state: 'inactive' });
      return "Đã đóng máy che.";
    }
    
    // Default fallback response if everything fails
    return "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau.";
  }
}

// Thêm API để lưu dữ liệu môi trường từ các cảm biến
app.post("/api/environmental-data", async (req, res) => {
  try {
    const { temperature, humidity, soil_moisture, lux } = req.body;
    const envData = new EnvironmentalData({
      temperature,
      humidity,
      soil_moisture,
      lux
    });
    await envData.save();
    res.status(201).send("Lưu dữ liệu môi trường thành công!");
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// API lấy dữ liệu môi trường mới nhất
app.get("/api/environmental-data/latest", async (req, res) => {
  try {
    const latestData = await EnvironmentalData.findOne().sort('-timestamp');
    res.json(latestData || {});
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Chạy server
const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
});