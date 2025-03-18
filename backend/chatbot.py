import os
import sys
import pickle
import numpy as np
import tensorflow as tf

# Add the path to your model directory
sys.path.append(os.path.join(os.path.dirname(__file__), 'Data', ))
responses = {}
# Import functions from your chatbot module
try:
    from underthesea import word_tokenize
except ImportError:
    print("Warning: underthesea package not found. Please install it using: pip install underthesea")
    def word_tokenize(text):
        return text.split()

class ChatbotService:
    def __init__(self):
        model_dir = os.path.join(os.path.dirname(__file__), 'Data',)
        self.model_path = os.path.join(model_dir, 'chatbotmodel.keras')
        self.label_encoder_path = os.path.join(model_dir, 'label_encoder.pkl')
        self.tokenizer_path = os.path.join(model_dir, 'tokenizer.pkl')
        
        # Load model and related files
        self.load_model()
        
        # Connect to database for dynamic responses
        self.db_connected = False
        
    def load_model(self):
        try:
            # Load model
            self.model = tf.keras.models.load_model(self.model_path)
            
            # Load label encoder
            with open(self.label_encoder_path, "rb") as file:
                self.label_encoder = pickle.load(file)
                
            # Load tokenizer
            with open(self.tokenizer_path, "rb") as file:
                self.tokenizer = pickle.load(file)
                
            # Load responses
            model_dir = os.path.join(os.path.dirname(__file__), 'Data')
            with open(os.path.join(model_dir, "intents.json"), "r", encoding="utf-8") as file:
                import json
                data = json.load(file)
                
            # Extract responses
            self.responses = {}
            for category in data["sections"].values():
                for intent in category:
                    self.responses[intent["tag"]] = intent["responses"]
                    
            print("Chatbot model loaded successfully")
            return True
        except Exception as e:
            print(f"Error loading chatbot model: {e}")
            return False
            
    def preprocess_text(self, text):
        """Preprocess text for the model"""
        text = text.lower().strip()
        words = word_tokenize(text)
        return " ".join(words)
        
    def predict_intent(self, text):
        """Predict intent from text with confidence score"""
        text = self.preprocess_text(text)
        seq = self.tokenizer.texts_to_sequences([text])
        
        # Get the shape from your training data
        from keras._tf_keras.keras.preprocessing.sequence import pad_sequences
        padded = pad_sequences(seq, maxlen=20, padding="post")  
        
        prediction = self.model.predict(padded, verbose=0)[0]
        max_index = np.argmax(prediction)
        confidence = prediction[max_index]
        
        intent = self.label_encoder.inverse_transform([max_index])[0]
        return intent, confidence
        
    def get_response(self, text):
        """Get response based on text input"""
        try:
            intent, confidence = self.predict_intent(text)
            
            # Log low confidence predictions for improvement
            if confidence < 0.7:
                print(f"Low confidence prediction: '{text}' -> {intent} ({confidence:.4f})")
                # Optionally log to file for later analysis
                
            if intent in self.responses:
                response = np.random.choice(self.responses[intent])
                return {"intent": intent, "response": response, "confidence": float(confidence)}
            else:
                return {"intent": "unknown", "response": "Tôi không hiểu ý bạn. Vui lòng thử lại.", "confidence": 0.0}
        except Exception as e:
            print(f"Error getting response: {e}")
            return {"intent": "error", "response": "Đã xảy ra lỗi khi xử lý tin nhắn của bạn.", "confidence": 0.0}

# Initialize the chatbot service
chatbot_service = ChatbotService()

# def chat_in_terminal():
#     """
#     Hàm kiểm tra chatbot qua terminal, cho phép người dùng nhập tin nhắn
#     và hiển thị phản hồi của chatbot.
#     """
#     print("\n===== CHATBOT TESTING MODE =====")
#     print("Nhập tin nhắn để gửi cho chatbot.")
#     print("Nhập 'exit' hoặc 'quit' để thoát.")
#     print("==================================\n")
    
#     history = []
    
#     while True:
#         user_input = input("\n👤 Bạn: ")
#         if user_input.lower() in ['exit', 'quit', 'thoát', 'q']:
#             print("\n👋 Tạm biệt! Chatbot đã đóng.")
#             break
        
#         # Lấy phản hồi từ chatbot
#         start_time = time.time()
#         result = chatbot_service.get_response(user_input)
#         response_time = time.time() - start_time
        
#         # Hiển thị kết quả chi tiết
#         intent = result["intent"]
#         response = result["response"]
        
#         # Lưu lịch sử hội thoại
#         history.append({"user": user_input, "bot": response, "intent": intent})
        
#         # Hiển thị phản hồi
#         print(f"\n🤖 Bot: {response}")
#         print(f"   Intent: {intent}")
#         print(f"   Thời gian phản hồi: {response_time:.3f}s")
    
#     # Hiển thị tóm tắt khi kết thúc
#     if history:
#         print("\n===== TÓM TẮT HỘI THOẠI =====")
#         print(f"Tổng số tin nhắn: {len(history)}")
        
#         # Đếm các intent phổ biến
#         intents = [item["intent"] for item in history]
#         from collections import Counter
#         intent_counts = Counter(intents)
#         print("\nIntent phân phối:")
#         for intent, count in intent_counts.most_common():
#             print(f"- {intent}: {count}")

# # Thêm import time để đo thời gian phản hồi
# import time

# # Thực thi hàm kiểm tra nếu chạy trực tiếp file này
# if __name__ == "__main__":
#     chat_in_terminal()