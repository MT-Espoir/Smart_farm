import itertools
from sklearn.metrics import precision_score, accuracy_score, recall_score
from keras._tf_keras.keras.preprocessing.image import load_img, img_to_array
import tensorflow as tf
import numpy as np
import os


# predicting an image

image_path="C:/Users/Dell/PycharmProjects/PythonProject/data/datasets/Test/test"

def evaluate_model(model, valid_gen):
    labels = []
    predictions = []

    # Generate predictions and labels
    for x, y in valid_gen:
        labels.append(list(y.numpy()))
        predictions.append(tf.argmax(model.predict(x), 1).numpy())

    # Flatten the lists
    predictions = list(itertools.chain.from_iterable(predictions))
    labels = list(itertools.chain.from_iterable(labels))

    # Print evaluation metrics
    print("Accuracy         : {:.2f}%".format(accuracy_score(labels, predictions) * 100))
    print("Precision Score  : {:.2f}%".format(precision_score(labels, predictions, average='micro') * 100))
    print("Recall Score     : {:.2f}%".format(recall_score(labels, predictions, average='micro') * 100))

def predict_image(model, image_path, class_labels):
    new_img = load_img(image_path, target_size=(256, 256))
    img = img_to_array(new_img)
    img = np.expand_dims(img, axis=0) / 255
    prediction = model.predict(img)
    probability = prediction.flatten()
    max_prob = probability.max()
    index = prediction.argmax(axis=-1)[0]
    return class_labels[index], max_prob

def predict_on_test_directory(model, test_dir, class_labels):
    files = [os.path.join(test_dir, p) for p in sorted(os.listdir(test_dir))]
    for image_path in files:
        class_name, prob = predict_image(model, image_path, class_labels)
        print(f"Image: {os.path.basename(image_path)} -> Class: {class_name}, Probability: {prob:.2f}")
