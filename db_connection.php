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
CREATE TABLE users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 username VARCHAR(50),
 email VARCHAR(100),
 password VARCHAR(255)
);
// register.php
$username = $_POST['username'];
$email = $_POST['email'];
$pass = password_hash($_POST['password'], PASSWORD_DEFAULT);

$sql = "INSERT INTO users (username, email, password) VALUES ('$username', '$email', '$pass')";
$conn->query($sql);
// login.php
$email = $_POST['email'];
$pass = $_POST['password'];

$sql = "SELECT * FROM users WHERE email='$email'";
$result = $conn->query($sql);
$user = $result->fetch_assoc();

if(password_verify($pass, $user['password'])) {
 // Login OK
 $_SESSION['user_id'] = $user['id'];
}

// upload.php
if(isset($_FILES['pdf_file'])) {
 $file = $_FILES['pdf_file'];
 $target = 'uploads/' . $file['name'];
 move_uploaded_file($file['tmp_name'], $target);

 // Save to database
 $sql = "INSERT INTO files (name, path) VALUES ('".$file['name']."', '$target')";
 $conn->query($sql);
}

