<?php
$name = $_POST["name"];
$message = $_POST["message"];
mail("your_email@site.com", "Subject", "Message from your site. \n Name: ".$name." \n Message: ".$message);
?>