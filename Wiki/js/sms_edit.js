/*
  @author: Mika Hämäläinen www.mikakalevi.com
  @version: 1.0
  
*/

function getEle(id){
	return document.getElementById(id);
}
function print(text){
	console.log(text);
}

document.addEventListener('DOMContentLoaded', function() {
    getEle("editform").style.display = "none";
    createEditForm();
}, false);

function getLemma(){
	var h = getEle("firstHeading");
	var lemma = h.textContent.toLowerCase();
	var index = lemma.indexOf("sms:");
	lemma = lemma.substring(index+4);

	return lemma;
}

function createEditForm(){
	var formContainer = getEle("mw-content-text");
	var editForm = document.createElement("div");
	editForm.id = "smsEditForm";
	formContainer.appendChild(editForm);
	var entries = loadFromWikiMarkup();
	for(var i =0; i< entries.length; i++){
		var entry = entries[i];
		var item = createFormItem(entry["lemma"], entry["pos"], entry["semantics"], entry["translations"], entry["json_data"], entry["json"]);
		editForm.appendChild(item);
	}
	var addButton = document.createElement("button");
	addButton.addEventListener("click",  function(event){addHomonym(event);});
	addButton.textContent = "Lisää sanaluokka"
	editForm.appendChild(addButton);


	var saveButton = document.createElement("button");
	saveButton.addEventListener("click",  function(event){saveModifications(event);});
	saveButton.textContent = "Tallenna muutokset";
	saveButton.className = "saveButton";
	formContainer.appendChild(saveButton);

}

function removeBrackets(text){
	text = text.replaceAll("}","");
	text = text.replaceAll(")","");
	text = text.replaceAll("]","");
	text = text.strip();
	return text;
}

function getJsonsFromWiki(wikiText){
	var jsons = [];
	while(true){
		var index = wikiText.indexOf("class=\"json_data\">");
		if (index == -1){
			break;
		}
		wikiText = wikiText.substring(index +18);
		var endIndex = wikiText.indexOf("</span>");
		jsons.push(wikiText.substring(0, endIndex));
		wikiText = wikiText.substring(endIndex);
	}
	return jsons;
}
var current_lemma = "";
function loadFromWikiMarkup(){
	var entries = []
	var wikiText = getEle("wpTextbox1").value;
	var wikiElement = document.createElement("div");
	wikiElement.innerHTML = wikiText.wiki2html();
	var homonyms = wikiElement.getElementsByClassName("homonym");
	var jsons = getJsonsFromWiki(wikiText);
	for(var i=0; i< homonyms.length;i++){
		var homonym = homonyms[i];
		var heading = homonym.getElementsByTagName("H1")[0].textContent;
		var lemma = heading.split("({{")[0].strip();
		current_lemma = getLemma();
		var pos = heading.split("sms:POS_")[1].replace("}})" ,"").strip();
		var semanticsElement = homonym.getElementsByClassName("semantics")[0];
		var semanticsItems = [];
		try{
			semanticsElement.getElementsByTagName("UL")[0].getElementsByTagName("LI")
		}catch (ex){

		}
		var semantics = [];
		for (var x =0; x < semanticsItems.length; x++){
			var semanticsItem = semanticsItems[x];
			var semText = semanticsItem.textContent;
			var semantics_class = removeBrackets(semText.split(" - ")[0].split("sms:sem_")[1]);
			var semantics_value = removeBrackets(semText.split(" - ")[1].split("sms:sem_c_")[1]);
			semantics.push( [semantics_class, semantics_value] );
		}
		var translations = {};
		var translationElement = homonym.getElementsByClassName("translations")[0];
		var translationLanguages = translationElement.getElementsByClassName("trans_language");
		for (var y=0; y< translationLanguages.length; y++){
			var translationLanguage = translationLanguages[y];
			var lang_text = translationLanguage.getElementsByTagName("h3")[0].textContent;
			var language_name = removeBrackets(lang_text.split("lang:")[1]);
			var langTranslations = translationLanguage.getElementsByTagName("UL")[0].getElementsByTagName("LI");
			trans = []
			for(var z=0; z< langTranslations.length; z++){
				var langTranslation = langTranslations[z].textContent;
				var lastIndex = langTranslation.lastIndexOf(" (");
				var parts = [langTranslation.substring(0, lastIndex), langTranslation.substring(lastIndex+2)];
				print(parts[1]);
				var word = removeBrackets(parts[0]);
				var pos = removeBrackets(parts[1].split("sms:POS_")[1]);
				trans.push([word, pos]);
			}
			translations[language_name] = trans;
		}
		var json_data = escapeHTML(jsons[i]);
		entries.push({"lemma":lemma, "pos":pos, "semantics":semantics, "translations": translations, "json_data": json_data, "json": JSON.parse(jsons[i])});

	}
	return entries;
}

