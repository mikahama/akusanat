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
# Create your views here.

file_types = {
    "sms" : {"finsms": "sms_finsms.xml", "sms":"sms_sms.xml", "morph": "sms_morph.xml"}
}
api_keys =[u"sdfrf4535gdg35ertgfd"]

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
    wt = Wikitool("SyncBot","SyncBot12")
    print wt.login()
    print wt.get_token()

    #A for loop here
    item = queue.first()
    lemmaData = mongoilija.get_lemma(item.lemma, item.language)

    success, results = wt.post_lemma(item.lemma, item.language, lemmaData)

    return HttpResponse(results,status=200)

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