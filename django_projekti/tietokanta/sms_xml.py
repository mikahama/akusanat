#encoding: utf-8
import codecs
import xml.etree.ElementTree as ET
from tietokanta.exceptions import UnsupportedXMLSchema
import copy



def update_sms_db_from_xml(xml_text, file_type, file_name):
    """

    :param xml_text: XML as a string
    :param file_type: sms, finsms or morph
    :param file_name: name of the file
    :return:
    """
    xml_text = xml_text.replace("xml:lang=", "xml_lang=")
    root = ET.fromstring(xml_text)
    if file_type == "sms":
        return __process_sms_xml__(root, file_name)
    elif file_type == "finsms":
        return  __process_finsms_xml__(root, file_name)
    elif file_type == "morph" or file_type == ".":
        #SMS morph and IZH because the syntax is the same
        return  __process_morph_xml__(root, file_name)
    else:
        raise UnsupportedXMLSchema("The schema " + file_type + " is not supported!")

def __process_sms_xml__(root, file_name):
    lemmas = []
    for element in root:
        if element.tag != "e":
            continue
        homonym = {"mg_data": [],"l_attrib": {}, "e_attrib":element.attrib, "translations": {},"semantics":[],"sms2xml":{"sources":[], "file": file_name}}
        homonym["sms2xml_id"] = element.get("id")
        l = element.find("lg").find("l")
        lemma = l.text
        homonym["POS"] = l.get("pos").upper()
        for lemma_attribute in l.attrib.keys():
            if lemma_attribute == "pos":
                continue
            elif lemma_attribute == "hid":
                homonym["hid"] = l.get(lemma_attribute)
            else:
                homonym["l_attrib"][lemma_attribute] = l.get(lemma_attribute)
        sources = element.find("sources")
        if sources is not None:
            for book in sources:
                homonym["sms2xml"]["sources"].append(book.attrib)
        mgs = element.findall("mg")
        mg_index = -1
        for mg in mgs:
            mg_index += 1
            mg_atrs = mg.attrib
            use_index = str(mg_index)
            if "relId" in mg_atrs.keys():
                use_index = mg_atrs["relId"]
            for child in mg:
                if child.tag == "semantics":
                    for sem in child:
                        d = {"mg": use_index, "class": sem.get("class"), "value": sem.text or ""}
                        homonym["semantics"].append(d)
                if child.tag == "tg":
                    lang = child.get("xml_lang").lower()
                    if lang not in homonym["translations"]:
                        homonym["translations"][lang] = []
                    for trans in child:
                        t = {}
                        t["mg"] = use_index
                        t["sms2xml"] = trans.attrib
                        t["word"] = trans.text
                        homonym["translations"][lang].append(t)
                else:
                    mg_data = {"text": child.text, "element": child.tag, "attributes": child.attrib, "mg": use_index}
                    if child.tag == "xg":
                        mg_data["text"] = __xml_element_content__(child)
                    homonym["mg_data"].append(mg_data)
        lemmas.append((lemma, homonym))
    return lemmas

def __xml_element_content__(tag):
    return (tag.text or "") + ''.join(ET.tostring(e) for e in tag)

def __process_finsms_xml__(root, file_name):
    lemmas = []
    for element in root:
        if element.tag == "e":
            #A real entry
            l = element.find("lg").find("l")
            finnish_trans = l.text
            trans_attributes = l.attrib
            trans_attributes["word"] = finnish_trans
            tg = element.find("mg").find("tg")
            if tg.find("tCtn") is not None:
                tg = tg.find("tCtn")
            sami_lemmas = []
            for t in tg:
                if t.tag != "t":
                    continue
                else:
                    lemma = t.text
                    contlex = t.get("Contlex","")
                    pos = t.get("pos","")
                    sami_lemmas.append((lemma, contlex, pos))
            semantics = []
            mgs = element.findall("mg")
            mg_index = -1
            for mg in mgs:
                mg_index += 1
                mg_atrs = mg.attrib
                use_index = str(mg_index)
                if "relId" in mg_atrs.keys():
                    use_index = mg_atrs["relId"]
                sems = mg.find("semantics")
                if sems is not None:
                    for sem in sems:
                        d = {"mg": use_index,"class": sem.get("class"), "value": sem.text or ""}
                        semantics.append(d)
            for sami_lemma in sami_lemmas:
                lemma, contlex, pos = sami_lemma
                homonym = {"POS": pos.upper(), "finsms": {"Contlex":contlex, "file": file_name}}
                homonym["semantics"] = semantics
                homonym["translations"] = {"fin": [trans_attributes]}
                lemmas.append((lemma, homonym))

    return lemmas

