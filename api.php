<?php
// ============================================
// PCPP - API Endpoints
// ============================================

require_once 'config.php';

$action = $_GET['action'] ?? '';

switch ($action) {
    // Authentication
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
    
    // Notes/Documents
    case 'getNotes':
        getNotes();
        break;
    case 'getNote':
        getNote();
        break;
    case 'addNote':
        addNote();
        break;
    case 'deleteNote':
        deleteNote();
        break;
    case 'searchNotes':
        searchNotes();
        break;
    
    // Comments
    case 'getComments':
        getComments();
        break;
    case 'addComment':
        addComment();
        break;
    
    // Stats
    case 'getStats':
        getStats();
        break;
    
    default:
        jsonResponse(['success' => false, 'message' => 'Invalid action']);
}

// ============================================
// AUTHENTICATION FUNCTIONS
// ============================================

function handleRegister() {
    $conn = getDBConnection();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $conn->real_escape_string($data['name'] ?? '');
    $email = $conn->real_escape_string($data['email'] ?? '');
    $password = $data['password'] ?? '';
    $level = $conn->real_escape_string($data['level'] ?? '');
    
    // Validate input
    if (empty($name) || empty($email) || empty($password) || empty($level)) {
        jsonResponse(['success' => false, 'message' => 'Tous les champs sont requis']);
    }
    
    if (strlen($password) < 6) {
        jsonResponse(['success' => false, 'message' => 'Le mot de passe doit contenir au moins 6 caractères']);
    }
    
    // Check if email already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows > 0) {
        jsonResponse(['success' => false, 'message' => 'Cet email est déjà utilisé']);
    }
    
    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Insert user
    $stmt = $conn->prepare("INSERT INTO users (name, email, password, level) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("ssss", $name, $email, $hashedPassword, $level);
    
    if ($stmt->execute()) {
        $userId = $stmt->insert_id;
        
        // Set session
        $_SESSION['user_id'] = $userId;
        $_SESSION['user_name'] = $name;
        $_SESSION['user_email'] = $email;
        
        jsonResponse([
            'success' => true, 
            'message' => 'Compte créé avec succès!',
            'user' => [
                'id' => $userId,
                'name' => $name,
                'email' => $email,
                'level' => $level
            ]
        ]);
    } else {
        jsonResponse(['success' => false, 'message' => 'Erreur lors de la création du compte']);
    }
    
    $conn->close();
}

function handleLogin() {
    $conn = getDBConnection();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $email = $conn->real_escape_string($data['email'] ?? '');
    $password = $data['password'] ?? '';
    
    if (empty($email) || empty($password)) {
        jsonResponse(['success' => false, 'message' => 'Email et mot de passe requis']);
    }
    
    // Get user by email
    $stmt = $conn->prepare("SELECT id, name, email, password, level FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        jsonResponse(['success' => false, 'message' => 'Email ou mot de passe incorrect']);
    }
    
    $user = $result->fetch_assoc();
    
    // Verify password
    if (!password_verify($password, $user['password'])) {
        jsonResponse(['success' => false, 'message' => 'Email ou mot de passe incorrect']);
    }
    
    // Set session
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_email'] = $user['email'];
    
    jsonResponse([
        'success' => true, 
        'message' => 'Connexion réussie!',
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'level' => $user['level']
        ]
    ]);
    
    $conn->close();
}

function handleLogout() {
    session_destroy();
    jsonResponse(['success' => true, 'message' => 'Déconnexion réussie']);
}

function checkAuth() {
    if (isset($_SESSION['user_id'])) {
        jsonResponse([
            'success' => true,
            'user' => [
                'id' => $_SESSION['user_id'],
                'name' => $_SESSION['user_name'],
                'email' => $_SESSION['user_email']
            ]
        ]);
    } else {
        jsonResponse(['success' => false, 'user' => null]);
    }
}

// ============================================
// NOTES FUNCTIONS
// ============================================

function getNotes() {
    $conn = getDBConnection();
    
    $limit = intval($_GET['limit'] ?? 100);
    
    $stmt = $conn->prepare("SELECT n.*, u.name as author_name FROM notes n JOIN users u ON n.author_id = u.id ORDER BY n.created_at DESC LIMIT ?");
    $stmt->bind_param("i", $limit);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $notes = [];
    while ($row = $result->fetch_assoc()) {
        // Get comment count for each note
        $commentStmt = $conn->prepare("SELECT COUNT(*) as count FROM comments WHERE note_id = ?");
        $commentStmt->bind_param("i", $row['id']);
        $commentStmt->execute();
        $commentResult = $commentStmt->get_result();
        $commentCount = $commentResult->fetch_assoc()['count'];
        
        $notes[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'type' => $row['type'],
            'matiere' => $row['matiere'],
            'description' => $row['description'],
            'content' => $row['content'],
            'fileName' => $row['file_name'],
            'fileData' => $row['file_data'],
            'author' => $row['author_name'],
            'authorId' => $row['author_id'],
            'date' => $row['created_at'],
            'comments' => intval($commentCount)
        ];
    }
    
    jsonResponse(['success' => true, 'notes' => $notes]);
    $conn->close();
}

