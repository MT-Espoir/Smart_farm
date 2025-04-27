#include <Adafruit_NeoPixel.h>
#include "DHT20.h"
#include "LiquidCrystal_I2C.h"
#include <Arduino.h>
#include "SoftServo.h"
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>

// GPIO Pins
#define LED_PIN 5     // Chân điều khiển đèn LED
#define FAN_PIN 17    // Chân điều khiển quạt
#define PUMP_PIN 18   // Chân điều khiển bơm (đã khai báo là D9)
#define SERVO_PIN 2   // Chân điều khiển servo (rotor)
#define SOIL_PIN A2   // Chân cảm biến độ ẩm đất
#define LUX_PIN A0    // Chân cảm biến ánh sáng
#define RAIN_PIN A6   // Chân cảm biến mưa

LiquidCrystal_I2C lcd(0x21, 16, 2);
DHT20 DHT;
SoftServo myservo;
WiFiClient espClient;
PubSubClient client(espClient);

// Thời gian
unsigned long lastimageTime = 0;
unsigned long lastSensorTime = 0;             // Lần cập nhật cảm biến gần nhất
unsigned long lastMQTTTime = 0;               // Lần cập nhật MQTT gần nhất
unsigned long lastHTTPTime = 0;               // Lần cập nhật HTTP gần nhất
const unsigned long sensorInterval = 15000;    // Cập nhật cảm biến mỗi 5000ms (5s)
const unsigned long mqttInterval = 5000;      // Cập nhật MQTT mỗi 1000ms (1s)
const unsigned long httpInterval = 10000;     // Cập nhật HTTP mỗi 10000ms (10s)
const unsigned long imageInterval = 10000;    // Cập nhật ảnh mỗi 10000ms (10s)

// Kết nối
constexpr char WIFI_SSID[] = "ACLAB";
constexpr char WIFI_PASSWORD[] = "ACLAB2023";
const char* mqtt_server = "test.mosquitto.org";
const char* server_url = "http://localhost:5000/api/sensor_data";

// Trạng thái thiết bị
bool pump_status = false;
bool fan_status = false;
bool led_status = false;
int servo_angle = 0;
int previousSoilMoistureValue = -1;
int previousLuxValue = -1;
int pumpCount = 0;

// Định nghĩa MQTT Topics
const char* TOPIC_PUMP = "yolouno/pump";
const char* TOPIC_FAN = "yolouno/fan";
const char* TOPIC_LED = "yolouno/led";
const char* TOPIC_COVER = "yolouno/cover";
const char* TOPIC_COMMAND = "yolouno/command";
const char* TOPIC_SENSOR_DATA = "yolouno/sensor_data";

void setup() {
  // Khởi tạo Serial Monitor
  Serial.begin(115200);
  Serial.println("Starting SmartFarm ESP32-S3 controller...");
  
  // Kết nối WiFi
  connectToWifi();
  
  // Khởi tạo LCD
  lcd.init();
  lcd.backlight();
  lcd.clear();
  
  lcd.setCursor(0, 0);
  lcd.print("SmartFarm System");
  lcd.setCursor(0, 1);
  lcd.print("Initializing...");
  delay(2000);
  
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("T:");
  lcd.setCursor(8, 0);
  lcd.print("H:");
  lcd.setCursor(0, 1);
  lcd.print("M:");
  lcd.setCursor(8, 1);
  lcd.print("L:");

  // Khởi tạo cảm biến DHT20
  DHT.begin();
  
  // Thiết lập chân cảm biến
  pinMode(SOIL_PIN, INPUT);
  pinMode(LUX_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT);
  
  // Thiết lập chân đầu ra
  pinMode(LED_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);
  pinMode(PUMP_PIN, OUTPUT);
  
  // Khởi tạo trạng thái ban đầu
  digitalWrite(LED_PIN, LOW);  // TẮT đèn
  digitalWrite(FAN_PIN, LOW);  // TẮT quạt
  digitalWrite(PUMP_PIN, LOW); // TẮT bơm
  
  // Khởi tạo servo (rotor)
  myservo.attach(SERVO_PIN);
  myservo.asyncMode();
  myservo.delayMode();
  myservo.tick();
  myservo.write(0);  // Vị trí ban đầu: mở hoàn toàn

  // MQTT setup
  client.setServer(mqtt_server, 1883);
  client.setCallback(callback);
  
  Serial.println("Setup complete!");
}

