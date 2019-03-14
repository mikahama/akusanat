#encoding: utf-8
from django.shortcuts import render
from django.http import HttpResponse
from django.template import RequestContext, loader
import tietokanta.mongoilija as mongoilija
from django.template.defaulttags import register
from exceptions import *
import json, urllib
from django import template
from django.views.decorators.csrf import csrf_exempt
from tietokanta.models import *
from tietokanta.wikitool import Wikitool
from tietokanta.git_tool import GitTool
import thread
import subprocess
import logging
import io
import cgi
import os
import copy
import HTMLParser
import inflector
import codecs
from django.views.decorators.clickjacking import xframe_options_exempt
from xml.sax.saxutils import escape



from django.conf import settings
# Create your views here.

file_types = {
    "sms" : {"finsms": "sms_finsms.xml", "sms":"sms_sms.xml", "morph": "sms_morph.xml"},
    "izh" : {".": "izh_morph.xml"},
    "default" : {".": "izh_morph.xml"},
    "mhr" : {".": "izh_morph.xml"},
    "olo" : {".": "izh_morph.xml"},
    "vot" : {".": "izh_morph.xml"},
    "kpv" : {".": "izh_morph.xml"}
}
api_keys =[u"sdfrf4535gdg35ertgfd", u"45454arefg785421!R", u"e3455rtwe54325t"]

supported_languages = ["sms", "izh", "mhr", "vot", "olo", "myv", "mdf", "mrj", "udm", "yrk", "koi", "kpv", "est"]
supported_translation_languages = ["fin", "eng", "rus", "deu", "nob", "sme", "smn", "sjd", "sma", "sju", "sjd", "sje", "smj", "sjt", "sms", "est", "fit", "fkv", "hun", "izh", "kca", "koi", "kpv", "lav", "liv", "mdf", "mhr", "mns", "mrj", "myv", "nio", "olo", "udm", "vep", "vot", "vro", "yrk", "non", "rom", "ron", "som", "swe", "krl", "lud", "fra", "lat"]

def download_model(request):
    model_type = request.GET["type"]
    language = request.GET["language"]
    stream = inflector.return_model(language, model_type)
    response = HttpResponse(stream, content_type='application/octet-stream')
    return response

def searchProviders(request):
    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(BASE_DIR, 'search_providers.js')
    try:
        d = codecs.open(file_path, "r", encoding="utf-8")
        text = d.read()
    except:
        sms_edit_url = getattr(settings, "WIKI_JS_URL", None).replace("sms_edit.js", "search_providers.js")
        text = urllib.urlopen(sms_edit_url).read()
    return  HttpResponse(text, content_type='application/javascript')

def saveSearch(request):
    u = request.session.get("user", None)
    if u is None:
        return HttpResponse("login first", status=401)
    data = request.POST["data"]
    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(BASE_DIR, 'search_providers.js')
    output = codecs.open(file_path, "w", encoding="utf-8")
    output.write("//modified last by "+u+"\n\nvar search_providers = " + data + ";")
    output.close()
    return HttpResponse("ok", status=200)

def editSearch(request):
    template = loader.get_template("search_edit.html")
    context = RequestContext(request, {
        'wikiurl': getattr(settings, "WIKI_JS_URL", "/").rsplit("/",1)[0],
        "user": request.session.get('user', "")
    })
    return HttpResponse(template.render(context), content_type="text/html; charset=utf-8")

def login(request):
    username = request.POST["username"]
    password = request.POST["password"]
    wt = Wikitool(username, password)
    success = wt.login()
    if success:
        request.session['user'] = username
        status = 200
    else:
        status = 401
    resp = HttpResponse(json.dumps({"success": success}),status=status, content_type="application/json")
    return resp

def xml_out(request):
    xml_filename = request.GET["file"]
    xml_type = request.GET.get("type", ".")
    language = request.GET.get("language", "sms")
    lemmas = mongoilija.get_all_lemmas(language)

    try:
        template_file = file_types[language][xml_type]
    except:
        template_file = file_types["default"]["."]
    template = loader.get_template(template_file)
    context = RequestContext(request, {
        'lemmas': lemmas,
        "file_name" : xml_filename,
        "language": language
    })
    return HttpResponse(template.render(context), content_type="text/plain; charset=utf-8")

