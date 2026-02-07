<?php
// ============================================
// PCPP - API Endpoints
// ============================================

session_start();
require_once 'config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'register':
        handleRegister();
        break;
    case 'login':
        handleLogin();
        break;
    case 'logout':
        handleLogout();
        break;
    case 'checkAuth':
        checkAuth();
        break;
    case 'getNotes':
        getNotes();
        break;
    case 'addNote':
        addNote();
        break;
    case 'getStats':
        getStats();
        break;
    default:
        jsonResponse(['success' => false, 'message' => 'Action non valide']);
}

function handleRegister() {
    $conn = getDBConnection();
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = $data['name'] ?? '';
    $email = $data['email'] ?? '';
    $password = password_hash($data['password'] ?? '', PASSWORD_DEFAULT);
    $level = $data['level'] ?? '';

    if (empty($name) || empty($email) || empty($data['password'])) {
        jsonResponse(['success' => false, 'message' => 'Champs requis manquants']);
    }

    $stmt = $conn->prepare("INSERT INTO users (name, email, password, level) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $name, $email, $password, $level);

    if ($stmt->execute()) {
        jsonResponse(['success' => true, 'message' => 'Compte créé avec succès']);
    } else {
        jsonResponse(['success' => false, 'message' => 'L\'email existe déjà']);
    }
    $conn->close();
}

function handleLogin() {
    $conn = getDBConnection();
    $data = json_decode(file_get_contents('php://input'), true);
    
    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    $stmt = $conn->prepare("SELECT id, name, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($user = $result->fetch_assoc()) {
        if (password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_name'] = $user['name'];
            jsonResponse([
                'success' => true,
                'message' => 'Connexion réussie',
                'user' => ['id' => $user['id'], 'name' => $user['name']]
            ]);
        }
    }
    jsonResponse(['success' => false, 'message' => 'Identifiants invalides']);
}

function checkAuth() {
    if (isset($_SESSION['user_id'])) {
        jsonResponse([
            'success' => true,
            'user' => ['id' => $_SESSION['user_id'], 'name' => $_SESSION['user_name']]
        ]);
    }
    jsonResponse(['success' => false]);
}

function handleLogout() {
    session_destroy();
    jsonResponse(['success' => true]);
}

function getNotes() {
    $conn = getDBConnection();
    $result = $conn->query("SELECT * FROM notes ORDER BY created_at DESC");
    $notes = [];
    while ($row = $result->fetch_assoc()) {
        $notes[] = $row;
    }
    jsonResponse(['success' => true, 'notes' => $notes]);
}

function addNote() {
    if (!isset($_SESSION['user_id'])) jsonResponse(['success' => false, 'message' => 'Non autorisé']);
    
    $conn = getDBConnection();
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $conn->prepare("INSERT INTO notes (title, type, matiere, description, content, author_id, author_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssis", $data['title'], $data['type'], $data['matiere'], $data['description'], $data['content'], $_SESSION['user_id'], $_SESSION['user_name']);
    
    if ($stmt->execute()) {
        jsonResponse(['success' => true, 'message' => 'Note ajoutée']);
    }
    jsonResponse(['success' => false, 'message' => 'Erreur']);
}

function getStats() {
    $conn = getDBConnection();
    $users = $conn->query("SELECT COUNT(*) as c FROM users")->fetch_assoc()['c'];
    $notes = $conn->query("SELECT COUNT(*) as c FROM notes")->fetch_assoc()['c'];
    jsonResponse(['success' => true, 'stats' => ['users' => $users, 'notes' => $notes]]);
}
