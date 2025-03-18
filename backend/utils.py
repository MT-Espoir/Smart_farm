# utils.py
import os
import pandas as pd
from datetime import datetime, timedelta
import numpy as np
from keras._tf_keras.keras.preprocessing.image import load_img, img_to_array

DATA_FILE = "backend/Data/sensor_data.csv"


def get_latest_data():
    if os.path.exists(DATA_FILE):
        df = pd.read_csv(DATA_FILE)
        if not df.empty:
            latest = df.iloc[-1]
            return {
                'timestamp': latest['timestamp'],
                'temperature': latest['temperature'],
                'humidity': latest['humidity'],
                'soil_moisture': latest['soil_moisture'],
                'lux': latest['lux'],
                'pump_status': latest['pump_status']
            }
    return None

def load_data():
    if os.path.exists(DATA_FILE):
        df = pd.read_csv(DATA_FILE)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df
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
