from tensorflow.python.keras import layers, models

def build_cnn_model(input_shape=(256, 256, 3), num_classes=8):
    model = models.Sequential([
        layers.Conv2D(32, (3, 3), activation='relu', input_shape=input_shape),
        layers.MaxPooling2D(2, 2),
        layers.Conv2D(64, (3, 3), activation='relu'),
        layers.MaxPooling2D(2, 2),
        layers.Conv2D(128, (3, 3), activation='relu'),
        layers.MaxPooling2D(2, 2),
        layers.Flatten(),
        layers.Dense(128, activation='relu'),
        layers.Dense(num_classes, activation='softmax')
    ])
    # Compile the model
    model.compile(optimizer='adam', loss='sparse_categorical_crossentropy', metrics=['accuracy'])
    return model

def train_model(model, train_gen, valid_gen, epochs):
    try:
        print("Training Started")
        history = model.fit(
            train_gen,
            validation_data=valid_gen,  # Comment this if not using validation
            epochs=epochs
        )
        return history
    except Exception as e:
        print("Error during training:", str(e))
        raise
