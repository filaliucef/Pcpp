<?php
include 'db_connection.php';
if ($_POST) {
 $email = $_POST['email'];
 $pass = $_POST['pass'];
 $sql = "SELECT * FROM users WHERE email='$email'";
 $result = $conn->query($sql);
 if ($row = $result->fetch_assoc()) {
 if (password_verify($pass, $row['password'])) {
 echo "Login OK!";
 } else {
 echo "Wrong pass!";
 }
 } else {
 echo "User not found!";
 }
}
?>
<form method="POST">
 Email: <input type="email" name="email" required>
 Pass: <input type="password" name="pass" required>
 <button>Login</button>
</form>