def check_apikey(request):
    api_key = request.POST["api"]
    if api_key in api_keys:
        return True
    else:
        raise UnauthorizedException

def check_apikey_get(request):
    api_key = request.GET["api"]
    if api_key in api_keys:
        return True
    else:
        raise UnauthorizedException

def dump_to_git(request):
    #check_apikey_get()
    git_tool = GitTool()
    git_tool.pull()
    git_tool.dump_and_commit()
    return HttpResponse("OK", status=200)

def search(request):
    language = request.GET.get("language", None)
    word = request.GET.get("word", None)
    serveText = request.GET.get("serveText", False)
    if language is None or word is None:
        return HttpResponse("Error, no word or language", status=500)
    data = mongoilija.get_lemma(word, language)
    if data is None:
        data = {}
    else:
        data = {"lemma": data["lemma"], "homonyms": data["homonyms"]}
    lemmas = inflector.return_lemmas(word,language)
    lemma_matches = []
    for lemma in lemmas:
        if lemma == word:
            continue
        l = mongoilija.get_lemma(lemma, language)
        if l is not None:
            lemma_matches.append({"lemma": l["lemma"], "homonyms": l["homonyms"]})
    trans = {}
    for lan in supported_translation_languages:
        translations = mongoilija.get_lemmas_by_translation(word, language, lan)
        if translations.count() >0:
            trans[lan] = []
            for translation in translations:
                trans[lan].append({"lemma": translation["lemma"], "homonyms": translation["homonyms"]})
    if serveText:
        content_type = "text/plain"
    else:
        content_type = "application/json"
    resp = HttpResponse(json.dumps({"query":word, "language": language, "exact_match":data, "lemmatized": lemma_matches, "other_languages": trans}),status=200, content_type=content_type)
    resp['Access-Control-Allow-Origin'] = '*'
    return resp

def analyse_word(request):
    language = request.GET.get("language", None)
    word = request.GET.get("word", None)
    if language is None or word is None:
        return HttpResponse("Error, no word or language", status=500)
    else:
        result = inflector.return_all_analysis(word, language)
        resp = HttpResponse(json.dumps({"analysis": result, "query": word, "language": language}),status=200, content_type="application/json")
        return resp

def generate_form(request):
    language = request.GET.get("language", None)
    word = request.GET.get("query", None)
    if language is None or word is None:
        return HttpResponse("Error, no word or language", status=500)
    else:
        word = word.replace(u" ", u"+")
        result = inflector.generate_form(word, language)
        resp = HttpResponse(json.dumps({"analysis": result, "query": word, "language": language}),status=200, content_type="application/json")
        return resp

def list_languages(request):
    serveText = request.GET.get("serveText", False)
    user = request.GET.get("user", "")
    if serveText:
        content_type = "text/plain"
    else:
        content_type = "application/json"
    if user == u"uralicApi":
        append_dict = ["fin"]
    else:
        append_dict = []
    resp = HttpResponse(json.dumps({"languages": supported_languages + append_dict}),status=200, content_type=content_type)
    resp['Access-Control-Allow-Origin'] = '*'
    return resp

def clone_git(request):
    lang = request.GET.get("language", None)
    remote_url = request.GET.get("url", None)
    if remote_url is None or lang is None:
        return HttpResponse("Error, no url or language", status=500)
    git_tool = GitTool(lang)
    results = git_tool.clone(remote_url)
    return HttpResponse(results, status=200)

def pull_git(request):
    lang = request.GET.get("language", None)
    if lang is None:
        return HttpResponse("Error, no language", status=500)
    pull_from_git(lang)
    return HttpResponse("OK", status=200)

