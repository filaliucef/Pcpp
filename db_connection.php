<?php
$server = 'db40223.public.databaseasp.net';
$user = 'db40223';
$pass = 'iD-7K4c=n+8X';
$db = 'db40223';

$conn = new mysqli($server, $user, $pass, $db, 3306);
if ($conn->connect_error) {
 die("Error: " . $conn->connect_error);
}
// echo "Connected!";
?>
