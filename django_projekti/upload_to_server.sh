#!/bin/bash
rm Archive.zip
zip -r Archive.zip manage.py update_smsxml.sh saame/* tietokanta/*

scp Archive.zip root@mikakalevi.com:/var/www/html/downloads/sms_xml.zip