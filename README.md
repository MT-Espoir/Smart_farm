# SmartFarm - Hướng dẫn chuyển đổi từ SQL sang MongoDB

## Giới thiệu

Dự án đã được cập nhật để sử dụng MongoDB (NoSQL) thay vì MySQL (SQL) làm cơ sở dữ liệu. Hướng dẫn này giải thích các bước để hoàn thành quá trình chuyển đổi.

## Lợi ích của việc chuyển sang MongoDB

- **Linh hoạt hơn về cấu trúc dữ liệu**: Không yêu cầu schema cố định, dễ dàng thay đổi cấu trúc dữ liệu
- **Hiệu suất tốt hơn cho ứng dụng IoT**: Xử lý dữ liệu cảm biến với khối lượng lớn hiệu quả hơn
- **Khả năng mở rộng**: Dễ dàng mở rộng theo chiều ngang
- **Thích hợp cho dữ liệu phi cấu trúc**: Lưu trữ và truy vấn dữ liệu có cấu trúc phức tạp hoặc thay đổi

## Các bước chuyển đổi

### 1. Cài đặt MongoDB

- Tải và cài đặt MongoDB Community Server từ: https://www.mongodb.com/try/download/community
- Cài đặt MongoDB Compass (tùy chọn) - công cụ GUI để quản lý MongoDB

### 2. Cài đặt thư viện cần thiết

```bash
# Cho Python
pip install pymongo mysql-connector-python

# Cho Node.js
npm install mongoose --save
```

### 3. Chạy script chuyển đổi tự động

```bash
python setup_mongodb.py
```

Quá trình này sẽ:
- Kiểm tra và khởi động MongoDB
- Áp dụng schema cho MongoDB
- Di chuyển dữ liệu từ MySQL sang MongoDB

### 4. Kiểm tra kết quả

Sau khi chuyển đổi, bạn có thể kiểm tra dữ liệu trong MongoDB bằng MongoDB Compass hoặc mongosh:

```bash
mongosh
use smartfarm
db.devices.find()
db.plants.find()
db.chat_messages.find()
db.environmental_data.find()
```

### 5. Khởi động ứng dụng với MongoDB

```bash
node backend/server.js
```

## Cấu trúc dữ liệu trong MongoDB

### Collection "devices"
```json
{
  "_id": ObjectId(),
  "device_name": "led",
  "state": "active"
}
```

### Collection "plants"
```json
{
  "_id": ObjectId(),
  "plant_name": "tomato",
  "start_date": ISODate("2025-03-03"),
  "end_date": ISODate("2025-03-06")
}
```

### Collection "chat_messages"
```json
{
  "_id": ObjectId(),
  "user_id": "user123",
  "message": "How are my plants doing?",
  "is_bot": false,
  "timestamp": ISODate("2025-03-02T19:18:00Z")
}
```

### Collection "environmental_data"
```json
{
  "_id": ObjectId(),
  "timestamp": ISODate("2025-03-02T19:18:00Z"),
  "temperature": 25.5,
  "humidity": 65.2,
  "soil_moisture": 42.8,
  "lux": 850.5
}
```

## Các file được cập nhật

1. `backend/server.js` - Server Node.js đã được cập nhật để sử dụng Mongoose thay vì MySQL
2. `backend/plant_tracker.py` - Được cập nhật để sử dụng PyMongo thay vì file CSV
3. `sql_to_mongodb.py` - Script chuyển đổi dữ liệu từ SQL sang MongoDB
4. `backend/mongo_schema.js` - Định nghĩa schema cho MongoDB
5. `setup_mongodb.py` - Script tự động hóa toàn bộ quá trình chuyển đổi

## Khắc phục sự cố

- **Không thể kết nối tới MongoDB**: Đảm bảo dịch vụ MongoDB đang chạy
- **Lỗi khi chuyển đổi dữ liệu**: Kiểm tra kết nối tới cả MySQL và MongoDB
- **Không thể áp dụng schema**: Cài đặt mongosh và đảm bảo đường dẫn tới mongo_schema.js là chính xác
