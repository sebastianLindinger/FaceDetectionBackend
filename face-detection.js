let videoEl;
let canvasEl;
var comboBoxEl;

let dims;
let comboBoxValue;

// Define detection options
const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 });

// Get socket.io object. Learn more at https://socket.io
const socket = io();
let player = 1;

window.onload = () => {
    // Get references to HTML elements
    videoEl = document.getElementById('inputVideo');
    canvasEl = document.getElementById('overlay');
    comboBoxEl = document.getElementById('select');

    // Detect player parameter (e.g. http://localhost:3000/face-detection.html?player=1)
    const url = new URL(window.location);
    const playerParameter = url.searchParams.get("player");
    if (playerParameter && !isNaN(playerParameter)) {
        player = parseInt(playerParameter);
        console.log(`Detected player parameter with value ${player}`);
    }

    run();
};

async function run() {
    // Load face detection model
    if (!faceapi.nets.tinyFaceDetector.params) {
        await faceapi.nets.tinyFaceDetector.load('/weights/');
    }
        await faceapi.loadFaceLandmarkTinyModel('/weights/');
        await faceapi.loadFaceExpressionModel('/weights/');

    // Try to access users webcam and stream the images to the video element
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
    videoEl.srcObject = stream;
}

async function onPlay() {
    comboBoxValue = comboBoxEl.value;

    // Check if model has already been loaded. If not, wait a little bit and try again
    if (videoEl.paused || videoEl.ended || !faceapi.nets.tinyFaceDetector.params) {
        return setTimeout(() => onPlay(), 250);
    }

    let result;
    if (comboBoxValue === 'faceDetection') {
        result = await faceapi.detectSingleFace(videoEl, options);
    } else if (comboBoxValue === 'faceDetectionWithLandmarks') {
        result = await faceapi.detectSingleFace(videoEl, options).withFaceLandmarks(true);
    } else {
        result = await faceapi.detectSingleFace(videoEl, options).withFaceExpressions();
    }

    if (result) {
        dims = faceapi.matchDimensions(canvasEl, videoEl, true);

        //Draw result
        const resizedResult = faceapi.resizeResults(result, dims);
        faceapi.draw.drawDetections(canvasEl, resizedResult);
        if (comboBoxValue === 'faceDetectionWithLandmarks') {
            faceapi.draw.drawFaceLandmarks(canvasEl, resizedResult);
        } else if (comboBoxValue === 'faceExpressionRecognition') {
            const minConfidence = 0.05;
            faceapi.draw.drawFaceExpressions(canvasEl, resizedResult, minConfidence);
        }

        // Send detection data to server using websockets
        resizedResult.player = player;
        socket.emit('detection', JSON.stringify(resizedResult));
    }

    // Schedule next detection
    setTimeout(() => onPlay());
}
