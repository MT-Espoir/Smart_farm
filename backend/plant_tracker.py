from datetime import datetime, timedelta
from pymongo import MongoClient
import os

class PlantTracker:
    def __init__(self, mongo_uri='mongodb://localhost:27017/', db_name='smartfarm'):
        """Khởi tạo với kết nối MongoDB thay vì file CSV"""
        # Kết nối với MongoDB
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.plants_collection = self.db.plants_tracking  # Tạo collection riêng cho plant_tracker
        
        # Tạo index cho các trường tìm kiếm thường xuyên
        self.plants_collection.create_index('plant_id')

    def add_plant(self, plant_name, growth_days, notes=""):
        """Thêm một cây mới vào hệ thống theo dõi"""
        try:
            # Lấy plant_id cao nhất hiện tại và tăng lên 1
            highest_plant = self.plants_collection.find_one(sort=[('plant_id', -1)])
            plant_id = 1  # Mặc định nếu chưa có cây nào
            
            if highest_plant and 'plant_id' in highest_plant:
                plant_id = highest_plant['plant_id'] + 1
            
            planting_date = datetime.now()
            expected_harvest_date = planting_date + timedelta(days=growth_days)

            new_plant = {
                'plant_id': plant_id,
                'plant_name': plant_name,
                'planting_date': planting_date,
                'expected_harvest_date': expected_harvest_date,
                'notes': notes,
                'status': 'growing'
            }

            result = self.plants_collection.insert_one(new_plant)
            return plant_id
        except Exception as e:
            print(f"Error adding plant: {str(e)}")
            return None

    def delete_plant(self, plant_id):
        """Xóa một cây khỏi hệ thống theo dõi"""
        try:
            result = self.plants_collection.delete_one({'plant_id': plant_id})
            return result.deleted_count > 0
        except Exception as e:
            print(f"Error deleting plant: {str(e)}")
            return False

    def get_plant_status(self, plant_id):
        """Lấy thông tin về tình trạng của cây"""
        plant = self.plants_collection.find_one({'plant_id': plant_id})

        if not plant:
            return "Không tìm thấy cây với ID này"

        planting_date = plant['planting_date']
        expected_harvest_date = plant['expected_harvest_date']
        current_date = datetime.now()

        days_since_planting = (current_date - planting_date).days
        days_until_harvest = (expected_harvest_date - current_date).days

        return {
            'plant_name': plant['plant_name'],
            'days_since_planting': days_since_planting,
            'days_until_harvest': days_until_harvest,
            'status': plant['status'],
            'notes': plant['notes']
        }

    def update_plant_status(self, plant_id, status, notes=None):
        """Cập nhật trạng thái của cây"""
        update_data = {'status': status}
        if notes:
            update_data['notes'] = notes

        result = self.plants_collection.update_one(
            {'plant_id': plant_id},
            {'$set': update_data}
        )
        return result.modified_count > 0

    def get_all_plants(self):
        """Lấy thông tin về tất cả các cây"""
        cursor = self.plants_collection.find({})
        plants = []
        for plant in cursor:
            # Chuyển ObjectId thành string để có thể serialize thành JSON
            plant['_id'] = str(plant['_id'])
            plants.append(plant)
        return plants

    def get_alerts(self):
        """Kiểm tra và trả về các cảnh báo cho cây cần chăm sóc"""
        current_date = datetime.now()
        alerts = []

        # Tìm tất cả cây chưa thu hoạch
        plants = self.plants_collection.find({'status': {'$ne': 'harvested'}})

        for plant in plants:
            planting_date = plant['planting_date']
            expected_harvest_date = plant['expected_harvest_date']

            days_until_harvest = (expected_harvest_date - current_date).days

            if days_until_harvest <= 7 and days_until_harvest >= 0:
                alerts.append({
                    'plant_id': plant['plant_id'],
                    'plant_name': plant['plant_name'],
                    'message': f"Cây {plant['plant_name']} sẽ sẵn sàng thu hoạch trong {days_until_harvest} ngày"
                })
            elif days_until_harvest < 0:
                alerts.append({
                    'plant_id': plant['plant_id'],
                    'plant_name': plant['plant_name'],
                    'message': f"Cây {plant['plant_name']} đã đến thời gian thu hoạch"
                })

        return alerts