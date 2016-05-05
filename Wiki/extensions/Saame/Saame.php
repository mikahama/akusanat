<?php
# Alert the user that this is not a valid access point to MediaWiki if they try to access the special pages file directly.
if ( !defined( 'MEDIAWIKI' ) ) {
	echo <<<EOT
To install Saame, put the following line in LocalSettings.php:
require_once "$IP/extensions/Saame/Saame.php";
EOT;
	exit( 1 );
}

$wgExtensionCredits['specialpage'][] = array(
	'path' => __FILE__,
	'name' => 'Saame',
	'author' => 'Mika Hämäläinen',
	'url' => 'https://www.mikakalevi.com',
	'descriptionmsg' => 'An extension for Skolt Same',
	'version' => '1.0.0',
);

$wgAutoloadClasses['SpecialSaame'] = __DIR__ . '/SpecialSaame.php'; # Location of the SpecialMyExtension class (Tell MediaWiki to load this file)
$wgMessagesDirs['Saame'] = __DIR__ . "/i18n"; # Location of localisation files (Tell MediaWiki to load them)
$wgExtensionMessagesFiles['SaameAlias'] = __DIR__ . '/Saame.alias.php'; # Location of an aliases file (Tell MediaWiki to load it)
$wgSpecialPages['Saame'] = 'SpecialSaame'; # Tell MediaWiki about the new special page and its class name
$wgHooks['AlternateEdit'][] = 'SpecialSaame::onAlternateEdit';