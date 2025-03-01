import os
import pandas as pd
import tensorflow as tf

def load_and_preprocess_data(train_dir, valid_dir):
    # Rescaling layer
    rescale = tf.keras.layers.Rescaling(scale=1.0 / 255)
    
    # Load training and validation datasets
    training_data = tf.keras.utils.image_dataset_from_directory(
        train_dir,
        image_size=(256, 256),
        batch_size=16,
        shuffle=True
    )
    validation_data = tf.keras.utils.image_dataset_from_directory(
        valid_dir,
        image_size=(256, 256),
        batch_size=16,
        shuffle=True
    )
    
    # Optimize dataset with rescaling
    AUTOTUNE = tf.data.AUTOTUNE
    train_gen = training_data.map(lambda image, label: (rescale(image), label))
    train_gen = train_gen.cache().prefetch(buffer_size=AUTOTUNE)
    valid_gen = validation_data.map(lambda image, label: (rescale(image), label))
    valid_gen = valid_gen.cache().prefetch(buffer_size=AUTOTUNE)
    
    return train_gen, valid_gen

def analyze_data_structure(train_dir):
    diseases = os.listdir(train_dir)
    plants = []
    NumberOfDiseases = 0
    
    # Count unique plants and diseases
    for plant in diseases:
        if plant.split('___')[0] not in plants:
            plants.append(plant.split('___')[0])
        if plant.split('___')[1] != 'healthy':
            NumberOfDiseases += 1
    
    # Count images per class
    nums = {disease: len(os.listdir(train_dir + '/' + disease)) for disease in diseases}
    img_per_class = pd.DataFrame(nums.values(), index=nums.keys(), columns=["no. of images"])
    return img_per_class
