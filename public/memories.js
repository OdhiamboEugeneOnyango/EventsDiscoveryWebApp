
// memories.js
        class MemoriesApp {
            constructor() {
                this.memories = [];
                this.events = [];
                this.loading = false;
                this.uploading = false;
                this.selectedMemory = null;
                
                this.initializeElements();
                this.bindEvents();
                this.loadData();
            }

            initializeElements() {
                this.elements = {
                    errorMessage: document.getElementById('errorMessage'),
                    loadingState: document.getElementById('loadingState'),
                    memoriesGrid: document.getElementById('memoriesGrid'),
                    emptyState: document.getElementById('emptyState'),
                    eventSelect: document.getElementById('eventSelect'),
                    captionInput: document.getElementById('captionInput'),
                    uploadBtn: document.getElementById('uploadBtn'),
                    fileInput: document.getElementById('fileInput'),
                    modalOverlay: document.getElementById('modalOverlay'),
                    modalTitle: document.getElementById('modalTitle'),
                    modalMedia: document.getElementById('modalMedia'),
                    modalInfo: document.getElementById('modalInfo'),
                    deleteBtn: document.getElementById('deleteBtn'),
                    closeBtn: document.getElementById('closeBtn')
                };
            }

            bindEvents() {
                this.elements.uploadBtn.addEventListener('click', () => {
                    if (!this.uploading && this.elements.eventSelect.value) {
                        this.elements.fileInput.click();
                    }
                });

                this.elements.fileInput.addEventListener('change', (e) => {
                    this.handleFileUpload(e);
                });

                this.elements.closeBtn.addEventListener('click', () => {
                    this.closeModal();
                });

                this.elements.deleteBtn.addEventListener('click', () => {
                    if (this.selectedMemory) {
                        this.deleteMemory(this.selectedMemory._id);
                    }
                });

                this.elements.modalOverlay.addEventListener('click', (e) => {
                    if (e.target === this.elements.modalOverlay) {
                        this.closeModal();
                    }
                });

                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        this.closeModal();
                    }
                });
            }

            async loadData() {
                this.setLoading(true);
                try {
                    await Promise.all([
                        this.fetchMemories(),
                        this.fetchEvents()
                    ]);
                } catch (error) {
                    this.showError('Failed to load data');
                } finally {
                    this.setLoading(false);
                }
            }

            async fetchMemories() {
                try {
                    const response = await fetch('/api/memories');
                    if (!response.ok) throw new Error('Failed to fetch memories');
                    const data = await response.json();
                    this.memories = data.memories || [];
                    this.renderMemories();
                } catch (error) {
                    console.error('Error fetching memories:', error);
                    // Fallback demo data
                    this.memories = [
                        {
                            _id: '1',
                            eventName: "Summer Music Festival 2024",
                            eventDate: "2024-07-15",
                            location: "Central Park, NYC",
                            type: "image",
                            mediaUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop",
                            caption: "Amazing crowd energy during the headliner set! 🎵",
                            likes: 24,
                            comments: 8,
                            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
                        }
                    ];
                    this.renderMemories();
                }
            }

            async fetchEvents() {
                try {
                    const response = await fetch('/api/events');
                    if (!response.ok) throw new Error('Failed to fetch events');
                    const data = await response.json();
                    this.events = data.events || [];
                    this.renderEventOptions();
                } catch (error) {
                    console.error('Error fetching events:', error);
                    // Fallback events
                    this.events = [
                        { _id: '1', name: "Summer Music Festival 2024" },
                        { _id: '2', name: "Tech Conference 2024" },
                        { _id: '3', name: "Food & Wine Expo" },
                        { _id: '4', name: "Art Gallery Opening" },
                        { _id: '5', name: "Sports Championship" }
                    ];
                    this.renderEventOptions();
                }
            }

            renderEventOptions() {
                this.elements.eventSelect.innerHTML = '<option value="">Select an event</option>';
                this.events.forEach(event => {
                    const option = document.createElement('option');
                    option.value = event._id;
                    option.textContent = event.name;
                    this.elements.eventSelect.appendChild(option);
                });
            }

            async handleFileUpload(event) {
                const files = Array.from(event.target.files);
                const eventId = this.elements.eventSelect.value;
                const caption = this.elements.captionInput.value;

                if (!files.length || !eventId) {
                    alert('Please select an event and at least one file');
                    return;
                }

                this.setUploading(true);
                this.hideError();

                try {
                    for (const file of files) {
                        if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
                            const formData = new FormData();
                            formData.append('file', file);
                            formData.append('eventId', eventId);
                            formData.append('caption', caption || 'New memory uploaded!');
                            formData.append('type', file.type.startsWith('video/') ? 'video' : 'image');

                            const response = await fetch('/api/memories/upload', {
                                method: 'POST',
                                body: formData,
                            });

                            if (!response.ok) {
                                throw new Error(`Failed to upload ${file.name}`);
                            }

                            const result = await response.json();
                            this.memories.unshift(result.memory);
                        }
                    }

                    // Reset form
                    this.elements.captionInput.value = '';
                    this.elements.eventSelect.value = '';
                    event.target.value = '';
                    
                    this.renderMemories();
                } catch (error) {
                    this.showError(`Upload failed: ${error.message}`);
                } finally {
                    this.setUploading(false);
                }
            }

            async handleLike(memoryId) {
                try {
                    const memoryIndex = this.memories.findIndex(m => m._id === memoryId);
                    if (memoryIndex === -1) return;

                    const memory = this.memories[memoryIndex];
                    const hasLiked = memory._hasLiked || false;

                    const response = await fetch(`/api/memories/${memoryId}/like`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Action': hasLiked ? 'unlike' : 'like'
                        }
                    });

                    if (!response.ok) throw new Error('Failed to toggle like');

                    const result = await response.json();

                    // Update memory state
                    this.memories[memoryIndex].likes = result.likes;
                    this.memories[memoryIndex]._hasLiked = !hasLiked;  // toggle
                    this.renderMemories();

                } catch (error) {
                    console.error('Error toggling like:', error);
                }
            }


            async deleteMemory(memoryId) {
                if (!confirm('Are you sure you want to delete this memory?')) return;

                try {
                    const response = await fetch(`/api/memories/${memoryId}`, {
                        method: 'DELETE',
                    });

                    if (!response.ok) throw new Error('Failed to delete memory');

                    this.memories = this.memories.filter(memory => memory._id !== memoryId);
                    this.renderMemories();
                    this.closeModal();
                } catch (error) {
                    this.showError(`Failed to delete memory: ${error.message}`);
                }
            }

            renderMemories() {
                if (this.memories.length === 0) {
                    this.elements.memoriesGrid.style.display = 'none';
                    this.elements.emptyState.style.display = 'block';
                    return;
                }

                this.elements.emptyState.style.display = 'none';
                this.elements.memoriesGrid.style.display = 'grid';

                this.elements.memoriesGrid.innerHTML = this.memories.map(memory => `
                    <div class="memory-card">
                        <div class="memory-media" onclick="app.openModal('${memory._id}')">
                            ${memory.type === 'video' ? `
                                <img src="${memory.mediaUrl}" alt="${memory.caption}">
                                <div class="video-overlay">
                                    <i class="fas fa-play play-icon"></i>
                                </div>
                            ` : `
                                <img src="${memory.mediaUrl}" alt="${memory.caption}">
                            `}
                            <div class="media-type-badge">
                                <i class="fas fa-${memory.type === 'video' ? 'video' : 'image'}"></i>
                                ${memory.type}
                            </div>
                        </div>
                        <div class="memory-content">
                            <div class="memory-header">
                                <div class="memory-title">${memory.eventName}</div>
                                <div class="memory-meta">
                                    <div class="meta-item">
                                        <i class="fas fa-calendar"></i>
                                        ${this.formatDate(memory.eventDate)}
                                    </div>
                                    <div class="meta-item">
                                        <i class="fas fa-map-marker-alt"></i>
                                        ${memory.location}
                                    </div>
                                </div>
                            </div>
                            <div class="memory-caption">${memory.caption}</div>
                            <div class="memory-actions">
                                <div class="action-buttons">
                                    <button class="action-btn ${memory._hasLiked ? 'liked' : ''}" onclick="app.handleLike('${memory._id}')">
                                    <i class="fas fa-heart"></i>
                                        ${memory.likes || 0}
                                    </button>
                                    <button class="action-btn">
                                        <i class="fas fa-comment"></i>
                                        ${memory.comments || 0}
                                    </button>
                                    <button class="action-btn">
                                        <i class="fas fa-share"></i>
                                    </button>
                                </div>
                                <div class="timestamp">${this.getTimeAgo(memory.createdAt)}</div>
                            </div>
                        </div>
                    </div>
                `).join('');
            }

            openModal(memoryId) {
                const memory = this.memories.find(m => m._id === memoryId);
                if (!memory) return;

                this.selectedMemory = memory;
                this.elements.modalTitle.textContent = memory.eventName;
                
                this.elements.modalMedia.innerHTML = memory.type === 'video' ? `
                    <video src="${memory.mediaUrl}" controls style="width: 100%; max-height: 400px;">
                        Your browser does not support the video tag.
                    </video>
                ` : `
                    <img src="${memory.mediaUrl}" alt="${memory.caption}" style="width: 100%; max-height: 400px; object-fit: contain;">
                `;

                this.elements.modalInfo.innerHTML = `
                    <p style="color: #374151; margin-bottom: 12px;">${memory.caption}</p>
                    <div style="display: flex; align-items: center; gap: 16px; font-size: 0.875rem; color: #6b7280;">
                        <span style="display: flex; align-items: center; gap: 4px;">
                            <i class="fas fa-calendar"></i>
                            ${this.formatDate(memory.eventDate)}
                        </span>
                        <span style="display: flex; align-items: center; gap: 4px;">
                            <i class="fas fa-map-marker-alt"></i>
                            ${memory.location}
                        </span>
                    </div>
                `;

                this.elements.modalOverlay.classList.add('active');
            }

            closeModal() {
                this.elements.modalOverlay.classList.remove('active');
                this.selectedMemory = null;
            }

            setLoading(loading) {
                this.loading = loading;
                this.elements.loadingState.style.display = loading ? 'flex' : 'none';
                this.elements.memoriesGrid.style.display = loading ? 'none' : 'grid';
                this.elements.emptyState.style.display = 'none';
            }

            setUploading(uploading) {
                this.uploading = uploading;
                this.elements.uploadBtn.disabled = uploading;
                this.elements.uploadBtn.innerHTML = uploading ? `
                    <div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
                    <span>Uploading...</span>
                ` : `
                    <i class="fas fa-upload"></i>
                    <span>Upload Photos/Videos</span>
                `;
            }

            showError(message) {
                this.elements.errorMessage.textContent = message;
                this.elements.errorMessage.style.display = 'block';
            }

            hideError() {
                this.elements.errorMessage.style.display = 'none';
            }

            formatDate(dateString) {
                return new Date(dateString).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            }

            getTimeAgo(dateString) {
                const now = new Date();
                const past = new Date(dateString);
                const diffInHours = Math.floor((now - past) / (1000 * 60 * 60));
                
                if (diffInHours < 1) return 'Just now';
                if (diffInHours < 24) return `${diffInHours}h ago`;
                if (diffInHours < 48) return 'Yesterday';
                if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
                return `${Math.floor(diffInHours / 168)}w ago`;
            }
        }

        // Initialize the app when DOM is loaded
        let app;
        document.addEventListener('DOMContentLoaded', () => {
            app = new MemoriesApp();
        });
   