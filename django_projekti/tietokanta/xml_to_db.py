#encoding: utf-8
from tietokanta.exceptions import UnsupportedLanguageException
import tietokanta.mongoilija
from tietokanta import sms_xml

language_processors = {"sms": sms_xml.update_sms_db_from_xml, "izh": sms_xml.update_sms_db_from_xml, "mhr": sms_xml.update_sms_db_from_xml, "testi": sms_xml.update_sms_db_from_xml}




def update_db_from_xml(xml_txt, file_type, file_name, language="sms"):
    try:
        return language_processors[language](xml_txt, file_type, file_name)
    except KeyError:
        raise UnsupportedLanguageException("Language processor was not found for the language code " + language +"\nDefine the language code in xml_to_db.py's language_processor dictionary!")
