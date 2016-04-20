from django.shortcuts import render
from django.http import HttpResponse
from django.template import RequestContext, loader
import tietokanta.mongoilija as mongoilija
# Create your views here.

file_types = {
    "sms" : {"finsms": "sms_finsms.xml", "sms":"sms_sms.xml", "morph": "sms_morph.xml"}
}

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
    return HttpResponse(template.render(context))