// Hàm kết nối WiFi
void connectToWifi() {
  Serial.println("Connecting to AP ...");
  // Attempting to establish a connection to the given WiFi network
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    // Delay 500ms until a connection has been successfully established
    delay(500);
    Serial.print(".");
  }
  Serial.println("Connected to AP");
}

// Hàm đọc và hiển thị nhiệt độ, độ ẩm từ DHT20
void temperature() {
  float temp = DHT.getTemperature();
  float hum = DHT.getHumidity();
  
  lcd.setCursor(2, 0);
  lcd.print("     ");  // Xóa giá trị cũ
  lcd.setCursor(2, 0);
  lcd.print(temp, 1);
  
  lcd.setCursor(10, 0);
  lcd.print("     ");  // Xóa giá trị cũ
  lcd.setCursor(10, 0);
  lcd.print(hum, 1);
}

// Hàm đọc độ ẩm đất
int soilMoisture() {
  int rawValue = analogRead(SOIL_PIN);
  int soilMoistureValue = map(rawValue, 0, 4095, 0, 100);
  
  if (soilMoistureValue != previousSoilMoistureValue) {
    lcd.setCursor(3, 1);
    lcd.print("     ");  // Xóa giá trị cũ
    lcd.setCursor(3, 1);
    lcd.print(soilMoistureValue, 1);
    previousSoilMoistureValue = soilMoistureValue;
  }
  return soilMoistureValue;
}

// Hàm đọc giá trị ánh sáng từ cảm biến
int luxSensor() {
  int luxValue = analogRead(LUX_PIN);
  if (luxValue != previousLuxValue) {
    lcd.setCursor(11, 1);
    lcd.print("       ");  // Xóa giá trị cũ
    lcd.setCursor(11, 1);
    lcd.print(luxValue);
    previousLuxValue = luxValue;
  }  
  return luxValue;
}

// Hàm điều khiển bơm nước
void pumpControl(bool status) {
  pump_status = status;
  if (status) {
    digitalWrite(PUMP_PIN, HIGH);  // Bật bơm
    pumpCount = 1;
    Serial.println("Pump: ON");
  } else {
    digitalWrite(PUMP_PIN, LOW);   // Tắt bơm
    pumpCount = 0;
    Serial.println("Pump: OFF");
  }
}

// Hàm điều khiển quạt
void fanControl(bool status) {
  fan_status = status;
  if (status) {
    digitalWrite(FAN_PIN, HIGH);  // Bật quạt
    Serial.println("Fan: ON");
  } else {
    digitalWrite(FAN_PIN, LOW);   // Tắt quạt
    Serial.println("Fan: OFF");
  }
}

// Hàm điều khiển đèn LED
void ledControl(bool status) {
  led_status = status;
  if (status) {
    digitalWrite(LED_PIN, HIGH);  // Bật đèn
    Serial.println("LED: ON");
  } else {
    digitalWrite(LED_PIN, LOW);   // Tắt đèn
    Serial.println("LED: OFF");
  }
}

// Hàm điều khiển servo (mái che)
void coverControl(int position) {  
  // position 0-100 -> 0-180 degrees
  servo_angle = map(position, 0, 100, 0, 180);
  myservo.tick();
  myservo.write(servo_angle);
  Serial.print("Cover position: ");
  Serial.println(servo_angle);
}

// Hàm tự động điều khiển bơm nước dựa vào độ ẩm đất
void autoIrrigation(int soilMoistureValue) {
  // Chỉ tự động nếu không có lệnh điều khiển từ web
  if (soilMoistureValue > 80) {
    // Tắt bơm khi đất đủ ẩm
    if (pump_status) {
      pumpControl(false);
      publishPumpStatus();
    }
  }
  if (soilMoistureValue < 30) {
    // Bật bơm khi đất quá khô
    if (!pump_status) {
      pumpControl(true);
      publishPumpStatus();
    }
  }
}