function getNote() {
    $conn = getDBConnection();
    
    $id = intval($_GET['id'] ?? 0);
    
    if ($id === 0) {
        jsonResponse(['success' => false, 'message' => 'ID requis']);
    }
    
    $stmt = $conn->prepare("SELECT n.*, u.name as author_name FROM notes n JOIN users u ON n.author_id = u.id WHERE n.id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        jsonResponse(['success' => false, 'message' => 'Document non trouvé']);
    }
    
    $row = $result->fetch_assoc();
    
    jsonResponse([
        'success' => true,
        'note' => [
            'id' => $row['id'],
            'title' => $row['title'],
            'type' => $row['type'],
            'matiere' => $row['matiere'],
            'description' => $row['description'],
            'content' => $row['content'],
            'fileName' => $row['file_name'],
            'fileData' => $row['file_data'],
            'author' => $row['author_name'],
            'authorId' => $row['author_id'],
            'date' => $row['created_at']
        ]
    ]);
    
    $conn->close();
}

function addNote() {
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(['success' => false, 'message' => 'Vous devez être connecté']);
    }
    
    $conn = getDBConnection();
    
    $title = $conn->real_escape_string($_POST['title'] ?? '');
    $type = $conn->real_escape_string($_POST['type'] ?? '');
    $matiere = $conn->real_escape_string($_POST['matiere'] ?? '');
    $description = $conn->real_escape_string($_POST['description'] ?? '');
    $content = $conn->real_escape_string($_POST['content'] ?? '');
    $authorId = $_SESSION['user_id'];
    $authorName = $_SESSION['user_name'];
    
    $fileName = null;
    $fileData = null;
    
    // Handle PDF upload
    if ($type === 'pdf' && isset($_FILES['file'])) {
        $file = $_FILES['file'];
        $fileName = $conn->real_escape_string($file['name']);
        
        // Read file content and encode as base64
        $fileContent = file_get_contents($file['tmp_name']);
        $fileData = base64_encode($fileContent);
    }
    
    $stmt = $conn->prepare("INSERT INTO notes (title, type, matiere, description, content, file_name, file_data, author_id, author_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssssiss", $title, $type, $matiere, $description, $content, $fileName, $fileData, $authorId, $authorName);
    
    if ($stmt->execute()) {
        jsonResponse(['success' => true, 'message' => 'Document ajouté avec succès', 'id' => $stmt->insert_id]);
    } else {
        jsonResponse(['success' => false, 'message' => 'Erreur lors de l\'ajout du document']);
    }
    
    $conn->close();
}

function deleteNote() {
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(['success' => false, 'message' => 'Vous devez être connecté']);
    }
    
    $conn = getDBConnection();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $id = intval($data['id'] ?? 0);
    $userId = $_SESSION['user_id'];
    
    if ($id === 0) {
        jsonResponse(['success' => false, 'message' => 'ID requis']);
    }
    
    // Check if user is the author
    $stmt = $conn->prepare("SELECT author_id FROM notes WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        jsonResponse(['success' => false, 'message' => 'Document non trouvé']);
    }
    
    $note = $result->fetch_assoc();
    
    if ($note['author_id'] != $userId) {
        jsonResponse(['success' => false, 'message' => 'Vous ne pouvez supprimer que vos propres documents']);
    }
    
    // Delete note (comments will be deleted automatically due to foreign key)
    $stmt = $conn->prepare("DELETE FROM notes WHERE id = ?");
    $stmt->bind_param("i", $id);
    
    if ($stmt->execute()) {
        jsonResponse(['success' => true, 'message' => 'Document supprimé avec succès']);
    } else {
        jsonResponse(['success' => false, 'message' => 'Erreur lors de la suppression']);
    }
    
    $conn->close();
}

