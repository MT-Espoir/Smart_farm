import pandas as pd
from datetime import datetime
import os

class PlantTracker:
    def __init__(self, file_path='Data/plant_records.csv'):
        self.file_path = file_path
        self.columns = ['plant_id', 'plant_name', 'planting_date', 'expected_harvest_date',
                        'notes', 'status']

        # Tạo file CSV nếu chưa tồn tại
        if not os.path.exists(file_path):
            df = pd.DataFrame(columns=self.columns)
            df.to_csv(file_path, index=False)

    def add_plant(self, plant_name, growth_days, notes=""):
        """Thêm một cây mới vào hệ thống theo dõi"""
        try:
            df = pd.read_csv(self.file_path)

            # Tạo ID mới
            plant_id = len(df) + 1
            planting_date = datetime.now()
            expected_harvest_date = planting_date + pd.Timedelta(days=growth_days)

            new_plant = pd.DataFrame([{
                'plant_id': plant_id,
                'plant_name': plant_name,
                'planting_date': planting_date.strftime('%Y-%m-%d %H:%M:%S'),
                'expected_harvest_date': expected_harvest_date.strftime('%Y-%m-%d %H:%M:%S'),
                'notes': notes,
                'status': 'growing'
            }])

            df = pd.concat([df, new_plant], ignore_index=True)
            df.to_csv(self.file_path, index=False)
            return plant_id
        except Exception as e:
            print(f"Error adding plant: {str(e)}")
            return None

    def delete_plant(self, plant_id):
        """Xóa một cây khỏi hệ thống theo dõi"""
        try:
            df = pd.read_csv(self.file_path)
            if plant_id not in df['plant_id'].values:
                return False

            df = df[df['plant_id'] != plant_id]
            df.to_csv(self.file_path, index=False)
            return True
        except Exception as e:
            print(f"Error deleting plant: {str(e)}")
            return False

    def get_plant_status(self, plant_id):
        """Lấy thông tin về tình trạng của cây"""
        df = pd.read_csv(self.file_path)
        plant = df[df['plant_id'] == plant_id]

        if plant.empty:
            return "Không tìm thấy cây với ID này"

        plant = plant.iloc[0]
        planting_date = pd.to_datetime(plant['planting_date'])
        expected_harvest_date = pd.to_datetime(plant['expected_harvest_date'])
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
        df = pd.read_csv(self.file_path)

        if plant_id not in df['plant_id'].values:
            return False

        mask = df['plant_id'] == plant_id
        df.loc[mask, 'status'] = status
        if notes:
            df.loc[mask, 'notes'] = notes

        df.to_csv(self.file_path, index=False)
        return True

    def get_all_plants(self):
        """Lấy thông tin về tất cả các cây"""
        df = pd.read_csv(self.file_path)
        return df.to_dict('records')

    def get_alerts(self):
        """Kiểm tra và trả về các cảnh báo cho cây cần chăm sóc"""
        df = pd.read_csv(self.file_path)
        current_date = datetime.now()
        alerts = []

        for _, plant in df.iterrows():
            if plant['status'] != 'harvested':
                planting_date = pd.to_datetime(plant['planting_date'])
                expected_harvest_date = pd.to_datetime(plant['expected_harvest_date'])

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