# encoding: utf-8
"""

This script is intended only for debugging use. Don't run, unless you know what you are doing!

"""
import tietokanta.mongoilija as mongoilija
import os
def update_from_files(dir, file_type):
    for fn in os.listdir(dir):
         if fn.endswith(".xml"):
            f =open(os.path.join(dir, fn), 'r')
            xml = f.read()
            mongoilija.store_xml_in_db(xml, file_type, fn, "sms", True)

update_from_files("../../XML/finsms", "finsms")
update_from_files("../../XML/morph", "morph")
update_from_files("../../XML/sms", "sms")

