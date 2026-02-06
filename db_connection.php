<?php
$conn = new mysqli('db40223.public.databaseasp.net', 'db40223', 'iD-7K4c=n+8X', 'db40223', 3306);
if ($conn->connect_error) {
 die("Error: " . $conn->connect_error);
}
echo "Connected!";

CREATE TABLE users (
 id INT AUTO_INCREMENT PRIMARY KEY,
 username VARCHAR(50),
 email VARCHAR(100),
 password VARCHAR(255)
);
session_start();
$email = $_POST['email'];
$pass = $_POST['password'];
$sql = "SELECT * FROM users WHERE email=?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();
$user = $result->fetch_assoc();

if($user && password_verify($pass, $user['password'])) {
 $_SESSION['user_id'] = $user['id'];
 echo "Login OK!";
} else {
 echo "Error!";
}
$stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $username, $email, $pass);
$stmt->execute();
// register.php
$username = $_POST['username'];
$email = $_POST['email'];
$pass = password_hash($_POST['password'], PASSWORD_DEFAULT);

$stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $username, $email, $pass);

if($stmt->execute()) {
 echo "Registered!";
} else {
 echo "Error: " . $stmt->error;
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