def error_log(request):
    clear = request.GET.get("clear", "false")
    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    error_file_path = os.path.join(BASE_DIR, 'error.log')
    if clear == "true":
        f = open(error_file_path, "w")
        f.write("")
        f.close()
    f = io.open(error_file_path, "r")
    errors = f.read()
    return HttpResponse(errors, status=200)


def pull_from_git(lang):
    git_tool = GitTool(lang)
    old_files = git_tool.list_files()
    git_tool.pull()
    new_files = git_tool.list_files()
    print new_files
    for folder in new_files:
        for file in new_files[folder]:
            print file
            f = open(file, 'r')
            xml = f.read()
            f.close()
            head, tail = os.path.split(file)
            if file not in old_files[folder]:
                first_time = True
            else:
                first_time = False
            mongoilija.store_xml_in_db(xml, folder, tail, lang, first_time)
    process_towiki_queue("", lang)

def rebase_wiki(request):
    language = request.GET.get("language", None)
    if language is None:
        return HttpResponse("Error, no language", status=500)
    clear = request.GET.get("clear", None)
    auth = request.GET.get("auth", "")
    if clear is not None and auth == u"okojewof53":
        mongoilija.clear_language(language)
    mongoilija.push_everything_to_wiki(language)
    process_towiki_queue("", language)
    return HttpResponse("OK", status=200)

@xframe_options_exempt
def inflect(request):
    language = request.GET.get("language", "sms")
    lemma = request.GET.get("lemma", u"").replace(u"%2B", u"+")
    output = request.GET.get("output", "json")
    pos = request.GET.get("pos", "")
    results = inflector.return_all_inflections(lemma,pos,language)
    if output == u"html":
        table = "<table><tr><th>Taivutus</th><th>Tyyppi</th></tr>"
        for result in results:
            table = table + "<tr><td>" + result[0] + "</td><td>" + result[1] + "</td></tr>"
        table = table + "</table>"
        return HttpResponse(table ,status=200, content_type="text/html; charset=utf-8")
    else:
        return HttpResponse("process_inflections(" + json.dumps({"results": results}) + ")",status=200, content_type="application/json")


def lemmatize(request):
    language = request.GET.get("language", "sms")
    word_form = request.GET.get("word", u"").replace(u"%2B", u"+")
    results = inflector.return_lemmas(word_form,language)
    return HttpResponse(json.dumps({"results": results}),status=200, content_type="application/json")

@csrf_exempt
def delete_lemma(request):
    check_apikey(request)
    lemma = request.POST["lemma"]
    language = request.POST["lang"]
    mongoilija.drop_lemma(lemma, language)
    return HttpResponse("",status=200)

@csrf_exempt
def update_lemma(request):
    check_apikey(request)
    lemma = request.POST["lemma"]
    language = request.POST["lang"]
    homonyms = json.loads(request.POST["homonyms"])
    mongoilija.update_lemma(lemma, homonyms["homonyms"], language)
    return HttpResponse("",status=200)

def list_lemmas(request):
    language = request.GET.get("language",None)
    if language is None:
        return HttpResponse("no language", status=500)
    data = mongoilija.get_all_lemmas(language)
    return_text = u""
    for item in data:
        return_text = return_text + item["lemma"] + "\n"
    return HttpResponse(return_text,status=200,content_type="text/plain; charset=utf-8")

def test_mongo(request):
    lemma = request.GET.get("lemma",u"domm-muʹzei")
    language = request.GET.get("language",u"sms")
    data = mongoilija.get_lemma(lemma, language)
    return HttpResponse(str(data),status=200)