// Hàm tự động điều khiển mái che dựa trên ánh sáng và mưa
void autoRoofControl(int luxValue, int soilMoistureValue) {
  bool rain_detected = digitalRead(RAIN_PIN) == HIGH;
  
  // Ưu tiên 1: Nếu có mưa và độ ẩm đất cao, đóng mái che
  if (rain_detected && soilMoistureValue >= 90) {
    coverControl(100);  // Đóng hoàn toàn (100%)
    Serial.println("Rain detected & high soil moisture. Closing roof.");
    return;
  }
  
  // Ưu tiên 2: Điều chỉnh theo ánh sáng
  if (luxValue < 3000) {
    coverControl(0);  // Mở hoàn toàn (0%)
  } 
  else if (luxValue >= 3000 && luxValue <= 10000) {
    int cover_pos = map(luxValue, 3000, 10000, 0, 100);
    coverControl(cover_pos);  // Điều chỉnh theo ánh sáng
  } 
  else if (luxValue > 10000) {
    coverControl(100);  // Đóng hoàn toàn (100%)
  }
}

// Hàm xử lý tin nhắn MQTT
void callback(char* topic, byte* payload, unsigned int length) {
  payload[length] = '\0';
  String message = String((char*)payload);
  
  Serial.print("Message arrived on topic: ");
  Serial.print(topic);
  Serial.print(". Message: ");
  Serial.println(message);

  if (String(topic) == TOPIC_PUMP) {
    if (message == "ON" || message == "on" || message == "pump_on") {
      pumpControl(true);
    } else if (message == "OFF" || message == "off" || message == "pump_off") {
      pumpControl(false);
    }
  }
  else if (String(topic) == TOPIC_FAN) {
    if (message == "ON" || message == "on") {
      fanControl(true);
    } else if (message == "OFF" || message == "off") {
      fanControl(false);
    }
  }
  else if (String(topic) == TOPIC_LED) {
    if (message == "ON" || message == "on") {
      ledControl(true);
    } else if (message == "OFF" || message == "off") {
      ledControl(false);
    }
  }
  else if (String(topic) == TOPIC_COVER) {
    // Nhận giá trị 0-100 cho vị trí mái che
    int position = message.toInt();
    coverControl(position);
  }
  else if (String(topic) == TOPIC_COMMAND) {
    // Xử lý các lệnh chung
    if (message == "REBOOT" || message == "reboot") {
      ESP.restart();
    }
    else if (message == "STATUS" || message == "status") {
      publishAllStatus();
    }
  }
}

// Kết nối lại MQTT nếu bị mất kết nối
void reconnect() {
  int attempts = 0;
  while (!client.connected() && attempts < 3) {  // Giới hạn số lần thử
    Serial.print("Đang kết nối MQTT...");
    String clientId = "ESP32_SmartFarm_";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str())) {
      Serial.println("Đã kết nối!");
      
      // Đăng ký lắng nghe các chủ đề
      client.subscribe(TOPIC_PUMP);
      client.subscribe(TOPIC_FAN);
      client.subscribe(TOPIC_LED);
      client.subscribe(TOPIC_COVER);
      client.subscribe(TOPIC_COMMAND);
      
      // Gửi trạng thái hiện tại sau khi kết nối lại
      publishAllStatus();
    } else {
      Serial.print("Thất bại, rc=");
      Serial.print(client.state());
      Serial.println(" thử lại sau 2s");
      delay(2000);
      attempts++;
    }
  }
}

// Gửi dữ liệu cảm biến qua MQTT
void publishSensorData(float temp, float humidity, int soil, int lux) {
  if (!client.connected()) return;
  
  // Tạo JSON string
  StaticJsonDocument<200> doc;
  doc["temperature"] = temp;
  doc["humidity"] = humidity;
  doc["soil_moisture"] = soil;
  doc["lux"] = lux;
  doc["timestamp"] = millis();
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  // Gửi dữ liệu
  client.publish(TOPIC_SENSOR_DATA, buffer, false);
}

// Gửi trạng thái bơm qua MQTT
void publishPumpStatus() {
  if (!client.connected()) return;
  client.publish(TOPIC_PUMP, pump_status ? "ON" : "OFF");
}

// Gửi trạng thái quạt qua MQTT
void publishFanStatus() {
  if (!client.connected()) return;
  client.publish(TOPIC_FAN, fan_status ? "ON" : "OFF");
}

// Gửi trạng thái đèn qua MQTT
void publishLedStatus() {
  if (!client.connected()) return;
  client.publish(TOPIC_LED, led_status ? "ON" : "OFF");
}

// Gửi trạng thái mái che qua MQTT
void publishCoverStatus() {
  if (!client.connected()) return;
  char buffer[10];
  int position = map(servo_angle, 0, 180, 0, 100);
  itoa(position, buffer, 10);
  client.publish(TOPIC_COVER, buffer);
}

