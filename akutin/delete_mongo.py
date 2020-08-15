from pymongo import MongoClient
from mikatools import *
client = MongoClient()

for lang in ["kpv", "sms"]:
	db = client["wiki_sync"]
	collection = db[lang]
	words = json_load(lang + "_wrong.json")
	for w in words:
		print(w)
		collection.delete_one({"lemma": w.split(":",1)[1]})
		collection.delete_one({"lemma": w.split(":",1)[1].lower()})