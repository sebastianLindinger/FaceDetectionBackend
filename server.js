const express = require('express');
const cors = require('cors');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(cors());
app.use(express.static(__dirname));

io.on('connection', function(socket){
  console.log('a user connected');
  socket.on('detection', function(msg){
    socket.broadcast.emit('detection', msg);
  });
});

// setInterval(() => {
//   io.emit('detection', JSON.stringify({
//     "detection": {
//         "_score": 0.9571357254155874,
//         "_box": {
//             "_x": 230.39041435965515,
//             "_y": 109.92713367169372,
//             "_width": 228.85297433669407,
//             "_height": 236.27063250918766
//         }
//     }
//   }))
// }, 1000);

http.listen(3000, function(){
  console.log('listening on *:3000');
});
