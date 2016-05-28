from django.conf import settings
import glob
import os
import requests
from exceptions import *
import codecs
from easy_git import EasyGit

class GitTool():
    def __init__(self):
        self.repo_path = getattr(settings, "GIT_DIR", None)
        self.current_url = getattr(settings, "CURRENT_URL", None)
        self.easy_git = EasyGit(self.repo_path)

    def pull(self):
        self.easy_git.pull()

    def list_files(self):
        file_list = {}
        folders = ["finsms", "morph", "sms"]
        for folder in folders:
            file_list[folder] = []
            files = glob.glob(self.repo_path + folder +"/*.xml")
            for file in files:
                file_list[folder].append(file)
        return file_list

    def dump_and_commit(self):
        folders = ["finsms", "morph", "sms"]
        for folder in folders:
            files = glob.glob(self.repo_path + folder +"/*.xml")
            for file in files:
                head, tail = os.path.split(file)
                payload = {'language': 'sms', 'file': tail, "type": folder, "api" : "e3455rtwe54325t"}
                r = requests.get(self.current_url + 'xml_out/', params=payload)
                if r.status_code != requests.codes.ok:
                    raise HTTPException()
                f = codecs.open(file, "w", encoding="UTF-8")
                f.write(r.text)
                f.close()
                print file
        self.easy_git.commit("Data from wiki")
        self.easy_git.push()


