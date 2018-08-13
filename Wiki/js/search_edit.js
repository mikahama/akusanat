/**
 * Created by mikahama on 14/6/18.
 */
var csrftoken="";
document.addEventListener("DOMContentLoaded", function(event) {
    csrftoken = jQuery("[name=csrfmiddlewaretoken]").val();
    if(username.length ==0){
        mainDiv.style.display = "none";
    }else{
        loginDiv.style.display = "none";
    }
    for(var i=0; i<search_providers.order.length; i++){
        var prov = search_providers.order[i];
        addItem(prov, search_providers.providers[prov]["name"], search_providers.providers[prov]["subprovidres"]);
    }
    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });
});

function loginAction() {
    $.ajax({
        url:'../login/',
        type: "POST",
        data: {username: userName.value, password: password.value},
        success:function(response){
            username = userName.value;
            loginDiv.style.display = "none";
            mainDiv.style.display = "block";
        },
        complete:function(){},
        error:function (xhr, textStatus, thrownError){
            alert("Kirjautuminen epäonnistui. Käytä MediaWiki-tunnuksiasi");
        }
    });
}

function csrfSafeMethod(method) {
    // these HTTP methods do not require CSRF protection
    return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
}

function addItem(id, humanReadableName, subproviders){
    var html = "<div class='provider'><div class='providerInfo'><input placeholder='ID' class='providerID' value='"+id+"'><input placeholder='Ihmisluettava nimi' class='providerName' value='"+humanReadableName+"'><button class='deleteProviderButton' onclick='deleteProvider(event)'>Poista hakuryhmä</button></div><div class='subproviders'>";
    for(var i=0; i<subproviders.length;i++){
        html += subproviderHtml(subproviders[i]);
    }
    html += "</div><button class='addSubproviderButton' onclick='addSubprovider(event)'>Lisää aineisto</button></div>"
    dataContainer.innerHTML += html;
}
function subproviderHtml(subprovider) {
    return "<div class='subprovider'><input placeholder='Nimi' class='subproviderName' value='"+subprovider.name+"'><input placeholder='URL' class='subproviderUrl' value='"+subprovider.url+"'><button class='deleteSubprovider' onclick='deleteSubprovider(event)'>Poista aineisto</button></div>";
}

function deleteProvider(event) {
    var child = event.target.parentNode.parentNode;
    event.target.parentNode.parentNode.parentNode.removeChild(child);
}
function deleteSubprovider(event) {
    var child = event.target.parentNode;
    event.target.parentNode.parentNode.removeChild(child);
}
function addSubprovider(event) {
    var providers = event.target.parentNode.getElementsByClassName("subproviders")[0];
    providers.innerHTML += subproviderHtml({"name":"", "url":""});

}

function save() {
    var providers = document.getElementsByClassName("provider");
    var dataOrder = [];
    var dataProviders = {};
    for (var i=0;i<providers.length;i++){
        var provider = providers[i];
        var id = provider.getElementsByClassName("providerID")[0].value;
        var name = provider.getElementsByClassName("providerName")[0].value;
        if(id.length*name.length == 0){
            alert("Virhe: Hakuryhmän ID tai nimi on tyhjä");
            return;
        }
        dataOrder.push(id);
        dataProviders[id] = {"name": name, "subprovidres":[]};
        var subproviders = provider.getElementsByClassName("subprovider");
        if(subproviders.length == 0){
            alert("Virhe: Hakuryhmä " + id + " on tyhjä!");
            return;
        }
        for (var x=0; x< subproviders.length;x++){
            var subprovider = subproviders[x];
            var subUrl = subprovider.getElementsByClassName("subproviderUrl")[0].value;
            var subName = subprovider.getElementsByClassName("subproviderName")[0].value;
            if(subUrl.length*subName.length==0){
                alert("Virhe: Tyhjiä kenttiä hakuryhmässä " + id);
                return;
            }
            if (subUrl.indexOf("QUERY") == -1){
                alert("Virhe: URL:stä puuttuu QUERY-merkkijono: " + id + ", " + subName);
                return;
            }
            dataProviders[id]["subprovidres"].push({"name": subName, "url": subUrl});
        }

    }
    if (!("main" in dataProviders)){
        alert("Virhe: Hakuryhmä ID:llä main puuttuu");
        return;
    }
    var resultJson = {"order": dataOrder, "providers": dataProviders};
    console.log(JSON.stringify(resultJson));
    $.ajax({
        url:'../saveSearch/',
        type: "POST",
        data: {data: JSON.stringify(resultJson)},
        success:function(response){
            alert("Tallennettu!");
        },
        complete:function(){},
        error:function (xhr, textStatus, thrownError){
            alert("Palvelin palautti virheen " + thrownError);
        }
    });
}
