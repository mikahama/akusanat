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
	formContainer.appendChild(HTMLtoDOM(makeDataList("pos")));
	formContainer.appendChild(HTMLtoDOM(makeDataList("semantics")));
	formContainer.appendChild(HTMLtoDOM(makeDataList("ContLex")));
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
	if (json != undefined){
		pos = json["POS"];
	}
	var form_item = "<div class='lemma_pos_edit'> <button onclick='deleteHomonym(event)'>Poista sanaluokka</button>"
	+ "<p class='smsFormInput'>Sanaluokka: <input value='"+ pos +"' list='pos_datalist'>  </p></div>"+
	"<span class='edit_json_data' style='display:none;'>"+ json_data +"</span><div class='semantics_edit'><p><b>Semantiikka</b></p><button onclick='addSemantics(event)'>Lisää</button>";
	var semantics_table = createSemanticsTable(semantics);
	form_item = form_item + semantics_table.innerHTML + "</div>";
	form_item = form_item + "<div class='translations_edit'><p><b>Käännökset</b></p><button onclick='addTranslationLanguage(event)'>Lisää kieli</button>"
	var translation_table = createTranslationsTable(translations);
	form_item = form_item + translation_table.innerHTML + "</div>"
	form_item = form_item + etymologyForm(json);
	form_item = form_item + compgForm(json);
	form_item = form_item + formFromLgXML(json, "stg", "stg");
	form_item = form_item + morphDictEdit(json, "element");
	form_item = form_item + morphDictEdit(json, "map");
	form_item = form_item + sourcesEdit(json);
	lemma_edit.innerHTML = form_item;
	return lemma_edit;
}

function etymologyForm(json){
	return formFromLgXML(json, "etymology", "etymology");
}

function compgForm(json){
	return formFromLgXML(json, "compg", "compg");
}

function sourcesEdit(json){
	try{
		var sources = json["sms2xml"]["sources"];
		if (sources == undefined){
			throw "";
		}
	} catch(e){
		//No sources;
		var sources = [];
	}
	var data_list = "<datalist id='sourceList'><option value='name'><option value='lesson'></datalist>";
	var return_string = "<div class='sourcesEdit' ><p><b>Lähteet</b></p><button onclick=\"addSource(event)\">Lisää lähde</button>" + data_list+"<ul>";
	for (var i = 0; i < sources.length; i++) {
		var source = sources[i];
		var line_text = "<li class='source'>Lähde<button onclick=\"addSourceAttribute(event)\">Lisää attribuutti</button> <span class='deleteButton' onclick='deleteEtyAttr(event)'>X</span><ul>";
		for (item in source){
			line_text = line_text + "<li>Nimi: <input class='attribute' value='"+ item +"' list='sourceList' > Arvo: <input class='value' value='"+ source[item] + "'><span class='deleteButton' onclick='deleteEtyAttr(event)'>X</span></li>";
		}
		line_text = line_text + "</ul></li>";
		return_string = return_string + line_text;
	}
	return return_string + "</ul></div>";
}

function addSourceAttribute(event){
	var ul = event.target.parentElement.getElementsByTagName("UL")[0];
	var line = "<li>Nimi: <input class='attribute' value='' list='sourceList' > Arvo: <input class='value' value=''><span class='deleteButton' onclick='deleteEtyAttr(event)'>X</span></li>";
	var ele = HTMLtoDOM(line, "UL");
	ul.appendChild(ele);
}

function addSource(event){
	var ul = event.target.parentElement.getElementsByTagName("UL")[0];
	var line = "<li class='source'>Lähde<button onclick=\"addSourceAttribute(event)\">Lisää attribuutti</button> <span class='deleteButton' onclick='deleteEtyAttr(event)'>X</span><ul></ul></li>";
	var ele = HTMLtoDOM(line, "UL");
	ul.appendChild(ele);
}

function sourcesToJson(homonym){
	var sourceEdit = homonym.getElementsByClassName("sourcesEdit")[0];
	var sources = sourceEdit.getElementsByClassName("source");
	var s = [];
	for (var i = 0; i < sources.length; i++) {
		var source = sources[i];
		var s_dict = {}
		var listItems = source.getElementsByTagName("LI");
		for (var a = 0; a < listItems.length; a++) {
			var li = listItems[a];
			var name = li.getElementsByClassName("attribute")[0].value;
			var value = li.getElementsByClassName("value")[0].value;
			if(name==""){
				continue;
			}else{
				s_dict[name] = value;
			}
		}
		if(!isEmpty(s_dict)){
			s.push(s_dict);
		}
	}
	return s;
}

function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

function formFromLgXML(json, xmlTag, classPrefix){
	var return_string = "<div class='" +classPrefix+"_edit'><p><b>" +_(classPrefix) +"</b></p><button onclick='addetymologyWord(event, \""+ classPrefix +"\")'>Lisää kantasana</button>";
	try{
		var etym = json["morph"]["lg"][xmlTag];
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

		var html = "<div class='"+ classPrefix.substring(0,3) +"Entry'>Kantasana: <input class='"+ classPrefix.substring(0,3) +"Word' value='" + data + "'> Tyyppi: <input class='"+ classPrefix.substring(0,3) +"Type' value='" + etymology.tagName + "'><button onclick='addetymologyAttr(event, \"" +classPrefix+ "\")'>Lisää attribuutti</button><span class='deleteButton' onclick='deleteEtyWord(event)'>X</span><ul>";
		var attrs = etymology.attributes || [];
		for (var ii = 0; ii < attrs.length; ii++) {
			var attribute = attrs[ii];
			var datal = "";
			if(attribute.name == "Contlex"){
				datal = " list='ContLex_datalist' "
			}
			html = html + "<li>Nimi: <input class='"+ classPrefix.substring(0,3) +"Attr' value='" + attribute.name + "'> Arvo: <input "+ datal +" class='"+ classPrefix.substring(0,3) +"Value' value='" + attribute.value + "'><span class='deleteButton' onclick='deleteEtyAttr(event)'>X</span></li>"
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
	var row = "<td><input class='semantics_class'  list='semantics_datalist' value='"+  cl +"'></td><td><input class='semantics_value'  list='semantics_datalist' value='"+  val +"'></td><td class='deleteButton' onclick='deleteSemantics(event)'>X</td>";
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
	var row = "<tr><td><input class='translation_word' value='"+ word +"'></td><td><input class='translation_pos'  list='pos_datalist' value='"+  pos +"'></td><td class='deleteButton' onclick='deleteTranslation(event)'>X</td></tr>";
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

function addetymologyAttr(event, classPrefix){
	var list = event.target.parentElement.getElementsByTagName("UL")[0];
	var html = "<li>Nimi: <input class='"+ classPrefix.substring(0,3) +"Attr' value=''> Arvo: <input class='"+ classPrefix.substring(0,3) +"Value' value=''><span class='deleteButton' onclick='deleteEtyAttr(event)'>X</span></li>";
	var row = HTMLtoDOM(html, "UL");
	list.appendChild(row);
}

function addetymologyWord(event, classPrefix){
	var list = event.target.parentElement;
	var html = "<div class='"+ classPrefix.substring(0,3) +"Entry'>Kantasana: <input class='"+ classPrefix.substring(0,3) +"Word' value=''> Tyyppi: <input class='"+ classPrefix.substring(0,3) +"Type' value=''><button onclick='addetymologyAttr(event, \"" +classPrefix+ "\")'>Lisää attribuutti</button><span class='deleteButton' onclick='deleteEtyWord(event)'>X</span><ul></ul></div>";
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
				var entry = {"word": word, "pos": pos};
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
		if(!("sms2xml" in json)){
			json["sms2xml"] = {};
		}
		json["morph"]["lg"]["etymology"] = etymologyToXML(homonym);
		json["morph"]["lg"]["compg"] = compgToXML(homonym);
		json["morph"]["lg"]["stg"] = stgToXML(homonym);
		json["morph"]["map"] = morphDictEditToJsonData(homonym, "map");
		json["morph"]["element"] = morphDictEditToJsonData(homonym, "element");
		json["sms2xml"]["sources"] = sourcesToJson(homonym);

		jsons.push(json);
	}
	return jsons;

}

function morphDictEdit(json, classPrefix){
	var return_string = "<div class='morphEditor " + classPrefix + "_edit'><b>"+_(classPrefix)+"</b><br><button onclick='addetymologyAttr(event, \"" + classPrefix + "\")'>Lisää attribuutti</button><ul>";
	try{
	var dict = json["morph"][classPrefix];
	if(dict != undefined){
		for( var key in dict){
			var html = "<li>Nimi: <input class='"+ classPrefix.substring(0,3) +"Attr' value='"+key+"'> Arvo: <input class='"+ classPrefix.substring(0,3) +"Value' value='"+dict[key]+"'><span class='deleteButton' onclick='deleteEtyAttr(event)'>X</span></li>";
			var return_string = return_string + html;
		}
	}	
	} catch (e){
	}
	return return_string + "</ul></div>";

}
function morphDictEditToJsonData(homonym, classPrefix){
	var dict = {};
	var etymology = homonym.getElementsByClassName(classPrefix + "_edit")[0];
	var entries = etymology.getElementsByTagName("LI");
	for (var a = 0; a < entries.length; a++) {
			var listItem = entries[a];
			var attribute = listItem.getElementsByClassName(classPrefix.substring(0,3) +"Attr")[0].value;
			var value = listItem.getElementsByClassName(classPrefix.substring(0,3) +"Value")[0].value;
			if(attribute == ""){
				continue;
			}
			dict[attribute] = value;
	}
	return dict;


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
			var pos = translation["pos"];
			wiki = wiki + "\n* [["+language+":"+word+"|"+word+"]] ({{sms:POS_"+pos+"}})";
		}
		wiki = wiki + "\n</div>";
	}
	wiki = wiki + "\n</div>\n<span style=\"display:none\" class=\"json_data\">"+JSON.stringify(json);
	wiki = wiki + "\n</span>\n</div>\n----\n\n"

	return wiki;

}

