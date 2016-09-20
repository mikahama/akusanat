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

import os


from django.conf import settings
# Create your views here.

file_types = {
    "sms" : {"finsms": "sms_finsms.xml", "sms":"sms_sms.xml", "morph": "sms_morph.xml"}
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
    t = thread.start_new_thread(pull_from_git(), ())
    t.setDaemon(True)
    t.start()
    return HttpResponse("OK", status=200)


def pull_from_git():
    git_tool = GitTool()
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
            mongoilija.store_xml_in_db(xml, folder, tail, "sms", first_time)
    process_towiki_queue("")

def rebase_wiki(request):
    language = request.GET.get("language", "sms")
    mongoilija.push_everything_to_wiki(language)
    process_towiki_queue("")
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

def process_towiki_queue(request):
    queue = WikiUpdateQueue.objects.all()
    username = getattr(settings, "WIKI_USERNAME", None)
    password = getattr(settings, "WIKI_PASSWORD", None)
    wt = Wikitool(username,password)
    print wt.login()
    print wt.get_token()

    count = 0
    s_count = 0
    for item in queue:
        lemmaData = mongoilija.get_lemma(item.lemma, item.language)
        success, results = wt.post_lemma(item.lemma, item.language, lemmaData)
        count += 1
        if success:
            item.delete()
            s_count += 1

    return HttpResponse(str(s_count) + " out of " + str(count) + " OK",status=200)

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
    return pos + "_sms2X.xml" == file_name


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