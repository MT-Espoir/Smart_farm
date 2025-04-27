import json
import numpy as np
import os
import pickle
import matplotlib.pyplot as plt
from underthesea import word_tokenize
from keras._tf_keras.keras.preprocessing.text import Tokenizer
from keras._tf_keras.keras.preprocessing.sequence import pad_sequences
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import tensorflow as tf

# Đọc file intents.json
with open("Model_build\chatbot_models\chatbot\intents.json", "r", encoding="utf-8") as file:
    data = json.load(file)

# Trích xuất dữ liệu
sentences = []
labels = []
responses = {}

for category in data["sections"].values():
    for intent in category:
        for pattern in intent["patterns"]:
            sentences.append(pattern)
            labels.append(intent["tag"])
        responses[intent["tag"]] = intent["responses"]

# Mã hóa nhãn
label_encoder = LabelEncoder()
labels_encoded = label_encoder.fit_transform(labels)

# Tiền xử lý văn bản tiếng Việt
def preprocess_text(text):
    text = text.lower().strip()
    
    # Chuẩn hóa một số ký tự đặc biệt
    text = text.replace("?", " ? ")
    text = text.replace(".", " . ")
    text = text.replace(",", " , ")
    text = text.replace("!", " ! ")
    
    # Loại bỏ các ký tự không cần thiết
    import re
    text = re.sub(r'[^\w\s,.?!]', '', text)
    
    # Tách từ sử dụng underthesea
    words = word_tokenize(text)
    
    return " ".join(words)

sentences = [preprocess_text(sentence) for sentence in sentences]

# Tăng cường dữ liệu bằng cách thêm biến thể
augmented_sentences = []
augmented_labels = []

for sentence, label in zip(sentences, labels_encoded):
    # Thêm câu gốc
    augmented_sentences.append(sentence)
    augmented_labels.append(label)
    
    # Tạo biến thể đơn giản
    words = sentence.split()
    if len(words) > 3:
        import random
        for _ in range(2):
            random.shuffle(words)
            augmented_sentences.append(" ".join(words))
            augmented_labels.append(label)

sentences = augmented_sentences
labels = np.array(augmented_labels)  # Chuyển thành NumPy array

# Tokenizer
tokenizer = Tokenizer(oov_token="<OOV>")
tokenizer.fit_on_texts(sentences)
sequences = tokenizer.texts_to_sequences(sentences)
padded_sequences = pad_sequences(sequences, padding="post")

# Chia dữ liệu thành training và validation
X_train, X_val, y_train, y_val = train_test_split(
    padded_sequences, labels, test_size=0.2, random_state=42)

# Kiểm tra kích thước dữ liệu
print(f"X_train shape: {X_train.shape}, y_train shape: {y_train.shape}")
print(f"X_val shape: {X_val.shape}, y_val shape: {y_val.shape}")

# Thêm early stopping và giảm learning rate khi plateau
early_stopping = tf.keras.callbacks.EarlyStopping(
    monitor='val_loss', patience=20, restore_best_weights=True)
reduce_lr = tf.keras.callbacks.ReduceLROnPlateau(
    monitor='val_loss', factor=0.2, patience=3, min_lr=0.001)

model_path = "chatbotmodel.keras"

# Kiểm tra xem đã có mô hình được lưu chưa
if os.path.exists(model_path):
    try:
        print("Loading existing model...")
        model = tf.keras.models.load_model(model_path)
    except Exception as e:
        print(f"Error loading model: {e}")
        print("Creating new model...")
        model = None
else:
    print("No existing model found. Creating new model...")
    model = None

