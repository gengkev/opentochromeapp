Main things

  * Message passing between places
    * Chrome message passing mostly, and DOM hacks like Mozilla for webpage owa api and maybe postMessage for communication to generator
    * It's hard to find a balance between sync and async
    * Which makes it hard to install two apps at once :o
    * Actually right now i'm going to put the generator in the infobar to save a lot of message passing :D
  * Implement the OWA Api for webpages, messing with content scripts, and passing to bg page.
  * Implement CRX generation (namely RSA) correctly.
  * Implement apps management
    * Storing apps
    * Handling installs/uninstalls
    * Maybe make this an app itself because we need a way for the user to do this easily and not browser actions.
    * UI, of course!
  * We got installation planned but how about uninstallation and other stuff apps management needs to do?
  * Right now I just want to get this code written without testing it - you can't test it really since they all depend on each other. That means DEBUGGING!
  * Maybe later we can have some fun with Mozilla's extra planned API's