// Gửi tất cả trạng thái qua MQTT
void publishAllStatus() {
  publishPumpStatus();
  publishFanStatus();
  publishLedStatus();
  publishCoverStatus();
}

// Gửi dữ liệu lên HTTP server
void sendDataToServer(float temp, float humidity, int soil, int lux) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  http.begin(server_url);
  http.addHeader("Content-Type", "application/json");
  
  // Tạo JSON string
  StaticJsonDocument<200> doc;
  doc["temperature"] = temp;
  doc["humidity"] = humidity;
  doc["soil_moisture"] = soil;
  doc["lux"] = lux;
  doc["pump_status"] = pump_status ? 1 : 0;
  
  char buffer[256];
  serializeJson(doc, buffer);
  
  // Gửi POST request
  int httpResponseCode = http.POST(buffer);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    Serial.println("HTTP Response: " + response);
  } else {
    Serial.print("HTTP Error: ");
    Serial.println(httpResponseCode);
  }
  
  http.end();
}

// Kiểm tra trạng thái thiết bị từ server
void checkDeviceStatus() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  http.begin("http://localhost:5001/api/devices");
  
  int httpCode = http.GET();
  if (httpCode > 0) {
    String payload = http.getString();
    
    // Parse JSON response
    DynamicJsonDocument doc(1024);
    deserializeJson(doc, payload);
    
    // Kiểm tra từng thiết bị và cập nhật trạng thái
    for (JsonVariant device : doc.as<JsonArray>()) {
      String name = device["device_name"].as<String>();
      String state = device["state"].as<String>();
      bool isActive = (state == "active");
      
      if (name == "pump" && pump_status != isActive) {
        pumpControl(isActive);
      }
      else if (name == "fan" && fan_status != isActive) {
        fanControl(isActive);
      }
      else if (name == "led" && led_status != isActive) {
        ledControl(isActive);
      }
      else if (name == "cover" && isActive != (servo_angle > 90)) {
        coverControl(isActive ? 100 : 0);
      }
    }
  }
  
  http.end();
}

void loop() {
  unsigned long currentMillis = millis();
    
  // Cập nhật kết nối MQTT
  if (currentMillis - lastMQTTTime >= mqttInterval) {
    lastMQTTTime = currentMillis;
    
    if (WiFi.status() == WL_CONNECTED) {
      if (!client.connected()) {
        reconnect();
      }
      client.loop();  // Xử lý tin nhắn MQTT
    }
  }

  // Cập nhật cảm biến và điều khiển
  if (currentMillis - lastSensorTime >= sensorInterval) {
    lastSensorTime = currentMillis;
    
    // Đọc dữ liệu từ cảm biến
    DHT.read();
    float temp = DHT.getTemperature();
    float hum = DHT.getHumidity();
    temperature();
    
    int soilMoistureValue = soilMoisture();
    int luxValue = luxSensor();

    // Điều khiển tự động
    autoIrrigation(soilMoistureValue);
    autoRoofControl(luxValue, soilMoistureValue);

    // In thông tin ra Serial Monitor
    Serial.print("Temp: ");
    Serial.print(temp);
    Serial.print("°C, Hum: ");
    Serial.print(hum);
    Serial.print("%, Soil: ");
    Serial.print(soilMoistureValue);
    Serial.print("%, Light: ");
    Serial.print(luxValue);
    Serial.print(", Pump: ");
    Serial.println(pump_status ? "ON" : "OFF");
    
    // Gửi dữ liệu qua MQTT nếu đã kết nối
    if (client.connected()) {
      publishSensorData(temp, hum, soilMoistureValue, luxValue);
    }
  }
  
  // Cập nhật HTTP mỗi 10 giây
  if (currentMillis - lastHTTPTime >= httpInterval) {
    lastHTTPTime = currentMillis;
    
    if (WiFi.status() == WL_CONNECTED) {
      // Gửi dữ liệu lên server
      sendDataToServer(DHT.getTemperature(), DHT.getHumidity(), previousSoilMoistureValue, previousLuxValue);
      
      // Kiểm tra trạng thái thiết bị từ server
      checkDeviceStatus();
    }
  }
  
  // Cập nhật servo liên tục
  myservo.tick();
}