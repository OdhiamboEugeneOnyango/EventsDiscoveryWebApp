
        // Global variables
        let currentUser = null;
        let eventData = null;
        let forumStats = {
            totalMembers: 0,
            totalPosts: 0,
            activeToday: 0,
            onlineNow: 0
        };
        let posts = [];
        let isLoading = false;

        // Initialize page
        document.addEventListener('DOMContentLoaded', async function() {
            await loadEventOptions();
            const select = document.getElementById('eventSelect');
            if (select) {
                select.addEventListener('change', function() {
                    if (this.value) {
                        window.location.search = '?eventId=' + encodeURIComponent(this.value);
                    }
                });
            }

            const eventId = getEventIdFromUrl();
            if (!eventId) {
                // Optionally show a message: "Please select an event to view its forum."
                return;
            }
            initializePage(eventId);
        });

        // API Functions
        async function initializePage(eventId) {
            showLoading(true);
            try {
                await Promise.all([
                    fetchEventData(eventId),
                    fetchCurrentUser(),
                    fetchForumStats(eventId),
                    fetchPosts(eventId)
                ]);
                
                updateJoinStatus();
            } catch (error) {
                console.error('Failed to initialize page:', error);
                showError('Failed to load forum data');
            } finally {
                showLoading(false);
            }
        }

        async function fetchEventData(eventId) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(`/api/events/${eventId}`, {headers: {
        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) throw new Error('Event not found');
                
                const data = await response.json();
                eventData = data.event;
                loadEventData();
            } catch (error) {
                console.error('Failed to fetch event data:', error);
                throw error;
            }
        }

        async function fetchCurrentUser() {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/auth/me', {
    headers: {
        'Authorization': `Bearer ${token}`
                }
            });
                if (response.ok) {
                    const data = await response.json();
                    currentUser = data.user;
                } else {
                    // User not logged in
                    currentUser = null;
                }
            } catch (error) {
                console.error('Failed to fetch user data:', error);
                currentUser = null;
            }
        }

        async function fetchForumStats(eventId) {
            try {
                const response = await fetch(`/api/forums/${eventId}/stats`);
                if (response.ok) {
                    const data = await response.json();
                    forumStats = data.stats;
                    loadForumStats();
                }
            } catch (error) {
                console.error('Failed to fetch forum stats:', error);
            }
        }

        async function fetchPosts(eventId, filter = 'all') {
            try {
                const queryParam = filter !== 'all' ? `?type=${filter}` : '';
                const response = await fetch(`/api/forums/${eventId}/posts${queryParam}`);
                if (response.ok) {
                    const data = await response.json();
                    posts = data.posts;
                    loadPosts();
                }
            } catch (error) {
                console.error('Failed to fetch posts:', error);
            }
        }

        function loadEventData() {
            if (!eventData) return;
            
            document.getElementById('eventTitle').textContent = eventData.title || eventData.name;
            document.getElementById('eventDate').textContent = formatDate(eventData.date);
            document.getElementById('eventLocation').textContent = eventData.location || 'Location TBA';
            document.getElementById('eventAttendees').textContent = `${(eventData.attendees || 0).toLocaleString()} attending`;
            
            // Generate avatar from event title
            const avatar = eventData.title ? eventData.title.charAt(0).toUpperCase() : '🎉';
            document.getElementById('eventAvatar').textContent = avatar;
        }

        function loadForumStats() {
            document.getElementById('totalMembers').textContent = forumStats.totalMembers || 0;
            document.getElementById('totalPosts').textContent = forumStats.totalPosts || 0;
            document.getElementById('activeToday').textContent = forumStats.activeToday || 0;
            document.getElementById('onlineNow').textContent = forumStats.onlineNow || 0;
        }

        function formatDate(dateString) {
            if (!dateString) return 'Date TBA';
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }

        function loadPosts(filter = 'all') {
            const container = document.getElementById('postsContainer');
            
            if (!posts || posts.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 2rem; color: #666;">
                        <p>No posts yet. Be the first to start a discussion!</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = posts.map(post => `
                <div class="post-card">
                    <div class="post-header">
                        <div class="user-avatar">${generateAvatar(post.author?.name || post.author)}</div>
                        <div>
                            <div class="post-author">${post.author?.name || post.author || 'Anonymous'}</div>
                            <div class="post-time">${formatTimeAgo(post.createdAt || post.time)}</div>
                        </div>
                        <div class="post-type type-${post.type}">${capitalizeFirst(post.type)}</div>
                    </div>
                    <div class="post-content">
                        <h3>${post.title}</h3>
                        <p>${post.content}</p>
                    </div>
                    <div class="post-actions">
                        <button class="action-btn ${post.isLiked ? 'liked' : ''}" onclick="toggleLike('${post._id || post.id}')">
                            ${post.isLiked ? '❤️' : '🤍'} ${post.likes || 0}
                        </button>
                        <button class="action-btn" onclick="viewReplies('${post._id || post.id}')">
                            💬 ${post.replies || 0} replies
                        </button>
                        <button class="action-btn" onclick="sharePost('${post._id || post.id}')">
                            🔗 Share
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function generateAvatar(name) {
            if (!name) return '👤';
            return name.split(' ').map(word => word.charAt(0).toUpperCase()).join('').substring(0, 2);
        }

        function capitalizeFirst(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        function formatTimeAgo(dateString) {
            if (!dateString) return 'Unknown time';
            
            const date = new Date(dateString);
            const now = new Date();
            const diffInMinutes = Math.floor((now - date) / (1000 * 60));
            
            if (diffInMinutes < 1) return 'Just now';
            if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
            
            const diffInHours = Math.floor(diffInMinutes / 60);
            if (diffInHours < 24) return `${diffInHours} hours ago`;
            
            const diffInDays = Math.floor(diffInHours / 24);
            if (diffInDays < 7) return `${diffInDays} days ago`;
            
            return date.toLocaleDateString();
        }

        async function filterPosts(type) {
            // Update active tab
            document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
            event.target.classList.add('active');
            
            // Fetch filtered posts from backend
            const eventId = getEventIdFromUrl();
            await fetchPosts(eventId, type);
        }

        function updateJoinStatus() {
            const statusBadge = document.getElementById('joinStatus');
            const joinMessage = document.getElementById('joinMessage');
            const joinBtn = document.getElementById('joinBtn');
            
            if (!currentUser) {
                statusBadge.className = 'status-badge status-not-joined';
                statusBadge.textContent = '⚠️ Login Required';
                joinMessage.textContent = 'Please login to join the forum';
                joinBtn.textContent = 'Login';
                joinBtn.onclick = () => window.location.href = '/login';
                return;
            }
            
            const isJoined = currentUser.joinedForums?.includes(getEventIdFromUrl()) || false;
            
            if (isJoined) {
                statusBadge.className = 'status-badge status-joined';
                statusBadge.textContent = '✓ Joined Forum';
                joinMessage.textContent = "You're part of this event community!";
                joinBtn.textContent = 'Leave Forum';
                joinBtn.onclick = () => toggleJoinForum();
            } else {
                statusBadge.className = 'status-badge status-not-joined';
                statusBadge.textContent = '⚠️ Not Joined';
                joinMessage.textContent = 'Join to participate in discussions';
                joinBtn.textContent = 'Join Forum';
                joinBtn.onclick = () => toggleJoinForum();
            }
        }

        async function toggleJoinForum() {
            if (!currentUser) {
                window.location.href = '/login';
                return;
            }

            const eventId = getEventIdFromUrl();
            try {
                const response = await fetch(`/api/forums/${eventId}/join`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                       'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Update user's joined forums
                    if (!currentUser.joinedForums) currentUser.joinedForums = [];
                    
                    const isCurrentlyJoined = currentUser.joinedForums.includes(eventId);
                    if (isCurrentlyJoined) {
                        currentUser.joinedForums = currentUser.joinedForums.filter(id => id !== eventId);
                        forumStats.totalMembers--;
                    } else {
                        currentUser.joinedForums.push(eventId);
                        forumStats.totalMembers++;
                    }
                    
                    updateJoinStatus();
                    loadForumStats();
                } else {
                    throw new Error('Failed to join/leave forum');
                }
            } catch (error) {
                console.error('Error toggling forum membership:', error);
                showError('Failed to update forum membership');
            }
        }

        function openNewPostModal() {
            if (!currentUser) {
                alert('Please login first to create posts!');
                window.location.href = 'login.html';
                return;
            }
            
            const isJoined = currentUser.joinedForums?.includes(getEventIdFromUrl()) || false;
            if (!isJoined) {
                alert('Please join the forum first to create posts!');
                return;
            }
            
            document.getElementById('newPostModal').classList.add('active');
        }

        function closeNewPostModal() {
            document.getElementById('newPostModal').classList.remove('active');
            document.getElementById('newPostForm').reset();
        }

        async function toggleLike(postId) {
            if (!currentUser) {
                alert('Please login to like posts!');
                return;
            }

            try {
                const response = await fetch(`/api/posts/${postId}/like`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    // Update the post in the local array
                    const postIndex = posts.findIndex(p => (p._id || p.id) === postId);
                    if (postIndex !== -1) {
                        posts[postIndex].likes = data.likes;
                        posts[postIndex].isLiked = data.isLiked;
                        loadPosts();
                    }
                } else {
                    throw new Error('Failed to toggle like');
                }
            } catch (error) {
                console.error('Error toggling like:', error);
                showError('Failed to update like');
            }
        }

        function viewReplies(postId) {
            // Navigate to detailed post view
            window.location.href = `/vibespace/post/${postId}?eventId=${getEventIdFromUrl()}`;
        }

        function sharePost(postId) {
            const shareUrl = `${window.location.origin}/vibespace/post/${postId}?eventId=${getEventIdFromUrl()}`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'Check out this post',
                    url: shareUrl
                });
            } else {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert('Share link copied to clipboard!');
                }).catch(() => {
                    prompt('Copy this link:', shareUrl);
                });
            }
        }

        // Handle new post form submission
        document.getElementById('newPostForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            if (!currentUser) {
                alert('Please login to create posts!');
                return;
            }

            const eventId = getEventIdFromUrl();
            const formData = {
                eventId: eventId,
                type: document.getElementById('postType').value,
                title: document.getElementById('postTitle').value,
                content: document.getElementById('postContent').value
            };

            try {
                
                const response = await fetch(`/api/forums/${eventId}/posts`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    const data = await response.json();
                    
                    // Add the new post to the beginning of the posts array
                    posts.unshift(data.post);
                    forumStats.totalPosts++;
                    
                    loadPosts();
                    loadForumStats();
                    closeNewPostModal();
                    
                    showSuccess('Post created successfully!');
                } else {
                    throw new Error('Failed to create post');
                }
            } catch (error) {
                console.error('Error creating post:', error);
                showError('Failed to create post');
            }
        });

        // Utility functions
        function getEventIdFromUrl() {
            const urlParams = new URLSearchParams(window.location.search);
            const id = urlParams.get('eventId');
            return /^[a-f\d]{24}$/i.test(id) ? id : null; // Valid MongoDB ObjectId
        }


        function showLoading(show) {
            isLoading = show;
            const loadingIndicator = document.getElementById('loadingIndicator');
            if (loadingIndicator) {
                loadingIndicator.style.display = show ? 'block' : 'none';
            }
        }

        function showError(message) {
            // You can implement a toast notification system here
            console.error(message);
            alert(message);
        }

        function showSuccess(message) {
            // You can implement a toast notification system here
            console.log(message);
            alert(message);
        }

        // Close modal when clicking outside
        document.getElementById('newPostModal').addEventListener('click', function(e) {
            if (e.target === this) {
                closeNewPostModal();
            }
        });

async function loadEventOptions() {
    try {
        const res = await fetch('/api/events');
        const data = await res.json();
        if (data.success && Array.isArray(data.events)) {
            const select = document.getElementById('eventSelect');
            select.innerHTML = '<option value="">-- Choose an Event --</option>';
            data.events.forEach(event => {
                const opt = document.createElement('option');
                opt.value = event._id;
                opt.textContent = event.title;
                select.appendChild(opt);
            });
        }
    } catch (err) {
        // Optionally show error
    }
}

