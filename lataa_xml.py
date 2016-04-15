import urllib2
import urllib
url = "https://victorio.uit.no/langtech/trunk/langs/sms/src/morphology/stems/"
response = urllib2.urlopen(url)
html = response.read()
from BeautifulSoup import BeautifulSoup
soup = BeautifulSoup(html)
for li in soup.findAll('li'):
	dl_url = li.a.get('href')
	if dl_url == "../":
		pass
	else:
		urllib.urlretrieve (url +"/" + dl_url, "XML/" + dl_url)
