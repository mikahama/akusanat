import requests
import json
import urllib
import execjs
from django.conf import settings

class Wikitool():
    def __init__(self, username, password, lang="sms"):
        self.wiki_url = getattr(settings, "WIKI_URL", None)
        self.sms_edit_url = getattr(settings, "WIKI_JS_URL", None)
        self.username = username
        self.password = password
        self.login_cookies = {}
        self.token = ""
        self.lang = lang.capitalize()
        txt = urllib.urlopen(self.sms_edit_url).read()
        js_header = u"var document ={};document['addEventListener']=function(x,y,z){};\n"
        self.js = js_header + txt.decode('utf-8')
        self.cookies = {}


    def post(self, url, data):
        r = requests.post(url, data=data,cookies=self.cookies)
        success = r.status_code >= 200 and r.status_code < 300
        if "mediawiki-api-error" in dict(r.headers).keys():
            success = False
        if success:
            try:
                d = r.json()
            except:
                d = r.text + json.dumps(dict(r.headers))
        else:
            d = r.text + json.dumps(dict(r.headers))
        if len(r.cookies) > 0:
            self.cookies = r.cookies
        return success, d


    def login(self):
        data = {"action" :"login","lgname" : self.username, "lgpassword": self.password, "format":"json" }
        success, loginResults = self.post(self.wiki_url + "api.php", data)
        if not success:
            return False
        if loginResults["login"]["result"] == "NeedToken":
            confirmationData = {"action":"login","lgname": self.username, "lgpassword": self.password, "lgtoken":loginResults["login"]["token"], "format":"json"}
            success, loginResults = self.post(self.wiki_url + "api.php", confirmationData)
            if not success:
                return False
        return True


    def get_token(self):
        data = {"action":"query","meta":"tokens", "format":"json"}
        success, loginResults = self.post(self.wiki_url + "api.php", data)
        if not success:
            return False
        self.token = loginResults["query"]["tokens"]["csrftoken"]
        return True


    def __homonyms_to_wikisyntax__(self, homonyms,lemma, language):
        #This will be done using the same JS wiki uses!
        ctx = execjs.compile(self.js)
        wiki = ctx.call("jsonsToWikiFromDjango", homonyms,lemma, language)
        return wiki



    def post_lemma(self, lemma, language, lemmaData):
        homonyms = self.__homonyms_to_wikisyntax__(lemmaData["homonyms"],lemma, language.capitalize())
        postParameters = {"action": "edit", "title": language + ":" + lemma, "text" : homonyms, "recreate": True, "token": self.token, "bot": True}
        success, results = self.post(self.wiki_url + "api.php", postParameters)
        return success, results


    def test_create_page(self, title="Test Page 2", data="Hello, world again!"):
        postParameters = {"action": "edit", "title": title, "text" : data, "recreate": True, "token": self.token, "bot": True}
        success, results = self.post(self.wiki_url + "api.php", postParameters)
        print success
        print results




