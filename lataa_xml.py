import urllib2
import urllib
#izh https://victorio.uit.no/langtech/trunk/langs/izh/src/morphology/stems/
url = "https://victorio.uit.no/langtech/trunk/ped/sms/src/"
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
		urllib.urlretrieve (url +"/" + dl_url, "XML/" + dl_url)
