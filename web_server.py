from flask import Flask, render_template, request, jsonify
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

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")
DATA_FILE = r'Data/sensor_data.csv'

MQTT_BROKER = "broker.hivemq.com"  # Hoặc dùng MQTT broker riêng của bạn
MQTT_PORT = 1883
MQTT_TOPIC_COMMAND = "yolouno/pump"  # Chủ đề MQTT để điều khiển bơm nước

# Kết nối MQTT
mqtt_client = mqtt.Client()
mqtt_client.connect(MQTT_BROKER, MQTT_PORT, 60)
mqtt_client.loop_start()

MODEL_PATH = r'Data/my_model.h5'
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

def run_sensor_data():
    os.system('python sensor_data.py')

def run_plant_tracker():
    os.system('python plant_tracker.py')

if __name__ == '__main__':
    threading.Thread(target=run_sensor_data).start()
    threading.Thread(target=run_plant_tracker).start()
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)