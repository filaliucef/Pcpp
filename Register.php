<?php
include 'db_connection.php';
if ($_POST) {
 $email = $_POST['email'];
 $pass = password_hash($_POST['pass'], PASSWORD_DEFAULT);
 $sql = "INSERT INTO users (email, password) VALUES ('$email', '$pass')";
 if ($conn->query($sql)) {
 echo "Registered! <a href='login.php'>Login</a>";
 } else {
 echo "Error: " . $conn->error;
 }
}
?>
<form method="POST">
 Email: <input type="email" name="email" required>
 Pass: <input type="password" name="pass" required>
 <button>Register</button>
</form>
