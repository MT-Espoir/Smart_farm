# unit_tests.py
from chatbot_models.cnn_model import create_cnn_model, save_model, load_cnn_model

def test_model_save_load():
    model = create_cnn_model()
    save_model(model, 'model/test_model.h5')
    loaded_model = load_cnn_model('model/test_model.h5')
    assert model.to_json() == loaded_model.to_json()
    print("Model save/load test passed!")

if __name__ == "__main__":
    test_model_save_load()