def process_towiki_queue(request, language="sms"):
    queue = WikiUpdateQueue.objects.filter(language=language)
    username = getattr(settings, "WIKI_USERNAME", None)
    password = getattr(settings, "WIKI_PASSWORD", None)
    wt = Wikitool(username,password, language)
    print wt.login()
    print wt.get_token()
    print wt.token
    count = 0
    s_count = 0
    for item in queue:
        lemmaData = mongoilija.get_lemma(item.lemma, item.language)
        success, results = wt.post_lemma(item.lemma, item.language, lemmaData)
        count += 1
        if u"\"code\": \"badtoken\"" in results:
            #try again with a new token
            wt = Wikitool(username,password, language)
            wt.login()
            wt.get_token()
            success, results = wt.post_lemma(item.lemma, item.language, lemmaData)
        if u"\"result\": \"Success\"" not in results:
            success = False
        if success:
            item.delete()
            s_count += 1
        else:
            find_string = "<pre class=\"api-pretty-content\">"
            message_start = results.find(find_string)
            error_message = results[message_start + len(find_string):]
            end_string = "</pre>"
            error_message = error_message[0:error_message.find(end_string) + len(end_string)]
            logger = logging.getLogger()
            logger.error(error_message)
        #return HttpResponse(str(success) + results, status=200)

    return HttpResponse(str(s_count) + " out of " + str(count) + " OK",status=200)

def update_system(request):
    domain = getattr(settings, "CURRENT_URL", "null domain")
    if "127.0.0.1" in domain or "localhost" in domain:
        return HttpResponse("can't update on debug (domain is either 127.0.0.1 or localhost)", status=500)
    result = subprocess.call("update_smsxml", shell=True, stdout=subprocess.PIPE)
    return HttpResponse(result, status=200)

def version(request):
    return HttpResponse("1.0.3 " + getattr(settings, "CURRENT_URL", "null domain"), status=200)

def rsa_key(request):
    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    key_path = os.path.join(BASE_DIR, 'id_rsa')
    result = ""
    if not os.path.isfile(key_path):
        #generate a new key
        result = str(subprocess.call("ssh-keygen -t rsa -f " +key_path +" -q -P \"\"" , shell=True, stdout=subprocess.PIPE))
    f = open(key_path + ".pub", "r")
    key = f.read()
    f.close()
    return HttpResponse(result + "\n\nKey\n\n" + key, status=200)

def test_git(request):
    language = request.GET["language"]
    git_tool = GitTool(language)
    out = git_tool.pull()
    new_files = git_tool.list_files()
    return HttpResponse(out + " " + json.dumps(new_files), status=200)

@register.assignment_tag
def get_item(dictionary, key):
    return dictionary.get(key)

@register.assignment_tag
def get_item_list(dictionary, key):
    lista = dictionary.get(key)
    if lista is None:
        return []
    else:
        return lista

@register.assignment_tag
def get_item_dict(dictionary, key):
    lista = dictionary.get(key)
    if lista is None:
        return {}
    else:
        return lista

@register.assignment_tag
def has_key(dictionary, key):
    if dictionary.get(key) is not None:
        return True
    else:
        return False

@register.assignment_tag
def has_subkey(dictionary, key):
    keys = key.split(".")
    first_dict = dictionary.get(keys[0])
    if first_dict is not None:
        second_dict = first_dict.get(keys[1])
        if second_dict is None:
            return False
        else:
            return True
    else:
        return False

@register.assignment_tag
def filename_and_pos(pos, file_name):
    return pos + "_finsms.xml" == file_name

@register.assignment_tag
def filename_and_pos_sms(homonym, file_name):
    pos = homonym["POS"]
    if u"ABBR_" in file_name:
        if "l_attrib" in homonym and "type" in homonym["l_attrib"] and homonym["l_attrib"]["type"] == u"ABBR":
            return True
        else:
            return False
    if pos == u"N":
        if "l_attrib" in homonym:
            if "N_Prop_Toponyms" in file_name:
                if "sem_type" in homonym["l_attrib"] and homonym["l_attrib"]["sem_type"] == u"Plc":
                     return True
                return False
            if "N_Prop" in file_name:
                if "type" in homonym["l_attrib"] and homonym["l_attrib"]["type"] == u"Prop":
                    return True
                return False
            if "N_Kin" in file_name:
                if "type" in homonym["l_attrib"]and homonym["l_attrib"]["type"] == u"Kin":
                    return True
                else:
                    return False
            if "N_" in file_name:
                if "type" in homonym["l_attrib"]:
                    return True
                else:
                    return True
    if pos == u"V":
        if "l_attrib" in homonym:
            if "V_Neg" in file_name:
                if "type" in homonym["l_attrib"] and homonym["l_attrib"]["type"] == u"Neg":
                    return True
                return False
            if "V_Copula" in file_name:
                if "type" in homonym["l_attrib"] and homonym["l_attrib"]["type"] == u"Copula":
                    return True
                return False
            if "V_" in file_name:
                if "type" in homonym["l_attrib"]:
                    return False
                else:
                    return True
    if (pos == u"PO" or pos == u"PR") and "Adp_" in file_name:
        return True
    if (pos == u"CS" or pos == u"CC") and pos + "_" in file_name:
        return True
    return pos.title() + "_" in file_name


