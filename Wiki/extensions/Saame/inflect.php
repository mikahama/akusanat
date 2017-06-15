<?php
$lemma = htmlspecialchars($_GET["lemma"]);
$language = htmlspecialchars($_GET["language"]);
$pos = htmlspecialchars($_GET["pos"]);
$configs = parse_ini_file('SaameConfig.ini');
$url = $configs["djangoUrl"];
$data = file_get_contents($url . "inflect/?language=" . $language . "&lemma=" . $word . "&pos=" . $pos);
echo $data;
?>