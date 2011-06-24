

function convertWebApp(string,origin) {
  var openWebApp=JSON.parse(string);
  var chromeWebApp={};
  //Right now we have 2 methods of doing things.
  //1: No Locale
  //   Just convert the names.
  //2: Locales
  //   The main one is default_locale. Others in .locales
  //   are their respective locales, and if the default has
  //   a field that the locale doesn't, copy it over. If it
  //   has a field that the main one doesn't, ... dont copy
  //   anything over to the main field... why would that
  //   even happen...

  //Option 2: Messing With Locales
  if (openWebApp.locales&&openWebApp.default_locale) {
    //when locales is present, so must be default_locale
    //in chrome, there also CANNOT be default_locale without locales
    //just pray that the locale names are correct :)
    var locales={},i,j,propertyList={};

    var _openWebApp=openWebApp; //we can mess with this one
    delete _openWebApp.locales;
    delete _openWebApp.default_locale;
    
    chromeWebApp.default_locale=openWebApp.default_locale;
    
    for (i in _openWebApp) {
      propertyList[i]=true;
    }
    for (j in openWebApp.locales) {
      for (i in openWebApp.locales[j]) {
        propertyList[i]=true;
      }
    }
    for (i in propertyList) {
      chromeWebApp[i]="__MSG_"+escape(i)+"__";
    }





    for (var i in openWebApp.locales) {
      if (!openWebApp.locales.hasOwnProperty(i)) continue;
      locales[i]=convertWebApp(openWebApp.locales[i],origin,true)[0];
    }
  }

  //Option 1: The Easy One
  else {
    var _openWebApp=openWebApp;
    if (_openWebApp.locales) delete _openWebApp.locales;
    if (_openWebApp.default_locale) delete _openWebApp.default_locale;
    chromeWebApp=convertManifest(openWebApp,origin);
  }

  return JSON.stringify(chromeWebApp);
}

function convertManifest(input) {
  if (typeof input=="string") {
    var openWebApp=JSON.parse(input);
  }
  else if (typeof input=="object") {
    var openWebApp=input;
  }
  else {
    throw new TypeError("Excpected string "
      + "or object for parsing but got "
      + typeof(input));
  }

  var chromeWebApp={};
  chromeWebApp.name=openWebApp.name||"";
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
  else if (origin) { //"origin" of manifest, owa says.. hmm
    chromeWebApp.launch_url=origin;
  }
  else {
    throw new Error("Manifest did not have an origin field, "
      + "and was not retrieved from a location, "
      + "so the origin cannot be determined.");
  }
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

  return chromeWebApp;
  //return JSON.stringify(chromeWebApp);
}

function compileZipFile(manifest,langs) {
  var zip=new JSZip("DEFLATE");
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
  var pubKey=rsa.n.toString(16);
  var privateKey=rsa.d.toString(16);
  rsa=undefined;
  var rsa2=new RSAKey();
  rsa2.readPrivateKeyFromPEMString(
    "-----BEGIN RSA PRIVATE KEY-----\n"
    +privateKey
    +"\n-----END RSA PRIVATE KEY-----");
  var sig=rsa2.signString(zipfile,"sha1");
  rsa2=undefined;
  return [pubKey,privateKey,sig];
}
function compileFinalCRX(zipfile,pubKey,sig) {
  var headerdata=
    "\x43\x72\x32\x34"+
    "\x02\x00\x00\x00"+
    
}