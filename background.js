if (!window.Worker) {
  alert("Web Workers not found?! That's strange...\n(Debug Message from OpenToChromeApp)");
}

var ports={};
var manifestdata;
chrome.extension.onConnect.addListener(function(port) {
  switch(port.name) {
    //case "converter":
    //  ports[1]=port;
    //  port.onMessage.addListener(function(msg) {
    //    if (message.name="progress"&&ports[0]) { //bounce to content script
    //        ports[0].postMessage(msg);
    //    }
    //    else if (message.name="update") {
    //      if (msg.message="dataready") {
    //          ports[0].postMessage({name:"dataready"});
    //      }
    //    }
    //  });
    //  break;
    case "infobar":
      ports.infobar=port;
      //document.getElementById("generateFrame").src="converter.html";
      port.onMessage.addListener(function(msg) {
        switch(msg.name) {
          case "givemethatfish":
            port.postMessage({
              name:"ready",
              appName:,
              appManifest:,
              origin:
            });
            break;
          case "startInstall":
            break;
          case "appReady":
            chrome.windows.create({
              url:msg.appEncoded,
              left:0,
              top:0,
              width:0,
              height:0,
              focused:true,
              type:popup
            });
            chrome.management.onInstalled.addListener(function(info) {
              if (info.isApp&info.id==msg.appId) {
                port.postMessage({name:"appInstalled"});
              }
            });
            break;
          default:
            break;
        }
      });
      port.onDisconnect.addListener(function() {
      });
      break;
    default:
      break;
  }
});


function openIframe() {
  
}
  //document.getElementById("generateFrame").src="converter.html";
