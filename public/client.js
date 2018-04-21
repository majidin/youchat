//import { setTimeout } from "timers";

$(function(){
    var FADE_TIME = 150; // ms
    var TYPING_TIMER_LENGTH = 400; // ms
    var COLORS = [
        '#e21400', '#91580f', '#f8a700', '#f78b00',
        '#58dc00', '#287b00', '#a8f07a', '#4ae8c4',
        '#3b88eb', '#3824aa', '#a700ff', '#d300e7'
    ];
//Initialize variables
    var $window = $(window);

    //alert("IIF Works !");

    var $usernameInput = $('.usernameInput');//input for username
    var $messages = $('.messages');//Messages area
    var $inputMessage = $('.inputMessage');//Input message input box

    var $loginPage = $('.login.page');//login page
    var $chatPage = $('.chat.page');//chat room page

    // Prompt for setting a username
    var username;
    var connected = false;
    var typing = false;
    var lastTypingTime;
    var $currentInput = $usernameInput.focus();
// // Click events
//   // Focus input when clicking anywhere on login page
  $loginPage.click(function () {
    $currentInput.focus();
  });
  // Focus input when clicking on the message input's border
  $inputMessage.click(function () {
    $inputMessage.focus();
});

    var socket = io();
//*********************************************** */
   // Prevents input from having injected markup
    function cleanInput (input) {
        return $('<div/>').text(input).html();
    }

//*******************AddParticipantsMessage********************* */
    function addParticipantsMessage(data){
        var message = '';
        if(data.numUsers === 1){
            message += "there is 1 participant";
        }else{
            message += "There are " + data.numUsers + " participants"
        }
        log(message);
    }
//******************************************************************** */
    //Log a message
    function log(message, options){
        var $el = $('<li>').addClass('log').text(message);
        addMessageElement($el, options);
    }
//********************************************************* */
  //Append message to $messages <ul></ul>
    function addMessageElement (el, options) {
        var $el = $(el);
        //Setup default options
        if(!options){
            options = {};
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefined') {
            options.prepend = false;
        }
        // Apply options
        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
          }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }
      $messages[0].scrollTop = $messages[0].scrollHeight;
    }
//********************************************************* */ 
     //Keyboard events
     $window.keydown(function(event){
        if(!(event.ctrlKey || event.metaKey || event.altKey)){
            $currentInput.focus();
        }
    
        // When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if(username){
                sendMessage();
                socket.emit('stop typing');
                typing = false;
            }else{
                setUsername();
            }  
        }
    });
    //###########################################################

     //Sets the client's username
     function setUsername(){
        username = cleanInput($usernameInput.val().trim());
        // If username is valid
        if(username){
            document.title = username +' - '+ document.title;
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off('click');
            $currentInput = $inputMessage.focus();
            //Tell the server your username
            socket.emit('add user', username);
        }
    }   
     // Sends a chat message
     function sendMessage(){
        var message = $inputMessage.val();
        message = cleanInput(message);
        if(message && connected){
            $inputMessage.val('');
            addChatMessage({
                username: username,
                message: message
            });

            socket.emit('new message', message);
        }
        
    }
    // Adds the visual chat message to the message list
    function addChatMessage(data, options){
        //Don't fade the message if there is an 'X' typing
        var $typingMessages = getTypingMessages(data);
        options = options || {};
        
        if($typingMessages.length !== 0){
            options.fade = false;
            $typingMessages.remove();
        }

        console.log($typingMessages);
        console.log("$typingMessages Length : " + $typingMessages.length);
        var $usernameDiv = $('<span class="username"/>')
                .text(data.username)
                .css('color', getUsernameColor(data.username));
        var $messageBody = $('<span class="messageBody"/>')
                .text(data.message);

        var typingClass = data.typing  ? 'typing' : '';
        var $messageDiv = $('<li class="message"/>')
                        .data('username', data.username)
                        .addClass(typingClass)
                        .append($usernameDiv, $messageBody);

        addMessageElement($messageDiv);
    }
    // Gets the color of usename through our hash function
    function getUsernameColor(usename){
        //compute hash code
        var hash = 7;
        for(var i = 0; i < username.length; i++){
            hash = username.charCodeAt(i) + (hash << 5) - hash;
        }
        console.log("hash :" + hash);
        // Calculate color
        var index = Math.abs(hash % COLORS.length);
        console.log("index of color : " + index);
        return COLORS[index];
    }
    // Gets the 'X is typing' messages of a user
    function getTypingMessages(data){
        return $('.typing.message').filter(function (i) {
            return $(this).data('username') === data.username;
        });
    }
    ////////
    $inputMessage.trigger('input');
    $inputMessage.on('input', function() {

        updateTyping();
    });
    // Updates the typing
    function updateTyping(){
        console.log('updateTyping');
        if(connected){
            if(!typing){
                typing = true;
                socket.emit('typing');
            }
        }
        lastTypingTime = (new Date()).getTime();
        setTimeout(function(){
            var typingTimer = (new Date()).getTime();
            var timeDiff = typingTimer - lastTypingTime;
            if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                socket.emit('stop typing');
                    typing = false;
            }
        }, TYPING_TIMER_LENGTH);
    }
// Removes the visual chat typing message
    function removeChatTyping (data) {
        getTypingMessages(data).fadeOut(function () {
        $(this).remove();
        });
}
//###########################SOCKET#########################################

     // Socket events
    socket.on('login', function(data){
        connected = true;
        //Display the welcome message
        var message = "Welcome to Socket.IO Chat";
        log(message, {
            prepend: true
        });
        addParticipantsMessage(data);
    });
     // Whenever the server emits 'user joined', log it int the chat body
    socket.on('user joined', function(data){
        log(data.username + ' joined');
        addParticipantsMessage(data);
    });
    // Whenever the server emits 'new message', update the chat body
    socket.on('new message', function(data){
        console.log(data);
        addChatMessage(data);
    });

  // Whenever the server emits 'user left', log it in the chat body
    socket.on('user left', function (data) {
        log(data.username + ' left');
        addParticipantsMessage(data);
        removeChatTyping(data);
  });

    // Whenever the server emits 'typing', show the typing message
    socket.on('typing', function (data) {
        console.log(data.username + " <i>typing</i>");
        addChatTyping(data);
    });
 // Adds the visual chat typing message
    function addChatTyping (data, options) {
        data.typing = true;
        data.message = 'is typing';
        addChatMessage(data);
    }
    // Whenever the server emits 'stop typing', kill the typing message
    socket.on('stop typing', function (data) { 
        console.log(data.username + " is stoping typing");
        removeChatTyping(data);
    });

    socket.on('disconnect', function () {
        log('you have been disconnected');
    });

    socket.on('reconnect', function () {
        log('you have been reconnected');
        if (username) {
        socket.emit('add user', username);
        }
    });

    socket.on('reconnect_error', function () {
        log('attempt to reconnect has failed');
    });
   
});