function searchNotes() {
    $conn = getDBConnection();
    
    $query = $conn->real_escape_string($_GET['query'] ?? '');
    $type = $conn->real_escape_string($_GET['type'] ?? '');
    $matiere = $conn->real_escape_string($_GET['matiere'] ?? '');
    
    $sql = "SELECT n.*, u.name as author_name FROM notes n JOIN users u ON n.author_id = u.id WHERE 1=1";
    $params = [];
    $types = "";
    
    if (!empty($query)) {
        $sql .= " AND (n.title LIKE ? OR n.description LIKE ? OR n.matiere LIKE ?)";
        $searchTerm = "%$query%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= "sss";
    }
    
    if (!empty($type)) {
        $sql .= " AND n.type = ?";
        $params[] = $type;
        $types .= "s";
    }
    
    if (!empty($matiere)) {
        $sql .= " AND n.matiere = ?";
        $params[] = $matiere;
        $types .= "s";
    }
    
    $sql .= " ORDER BY n.created_at DESC";
    
    $stmt = $conn->prepare($sql);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    
    $notes = [];
    while ($row = $result->fetch_assoc()) {
        // Get comment count
        $commentStmt = $conn->prepare("SELECT COUNT(*) as count FROM comments WHERE note_id = ?");
        $commentStmt->bind_param("i", $row['id']);
        $commentStmt->execute();
        $commentResult = $commentStmt->get_result();
        $commentCount = $commentResult->fetch_assoc()['count'];
        
        $notes[] = [
            'id' => $row['id'],
            'title' => $row['title'],
            'type' => $row['type'],
            'matiere' => $row['matiere'],
            'description' => $row['description'],
            'content' => $row['content'],
            'fileName' => $row['file_name'],
            'fileData' => $row['file_data'],
            'author' => $row['author_name'],
            'authorId' => $row['author_id'],
            'date' => $row['created_at'],
            'comments' => intval($commentCount)
        ];
    }
    
    jsonResponse(['success' => true, 'notes' => $notes]);
    $conn->close();
}

// ============================================
// COMMENTS FUNCTIONS
// ============================================

function getComments() {
    $conn = getDBConnection();
    
    $noteId = intval($_GET['noteId'] ?? 0);
    
    if ($noteId === 0) {
        jsonResponse(['success' => false, 'message' => 'noteId requis']);
    }
    
    $stmt = $conn->prepare("SELECT c.*, u.name as author_name FROM comments c JOIN users u ON c.author_id = u.id WHERE c.note_id = ? ORDER BY c.created_at DESC");
    $stmt->bind_param("i", $noteId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $comments = [];
    while ($row = $result->fetch_assoc()) {
        $comments[] = [
            'id' => $row['id'],
            'noteId' => $row['note_id'],
            'text' => $row['text'],
            'author' => $row['author_name'],
            'authorId' => $row['author_id'],
            'date' => $row['created_at']
        ];
    }
    
    jsonResponse(['success' => true, 'comments' => $comments]);
    $conn->close();
}

function addComment() {
    // Check if user is logged in
    if (!isset($_SESSION['user_id'])) {
        jsonResponse(['success' => false, 'message' => 'Vous devez être connecté']);
    }
    
    $conn = getDBConnection();
    
    $data = json_decode(file_get_contents('php://input'), true);
    $noteId = intval($data['noteId'] ?? 0);
    $text = $conn->real_escape_string($data['text'] ?? '');
    $authorId = $_SESSION['user_id'];
    $authorName = $_SESSION['user_name'];
    
    if ($noteId === 0 || empty($text)) {
        jsonResponse(['success' => false, 'message' => 'noteId et texte requis']);
    }
    
    $stmt = $conn->prepare("INSERT INTO comments (note_id, text, author_id, author_name) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isis", $noteId, $text, $authorId, $authorName);
    
    if ($stmt->execute()) {
        jsonResponse(['success' => true, 'message' => 'Commentaire ajouté']);
    } else {
        jsonResponse(['success' => false, 'message' => 'Erreur lors de l\'ajout du commentaire']);
    }
    
    $conn->close();
}

// ============================================
// STATS FUNCTIONS
// ============================================

function getStats() {
    $conn = getDBConnection();
    
    // Get user count
    $result = $conn->query("SELECT COUNT(*) as count FROM users");
    $userCount = $result->fetch_assoc()['count'];
    
    // Get notes count
    $result = $conn->query("SELECT COUNT(*) as count FROM notes");
    $noteCount = $result->fetch_assoc()['count'];
    
    // Get comments count
    $result = $conn->query("SELECT COUNT(*) as count FROM comments");
    $commentCount = $result->fetch_assoc()['count'];
    
    jsonResponse([
        'success' => true,
        'stats' => [
            'users' => intval($userCount),
            'notes' => intval($noteCount),
            'comments' => intval($commentCount)
        ]
    ]);
    
    $conn->close();
}
?>