/* ============================================
   PCPP - Physiologie Cellulaire et Physiopathologie
   JavaScript Application
   ============================================ */

// ============================================
// DATA STORAGE (localStorage)
// ============================================

const Storage = {
    // Users
    getUsers() {
        const users = localStorage.getItem('pcp_users');
        return users ? JSON.parse(users) : [];
    },
    
    saveUsers(users) {
        localStorage.setItem('pcp_users', JSON.stringify(users));
    },
    
    // Notes/Documents
    getNotes() {
        const notes = localStorage.getItem('pcp_notes');
        return notes ? JSON.parse(notes) : this.getDefaultNotes();
    },
    
    saveNotes(notes) {
        localStorage.setItem('pcp_notes', JSON.stringify(notes));
    },
    
    // Comments
    getComments() {
        const comments = localStorage.getItem('pcp_comments');
        return comments ? JSON.parse(comments) : [];
    },
    
    saveComments(comments) {
        localStorage.setItem('pcp_comments', JSON.stringify(comments));
    },
    
    // Current User Session
    getCurrentUser() {
        const user = localStorage.getItem('pcp_current_user');
        return user ? JSON.parse(user) : null;
    },
    
    setCurrentUser(user) {
        if (user) {
            localStorage.setItem('pcp_current_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('pcp_current_user');
        }
    },
    
    // Default notes - empty (no sample data)
    getDefaultNotes() {
        return [];
    }
};

// ============================================
// AUTHENTICATION
// ============================================

const Auth = {
    currentUser: null,
    
    init() {
        this.currentUser = Storage.getCurrentUser();
        this.updateUI();
    },
    
    updateUI() {
        const authLinks = document.getElementById('auth-links');
        if (authLinks) {
            if (this.currentUser) {
                authLinks.innerHTML = `
                    <div class="user-menu">
                        <a href="#" class="nav-link user-name" onclick="Auth.logout(); return false;">
                            <i class="fas fa-user"></i> ${this.currentUser.name}
                            <i class="fas fa-sign-out-alt"></i>
                        </a>
                    </div>
                `;
            } else {
                authLinks.innerHTML = `<a href="login.html" class="nav-link btn-login">Connexion</a>`;
            }
        }
        
        // Update upload page visibility
        const notLogged = document.getElementById('not-logged');
        const uploadForm = document.getElementById('upload-form-container');
        if (notLogged && uploadForm) {
            if (this.currentUser) {
                notLogged.classList.add('hidden');
                uploadForm.classList.remove('hidden');
            } else {
                notLogged.classList.remove('hidden');
                uploadForm.classList.add('hidden');
            }
        }
    },
    
    register(name, email, password, level) {
        const users = Storage.getUsers();
        
        // Check if email already exists
        if (users.find(u => u.email === email)) {
            return { success: false, message: 'Cet email est déjà utilisé' };
        }
        
        const newUser = {
            id: Date.now(),
            name,
            email,
            password, // In production, this should be hashed!
            level,
            createdAt: new Date().toISOString()
        };
        
        users.push(newUser);
        Storage.saveUsers(users);
        
        // Auto login
        this.currentUser = { id: newUser.id, name: newUser.name, email: newUser.email, level: newUser.level };
        Storage.setCurrentUser(this.currentUser);
        this.updateUI();
        
        return { success: true, message: 'Compte créé avec succès!' };
    },
    
    login(email, password) {
        const users = Storage.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            return { success: false, message: 'Email ou mot de passe incorrect' };
        }
        
        this.currentUser = { id: user.id, name: user.name, email: user.email, level: user.level };
        Storage.setCurrentUser(this.currentUser);
        this.updateUI();
        
        return { success: true, message: 'Connexion réussie!' };
    },
    
    logout() {
        this.currentUser = null;
        Storage.setCurrentUser(null);
        this.updateUI();
        window.location.href = 'index.html';
    },
    
    isLoggedIn() {
        return this.currentUser !== null;
    }
};

// ============================================
// NOTES MANAGEMENT
// ============================================

