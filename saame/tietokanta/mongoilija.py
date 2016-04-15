#encoding: utf-8
__author__ = 'mikahamalainen'

from pymongo import MongoClient
client = MongoClient()


def __get_db__(language="sms"):
    db = client["wiki_sync_" + language]
    return db


