<?php
$server = 'db40223.databaseasp.net';
$user = 'db40223';
$pass = 'your_password_here';
$db = 'db40223';

// When running ON MonsterASP, this local connection should be allowed
$conn = new mysqli($server, $user, $pass, $db, 3306);

if ($conn->connect_error) {
    die("Local Connection failed: " . $conn->connect_error);
}
?>


// Initialize database tables if they don't exist
function initDatabase() {
    $conn = getDBConnection();
    
    // Users table
    $sql = "CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        level VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $conn->query($sql);
    
    // Notes/Documents table
    $sql = "CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        type ENUM('pdf', 'note') NOT NULL,
        matiere VARCHAR(100) NOT NULL,
        description TEXT,
        content LONGTEXT,
        file_name VARCHAR(255),
        file_data LONGTEXT,
        author_id INT NOT NULL,
        author_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    )";
    $conn->query($sql);
    
    // Comments table
    $sql = "CREATE TABLE IF NOT EXISTS comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        note_id INT NOT NULL,
        text TEXT NOT NULL,
        author_id INT NOT NULL,
        author_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
    )";
    $conn->query($sql);
    
    $conn->close();
}

// Helper function to send JSON response
function jsonResponse($data) {
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Start session for user authentication
session_start();

// Initialize database on first run
initDatabase();
?>
