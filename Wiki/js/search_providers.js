/**
 * Created by mikahama on 7/6/18.
 */
var search_providers = {
    "order" :["main", "multilingual", "synonyms"],
    "providers": {
        "main" :{"subprovidres": [{"url": "/w/index.php?search=QUERY"}], "name": "Kaikki aineistot"},
        "multilingual": {
            "subprovidres": [
                {"url": "https://mikakalevi.com/sanat/?word=QUERY&lang=sms", "name":"Koltansaame"},
                {"url": "https://mikakalevi.com/sanat/?word=QUERY&lang=izh", "name":"Inkeroinen"},
                {"url": "https://mikakalevi.com/sanat/?word=QUERY&lang=mhr", "name":"Niittymari"},
                {"url": "https://mikakalevi.com/sanat/?word=QUERY&lang=vot", "name":"Vatja"},
                {"url": "https://mikakalevi.com/sanat/?word=QUERY&lang=olo", "name":"Aunuksenkarjala"},
                {"url": "https://mikakalevi.com/sanat/?word=QUERY&lang=myv", "name":"Ersä"},
                {"url": "https://mikakalevi.com/sanat/?word=QUERY&lang=mdf", "name":"Mokša"},
                {"url": "https://mikakalevi.com/sanat/?word=QUERY&lang=mrj", "name":"Vuorimari"},
                {"url": "https://mikakalevi.com/sanat/?word=QUERY&lang=udm", "name":"Udmurtti"},
                {"url": "https://mikakalevi.com/sanat/?word=QUERY&lang=yrk", "name":"Nenetsi"},
                {"url": "https://mikakalevi.com/sanat/?word=QUERY&lang=koi", "name":"Komipermjakki"},
                {"url": "/w/index.php?search=QUERY&fulltext=1&ns1200=1", "name": "Lyydi"},
                {"url":"/w/index.php?search=QUERY&fulltext=1&ns1210=1", "name": "Vepsä"},
                {"url":"/wiki/Toiminnot:Haku?search=QUERY&ns1216=1", "name":"Pohjoismansi"}
                ],
            "name": "Monikieliset sanakirjat"},
        "synonyms" :{"subprovidres": [{"url": "/w/index.php?search=QUERY&ns1202=1", "name": "FinWordNet"}, {"url":"/wiki/Toiminnot:Haku?search=QUERY&ns1214=1&ns1220=1", "name": "FinFrameNet"}], "name": "Synonyymisanakirjat"},

    },


};