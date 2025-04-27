/**
 * MongoDB Schema cho dự án SmartFarm
 * Định nghĩa cấu trúc cho các collection trong MongoDB
 */

// Collection devices
db.createCollection("devices", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["device_name", "state"],
      properties: {
        device_name: {
          bsonType: "string",
          description: "Tên thiết bị, bắt buộc phải có"
        },
        state: {
          bsonType: "string",
          description: "Trạng thái hoạt động của thiết bị, mặc định là 'active'"
        }
      }
    }
  }
});

// Collection plants
db.createCollection("plants", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["plant_name", "start_date", "end_date"],
      properties: {
        plant_name: {
          bsonType: "string",
          description: "Tên loại cây trồng"
        },
        start_date: {
          bsonType: "date",
          description: "Ngày bắt đầu trồng"
        },
        end_date: {
          bsonType: "date",
          description: "Ngày dự kiến thu hoạch"
        }
      }
    }
  }
});

// Collection chat_messages
db.createCollection("chat_messages", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["user_id", "message", "is_bot", "timestamp"],
      properties: {
        user_id: {
          bsonType: "string",
          description: "ID của người dùng gửi tin nhắn"
        },
        message: {
          bsonType: "string",
          description: "Nội dung tin nhắn"
        },
        is_bot: {
          bsonType: "bool", 
          description: "Cờ xác định xem tin nhắn có phải từ bot hay không"
        },
        timestamp: {
          bsonType: "date",
          description: "Thời gian gửi tin nhắn"
        }
      }
    }
  }
});

// Collection environmental_data
db.createCollection("environmental_data", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["timestamp"],
      properties: {
        timestamp: {
          bsonType: "date",
          description: "Thời gian ghi nhận dữ liệu"
        },
        temperature: {
          bsonType: "double",
          description: "Nhiệt độ môi trường"
        },
        humidity: {
          bsonType: "double",
          description: "Độ ẩm không khí"
        },
        soil_moisture: {
          bsonType: "double",
          description: "Độ ẩm đất"
        },
        lux: {
          bsonType: "double",
          description: "Cường độ ánh sáng"
        }
      }
    }
  }
});

// Tạo các index cần thiết để tối ưu hóa hiệu suất truy vấn
db.devices.createIndex({ "device_name": 1 }, { unique: true });
db.plants.createIndex({ "plant_name": 1 });
db.environmental_data.createIndex({ "timestamp": 1 });
db.chat_messages.createIndex({ "timestamp": 1 });