import subprocess
import time
import os
from pymongo import MongoClient

def start_mongo():
    """Khởi động MongoDB nếu chưa chạy"""
    print("Đang kiểm tra MongoDB...")
    try:
        # Thử kết nối đến MongoDB
        client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
        client.server_info()  # Sẽ gây lỗi nếu không kết nối được
        print("MongoDB đang chạy!")
        return True
    except Exception as e:
        print("MongoDB chưa chạy. Đang cố gắng khởi động...")
        try:
            # Thử khởi động MongoDB tự động - cần điều chỉnh đường dẫn
            # Nếu MongoDB được cài đặt như một dịch vụ, có thể cần quyền admin
            subprocess.Popen(["mongod"], shell=True)
            time.sleep(5)  # Đợi MongoDB khởi động
            
            # Kiểm tra lại kết nối
            client = MongoClient("mongodb://localhost:27017/", serverSelectionTimeoutMS=2000)
            client.server_info()
            print("MongoDB đã được khởi động thành công!")
            return True
        except Exception as e:
            print(f"Không thể khởi động MongoDB tự động: {str(e)}")
            print("Vui lòng khởi động MongoDB thủ công và chạy lại script này.")
            return False

def run_mongo_schema():
    """Chạy file mongo_schema.js để tạo cấu trúc cơ sở dữ liệu"""
    schema_path = os.path.join("backend", "mongo_schema.js")
    try:
        print("Đang áp dụng schema MongoDB...")
        # Thử sử dụng mongosh trước
        try:
            cmd = f"mongosh --quiet --file {schema_path}"
            process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, stderr = process.communicate()
            
            if process.returncode == 0:
                print("Schema MongoDB đã được áp dụng thành công sử dụng mongosh!")
                return True
            else:
                print(f"Lỗi khi sử dụng mongosh: {stderr.decode()}")
                print("Đang thử phương pháp thay thế...")
        except Exception as e:
            print(f"Không thể sử dụng mongosh: {str(e)}")
            print("Đang thử phương pháp thay thế...")
        
        # Phương pháp thay thế: Sử dụng mongo shell cũ (nếu có)
        try:
            cmd = f"mongo --quiet {schema_path}"
            process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            stdout, stderr = process.communicate()
            
            if process.returncode == 0:
                print("Schema MongoDB đã được áp dụng thành công sử dụng mongo shell cũ!")
                return True
            else:
                print(f"Lỗi khi sử dụng mongo shell cũ: {stderr.decode()}")
        except Exception as e:
            print(f"Không thể sử dụng mongo shell cũ: {str(e)}")
        
        # Phương pháp thay thế cuối cùng: sử dụng pymongo để áp dụng schema
        print("Đang áp dụng schema bằng pymongo trực tiếp...")
        apply_schema_with_pymongo(schema_path)
        print("Schema MongoDB đã được áp dụng thành công sử dụng pymongo!")
        return True
        
    except Exception as e:
        print(f"Lỗi khi áp dụng schema: {str(e)}")
        return False

def apply_schema_with_pymongo(schema_path):
    """Áp dụng schema bằng pymongo thay vì mongosh"""
    client = MongoClient("mongodb://localhost:27017/")
    db = client.smartfarm
    
    # Tạo các collections
    if "devices" not in db.list_collection_names():
        db.create_collection("devices")
    if "plants" not in db.list_collection_names():
        db.create_collection("plants")
    if "chat_messages" not in db.list_collection_names():
        db.create_collection("chat_messages")
    if "environmental_data" not in db.list_collection_names():
        db.create_collection("environmental_data")
    
    # Tạo các index
    db.devices.create_index("device_name", unique=True)
    db.plants.create_index("plant_name")
    db.environmental_data.create_index("timestamp")
    db.chat_messages.create_index("timestamp")
    
    print("Đã tạo collections và indexes trong MongoDB")

def migrate_data():
    """Chạy script chuyển đổi dữ liệu từ SQL sang MongoDB"""
    try:
        print("Đang chuyển đổi dữ liệu từ SQL sang MongoDB...")
        from sql_to_mongodb import convert_sql_to_mongodb
        convert_sql_to_mongodb()
        return True
    except Exception as e:
        print(f"Lỗi khi chuyển đổi dữ liệu: {str(e)}")
        return False

def run_all():
    """Chạy toàn bộ quá trình cài đặt"""
    # Bước 1: Kiểm tra và khởi động MongoDB
    if not start_mongo():
        return
    
    # Bước 2: Áp dụng schema MongoDB
    if not run_mongo_schema():
        return
    
    # Bước 3: Chuyển đổi dữ liệu
    if not migrate_data():
        return
    
    print("\n" + "="*50)
    print("CHUYỂN ĐỔI THÀNH CÔNG!")
    print("Hệ thống đã được chuyển từ SQL sang MongoDB.")
    print("Bạn có thể khởi động server với lệnh 'node backend/server.js' để sử dụng hệ thống mới.")
    print("="*50)

if __name__ == "__main__":
    run_all()