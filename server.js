var express = require('express'),
    app = express(),
    path = require('path'),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    port = process.env.PORT || 3001;

server.listen(port, function(){
    console.log('Server listening at port %d', port);
});
//Routing
app.use(express.static(path.join(__dirname, 'public')));
//Chatroom
var numUsers = 0;
io.on('connection', function(socket){
    var addedUser = false;

    //when client emits 'add user'
    socket.on('add user', function(username){
        if(addedUser) return;
    
        console.log(username);
        //we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;

        socket.emit('login', {
            numUsers: numUsers
        });
        //echo globally (all clients) that a perso has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
    });
    //when client emits 'new message'
    socket.on('new message', function(data){
        //we tell the client to execute 'new message'
        console.log(data);
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    }); 

    //When client emits 'typing', we broadcast it to others
    socket.on('typing', function(){
        socket.broadcast.emit('typing', {
            username: socket.username,
        });
    });
    //When client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', function(){
        socket.broadcast.emit('stop typing', {
            username: socket.username,
        });
    });
    //when the user disconnect.. perform this
    socket.on('disconnect', function(){
        if(addedUser){
            --numUsers;
            //echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});