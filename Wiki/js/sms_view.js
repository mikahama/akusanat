var placing = {"TOP":0, "BOTTOM":1}
document.addEventListener('DOMContentLoaded', function() {
    populateView();
}, false);

var processors = [getEtymology, getSwadesh];

function populateView(){
	var homonyms = document.getElementsByClassName("homonym");
	for (var i = 0; i < homonyms.length; i++) {
		var homonym = homonyms[i];
		var json_text = homonym.getElementsByClassName("json_data")[0].textContent;
		print(homonym.getElementsByClassName("json_data")[0].innerHTML);
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
		var semantics = json["sms2xml"]["sources"];
	}catch (e){
		//No sources defined
		var semantics = [];
	}

	for (var i = 0; i < semantics.length; i++) {
		var sem = semantics[i];
		if("Swades_ID" in sem){
			return ["<p id='swadesh'>Swadesh ID <a href='swadesh%3A"+sem["Swades_ID"]+"'>" + sem["Swades_ID"] + "</a></p>", placing.TOP];
		}
	}
	return ["", placing.TOP];
}

function getEtymology(json){
	var return_string = "";
	try{
		var etym = json["morph"]["lg"]["etymology"];
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
	print(etymologies);
	return_string = "<div class='etymology_container'><button class='etybutton' onclick='showEtymology(event)'>Näytä etymologia</button><ul class='etylist'>"
	for (var i = 0; i < etymologies.length; i++) {
		var etymology = etymologies[i];
		var data = etymology.textContent;
		if(etymology.tagName == undefined){
			continue;
		}

		var html = "<li>" + data + " (" + _(etymology.tagName) + ") <ul>";
		var attrs = etymology.attributes || [];
		print(attrs)
		for (var ii = 0; ii < attrs.length; ii++) {
			var attribute = attrs[ii];
			html = html + "<li>" + _(attribute.name) + " - " + _(attribute.value) + "</li>"
		}
		html = html + "</ul></li>"
		return_string = return_string + html;
	}
	return_string = return_string + "</ul></div>";
	return [return_string, placing.TOP]
}


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

var lokaali = {}