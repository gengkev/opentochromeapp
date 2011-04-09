function convertWebApp(string,origin,isLocale) {
  var openWebApp=JSON.parse(string);
  var chromeWebApp={};

  chromeWebApp.name=openWebApp.name||undefined;
  //validate chrome version required by chrome, no limit open
  if (openWebApp.version) {
    chromeWebApp.version="";
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

  chromeWebApp.description=openWebApp.description||undefined;
  if (openWebApp.icons&&openWebApp.icons["128"]) {
    chromeWebApp.icons={};
    chromeWebApp.icons["128"]=openWebApp.icons["128"];
  }
  if (openWebApp.developer&&openWebApp.developer.url) {
    chromeWebApp.homepage_url=openWebApp.developer.url;
  }

  var locales={};
  if (openWebApp.locales&&!isLocale) {
    var i;
    for (i in locales) {
      if (!locales.hasOwnProperty(i)) continue;
      locales[i]=convertWebApp(openWebApp.locales[i],origin,true)[0];
    }
  }

  return [JSON.stringify(chromeWebApp),locales];
}
function compileZipFile(manifest,langs) {
  var zip=new JSZip();
  zip.add("manifest.json",manifest);
  if (langs) {
    var locales=zip.folder("_locales");
    var i;
    for (i in langs) {
      if (!langs.hasOwnProperty(i)) continue;
      locales.folder(i).add("messages.json",langs[i]);
    }
  }
  return zip.generate(true);
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
  //var rsa2=new RSAKey();
  //rsa2.readPrivateKeyFromPEMString(privateKey);
  var sig=rsa.signString(zipfile,"sha1");
  return [pubKey,privateKey,sig];
}
  