import mysql.connector
from pymongo import MongoClient
from datetime import datetime

def convert_sql_to_mongodb():
    # Kết nối tới cơ sở dữ liệu MySQL/MariaDB
    sql_conn = mysql.connector.connect(
        host="localhost",
        user="root",  # Thay đổi nếu cần
        password="",  # Thay đổi nếu cần
        database="smartfarm"
    )
    sql_cursor = sql_conn.cursor(dictionary=True)
    
    # Kết nối tới MongoDB
    mongo_client = MongoClient("mongodb://localhost:27017/")
    mongo_db = mongo_client["smartfarm"]
    
    # 1. Chuyển đổi bảng device sang collection devices
    sql_cursor.execute("SELECT * FROM device")
    devices = sql_cursor.fetchall()
    
    if devices:
        mongo_db.devices.drop()  # Xóa collection nếu đã tồn tại
        mongo_db.devices.insert_many(devices)
        print(f"Chuyển {len(devices)} thiết bị thành công")
    
    # 2. Chuyển đổi bảng plant sang collection plants
    sql_cursor.execute("SELECT * FROM plant")
    plants = sql_cursor.fetchall()
    
    # Chuyển đổi chuỗi ngày thành đối tượng ngày trong MongoDB
    for plant in plants:
        plant["start_date"] = datetime.combine(plant["start_date"], datetime.min.time())
        plant["end_date"] = datetime.combine(plant["end_date"], datetime.min.time())
    
    if plants:
        mongo_db.plants.drop()
        mongo_db.plants.insert_many(plants)
        print(f"Chuyển {len(plants)} cây trồng thành công")
    
    # 3. Chuyển đổi bảng chat_messages sang collection chat_messages
    try:
        sql_cursor.execute("SELECT * FROM chat_messages")
        messages = sql_cursor.fetchall()
        
        if messages:
            mongo_db.chat_messages.drop()
            mongo_db.chat_messages.insert_many(messages)
            print(f"Chuyển {len(messages)} tin nhắn thành công")
    except mysql.connector.Error as err:
        print(f"Bảng chat_messages không tồn tại hoặc lỗi: {err}")
    
    # 4. Chuyển đổi bảng environmental_data sang collection environmental_data
    try:
        sql_cursor.execute("SELECT * FROM environmental_data")
        env_data = sql_cursor.fetchall()
        
        if env_data:
            mongo_db.environmental_data.drop()
            mongo_db.environmental_data.insert_many(env_data)
            print(f"Chuyển {len(env_data)} bản ghi dữ liệu môi trường thành công")
    except mysql.connector.Error as err:
        print(f"Bảng environmental_data không tồn tại hoặc lỗi: {err}")
    
    # Đóng kết nối
    sql_cursor.close()
    sql_conn.close()
    
    print("Hoàn thành chuyển đổi dữ liệu từ SQL sang MongoDB!")

if __name__ == "__main__":
    convert_sql_to_mongodb()