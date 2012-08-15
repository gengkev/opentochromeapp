function $(id){return document.getElementById(id);}

$("submit").onclick = function() {
	var manifest = JSON.parse($("input").value);
	var origin = $("origin").value;
	
	var base64_zip = convertWebApp(manifest, origin);
	
	$("sandbox").contentWindow.postMessage({
		zip: base64_zip
	}, "*");
}
window.addEventListener("message",function(e) {
	location.href = window.webkitURL.createObjectURL(new Blob(
		[e.data.crx],
		{type: "application/x-chrome-extension"}
	));
});