const Notes = {
    notes: [],
    currentNoteId: null,
    
    init() {
        this.notes = Storage.getNotes();
    },
    
    getAll() {
        return this.notes.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    
    getById(id) {
        return this.notes.find(n => n.id === id);
    },
    
    add(note) {
        note.id = Date.now();
        note.date = new Date().toISOString().split('T')[0];
        note.comments = 0;
        this.notes.push(note);
        Storage.saveNotes(this.notes);
        return note;
    },
    
    search(query, type, matiere) {
        return this.notes.filter(note => {
            const matchQuery = !query || 
                note.title.toLowerCase().includes(query.toLowerCase()) ||
                note.description.toLowerCase().includes(query.toLowerCase()) ||
                note.matiere.toLowerCase().includes(query.toLowerCase());
            
            const matchType = !type || note.type === type;
            const matchMatiere = !matiere || note.matiere === matiere;
            
            return matchQuery && matchType && matchMatiere;
        });
    },
    
    getRecent(limit = 4) {
        return this.getAll().slice(0, limit);
    },
    
    delete(id) {
        const note = this.getById(id);
        if (!note) return false;
        
        // Check if current user is the author
        if (!Auth.currentUser || note.authorId !== Auth.currentUser.id) {
            return false;
        }
        
        // Delete the note
        this.notes = this.notes.filter(n => n.id !== id);
        Storage.saveNotes(this.notes);
        
        // Delete associated comments
        const comments = Storage.getComments();
        const filteredComments = comments.filter(c => c.noteId !== id);
        Storage.saveComments(filteredComments);
        
        return true;
    }
};

// ============================================
// COMMENTS MANAGEMENT
// ============================================

const Comments = {
    comments: [],
    
    init() {
        this.comments = Storage.getComments();
    },
    
    getByNoteId(noteId) {
        return this.comments.filter(c => c.noteId === noteId).sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    
    add(noteId, text) {
        if (!Auth.currentUser) return null;
        
        const comment = {
            id: Date.now(),
            noteId,
            text,
            author: Auth.currentUser.name,
            authorId: Auth.currentUser.id,
            date: new Date().toISOString()
        };
        
        this.comments.push(comment);
        Storage.saveComments(this.comments);
        
        // Update note comment count
        const notes = Storage.getNotes();
        const note = notes.find(n => n.id === noteId);
        if (note) {
            note.comments = (note.comments || 0) + 1;
            Storage.saveNotes(notes);
        }
        
        return comment;
    }
};

// ============================================
// UI FUNCTIONS
// ============================================

// Toggle between login/register/forgot forms
function showLogin() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('forgot-form').classList.add('hidden');
}

function showRegister() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    document.getElementById('forgot-form').classList.add('hidden');
}

function showForgotPassword() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('forgot-form').classList.remove('hidden');
}

// Handle login form submission
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const result = Auth.login(email, password);
    
    if (result.success) {
        alert(result.message);
        window.location.href = 'index.html';
    } else {
        alert(result.message);
    }
}

// Handle register form submission
function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const level = document.getElementById('register-level').value;
    
    if (password !== confirm) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }
    
    if (password.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
        return;
    }
    
    const result = Auth.register(name, email, password, level);
    
    if (result.success) {
        alert(result.message);
        window.location.href = 'index.html';
    } else {
        alert(result.message);
    }
}

// Handle forgot password
function handleForgotPassword(event) {
    event.preventDefault();
    const email = document.getElementById('forgot-email').value;
    alert(`Un email de réinitialisation a été envoyé à ${email} (simulation)`);
    showLogin();
}

// ============================================
// NOTES PAGE FUNCTIONS
// ============================================

function renderNotes(notesToRender = null) {
    const container = document.getElementById('notes-container');
    const noResults = document.getElementById('no-results');
    
    if (!container) return;
    
    const notes = notesToRender || Notes.getAll();
    
    if (notes.length === 0) {
        container.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }
    
    noResults.classList.add('hidden');
    
    container.innerHTML = notes.map(note => {
        const canDelete = Auth.currentUser && note.authorId === Auth.currentUser.id;
        return `
        <div class="note-card">
            <div onclick="openNoteModal(${note.id})">
                <span class="note-type ${note.type}">
                    <i class="fas fa-${note.type === 'pdf' ? 'file-pdf' : 'sticky-note'}"></i>
                    ${note.type.toUpperCase()}
                </span>
                <h3>${escapeHtml(note.title)}</h3>
                <div class="note-meta">
                    <span><i class="fas fa-user"></i> ${escapeHtml(note.author)}</span>
                    <span><i class="fas fa-calendar"></i> ${formatDate(note.date)}</span>
                </div>
                <p class="note-description">${escapeHtml(note.description)}</p>
            </div>
            <div class="note-footer">
                <span class="note-matiere"><i class="fas fa-tag"></i> ${escapeHtml(note.matiere)}</span>
                <div class="note-actions">
                    <span class="note-comments"><i class="fas fa-comments"></i> ${note.comments || 0}</span>
                    ${canDelete ? `<button class="btn-delete" onclick="deleteNote(${note.id}, event)" title="Supprimer"><i class="fas fa-trash"></i></button>` : ''}
                </div>
            </div>
        </div>
    `}).join('');
}

