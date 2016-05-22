from git import Repo
from django.conf import settings
import glob
import os
import requests
from exceptions import *
import codecs
from git import Actor

class GitTool():
    def __init__(self):
        self.repo_path = getattr(settings, "GIT_DIR", None)
        self.repo = Repo(self.repo_path)
        self.origin = self.repo.remotes.origin
        self.current_url = getattr(settings, "CURRENT_URL", None)

    def pull(self):
        self.origin.pull()

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

        a = Actor("SyncBot", "syncbot@none.com")
        self.repo.index.commit("Data from wiki ", author=a, committer=a)
        self.origin.push()


