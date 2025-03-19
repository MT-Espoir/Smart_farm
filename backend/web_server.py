from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
import paho.mqtt.client as mqtt
import json
import threading
from datetime import datetime
import tensorflow as tf
from utils import *
from plant_tracker import PlantTracker
import os
import threading
import time
from utils import get_latest_data, load_data
from flask_cors import CORS
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime
from chatbot import chatbot_service
import mysql.connector

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:3000"],  # Thêm origin của React app
        "methods": ["GET", "POST", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "Accept"],
        "supports_credentials": True
    }
})
socketio = SocketIO(app, cors_allowed_origins="*")
DATA_FILE = r'backend/Data/sensor_data.csv'

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'smartfarm'
}

MQTT_BROKER = "test.mosquitto.org"  # Hoặc dùng MQTT broker riêng của bạn
MQTT_PORT = 1883
MQTT_TOPIC_PUMP = "yolouno/pump"
MQTT_TOPIC_FAN = "yolouno/fan"
MQTT_TOPIC_LED = "yolouno/led"
MQTT_TOPIC_COVER = "yolouno/cover"
MQTT_TOPIC_COMMAND = "yolouno/command"
MQTT_TOPIC_SENSOR_DATA = "yolouno/sensor_data"  # Add this line

# Add this global flag to prevent duplicate subscriptions
mqtt_subscribed = False
# Add these functions for MQTT callbacks
def on_mqtt_connect(client, userdata, flags, rc):
    global mqtt_subscribed
    print(f"Connected to MQTT broker with result code {rc}")
    
    # Only subscribe if we haven't already
    if not mqtt_subscribed:
        client.subscribe(MQTT_TOPIC_SENSOR_DATA)
        mqtt_subscribed = True
        print(f"Subscribed to {MQTT_TOPIC_SENSOR_DATA}")
    
def on_mqtt_message(client, userdata, msg):
    if msg.topic == MQTT_TOPIC_SENSOR_DATA:
        try:
            # Parse the JSON message
            payload = json.loads(msg.payload.decode())
            print(f"Received sensor data via MQTT: {payload}")
            
            # Store in database
            store_sensor_data_in_db(
                payload.get('temperature'),
                payload.get('humidity'),
                payload.get('soil_moisture'),
                payload.get('lux'),
                payload.get('pump_status', 0)
            )
            
            # Emit to web clients via socketio if needed
            socketio.emit('new_sensor_data', payload)
            
        except Exception as e:
            print(f"Error processing MQTT sensor data: {e}")

# Function to store sensor data in the database
def store_sensor_data_in_db(temperature, humidity, soil_moisture, lux, pump_status=0):
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()
        
        # Insert data into database
        query = """INSERT INTO environmental_data 
                  (timestamp, temperature, humidity, soil_moisture, lux) 
                  VALUES (NOW(), %s, %s, %s, %s)"""
                  
        cursor.execute(query, (temperature, humidity, soil_moisture, lux))
        conn.commit()
        
        cursor.close()
        conn.close()
        print(f"Stored sensor data in database: Temp={temperature}°C, Humidity={humidity}%, Soil={soil_moisture}%, Light={lux}")
        return True
    except Exception as e:
        print(f"Error storing sensor data in database: {e}")
        return False

# Update MQTT client initialization with correct API version
mqtt_client = mqtt.Client(callback_api_version=mqtt.CallbackAPIVersion.VERSION1)
mqtt_client.on_connect = on_mqtt_connect
mqtt_client.on_message = on_mqtt_message
mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
mqtt_client.loop_start()

MODEL_PATH = r'backend/Data/my_model.h5'

if os.path.exists(MODEL_PATH):
    model = tf.keras.models.load_model(MODEL_PATH)
    print("Model loaded successfully!")
else:
    raise FileNotFoundError(f"Model file not found at {MODEL_PATH}")

CLASS_LABELS = [
    'Pepper__bell___Bacterial_spot', 'Pepper__bell___healthy', 'Potato___Early_blight',
    'Potato___Late_blight', 'Potato___healthy',
    'Rice_leaf___Bacterial_leaf_blight','Rice_leaf___Brown_spot',
]
UPLOAD_FOLDER = os.path.join(os.getcwd(), "images")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

plant_tracker = PlantTracker()

# Cấu hình upload
UPLOAD_FOLDER = os.path.join(os.getcwd(), 'images')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH

# Tạo thư mục upload nếu chưa tồn tại
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/sensor_data', methods=['GET'])
def get_sensor_data():
    try:
        # Only use the database - no CSV
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Get data from database (limit to recent entries)
        cursor.execute("SELECT * FROM environmental_data ORDER BY timestamp DESC LIMIT 100")
        records = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        if not records:
            return jsonify([]), 200
            
        # Convert datetime objects to ISO format strings for JSON serialization
        for record in records:
            if 'timestamp' in record and record['timestamp']:
                record['timestamp'] = record['timestamp'].isoformat()
        
        print(f"Sending response with {len(records)} records from database")
        return jsonify(records)
        
    except Exception as e:
        print(f"Error in get_sensor_data: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/sensor_data/by-date/<date>', methods=['GET'])
def get_sensor_data_by_date(date):
    try:
        # Use the utility function to get data by date
        records = get_by_date(date)
        
        if not records:
            return jsonify([]), 200
            
        return jsonify(records)
    except Exception as e:
        print(f"Error in get_sensor_data_by_date: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/upload-image', methods=['POST'])
def upload_image():
    try:
        print("Files in request:", request.files)
        
        if 'image' not in request.files:
            return jsonify({'error': 'No image file provided'}), 400

        file = request.files['image']
        print("Received file:", file.filename)
        
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400

        if not allowed_file(file.filename):
            return jsonify({'error': f'File type not allowed. Allowed types: {ALLOWED_EXTENSIONS}'}), 400

        filename = secure_filename(file.filename)
        unique_filename = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{str(uuid.uuid4())[:8]}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        
        print("Saving to:", filepath)
        file.save(filepath)
        
        # Thêm phần dự đoán bệnh
        prediction = None
        if model:
            try:
                label, confidence = predict_image_file(filepath, model, CLASS_LABELS)
                prediction = {
                    'label': label,
                    'confidence': float(confidence)
                }
            except Exception as e:
                print(f"Prediction error: {str(e)}")
        
        # Construct URL and return with prediction
        image_url = f'/api/images/{unique_filename}'
        return jsonify({
            'id': unique_filename,
            'url': image_url,
            'name': filename,
            'prediction': prediction,  # Thêm kết quả dự đoán vào response
            'uploadDate': datetime.now().isoformat()
        })

    except Exception as e:
        print("Upload error:", str(e))
        return jsonify({'error': str(e)}), 500

@app.route('/api/images/<filename>')
def serve_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/delete-image/<image_id>', methods=['DELETE'])
def delete_image(image_id):
    try:
        filepath = os.path.join(UPLOAD_FOLDER, image_id)
        if not os.path.exists(filepath):
            return jsonify({'error': 'Image not found'}), 404

        os.remove(filepath)
        return jsonify({'message': 'Image deleted successfully'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Endpoint để lấy danh sách tất cả ảnh
@app.route('/api/images', methods=['GET'])
def get_images():
    try:
        images = []
        for filename in os.listdir(UPLOAD_FOLDER):
            if allowed_file(filename):
                filepath = os.path.join(UPLOAD_FOLDER, filename)
                stat = os.stat(filepath)
                
                # Lấy prediction nếu có thể
                prediction = None
                if model:
                    try:
                        label, confidence = predict_image_file(filepath, model, CLASS_LABELS)
                        prediction = {
                            'label': label,
                            'confidence': float(confidence)
                        }
                    except Exception as e:
                        print(f"Prediction error for {filename}: {str(e)}")

                images.append({
                    'id': filename,
                    'url': f'/api/images/{filename}',
                    'name': filename,
                    'prediction': prediction,
                    'uploadDate': datetime.fromtimestamp(stat.st_mtime).isoformat()
                })
        
        return jsonify(images)

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/chatbot', methods=['POST'])
def chatbot_api():
    try:
        data = request.json
        message = data.get('message', '')
        user_id = data.get('userId', '')
        
        # Get the basic response from the chatbot model
        result = chatbot_service.get_response(message)
        response = result['response']
        intent = result['intent']
        
        # For certain intents, get more detailed information from the database
        message = message.lower()
        
        # Connect to database for dynamic responses
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        
        # Handle specific environmental queries
        if intent == "Question for info":
            # Check for specific environmental parameters in the message
            if "nhiệt độ" in message or "nhiet do" in message:
                try:
                    cursor.execute("SELECT temperature FROM environmental_data ORDER BY timestamp DESC LIMIT 1")
                    data = cursor.fetchone()
                    if data and data['temperature']:
                        response = f"Nhiệt độ hiện tại là {data['temperature']}°C."
                    else:
                        response = "Hiện không có dữ liệu về nhiệt độ."
                except Exception as e:
                    print(f"Error querying temperature: {e}")
                    
            elif "độ ẩm" in message or "do am" in message:
                try:
                    cursor.execute("SELECT humidity FROM environmental_data ORDER BY timestamp DESC LIMIT 1")
                    data = cursor.fetchone()
                    if data and data['humidity']:
                        response = f"Độ ẩm hiện tại là {data['humidity']}%."
                    else:
                        response = "Hiện không có dữ liệu về độ ẩm."
                except Exception as e:
                    print(f"Error querying humidity: {e}")
                    
            elif "ánh sáng" in message or "anh sang" in message:
                try:
                    cursor.execute("SELECT lux FROM environmental_data ORDER BY timestamp DESC LIMIT 1")
                    data = cursor.fetchone()
                    if data and data['lux']:
                        response = f"Cường độ ánh sáng hiện tại là {data['lux']} lux."
                    else:
                        response = "Hiện không có dữ liệu về ánh sáng."
                except Exception as e:
                    print(f"Error querying light: {e}")
                    
            else:
                # General environmental data response
                try:
                    cursor.execute("SELECT temperature, humidity, lux FROM environmental_data ORDER BY timestamp DESC LIMIT 1")
                    data = cursor.fetchone()
                    if data:
                        response = f"Nhiệt độ hiện tại là {data['temperature'] or 'N/A'}°C, độ ẩm là {data['humidity'] or 'N/A'}%, và cường độ ánh sáng là {data['lux'] or 'N/A'} lux."
                    else:
                        response = "Hiện không có dữ liệu cảm biến."
                except Exception as e:
                    print(f"Error querying environmental data: {e}")
                
        elif intent == "Question for info1" and "cây trồng" in message or "thu hoạch" in message:
            try:
                cursor.execute("SELECT plant_name, end_date FROM plant")
                plants = cursor.fetchall()
                if plants:
                    plant_info = "\n".join([f"- {p['plant_name']} (thu hoạch: {p['end_date']})" for p in plants])
                    response = f"Các loại cây đang trồng:\n{plant_info}"
                else:
                    response = "Hiện chưa có thông tin về cây trồng."
            except Exception as e:
                print(f"Error querying plants: {e}")
                
        elif intent == "Question for system status" and "thiết bị" in message or "trạng thái" in message:
            try:
                cursor.execute("SELECT device_name, state FROM device")
                devices = cursor.fetchall()
                if devices:
                    device_info = ", ".join([f"{d['device_name']} ({d['state']})" for d in devices])
                    response = f"Trạng thái thiết bị: {device_info}"
                else:
                    response = "Hiện chưa có thông tin về thiết bị."
            except Exception as e:
                print(f"Error querying devices: {e}")
        
        # Device control commands - separated for each device
        elif "bật bơm" in message or "bat bom" in message:
            try:
                cursor.execute("UPDATE device SET state = 'active' WHERE device_name = 'pump'")
                conn.commit()
                response = "Đã bật bơm nước cho khu vườn."
                # Send MQTT message to trigger the pump
                mqtt_client.publish(MQTT_TOPIC_COMMAND, "ON")
            except Exception as e:
                print(f"Error updating pump state: {e}")
                
        elif "tắt bơm" in message or "tat bom" in message:
            try:
                cursor.execute("UPDATE device SET state = 'inactive' WHERE device_name = 'pump'")
                conn.commit()
                response = "Đã tắt bơm nước."
                # Send MQTT message to turn off the pump
                mqtt_client.publish(MQTT_TOPIC_COMMAND, "OFF")
            except Exception as e:
                print(f"Error updating pump state: {e}")
                
        elif "bật quạt" in message or "bat quat" in message:
            try:
                cursor.execute("UPDATE device SET state = 'active' WHERE device_name = 'fan'")
                conn.commit()
                response = "Đã bật quạt thông gió."
                # Add MQTT publish if needed
            except Exception as e:
                print(f"Error updating fan state: {e}")
                
        elif "tắt quạt" in message or "tat quat" in message:
            try:
                cursor.execute("UPDATE device SET state = 'inactive' WHERE device_name = 'fan'")
                conn.commit()
                response = "Đã tắt quạt thông gió."
                # Add MQTT publish if needed
            except Exception as e:
                print(f"Error updating fan state: {e}")
                
        elif "bật đèn" in message or "bat den" in message or "bật led" in message or "bat led" in message:
            try:
                cursor.execute("UPDATE device SET state = 'active' WHERE device_name = 'led'")
                conn.commit()
                response = "Đã bật đèn chiếu sáng."
                # Add MQTT publish if needed
            except Exception as e:
                print(f"Error updating LED state: {e}")
                
        elif "tắt đèn" in message or "tat den" in message or "tắt led" in message or "tat led" in message:
            try:
                cursor.execute("UPDATE device SET state = 'inactive' WHERE device_name = 'led'")
                conn.commit()
                response = "Đã tắt đèn chiếu sáng."
                # Add MQTT publish if needed
            except Exception as e:
                print(f"Error updating LED state: {e}")
                
        elif "mở máy che" in message or "mo may che" in message:
            try:
                cursor.execute("UPDATE device SET state = 'active' WHERE device_name = 'cover'")
                conn.commit()
                response = "Đã mở máy che cho khu vườn."
                # Add MQTT publish if needed
            except Exception as e:
                print(f"Error updating cover state: {e}")
                
        elif "đóng máy che" in message or "dong may che" in message:
            try:
                cursor.execute("UPDATE device SET state = 'inactive' WHERE device_name = 'cover'")
                conn.commit()
                response = "Đã đóng máy che."
                # Add MQTT publish if needed
            except Exception as e:
                print(f"Error updating cover state: {e}")
        
        conn.close()
        
        return jsonify({
            'response': response,
            'intent': intent
        })
        
    except Exception as e:
        print(f"Chatbot API error: {e}")
        return jsonify({
            'error': str(e),
            'response': "Xin lỗi, tôi đang gặp sự cố kỹ thuật."
        }), 500

def run_sensor_data():
     os.system('python backend/sensor_data.py')

def run_plant_tracker():
    os.system('python backend/plant_tracker.py')

if __name__ == '__main__':
    # threading.Thread(target=run_sensor_data).start()
    threading.Thread(target=run_plant_tracker).start()
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)