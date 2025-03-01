from data_process.image_data_processing import load_and_preprocess_data, analyze_data_structure
from ai_models.cnn_model import build_cnn_model, train_model
from testing.test_disease_model.test_disease_model import evaluate_model, predict_on_test_directory
import tensorflow as tf
import os
from tensorflow.python.keras.engine import data_adapter
import tensorflow.python.keras as tf_keras
from keras import __version__
tf_keras.__version__ = __version__

print("TensorFlow version:", tf.__version__)

# 1. Load data
train_dir = r'C:\Users\Dell\PycharmProjects\PythonProject\data\datasets\Trains'
valid_dir = r'C:\Users\Dell\PycharmProjects\PythonProject\data\datasets\Vals'
test_dir  = r'C:\Users\Dell\PycharmProjects\PythonProject\data\datasets\Test\test'

print("Loading and preprocessing data...")
train_gen, valid_gen = load_and_preprocess_data(train_dir, valid_dir)
analyze_data_structure(train_dir)

# 2. Fix cho DistributedDataset (nếu có)
def _is_distributed_dataset(ds):
    return isinstance(ds, data_adapter.input_lib.DistributedDatasetSpec)
data_adapter._is_distributed_dataset = _is_distributed_dataset

# 3. Xây dựng, huấn luyện và lưu/tải mô hình
# Đường dẫn lưu mô hình (.h5)
model_save_path = r'C:\Users\Dell\PycharmProjects\PythonProject\src\my_model.h5'

model = None

# Nếu file đã tồn tại, cố gắng load mô hình
if os.path.exists(model_save_path):
    print("Loading saved model from:", model_save_path)
    try:
        model = tf.keras.models.load_model(model_save_path)
        print("Model loaded successfully!")
    except ValueError as e:
        print("Error loading saved model:", e)
        print("Deleting the corrupted model file and retraining...")

# Nếu chưa có mô hình (hoặc file load bị lỗi), xây dựng và huấn luyện mô hình mới
if model is None:
    print("Building a new model...")
    model = build_cnn_model()  # Sử dụng các tham số mặc định (input_shape=(128,128,3), num_classes=18)
    print("Training model...")
    train_model(model, train_gen, valid_gen, epochs=7)
    print("Saving model to:", model_save_path)
    #os.makedirs(os.path.dirname(model_save_path), exist_ok=True)
    # Lưu toàn bộ mô hình dưới định dạng HDF5 (bao gồm cấu trúc và trọng số)
    model.save('my_model.h5')
    print("Model saved successfully!")

# 4. Đánh giá mô hình trên tập validation
#print("Evaluating model on validation set...")
#evaluate_model(model, valid_gen)

# 5. Dự đoán trên các ảnh test mới
Li = [
    'Pepper__bell___Bacterial_spot', 'Pepper__bell___healthy', 'Potato___Early_blight',
    'Potato___Late_blight', 'Potato___healthy',
    'Rice_leaf___Bacterial_leaf_blight', 'Rice_leaf___Brown_spot', 'Rice_leaf___Leaf_smut'
]

print("Predicting on new test images...")
predict_on_test_directory(model, test_dir, Li)
