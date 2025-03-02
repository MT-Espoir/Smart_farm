import serial
import datetime
import os

# Cấu hình
PORT = 'COM3'  # Thay đổi theo cổng của bạn
BAUD_RATE = 115200
OUTPUT_FILE = 'Data/sensor_data.csv'
HEADER = "timestamp,temperature,humidity,soil_moisture,lux,pump_status\n"

IMAGE_FOLDER = "images"
os.makedirs(IMAGE_FOLDER, exist_ok=True)

# Kiểm tra file tồn tại
file_exists = os.path.isfile(OUTPUT_FILE)

# Kết nối serial
ser = serial.Serial(PORT, BAUD_RATE, timeout=1)

def receive_image():
    """
    Hàm nhận ảnh từ Serial.
    Giả sử ESP32-S3 gửi chuỗi "IMG_START" để bắt đầu,
    sau đó gửi dữ liệu ảnh và kết thúc bằng "IMG_END".
    """
    image_data = bytearray()
    while True:
        # Đọc từng dòng từ Serial, sử dụng errors='ignore' để tránh lỗi decode
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if line == "IMG_END":
            break
        # Nếu có dữ liệu trong dòng, thêm vào image_data
        if line:
            image_data.extend(line.encode('utf-8'))
    return image_data

try:
    with open(OUTPUT_FILE, 'a') as sensor_file:
        # Ghi header nếu file mới
        if not file_exists:
            sensor_file.write(HEADER)

        print("Đang nhận dữ liệu cảm biến và ảnh. Nhấn Ctrl+C để dừng...")
        while True:
            # Đọc từng dòng từ Serial
            line = ser.readline().decode('utf-8', errors='ignore').strip()

            if line == "IMG_START":
                # Nếu nhận được chỉ thị bắt đầu nhận ảnh, chuyển sang chế độ nhận ảnh
                image_data = receive_image()
                if image_data:
                    # Đặt tên file ảnh theo thời gian hiện tại để không bị ghi đè
                    timestamp_str = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
                    file_path = os.path.join(IMAGE_FOLDER, f"image_{timestamp_str}.jpg")
                    with open(file_path, "wb") as img_file:
                        img_file.write(image_data)
                    print(f"Ảnh đã lưu: {file_path}")

            elif line:
                # Nếu không phải là ảnh, coi đó là dữ liệu cảm biến
                timestamp = datetime.datetime.now().isoformat()
                data_line = f"{timestamp},{line}\n"
                sensor_file.write(data_line)
                sensor_file.flush()  # Ghi ngay vào file
                print(data_line.strip())

except KeyboardInterrupt:
    print("\nLogging stopped")
except Exception as e:
    print(f"Error: {str(e)}")
finally:
    ser.close()