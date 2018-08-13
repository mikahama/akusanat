/**
 * Created by mikahama on 7/6/18.
 */
document.addEventListener('DOMContentLoaded', function() {
    var search = document.getElementById("mikasSearch");
    if(search){
        createMikasSearch(search);
    }
}, false);

function createMikasSearch(search_div) {
    console.log("Mika's search activated!!!");
    var html = "<input id='mikasSearchField'><button id='mikasSearchButton' onclick='mikasSearchQuery()'>Hae</button><div id='mikasSearchOptions'>";
    var search_items = search_providers["order"];
    var options = "<div id='mikasSearchRadioButtons'>";
    var search_tab_html = "<div id='mikasSearchTabs'>";
    for (var i =0;i< search_items.length; i++){
        var search_item = search_items[i];
        options += "<input type='radio' onchange='selectMikasSearch(\""+search_item+"\")' name='mikasSearchRadio' value='" + search_item+"'> " +search_providers["providers"][search_item]["name"] + " ";
        var custom_searches = search_providers["providers"][search_item]["subprovidres"];
        search_tab_html += "<div style='display:none;' class='mikasSearchTab' id='mikasSearchTab" + search_item + "'>";
        var checked = " checked ";
        for(var x =0; x < custom_searches.length;x++){
            var custom_search = custom_searches[x];
            search_tab_html += "<input class='mikasCustomSearch'"+checked+ "type='radio' name='mikasSearchAlternative_" + i + "' value='"+custom_search["url"]+"'>" + custom_search["name"] + " ";
            checked = "";

        }
        search_tab_html += "</div>";
    }
    html += options + "</div>" + search_tab_html + "</div></div>";
    search_div.innerHTML = html;

    var prev_selection = localStorage.getItem('mainSearchProvider');
    if (prev_selection == null || search_items.indexOf(prev_selection) == -1){
        prev_selection = search_items[0];
    }
    selectMikasSearch(prev_selection);

    var prev_url = localStorage.getItem('searchUrl');
    if(prev_url){
        var selected = document.querySelector('input[name="mikasSearchRadio"]:checked').value;
        var radios = document.getElementById("mikasSearchTab"+ selected).getElementsByClassName("mikasCustomSearch");
        for(var t=0;t<radios.length;t++){
            var radio = radios[t];
            if(radio.value == prev_url){
                radio.checked = true;
                break;
            }
        }
    }
}

function selectMikasSearch(item) {
    setCheckedValueOfRadioButtonGroup("mikasSearchRadio", item);
    var to_hide = document.getElementsByClassName("mikasSearchTab");
    for(var i = 0; i< to_hide.length; i++){
        to_hide[i].style.display = "none";
    }
    var to_show = document.getElementById("mikasSearchTab"+item);
    var customs = to_show.getElementsByClassName("mikasCustomSearch");
    if(customs.length > 1){
        to_show.style.display = "block";
    }

}

function setCheckedValueOfRadioButtonGroup(vRadioObj, vValue) {
    var radios = document.getElementsByName(vRadioObj);
    for (var j = 0; j < radios.length; j++) {
        if (radios[j].value == vValue) {
            radios[j].checked = true;
            break;
        }
    }
}

function mikasSearchQuery() {
    var selected = document.querySelector('input[name="mikasSearchRadio"]:checked').value;
    localStorage.setItem('mainSearchProvider', selected);
    var url = document.getElementById("mikasSearchTab"+ selected).querySelector('input:checked').value;
    localStorage.setItem('searchUrl', url);
    url = url.replace("QUERY", mikasSearchField.value);
    if(mikasSearchField.value.length == 0){
        return;
    }
    window.location.href = url;
}