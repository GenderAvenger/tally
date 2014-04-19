<?php
  if (!isset($_POST['submit']) == "Visualize") 
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
	<title>Visualize Equality</title>
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

<p>Wait! Where are the women?</p>

<p>No women on a panel. Just a few on the agenda. Women missing from a book of ideas, or absent from a cultural event.</p>

<p>Stop being annoyed. Act.</p>

<p>Count up the speakers on the agenda, or on the panel you are attending. Or among the authors in an anthology, or on media lists of the “Top 30 This” or "Top 30 That".</p>

<p>Enter the numbers here and generate a graphic to amplify your voice:</p>

<p>What is the name of the conference or session? <input type="text" name="Name" maxlength="50" value="<?=$varName;?>"></p>

<p>How many male speakers or selectees? <input type="text" name="Male" value="<?=$varMale;?>"></p>

<p>How many female speakers or selectees? <input type="text" name="Female" value="<?=$varFemale;?>"></p>

<p>What is the hashtag? <input type="text" name="Hashtag" value="<?=$varHashtag;?>"></p>

<p><input type="submit" name="submit" value="Visualize"></p>
</form>
</body>
</html>
