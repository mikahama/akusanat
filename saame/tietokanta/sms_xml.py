#encoding: utf-8
import codecs
import xml.etree.ElementTree as ET

file_p = "C:\Users\mikah\Documents\saame\XML\sms\N_sms2X.xml"
f = codecs.open(file_p, "r")



def update_sms_db_from_xml(xml_text, file_type, file_name):
    xml_text = xml_text.replace("xml:lang=", "xml_lang=")
    root = ET.fromstring(xml_text)
    if file_type == "sms":
        return __process_sms_xml__(root, file_name)
    else:
        raise

def __process_sms_xml__(root, file_name):
    lemmas = {}
    for element in root:
        homonym = {"translations": {},"semantics":[],"sms2xml":{"sources":[], "file": file_name, "lemmas_additional_attributes":{}}}
        homonym["sms2xml_id"] = element.get("id")
        l = element.find("lg").find("l")
        lemma = l.text
        homonym["POS"] = l.get("pos").upper()
        for lemma_attribute in l.attrib.keys():
            if lemma_attribute == "pos":
                continue
            else:
                homonym["sms2xml"]["lemmas_additional_attributes"][lemma_attribute] = l.get(lemma_attribute)
        sources = element.find("sources")
        if sources is not None:
            for book in sources:
                homonym["sms2xml"]["sources"].append(book.attrib)
        mg = element.find("mg")
        for child in mg:
            if child.tag == "semantics":
                for sem in child:
                    d = {"class": sem.get("class"), "value": sem.text}
                    homonym["semantics"].append(d)
            if child.tag == "tg":
                lang = child.get("xml_lang").lower()
                if lang not in homonym["translations"]:
                    homonym["translations"][lang] = []
                for trans in child:
                    t = {}
                    t["sms2xml"] = trans.attrib
                    t["word"] = trans.text
                    homonym["translations"][lang].append(t)
        lemmas[lemma] = homonym
        break
    return lemmas




print update_sms_db_from_xml(f.read(), "sms", "A_sms.xml")