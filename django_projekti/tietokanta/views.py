from django.shortcuts import render
from django.http import HttpResponse
from django.template import RequestContext, loader
import tietokanta.mongoilija as mongoilija
from django.template.defaulttags import register
from exceptions import *
import json
from django.views.decorators.csrf import csrf_exempt
from tietokanta.models import *
from tietokanta.wikitool import Wikitool
from tietokanta.git_tool import GitTool
import thread
import subprocess
import logging

import os


from django.conf import settings
# Create your views here.

file_types = {
    "sms" : {"finsms": "sms_finsms.xml", "sms":"sms_sms.xml", "morph": "sms_morph.xml"},
    "izh" : {".": "izh_morph.xml"}
}
api_keys =[u"sdfrf4535gdg35ertgfd", u"45454arefg785421!R", u"e3455rtwe54325t"]

def xml_out(request):
    xml_filename = request.GET["file"]
    xml_type = request.GET["type"]
    language = request.GET.get("language", "sms")
    lemmas = mongoilija.get_all_lemmas(language)

    template_file = file_types[language][xml_type]
    template = loader.get_template(template_file)
    context = RequestContext(request, {
        'lemmas': lemmas,
        "file_name" : xml_filename
    })
    return HttpResponse(template.render(context), content_type="application/json")

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


def pull_git(request):
    lang = request.GET.get("language", "sms")
    pull_from_git(lang)
    return HttpResponse("OK", status=200)


def pull_from_git(lang):
    git_tool = GitTool(lang)
    old_files = git_tool.list_files()
    git_tool.pull()
    new_files = git_tool.list_files()
    for folder in new_files:
        for file in new_files[folder]:
            print file
            f = open(file, 'r')
            xml = f.read()
            head, tail = os.path.split(file)
            if file not in old_files[folder]:
                first_time = True
            else:
                first_time = False
            mongoilija.store_xml_in_db(xml, folder, tail, lang, first_time)
    process_towiki_queue("", lang)

def rebase_wiki(request):
    language = request.GET.get("language", "sms")
    mongoilija.push_everything_to_wiki(language)
    process_towiki_queue("", request.GET.get("language", "sms"))
    return HttpResponse("OK", status=200)

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

def process_towiki_queue(request, language="sms"):
    queue = WikiUpdateQueue.objects.all()
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
    return HttpResponse("1.0.1 " + getattr(settings, "CURRENT_URL", "null domain"), status=200)

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
def filename_and_pos_sms(pos, file_name):
    return pos + "_sms2X.xml" == file_name or pos + "_sms2x.xml" == file_name


pos_abreviations = {"N": "nouns", "A": "adjectives", "Pr":"adpositions", "Po":"adpositions", "Adv": "adverbs", "CC":"conjunctors", "CS":"conjunctors", "Interj": "interjections", "Pcle": "particles", "Pron":"pronouns", "Num":"quantifiers", "V":"verbs"}
@register.assignment_tag
def filename_and_pos_izh(pos, file_name):
    if pos == "Pr" and file_name == "prepositions.xml":
        return True
    return pos_abreviations[pos] + ".xml" == file_name

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
    if "mg_data" in homonym:
        for mg_other in homonym["mg_data"]:
            line = "<" + mg_other["element"]
            for at_key in mg_other["attributes"].keys():
                line += " " + at_key.replace("xml_lang", "xml:lang") + "=\"" + mg_other["attributes"][at_key] + "\""
            line += ">" + mg_other["text"] + "</"+ mg_other["element"] + ">"
            mg_id = mg_other["mg"]
            if mg_id not in mgs:
                mgs[mg_id] = {"sem":[], "tr":{}, "other": []}
            mgs[mg_id]["other"].append(line)

    for sem in homonym["semantics"]:
        if "mg" in sem:
            mg_id = sem["mg"]
        else:
            mg_id = "0"
        if mg_id not in mgs:
            mgs[mg_id] = {"sem":[], "tr":{}, "other": []}
        mgs[mg_id]["sem"].append("<sem class=\"" +sem["class"]+"\">" +sem["value"]+"</sem>")
    for langs in homonym["translations"]:
        for lang in langs.keys():
            if only_fin and lang != "fin":
                continue
            for trans in langs[lang]:
                for tr in trans:
                    if "mg" in tr:
                        mg_id = tr["mg"]
                    else:
                        mg_id = "0"
                    if mg_id not in mgs:
                        mgs[mg_id] = {"sem":[], "tr":{},"other": []}
                    if lang not in mgs[mg_id][tr]:
                        mgs[mg_id][tr][lang] = []

                    xml_line = "<t"
                    for item in tr.keys():
                        if item == "word" or item == "mg" or item == "POS":
                            continue
                        else:
                            xml_line = xml_line + " " + item + "=\"" + tr[item] + "\""
                    mgs[mg_id][tr][lang].append(xml_line + " pos=\"" + tr["POS"] + "\">" + tr["word"] + "</t>")
    xml = ""
    for mg_k in mgs.keys():
        xml += "<mg relId=\"" + mg_k + "\">\n"
        mg = mgs[mg_k]
        for other in mg["other"]:
            xml += other + "\n"
        if len(mg["sem"]) > 0:
            xml += "<semantics>\n"
            for sem in mg["sem"]:
                xml += sem + "\n"
            xml += "</semantics>\n"
        for lang in mg["tr"].keys():
            xml += "<tg xml:lang=\"" + lang + "\">"
            for trans in mg["tr"][lang]:
                xml += trans + "\n"
            xml += "</tg>\n"
        xml += "</mg>\n"
    return xml

