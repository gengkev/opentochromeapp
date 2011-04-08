function convertWebApp(string,origin) {
  var openWebApp=JSON.parse(string);
  var chromeWebApp={};

  if (openWebApp.locales&&localStorage["use-default-language"]!="false") {
    var language=window.navigator.language;
    var language2=language.substring(0,language.indexOf("-"));
    if (openWebApp.locales[language]||openWebApp.locales[language2]) {
      var currentLocale=openWebApp.locales[language]||openWebApp.locales[language2];
      var i;
      for (i in currentLocale) {
        openWebApp[i]=currentLocale[i];
      }
    }
  }
  chromeWebApp.name=openWebApp.name;  //required by both
  //validate chrome version required by chrome, no limit open
  chromeWebApp.version="";
  if (openWebApp.version) {
    var ints=openWebApp.version.split(".",4);
    ints.forEach(function(e,i,a) {
      e=parseInt(e);
      if (e<0) e=0;
      else if (e>65535) e=65535;

      if (i>0) chromeWebApp.version+=".";
      chromeWebApp.version+=e;
    });
  }
  else chromeWebApp.version="0";
  chromeWebApp.app={};  //required by chrome
  chromeWebApp.app.launch={};  //required by chrome
  if (openWebApp.launch_path) {
    chromeWebApp.launch.web_url=openWebApp.launch_path; //required by chrome
  }
  else { chromeWebApp.launch_url=origin; } //"origin" of manifest, owa says
  if (openWebApp.installs_allowed_from) { //not exactly the same.... part of the app, and can install/update app
    chromeWebApp.app.urls=openWebApp.installs_allowed_from;
  }

  chromeWebApp.description=openWebApp.description;
  if (openWebApp.icons&&openWebApp.icons["128"]) {
    chromeWebApp.icons={};
    chromeWebApp.icons["128"]=openWebApp.icons["128"];
  }
  if (openWebApp.developer&&openWebApp.developer.url) {
    chromeWebApp.homepage_url=openWebApp.developer.url;
  }

  return JSON.stringify(chromeWebApp);
}
function compileZipFile(manifest,langs,messages) { //langs: array of folders, messages: array of messages.json
  if (langs&&langs.length!=messages.length)
    throw new Error("Length of languages is not equal to length of messages!");
  var zip=new JSZip();
  zip.add("manifest.json",manifest,{base64:true});
  if (langs) {
    var locales=zip.folder("_locales");
    for (i=0;i<langs.length;i++) {
      locales.folder(langs[i]).add("messages.json",messages[i],{base64:true});
    }
  }
  return zip.generate();
}
function getRSA(zipfile) {
  var rsa=new RSAKey();
  rsa.generate(1024,10001);
  var pubKey="-----BEGIN CERTIFICATE-----"
    +rsa.n.toString(16)
    +"-----END CERTIFICATE-----";
  var privateKey="-----BEGIN RSA PRIVATE KEY-----"
    +rsa.d.toString(16)
    +"-----END RSA PRIVATE KEY-----";
  //rsa.readPrivateKeyFromPEMString(privateKey);
  var sig=rsa.signString(zipfile,"sha1");
  return [pubKey,sig];
}
  