const socket = io('http://localhost:3000/');

window.onload = () => {
    socket.on('detection', function (msg) {
        msg = JSON.parse(msg);
        const position = document.getElementById('position');
        position.innerText = `${Math.round(msg.detection._box._x)}/${Math.round(msg.detection._box._y)}`;
    });
}