function createFormItem(lemma, pos, semantics, translations, json_data, json){
	var lemma_edit = document.createElement("div");
	lemma_edit.className = "lemma_edit";
	var form_item = "<div class='lemma_pos_edit'> <button onclick='deleteHomonym(event)'>Poista sanaluokka</button>"
	+ "<p class='smsFormInput'>Sanaluokka: <input value='"+ pos +"'>  </p></div>"+
	"<span class='edit_json_data' style='display:none;'>"+ json_data +"</span><div class='semantics_edit'><p><b>Semantiikka</b></p><button onclick='addSemantics(event)'>Lisää</button>";
	var semantics_table = createSemanticsTable(semantics);
	form_item = form_item + semantics_table.innerHTML + "</div>";
	form_item = form_item + "<div class='translations_edit'><p><b>Käännökset</b></p><button onclick='addTranslationLanguage(event)'>Lisää kieli</button>"
	var translation_table = createTranslationsTable(translations);
	form_item = form_item + translation_table.innerHTML + "</div>"
	form_item = form_item + etymologyForm(json);
	lemma_edit.innerHTML = form_item;
	return lemma_edit;
}


function etymologyForm(json){
	var return_string = "<div class='etymology_edit'><p><b>Etymologia</b></p><button onclick='addEtyWord(event)'>Lisää kantasana</button>";
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
		return return_string + "</div>";
	}
	for (var i = 0; i < etymologies.length; i++) {
		var etymology = etymologies[i];
		var data = etymology.textContent;
		if(etymology.tagName == undefined){
			continue;
		}

		var html = "<div class='etyEntry'>Kantasana: <input class='etyWord' value='" + data + "'> Tyyppi: <input class='etyType' value='" + etymology.tagName + "'><button onclick='addEtyAttr(event)'>Lisää attribuutti</button><span class='deleteButton' onclick='deleteEtyWord(event)'>X</span><ul>";
		var attrs = etymology.attributes || [];
		for (var ii = 0; ii < attrs.length; ii++) {
			var attribute = attrs[ii];
			html = html + "<li>Nimi: <input class='etyAttr' value='" + attribute.name + "'> Arvo: <input class='etyValue' value='" + attribute.value + "'><span class='deleteButton' onclick='deleteEtyAttr(event)'>X</span></li>"
		}
		html = html + "</ul></div>"
		return_string = return_string + html;
	}
	return_string = return_string + "</div>";
	return return_string
}


function createSemanticsTable(semantics){
	var tableContainer = document.createElement("div");
	var table = document.createElement("table");
	table.className = "semantics_table";
	table.innerHTML = "<tr><th>Luokka</th><th>Arvo</th><th>Poista</th></tr>";
	for(var i =0; i < semantics.length; i++){
		var semantic = semantics[i];
		
		var tableRow = semanticTableRow(semantic[0],semantic[1]);
		table.appendChild(tableRow);
	}
	tableContainer.appendChild(table);
	return tableContainer;
}

function semanticTableRow(cl, val){
	var tableRow = document.createElement("tr");
	var row = "<td><input class='semantics_class' value='"+  cl +"'></td><td><input class='semantics_value' value='"+  val +"'></td><td class='deleteButton' onclick='deleteSemantics(event)'>X</td>";
	tableRow.innerHTML = row;
	return tableRow;
}

function createTranslationsTable(translations){
	var container = document.createElement("div");
	var html="";
	for (var language in translations){
		var lan_translations = translations[language];
		html = html + translationsTableHTML(language, lan_translations);
	}
	container.innerHTML = html;
	return container;
}

function translationsTableHTML(language, lan_translations){
	var html ="";
	html = html + "<div class='language'> <p class='smsFormInput'>Kielen tunnus (esim. eng) <input value='" + language + "'></p> <button onclick='addTranslation(event)'>Lisää käännös</button>";
	html = html + "<table><tr><th>Käännös</th><th>Sanaluokka</th><th>Poista</th></tr>"
	for(var i =0; i< lan_translations.length; i++){
		var translation = lan_translations[i];
		html = html + translationTableRowHTML(translation[0],translation[1] );
	}

	html = html + "</table></div>"
	return html;
}

