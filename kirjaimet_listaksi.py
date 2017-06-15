import codecs
f = codecs.open("kirjaimet_sms.txt", "r", encoding="UTF-8")
are_vowels = True

vowel_list = u"["
consonant_list = u"["

for line in f:
	line = line.replace("\n", "")
	if len(line) == 0:
		continue
	if line == "B":
		are_vowels = False
	if are_vowels:
		vowel_list += " \"" + line + "\","
	else:
		consonant_list += " \"" + line + "\","

text = u"var vowels = " + vowel_list + u"];\nvar consonants=" + consonant_list +"];"
print text