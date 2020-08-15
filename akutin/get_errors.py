from mikatools import *
from uralicNLP import uralicApi
from tqdm import tqdm

for lang in ["sms", "kpv", "myv", "mdf"]:
	print(lang)
	lemmas = set(uralicApi.dictionary_lemmas(lang))
	wiki_words = json_load(lang +".json")
	wrong = []
	for w in tqdm(wiki_words):
		w = w["text"]
		lan, lem = w.split(":",1)
		if lem not in lemmas:
			wrong.append(w)
	json_dump(wrong, lang + "_wrong.json")
