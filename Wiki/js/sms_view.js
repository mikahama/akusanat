var placing = {"TOP":0, "BOTTOM":1}
document.addEventListener('DOMContentLoaded', function() {
    populateView();
    var editors = document.getElementsByClassName("mw-editsection");
    for (var i = 0; i < editors.length; i++) {
    	var editor = editors[i];
    	editor.style.display = "none";
    }
    document.getElementsByTagName("body")[0].appendChild(HTMLtoDOM("<div id='clickBlock' onclick='closeDialog()' style='display: none'><div onclick='stopPropagation(event)' id='inflectionResultsDialog'><h2>Taivutukset</h2><p id='inflectionResultsClose' onclick='closeDialog()'>Sulje</p><div id='inflectionResults'></div></div></div>","div"));
}, false);

var processors = [appendPlayer, appendAudioPlayer, createInflectionButton, getEtymology, getCompg, getSwadesh];

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

function stopPropagation(event) {
    event.stopPropagation();
}

function closeDialog() {
    document.getElementById("clickBlock").style.display = "none";
}

function appendPlayer(json) {
	if("morph" in json){
		var m = json["morph"];
		if("lg" in m){
			var l = m["lg"];
			if("inc-audio" in l){
				var audio_xml = l["inc-audio"];
				var index = audio_xml.indexOf("name=\"ID_Audio\"");
				var audios = [];
				while(index != -1){
					audio_xml = audio_xml.substring(index);
					var a = audio_xml.indexOf(">");
					audio_xml = audio_xml.substring(a + 1);
					a = audio_xml.indexOf("<");
					var audio_id = audio_xml.substring(0, a);
					if (audio_id.length == 3){
						audio_id = "0" + audio_id;
					}
					audios.push(audio_id);
                    index = audio_xml.indexOf("name=\"ID_Audio\"");
				}
				var html = "<div class='audioPlayer'>";
				console.log(audios);
				for(var i=0; i< audios.length; i++){
					var audio = audios[i];
					if(audio in audioDict){
						html = html + "<audio controls controlsList=\"nodownload\"><source src=\""+ audioDict[audio] +"\" type=\"audio/wav\"></audio>";
					}
				}
				html = html + "</div>";
				return [html, placing.TOP];

			}
		}
	}

	return ["", placing.TOP]
}

function appendAudioPlayer(json) {
    if("morph" in json){
        var m = json["morph"];
        if("lg" in m){
            var l = m["lg"];
            if("audio" in l){
                var audio_xml = l["audio"];
                var index = audio_xml.indexOf("href=");
                var audios = [];
                while(index != -1){
                    audio_xml = audio_xml.substring(index + "href=\"".length);
                    var a = audio_xml.indexOf("\"");
                    var audio_link = audio_xml.substring(0, a);
                    audios.push(audio_link);
                    index = audio_xml.indexOf("href=");
                }
                var html = "<div class='audioPlayer'>";
                for(var i=0; i< audios.length; i++){
                    var audio = audios[i];
					html = html + "<audio controls controlsList=\"nodownload\"><source src=\""+ audio +"\" type=\"audio/wav\"></audio>";
                }
                html = html + "</div>";
                return [html, placing.TOP];

            }
        }
    }

    return ["", placing.TOP]
}

function  createInflectionButton(json) {
	var supported_pos = ["N", "A", "V"];
	var supported_langs = ["sms"];
    var language = getLanguage().toLowerCase();
	if(supported_pos.indexOf(json["POS"]) > -1 && supported_langs.indexOf(language) > -1 ){
		var lemma = getLemma();
		if("hid" in json){
			lemma = lemma + "%2B" + json["hid"];
		}
        var html = "<button onclick=\"getInflections('" +lemma+"', '" + json["POS"]+ "', '" + language+"' )\" >Taivuta</button>";
        console.log(html);

		return [html, placing.TOP];
	}else{
		return ["", placing.TOP];
	}
}

function getInflections(word, pos, language) {
	var url = djangoURL + "inflect/?language=" + language + "&lemma=" + encodeURI(word) + "&pos=" + pos +"&output=html";
	console.log(url);
    document.getElementById("inflectionResults").innerHTML = "<iframe id='inflectionFrame' src=\"" + url + "\"></iframe>";
    document.getElementById("clickBlock").style.display = "block";


}


var WSAjax = Class.create ({
    initialize: function (_url, _callback){
        this.url = _url ;
        this.callback = _callback ;
        this.connect () ;
    },
    connect: function (){
        var script_id = null;
        var script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        script.setAttribute('src', this.url);
        script.setAttribute('id', 'xss_ajax_script');

        script_id = document.getElementById('xss_ajax_script');
        if(script_id){
            document.getElementsByTagName('head')[0].removeChild(script_id);
        }

        // Insert <script> into DOM
        document.getElementsByTagName('head')[0].appendChild(script);
    },
    process: function (data){
        this.callback(data) ;
    }

}) ;


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
	var current_url = document.location.href.substring(0, document.location.href.lastIndexOf(":") + 1);
	return_string = "<div class='etymology_container'><button class='etybutton' onclick='showEtymology(event)'>Näytä "+ buttonText +"</button><ul class='etylist'>"
	for (var i = 0; i < etymologies.length; i++) {
		var etymology = etymologies[i];
		var data = etymology.textContent;
		if(etymology.tagName == undefined){
			continue;
		}

		var link = current_url + data;
        var attrs = etymology.attributes || [];
		if (etymology.tagName=="cognate"){
            for (var iii = 0; iii < attrs.length; iii++) {
                var attribute = attrs[iii];
                if(attribute.name == "xml_lang"){
                    link = document.location.href.substring(0, document.location.href.lastIndexOf("/")+1) + attribute.value + ":" + data;
                    break;
				}

            }
		} else if (etymology.tagName=="etymon"){
            for (var iii = 0; iii < attrs.length; iii++) {
                var attribute = attrs[iii];
                if(attribute.name == "algu_lekseemi_id"){
                    attribute.value = "<a href='http://kaino.kotus.fi/algu/index.php?t=lekseemi&lekseemi_id=" + attribute.value + "'>" +attribute.value + "</a>";
                    break;
                }

            }
		}
		var html = "<li><a href='"+ link +"'>" + data + "</a> (" + _(etymology.tagName) + ") <ul>";

		for (var ii = 0; ii < attrs.length; ii++) {
			var attribute = attrs[ii];
			html = html + "<li>" + _(attribute.name) + " - " + _(attribute.value) + "</li>"
		}
		html = html + "</ul></li>";
		return_string = return_string + html;
	}
	return_string = return_string + "</ul></div>";
	if(return_string.contains("<ul class='etylist'></ul>")){
		//Empty
		return ["", placing.TOP];
	}
	return [return_string, placing.TOP];
}

function getLanguage() {
    var ele = document.getElementById("firstHeading");
   	var lang = ele.textContent.split(":")[0];
   	return lang;
}

function getLemma() {
    var ele = document.getElementById("firstHeading");
    var lang = ele.textContent.split(":")[1];
    return lang;
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

var lokaali = {};