<?php
$lemma = htmlspecialchars($_GET["lemma"]);
$language = htmlspecialchars($_GET["language"]);
$pos = htmlspecialchars($_GET["pos"]);
$url = "http://sanat.csc.fi:8000/smsxml/";
$data = file_get_contents($url . "inflect/?language=" . $language . "&lemma=" . $word . "&pos=" . $pos);
echo $data;
?>