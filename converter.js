/**
 * Deep-clones any JSON-compliant value
 *
 * @param {Object} input The value to be cloned
 * @return {Object} The cloned value
 */
function cloneObject(input) {
  if (typeof input != "object") {
    return input;
  } else if (Array.isArray(input)) {
    return [].slice.call(input,0);
  } else if (input == null) {
    return null;
  }
  var clone = {};
  for (var i in input) {
    if (typeof input == "object") {
      clone[i] = cloneObject(input[i]);
    } else {
      clone[i] = input[i];
    }
  }
  return clone;
}
/**
 * Given a filename or URL, gets its extension.
 * 
 * @param {String} input The filename or URL
 * @return {String} The file extension of the input
 */
function fileExt(input) {
  var lastSlash = input.lastIndexOf("/");
  var lastDot = input.lastIndexOf(".");
  
  if (lastDot > lastSlash) { // also checks for -1
    return input.slice(lastDot);
  } else {
    throw new Error("No file extension!");
  }
}

/**
 * Simple class for sequentially assigning filenames to images 
 * and loading them from the web into a JSZip object.
 * @constructor
 */
function ImageLoader() {
  this.images = [];
}

/**
 * Adds another image URL to be loaded.
 *
 * @this ImageLoader
 * @param {string} url The URL to be loaded
 * @return {string} The assigned filename
 */
ImageLoader.prototype.queue = function(url) {
  var pos = this.images.indexOf(url);
  return (pos > -1 ? pos : this.images.push(url) - 1) + fileExt(url);
}

/**
 * Downloads all queued images into the JSZip object
 *
 * @this ImageLoader
 * @param {JSZip} zip
 */
ImageLoader.prototype.load = function(zip) {
  this.images.forEach(function(url, i) {
    // OH NOES SYNCHRONOUS XHR!
    var xhr = new XMLHttpRequest();
	xhr.open("GET", url, false);
	xhr.overrideMimeType("text/plain; charset=x-user-defined");
	xhr.send(); // might error, we can let it bubble up
	
	if (xhr.status != 200) {
	  throw new Error("Received status "+xhr.status+" "+xhr.statusText+" instead of 200");
	}
	
	var binaryText = [].map.call(xhr.responseText,function(n) {
	  return String.fromCharCode(n.charCodeAt(0) & 0xff);
	}).join("");
	
	zip.file(i + fileExt(url), window.btoa(binaryText), {base64: true, binary: true});
  });
  
  this.images = [];
}

/**
 * Makes a nested object one-dimensional, using an underscore for nesting instead.
 * Example: <code>{a: 1, b: {c: 2, d: 3}}</code> becomes <code>{a: 1, b$c: 2, b$d: 3}</code>
 *
 * @param {Object} object
 * @return {Object}
 */
function flattenObject(object, parent) {
  parent = parent || "";
  var newobject = {};
  
  for (var i in object) {
    if (Object.prototype.toString.call(object[i]) == "[object Object]") {
	  var newparams = flattenObject(object[i], parent + i + "$");
	  for (var j in newparams) {
	    newobject[j] = newparams[j];
	  }
	} else {
	  newobject[parent + i] = object[i];
	}
  }
  return newobject;
}

/**
 * Maps Open Web app manifest fields to their Chrome Hosted App equivalents.
 * Excludes locales, default_locale, app.urls
 *
 * @param {Object} openManifest
 * @return {Object} chromeManifest
 */
function convertManifestFields(openManifest,origin,imageLoader) {
  var chromeManifest = {};
  
  if (typeof openManifest.name != "string") { // only required field -_-
    throw new Error("MANIFEST_ERROR");
  }
  chromeManifest.name = openManifest.name;
  
  chromeManifest.version = "1";
  
  chromeManifest.app = {
    urls: [origin],
    launch: {
      web_url: origin + openManifest.launch_path
    }
  };
  
  if (openManifest.description) {
    chromeManifest.description = openManifest.description;
  }
  if (openManifest.developer && openManifest.developer.url) {
    chromeManifest.homepage_url = openManifest.developer.url;
  }
  if (openManifest.icons) {
    chromeManifest.icons = {};
    
    for (var i in openManifest.icons) {
      if (!openManifest.icons.hasOwnProperty(i)) continue;
      
      var fileLoc = origin + openManifest.icons[i];
      var newFileName = imageLoader.queue(fileLoc);
	  
	  chromeManifest.icons[i] = newFileName;
    }
  }
  return chromeManifest;
}
    
/**
 * Returns a zip file (to be part of a crx) given an Open Web App manifest and its origin
 *
 * @param {Object} openManifest The Open Web App's manifest as an object
 * @param {string} origin The origin of the app (origin where the manifest is hosted)
 * @return {String} chromeAppZip The Chrome Web App's contents in a zip, ready for crx headers.
 */
function convertWebApp(openManifest, origin) {
  if (!openManifest.launch_path) {
    openManifest.launch_path = origin;
  }
  
  var chromeAppZip = new JSZip();
  var imageLoader = new ImageLoader();
  
  
  if (openManifest.locales) {
    // oh carp.
	
	// these functions aren't useful outside this scope
	// and in turn have terrible names.
	
	// converts a chrome manifest into messages.json format
	function chrome_i18n_ify(object) {
	  object = flattenObject(object);
	  var newobject = {};
	  for (var i in object) {
	    newobject[i] = {message: object[i]}
	  }
	  return newobject;
	}
	
	// replaces all chrome manifest value fields with i18n message pointers
	function chrome_manifest_ify(object, parent) {
	  parent = parent || "";
	  
	  for (var i in object) {
		if (Object.prototype.toString.call(object[i]) == "[object Object]") {
		  var newparams = chrome_manifest_ify(object[i], parent + i + "$");
		  for (var j in newparams) {
			object[j] = newparams[j];
		  }
		} else {
		  object[i] = "__MSG_"+parent+i+"__";
		}
	  }
	  return object;
	}
	
	var localesFolder = chromeAppZip.folder("_locales");
	
    var locales = cloneObject(openManifest.locales);
    var default_locale = openManifest.default_locale;
    delete openManifest.locales;
    delete openManifest.default_locale;
	
	if (!default_locale) throw new Error("MANIFEST_ERROR");
    
    for (var i in locales) {
      var copy = cloneObject(openManifest);
	  for (var j in locales[i]) {
	    copy[j] = cloneObject(locales[i][j]); // does nothing if not an object
	  }
	  
	  localesFolder.folder(i).file("messages.json", 
	    JSON.stringify(chrome_i18n_ify(convertManifestFields(copy,origin,imageLoader))));
	}
	
	var chromeManifest = convertManifestFields(openManifest,origin,imageLoader);
	
    localesFolder.folder(default_locale).file("messages.json",
	  JSON.stringify(chrome_i18n_ify(chromeManifest)));
	
	chrome_manifest_ify(chromeManifest);
	chromeManifest.default_locale = default_locale;
	
	chromeAppZip.file("manifest.json",JSON.stringify(chromeManifest));
	
  } else { // no locales...
    var chromeManifest = convertManifestFields(openManifest,origin,imageLoader);
	delete chromeManifest.default_locale;
	
	chromeAppZip.file("manifest.json",JSON.stringify(chromeManifest));
  }
  
  imageLoader.load(chromeAppZip);
  
  return chromeAppZip.generate({base64:true,compression:"STORE"});
}
