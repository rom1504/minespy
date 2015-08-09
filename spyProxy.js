// proxy.js

var mc = require('minecraft-protocol')
  ,	states = mc.states
  ,	server = mc.createServer({
    port: 25566,
    keepAlive:false
  })
  ;

function isPlay(target, self) {
  return (target === states.PLAY && self === states.PLAY);
}

var saving=true;
var saves=[];
var lastTargetClient;
var alreadyOneNormal=false;
server.on('login', function(client) {
  console.log(client.username);
  if(!alreadyOneNormal) // everybody will spy the first client
  {
    alreadyOneNormal=true;
    normalClient();
  }
  else {
    specialClient();
  }




  function specialClient() {

    var targetClient=lastTargetClient;

    setTimeout(function(){
      saves.forEach(function(save){
        saving=false;
        client.writeRaw(save);
      })
    },100);

    client.on('raw', function(buffer, state) {
      if(isPlay(targetClient.state, state)) {
        targetClient.writeRaw(buffer);
      }
    });

      targetClient.on('raw', function(buffer, state) {
        if(isPlay(client.state, state)) {
          client.writeRaw(buffer);
        }
      });


  }


  function normalClient() {
    var endedClient = false
      ,	endedTargetClient = false
      ,	targetClient = mc.createClient({
        username: client.username,
        host: '127.0.0.1',
        port: 25565,
        keepAlive: false
      });
    lastTargetClient=targetClient;
    client.on('raw', function(buffer, state) {
      if(isPlay(targetClient.state, state)) {
        targetClient.writeRaw(buffer);
      }
    });

    targetClient.on('raw', function(buffer, state) {
      if(isPlay(client.state, state)) {
        if(saving) saves.push(buffer);
        client.writeRaw(buffer);
      }
    });

    client.on('end', function() {
      alreadyOneNormal=false;
      endedClient = true;
      if(!endedTargetClient) {
        try {
          targetClient.end("End");
        } catch(e) {
          console.log(e);
        }
      }
    });

    targetClient.on('end', function() {
      alreadyOneNormal=false;
      endedTargetClient = true;
      if(!endedClient) {
        client.end("End");
      }
    });

    client.on('error', function() {
      alreadyOneNormal=false;
      endedClient = true;
      if(!endedTargetClient) {
        targetClient.end("Error");
      }
    });

    targetClient.on('error', function() {
      alreadyOneNormal=false;
      endedTargetClient = true;
      if(!endedClient) {
        client.end("Error");
      }
    });
  }
});