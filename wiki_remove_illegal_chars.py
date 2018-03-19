#encoding: utf-8
import codecs
illegal_chars = [u"´", u"ˊ", u"ẹ", u"ˈ"]
f = codecs.open("sms_sanat.txt", "r", encoding="utf-8")
to_delete = []
for lemma in f:
	lemma = lemma.replace("\n","")
	for c in illegal_chars:
		if c in lemma:
			to_delete.append(c)
			break

print to_delete

