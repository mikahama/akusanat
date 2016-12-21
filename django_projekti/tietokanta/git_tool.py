from django.conf import settings
import glob
import os
import requests
from exceptions import *
import codecs
from easy_git import EasyGit
import xml.dom.minidom

class GitTool():
    def __init__(self, lang):
        self.repo_path = getattr(settings, "GIT_DIR_" + lang.upper(), None)
        print self.repo_path
        print "GIT_DIR_" + lang
        self.current_url = getattr(settings, "CURRENT_URL", None)
        self.easy_git = EasyGit(self.repo_path)
        self.lang = lang

    def pull(self):
        self.easy_git.pull()

    def get_folders(self):
        if self.lang == "izh":
            folders = ["."]
        else:
            folders = ["finsms", "morph", "sms"]
        return folders

    def list_files(self):
        file_list = {}
        folders = self.get_folders()
        for folder in folders:
            file_list[folder] = []
            files = glob.glob(self.repo_path + folder +"/*.xml")
            for file in files:
                file_list[folder].append(file)
        return file_list

    def dump_and_commit(self):
        folders = self.get_folders(self)
        for folder in folders:
            files = glob.glob(self.repo_path + folder +"/*.xml")
            for file in files:
                head, tail = os.path.split(file)
                payload = {'language': self.lang, 'file': tail, "type": folder, "api" : "e3455rtwe54325t"}
                r = requests.get(self.current_url + 'xml_out/', params=payload)
                if r.status_code != requests.codes.ok:
                    raise HTTPException()
                xml_data = xml.dom.minidom.parseString(r.text)
                xml_text = xml_data.toprettyxml()
                f = codecs.open(file, "w", encoding="UTF-8")
                f.write(xml_text)
                f.close()
                print file
        self.easy_git.commit("Data from wiki")
        self.easy_git.push()


