var tts = require('node-google-text-to-speech')

tts.translate('en', 'dog', function(result) {
    if(result.success) { //check for success
        var response = { 'audio' : result.data };
        //socket.emit('ttsResult', response); //emit the audio to client
    }
});