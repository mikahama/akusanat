#encoding: utf-8
__author__ = 'mikahamalainen'

from pymongo import MongoClient
import tietokanta.xml_to_db as xml_to_db
from tietokanta.models import WikiUpdateQueue
import time
client = MongoClient()

def __identify_homonym__(homonym, id_by, id):
    if id_by not in homonym.keys():
        return False
    if homonym[id_by] == id:
        return True
    else:
        return False

def __write_to_db__(lemma_data, language="sms"):
    collection = __get_db_collection__(language)
    if "_id" in lemma_data.keys():
        #update
        collection.update_one({"_id": lemma_data["_id"]}, { "$set": { "homonyms" : lemma_data["homonyms"]}})
    else:
        #add new
        collection.insert_one(lemma_data)

def __create_empty_lemma__(lemma):
    """
    Creates an empty lemma DB structure that can be stored later to the DB
    :param lemma:
    :return:
    """
    lemma_dict = {"lemma": lemma}
    lemma_dict["created_at"] = time.time()
    lemma_dict["homonyms"] = []
    return lemma_dict

def __get_db_collection__(language="sms"):
    db = client["wiki_sync"]
    return db[language]

def __merge_dictionaries__(old, new, replace=True):
    was_changed = False
    for key in new.keys():
        data = new[key]
        if key in old.keys():
            if type(data) == dict:
                #dictionary -> recursion
                change = __merge_dictionaries__(old[key], new[key],replace)
                if not was_changed:
                    was_changed = change
            elif type(data) == list:
                if len(data) > 0 and type(data[0]) == dict:
                    for i in range(len(data)):
                        if len(old[key]) > i:
                            old_d = old[key][i]
                        else:
                            old_d = {}
                        change = __merge_dictionaries__(old_d, new[key][i],replace)
                        if not was_changed:
                            was_changed = change
                elif replace:
                    if len(data) != old[key]:
                        old[key] = data
                        was_changed = True
                    else:
                        for i in range(len(data)):
                            if old[key][i] != data[i]:
                                old[key][i] = data[i]
                                was_changed = True
                else:
                    old[key] = list(old[key] + data)
                    was_changed = True
            else:
                #not a list or a dictionary
                if old[key] != new[key]:
                    old[key] = new[key]
                    was_changed = True

        else:
            #completely new data!
            was_changed = True
            old[key] = new[key]

    return was_changed

def __get_lemma__(lemma, language="sms"):
    """
    Gets a lemma's data from the DB. Default language is Skolt Sami
    :param lemma:
    :param language:
    :return: data, boolean indicating whether it's a new record
    """
    collection = __get_db_collection__(language)
    result = collection.find_one({"lemma": lemma})
    if result is None:
        return __create_empty_lemma__(lemma), True
    else:
        return result, False

def update_word_in_lemma(lemma, word, identify_homonym_by="POS", language="sms",first_time_sync=False):
    lemma, empty = __get_lemma__(lemma, language)
    id = word[identify_homonym_by]
    exists = False
    for homonym in lemma["homonyms"]:
        if __identify_homonym__(homonym, identify_homonym_by, id):
            #The homonym already exists -> update
            exists = True
            was_changed = __merge_dictionaries__(homonym, word, not first_time_sync)
    if not exists:
        was_changed = True
        lemma["homonyms"].append(word)

    if was_changed:
        __write_to_db__(lemma, language)
        __update_to_wiki__(lemma["lemma"], language)

def drop_lemma(lemma, language="sms"):
    collection = __get_db_collection__(language)
    collection.remove({"lemma": lemma})

def update_lemma(lemma, homonyms, language="sms"):
    lem, new = __get_lemma__(lemma, language)
    lem["homonyms"] = homonyms
    __write_to_db__(lem, language)

def get_all_lemmas(language):
    collection = __get_db_collection__(language)
    return collection.find()

def get_lemma(lemma, language):
    data, new = __get_lemma__(lemma, language)
    if new:
        return None
    else:
        return data

def store_xml_in_db(xml_data, file_type, file_name, language, first_time_sync=False):
    data = xml_to_db.update_db_from_xml(xml_data, file_type, file_name, language)
    for item in data:
        update_word_in_lemma(item[0], item[1], "POS", "sms", first_time_sync)

def __update_to_wiki__(lemma, language):
    try:
        #check if already queued
        WikiUpdateQueue.objects.get(lemma = lemma)
    except:
        #not in queue -> add
        item = WikiUpdateQueue(lemma=lemma,language=language)
        item.save()
        #TODO: Process the queue