# Nếu không có mô hình hoặc mô hình bị lỗi, tạo mới
if model is None:
    # Mô hình với kiến trúc nâng cao
    model = tf.keras.Sequential([
        tf.keras.layers.Embedding(input_dim=len(tokenizer.word_index) + 1, output_dim=200, input_length=X_train.shape[1]),
        tf.keras.layers.SpatialDropout1D(0.3),
        tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(256, return_sequences=True)),
        tf.keras.layers.Bidirectional(tf.keras.layers.LSTM(128)),
        tf.keras.layers.BatchNormalization(),
        tf.keras.layers.Dense(128, activation="relu"),
        tf.keras.layers.Dropout(0.5),
        tf.keras.layers.Dense(64, activation="relu"),
        tf.keras.layers.Dense(len(set(labels)), activation="softmax")
    ])
    
    # Compile mô hình
    model.compile(
        loss="sparse_categorical_crossentropy", 
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        metrics=["accuracy"]
    )
    
    # Huấn luyện mô hình với validation và callbacks
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=12,
        callbacks=[early_stopping, reduce_lr],
        batch_size=32,
        verbose=1
    )
    
    # Lưu mô hình
    model.save(model_path)
    
    # Lưu encoder và tokenizer
    with open("label_encoder.pkl", "wb") as file:
        pickle.dump(label_encoder, file)
    
    with open("tokenizer.pkl", "wb") as file:
        pickle.dump(tokenizer, file)

# Đánh giá mô hình
def evaluate_model(model, X_test, y_test, label_encoder):
    # Đánh giá mô hình
    loss, accuracy = model.evaluate(X_test, y_test)
    print(f"Test accuracy: {accuracy:.4f}")
    
    # Tạo confusion matrix
    from sklearn.metrics import confusion_matrix, classification_report
    import seaborn as sns
    
    y_pred = model.predict(X_test)
    y_pred_classes = np.argmax(y_pred, axis=1)
    
    # Xác định các lớp thực sự xuất hiện trong y_test và y_pred_classes
    unique_classes = np.unique(np.concatenate([y_test, y_pred_classes]))
    class_names = [label_encoder.classes_[i] for i in unique_classes]
    
    # Tạo confusion matrix chỉ với các lớp xuất hiện
    cm = confusion_matrix(y_test, y_pred_classes, labels=unique_classes)
    
    
    # In báo cáo phân loại với chỉ các lớp xuất hiện
    try:
        # Sử dụng labels để chỉ định các lớp cụ thể
        report = classification_report(
            y_test, 
            y_pred_classes, 
            labels=unique_classes,
            target_names=class_names,
            zero_division=0  # Tránh lỗi chia cho 0
        )
        print(report)
    except Exception as e:
        print(f"Không thể tạo báo cáo phân loại: {e}")
        print("Dưới đây là một phương pháp thay thế đơn giản:")
        
        # Tạo báo cáo phân loại đơn giản
        from collections import Counter
        print("Phân phối nhãn thực tế:")
        print(Counter(y_test))
        print("Phân phối nhãn dự đoán:")
        print(Counter(y_pred_classes))

# Đánh giá mô hình sau khi huấn luyện
evaluate_model(model, X_val, y_val, label_encoder)

# Dự đoán intent
def predict_intent(text):
    text = preprocess_text(text)
    seq = tokenizer.texts_to_sequences([text])
    padded = pad_sequences(seq, maxlen=X_train.shape[1], padding="post")
    prediction = model.predict(padded)[0]
    max_index = np.argmax(prediction)
    confidence = prediction[max_index]
    intent = label_encoder.inverse_transform([max_index])[0]
    
    # Ghi log nếu không chắc chắn
    if confidence < 0.7:
        with open("unrecognized_queries.txt", "a", encoding="utf-8") as f:
            f.write(f"{text}|{intent}|{confidence}\n")
    
    return intent, confidence

# Kiểm tra chatbot
print("Chatbot đã sẵn sàng! Nhập 'exit' để kết thúc.")
while True:
    user_input = input("You: ")
    if user_input.lower() == "exit":
        break
    intent, confidence = predict_intent(user_input)
    print(f"Intent: {intent} (confidence: {confidence:.4f})")
    response = np.random.choice(responses[intent])
    print(f"Bot: {response}")