def __xml_node_to_list__(node):
    list =[]
    for e in node:
        tag = e.tag
        attributes = e.attrib
        data = []
        if len(e) > 0:
            for sube in e:
                subtag = sube.tag
                subattr = sube.attrib
                if len(sube) > 0:
                    subdata = __xml_node_to_list__(sube)
                else:
                    subdata = sube.text
                data.append((subtag, subattr, subdata))
        else:
            data = e.text or ""
        list.append((tag, attributes, data))
    return list

def __process_morph_xml__(root, file_name):
    lemmas = []
    for element in root:
        if element.tag != "e":
            continue
        homonym ={"mg_data":[], "l_attrib": {}, "e_attrib":element.attrib, "lexicon":{},"translations": {},"semantics":[], "semantics_attributes":{}, "morph":{"lg":{}},"sms2xml":{"sources":[]}, "tg_attrs":{}}
        id = element.get("id") or ""
        meta = element.get("meta") or ""
        homonym["morph_id"] = id
        homonym["morph"]["meta"] = meta
        homonym["morph"]["element"] = element.attrib
        if element.find("map") is not None:
            homonym["morph"]["map"] = element.find("map").attrib
        if element.find("rev-sort_key") is not None:
            homonym["morph"]["revsortkey"] = element.find("rev-sort_key").text
        lg = element.find("lg")
        for ele in lg:
            if ele.tag == "l":
                #lemma
                lemma = ele.text
                homonym["POS"] = (ele.get("pos") or "").upper()
                l_attrib = copy.copy(ele.attrib)
                if "pos" in l_attrib:
                    del l_attrib['pos']
                if "hid" in l_attrib:
                    del l_attrib['hid']
                homonym["l_attrib"] = l_attrib
                hid = ele.get("hid")
                if hid is not None:
                    homonym["hid"] = hid
            else:
                #other stuff
                homonym["morph"]["lg"][ele.tag] = ET.tostring(ele, encoding="utf-8", method="xml") #__xml_node_to_list__(ele)
        sources = element.find("sources")
        if sources is not None:
            for ele in sources:
                homonym["sms2xml"]["sources"].append(ele.attrib)
        mgs = element.findall("mg")
        mg_index = -1
        for mg in mgs:
            mg_index += 1
            if mg is not None:
                mg_atrs = mg.attrib
                use_index = str(mg_index)
                if "relId" in mg_atrs.keys():
                    use_index = mg_atrs["relId"]
                for ele in mg:
                    if ele.tag == "semantics":
                        homonym["semantics_attributes"][use_index] = ele.attrib or {}
                        for sem in ele:
                            d = {"mg": use_index, "class": sem.get("class"), "value": sem.text or "", "attributes": (sem.attrib or {})}
                            homonym["semantics"].append(d)
                    elif ele.tag == "tg":
                        language = ele.get("xml_lang")
                        if language not in homonym["translations"]:
                            homonym["translations"][language] = []
                        if use_index not in homonym["tg_attrs"]:
                            homonym["tg_attrs"][use_index] = {}
                        homonym["tg_attrs"][use_index][language] = ele.attrib
                        for t in ele:
                            attribs = t.attrib
                            if t.tag == "re":
                                attribs["re"] = "true"

                            attribs["word"] = t.text
                            attribs["mg"] = use_index
                            homonym["translations"][language].append(attribs)
                    else:
                        mg_data = {"text": ele.text, "element": ele.tag, "attributes": ele.attrib, "mg": use_index}
                        if ele.tag == "xg":
                            mg_data["text"] = __xml_element_content__(ele)
                        homonym["mg_data"].append(mg_data)
        lemmas.append((lemma, homonym))
    return lemmas



