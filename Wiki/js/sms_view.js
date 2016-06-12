var placing = {"TOP":0, "BOTTOM":1}
document.addEventListener('DOMContentLoaded', function() {
    populateView();
}, false);

var processors = [getEtymology, getCompg, getSwadesh];

function populateView(){
	var homonyms = document.getElementsByClassName("homonym");
	for (var i = 0; i < homonyms.length; i++) {
		var homonym = homonyms[i];
		var json_text = homonym.getElementsByClassName("json_data")[0].textContent;
		var json_data = JSON.parse(json_text);
		var h1 = homonym.getElementsByTagName("H1")[0];
		for (var a = 0; a < processors.length; a++) {
			var list = processors[a](json_data);
			var html = list[0];
			var place = list[1];
			if(html === ""){
				continue;
			}
			if (place == placing.TOP){
				homonym.insertBefore(HTMLtoDOM(html,"div"), h1.nextSibling);
			}else{
				homonym.appendChild(HTMLtoDOM(html,"div"));
			}
		}
	}
}

function getSwadesh(json){
	try{
		var samples = json["morph"]["lg"]["inc-sampling"];
	}catch (e){
		//No sources defined
		var samples = "";
	}
	if(samples == undefined){
		samples = "";
	}

	var index = samples.indexOf("Swadesh");
	if(index == -1){
		return ["", placing.TOP];
	}else{
		samples = samples.substring(index);
		index = samples.indexOf(">");
		var swadeshType = samples.substring(0, index-1);
		samples = samples.substring(index+1);
		index = samples.indexOf("<"); 
		var swadeshNumber = samples.substring(0, index-1);
		return ["<p id='swadesh'><i>"+swadeshType+" ID</i> <b><a href='"+swadeshType+"%3A"+swadeshNumber+"'>" + swadeshNumber + "</a></b></p>", placing.TOP];
	}
	
}

function getCompg(json){
	var data = lgData(json, "compg", "muodostus");
	return data;
}

function getEtymology(json){
	return lgData(json, "etymology", "etymologia");
}

function lgData(json, lgType, buttonText){
	var return_string = "";
	try{
		if (lgType in json["morph"]["lg"]){
			var etym = json["morph"]["lg"][lgType];
		}
		var parser = new DOMParser();
    	var xmlDoc = parser.parseFromString(etym, "text/xml");
    	var etymologies = xmlDoc.childNodes[0];
    	if(etymologies.tagName == "html"){
    		throw "";
    	}
    	etymologies = etymologies.childNodes;
	}catch (e){
		//No etymology defined
		var etymologies = [];
	}
	if (etymologies == undefined || etymologies.length==0){
		return [return_string, placing.TOP];
	}
	return_string = "<div class='etymology_container'><button class='etybutton' onclick='showEtymology(event)'>Näytä "+ buttonText +"</button><ul class='etylist'>"
	for (var i = 0; i < etymologies.length; i++) {
		var etymology = etymologies[i];
		var data = etymology.textContent;
		if(etymology.tagName == undefined){
			continue;
		}

		var html = "<li>" + data + " (" + _(etymology.tagName) + ") <ul>";
		var attrs = etymology.attributes || [];
		for (var ii = 0; ii < attrs.length; ii++) {
			var attribute = attrs[ii];
			html = html + "<li>" + _(attribute.name) + " - " + _(attribute.value) + "</li>"
		}
		html = html + "</ul></li>"
		return_string = return_string + html;
	}
	return_string = return_string + "</ul></div>";
	if(return_string.contains("<ul class='etylist'></ul>")){
		//Empty
		return ["", placing.TOP]
	}
	return [return_string, placing.TOP]
}

String.prototype.contains = function(it) { return this.indexOf(it) != -1; };

function print(data){
	console.log(data);
}

function HTMLtoDOM(html, type){
	var container = document.createElement(type);
	container.innerHTML = html;
	return container.firstChild;
}

function _(text){
	if(text in lokaali){
		return lokaali[text];
	}else{
		return text;
	}
}

function showEtymology(event){
	var etylist = event.target.parentNode.getElementsByClassName("etylist")[0];
	if(etylist.style.display == "none" || etylist.style.display == ""){
		etylist.style.display = "block";
	}else{
		etylist.style.display = "none";
	}
}

var lokaali = {}