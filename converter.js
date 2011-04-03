function convertWebApp(string) {
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
  chromeWebApp.name=openWebApp.name;
  chromeWebApp.description=openWebApp.description;
  chromeWebApp.version=openWebApp.version;
  chromeWebApp.icons={};
  chromeWebApp.icons["128"]=openWebApp.icons["128"];
  if (openWebApp.launch_path) { chromeWebApp.launch_url=openWebApp.launch_path; }
  else { chromeWebApp.launch_url="/"; }
  chromeWebApp.homepage_url=openWebApp.developer.url;

  return JSON.stringify(chromeWebApp);
}
JZip.compressions.crx={
}
function downloadChromeApp(JSON,type) {
  