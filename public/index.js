const socket = io('ws://localhost:5050');

socket.on('connect', () => {
    console.log('connected');
});

socket.on('disconnect', () => {
    console.log('disconnected');
});