function translationTableRowHTML(word, pos){
	var row = "<tr><td><input class='translation_word' value='"+ word +"'></td><td><input class='translation_pos' value='"+  pos +"'></td><td class='deleteButton' onclick='deleteTranslation(event)'>X</td></tr>";
	return row;
}

function escapeHTML (unsafe_str) {
    return unsafe_str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;')
      .replace(/\'/g, '&#39;'); // '&apos;' is not valid HTML 4
}

/*

Form buttons 

*/


function deleteSemantics(event){
	var row = event.target.parentElement;
	row.remove();
}

function deleteEtyAttr(event){
	var row = event.target.parentElement;
	row.remove();	
}
function deleteEtyWord(event){
	var row = event.target.parentElement;
	row.remove();
}

function addEtyAttr(event){
	var list = event.target.parentElement.getElementsByTagName("UL")[0];
	var html = "<li>Nimi: <input class='etyAttr' value=''> Arvo: <input class='etyValue' value=''><span class='deleteButton' onclick='deleteEtyAttr(event)'>X</span></li>";
	var row = HTMLtoDOM(html, "UL");
	list.appendChild(row);
}

function addEtyWord(event){
	var list = event.target.parentElement;
	var html = "<div class='etyEntry'>Kantasana: <input class='etyWord' value=''> Tyyppi: <input class='etyType' value=''><button onclick='addEtyAttr(event)'>Lisää attribuutti</button><span class='deleteButton' onclick='deleteEtyWord(event)'>X</span><ul></ul></div>";
	var row = HTMLtoDOM(html, "UL");
	list.appendChild(row);
}


function deleteTranslation(event){
	var row = event.target.parentElement;
	var table = row.parentElement.parentElement;
	row.remove();
	var translations = table.getElementsByTagName("TR");
	print(translations);
	if (translations.length == 1){//1 for the headers
		//Last translation removed -> remove the whole language!
		while (true){
			//search for the language element
			if(table.className != "language"){
				table = table.parentElement;
			}
			else{
				table.remove();
				break;
			}
		}
	}
}

function HTMLtoDOM(html, type){
	var container = document.createElement(type);
	container.innerHTML = html;
	return container.firstChild;
}

function deleteHomonym(event){
	var homonym = event.target.parentElement.parentElement;
	homonym.remove();
}

function addSemantics(event){
	var table = event.target.parentElement.getElementsByTagName("TABLE")[0];
	var tableRow = semanticTableRow("","");
	table.appendChild(tableRow);
}

function addTranslationLanguage(event){
	var languagesContainer = event.target.parentElement;
	var pos = findPOSByUIElement(languagesContainer);
	var trans =[["",pos]]
	var new_lang = translationsTableHTML("", trans);
	var container = document.createElement("div");
	container.innerHTML = new_lang;
	languagesContainer.appendChild(container.firstChild);
}

function findPOSByUIElement(element){
	var pos ="";
	var parent = element;
	while(true){
		//Find pos element
		if(parent.className != "lemma_edit"){
			parent = parent.parentElement;
		}else{
			var smsForm = parent.getElementsByClassName("lemma_pos_edit")[0].getElementsByClassName("smsFormInput")[0];
			pos = smsForm.getElementsByTagName("INPUT")[0].value;
			break;
		}
	}
	return pos;
}

function addTranslation(event){
	var table = event.target.parentElement.getElementsByTagName("TABLE")[0];

	var pos = findPOSByUIElement(table.parentElement);


	var row = HTMLtoDOM(translationTableRowHTML("",pos), "table");
	table.appendChild(row);
}

function addHomonym(event){
	var homonymContainer = event.target.parentElement;
	var item = createFormItem("", "", [], [], "{}");
	homonymContainer.insertBefore(item, event.target);
}

function updateJsons(){
	var jsons = []
	var smsEditForm = document.getElementById("smsEditForm");
	var homonyms = smsEditForm.getElementsByClassName("lemma_edit");
	for (var i =0; i< homonyms.length; i++){
		var homonym = homonyms[i];
		var pos = findPOSByUIElement(homonym);
		if (pos == ""){
			continue;
		}
		var json_text = homonym.getElementsByClassName("edit_json_data")[0].textContent;
		var json = JSON.parse(json_text);
		json["POS"] = pos;


		var semantics_table = homonym.getElementsByClassName("semantics_table")[0];
		var semantics = []
		var semantic_items = semantics_table.getElementsByTagName("TR");
		for (var x=0; x< semantic_items.length;x++){
			semantic_item = semantic_items[x];
			var sem_class_e = semantic_item.getElementsByClassName("semantics_class")[0];
			if (sem_class_e == undefined){//TH has no such element
				continue;
			}
			sem_class = sem_class_e.value;
			sem_value = semantic_item.getElementsByClassName("semantics_value")[0].value;
			if (sem_value.length+sem_class.length == 0){//filter empty rows
				continue;
			}
			sem = {"class": sem_class, "value" : sem_value};
			semantics.push(sem);
		}
		json["semantics"] = semantics;


		var translation_e = homonym.getElementsByClassName("translations_edit")[0];
		var languages = translation_e.getElementsByClassName("language");
		var translations = {}
		for(var y =0; y < languages.length; y++){
			var language = languages[y];
			var lang = language.getElementsByClassName("smsFormInput")[0].getElementsByTagName("INPUT")[0].value;
			if (lang.length ==0){
				continue;
			}

			if (!(lang in translations)){
				translations[lang] = [];
			}
			var items = language.getElementsByTagName("TR");
			for(var z=0;z<items.length;z++){
				var translation_pair = items[z];
				var translation_word = translation_pair.getElementsByClassName("translation_word")[0];
				if(translation_word == undefined){
					continue;
				}
				var word = translation_word.value;
				if( word.length == 0){
					//filter out empties
					continue;
				}
				var pos = translation_pair.getElementsByClassName("translation_pos")[0].value;
				var entry = {"word": word, "POS": pos};
				translations[lang].push(entry);
			}

		}
		json["translations"] = translations;

		if(!("morph" in json)){
			json["morph"] = {};
		}
		if(!("lg" in json["morph"])){
			json["morph"]["lg"] = {};
		}
		json["morph"]["lg"]["etymology"] = etymologyToXML(homonym);

		jsons.push(json);
	}
	return jsons;

}

function jsonToWiki(json){
	var wiki = "<div class=\"homonym\">\n= " + current_lemma +" ({{sms:POS_"+ json["POS"] +"}}) =\n\n"
	+ "[[javascript:inflect('" + current_lemma +"', '"+ json["POS"] +"')|Taivuta]]\n\n<div class=\"semantics\">\n\n"
	+ "== Semantiikka ==\n\n";

	for(var i =0; i< json["semantics"].length;i++){
		var semantic = json["semantics"][i];
		wiki = wiki + "\n* {{ sms:sem_"+ semantic["class"] +" }} - {{ sms:sem_c_"+ semantic["value"] +" }}";
	}

	wiki = wiki + "\n</div>\n\n<div class=\"translations\">\n\n== Käännökset ==\n";
	for (language in json["translations"]){
		var translations = json["translations"][language]
		wiki = wiki + "\n<div class=\"trans_language\">\n=== {{ lang:"+language+" }} ===\n";
		for(var x=0; x < translations.length; x++){
			var translation = translations[x];
			var word = translation["word"];
			var pos = translation["POS"];
			wiki = wiki + "\n* [["+language+":"+word+"|"+word+"]] ({{sms:POS_"+pos+"}})";
		}
		wiki = wiki + "\n</div>";
	}
	wiki = wiki + "\n</div>\n<span style=\"display:none\" class=\"json_data\">"+JSON.stringify(json);
	wiki = wiki + "\n</span>\n</div>\n----\n\n"

	return wiki;

}

function etymologyToXML(homonym){
	var xml = "<etymology>\n"
	var etymology = homonym.getElementsByClassName("etymology_edit")[0];
	var entries = etymology.getElementsByClassName("etyEntry");
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i];
		var word = entry.getElementsByClassName("etyWord")[0].value;
		var type = entry.getElementsByClassName("etyType")[0].value;
		if(word == ""){
			continue;
		}
		if(type == ""){
			type = "etymon";
		}
		var attributes = "";
		var attribute_list = entry.getElementsByTagName("LI");
		for (var a = 0; a < attribute_list.length; a++) {
			var listItem = attribute_list[a];
			var attribute = listItem.getElementsByClassName("etyAttr")[0].value;
			var value = listItem.getElementsByClassName("etyValue")[0].value;
			if(attribute == ""){
				continue;
			}
			attributes = attributes + " " + attribute + "=\"" + value + "\" ";
		}
		xml = xml + "<" + type + attributes + ">" + word +"</" + type + ">\n";
	}
	xml = xml + "</etymology>";
	return xml;
}

