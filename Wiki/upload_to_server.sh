#!/bin/bash
rm Archive.zip
zip -r Archive.zip extensions/* js/* skins/*

scp Archive.zip root@mikakalevi.com:/var/www/html/downloads/sms_xml_wiki_extensions.zip