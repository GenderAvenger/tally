<?php
  if (!isset($_POST['submit']) == "Submit") 
  {
    $errorMessage = "";
 
  if(empty($_POST['Name'])) 
  {
    $errorMessage .= "<li>You forgot to enter the conference or session name</li>";
  }
  if(empty($_POST['Male'])) 
  {
    $errorMessage .= "<li>You forgot to enter the number of male speakers</li>";
  }
  if(empty($_POST['Female'])) 
  {
    $errorMessage .= "<li>You forgot to enter the number of female speakers</li>";
  }
  
    $varHashtag = (!isset($_POST['Hashtag']));
    $varName = (!isset($_POST['Name']));
    $varMale = (!isset($_POST['Male']));
    $varFemale = (!isset($_POST['Female']));
    
    if(!empty($errorMessage)) 
  {
		$fs = fopen("mydata.csv","a");
		fwrite($fs,$varName . ", " . $varMale . ", " . $varFemale . ", " . $varHashtag . "\n");
		fclose($fs);
		
		header("Location: thankyou.html");
		exit;
	}
  }
  ?>

<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd"> 
<html>
<head>
	<title>Even Steven</title>
</head>

<body>
	<?php
		if(!empty($errorMessage)) 
		{
			echo("<p>There was an error with your form:</p>\n");
			echo("<ul>" . $errorMessage . "</ul>\n");
		} 
	?>
<form action="evensteven.php" method="post">  

<p>The conference or session name: <input type="text" name="Name" maxlength="50" value="<?=$varName;?>"></p>

<p>The number of male speakers: <input type="text" name="Male" value="<?=$varMale;?>"></p>

<p>The number of female speakers: <input type="text" name="Female" value="<?=$varFemale;?>"></p>

<p>The conference or session hashtag: <input type="text" name="Hashtag" value="<?=$varHashtag;?>"></p>

<p><input type="submit" name="submit" value="Submit"></p>
</form>
</body>
</html>