function jsonsToWiki(json_list){
	var wiki ="";
	for (var i = 0; i < json_list.length; i++) {
		var json = json_list[i];
		wiki = wiki + jsonToWiki(json);
	}
	wiki = wiki + "{{#css:/sms.css}}";
	return wiki;
}

/*
 This will be called by Django, not MediaWiki

*/
function jsonsToWikiFromDjango(json_list, lemma){
	current_lemma = lemma;
	return jsonsToWiki(json_list);
}

function saveModifications(){
	var jsons = updateJsons();
	var wikiText = jsonsToWiki(jsons);
	var textArea = document.getElementById("wpTextbox1");
	textArea.value = wikiText;
	document.getElementById("wpSave").click();
}


function showOriginalEdit(){
	getEle("editform").style.display = "block";
}






if(typeof(String.prototype.strip) === "undefined")
{
    String.prototype.strip = function() 
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.replace(new RegExp(escapeRegExp(search), 'g'), replacement);
};
function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}



















/*
	Wiki2HTML
*/

/*
  @author: remy sharp / http://remysharp.com
  @url: http://remysharp.com/2008/04/01/wiki-to-html-using-javascript/
  @license: Creative Commons License - ShareAlike http://creativecommons.org/licenses/by-sa/3.0/
  @version: 1.0
  
  Can extend String or be used stand alone - just change the flag at the top of the script.
*/

