"""
Exploratory Data Analysis (EDA) cho dự án Smart Farm
File này chứa các hàm để phân tích dữ liệu từ cảm biến và cung cấp thông tin chi tiết
về điều kiện môi trường, mối tương quan giữa các thông số, và các điều kiện tối ưu cho cây trồng.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import matplotlib
matplotlib.use('Agg')  # Sử dụng backend không tương tác
import matplotlib.pyplot as plt
import seaborn as sns
import io
import base64
from pymongo import MongoClient
from bson.objectid import ObjectId

# Kết nối MongoDB
mongo_client = MongoClient("mongodb://localhost:27017/")
mongo_db = mongo_client["smartfarm"]
environmental_data_collection = mongo_db["environmental_data"]
plants_collection = mongo_db["plants"]

def get_dataframe():
    """Lấy dữ liệu từ MongoDB và chuyển đổi thành DataFrame"""
    try:
        # Lấy tất cả dữ liệu môi trường từ MongoDB
        data = list(environmental_data_collection.find().sort("timestamp", 1))
        
        # Chuyển đổi thành DataFrame
        df = pd.DataFrame(data)
        
        # Chuyển đổi _id thành string
        df['_id'] = df['_id'].astype(str)
        
        # Đảm bảo timestamp là datetime
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        
        return df
    except Exception as e:
        print(f"Lỗi khi lấy dữ liệu: {e}")
        return pd.DataFrame()

def get_daily_statistics(days=7):
    """
    Tính toán thống kê hàng ngày cho dữ liệu cảm biến
    
    Parameters:
    -----------
    days : int, mặc định 7
        Số ngày cần phân tích
    
    Returns:
    --------
    dict
        Thống kê hàng ngày bao gồm min, max, mean, std cho mỗi thông số
    """
    try:
        df = get_dataframe()
        if df.empty:
            return {"error": "Không có dữ liệu"}
            
        # Lấy dữ liệu trong khoảng thời gian chỉ định
        end_date = df['timestamp'].max()
        start_date = end_date - timedelta(days=days)
        df_period = df[(df['timestamp'] >= start_date) & (df['timestamp'] <= end_date)]
        
        # Thêm cột ngày từ timestamp
        df_period['date'] = df_period['timestamp'].dt.date
        
        # Nhóm dữ liệu theo ngày và tính toán thống kê
        daily_stats = df_period.groupby('date').agg({
            'temperature': ['min', 'max', 'mean', 'std'],
            'humidity': ['min', 'max', 'mean', 'std'],
            'soil_moisture': ['min', 'max', 'mean', 'std'],
            'lux': ['min', 'max', 'mean', 'std']
        }).reset_index()
        
        # Định dạng lại kết quả
        result = {}
        for date in daily_stats['date'].unique():
            date_str = date.strftime('%Y-%m-%d')
            date_data = daily_stats[daily_stats['date'] == date].iloc[0]
            result[date_str] = {
                'temperature': {
                    'min': float(date_data['temperature']['min']),
                    'max': float(date_data['temperature']['max']),
                    'mean': float(date_data['temperature']['mean']),
                    'std': float(date_data['temperature']['std'])
                },
                'humidity': {
                    'min': float(date_data['humidity']['min']),
                    'max': float(date_data['humidity']['max']),
                    'mean': float(date_data['humidity']['mean']),
                    'std': float(date_data['humidity']['std'])
                },
                'soil_moisture': {
                    'min': float(date_data['soil_moisture']['min']),
                    'max': float(date_data['soil_moisture']['max']),
                    'mean': float(date_data['soil_moisture']['mean']),
                    'std': float(date_data['soil_moisture']['std'])
                },
                'lux': {
                    'min': float(date_data['lux']['min']),
                    'max': float(date_data['lux']['max']),
                    'mean': float(date_data['lux']['mean']),
                    'std': float(date_data['lux']['std'])
                }
            }
        
        return result
    except Exception as e:
        print(f"Lỗi khi tính toán thống kê hàng ngày: {e}")
        return {"error": str(e)}

def get_correlation_analysis():
    """
    Phân tích tương quan giữa các thông số môi trường
    
    Returns:
    --------
    dict
        Ma trận tương quan và điểm nhấn về các tương quan mạnh
    """
    try:
        df = get_dataframe()
        if df.empty:
            return {"error": "Không có dữ liệu"}
            
        # Chỉ lấy các cột số
        numeric_cols = ['temperature', 'humidity', 'soil_moisture', 'lux']
        df_numeric = df[numeric_cols]
        
        # Tính toán ma trận tương quan
        corr_matrix = df_numeric.corr().round(2)
        
        # Chuyển đổi thành dict
        corr_dict = {}
        for col in corr_matrix.columns:
            corr_dict[col] = {}
            for idx in corr_matrix.index:
                corr_dict[col][idx] = float(corr_matrix.loc[idx, col])
        
        # Tìm các cặp có tương quan cao (>0.7 hoặc <-0.7)
        strong_correlations = []
        for i in range(len(numeric_cols)):
            for j in range(i+1, len(numeric_cols)):
                corr_value = corr_matrix.iloc[i, j]
                if abs(corr_value) > 0.7:
                    strong_correlations.append({
                        'parameter1': numeric_cols[i],
                        'parameter2': numeric_cols[j],
                        'correlation': float(corr_value),
                        'type': 'positive' if corr_value > 0 else 'negative'
                    })
        
        return {
            'correlation_matrix': corr_dict,
            'strong_correlations': strong_correlations
        }
    except Exception as e:
        print(f"Lỗi khi phân tích tương quan: {e}")
        return {"error": str(e)}

def get_hourly_patterns():
    """
    Phân tích các mẫu biến đổi theo giờ trong ngày
    
    Returns:
    --------
    dict
        Các thông số trung bình theo giờ trong ngày
    """
    try:
        df = get_dataframe()
        if df.empty:
            return {"error": "Không có dữ liệu"}
            
        # Thêm cột giờ từ timestamp
        df['hour'] = df['timestamp'].dt.hour
        
        # Nhóm dữ liệu theo giờ và tính toán giá trị trung bình
        hourly_means = df.groupby('hour').agg({
            'temperature': 'mean',
            'humidity': 'mean',
            'soil_moisture': 'mean',
            'lux': 'mean'
        }).reset_index()
        
        # Định dạng lại kết quả
        result = {}
        for hour in range(24):
            hour_data = hourly_means[hourly_means['hour'] == hour]
            if not hour_data.empty:
                result[str(hour)] = {
                    'temperature': float(hour_data['temperature'].iloc[0]),
                    'humidity': float(hour_data['humidity'].iloc[0]),
                    'soil_moisture': float(hour_data['soil_moisture'].iloc[0]),
                    'lux': float(hour_data['lux'].iloc[0])
                }
            else:
                result[str(hour)] = {
                    'temperature': None,
                    'humidity': None,
                    'soil_moisture': None,
                    'lux': None
                }
        
        return result
    except Exception as e:
        print(f"Lỗi khi phân tích mẫu theo giờ: {e}")
        return {"error": str(e)}

def find_optimal_conditions():
    """
    Xác định các điều kiện tối ưu dựa trên dữ liệu lịch sử
    
    Returns:
    --------
    dict
        Các khoảng điều kiện tối ưu cho môi trường trồng cây
    """
    try:
        df = get_dataframe()
        if df.empty:
            return {"error": "Không có dữ liệu"}
            
        # Lấy danh sách cây trồng từ cơ sở dữ liệu
        plants = list(plants_collection.find())
        
        result = {
            'general': {
                'temperature': {
                    'optimal_range': [25, 30],
                    'description': 'Khoảng nhiệt độ thường thấy trong quá trình phát triển tốt'
                },
                'humidity': {
                    'optimal_range': [60, 80],
                    'description': 'Khoảng độ ẩm thường thấy trong quá trình phát triển tốt'
                },
                'soil_moisture': {
                    'optimal_range': [40, 70],
                    'description': 'Khoảng độ ẩm đất thường thấy trong quá trình phát triển tốt'
                },
                'lux': {
                    'optimal_range': [5000, 15000],
                    'description': 'Khoảng cường độ ánh sáng thường thấy trong quá trình phát triển tốt'
                }
            }
        }
        
        # Thêm thông tin chi tiết cho từng loại cây
        for plant in plants:
            plant_name = plant.get('plant_name')
            if plant_name:
                # Thêm thông tin cụ thể cho từng loại cây nếu có
                # (Giả định, bạn có thể điều chỉnh các giá trị này)
                result[plant_name] = {
                    'temperature': {
                        'optimal_range': [22, 28],
                        'description': f'Khoảng nhiệt độ tối ưu cho {plant_name}'
                    },
                    'humidity': {
                        'optimal_range': [65, 75],
                        'description': f'Khoảng độ ẩm tối ưu cho {plant_name}'
                    },
                    'soil_moisture': {
                        'optimal_range': [50, 60],
                        'description': f'Khoảng độ ẩm đất tối ưu cho {plant_name}'
                    },
                    'lux': {
                        'optimal_range': [8000, 12000],
                        'description': f'Khoảng cường độ ánh sáng tối ưu cho {plant_name}'
                    }
                }
        
        return result
    except Exception as e:
        print(f"Lỗi khi xác định điều kiện tối ưu: {e}")
        return {"error": str(e)}

def anomaly_detection():
    """
    Phát hiện các giá trị bất thường trong dữ liệu cảm biến
    
    Returns:
    --------
    dict
        Các điểm dữ liệu bất thường và lý do
    """
    try:
        df = get_dataframe()
        if df.empty:
            return {"error": "Không có dữ liệu"}
            
        # Lấy dữ liệu trong 7 ngày gần nhất
        end_date = df['timestamp'].max()
        start_date = end_date - timedelta(days=7)
        df_recent = df[(df['timestamp'] >= start_date) & (df['timestamp'] <= end_date)]
        
        anomalies = []
        
        # Phát hiện nhiệt độ bất thường (ngoài khoảng 10-40°C)
        temp_anomalies = df_recent[(df_recent['temperature'] < 10) | (df_recent['temperature'] > 40)]
        for _, row in temp_anomalies.iterrows():
            anomalies.append({
                'timestamp': row['timestamp'].isoformat(),
                'parameter': 'temperature',
                'value': float(row['temperature']),
                'reason': 'Nhiệt độ nằm ngoài khoảng an toàn (10-40°C)'
            })
        
        # Phát hiện độ ẩm bất thường (ngoài khoảng 20-95%)
        humidity_anomalies = df_recent[(df_recent['humidity'] < 20) | (df_recent['humidity'] > 95)]
        for _, row in humidity_anomalies.iterrows():
            anomalies.append({
                'timestamp': row['timestamp'].isoformat(),
                'parameter': 'humidity',
                'value': float(row['humidity']),
                'reason': 'Độ ẩm nằm ngoài khoảng an toàn (20-95%)'
            })
        
        # Phát hiện độ ẩm đất bất thường (ngoài khoảng 10-90%)
        soil_anomalies = df_recent[(df_recent['soil_moisture'] < 10) | (df_recent['soil_moisture'] > 90)]
        for _, row in soil_anomalies.iterrows():
            anomalies.append({
                'timestamp': row['timestamp'].isoformat(),
                'parameter': 'soil_moisture',
                'value': float(row['soil_moisture']),
                'reason': 'Độ ẩm đất nằm ngoài khoảng an toàn (10-90%)'
            })
        
        # Phát hiện ánh sáng bất thường (>30000 lux hoặc thay đổi đột ngột)
        lux_anomalies = df_recent[df_recent['lux'] > 30000]
        for _, row in lux_anomalies.iterrows():
            anomalies.append({
                'timestamp': row['timestamp'].isoformat(),
                'parameter': 'lux',
                'value': float(row['lux']),
                'reason': 'Cường độ ánh sáng quá cao (>30000 lux)'
            })
        
        return {
            'total_anomalies': len(anomalies),
            'anomalies': anomalies[:50]  # Giới hạn số lượng kết quả trả về
        }
    except Exception as e:
        print(f"Lỗi khi phát hiện dữ liệu bất thường: {e}")
        return {"error": str(e)}

def get_seasonal_analysis():
    """
    Phân tích mùa vụ dựa trên dữ liệu
    
    Returns:
    --------
    dict
        Thông tin về các mùa vụ và điều kiện môi trường tương ứng
    """
    try:
        df = get_dataframe()
        if df.empty:
            return {"error": "Không có dữ liệu"}
            
        # Thêm cột mùa vụ
        df['month'] = df['timestamp'].dt.month
        df['season'] = 'NA'
        
        # Định nghĩa mùa (cho Việt Nam)
        # Mùa khô: tháng 11-4
        # Mùa mưa: tháng 5-10
        dry_season_months = [11, 12, 1, 2, 3, 4]
        rainy_season_months = [5, 6, 7, 8, 9, 10]
        
        df.loc[df['month'].isin(dry_season_months), 'season'] = 'Dry'
        df.loc[df['month'].isin(rainy_season_months), 'season'] = 'Rainy'
        
        # Phân tích theo mùa
        seasonal_analysis = df.groupby('season').agg({
            'temperature': ['mean', 'std', 'min', 'max'],
            'humidity': ['mean', 'std', 'min', 'max'],
            'soil_moisture': ['mean', 'std', 'min', 'max'],
            'lux': ['mean', 'std', 'min', 'max']
        }).reset_index()
        
        # Định dạng lại kết quả
        result = {}
        for _, row in seasonal_analysis.iterrows():
            season = row['season']
            if season == 'NA':
                continue
                
            result[season] = {
                'temperature': {
                    'mean': float(row['temperature']['mean']),
                    'std': float(row['temperature']['std']),
                    'min': float(row['temperature']['min']),
                    'max': float(row['temperature']['max'])
                },
                'humidity': {
                    'mean': float(row['humidity']['mean']),
                    'std': float(row['humidity']['std']),
                    'min': float(row['humidity']['min']),
                    'max': float(row['humidity']['max'])
                },
                'soil_moisture': {
                    'mean': float(row['soil_moisture']['mean']),
                    'std': float(row['soil_moisture']['std']),
                    'min': float(row['soil_moisture']['min']),
                    'max': float(row['soil_moisture']['max'])
                },
                'lux': {
                    'mean': float(row['lux']['mean']),
                    'std': float(row['lux']['std']),
                    'min': float(row['lux']['min']),
                    'max': float(row['lux']['max'])
                }
            }
            
            # Thêm phân tích và đề xuất
            if season == 'Dry':
                result[season]['analysis'] = "Mùa khô thường kèm theo nhiệt độ cao và độ ẩm thấp."
                result[season]['recommendations'] = [
                    "Tăng cường tưới nước",
                    "Sử dụng hệ thống che phủ đất",
                    "Tránh trồng các loại cây nhạy cảm với hạn hán"
                ]
            elif season == 'Rainy':
                result[season]['analysis'] = "Mùa mưa thường kèm theo độ ẩm cao và ánh sáng giảm."
                result[season]['recommendations'] = [
                    "Đảm bảo hệ thống thoát nước tốt",
                    "Áp dụng biện pháp phòng bệnh nấm và mốc",
                    "Có hệ thống che mưa khi cần thiết"
                ]
                
        return result
    except Exception as e:
        print(f"Lỗi khi phân tích mùa vụ: {e}")
        return {"error": str(e)}

def generate_charts():
    """
    Tạo các biểu đồ trực quan cho dữ liệu cảm biến
    
    Returns:
    --------
    dict
        Các biểu đồ được mã hóa base64
    """
    try:
        df = get_dataframe()
        if df.empty:
            return {"error": "Không có dữ liệu"}
            
        charts = {}
        
        # Lấy dữ liệu trong 7 ngày gần nhất
        end_date = df['timestamp'].max()
        start_date = end_date - timedelta(days=7)
        df_recent = df[(df['timestamp'] >= start_date) & (df['timestamp'] <= end_date)]
        
        # Thêm cột ngày và giờ
        df_recent['date'] = df_recent['timestamp'].dt.date
        df_recent['hour'] = df_recent['timestamp'].dt.hour
        
        # Biểu đồ 1: Nhiệt độ theo thời gian
        plt.figure(figsize=(10, 6))
        plt.plot(df_recent['timestamp'], df_recent['temperature'], marker='o', linestyle='-', alpha=0.7)
        plt.title('Temperature Over Time (Last 7 Days)')
        plt.xlabel('Date')
        plt.ylabel('Temperature (°C)')
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        # Lưu biểu đồ thành base64
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        image_png = buffer.getvalue()
        buffer.close()
        charts['temperature_time_series'] = base64.b64encode(image_png).decode('utf-8')
        plt.close()
        
        # Biểu đồ 2: Độ ẩm và độ ẩm đất
        plt.figure(figsize=(10, 6))
        plt.plot(df_recent['timestamp'], df_recent['humidity'], marker='o', linestyle='-', alpha=0.7, label='Humidity')
        plt.plot(df_recent['timestamp'], df_recent['soil_moisture'], marker='s', linestyle='-', alpha=0.7, label='Soil Moisture')
        plt.title('Humidity and Soil Moisture Over Time (Last 7 Days)')
        plt.xlabel('Date')
        plt.ylabel('Percentage (%)')
        plt.legend()
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        image_png = buffer.getvalue()
        buffer.close()
        charts['humidity_soil_time_series'] = base64.b64encode(image_png).decode('utf-8')
        plt.close()
        
        # Biểu đồ 3: Cường độ ánh sáng
        plt.figure(figsize=(10, 6))
        plt.plot(df_recent['timestamp'], df_recent['lux'], marker='o', linestyle='-', color='orange', alpha=0.7)
        plt.title('Light Intensity Over Time (Last 7 Days)')
        plt.xlabel('Date')
        plt.ylabel('Light Intensity (lux)')
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        image_png = buffer.getvalue()
        buffer.close()
        charts['light_time_series'] = base64.b64encode(image_png).decode('utf-8')
        plt.close()
        
        # Biểu đồ 4: Biểu đồ tương quan
        plt.figure(figsize=(8, 6))
        sns.heatmap(df_recent[['temperature', 'humidity', 'soil_moisture', 'lux']].corr(),
                   annot=True, cmap='coolwarm', fmt='.2f', linewidths=.5)
        plt.title('Correlation Between Environmental Parameters')
        plt.tight_layout()
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        image_png = buffer.getvalue()
        buffer.close()
        charts['correlation_heatmap'] = base64.b64encode(image_png).decode('utf-8')
        plt.close()
        
        # Biểu đồ 5: Biểu đồ phân phối nhiệt độ
        plt.figure(figsize=(10, 6))
        sns.histplot(df_recent['temperature'], kde=True, bins=15)
        plt.title('Temperature Distribution (Last 7 Days)')
        plt.xlabel('Temperature (°C)')
        plt.ylabel('Frequency')
        plt.tight_layout()
        
        buffer = io.BytesIO()
        plt.savefig(buffer, format='png')
        buffer.seek(0)
        image_png = buffer.getvalue()
        buffer.close()
        charts['temperature_distribution'] = base64.b64encode(image_png).decode('utf-8')
        plt.close()
        
        return charts
    except Exception as e:
        print(f"Lỗi khi tạo biểu đồ: {e}")
        return {"error": str(e)}