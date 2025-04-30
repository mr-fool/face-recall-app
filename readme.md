# FaceRecall

An AI-powered face recognition application that helps Alzheimer's patients identify familiar people using advanced neural network technology.

![main](https://github.com/user-attachments/assets/86cc9082-569a-4524-b72c-76b7254c0cc7)
![addToDatabase](https://github.com/user-attachments/assets/741fea0f-b686-4f8e-b66d-e3237980d2b6)


## Overview

FaceRecall is a desktop application designed to assist individuals with Alzheimer's disease in recognizing and remembering important people in their lives. Leveraging state-of-the-art AI facial recognition technology, the application can identify faces in real-time through a webcam and provide personalized information about each person.

## AI Technology

FaceRecall utilizes multiple neural network models to achieve high-accuracy face recognition:

- **SSD MobileNet**: A convolutional neural network for initial face detection that balances speed and accuracy
- **Face Landmark Detection**: 68-point facial landmark mapping to identify key facial features
- **Face Recognition Neural Network**: Deep learning model that generates unique 128-dimensional face embeddings 
- **Expression Analysis**: AI model that can identify emotional states from facial features
- **Real-time Processing**: Optimized for low-latency recognition on standard hardware

The application employs transfer learning techniques with pre-trained models, allowing accurate recognition even with limited training examples (just a few photos per person).

## Features

- **AI-Powered Recognition**: Identify people in real-time using deep learning neural networks
- **Personalized Information**: Store and display names, relationships, and personalized notes for each person
- **Accessibility Features**: Large text options and high contrast mode for easier viewing
- **Voice Announcements**: Optional spoken announcements when someone is recognized
- **Data Management**: Export/import functionality to backup your data
- **Confidence Thresholding**: Adjustable AI confidence settings to fine-tune recognition accuracy

## Installation

### Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)

### Setup
1. Clone this repository
```bash
gh repo clone mr-fool/face-recall-app
cd face-recall
```

2. Install dependencies
```bash
npm install
```

3. Download neural network models
Create an `assets/models/` directory and download the required AI models from face-api.js:
- ssd_mobilenetv1_model
- face_landmark_68_model
- face_recognition_model
- face_expression_model

You can find these in the [face-api.js weights folder](https://github.com/justadudewhohacks/face-api.js/tree/master/weights).

4. Create default assets
Make sure to create an `assets/images/` directory and add a default avatar image named `default-avatar.png`.

5. Start the application
```bash
npm start
```

## Usage

### Adding a Person to the AI Database
1. Click on the "Manage People" tab
2. Enter the person's name, relationship, and any helpful notes
3. Click "Select Photos" to add photos of the person
4. The AI will automatically extract facial features from these images
5. Click "Save Person" to add them to the recognition database

### Recognizing Faces with AI
1. Click on the "Recognize" tab
2. Click "Start Camera" to activate your webcam
3. Position the person's face in view of the camera
4. Click "Recognize Face" to engage the AI recognition system
5. View the results including confidence score from the neural network

### AI Settings
- Adjust the recognition confidence threshold to fine-tune the neural network's strictness
- Choose how recognition is announced (visual only, name only, or full details)
- Change text size and contrast settings for better visibility
- Export your AI training data for backup or to transfer to another device

## Troubleshooting

### Camera Not Working
- Make sure your webcam is properly connected
- Check that your browser/system permissions allow camera access
- Try restarting the application

### Recognition Issues
- Ensure good lighting when taking photos and during recognition
- Add multiple photos of each person from different angles to improve the AI's learning
- Adjust the confidence threshold in Settings if recognition is too strict or too lenient

### Installation Problems
If you encounter issues during installation:
```bash
# Clear npm cache
npm cache clean --force

# Try installing with a different registry
npm install --registry=https://registry.npmjs.org/
```

## Future AI Enhancements

- Age and gender detection based on neural network analysis
- Emotion recognition to help interpret the person's mood
- Continuous learning to improve recognition over time
- Cloud-based processing for lighter client requirements
- Multi-person simultaneous recognition

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) for the neural network models and facial recognition functionality
- [Electron](https://www.electronjs.org/) for the cross-platform desktop framework
- Everyone who contributed to testing and feedback
