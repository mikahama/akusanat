#encoding: utf-8
from tietokanta.exceptions import UnsupportedLanguageException
import tietokanta.mongoilija
from tietokanta import sms_xml

language_processors = {"sms": sms_xml.update_sms_db_from_xml,"default": sms_xml.update_sms_db_from_xml, "izh": sms_xml.update_sms_db_from_xml,"olo": sms_xml.update_sms_db_from_xml,"vot": sms_xml.update_sms_db_from_xml, "mhr": sms_xml.update_sms_db_from_xml, "testi": sms_xml.update_sms_db_from_xml}




def update_db_from_xml(xml_txt, file_type, file_name, language="sms"):
    try:
        return language_processors[language](xml_txt, file_type, file_name)
    except KeyError:
        return language_processors["default"](xml_txt, file_type, file_name)