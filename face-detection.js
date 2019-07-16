let videoEl;
let canvasEl;
let dims;

// Define detection options
const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.5 });

// Get socket.io object. Learn more at https://socket.io
const socket = io();
let player = 1;

window.onload = () => {
    // Get references to HTML elements
    videoEl = document.getElementById('inputVideo');
    canvasEl = document.getElementById('overlay');

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
    await faceapi.loadFaceLandmarkTinyModel('/weights/')

    // Try to access users webcam and stream the images to the video element
    const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
    videoEl.srcObject = stream
}

async function onPlay() {
    // Check if model has already been loaded. If not, wait a little bit and try again
    if (videoEl.paused || videoEl.ended || !faceapi.nets.tinyFaceDetector.params)
        return setTimeout(() => onPlay(), 250);

    // Detect a face
    const result = await faceapi.detectSingleFace(videoEl, options).withFaceLandmarks(true)
    if (result) {
        // Prepare displaying detection result.
        // See also https://github.com/justadudewhohacks/face-api.js#getting-started-displaying-detection-results
        dims = faceapi.matchDimensions(canvasEl, videoEl, true);

        // Draw result
        const resizedResult = faceapi.resizeResults(result, dims)
        faceapi.draw.drawDetections(canvasEl, resizedResult)
        faceapi.draw.drawFaceLandmarks(canvasEl, resizedResult)

        // Send detection data to server using websockets
        resizedResult.player = player;
        socket.emit('detection', JSON.stringify(resizedResult));
    }

    // Schedule next detection
    setTimeout(() => onPlay())
}
