var ports=[];
var manifestdata;
chrome.extension.onConnect.addListener(function(port) {
  switch(port.name) {
    case "converter":
      ports[1]=port;
      port.onMessage.addListener(function(msg) {
        if (message.name="progress"&&ports[0]) { //bounce to content script
            ports[0].postMessage(msg);
        }
        else if (message.name="update") {
          if (msg.message="dataready") {
              ports[0].postMessage({name:"dataready"});
          }
        }
      });
      break;
    case "infobar":
      ports[0]=port;
      document.getElementById("generateFrame").src="converter.html";
      port.onMessage.addListener(function(msg) {
        
      });
      break;
    default:
      port.disconnect();
      break;
  }
});

  //document.getElementById("generateFrame").src="converter.html";
