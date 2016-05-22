import requests
url = "http://mikakalevi.com/"

def server_push_latest():, 
	r = requests.get(url, data = {'api':'45454arefg785421!R'}, timeout=None)
	assert r.status_code == requests.codes.ok