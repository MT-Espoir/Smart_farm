# utils.py
import os
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
import mysql.connector
from keras._tf_keras.keras.preprocessing.image import load_img, img_to_array
DATA_FILE = "backend/Data/sensor_data.csv"


db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'smartfarm'
}


def get_latest_data():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM environmental_data ORDER BY timestamp DESC LIMIT 1")
        latest = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if latest:
            return latest
    except Exception as e:
        print(f"Error getting latest data: {e}")
    return None

def load_data():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM environmental_data ORDER BY timestamp DESC")
        records = cursor.fetchall()
        cursor.close()
        conn.close()
        
        # Convert to dataframe for backward compatibility
        import pandas as pd
        df = pd.DataFrame(records)
        if not df.empty:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df
    except Exception as e:
        print(f"Error loading data: {e}")
        return pd.DataFrame()

def get_by_date(date):
    try:
        df= load_data()
        query_date = datetime.strptime(date, '%Y-%m-%d').date()
        choose_date = df[df['timestamp'].dt.date == query_date]

        # Trả về kết quả dưới dạng JSON
        return choose_date.to_dict(orient='records')
    except Exception as e:
        print(f"Error retrieving data for date {date}: {str(e)}")
        return []


def get_today_avg_temperature():
    df = load_data()
    today = datetime.now().date()
    today_data = df[df['timestamp'].dt.date == today]
    if not today_data.empty:
        return today_data['temperature'].mean()
    return None


def get_today_avg_humidity():
    df = load_data()
    today = datetime.now().date()
    today_data = df[df['timestamp'].dt.date == today]
    if not today_data.empty:
        return today_data['humidity'].mean()
    return None

def get_today_pump_count():
    df = load_data()
    today = datetime.now().date()
    pump_count = len(df[(df['timestamp'].dt.date == today) & (df['pump_status'] == 1)])
    return pump_count

def check_system_stability():
    df = load_data()
    if df.empty:
        return "Không có dữ liệu cảm biến."

    latest = df.iloc[-1]
    last_timestamp = latest['timestamp']
    now = datetime.now()

    if (now - last_timestamp) > timedelta(minutes=2):
        return "Cảm biến không cập nhật dữ liệu mới, hệ thống có lỗi."

    issues = []
    temp = latest.get('temperature')
    humidity = latest.get('humidity')
    soil_moisture = latest.get('soil_moisture')
    lux = latest.get('lux')

    if temp is not None and not (8 <= temp <= 50):
        issues.append("Cảm biến nhiệt độ bất thường")
    if humidity is not None and not (30 <= humidity <= 100):
        issues.append("Cảm biến độ ẩm bất thường")
    if soil_moisture is not None and not (0 <= soil_moisture <= 100):
        issues.append("Cảm biến độ ẩm đất bất thường")
    if lux is not None and lux < 100:
        issues.append("Cảm biến ánh sáng bất thường")
    if issues:
        return "Hệ thống có lỗi: " + ", ".join(issues)

    return "Hệ thống đang hoạt động ổn định."


def predict_image_file(image_path, model, class_labels):
    new_img = load_img(image_path, target_size=(256, 256))
    img = img_to_array(new_img)
    img = np.expand_dims(img, axis=0) / 255.0
    prediction = model.predict(img)
    index = prediction.argmax(axis=-1)[0]
    max_prob = float(prediction.flatten()[index])
    return class_labels[index], max_prob

def get_by_date(date):
    try:
        df = load_data()
        query_date = datetime.strptime(date, '%Y-%m-%d').date()
        choose_date = df[df['timestamp'].dt.date == query_date]

        # Return results as JSON
        return choose_date.to_dict(orient='records')
    except Exception as e:
        print(f"Error retrieving data for date {date}: {str(e)}")
        return []
