/* ============================================
   PCPP - Physiologie Cellulaire et Physiopathologie
   JavaScript Application - PHP/MySQL Version
   ============================================ */

// API Base URL
const API_URL = 'api.php';

// ============================================
// AUTHENTICATION
// ============================================

const Auth = {
    currentUser: null,
    
    async init() {
        await this.checkAuth();
        this.updateUI();
    },
    
    async checkAuth() {
        try {
            const response = await fetch(`${API_URL}?action=checkAuth`);
            const data = await response.json();
            
            if (data.success && data.user) {
                this.currentUser = data.user;
            } else {
                this.currentUser = null;
            }
        } catch (error) {
            console.error('Auth check error:', error);
            this.currentUser = null;
        }
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
    
    async register(name, email, password, level) {
        try {
            const response = await fetch(`${API_URL}?action=register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, level })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.updateUI();
            }
            
            return data;
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: 'Erreur de connexion au serveur' };
        }
    },
    
    async login(email, password) {
        try {
            const response = await fetch(`${API_URL}?action=login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentUser = data.user;
                this.updateUI();
            }
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, message: 'Erreur de connexion au serveur' };
        }
    },
    
    async logout() {
        try {
            await fetch(`${API_URL}?action=logout`);
            this.currentUser = null;
            this.updateUI();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    },
    
    isLoggedIn() {
        return this.currentUser !== null;
    }
};

// ============================================
// NOTES MANAGEMENT
// ============================================

const Notes = {
    currentNoteId: null,
    
    async getAll() {
        try {
            const response = await fetch(`${API_URL}?action=getNotes`);
            const data = await response.json();
            return data.success ? data.notes : [];
        } catch (error) {
            console.error('Get notes error:', error);
            return [];
        }
    },
    
    async getById(id) {
        try {
            const response = await fetch(`${API_URL}?action=getNote&id=${id}`);
            const data = await response.json();
            return data.success ? data.note : null;
        } catch (error) {
            console.error('Get note error:', error);
            return null;
        }
    },
    
    async add(formData) {
        try {
            const response = await fetch(`${API_URL}?action=addNote`, {
                method: 'POST',
                body: formData
            });
            
            return await response.json();
        } catch (error) {
            console.error('Add note error:', error);
            return { success: false, message: 'Erreur de connexion au serveur' };
        }
    },
    
    async search(query, type, matiere) {
        try {
            const params = new URLSearchParams();
            if (query) params.append('query', query);
            if (type) params.append('type', type);
            if (matiere) params.append('matiere', matiere);
            
            const response = await fetch(`${API_URL}?action=searchNotes&${params.toString()}`);
            const data = await response.json();
            return data.success ? data.notes : [];
        } catch (error) {
            console.error('Search notes error:', error);
            return [];
        }
    },
    
    async getRecent(limit = 4) {
        try {
            const response = await fetch(`${API_URL}?action=getNotes&limit=${limit}`);
            const data = await response.json();
            return data.success ? data.notes : [];
        } catch (error) {
            console.error('Get recent notes error:', error);
            return [];
        }
    },
    
    async delete(id) {
        try {
            const response = await fetch(`${API_URL}?action=deleteNote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Delete note error:', error);
            return { success: false, message: 'Erreur de connexion au serveur' };
        }
    }
};

// ============================================
// COMMENTS MANAGEMENT
// ============================================

const Comments = {
    async getByNoteId(noteId) {
        try {
            const response = await fetch(`${API_URL}?action=getComments&noteId=${noteId}`);
            const data = await response.json();
            return data.success ? data.comments : [];
        } catch (error) {
            console.error('Get comments error:', error);
            return [];
        }
    },
    
    async add(noteId, text) {
        try {
            const response = await fetch(`${API_URL}?action=addComment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ noteId, text })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Add comment error:', error);
            return { success: false, message: 'Erreur de connexion au serveur' };
        }
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
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const result = await Auth.login(email, password);
    
    if (result.success) {
        alert(result.message);
        window.location.href = 'index.html';
    } else {
        alert(result.message);
    }
}

// Handle register form submission
async function handleRegister(event) {
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
    
    const result = await Auth.register(name, email, password, level);
    
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

async function renderNotes(notesToRender = null) {
    const container = document.getElementById('notes-container');
    const noResults = document.getElementById('no-results');
    
    if (!container) return;
    
    const notes = notesToRender || await Notes.getAll();
    
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

async function searchNotes() {
    const query = document.getElementById('search-input').value;
    const type = document.getElementById('filter-type').value;
    const matiere = document.getElementById('filter-matiere').value;
    
    const results = await Notes.search(query, type, matiere);
    renderNotes(results);
}

function filterNotes() {
    searchNotes();
}

async function openNoteModal(noteId) {
    const note = await Notes.getById(noteId);
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
            // Create a data URL from base64
            downloadBtn.href = `data:application/pdf;base64,${note.fileData}`;
            downloadBtn.download = note.fileName;
        } else {
            downloadBtn.href = '#';
            downloadBtn.onclick = () => {
                alert('Fichier non disponible');
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

async function renderComments(noteId) {
    const commentsList = document.getElementById('comments-list');
    const comments = await Comments.getByNoteId(noteId);
    
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

async function addComment() {
    const text = document.getElementById('comment-text').value.trim();
    
    if (!text) {
        alert('Veuillez écrire un commentaire');
        return;
    }
    
    if (!Notes.currentNoteId) return;
    
    const result = await Comments.add(Notes.currentNoteId, text);
    
    if (result.success) {
        document.getElementById('comment-text').value = '';
        renderComments(Notes.currentNoteId);
        renderNotes(); // Refresh to update comment count
    } else {
        alert(result.message);
    }
}

// Delete note function
async function deleteNote(noteId, event) {
    if (event) event.stopPropagation();
    
    const note = await Notes.getById(noteId);
    if (!note) return;
    
    if (!Auth.currentUser || note.authorId !== Auth.currentUser.id) {
        alert('Vous ne pouvez supprimer que vos propres documents');
        return;
    }
    
    if (confirm('Êtes-vous sûr de vouloir supprimer ce document ? Cette action est irréversible.')) {
        const result = await Notes.delete(noteId);
        
        if (result.success) {
            alert('Document supprimé avec succès');
            renderNotes();
            updateStats();
            closeModal();
        } else {
            alert(result.message || 'Erreur lors de la suppression');
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
    }
}

async function handleUpload(event) {
    event.preventDefault();
    
    if (!Auth.isLoggedIn()) {
        alert('Vous devez être connecté pour partager un document');
        return;
    }
    
    const title = document.getElementById('upload-title').value;
    const matiere = document.getElementById('upload-matiere').value;
    const description = document.getElementById('upload-description').value;
    
    const formData = new FormData();
    formData.append('title', title);
    formData.append('type', currentUploadType);
    formData.append('matiere', matiere);
    formData.append('description', description);
    
    if (currentUploadType === 'pdf') {
        if (!selectedFile) {
            alert('Veuillez sélectionner un fichier PDF');
            return;
        }
        formData.append('file', selectedFile);
    } else {
        const content = document.getElementById('upload-content').value.trim();
        if (!content) {
            alert('Veuillez écrire le contenu de votre note');
            return;
        }
        formData.append('content', content);
    }
    
    const result = await Notes.add(formData);
    
    if (result.success) {
        document.getElementById('upload-form-container').classList.add('hidden');
        document.getElementById('upload-success').classList.remove('hidden');
    } else {
        alert(result.message);
    }
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

async function updateStats() {
    try {
        const response = await fetch(`${API_URL}?action=getStats`);
        const data = await response.json();
        
        if (data.success) {
            const statUsers = document.getElementById('stat-users');
            const statNotes = document.getElementById('stat-notes');
            const statComments = document.getElementById('stat-comments');
            
            if (statUsers) statUsers.textContent = data.stats.users;
            if (statNotes) statNotes.textContent = data.stats.notes;
            if (statComments) statComments.textContent = data.stats.comments;
        }
    } catch (error) {
        console.error('Update stats error:', error);
    }
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

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize auth
    await Auth.init();
    
    // Initialize mobile menu
    initMobileMenu();
    
    // Update stats on homepage
    await updateStats();
    
    // Render notes based on current page
    const notesContainer = document.getElementById('notes-container');
    const recentNotesGrid = document.getElementById('recent-notes-grid');
    
    if (recentNotesGrid) {
        // Homepage - show recent notes
        const recent = await Notes.getRecent(4);
        if (recent.length === 0) {
            recentNotesGrid.innerHTML = '<p class="loading-text">Aucun document pour le moment. Soyez le premier à partager!</p>';
        } else {
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
    }
    
    if (notesContainer) {
        // Notes page - show all notes
        await renderNotes();
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
