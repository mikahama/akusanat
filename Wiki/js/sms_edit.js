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


function createEditForm(){
	var formContainer = getEle("mw-content-text");
	var editForm = document.createElement("div");
	editForm.id = "smsEditForm";
	formContainer.appendChild(editForm);
	var entries = loadFromWikiMarkup();
	for(var i =0; i< entries.length; i++){
		var entry = entries[i];
		var item = createFormItem(entry["lemma"], entry["pos"], entry["semantics"], entry["translations"], entry["json_data"]);
		editForm.appendChild(item);
	}
	var addButton = document.createElement("button");
	addButton.click = function(event){addHomonym(event);}
	addButton.textContent = "Lisää merkintä"
	editForm.appendChild(addButton);

}

function removeBrackets(text){
	text = text.replaceAll("}","");
	text = text.replaceAll(")","");
	text = text.replaceAll("]","");
	text = text.strip();
	return text;
}

function loadFromWikiMarkup(){
	var entries = []
	var wikiText = getEle("wpTextbox1").value;
	var wikiElement = document.createElement("div");
	wikiElement.innerHTML = wikiText.wiki2html();
	var homonyms = wikiElement.getElementsByClassName("homonym");
	for(var i=0; i< homonyms.length;i++){
		var homonym = homonyms[i];
		var heading = homonym.getElementsByTagName("H1")[0].textContent;
		var lemma = heading.split("({{")[0];
		var pos = heading.split("sms:POS_")[1].replace("}})" ,"").strip();
		var semanticsElement = homonym.getElementsByClassName("semantics")[0];
		var semanticsItems = semanticsElement.getElementsByTagName("UL")[0].getElementsByTagName("LI");
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
				var parts = langTranslation.split(" (");
				var word = removeBrackets(parts[0]);
				var pos = removeBrackets(parts[1].split("sms:POS_")[1]);
				trans.push([word, pos]);
			}
			translations[language_name] = trans;
		}
		var json_data = homonym.getElementsByClassName("json_data")[0].textContent;
		entries.push({"lemma":lemma, "pos":pos, "semantics":semantics, "translations": translations, "json_data": json_data})

	}
	return entries;
}

function createFormItem(lemma, pos, semantics, translations, json_data){
	var lemma_edit = document.createElement("div");
	lemma_edit.className = "lemma_edit";
	var form_item = "<div class='lemma_pos_edit'> <button onclick='deleteHomonym(event)'>Poista merkintä</button>"
	+ "<p class='smsFormInput'>Sanaluokka: <input value='"+ pos +"'>  </p></div>"+
	"<span class='edit_json_data' style='display:none;'>"+ json_data +"</span><div class='semantics_edit'><p><b>Semantiikka</b></p><button onclick='addSemantics(event)'>Lisää</button>";
	var semantics_table = createSemanticsTable(semantics);
	form_item = form_item + semantics_table.innerHTML + "</div>";
	form_item = form_item + "<div class='translations_edit'><p><b>Käännökset</b></p><button onclick='addTranslationLanguage(event)'>Lisää kieli</button>"
	var translation_table = createTranslationsTable(translations);
	form_item = form_item + translation_table.innerHTML + "</div>"
	lemma_edit.innerHTML = form_item;
	return lemma_edit;
}

function createSemanticsTable(semantics){
	var tableContainer = document.createElement("div");
	var table = document.createElement("table");
	table.className = "semantics_table";
	table.innerHTML = "<tr><th>Luokka</th><th>Arvo</th><th>Poista</th></tr>";
	for(var i =0; i < semantics.length; i++){
		var semantic = semantics[i];
		var tableRow = document.createElement("tr");
		tableRow.innerHTML = "<td><input class='semantics_class' value='"+  semantic[0] +"'></td><td><input class='semantics_value' value='"+  semantic[1] +"'></td><td onclick='deleteSemantics(event)'>X</td>";
		table.appendChild(tableRow);
	}
	tableContainer.appendChild(table);
	return tableContainer;
}

function createTranslationsTable(translations){
	var container = document.createElement("div");
	var html="";
	for (var language in translations){
		html = html + "<div class='language'> <p class='smsFormInput'>Kielen tunnus (esim. eng) <input value='" + language + "'></p> <button onclick='addTranslation(event)'>Lisää käännös</button>";
		html = html + "<table><tr><th>Käännös</th><th>Sanaluokka</th><th>Poista</th></tr>"
		var lan_translations = translations[language];
		for(var i =0; i< lan_translations.length; i++){
			var translation = lan_translations[i];
			html = html + "<tr><td><input class='translation_word' value='"+  translation[0] +"'></td><td><input class='translation_pos' value='"+  translation[1] +"'></td><td onclick='deleteTranslation(event)'>X</td></tr>";
		}

		html = html + "</table></div>"
	}
	container.innerHTML = html;
	return container;
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