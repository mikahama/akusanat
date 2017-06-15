<?php
class SpecialSaame extends SpecialPage {

	function __construct() {
		parent::__construct( 'Saame' );
	}

	public static function getSupportedLanguages(){
		return array("sms", "izh");
	}

	public static function httpPost($url, $data){
	    $curl = curl_init($url);
	    curl_setopt($curl, CURLOPT_POST, true);
	    curl_setopt($curl, CURLOPT_POSTFIELDS, http_build_query($data));
	    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	    $response = curl_exec($curl);
	    error_log("Django said: " . $response);
	    $error = curl_error($curl);
	    curl_close($curl);
	    return $error;
	}

	public static function sendChangeToDjango($change, $jsonData, $lemma, $langCode){
		$configs = parse_ini_file('SaameConfig.ini');
		$url = $configs["djangoUrl"];
		$apiKey = $configs["djangoApiKey"];
		if($change == "delete"){
			$url = $url . "deleteLemma/";
		}else{
			$url = $url . "updateLemma/";
		}
		$data = array('lemma' => $lemma, 'homonyms' => $jsonData, "api" => $apiKey, "lang" => $langCode);

		$error = self::httpPost($url, $data);
		if ($error) { 
			$m = new MongoClient(); // connect
			$collection = $m->selectCollection("wiki2django_queue", $langCode);
			$collection->insert($data);
			error_log("Django connection failed" . $error . $url);
		}

	}

	public static function getWikiText($article){

    $revision = $article->getRevision();
    $content = $revision->getContent( Revision::RAW );
    $text = ContentHandler::getContentText( $content );
    return $text;

	}

	private static function languageSupported($title){
		$langCode = strtolower(substr($title, 0, 3)); 
		if(in_array($langCode, self::getSupportedLanguages())){
			return $langCode;
		}else{
			return false;
		}
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
		$langCode = self::languageSupported($title);
		if ($langCode){
			#Modify only pages of supported languages
			$configs = parse_ini_file('SaameConfig.ini');
			$editPage->editFormPageTop .= "<script type='text/javascript' src='". $configs["jsBaseUrl"] . "sms_edit.js'></script> <link rel='stylesheet' type='text/css' href='". $configs["jsBaseUrl"] . "sms.css'>";
		}
		
		return $editPage;
	 }
	public static function startsWith($haystack, $needle) {
     	$length = strlen($needle);
     	return (substr($haystack, 0, $length) === $needle);
	}
	public static function onDelete( &$article, User &$user, $reason, $id, Content $content = null, LogEntry $logEntry ) { 
		$title = $article->getTitle();
		$langCode = self::languageSupported($title);
		if ($langCode){
			#Sami page was deleted
			$lemma = explode(":", $title, 2);
			self::sendChangeToDjango("delete", "[]", $lemma[1], $langCode);
		}
	}
	public static function onChange($title, $articleText){
		$langCode = self::languageSupported($title);
		if (!$langCode){
			//If the language is not supported, don't do a thing
			return;
		}
		$lemma = explode(":", $title, 2);
		$homonyms = "[";
		while(true){
			$index = strpos($articleText, "class=\"json_data\">");
			if ($index === FALSE){
				break;
			}
			$articleText = substr($articleText, $index +18);
			$endIndex = strpos($articleText, "</span>");
			$homonyms = $homonyms . substr($articleText, 0, $endIndex) . ",";
			$articleText = substr($articleText, $endIndex);
		}
		if(strlen($homonyms) >1){
			#Let's delete the last comma
			$homonyms = substr($homonyms, 0, strlen($homonyms)-1);
		}
		$homonyms = "{ \"homonyms\" : " . $homonyms . "] }";
		self::sendChangeToDjango("edit", $homonyms, $lemma[1], $langCode);

	}


	public static function onArticleUndelete( Title $title, $create, $comment, $oldPageId ) { #TODO
		$t = $title->getFullText();
	}
	public static function onArticleRevisionUndeleted( $title, $revision, $oldPageID ) { #TODO
	}
	public static function onArticleInsertComplete( &$article, User &$user, $text, $summary, $minoredit, $watchthis, $sectionanchor, &$flags, Revision $revision ) { 
		$title = $article->getTitle();
		$wikiText = self::getWikiText($article);
		self::onChange($title, $wikiText);
	 }
	public static function onPageContentSaveComplete( $article, $user, $content, $summary, $isMinor, $isWatch, $section, $flags, $revision, $status, $baseRevId ) { 
		$title = $article->getTitle();
		$wikiText = self::getWikiText($article);
		self::onChange($title, $wikiText);
	 }
	public static function onArticleRollbackComplete( &$article, $user, $revision, $current ) { 
		$title = $article->getTitle();
		$wikiText = self::getWikiText($article);
		self::onChange($title, $wikiText);
	 }

	 public static function onBeforePageDisplay( $editPage, $skin ) {
		$title = $editPage->getPageTitle();
		$langCode = self::languageSupported($title);
		if ($langCode){
			#Modify only pages of supported languages
			$configs = parse_ini_file('SaameConfig.ini');
			$url = $configs["djangoUrl"];
			$editPage->addScript("<script type='text/javascript' src='". $configs["jsBaseUrl"] . "prototype.js'></script>");
			$editPage->addScript("<script type='text/javascript' src='". $configs["jsBaseUrl"] . "audio.js'></script>");
			$editPage->addScript("<script type='text/javascript' src='". $configs["jsBaseUrl"] . "sms_view.js'></script>");
			$editPage->addScript("<script type='text/javascript'>var djangoURL = \"" . $url . "\";</script>");
			$editPage->addStyle( $configs["jsBaseUrl"] . "sms_view.css");
		}
		
		return $editPage;
	 }
}