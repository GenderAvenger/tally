<?php
$id = 'cb63bb7969ef9c5';
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.imgur.com/3/image.json');
    curl_setopt($ch, CURLOPT_POST, TRUE);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array( 'Authorization: Client-ID ' . $id));
    curl_setopt($ch, CURLOPT_POSTFIELDS, array('image' => base64_encode($image), 'album' => Di9cT));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $response = curl_exec($ch);
    $response = json_decode($response);
    curl_close ($ch);
?>