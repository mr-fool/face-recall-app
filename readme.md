# FaceRecall

A face recognition application that helps Alzheimer's patients identify familiar people using camera technology.

![FaceRecall Screenshot](screenshots/app-screenshot.png)

## Overview

FaceRecall is a desktop application designed to assist individuals with Alzheimer's disease in recognizing and remembering important people in their lives. Using facial recognition technology, the application can identify faces in real-time through a webcam and provide personalized information about each person.

## Features

- **Face Recognition**: Identify people in real-time using your computer's camera
- **Personalized Information**: Store and display names, relationships, and personalized notes for each person
- **Accessibility Features**: Large text options and high contrast mode for easier viewing
- **Voice Announcements**: Optional spoken announcements when someone is recognized
- **Data Management**: Export/import functionality to backup your data

## Installation

### Prerequisites
- Node.js (v14 or later)
- npm (v6 or later)

### Setup
1. Clone this repository
```bash
git clone https://github.com/yourusername/face-recall.git
cd face-recall
```

2. Install dependencies
```bash
npm install
```

3. Download face recognition models
Create an `assets/models/` directory and download the required models from face-api.js:
- ssd_mobilenetv1_model
- face_landmark_68_model
- face_recognition_model
- face_expression_model

You can find these in the [face-api.js weights folder](https://github.com/justadudewhohacks/face-api.js/tree/master/weights).

4. Create default assets
Make sure to create an `assets/images/` directory and add a default avatar image named `default-avatar.png` or `default-avatar.jpg`.

5. Start the application
```bash
npm start
```

## Usage

### Adding a Person
1. Click on the "Manage People" tab
2. Enter the person's name, relationship, and any helpful notes
3. Click "Select Photos" to add photos of the person
4. Click "Save Person"

### Recognizing Faces
1. Click on the "Recognize" tab
2. Click "Start Camera" to activate your webcam
3. Position the person's face in view of the camera
4. Click "Recognize Face" to identify the person

### Settings
- Adjust the recognition confidence threshold to make recognition more or less strict
- Choose how recognition is announced (visual only, name only, or full details)
- Change text size and contrast settings for better visibility
- Export your data for backup or to transfer to another device

## Troubleshooting

### Camera Not Working
- Make sure your webcam is properly connected
- Check that your browser/system permissions allow camera access
- Try restarting the application

### Recognition Issues
- Ensure good lighting when taking photos and during recognition
- Add multiple photos of each person from different angles for better recognition
- Adjust the confidence threshold in Settings if recognition is too strict or too lenient

### Installation Problems
If you encounter issues during installation:
```bash
# Clear npm cache
npm cache clean --force

# Try installing with a different registry
npm install --registry=https://registry.npmjs.org/
```

## Future Plans

- Mobile application version
- Cloud backup option
- Improved recognition capabilities
- Multi-user profiles

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) for the facial recognition functionality
- [Electron](https://www.electronjs.org/) for the cross-platform desktop framework
- Everyone who contributed to testing and feedback