(function () {
    
var extendString = true;

if (extendString) {
    String.prototype.wiki2html = wiki2html;
    String.prototype.iswiki = iswiki;
} else {
    window.wiki2html = wiki2html;
    window.iswiki = iswiki;
}

// utility function to check whether it's worth running through the wiki2html
function iswiki(s) {
    if (extendString) {
        s = this;
    }

    return !!(s.match(/^[\s{2} `#\*='{2}]/m));
}

// the regex beast...
function wiki2html(s) {
    if (extendString) {
        s = this;
    }
    
    // lists need to be done using a function to allow for recusive calls
    function list(str) {
        return str.replace(/(?:(?:(?:^|\n)[\*#].*)+)/g, function (m) {  // (?=[\*#])
            var type = m.match(/(^|\n)#/) ? 'OL' : 'UL';
            // strip first layer of list
            m = m.replace(/(^|\n)[\*#][ ]{0,1}/g, "$1");
            m = list(m);
            return '<' + type + '><li>' + m.replace(/^\n/, '').split(/\n/).join('</li><li>') + '</li></' + type + '>';
        });
    }
    
    return list(s
        
        /* BLOCK ELEMENTS */
        .replace(/(?:^|\n+)([^# =\*<].+)(?:\n+|$)/gm, function (m, l) {
            if (l.match(/^\^+$/)) return l;
            return "\n<p>" + l + "</p>\n";
        })

        .replace(/(?:^|\n)[ ]{2}(.*)+/g, function (m, l) { // blockquotes
            if (l.match(/^\s+$/)) return m;
            return '<blockquote>' + l + '</pre>';
        })
        
        .replace(/((?:^|\n)[ ]+.*)+/g, function (m) { // code
            if (m.match(/^\s+$/)) return m;
            return '<pre>' + m.replace(/(^|\n)[ ]+/g, "$1") + '</pre>';
        })

        .replace(/(?:^|\n)([=]+)(.*)\1/g, function (m, l, t) { // headings
            return '<h' + l.length + '>' + t + '</h' + l.length + '>';
        })
    
        /* INLINE ELEMENTS */
        .replace(/'''(.*?)'''/g, function (m, l) { // bold
            return '<strong>' + l + '</strong>';
        })
    
        .replace(/''(.*?)''/g, function (m, l) { // italic
            return '<em>' + l + '</em>';
        })
    
        .replace(/[^\[](http[^\[\s]*)/g, function (m, l) { // normal link
            return '<a href="' + l + '">' + l + '</a>';
        })
    
        .replace(/[\[](http.*)[!\]]/g, function (m, l) { // external link
            var p = l.replace(/[\[\]]/g, '').split(/ /);
            var link = p.shift();
            return '<a href="' + link + '">' + (p.length ? p.join(' ') : link) + '</a>';
        })
    
        .replace(/\[\[(.*?)\]\]/g, function (m, l) { // internal link or image
            var p = l.split(/\|/);
            var link = p.shift();

            if (link.match(/^Image:(.*)/)) {
                // no support for images - since it looks up the source from the wiki db :-(
                return m;
            } else {
                return '<a href="' + link + '">' + (p.length ? p.join('|') : link) + '</a>';
            }
        })
    ); 
}
    
})();