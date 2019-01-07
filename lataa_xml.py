import urllib2
import urllib
#izh https://victorio.uit.no/langtech/trunk/langs/izh/src/morphology/stems/
#https://victorio.uit.no/langtech/trunk/langs/sms/src/morphology/stems/
#https://victorio.uit.no/langtech/trunk/ped/sms/src/
#https://victorio.uit.no/langtech/trunk/ped/sms/finsms/
#https://victorio.uit.no/langtech/trunk/langs/mdf/src/morphology/stems/
#url = "https://victorio.uit.no/langtech/trunk/words/dicts/koikpv/src/"

#urls = ["https://victorio.uit.no/langtech/trunk/words/dicts/smenob/src/", "https://victorio.uit.no/langtech/trunk/words/dicts/smefin/src/" , "https://victorio.uit.no/langtech/trunk/words/dicts/smesma/src/","https://victorio.uit.no/langtech/trunk/words/dicts/smesmj/src/","https://victorio.uit.no/langtech/trunk/words/dicts/smesmn/src/"]
#urls = ["https://victorio.uit.no/langtech/trunk/langs/sms/src/morphology/stems/"]
urls = ["https://victorio.uit.no/langtech/trunk/words/dicts/kpv2X/src/"]

for url in urls:
	save_to_dir = "/kpv/"

	response = urllib2.urlopen(url)
	html = response.read()
	from BeautifulSoup import BeautifulSoup
	soup = BeautifulSoup(html)
	for li in soup.findAll('li'):
		dl_url = li.a.get('href')
		print "Downloading ", dl_url
		if dl_url == "../":
			pass
		else:
			urllib.urlretrieve (url +"/" + dl_url, "XML" + save_to_dir + dl_url)
