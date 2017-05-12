#!/bin/bash
echo "dowloading parts"
wget -O /www/smsxml/sms_xml_wiki_extensions.zip http://mikakalevi.com/downloads/sms_xml_wiki_extensions.zip
wget -O /www/smsxml/sms_xml.zip http://mikakalevi.com/downloads/sms_xml.zip
echo "backup configuration"
cp /www/smsxml/saame/settings.py /www/smsxml/settings_backup
echo "unzipping..."
unzip -o /www/smsxml/sms_xml_wiki_extensions.zip -d /www/smsxml/wiki/
unzip -o /www/smsxml/sms_xml.zip -d /www/smsxml/
chmod +x /www/smsxml/update_smsxml.sh
echo "restoring backup configuration"
cp /www/smsxml/settings_backup /www/smsxml/saame/settings.py
echo "migrations"
sh /www/smsxml/migrate.sh
echo "restarting django"
touch /www/smsxml/saame/wsgi.py