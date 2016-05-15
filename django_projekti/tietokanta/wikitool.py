import requests
import json
import urllib
import execjs

class Wikitool():
    wiki_url = "http://localhost/mediawiki/"
    sms_edit_url = "http://localhost/js/sms_edit.js"
    def __init__(self, username, password):
        self.username = username
        self.password = password
        self.login_cookies = {}
        self.token = ""
        txt = urllib.urlopen(self.sms_edit_url).read()
        js_header = u"var document ={};document['addEventListener']=function(x,y,z){};\n"
        self.js = js_header + txt.decode('utf-8')

    def post(self, url, data, cookies={}):
        r = requests.post(url, data=data,cookies=cookies)
        success = r.status_code >= 200 and r.status_code < 300
        if success:
            try:
                d = r.json()
            except:
                d = r.text + json.dumps(dict(r.headers))
        else:
            d = r.text + json.dumps(dict(r.headers))
        return success, d, r.cookies

    def login(self):
        data = {"action" :"login","lgname" : self.username, "lgpassword": self.password, "format":"json" }
        success, loginResults, c = self.post(self.wiki_url + "api.php", data)
        if not success:
            return False
        if loginResults["login"]["result"] == "NeedToken":
            confirmationData = {"action":"login","lgname": self.username, "lgpassword": self.password, "lgtoken":loginResults["login"]["token"], "format":"json"}
            success, loginResults,c = self.post(self.wiki_url + "api.php", confirmationData, c)
            if not success:
                return False
        self.login_cookies = c
        return True

    def get_token(self):
        data = {"action":"query","meta":"tokens", "format":"json"}
        success, loginResults, c = self.post(self.wiki_url + "api.php", data)
        if not success:
            return False
        self.token = loginResults["query"]["tokens"]["csrftoken"]
        return True

    def __homonyms_to_wikisyntax__(self, homonyms,lemma):
        #This will be done using the same JS wiki uses!
        ctx = execjs.compile(self.js)
        wiki = ctx.call("jsonsToWikiFromDjango", homonyms,lemma)
        return wiki


    def post_lemma(self, lemma, language, lemmaData):
        homonyms = self.__homonyms_to_wikisyntax__(lemmaData["homonyms"],lemma)
        postParameters = {"action": "edit", "title": language + ":" + lemma, "text" : homonyms, "recreate": True, "token": self.token, "bot": True}
        success, results, c = self.post(self.wiki_url + "api.php", postParameters)
        return success, results