pos_abreviations = {"n": "nouns", "a": "adjectives", "pr":"adpositions", "po":"adpositions", "adv": "adverbs", "cc":"conjunctors", "cs":"conjunctors", "interj": "interjections", "pcle": "particles", "pron":"pronouns", "num":"quantifiers", "v":"verbs"}
@register.assignment_tag
def filename_and_pos_izh(pos, file_name):
    if pos == "Pr" and file_name == "prepositions.xml":
        return True
    try:
        return pos_abreviations[pos.lower()] + ".xml" == file_name
    except:
        return False

@register.assignment_tag
def get_subitem(dictionary, key):
    keys = key.split(".")
    first_dict = dictionary.get(keys[0])
    if first_dict is not None:
        value = first_dict[keys[1]]
        return value
    else:
        return None
@register.assignment_tag
def get_subitem_list(dictionary, key):
    keys = key.split(".")
    first_dict = dictionary.get(keys[0])
    if first_dict is not None:
        value = first_dict.get(keys[1])
        if value is None:
            return []
        else:
            return value
    else:
        return []

@register.assignment_tag
def get_subitem_dict(dictionary, key):
    keys = key.split(".")
    first_dict = dictionary.get(keys[0])
    if first_dict is not None:
        value = first_dict.get(keys[1])
        if value is None:
            return {}
        else:
            return value
    else:
        return {}

@register.assignment_tag
def get_subitem_attributes(dictionary, key):
    keys = key.split(".")
    first_dict = dictionary.get(keys[0])
    if first_dict is not None:
        value = first_dict.get(keys[1])
        if value is None:
            return ""
        else:
            text = ""
            for k in value.keys():
                text = text + k +"=\"" + cgi.escape(value[k]) + "\" "
            return text
    else:
        return ""

@register.assignment_tag
def get_item_attributes(dictionary, key):
    if key in dictionary:
        value = dictionary.get(key)
        if value is None:
            return ""
        else:
            text = ""
            for k in value.keys():
                text = text + k +"=\"" + cgi.escape(value[k]) + "\" "
            return text
    else:
        return ""

@register.assignment_tag
def get_subitem_text(dictionary, key):
    keys = key.split(".")
    try:
        first_dict = dictionary[keys[0]]
        if first_dict is not None:
            value = first_dict[keys[1]]
            return value
        else:
            return ""
    except:
        return ""