function searchNotes() {
    const query = document.getElementById('search-input').value;
    const type = document.getElementById('filter-type').value;
    const matiere = document.getElementById('filter-matiere').value;
    
    const results = Notes.search(query, type, matiere);
    renderNotes(results);
}

function filterNotes() {
    searchNotes();
}

function openNoteModal(noteId) {
    const note = Notes.getById(noteId);
    if (!note) return;
    
    Notes.currentNoteId = noteId;
    
    const canDelete = Auth.currentUser && note.authorId === Auth.currentUser.id;
    
    document.getElementById('modal-title').innerHTML = `
        ${escapeHtml(note.title)}
        ${canDelete ? `<button class="btn-delete-modal" onclick="deleteNote(${note.id})" title="Supprimer"><i class="fas fa-trash"></i></button>` : ''}
    `;
    document.getElementById('modal-author').innerHTML = `<i class="fas fa-user"></i> ${escapeHtml(note.author)}`;
    document.getElementById('modal-date').innerHTML = `<i class="fas fa-calendar"></i> ${formatDate(note.date)}`;
    document.getElementById('modal-matiere').innerHTML = `<i class="fas fa-tag"></i> ${escapeHtml(note.matiere)}`;
    
    const contentDiv = document.getElementById('modal-content');
    const fileDiv = document.getElementById('modal-file');
    
    if (note.type === 'note') {
        contentDiv.textContent = note.content;
        contentDiv.classList.remove('hidden');
        fileDiv.classList.add('hidden');
    } else {
        contentDiv.classList.add('hidden');
        fileDiv.classList.remove('hidden');
        
        const downloadBtn = document.getElementById('modal-download');
        if (note.fileData) {
            downloadBtn.href = note.fileData;
            downloadBtn.download = note.fileName;
        } else {
            downloadBtn.href = '#';
            downloadBtn.onclick = () => {
                alert('Ce fichier est un exemple. Les PDFs réels seront téléchargeables.');
                return false;
            };
        }
    }
    
    renderComments(noteId);
    
    // Show/hide comment form based on login status
    const commentForm = document.getElementById('comment-form');
    const loginToComment = document.getElementById('login-to-comment');
    
    if (Auth.isLoggedIn()) {
        commentForm.classList.remove('hidden');
        loginToComment.classList.add('hidden');
    } else {
        commentForm.classList.add('hidden');
        loginToComment.classList.remove('hidden');
    }
    
    document.getElementById('note-modal').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('note-modal').classList.add('hidden');
    Notes.currentNoteId = null;
}

