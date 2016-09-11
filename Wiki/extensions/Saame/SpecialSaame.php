<?php
class SpecialSaame extends SpecialPage {
	function __construct() {
		parent::__construct( 'Saame' );
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

	public static function sendChangeToDjango($change, $jsonData, $lemma){
		$url = "http://127.0.0.1:8000/";
		$apiKey = "sdfrf4535gdg35ertgfd";
		if($change == "delete"){
			$url = $url . "deleteLemma/";
		}else{
			$url = $url . "updateLemma/";
		}
		$data = array('lemma' => $lemma, 'homonyms' => $jsonData, "api" => $apiKey, "lang" => "sms");

		$error = self::httpPost($url, $data);
		if ($error) { 
			$m = new MongoClient(); // connect
			$collection = $m->selectCollection("wiki2django_queue", 'sms');
			$collection->insert($data);
			error_log("Django connection failed" . $error . $url);
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
		if (self::startsWith(strtolower($title), "sms:")){
			#Modify only Skolt Sami pages
			$editPage->editFormPageTop .= "<script type='text/javascript' src='/js/sms_edit.js'></script> <link rel='stylesheet' type='text/css' href='/js/sms.css'>";
		}
		
		return $editPage;
	 }
	public static function startsWith($haystack, $needle) {
     	$length = strlen($needle);
     	return (substr($haystack, 0, $length) === $needle);
	}
	public static function onDelete( &$article, User &$user, $reason, $id, Content $content = null, LogEntry $logEntry ) { 
		$title = $article->getTitle();
		if (self::startsWith(strtolower($title), "sms:")){
			#Sami page was deleted
			$lemma = explode(":", $title, 2);
			self::sendChangeToDjango("delete", "[]", $lemma[1]);
		}
	}
	public static function onChange($title, $articleText){
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
		self::sendChangeToDjango("edit", $homonyms, $lemma[1]);

	}


	public static function onArticleUndelete( Title $title, $create, $comment, $oldPageId ) { #TODO
		$t = $title->getFullText();
	}
	public static function onArticleRevisionUndeleted( $title, $revision, $oldPageID ) { #TODO
	}
	public static function onArticleInsertComplete( &$article, User &$user, $text, $summary, $minoredit, $watchthis, $sectionanchor, &$flags, Revision $revision ) { 
		$title = $article->getTitle();
		$wikiText = $article->getRawText();
		self::onChange($title, $wikiText);
	 }
	public static function onPageContentSaveComplete( $article, $user, $content, $summary, $isMinor, $isWatch, $section, $flags, $revision, $status, $baseRevId ) { 
		$title = $article->getTitle();
		$wikiText = $article->getRawText();
		self::onChange($title, $wikiText);
	 }
	public static function onArticleRollbackComplete( &$article, $user, $revision, $current ) { 
		$title = $article->getTitle();
		$wikiText = $article->getRawText();
		self::onChange($title, $wikiText);
	 }

	 public static function onBeforePageDisplay( $editPage, $skin ) {
		$title = $editPage->getPageTitle();
		if (self::startsWith(strtolower($title), "sms:")){
			#Modify only Skolt Sami pages
			$editPage->addScript("<script type='text/javascript' src='/js/sms_view.js'></script>");
			$editPage->addStyle( "/js/sms_view.css");
		}
		
		return $editPage;
	 }
}