@register.assignment_tag
def prepare_mg(homonym, only_fin=False):
    mgs = {}
    ht_parser = HTMLParser.HTMLParser()
    if "mg_data" in homonym:
        for mg_other in homonym["mg_data"]:
            line = "<" + mg_other["element"]
            for at_key in mg_other["attributes"].keys():
                line += " " + at_key.replace("xml_lang", "xml:lang") + "=\"" + cgi.escape(mg_other["attributes"][at_key]) + "\""
            line += ">" + ht_parser.unescape(mg_other["text"] or "") + "</"+ mg_other["element"] + ">"
            mg_id = mg_other["mg"]
            if mg_id not in mgs:
                mgs[mg_id] = {"sem":[],"sem_atrs":{}, "tr":{}, "other": [], "tg_atrs":{}}
            mgs[mg_id]["other"].append(line)

    if "semantics_attributes" in homonym:
        for mg_i in homonym["semantics_attributes"]:
            if mg_i not in mgs:
                mgs[mg_i] = {"sem":[],"sem_atrs":{}, "tr":{}, "other": [],"tg_atrs":{}}
            mgs[mg_i]["sem_atrs"] = homonym["semantics_attributes"][mg_i]

    for ind in range(len(homonym["semantics"])):
        sem = homonym["semantics"][ind]
        if "mg" in sem:
            mg_id = sem["mg"]
        else:
            mg_id = "0"
        if "attributes" in sem:
            atrs = sem["attributes"]
        else:
            atrs = {}
        if mg_id not in mgs:
            mgs[mg_id] = {"sem":[],"sem_atrs":{}, "tr":{}, "other": [],"tg_atrs":{}}

        xml_start = "<sem "
        for key in atrs.keys():
            if key == "class":
                continue
            xml_start = xml_start + key + "=\""+ atrs[key] +"\" "
        mgs[mg_id]["sem"].append(xml_start + "class=\"" +cgi.escape((sem["class"] or ""))+"\">" +(sem["value"] or "")+"</sem>")
    langs = homonym["translations"]
    for lang in langs.keys():
        if only_fin and lang != "fin":
            continue
        trans = langs[lang]
        for tr in trans:
            if "mg" in tr:
                mg_id = tr["mg"]
            else:
                mg_id = "0"
            if mg_id not in mgs:
                mgs[mg_id] = {"sem":[],"sem_atrs":{}, "tr":{},"other": [], "tg_atrs":{}}
            if lang not in mgs[mg_id]["tr"]:
                mgs[mg_id]["tr"][lang] = []
            if "re" in tr and tr["re"] == "true":
                t_tag = "re"
            else:
                t_tag = "t"
            xml_line = "<" + t_tag
            for item in tr.keys():
                if item == "word" or item == "mg" or item == "re":
                    continue
                elif type(tr[item]) != dict:
                    xml_line = xml_line + " " + item + "=\"" + tr[item] + "\""
            mgs[mg_id]["tr"][lang].append(xml_line + " >" + escape(tr["word"] or "") + "</"+t_tag+">")
    if "tg_attrs" in homonym:
        for mg_index in homonym["tg_attrs"].keys():
            if mg_index not in mgs:
                mgs[mg_index] = {"sem":[],"sem_atrs":{}, "tr":{},"other": [], "tg_atrs":{}}
            mgs[mg_index]["tg_atrs"] = homonym["tg_attrs"][mg_index]

    xml = ""
    mgs_keys = copy.copy(mgs.keys())
    mgs_keys.sort()
    for mg_k in mgs_keys:
        xml += "<mg relId=\"" + str(mg_k) + "\">\n"
        mg = mgs[mg_k]
        try:
            satrs = mgs[mg_id]["sem_atrs"]
        except:
            satrs = {}
        sem_atrs = ""
        for key in satrs:
                if key == u"class":
                    continue
                sem_atrs = sem_atrs + " " + key + "=\"" + satrs[key] + "\""
        xml += "<semantics" + sem_atrs + ">\n"
        for sem in mg["sem"]:
            xml += sem + "\n"
        xml += "</semantics>\n"
        sorted_keys = sorted(copy.copy(mg["tr"].keys()))
        for lang in sorted_keys:
            xml_start = "<tg "
            if lang in mg["tg_atrs"]:
                for key in mg["tg_atrs"][lang]:
                    if key == "xml_lang":
                        continue
                    xml_start = xml_start + " " + key+"=\""+ mg["tg_atrs"][lang][key] + "\""
            xml += xml_start + " xml:lang=\"" + lang + "\">"
            for trans in mg["tr"][lang]:
                xml += trans + "\n"
            xml += "</tg>\n"
        for other in mg["other"]:
            xml += other + "\n"
        xml += "</mg>\n"
    return xml.replace("xml_lang", "xml:lang")

@register.filter(name='xml_lang')
def xml_lang(value):
    return value.replace("xml_lang", "xml:lang")

@register.filter(name='poscase')
def poscase(value):
    if value == u"CC" or value == u"CS":
        return value
    else:
        return value.title()