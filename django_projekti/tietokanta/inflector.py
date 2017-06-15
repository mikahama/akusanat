#encoding: utf-8
import os
try:
    import hfst
except:
    pass


def return_all_inflections(lemma, pos, language="sms"):
    if type(lemma) is unicode:
        lemma = lemma.encode('utf-8')
    if type(pos) is unicode:
        pos = pos.encode('utf-8')
    if language in language_processors:
        return language_processors[language](lemma, pos)
    else:
        return []

pos_dict = {"V": {"1st":["+Ind+Prs+", "+Ind+Prt+", "+Pot+", "+Cond+", "+Imprt+"], "2nd": ["Sg", "Pl"], "3rd": ["1","2","3"], "comp": ["ConNeg", "Sg4"]},
                "N" : {"1st": ["+", "+Der/Dimin+N+"], "2nd": ["Sg", "Pl"], "3rd": ["+Nom", "+Gen", "+Acc", "+Ill", "+Loc", "+Com", "+Abe"], "comp": ["Ess", "Par"]},
                "A" : {"1st": ["+","+Comp+","+Superl+"], "2nd": ["Sg", "Pl"], "3rd": ["+Nom", "+Gen", "+Acc", "+Ill", "+Loc", "+Com", "+Abe"], "comp": ["Ess", "Par"]}
                }

human_readable = {"+Ind+Prs+":"indikatiivin preesens", "+Ind+Prt+":"indikatiivin imperfekti", "+Pot+":"potentiaali", "+Cond+":"konditionaali", "+Imprt+":"imperatiivi", "Sg":"yksikkö", "Pl": "monikko", "1": "1. persoona", "2": "2. persoona", "3":"3. persoona", "Sg4":"4. persoona", "ConNeg":"konnegaatio", "+": "", "+Der/Dimin+N+": "diminuitiivi", "+Nom": "nominatiivi", "+Gen":"genetiivi", "+Acc":"akkusatiivi", "+Ill":"illatiivi", "+Loc":"lokatiivi", "+Com":"komitatiivi", "+Abe":"abessiivi", "Ess":"essiivi", "Par":"partitiivi", "+Comp+":"komparatiivi","+Superl+":"superlatiivi", "Px":"omistusmuoto"}


def __inflect_sms__(lemma, pos):
    BASE_DIR = os.path.dirname(os.path.dirname(__file__))
    file_path = os.path.join(BASE_DIR, "transducers/sms/generator-dict-gt-norm.hfstol")

    queries, q_trans = __generator_queries__(lemma, pos)

    return __inflect_generic__(queries, q_trans, file_path)


def __get_trans__(key_list):
    trans = ""
    for item in key_list:
        trans = trans + human_readable[item] + " "
    return trans

def __generator_queries__(lemma, pos):
    d = pos_dict[pos]
    queries = []
    query_trans = []
    if True:
        for x in d["1st"]:
            for y in d["2nd"]:
                for z in d["3rd"]:
                    query = lemma +  "+" + pos  + x  + y + z
                    queries.append(query)
                    query_trans.append(__get_trans__([x, y, z]))
            for c in d["comp"]:
                query = lemma +  "+" + pos + x   + c
                queries.append(query)
                query_trans.append(__get_trans__([x, c]))
    else:
        for x in d["1st"]:
            for y in d["2nd"]:
                query = lemma +  "+" + pos + "+"+ x + "+" + y
                queries.append(query)
                query_trans.append(__get_trans__([x, y]))
        for c in d["comp"]:
            query = lemma +  "+" + pos + "+" + c
            queries.append(query)
            query_trans.append(__get_trans__([c]))
    if pos == "N":
        more_queries = []
        more_trans = []
        nums = ["Sg", "Pl"]
        pers = ["1","2","3"]
        for i in range(len(queries)):
            query = queries[i]
            for num in nums:
                for per in pers:
                    more_queries.append(query+"+Px"+num+per)
                    more_trans.append(query_trans[i] + __get_trans__(["Px", num, per]))
        queries.extend(more_queries)
        query_trans.extend(more_trans)

    return queries, query_trans

def __inflect_generic__(queries, q_translations, file_path):
    input_stream = hfst.HfstInputStream(file_path)
    synthetiser = input_stream.read()
    results = []
    for i in range(len(queries)):
        q = queries[i]
        r = synthetiser.lookup(q)
        try:
            item =[r[0][0].split("@")[0], q_translations[i]]
            results.append(item)
        except:
            pass
    return results

language_processors = {"sms":__inflect_sms__}