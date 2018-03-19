#encoding: utf-8
import urllib2
import codecs, pickle
from bs4 import BeautifulSoup
from wikitool import Wikitool
import json
import xml.etree.ElementTree as ET

illegal_chars = [u"´", u"ˊ", u"ẹ", u"ˈ"]
language = "sms"

wt = Wikitool("SyncBot","SyncBot12", language)
wt.login()
wt.get_token()

pages = []
def get_pages(all_pages=False):
	global pages
	key = "categorymembers"
	if all_pages:
		key = "allpages"
	lastContinue = {'continue': ''}
	while True:
		success, results = wt.get_pages(lastContinue, all_pages)
		pages.extend(results["query"][key])
		if "continue" not in results:
			break
		lastContinue = results['continue']
	pickle.dump(pages, open("wiki_page_list.bin", "wb"))

pages = codecs.open("sms_sanat.txt", "r", encoding="utf-8")

i = 0
queries = []
for page in pages:
    page_id = u"Sms:" + page.replace("\n","")
    s, poem_json= wt.get_a_page(page_id, "titles")
    root = ET.fromstring(poem_json["query"]["export"]["*"].encode('utf-8'))
    title = page.replace("\n","")
    wiki_syntax = root.find('{http://www.mediawiki.org/xml/export-0.10/}page/{http://www.mediawiki.org/xml/export-0.10/}revision/{http://www.mediawiki.org/xml/export-0.10/}text').text
    homonyms = "{homonyms:["
    index = wiki_syntax.find("class=\"json_data\">")
    while index > -1:
    	wiki_syntax = wiki_syntax[index + len("class=\"json_data\">"):]
    	json = wiki_syntax[: wiki_syntax.find("</span>")]
    	homonyms = homonyms + json  + ","
    	index = wiki_syntax.find("class=\"json_data\">")
    homonyms = homonyms + "]}"
    post_parameters = {'lemma':title, 'homonyms': homonyms, "api": "sdfrf4535gdg35ertgfd", "lang": language}
    queries.append(post_parameters)
    i = i + 1
    if i % 1000 == 0:
    	pickle.dump(queries, open("wiki_queries.bin", "wb"))
    	print "dump", i

pickle.dump(queries, open("wiki_queries.bin", "wb"))

print "Done!!"