function etymologyToXML(homonym){
	return lgToXML(homonym, "etymology", "etymon");
}

function compgToXML(homonym){
	return lgToXML(homonym, "compg", "comp");
}
function stgToXML(homonym){
	return lgToXML(homonym, "stg", "st");
}

function lgToXML(homonym, classPrefix, default_type){
	var xml = "<"+classPrefix+">\n"
	var etymology = homonym.getElementsByClassName(classPrefix + "_edit")[0];
	var entries = etymology.getElementsByClassName(classPrefix.substring(0,3) +"Entry");
	for (var i = 0; i < entries.length; i++) {
		var entry = entries[i];
		var word = entry.getElementsByClassName(classPrefix.substring(0,3) +"Word")[0].value;
		var type = entry.getElementsByClassName(classPrefix.substring(0,3) +"Type")[0].value;
		if(word == ""){
			continue;
		}
		if(type == ""){
			type = default_type;
		}
		var attributes = "";
		var attribute_list = entry.getElementsByTagName("LI");
		for (var a = 0; a < attribute_list.length; a++) {
			var listItem = attribute_list[a];
			var attribute = listItem.getElementsByClassName(classPrefix.substring(0,3) +"Attr")[0].value;
			var value = listItem.getElementsByClassName(classPrefix.substring(0,3) +"Value")[0].value;
			if(attribute == ""){
				continue;
			}
			attributes = attributes + " " + attribute + "=\"" + value + "\" ";
		}
		xml = xml + "<" + type + attributes + ">" + word +"</" + type + ">\n";
	}
	xml = xml + "</"+classPrefix+">";
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


function _(text){
	if(text in lokaali){
		return lokaali[text];
	}else{
		return text;
	}
}

var lokaali = {"etymology": "Etymologia", "compg": "Johtaminen", "element": "E-elementti", "map": "kartta"}

var datalist_data = {
	"ContLex" : ["A_" ,"A_AKKU" ,"A_ALUS" ,"A_ARMAS" ,"A_ARTELI" ,"A_BAHUV" ,"ADA_" ,"A-DEM_NÄMÄ" ,"ADV_" ,"ADV-INTERR-MANNER" ,"ADV-INTERR-SPAT-IS-ELA" ,"ADV-INTERR-SPAT-IS-INE" ,"ADV-IS-ELA-WITH-PXSG3" ,"ADV-MANNER" ,"ADV-SPAT" ,"ADV-SPAT-IS-ABL" ,"ADV-SPAT-IS-ADE" ,"ADV-SPAT-IS-ALL" ,"ADV-TEMP" ,"A_ENIN" ,"A_EX" ,"A_HARDIE" ,"A_HERY" ,"A_HUOLETOI" ,"A_HYVÄ" ,"A_HÄKKI" ,"A_IS-N-PL-GEN" ,"A_IS-N-SG-GEN" ,"A_JIÄTÖI" ,"A_JÄLGI" ,"A_KALA" ,"A_KANDAI" ,"A_KARJAL" ,"A_KARJALAINE" ,"A_KESTÄY" ,"A_KIELI" ,"A_KIELINE" ,"A_KOIRU" ,"A_KOIVU" ,"A_KONDII" ,"A_KUU" ,"A_KUURNIS" ,"A_LIYGILÄINE" ,"A_LÄMMIN" ,"A_MADAL" ,"A_MUARJU" ,"A_NAINE" ,"A_NIMI" ,"A_OLUT" ,"A_OSTAI" ,"A_OZA" ,"A_PAREMBI" ,"A_PEREH" ,"A_PESSYH" ,"A_PEZII" ,"A_PIIRAI" ,"A_PIÄ" ,"A_PUHTAHUS" ,"A_PÄIVY" ,"A_RAHMANNOI" ,"A_RAIŠ" ,"A_RUADO" ,"A_RUNO" ,"A_SALBOIN" ,"A_SUARI" ,"A_SÄYNÄ" ,"A_TAIGIN" ,"A_TOINE" ,"A_TOINE-PL" ,"A_TULLUT" ,"A_TUORES" ,"A_UNDECL" ,"A_VALGEI" ,"A_VAŽEN" ,"A_VEZI" ,"A_VUOZI" ,"CC_" ,"CS_" ,"INTERJ_" ,"N_" ,"N_AIGOMUS" ,"N_AKKU" ,"N_AKKU-PL" ,"N_AKKU-SG" ,"N_ALUS" ,"N_ALUS-PL" ,"N_ARMAS" ,"N_ARMAS-PL" ,"N_ARTELI" ,"N_ARTELI-PL" ,"N_ARTELI-SG" ,"N_AVUAJU" ,"N_BEMMEL" ,"N_DIÄDÖ" ,"N_HANGI" ,"N_HARDIE" ,"N_HARDIE-PL" ,"N-HUM_KALA" ,"N_HUOLETOI" ,"N_HÄKKI" ,"N_HÖRÖ" ,"N_HÖRÖ-SG" ,"N_IDY" ,"N_IDY-PL" ,"N_IDY-SG" ,"N_ILVES" ,"N_IŽÄNDY" ,"N_JOGI" ,"N_JÄLGI" ,"N_JÄLGI-PL" ,"N_KALA" ,"N_KALA-PL" ,"N_KALA-SG" ,"N_KANDAI" ,"N_KANDAI-PL" ,"N_KARJAL" ,"N_KARJALAINE" ,"N_KARJALAINE-PL" ,"N_KARJAL-PL" ,"N_KESTÄY" ,"N_KEVÄT" ,"N_KIELI" ,"N_KIELINE" ,"N_KIELINE-PL" ,"N_KIELI-PL" ,"N_KNIIGU" ,"N_KOIRU" ,"N_KOIRU-PL" ,"N_KOIRU-SG" ,"N_KOIVU" ,"N_KOIVU-PL" ,"N_KOIVU-SG" ,"N_KONDII" ,"N_KONDII-SG" ,"N_KUU" ,"N_KUU-PL" ,"N_KUURNIS" ,"N_KYNDÖ" ,"N_LAPSI" ,"N_LEIRI" ,"N_LEIRI-PL" ,"N_LIIKEH" ,"N_LIYGILÄINE" ,"N_LUGU" ,"N_LÄMMIN" ,"N_MADAL" ,"N_MEČČY" ,"N_MIES" ,"N_MUA" ,"N_MUAMO" ,"N_MUARJU" ,"N_MUARJU-PL" ,"N_MUARJU-SG" ,"N_NAINE" ,"N_NAINE-PL" ,"N_NIMI" ,"N_NIMI-PL" ,"N_NIMI-SG" ,"N_OLUT" ,"N_OLUT-PL" ,"N_OSTAI" ,"N_OZA" ,"N_OZA-PL" ,"N_OZA-SG" ,"N_PADA" ,"N_PAGIZII" ,"N_PAIMEN" ,"N_PAPPI" ,"N_PAPPI-PL" ,"N_PAREMBI-PL" ,"N_PENGER" ,"N_PEREH" ,"N_PEREH-PL" ,"N_PEREH-SG" ,"N_PESSYH" ,"N_PEZII" ,"N_PEZII-PL" ,"N_PIENAR" ,"N_PIIRAI" ,"N_PIIRAI-PL" ,"N_PIÄ" ,"N_PUHTAHUS" ,"N_PUHTAHUS-SG" ,"N_PÄIVY" ,"N_PÄIVY-PL" ,"N_PÖČÖI" ,"N_RAIŠ" ,"N_REBOI" ,"N_REBOI-PL" ,"N_RUADO" ,"N_RUADO-PL" ,"N_RUNO" ,"N_RUNO-PL" ,"N_RUNO-SG" ,"N_SALBOIN" ,"N_SALBOIN-PL" ,"N_SAMMAL" ,"N_SAMMUTIN" ,"N_SIEMEN" ,"N_SIEMEN-PL" ,"N_SIVE" ,"N_SIVE-PL" ,"N_ŠOUFER" ,"N_SUALIŠ" ,"N_SUARI-PL" ,"N_SULGU" ,"N_SUO" ,"N_SUURIM" ,"N_SUZI" ,"N_SYGYZY" ,"N_SÄYNÄ" ,"N_TAIGIN" ,"N_TOINE" ,"N_TUATANDIM" ,"N_TUATINDAM" ,"N_TUATTO" ,"N_TUHAT" ,"N_UDAR" ,"N_UKSI" ,"NUM_" ,"NUM_KAKSI" ,"NUM_KOLME" ,"NUM_KUUZI" ,"NUM_KYMMENE" ,"NUM_MUARJU" ,"NUM_NELLI" ,"NUM_OZA" ,"NUM_SEIČČIE" ,"NUM_TUHAT" ,"NUM_VIIZI" ,"NUM_YKSI" ,"N_VALGEI" ,"N_VALGEI-PL" ,"N_VANUIN" ,"N_VANUIN-PL" ,"N_VARVAS" ,"N_VASKIČČU" ,"N_VEZI" ,"N_VUOZI" ,"N_VYÖ" ,"ORD_" ,"ORD_01_BACK" ,"ORD_01_FRONT" ,"ORD_KARJALAINE" ,"ORD_TOINE" ,"PCLE_" ,"PERS_" ,"PERS-PL1" ,"PERS-PL2" ,"PERS-PL3" ,"PERS-SG1" ,"PERS-SG2" ,"PERS-SG3" ,"PO_" ,"PO-GOV/ILL_" ,"PO_KARJALAINE" ,"PO_KIELINE" ,"PREP_" ,"PRON_" ,"PRON_ARMAS" ,"PRON-DEM_NET" ,"PRON-DEM_NÄMMÄ" ,"PRON-INDEF_NIKEN" ,"PRON-INDEF_NIMI" ,"PRON-INTERR_" ,"PRON-INTERR_KARJALAINE" ,"PRON-INTERR_KEN" ,"PRON-INTERR_MI" ,"PRON_KAI" ,"PRON_KARJALAINE" ,"PRON_KIELINE" ,"PRON_OZA" ,"PRON-QNT_KIELI" ,"PRON-REFL_" ,"PRON-REFL_IS-SG-PAR" ,"PRON-REL_KUDAI" ,"PRON_SE" ,"PRON_TOINE" ,"PRON_TÄMÄ" ,"PROP_ALUS" ,"PROP_ARTELI" ,"PROP_JÄLGI" ,"PROP_KALA" ,"PROP_KARJAL" ,"PROP_KARJALAINE" ,"PROP_KIELINE" ,"PROP_KOIRU" ,"PROP_KOIVU" ,"PROP_KONDII" ,"PROP_MUARJU" ,"PROP_NIMI" ,"PROP_OZA" ,"PROP_OZA_FEM" ,"PROP_PAPPI" ,"PROP_PEREH" ,"PROP-PLC_AKKU" ,"PROP-PLC_ALUS" ,"PROP-PLC_KALA" ,"PROP-PLC_KNIIGU" ,"PROP-PLC_KOIRU" ,"PROP-PLC_KOIVU" ,"PROP-PLC_KONDII" ,"PROP-PLC_MUARJU" ,"PROP-PLC_MUARJU-PL" ,"PROP-PLC_OZA" ,"PROP-PLC_PAPPI" ,"PROP-PLC_RUADO" ,"PROP-PLC_TAIGIN" ,"PROP-PLC_TVER" ,"PROP_PÄIVY" ,"PROP_REBOI" ,"PROP_RUADO" ,"PROP_RUNO" ,"PROP_RUS-IN_SUR" ,"PROP_RUS-VIČ_PATR" ,"PROP_RUS-V_SUR" ,"PROP_SUARI" ,"PROP_TAIGIN" ,"PROP_VALGEI" ,"PROP_VIDEL" ,"QNT_" ,"QNT-ITER" ,"V_" ,"V_ALETA" ,"V_ALLATA" ,"V_ARVOTA" ,"V_AVATA" ,"V_BAUHUTA" ,"V_BAUHUTA-SG3" ,"V_BÖVVÄTÄ" ,"V_EČČIE" ,"V_ELLENDIÄ" ,"V_EMÄNDÖIJÄ" ,"V_HEITTIÄ" ,"V_HEITTIÄ-3" ,"V_HEITTIÄ-SG3" ,"V_HYRRÄTÄ" ,"V_HÄVITÄ" ,"V_HÖPSÖTÄ" ,"V_HÖYRYTÄ" ,"V_IMIE" ,"V_JIÄJÄ" ,"V_JUOSTA_BACK" ,"V_JUVVA" ,"V_KABLITA" ,"V_KANDUA" ,"V_KIKOTA" ,"V_KUULTA" ,"V_KUULTA-SG3" ,"V_KÄITÄ" ,"V_KÄVVÄ" ,"V_LANGETA" ,"V_LUGIE" ,"V_MAINITA" ,"V_MERKITÄ" ,"V_MYVVÄ" ,"V-NEG" ,"V_NOSTA" ,"V_NÄHTÄ" ,"V_OLLA" ,"V_OTTUA" ,"V_OTTUA-3" ,"V_OTTUA-SG3" ,"V_PAISTA" ,"V_PESTÄ" ,"V_PIDIÄ" ,"V_PIDIÄ-SG3" ,"V_POTKIE" ,"V_POTKIE-SG3" ,"V-PROH" ,"V_PUNUO" ,"V_PUNUO-SG3" ,"V_PYZYÖ" ,"V_PYZYÖ-3" ,"V_PYZYÖ-SG3" ,"V_PÄITÄ" ,"VR_AMBUO" ,"VR_AVATA" ,"VR_EMÄNDÖIJÄ" ,"V_REVITÄ" ,"VR_IMIE" ,"VR_JUVVA" ,"VR_KANDUA" ,"VR_KANDUA-SG3" ,"VR_MAINITA" ,"VR_MYVVÄ" ,"VR_NÄHTÄ" ,"V_ROIJA" ,"VR_PESTÄ" ,"VR_PIDIÄ" ,"VR_POTKIE" ,"VR_PUNUO" ,"VR_RODIEKSEH" ,"VR_ROIJA" ,"VR_ROITA" ,"VR_SUVAIJA" ,"VR_TULLA" ,"V_RUVETA" ,"V_RUVETA-SG3" ,"VR_VALUO" ,"V_SUAJA" ,"V_SUATA" ,"V_SUVAIJA" ,"V_SUVAIJA-3" ,"V_SUVAIJA-SG3" ,"V_SUVATA" ,"V_TULLA" ,"V_TYPÄTÄ" ,"V_ULISTA" ,"V_VALUO" ,"V_VALUO-SG3" ,"V_VIERTÄ" ,"V_VIIJÄ" ,"V_VOIJA" ,"V_VÄHETÄ" ,"V_VÄHETÄ-SG3", "A_" ,"A_AACCIKH" ,"A_AANAR" ,"A_ALGG" ,"A_AQKHKHED" ,"A-ATTR_" ,"A_AUTT" ,"AB-DOT-A_" ,"AB-DOT-ADV_" ,"AB-DOT-N_" ,"AB-DOT-NUM_" ,"AB-DOT-PRON_" ,"AB-DOT-V-IV-IND-PRT-SG3_" ,"AB-DOT-V-TV-IMPRT-SG2_" ,"AB-DOT-V-TV-IND-PRS-3_" ,"AB-NO-DOT-N_" ,"A_CHAAQCC" ,"A_CHUEAQCKHES" ,"A_CHUEQDHES" ,"A_CHUOSHKK" ,"ADP_" ,"ADP-GOV-LOC_" ,"ADV_" ,"ADV-SPAT_" ,"ADV-STATE_" ,"ADV-TEMP_" ,"A_FIINYS" ,"A_HAAQSKH" ,"A_IS_ADJ-DER/COMP_ab" ,"A_IS_ADJ-DER/COMP_aeaeb" ,"A_IS_ADJ-DER/COMP_kwlmmsab" ,"A_IS_ADJ-DER/SUPERL_mws" ,"A_IS_ADJ-DER/SUPERL_ummus" ,"A_JAELLASH" ,"A_JAUQRR" ,"A_JEAQNNN" ,"A_JEAQRMM" ,"A_JIOQNNI" ,"A_JOOSKYS" ,"A_JUURD" ,"A_KAAMMI" ,"A_KAAQLLES" ,"A_KAAQMES" ,"A_KAQLBB" ,"A_KHEEQLES" ,"A_KHEQRJJ" ,"A_KOALVAK" ,"A_KOAOADDAS" ,"A_KOAOAVAS" ,"A_KOAQSHKHES" ,"A_KOBDDI" ,"A_KOODDYS" ,"A_KUALAZH" ,"A_KUEAQTT" ,"A_KUEQLL" ,"A_KUOCC" ,"A_LIEQDHDHDHI" ,"A_MEERSAZH" ,"A_MIYRKK" ,"A_MOASHSHAD" ,"A_MOOCHCHYS" ,"A_MUEQRJJ" ,"A_MUORR" ,"A_NALLSHEM" ,"A_NUQBB" ,"A_OODHYS" ,"A_PAERRAI" ,"A_PAPP" ,"A_PEIQVV" ,"A_PESS" ,"A_PIIUTYS" ,"A_PLAAN" ,"A_PRSPRC-EEI" ,"A_PRSPRC-VCC-AI" ,"A_PRSPRC-VCC-I" ,"A_PRSPRC-VVCC-AI" ,"A_PRSPRC-VVCC-I" ,"A_PRSPRC-VVKK-AI" ,"A_PRSPRC-VVKK-I" ,"A_PRSPRC-VWCC-AI" ,"A_PRSPRC-VWCCC-AI" ,"A_PRSPRC-VWCC-I" ,"A_PRSPRC-VWKK-AI" ,"A_PRSPRC-VWKK-I" ,"A_PRSPRC-VWXYY-AI" ,"A_PRSPRC-VWXYY-I" ,"A_PRSPRC-VXYY-AI" ,"A_PRSPRC-VXYY-I" ,"A_PSS-PRFPRC" ,"A_PUAQRES" ,"A_RADIO" ,"A_RUODDYS" ,"A_SAAQMM" ,"A_SAELTTAI" ,"A_SAJOS" ,"A_SEQTT" ,"A_SHIYLGGYD" ,"A_SUEAQKHKH" ,"A_TOBDDSALLASH" ,"A_TOLL" ,"A_TUOVYS" ,"A_UQCC" ,"A_VAALMYSH" ,"A_VAEAEZHZH" ,"A_VAEQLL" ,"A_VEEIDAS" ,"A_VISKKYD" ,"A_VOONYS" ,"A_VUOIVYS" ,"CC_" ,"CS_" ,"CS-TEMP_" ,"DET_" ,"DET_AANAR" ,"DET_KHEEQLES" ,"DET_NUQBB" ,"DET-SHORTDEM_" ,"INTERJ_" ,"IV_AAIQJLDED" ,"IV_AALGXTED" ,"IV_AGSTED" ,"IV_AIBBYD" ,"IV_AUQCSTED" ,"IV_CEAKKKAD" ,"IV_CEAQLKHKHED" ,"IV_CEQPCCED" ,"IV_CHIEQKHRDED" ,"IV_CHIISTYD" ,"IV_CHIOHTTYD" ,"IV_CHIOKKYD" ,"IV_DOOIDYD" ,"IV_HEARRAD" ,"IV_HUOLLYD" ,"IV_JAELSTED" ,"IV_JEAELSTED" ,"IV_JIEAQLLED" ,"IV_JOAQTTED" ,"IV_JOARGXSTED" ,"IV_JUEQKHKHED" ,"IV_JUQRDDED" ,"IV_KAAQKHKHED" ,"IV_KAEIGGSHED" ,"IV_KAQDDED" ,"IV_KAQRJSTED" ,"IV_KHEEQRJTED" ,"IV_KHEQTTED" ,"IV_KHIOCHCHCHYD" ,"IV_KHIORGGNED" ,"IV_KOAQCCED" ,"IV_KOAQMRDED" ,"IV_KUADHDHDHJED" ,"IV_KUAEIVVAD" ,"IV_KUAESTTAD" ,"IV_KUEQDDDED" ,"IV_KULSTED" ,"IV_KUOCCJED" ,"IV_KUOSKKYD" ,"IV_LAADDYD" ,"IV_LAEULLAD" ,"IV_LAQDDED" ,"IV_LAUKKOOLLYD" ,"IV_LEEQD" ,"IV_LEKKAD" ,"IV_LEPPAD" ,"IV_LEUQKHKHED" ,"IV_LIEQDHDHED" ,"IV_LOAQNSTED" ,"IV_LUYDDDAD" ,"IV_MAINSTED" ,"IV_MAQHSSED" ,"IV_MEAQTTED" ,"IV_MEINNAD" ,"IV_MUQTTED" ,"IV_NJAQDSTED" ,"IV_NJAQMMSHED" ,"IV_NUOLSTED" ,"IV_OHTTYD" ,"IV_PIEAQKHKHED" ,"IV_PIOGGGYD" ,"IV_PIYSSYD" ,"IV_PLIYSNYD" ,"IV_POAGXSTED" ,"IV_POAHSSAD" ,"IV_POAOASSAD" ,"IV_POOLLYD" ,"IV_PUEAQTTED" ,"IV_PUQHTTED" ,"IV_REAEKKAD" ,"IV_RIOKKKYD" ,"IV_RIYDDDYD" ,"IV_ROVVYD" ,"IV_SARNNAD" ,"IV_SHKUEAQTTED" ,"IV_SHORRNED" ,"IV_SILTTEED" ,"IV_SKHIYNHKKYD" ,"IV_SLUUZHYD" ,"IV_SOLLAQTTED" ,"IV_SOLLEED" ,"IV_STOAOARJED" ,"IV_SUIQTTED" ,"IV_SUOAPPYD" ,"IV_SUUDYD" ,"IV_TAARBSHED" ,"IV_TAIQDDED" ,"IV_TEEQMEED" ,"IV_TEEVVAD" ,"IV_TEYPSTED" ,"IV_TIEQTTED" ,"IV_TOBDDYD" ,"IV_UQVDDED" ,"IV_VEAQDDDED" ,"IV_VEYHSSAD" ,"IV_VIIKKYD" ,"IV_VOQLLJED" ,"IV_VOQLLJED-SG3" ,"IV_VUAGGGAD" ,"IV_VUAQDHSTED" ,"IV_VUAQPSTED" ,"IV_VUEAIQNNED" ,"IV_VUEAQDHDHED" ,"IV_VUEJTED" ,"IV_VUEQHSSED" ,"IV_VUEQRDDED" ,"IV_VUOIDDYD" ,"N_" ,"N2A_LUOQSSI" ,"N_AACCIKH" ,"N_AANAR" ,"N_AAQRESHM" ,"N_AAUTYR" ,"N_AELDD" ,"N_AIHAM" ,"N_AKK" ,"N_ALGG" ,"N_ALGG-PL" ,"N-ALLEGRO_ATTESTED-NOUN-STEM" ,"N_AQKHKH" ,"N_AQKHKHED" ,"N_AQVV" ,"N_ARGUMEQNTT" ,"N_ATOM" ,"N_AUTT" ,"N_AUTT-PL" ,"N_BIEQSS" ,"N_BIOLOGIA" ,"N_BIOLOOG" ,"N_CEERKAV" ,"N_CHAAQCC" ,"N_CHAAQCC-PL" ,"N_CHEE" ,"N_CHEEUQRES" ,"N_CHIISTI" ,"N_CHOOGXGXYS" ,"N_CHUAECC" ,"N_CHUAQRVV" ,"N_CHUEQDHES" ,"N_CHUOSHKK" ,"N_CHUOSHKK-PL" ,"N_CHUQKHKH" ,"N_CHUYGXGXAS" ,"N_CHUYNJ" ,"N_CHUYR" ,"N_CHYYQDH" ,"N_CIEAQKHKHES" ,"N_COOGGYLM" ,"N_CUYBB" ,"N_DIQLL" ,"N_EEQKHKH" ,"N_ENERGII" ,"N_EQCHCH" ,"N_EVANHGHEQLIUM" ,"N_HAAQSKH" ,"N_HEAVASH" ,"N_HOQPPI" ,"N_HYPOTEEQS" ,"N_IILYSKH" ,"N_JARPLAAN" ,"N_JAUQRR" ,"N_JEAQKHKHKHAAZH" ,"N_JEAQNNN" ,"N_JEAQRMM" ,"N_JEAQRMM-PL" ,"N_JEEQEL" ,"N_JUQVJJ" ,"N_JUURD" ,"N_JUYGXGXAS" ,"N_KAADDYSHKH" ,"N_KAADHNEKH" ,"N_KAAMMI" ,"N_KAAQFF" ,"N_KAAQLLES" ,"N_KAAQRBES" ,"N_KAAV" ,"N_KAQLBB" ,"N_KHEEQLES" ,"N_KHEEQSTES" ,"N_KHEQDD" ,"N_KHEQMNN" ,"N_KHEQRJJ" ,"N_KHEYLGXAL" ,"N_KHIEQMNN" ,"N_KHIIUGXYN" ,"N_KHIOJJ" ,"N_KHIOTKYM" ,"N_KLAAQDD" ,"N_KOAHTT" ,"N_KOALVAK" ,"N_KOAOADDARV" ,"N_KOAOADDAS" ,"N_KOAOAVAS" ,"N_KOODDYS" ,"N_KOODH" ,"N_KOONJYL" ,"N_KOONTYR" ,"N_KRIQLCC" ,"N_KUAEIVAS" ,"N_KUALAZH" ,"N_KUEAQTT" ,"N_KUEQDDELM" ,"N_KUEQLL" ,"N_KUEQSSS" ,"N_KUOADHYS" ,"N_KUOLBYN" ,"N_KUQMPP" ,"N_KUQRCHCH" ,"N_KUQV3H3H" ,"N_KUSS" ,"N_LAAIQJ" ,"N_LAAJJ" ,"N_LAAUR" ,"N_LAEAEMPA" ,"N_LAQB3H3H" ,"N_LIEQDHDHDHI" ,"N_LIOV" ,"N_LOAQDD" ,"N_LOAQDD-PL" ,"N_LUEQM" ,"N_LUOSS" ,"N_LUUBBYL" ,"N_LUUKK" ,"N_LYYJJ" ,"N_MAADD" ,"N_MAAIQLM" ,"N_MAEAEN" ,"N_MAINSTUMMUSH" ,"N_MEER" ,"N_MEERSAZH" ,"N_MIEAQRR" ,"N_MIEQLKHKH" ,"N_MIEQLLL" ,"N_MILJONAAQR" ,"N_MIOHTT" ,"N_MIYRKK" ,"N_MOOTTOR" ,"N_MUEQRJJ" ,"N_MUOARD" ,"N_MUORR" ,"N_MUORR-PL" ,"N_MUORYZH" ,"N_MUOTT" ,"N_MUU3" ,"N_NALLSHEM" ,"N_NAQZVAANASH-PL" ,"N_NEAVVV" ,"N_NEAVVV-PL" ,"N_NEUQLL" ,"N_NIJDD" ,"N_NJOORGX" ,"N_NJUAEQMMEL" ,"N_NJUUQNN" ,"N_NUEAQJJ" ,"N_NUQBB" ,"N_NUQKHKHESH" ,"N_NYYQER" ,"N_OAOAUM" ,"N_OAQVES" ,"N_OASKK" ,"N_OOUMAZH" ,"N_PAAQJJ" ,"N_PAARHOAQD" ,"N_PAARR" ,"N_PAEAELKAS" ,"N_PAIQKHKH" ,"N_PAPP" ,"N_PAPP-PL" ,"N_PEAELDD" ,"N_PEIGG" ,"N_PEIQVV" ,"N_PEIQVV-PL" ,"N_PEQLLJ" ,"N_PESS" ,"N_PESS-PL" ,"N_PIEAQSS" ,"N_PIIDH" ,"N_PIISSUZH" ,"N_PIIUTYS" ,"N_PIYNNAI" ,"N_PLAAN" ,"N_PLEYN" ,"N_POOUS" ,"N_PRSPRC-EEI" ,"N_PRSPRC-VCC-AI" ,"N_PRSPRC-VCC-I" ,"N_PRSPRC-VVCC-AI" ,"N_PRSPRC-VVCC-I" ,"N_PRSPRC-VVKK-AI" ,"N_PRSPRC-VVKK-I" ,"N_PRSPRC-VWCC-AI" ,"N_PRSPRC-VWCCC-AI" ,"N_PRSPRC-VWCC-I" ,"N_PRSPRC-VWKK-AI" ,"N_PRSPRC-VWKK-I" ,"N_PRSPRC-VWXYY-AI" ,"N_PRSPRC_VWXYY-I" ,"N_PRSPRC-VWXYY-I" ,"N_PRSPRC-VXYY-AI" ,"N_PRSPRC-VXYY-I" ,"N_PUA33" ,"N_PUAQRES" ,"N_PUAQRES-PL" ,"N_PUOADH" ,"N_PUOAVV" ,"N_PUYGXGX" ,"N_PYYGG" ,"N_RADIO" ,"N_RAEAEKK" ,"N_RIIKK" ,"N_RUOCCC" ,"N_RUODDYS" ,"N_RUOIDD" ,"N_RUQHSS" ,"N_SAAKK" ,"N_SAAQMM" ,"N_SAAQMM-PL" ,"N_SAAQVESKH" ,"N_SAIQMM" ,"N_SAJOS" ,"N_SAJOS-PL" ,"N_SAQPPLEEJAZH" ,"N_SAQPPLI" ,"N_SEEUQTER" ,"N_SEQTT" ,"N_SHLAAJJ" ,"N_SHOOMM" ,"N_SHUOABYRJ" ,"N_SIEQM" ,"N_SIIVALM" ,"N_SIJDD" ,"N_SIJDD-PL" ,"N_SIOM" ,"N_SIYKKK" ,"N_SOAOABBAR" ,"N_SOOUS" ,"N_STAQLLJ" ,"N_STROOIQTEL" ,"N_STUUQL" ,"N_SUEAQKHKH" ,"N_SUEIQNN" ,"N_SUEQJJ" ,"N_SUOL" ,"N_SUQVDDI" ,"N_SUYL" ,"N_SYSTEEQM" ,"N_TAALKYS" ,"N_TAQHTT" ,"N_TEQKSTT" ,"N_TEYLKK" ,"N_TOLL" ,"N_TOLL-PL" ,"N_TRUUBA" ,"N_TUOAIMM" ,"N_TUODDYR" ,"N_TUOVYS" ,"N_TUYJJ" ,"NUM_" ,"NUM_ALGG" ,"NUM_AUTT" ,"NUM_KUEQHTT" ,"NUM_KUEQLL" ,"NUM_LO" ,"NUM_LOAOAI" ,"NUM_NELLJ" ,"NUM-ORD_NEELLJAD" ,"NUM_PAPP" ,"NUM_TOLL" ,"NUM_VAHTT" ,"N_UUQREZH" ,"N_VAEAEZHZH" ,"N_VAEQLL" ,"N_VAHTT" ,"N_VEEQREST" ,"N_VEEVAR" ,"N_VISKKYD" ,"N_VOONYS" ,"N_VUAQPPPES" ,"N_VUEAEQDDES" ,"N_VUEAIQVV" ,"N_VUEQN" ,"N_VUEQSS" ,"N_VUOIQNNI" ,"N_VUOIVYS" ,"N_VUONJYL" ,"N_VUYHSS" ,"N_VUYPPPAI" ,"N_VUYRR" ,"N_ZEEQTT" ,"N_ZHEEVAI" ,"ORD_" ,"PCLE_" ,"PO_" ,"PREFIX/A_" ,"PRON_" ,"PRON-INDEF_" ,"PRON-INTERR_" ,"PRON-PERS_" ,"PRON-PERS-DU1_" ,"PRON-PERS-DU2_" ,"PRON-PERS-DU3_" ,"PRON-PERS-PL1_" ,"PRON-PERS-PL2_" ,"PRON-PERS-PL3_" ,"PRON-PERS-SG1_" ,"PRON-PERS-SG2_" ,"PRON-PERS-SG3_" ,"PRON_PUK" ,"PRON-QNT_" ,"PRON-REFL_" ,"PRON-REFL-PL1-LOC_" ,"PRON-REFL-PL2-LOC_" ,"PRON-REFL-PL3-LOC_" ,"PRON-REFL-SG1-COM_" ,"PRON-REFL-SG1-ILL_" ,"PRON-REFL-SG1-LOC_" ,"PRON-REFL-SG2-LOC_" ,"PRON-REFL-SG3-LOC_" ,"PRON-REFL-SG-NOM_" ,"PRON-REL_" ,"PRON-SPAT-PL1-ILL_" ,"PRON-SPAT-SG1-ILL_" ,"PRON-SPAT-SG1-LOC_" ,"PRON-SPAT-SG3-ILL_" ,"PRON-SPAT-SG3-LOC_" ,"PROP_" ,"PROP_AANAR" ,"PROP_ALGG" ,"PROP_BIOLOGIA" ,"PROP_JARPLAAN" ,"PROP_KAQLBB" ,"PROP_KHEQRJJ" ,"PROP_KUALAZH" ,"PROP_MEERSAZH" ,"PROP_PEIQVV" ,"PROP_PRSPRC-VXYY-I" ,"PROP_RADIO" ,"PROP_SAJOS" ,"PROP_SEM/FEM_" ,"PROP_SEM/FEM_AACCIKH" ,"PROP_SEM/FEM_AANAR" ,"PROP_SEM/FEM_AELDD" ,"PROP_SEM/FEM_DIQLL" ,"PROP_SEM/FEM_HOQPPI" ,"PROP_SEM/FEM_IILYSKH" ,"PROP_SEM/FEM_JIQLSSI" ,"PROP_SEM/FEM_KAQLBB" ,"PROP_SEM/FEM_KUALAZH" ,"PROP_SEM/FEM_MEERSAZH" ,"PROP_SEM/FEM_NIJDD" ,"PROP_SEM/FEM_OAQLGA" ,"PROP_SEM/FEM_PEQLLJ" ,"PROP_SEM/FEM_SAQPPLI" ,"PROP_SEM/FEM_SINIDA" ,"PROP_SEM/FEM_VAEQLL" ,"PROP_SEM/MAL_" ,"PROP_SEM/MAL_AACCIKH" ,"PROP_SEM/MAL_AANAR" ,"PROP_SEM/MAL_ALGG" ,"PROP_SEM/MAL_ATOM" ,"PROP_SEM/MAL_DIQLL" ,"PROP_SEM/MAL_JIQLSSI" ,"PROP_SEM/MAL_JUEQLGHGH" ,"PROP_SEM/MAL_KAQLBB" ,"PROP_SEM/MAL_KOALVAK" ,"PROP_SEM/MAL_KRIQLCC" ,"PROP_SEM/MAL_KUALAZH" ,"PROP_SEM/MAL_LUUBBYL" ,"PROP_SEM/MAL_MEERSAZH" ,"PROP_SEM/MAL_OAQLGA" ,"PROP_SEM/MAL_PESS" ,"PROP_SEM/MAL_PIISSUZH" ,"PROP_SEM/MAL_PLAAN" ,"PROP_SEM/MAL_SAIQMM" ,"PROP_SEM/MAL_SAJOS" ,"PROP_SEM/MAL_SAQPPLI" ,"PROP_SEM/MAL_SOAOABBAR" ,"PROP_SEM/MAL_VAEQLL" ,"PROP_TOP_" ,"PROP_TOP_AANAR" ,"PROP_TOP_ALGG" ,"PROP_TOP_ATOM" ,"PROP_TOP_CHUOSHKK" ,"PROP_TOP_JAUQRR" ,"PROP_TOP_JEAQRMM" ,"PROP_TOP_JUEQLGHGH" ,"PROP_TOP_KAQLBB" ,"PROP_TOP_KOALVAK" ,"PROP_TOP_KUALAZH" ,"PROP_TOP_KUEQLL" ,"PROP_TOP_KUSS" ,"PROP_TOP_LUUBBYL" ,"PROP_TOP_MAADD" ,"PROP_TOP_MUORR" ,"PROP_TOP_PAARR" ,"PROP_TOP_PAPP" ,"PROP_TOP_PESS" ,"PROP_TOP_PLAAN" ,"PROP_TOP_PUOAVV" ,"PROP_TOP_RUOCCC" ,"PROP_TOP_SAAQMM" ,"PROP_TOP_SAJOS" ,"PROP_TOP_SIJDD" ,"PROP_TOP_SUYL" ,"PROP_TOP_TOLL" ,"PROP_TOP_TRUUBA" ,"PROP_TOP_TUODDYR" ,"PROP_TOP_UHSS" ,"PROP_TOP_VAQLL" ,"PROP_TOP_VUEAIQVV" ,"TV_AAIQJLDED" ,"TV_AALGXTED" ,"TV_AGSTED" ,"TV_AIBBYD" ,"TV_AUQCSTED" ,"TV_CEAKKKAD" ,"TV_CEAQLKHKHED" ,"TV_CEQPCCED" ,"TV_CHIEQKHRDED" ,"TV_CHIISTYD" ,"TV_CHIOHTTYD" ,"TV_CHIOKKYD" ,"TV_DOOIDYD" ,"TV_HEARRAD" ,"TV_HUOLLYD" ,"TV_JAELSTED" ,"TV_JEAELSTED" ,"TV_JIEAQLLED" ,"TV_JOAQTTED" ,"TV_JOARGXSTED" ,"TV_JUEQKHKHED" ,"TV_JUQRDDED" ,"TV_KAAQKHKHED" ,"TV_KAEIGGSHED" ,"TV_KAQDDED" ,"TV_KAQRJSTED" ,"TV_KHEEQRJTED" ,"TV_KHEQTTED" ,"TV_KHIOCHCHCHYD" ,"TV_KHIORGGNED" ,"TV_KOAQCCED" ,"TV_KOAQMRDED" ,"TV_KUADHDHDHJED" ,"TV_KUAEIVVAD" ,"TV_KUAESTTAD" ,"TV_KUEQDDDED" ,"TV_KULSTED" ,"TV_KUOCCJED" ,"TV_KUOSKKYD" ,"TV_LAADDYD" ,"TV_LAEULLAD" ,"TV_LAQDDED" ,"TV_LAUKKOOLLYD" ,"TV_LEEQD" ,"TV_LEKKAD" ,"TV_LEPPAD" ,"TV_LEUQKHKHED" ,"TV_LIEQDHDHED" ,"TV_LOAQNSTED" ,"TV_LUYDDDAD" ,"TV_MAINSTED" ,"TV_MAQHSSED" ,"TV_MEAQTTED" ,"TV_MEINNAD" ,"TV_MUQTTED" ,"TV_NJAQDSTED" ,"TV_NJAQMMSHED" ,"TV_NUOLSTED" ,"TV_OHTTYD" ,"TV_PIEAQKHKHED" ,"TV_PIOGGGYD" ,"TV_PIYSSYD" ,"TV_PLIYSNYD" ,"TV_POAGXSTED" ,"TV_POAHSSAD" ,"TV_POAOASSAD" ,"TV_POOLLYD" ,"TV_PUEAQTTED" ,"TV_PUQHTTED" ,"TV_REAEKKAD" ,"TV_RIOKKKYD" ,"TV_RIYDDDYD" ,"TV_ROVVYD" ,"TV_SARNNAD" ,"TV_SHKUEAQTTED" ,"TV_SHORRNED" ,"TV_SILTTEED" ,"TV_SKHIYNHKKYD" ,"TV_SLUUZHYD" ,"TV_SOLLAQTTED" ,"TV_SOLLEED" ,"TV_STOAOARJED" ,"TV_SUIQTTED" ,"TV_SUOAPPYD" ,"TV_SUUDYD" ,"TV_TAARBSHED" ,"TV_TAIQDDED" ,"TV_TEEQMEED" ,"TV_TEEVVAD" ,"TV_TEYPSTED" ,"TV_TIEQTTED" ,"TV_TOBDDYD" ,"TV_UQVDDED" ,"TV_VEAQDDDED" ,"TV_VEYHSSAD" ,"TV_VIIKKYD" ,"TV_VOQLLJED" ,"TV_VOQLLJED-SG3" ,"TV_VUAGGGAD" ,"TV_VUAQDHSTED" ,"TV_VUAQPSTED" ,"TV_VUEAIQNNED" ,"TV_VUEAQDHDHED" ,"TV_VUEJTED" ,"TV_VUEQHSSED" ,"TV_VUEQRDDED" ,"TV_VUOIDDYD" ,"V_" ,"V_AAIQJLDED" ,"V_AALGXTED" ,"V_AGSTED" ,"V_AIBBYD" ,"V_AUQCSTED" ,"V_CEAKKKAD" ,"V_CEAQLKHKHED" ,"V_CEQPCCED" ,"V_CHIEQKHRDED" ,"V_CHIISTYD" ,"V_CHIOHTTYD" ,"V_CHIOKKYD" ,"V_DOOIDYD" ,"V_HEARRAD" ,"V_HUOLLYD" ,"V_JAELSTED" ,"V_JEAELSTED" ,"V_JIEAQLLED" ,"V_JOAQTTED" ,"V_JOARGXSTED" ,"V_JUEQKHKHED" ,"V_JUQRDDED" ,"V_KAAQKHKHED" ,"V_KAEIGGSHED" ,"V_KAQDDED" ,"V_KAQRJSTED" ,"V_KHEEQRJTED" ,"V_KHEQTTED" ,"V_KHIOCHCHCHYD" ,"V_KHIORGGNED" ,"V_KOAQCCED" ,"V_KOAQMRDED" ,"V_KUADHDHDHJED" ,"V_KUAEIVVAD" ,"V_KUAESTTAD" ,"V_KUEQDDDED" ,"V_KULSTED" ,"V_KUOCCJED" ,"V_KUOSKKYD" ,"V_LAADDYD" ,"V_LAEULLAD" ,"V_LAQDDED" ,"V_LAUKKOOLLYD" ,"V_LEEQD" ,"V_LEKKAD" ,"V_LEPPAD" ,"V_LEUQKHKHED" ,"V_LIEQDHDHED" ,"V_LOAQNSTED" ,"V_LUYDDDAD" ,"V_MAINSTED" ,"V_MAQHSSED" ,"V_MEAQTTED" ,"V_MEINNAD" ,"V_MUQTTED" ,"V-NEG_" ,"V-NEG_IJ" ,"V_NJAQDSTED" ,"V_NJAQMMSHED" ,"V_NUOLSTED" ,"V_OHTTYD" ,"V_PIEAQKHKHED" ,"V_PIOGGGYD" ,"V_PIYSSYD" ,"V_PLIYSNYD" ,"V_POAGXSTED" ,"V_POAHSSAD" ,"V_POAOASSAD" ,"V_POOLLYD" ,"V_PUEAQTTED" ,"V_PUQHTTED" ,"V_REAEKKAD" ,"V_RIOKKKYD" ,"V_RIYDDDYD" ,"V_ROVVYD" ,"V_SARNNAD" ,"V_SHKUEAQTTED" ,"V_SHORRNED" ,"V_SILTTEED" ,"V_SKHIYNHKKYD" ,"V_SLUUZHYD" ,"V_SOLLAQTTED" ,"V_SOLLEED" ,"V_STOAOARJED" ,"V_SUIQTTED" ,"V_SUOAPPYD" ,"V_SUUDYD" ,"V_TAARBSHED" ,"V_TAIQDDED" ,"V_TEEQMEED" ,"V_TEEVVAD" ,"V_TEYPSTED" ,"V_TIEQTTED" ,"V_TOBDDYD" ,"V_UQVDDED" ,"V_VEAQDDDED" ,"V_VEYHSSAD" ,"V_VIIKKYD" ,"V_VOQLLJED" ,"V_VOQLLJED-SG3" ,"V_VUAGGGAD" ,"V_VUAQDHSTED" ,"V_VUAQPSTED" ,"V_VUEAIQNNED" ,"V_VUEAQDHDHED" ,"V_VUEJTED" ,"V_VUEQHSSED" ,"V_VUEQRDDED" ,"V_VUOIDDYD"],
	"pos" : ["Adv" ,"Art" ,"A" ,"CC" ,"CS" ,"Det" ,"Interj" ,"N" ,"Num" ,"Pcle" ,"Po" ,"Pron" ,"Pr" ,"V" ,"Suf" ,"Prefix"],
	"semantics" : ["Act" ,"Act_Group" ,"Act_Plc" ,"Act_Route" ,"Adr" ,"Alt" ,"Amount" ,"Amount_Build" ,"Amount_Semcon" ,"Ani" ,"Ani_Body-abstr_Hum" ,"Ani_Build" ,"Ani_Build_Hum_Txt" ,"Ani_Build-part" ,"Ani_Group" ,"Ani_Group_Hum" ,"Ani_Hum" ,"Ani_Hum_Plc" ,"Ani_Hum_Time" ,"Ani_Plc" ,"Ani_Plc_Txt" ,"Aniprod" ,"Aniprod_Hum" ,"Aniprod_Obj-clo" ,"Aniprod_Perc-phys" ,"Aniprod_Plc" ,"Ani_Time" ,"Ani_Veh" ,"Ant" ,"Ant_Fem" ,"Ant_Mal" ,"Atr" ,"Body" ,"Body-abstr" ,"Body-abstr_Prod-audio_Semcon" ,"Body_Body-abstr" ,"Body_Clth" ,"Body_Food" ,"Body_Group_Hum" ,"Body_Group_Hum_Time" ,"Body_Hum" ,"Body_Mat" ,"Body_Measr" ,"Body_Obj_Tool-catch" ,"BodyPart" ,"Body_Plc" ,"Body_Time" ,"Build" ,"Build_Build-part" ,"Build_Clth-part" ,"Build_Edu_Org" ,"Build_Event_Org" ,"Build_Obj" ,"Build_Org" ,"Build-part" ,"Build-part_Plc" ,"Build_Route" ,"Cat" ,"Clth" ,"Clth_Hum" ,"Clth-jewl" ,"Clth-jewl_Curr" ,"Clth-jewl_Money" ,"Clth-jewl_Org" ,"Clth-jewl_Plant" ,"Clth-part" ,"Constellation" ,"Ctain" ,"Ctain-abstr" ,"Ctain-abstr_Org" ,"Ctain-clth" ,"Ctain-clth_Plant" ,"Ctain-clth_Veh" ,"Ctain_Feat-phys" ,"Ctain_Furn" ,"Ctain_Plc" ,"Ctain_Tool" ,"Ctain_Tool-measr" ,"Curr" ,"Curr_Org" ,"Dance" ,"Dance_Org" ,"Dance_Prod-audio" ,"Dir" ,"Divinity" ,"Domain" ,"Domain_Food-med" ,"Domain_Prod-audio" ,"Drink" ,"Dummytag" ,"Edu" ,"Edu_Event" ,"Edu_Group_Hum" ,"Edu_Mat" ,"Edu_Org" ,"Event" ,"Event_Food" ,"Event_Hum" ,"Event_Plc" ,"Event_Plc-elevate" ,"Event_Time" ,"Feat" ,"Feat-measr" ,"Feat-measr_Plc" ,"Feat-phys" ,"Feat-phys_Tool-write" ,"Feat-phys_Veh" ,"Feat-phys_Wthr" ,"Feat_Plant" ,"Feat-psych" ,"Feat-psych_Hum" ,"Fem" ,"Food" ,"Food-med" ,"Food_Perc-phys" ,"Food_Plant" ,"Furn" ,"Game" ,"Game_Obj-play" ,"Geo" ,"Geom" ,"Geom_Obj" ,"Group" ,"Group_Hum" ,"Group_Hum_Org" ,"Group_Hum_Plc" ,"Group_Hum_Prod-vis" ,"Group_Org" ,"Group_Sign" ,"Group_Txt" ,"Hum" ,"Hum-abstr" ,"Human" ,"Hum_Lang" ,"Hum_Lang_Plc" ,"Hum_Lang_Time" ,"Hum_Obj" ,"Hum_Org" ,"Hum_Plant" ,"Hum_Plc" ,"Hum_Tool" ,"Hum_Veh" ,"Hum_Wthr" ,"Ideol" ,"Inanim" ,"Kin" ,"Kin_Fem" ,"Kin_Mal" ,"Kinterm" ,"Lang" ,"Lang_Tool" ,"Mal" ,"Mat" ,"Mat_Plant" ,"Mat_Txt" ,"Measr" ,"Measr_Sign" ,"Measr_Time" ,"Money" ,"Money_Obj" ,"Money_Txt" ,"NonHum" ,"Obj" ,"Obj-clo" ,"Obj-cogn" ,"Obj-el" ,"Obj-ling" ,"Obj-play" ,"Obj-play_Sport" ,"Obj-rope" ,"Obj_Semcon" ,"Obj_State" ,"Obj-surfc" ,"Org" ,"Org_Prod-cogn" ,"Org_Rule" ,"Org_Txt" ,"Org_Veh" ,"Part" ,"Part_Prod-cogn" ,"Part_Substnc" ,"Pat" ,"Patr" ,"Patr_Fem" ,"Patr_Mal" ,"Perc-cogn" ,"Perc-emo" ,"Perc-emo_Wthr" ,"Perc-phys" ,"Perc-psych" ,"Plant" ,"Plant-part" ,"Plant_Plant-part" ,"Plant_Tool" ,"Plant_Tool-measr" ,"Plc" ,"Plc-abstr" ,"Plc-abstr_Rel_State" ,"Plc-abstr_Route" ,"Plc-elevate" ,"Plc-line" ,"Plc_Pos" ,"Plc_Route" ,"Plc_Substnc" ,"Plc_Substnc_Wthr" ,"Plc_Time" ,"Plc_Tool-catch" ,"Plc-water" ,"Plc_Wthr" ,"Pos" ,"Process" ,"Prod" ,"Prod-audio" ,"Prod-audio_Txt" ,"Prod-cogn" ,"Prod-cogn_Txt" ,"Prod-ling" ,"Prod-vis" ,"Rel" ,"Route" ,"Rule" ,"Rvr" ,"Semcon" ,"Semcon_Txt" ,"Sign" ,"Sport" ,"State" ,"State-sick" ,"State-sick_Substnc" ,"Substnc" ,"Substnc_Wthr" ,"Sur" ,"Sur_Fem" ,"Sur_Mal" ,"Symbol" ,"Time" ,"Time_Wthr" ,"Tool" ,"Tool-catch" ,"Tool-clean" ,"Tool-it" ,"Tool-measr" ,"Tool-music" ,"Tool-write" ,"Txt" ,"Veh" ,"Wpn" ,"Wthr" ,"Year"],

}

function makeDataList(name){
	var items = datalist_data[name];
	var html = "<datalist id='"+name+"_datalist'>";
	for (var i = 0; i < items.length; i++) {
		var item = items[i];
		html = html + "<option value='" + item + "'>";
	}
	html = html + "</datalist>";
	return html;
}