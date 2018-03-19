#encoding: utf-8
import pickle, requests
queries = pickle.load(open("wiki_queries.bin", "rb"))
url = "http://sanat.csc.fi:8000/smsxml/updateLemma/"
for query in queries:
	query["homonyms"] = query["homonyms"].replace(u"{homonyms:", u"{\"homonyms\":").replace(",]}", "]}")
	r = requests.post(url, data=query)
	success = r.status_code >= 200 and r.status_code < 300
	if not success:
		print query