function renderComments(noteId) {
    const commentsList = document.getElementById('comments-list');
    const comments = Comments.getByNoteId(noteId);
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">Aucun commentaire pour le moment</p>';
        return;
    }
    
    commentsList.innerHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <span class="comment-author">${escapeHtml(comment.author)}</span>
                <span class="comment-date">${formatDate(comment.date)}</span>
            </div>
            <p class="comment-text">${escapeHtml(comment.text)}</p>
        </div>
    `).join('');
}

function addComment() {
    const text = document.getElementById('comment-text').value.trim();
    
    if (!text) {
        alert('Veuillez écrire un commentaire');
        return;
    }
    
    if (!Notes.currentNoteId) return;
    
    Comments.add(Notes.currentNoteId, text);
    document.getElementById('comment-text').value = '';
    
    renderComments(Notes.currentNoteId);
    renderNotes(); // Refresh to update comment count
}

// Delete note function
function deleteNote(noteId, event) {
    if (event) event.stopPropagation();
    
    const note = Notes.getById(noteId);
    if (!note) return;
    
    if (!Auth.currentUser || note.authorId !== Auth.currentUser.id) {
        alert('Vous ne pouvez supprimer que vos propres documents');
        return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.')) {
        if (Notes.delete(noteId)) {
            alert('Document supprimé avec succès');
            renderNotes();
            updateStats();
            // Close modal if open
            closeModal();
        } else {
            alert('Erreur lors de la suppression');
        }
    }
}

// ============================================
// UPLOAD PAGE FUNCTIONS
// ============================================

let currentUploadType = 'pdf';
let selectedFile = null;

function selectType(type) {
    currentUploadType = type;
    
    document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`btn-${type}`).classList.add('active');
    
    if (type === 'pdf') {
        document.getElementById('pdf-upload').classList.remove('hidden');
        document.getElementById('note-upload').classList.add('hidden');
    } else {
        document.getElementById('pdf-upload').classList.add('hidden');
        document.getElementById('note-upload').classList.remove('hidden');
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        selectedFile = file;
        document.getElementById('file-name').textContent = file.name;
        
        // Read file as data URL for storage
        const reader = new FileReader();
        reader.onload = (e) => {
            selectedFile.data = e.target.result;
        };
        reader.readAsDataURL(file);
    }
}

function handleUpload(event) {
    event.preventDefault();
    
    if (!Auth.isLoggedIn()) {
        alert('Vous devez être connecté pour partager un document');
        return;
    }
    
    const title = document.getElementById('upload-title').value;
    const matiere = document.getElementById('upload-matiere').value;
    const description = document.getElementById('upload-description').value;
    
    const note = {
        title,
        type: currentUploadType,
        matiere,
        description,
        author: Auth.currentUser.name,
        authorId: Auth.currentUser.id
    };
    
    if (currentUploadType === 'pdf') {
        if (!selectedFile) {
            alert('Veuillez sélectionner un fichier PDF');
            return;
        }
        note.fileName = selectedFile.name;
        note.fileData = selectedFile.data || null;
        note.content = null;
    } else {
        const content = document.getElementById('upload-content').value.trim();
        if (!content) {
            alert('Veuillez écrire le contenu de votre note');
            return;
        }
        note.content = content;
        note.fileName = null;
        note.fileData = null;
    }
    
    Notes.add(note);
    
    // Show success message
    document.getElementById('upload-form-container').classList.add('hidden');
    document.getElementById('upload-success').classList.remove('hidden');
}

function resetForm() {
    selectedFile = null;
    document.getElementById('file-name').textContent = '';
}

function resetUpload() {
    resetForm();
    document.getElementById('upload-form').reset();
    document.getElementById('upload-success').classList.add('hidden');
    document.getElementById('upload-form-container').classList.remove('hidden');
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
}

function updateStats() {
    const users = Storage.getUsers();
    const notes = Storage.getNotes();
    const comments = Storage.getComments();
    
    const statUsers = document.getElementById('stat-users');
    const statNotes = document.getElementById('stat-notes');
    const statComments = document.getElementById('stat-comments');
    
    if (statUsers) statUsers.textContent = users.length;
    if (statNotes) statNotes.textContent = notes.length;
    if (statComments) statComments.textContent = comments.length;
}

// ============================================
// MOBILE MENU
// ============================================

function initMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });
        
        // Close menu when clicking a link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', () => {
                hamburger.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize storage
    Storage.init;
    
    // Initialize auth
    Auth.init();
    
    // Initialize notes and comments
    Notes.init();
    Comments.init();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Update stats on homepage
    updateStats();
    
    // Render notes based on current page
    const notesContainer = document.getElementById('notes-container');
    const recentNotesGrid = document.getElementById('recent-notes-grid');
    
    if (recentNotesGrid) {
        // Homepage - show recent notes
        const recent = Notes.getRecent(4);
        recentNotesGrid.innerHTML = recent.map(note => {
            const canDelete = Auth.currentUser && note.authorId === Auth.currentUser.id;
            return `
            <div class="note-card">
                <div onclick="window.location.href='notes.html'">
                    <span class="note-type ${note.type}">
                        <i class="fas fa-${note.type === 'pdf' ? 'file-pdf' : 'sticky-note'}"></i>
                        ${note.type.toUpperCase()}
                    </span>
                    <h3>${escapeHtml(note.title)}</h3>
                    <div class="note-meta">
                        <span><i class="fas fa-user"></i> ${escapeHtml(note.author)}</span>
                        <span><i class="fas fa-calendar"></i> ${formatDate(note.date)}</span>
                    </div>
                    <p class="note-description">${escapeHtml(note.description)}</p>
                </div>
                <div class="note-footer">
                    <span class="note-matiere"><i class="fas fa-tag"></i> ${escapeHtml(note.matiere)}</span>
                    <div class="note-actions">
                        <span class="note-comments"><i class="fas fa-comments"></i> ${note.comments || 0}</span>
                        ${canDelete ? `<button class="btn-delete" onclick="deleteNote(${note.id}, event)" title="Supprimer"><i class="fas fa-trash"></i></button>` : ''}
                    </div>
                </div>
            </div>
        `}).join('');
    }
    
    if (notesContainer) {
        // Notes page - show all notes
        renderNotes();
    }
    
    // Close modal when clicking outside
    const modal = document.getElementById('note-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // File drop zone
    const dropZone = document.getElementById('file-drop-zone');
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = 'var(--primary)';
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = '';
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '';
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const fileInput = document.getElementById('upload-file');
                fileInput.files = files;
                handleFileSelect({ target: fileInput });
            }
        });
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});
