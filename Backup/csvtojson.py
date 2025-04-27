# import csv
# import json



# def  csvConnvert (csv_path, json_path):

#     jsonData = {}

#     with open(csv_path, encoding='utf-8') as csvfile:

#         csvData = csv.DictReader(csvfile)

#         for rows in csvData:
#              key = rows['timestamp']
#              jsonData[key] = rows

#     with open(json_path, 'w', encoding='utf-8') as jsonfile:
#         jsonfile.write(json.dumps(jsonData, indent=6))
#     print("Data Convert")

# csv_path = r'Data/sensor_data.csv'
# json_path = r'pythonJSON.json'

# csvConnvert(csv_path, json_path)


import csv
import json

def csvConvert(csv_path, json_path):
    jsonData = {}

    with open(csv_path, encoding='utf-8') as csvfile:
        csvData = list(csv.DictReader(csvfile))  # Đọc toàn bộ dữ liệu vào danh sách
        
        # Lấy 6 hàng dữ liệu gần nhất (cuối danh sách)
        last_6_rows = csvData[-6:]

        # Chuyển đổi dữ liệu sang JSON với timestamp làm key
        for row in last_6_rows:
            key = row['timestamp']
            jsonData[key] = row

    # Ghi dữ liệu JSON vào file
    with open(json_path, 'w', encoding='utf-8') as jsonfile:
        json.dump(jsonData, jsonfile, indent=6, ensure_ascii=False)

    print("Data Converted - Only last 6 rows saved")

# Đường dẫn file CSV và JSON
csv_path = r'Data/sensor_data.csv'
json_path = r'pythonJSON.json'

csvConvert(csv_path, json_path)
