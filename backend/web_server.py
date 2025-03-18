from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit
import paho.mqtt.client as mqtt
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

MQTT_BROKER = "broker.hivemq.com"  # Hoặc dùng MQTT broker riêng của bạn
MQTT_PORT = 1883
MQTT_TOPIC_COMMAND = "yolouno/pump"  # Chủ đề MQTT để điều khiển bơm nước

# Kết nối MQTT
mqtt_client = mqtt.Client()
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
        data = load_data()
        if data.empty:
            return jsonify({"error": "No data available"}), 404
            
        # Convert to records and handle NaN values
        records = data.replace({np.nan: None}).to_dict(orient='records')
        
        # Add debug print
        print("Sending response with", len(records), "records")
        
        return jsonify(records)
    except Exception as e:
        print(f"Error in get_sensor_data: {str(e)}")
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

# def run_sensor_data():
#     os.system('python sensor_data.py')

def run_plant_tracker():
    os.system('python plant_tracker.py')

if __name__ == '__main__':
    # threading.Thread(target=run_sensor_data).start()
    threading.Thread(target=run_plant_tracker).start()
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)