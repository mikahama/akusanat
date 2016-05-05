<?php
class SpecialSaame extends SpecialPage {
	function __construct() {
		parent::__construct( 'Saame' );
	}

	function execute( $par ) {
		$request = $this->getRequest();
		$output = $this->getOutput();
		$this->setHeaders();

		# Get request data from, e.g.
		$param = $request->getText( 'param' );

		# Do stuff
		# ...
		$wikitext = 'This provides editing for skolt sami';
		$output->addWikiText( $wikitext );
	}
	public static function onAlternateEdit( $editPage ) {
		$title = $editPage->mArticle->getTitle();
		if (self::startsWith(strtolower($title), "sms")){
			#Modify only Skolt Sami pages
			$editPage->editFormPageTop .= "<script type='text/javascript' src='/js/sms_edit.js'></script> <link rel='stylesheet' type='text/css' href='/js/sms.css'>";
		}
		
		return $editPage;
	 }
	public static function startsWith($haystack, $needle) {
     	$length = strlen($needle);
     	return (substr($haystack, 0, $length) === $needle);
	}
}