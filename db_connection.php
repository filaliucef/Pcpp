<?php
$server = 'db40223.public.databaseasp.net';
$user = 'db40223';
$pass = 'iD-7K4c=n+8X';
$db = 'db40223';

$conn = new mysqli($server, $user, $pass, $db);

if ($conn->connect_error) {
 die("Connection failed: " . $conn->connect_error);
}
echo "Connected!";
?>
// upload.php
if(isset($_FILES['pdf_file'])) {
 $file = $_FILES['pdf_file'];
 $target = 'uploads/' . $file['name'];
 move_uploaded_file($file['tmp_name'], $target);

 // Save to database
 $sql = "INSERT INTO files (name, path) VALUES ('".$file['name']."', '$target')";
 $conn->query($sql);
}

