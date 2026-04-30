/* ══════════════════════════════════════════════
   SYNTAX SYNDICATE — DEVELOPER'S HUB MODULE
   Posts · Projects · Snippets · Ideas · Social
   ══════════════════════════════════════════════ */

const DevHub = {

  /* ═══════════════════════════════════
     POSTS (Feed)
     ═══════════════════════════════════ */
  async createPost(content, imageUrl, linkUrl) {
    const user = Auth.getUser();
    const profile = Auth.getProfile();
    if (!user || !profile) { SS.showToast('Please log in first', 'error'); return null; }
    const data = {
      author_uid: user.uid,
      author_name: profile.name || user.displayName || 'Anonymous',
      author_avatar_url: profile.avatar_url || '',
      author_role: profile.role || 'user',
      author_is_verified: profile.is_verified || false,
      content: content.trim(),
      image_url: (imageUrl || '').trim(),
      link_url: (linkUrl || '').trim(),
      likes: [],
      comment_count: 0,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    const id = await DB.addDoc('devhub_posts', data);
    SS.showToast('Post published!', 'success');
    return id;
  },

  async deletePost(postId) {
    const user = Auth.getUser();
    if (!user) return;
    const post = await DB.getDoc(`devhub_posts/${postId}`);
    if (!post) return;
    if (post.author_uid !== user.uid && !Auth.isAdmin()) {
      SS.showToast('Not authorized', 'error'); return;
    }
    await DB.deleteDoc(`devhub_posts/${postId}`);
    // Delete associated comments
    const comments = await DB.queryDocs('devhub_comments', [['target_type','==','post'],['target_id','==',postId]]);
    for (const c of comments) await DB.deleteDoc(`devhub_comments/${c.id}`);
    SS.showToast('Post deleted', 'info');
  },

  async toggleLike(collection, docId) {
    const user = Auth.getUser();
    if (!user) { SS.showToast('Log in to like', 'error'); return; }
    const doc = await DB.getDoc(`${collection}/${docId}`);
    if (!doc) return;
    const likes = doc.likes || [];
    if (likes.includes(user.uid)) {
      await DB.removeFromArray(`${collection}/${docId}`, 'likes', user.uid);
    } else {
      await DB.addToArray(`${collection}/${docId}`, 'likes', user.uid);
    }
  },

  /* ═══════════════════════════════════
     PROJECTS
     ═══════════════════════════════════ */
  async createProject(data) {
    const user = Auth.getUser();
    const profile = Auth.getProfile();
    if (!user || !profile) { SS.showToast('Please log in first', 'error'); return null; }
    const doc = {
      author_uid: user.uid,
      author_name: profile.name || 'Anonymous',
      author_avatar_url: profile.avatar_url || '',
      author_role: profile.role || 'user',
      author_is_verified: profile.is_verified || false,
      title: data.title.trim(),
      description: (data.description || '').trim(),
      thumbnail_url: (data.thumbnail_url || '').trim(),
      tech_stack: (data.tech_stack || '').split(',').map(s => s.trim()).filter(Boolean),
      github_url: (data.github_url || '').trim(),
      live_url: (data.live_url || '').trim(),
      likes: [],
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    const id = await DB.addDoc('projects', doc);
    SS.showToast('Project added!', 'success');
    return id;
  },

  async deleteProject(projectId) {
    const user = Auth.getUser();
    if (!user) return;
    const p = await DB.getDoc(`projects/${projectId}`);
    if (!p) return;
    if (p.author_uid !== user.uid && !Auth.isAdmin()) {
      SS.showToast('Not authorized', 'error'); return;
    }
    await DB.deleteDoc(`projects/${projectId}`);
    SS.showToast('Project removed', 'info');
  },

  /* ═══════════════════════════════════
     SNIPPETS
     ═══════════════════════════════════ */
  async createSnippet(data) {
    const user = Auth.getUser();
    const profile = Auth.getProfile();
    if (!user || !profile) { SS.showToast('Please log in first', 'error'); return null; }
    const doc = {
      author_uid: user.uid,
      author_name: profile.name || 'Anonymous',
      author_avatar_url: profile.avatar_url || '',
      author_role: profile.role || 'user',
      author_is_verified: profile.is_verified || false,
      title: data.title.trim(),
      description: (data.description || '').trim(),
      language: data.language || 'other',
      code: data.code || '',
      likes: [],
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    const id = await DB.addDoc('snippets', doc);
    SS.showToast('Snippet shared!', 'success');
    return id;
  },

  async deleteSnippet(snippetId) {
    const user = Auth.getUser();
    if (!user) return;
    const s = await DB.getDoc(`snippets/${snippetId}`);
    if (!s) return;
    if (s.author_uid !== user.uid && !Auth.isAdmin()) {
      SS.showToast('Not authorized', 'error'); return;
    }
    await DB.deleteDoc(`snippets/${snippetId}`);
    SS.showToast('Snippet deleted', 'info');
  },

  copySnippet(code) {
    SS.copyToClipboard(code);
  },

  /* ═══════════════════════════════════
     IDEAS
     ═══════════════════════════════════ */
  async createIdea(data) {
    const user = Auth.getUser();
    const profile = Auth.getProfile();
    if (!user || !profile) { SS.showToast('Please log in first', 'error'); return null; }
    const doc = {
      author_uid: user.uid,
      author_name: profile.name || 'Anonymous',
      author_avatar_url: profile.avatar_url || '',
      author_role: profile.role || 'user',
      author_is_verified: profile.is_verified || false,
      title: data.title.trim(),
      description: (data.description || '').trim(),
      category: data.category || 'other',
      upvotes: [],
      downvotes: [],
      status: 'open',
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    const id = await DB.addDoc('ideas', doc);
    SS.showToast('Idea proposed!', 'success');
    return id;
  },

  async voteIdea(ideaId, direction) {
    const user = Auth.getUser();
    if (!user) { SS.showToast('Log in to vote', 'error'); return; }
    const idea = await DB.getDoc(`ideas/${ideaId}`);
    if (!idea) return;
    const uid = user.uid;
    const ups = idea.upvotes || [];
    const downs = idea.downvotes || [];

    if (direction === 'up') {
      if (ups.includes(uid)) {
        await DB.removeFromArray(`ideas/${ideaId}`, 'upvotes', uid);
      } else {
        await DB.addToArray(`ideas/${ideaId}`, 'upvotes', uid);
        if (downs.includes(uid)) await DB.removeFromArray(`ideas/${ideaId}`, 'downvotes', uid);
      }
    } else {
      if (downs.includes(uid)) {
        await DB.removeFromArray(`ideas/${ideaId}`, 'downvotes', uid);
      } else {
        await DB.addToArray(`ideas/${ideaId}`, 'downvotes', uid);
        if (ups.includes(uid)) await DB.removeFromArray(`ideas/${ideaId}`, 'upvotes', uid);
      }
    }
  },

  /* ═══════════════════════════════════
     SOCIAL — Follow System
     ═══════════════════════════════════ */
  _followDocId(followerUid, followingUid) {
    return `${followerUid}_${followingUid}`;
  },

  async followUser(targetUid) {
    const user = Auth.getUser();
    if (!user) { SS.showToast('Log in to follow', 'error'); return; }
    if (user.uid === targetUid) return;
    const docId = this._followDocId(user.uid, targetUid);
    await DB.setDoc(`devhub_follows/${docId}`, {
      follower_uid: user.uid,
      following_uid: targetUid,
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    }, false);
    SS.showToast('Following!', 'success');
  },

  async unfollowUser(targetUid) {
    const user = Auth.getUser();
    if (!user) return;
    const docId = this._followDocId(user.uid, targetUid);
    await DB.deleteDoc(`devhub_follows/${docId}`);
    SS.showToast('Unfollowed', 'info');
  },

  async isFollowing(targetUid) {
    const user = Auth.getUser();
    if (!user) return false;
    const docId = this._followDocId(user.uid, targetUid);
    const doc = await DB.getDoc(`devhub_follows/${docId}`);
    return !!doc;
  },

  async getFollowerCount(uid) {
    const docs = await DB.queryDocs('devhub_follows', [['following_uid','==',uid]], null, 'desc', 1000);
    return docs.length;
  },

  async getFollowingCount(uid) {
    const docs = await DB.queryDocs('devhub_follows', [['follower_uid','==',uid]], null, 'desc', 1000);
    return docs.length;
  },

  async getFollowers(uid) {
    const docs = await DB.queryDocs('devhub_follows', [['following_uid','==',uid]], null, 'desc', 200);
    return docs.sort((a,b) => (b.created_at?.toMillis?.()||0) - (a.created_at?.toMillis?.()||0));
  },

  async getFollowing(uid) {
    const docs = await DB.queryDocs('devhub_follows', [['follower_uid','==',uid]], null, 'desc', 200);
    return docs.sort((a,b) => (b.created_at?.toMillis?.()||0) - (a.created_at?.toMillis?.()||0));
  },

  /* ═══════════════════════════════════
     COMMENTS
     ═══════════════════════════════════ */
  async addComment(targetType, targetId, text) {
    const user = Auth.getUser();
    const profile = Auth.getProfile();
    if (!user || !profile) { SS.showToast('Log in to comment', 'error'); return null; }
    const doc = {
      target_type: targetType,
      target_id: targetId,
      author_uid: user.uid,
      author_name: profile.name || 'Anonymous',
      author_avatar_url: profile.avatar_url || '',
      author_role: profile.role || 'user',
      author_is_verified: profile.is_verified || false,
      text: text.trim(),
      created_at: firebase.firestore.FieldValue.serverTimestamp()
    };
    const id = await DB.addDoc('devhub_comments', doc);
    // Increment comment count on parent (posts only)
    if (targetType === 'post') {
      await DB.incrementField(`devhub_posts/${targetId}`, 'comment_count', 1);
    }
    return id;
  },

  async getComments(targetType, targetId) {
    try {
      const docs = await DB.queryDocs('devhub_comments', [['target_type','==',targetType],['target_id','==',targetId]], null, null, 500);
      return docs.sort((a,b) => (a.created_at?.toMillis?.()||0) - (b.created_at?.toMillis?.()||0));
    } catch(e) { return []; }
  },

  async deleteComment(commentId, targetType, targetId) {
    const user = Auth.getUser();
    if (!user) return;
    const c = await DB.getDoc(`devhub_comments/${commentId}`);
    if (!c) return;
    if (c.author_uid !== user.uid && !Auth.isAdmin()) {
      SS.showToast('Not authorized', 'error'); return;
    }
    await DB.deleteDoc(`devhub_comments/${commentId}`);
    if (targetType === 'post') {
      await DB.incrementField(`devhub_posts/${targetId}`, 'comment_count', -1);
    }
    SS.showToast('Comment deleted', 'info');
  },

  async updateComment(commentId, text) {
    const user = Auth.getUser();
    if (!user) return;
    const c = await DB.getDoc(`devhub_comments/${commentId}`);
    if (!c) return;
    if (c.author_uid !== user.uid && !Auth.isAdmin()) {
      SS.showToast('Not authorized', 'error'); return;
    }
    await DB.updateDoc(`devhub_comments/${commentId}`, {
      text: text.trim(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    SS.showToast('Comment updated', 'success');
  },

  /* ═══════════════════════════════════
     RENDERING HELPERS
     ═══════════════════════════════════ */

  renderPostCard(post) {
    const uid = Auth.getUser()?.uid;
    const liked = (post.likes || []).includes(uid);
    const likeCount = (post.likes || []).length;
    const avatar = SS.renderAvatar({ name: post.author_name, avatar_url: post.author_avatar_url, role: post.author_role }, 'sm circle');
    const badge = SS.getRoleBadge(post.author_role || 'user');
    const tick = post.author_is_verified ? '<span class="verified-tick">✓</span>' : '';
    const time = SS.formatDateRelative(post.created_at);
    const isOwner = uid === post.author_uid || Auth.isAdmin();

    let mediaHTML = '';
    if (post.image_url) {
      mediaHTML = `<img class="dh-post-image" src="${SS.sanitizeHTML(post.image_url)}" alt="Post image" onerror="this.style.display='none'"/>`;
    }
    if (post.link_url) {
      mediaHTML += `<a class="dh-post-link" href="${SS.sanitizeHTML(post.link_url)}" target="_blank" rel="noopener">
        <i class="bi bi-link-45deg" style="font-size:1.1rem;margin-right:4px;"></i>
        ${SS.truncateText(post.link_url, 60)}
      </a>`;
    }

    // Shared content preview card
    let sharedHTML = '';
    if (post.shared_content) {
      const sc = post.shared_content;
      const typeIcons = { project: '<i class="bi bi-rocket-takeoff"></i>', snippet: '<i class="bi bi-file-earmark-code"></i>', pdf: '<i class="bi bi-file-earmark-pdf"></i>' };
      const typeLabels = { project: 'Project', snippet: 'Snippet', pdf: 'Resource' };
      const linkMap = { project: `projects.html`, snippet: `snippets.html`, pdf: `../archives/viewer.html?id=${sc.id}` };
      sharedHTML = `<a href="${linkMap[sc.type] || '#'}" class="dh-shared-card" target="_blank">
        <div class="dh-shared-icon" style="color:var(--accent);">${typeIcons[sc.type] || '📎'}</div>
        <div class="dh-shared-info">
          <div class="dh-shared-label">${typeLabels[sc.type] || 'Content'}</div>
          <div class="dh-shared-title">${SS.sanitizeHTML(sc.title || 'Untitled')}</div>
          ${sc.description ? `<div class="dh-shared-desc">${SS.sanitizeHTML(SS.truncateText(sc.description, 80))}</div>` : ''}
        </div>
        <div class="dh-shared-arrow"><i class="bi bi-chevron-right"></i></div>
      </a>`;
    }

    return `
    <div class="dh-post" id="post-${post.id}" data-id="${post.id}">
      <div class="dh-post-header">
        <a href="profile.html?uid=${post.author_uid}" class="avatar">${avatar}</a>
        <div class="dh-post-meta">
          <a href="profile.html?uid=${post.author_uid}" class="dh-post-author">${SS.sanitizeHTML(post.author_name)}${badge}${tick}</a>
          <div class="dh-post-time">${time}</div>
        </div>
        ${isOwner ? `<button class="dh-post-menu" onclick="DevHub._confirmDelete('post','${post.id}')" title="Delete post">
          <i class="bi bi-x-lg" style="font-size:0.85rem;"></i>
        </button>` : ''}
      </div>
      <div class="dh-post-content">${SS.sanitizeHTML(post.content)}</div>
      ${mediaHTML}
      ${sharedHTML}
      <div class="dh-post-actions">
        <button class="dh-action-btn ${liked ? 'liked' : ''}" onclick="DevHub._handleLike('devhub_posts','${post.id}', this)">
          <i class="bi ${liked ? 'bi-heart-fill' : 'bi-heart'}"></i>
          <span>${likeCount}</span>
        </button>
        <button class="dh-action-btn" onclick="DevHub._toggleComments('${post.id}')">
          <i class="bi bi-chat-dots"></i>
          <span>${post.comment_count || 0}</span>
        </button>
      </div>
      <div class="dh-comments" id="comments-${post.id}">
        <div class="dh-comments-list" id="comments-list-${post.id}"></div>
        ${uid ? `<div class="dh-comment-input">
          <input type="text" placeholder="Write a comment..." id="comment-input-${post.id}" onkeydown="if(event.key==='Enter')DevHub._submitComment('post','${post.id}')"/>
          <button onclick="DevHub._submitComment('post','${post.id}')">Send</button>
        </div>` : ''}
      </div>
    </div>`;
  },

  renderProjectCard(project) {
    const uid = Auth.getUser()?.uid;
    const liked = (project.likes || []).includes(uid);
    const likeCount = (project.likes || []).length;
    const avatar = SS.renderAvatar({ name: project.author_name, avatar_url: project.author_avatar_url }, 'sm circle');
    const tags = (project.tech_stack || []).map(t => `<span class="dh-project-tag">${SS.sanitizeHTML(t)}</span>`).join('');
    const thumbHTML = project.thumbnail_url
      ? `<div class="dh-project-thumb"><img src="${SS.sanitizeHTML(project.thumbnail_url)}" alt="${SS.sanitizeHTML(project.title)}" onerror="this.parentElement.innerHTML='🖥️'"/></div>`
      : `<div class="dh-project-thumb">🖥️</div>`;

    let linksHTML = '';
    if (project.github_url) {
      linksHTML += `<a href="${SS.sanitizeHTML(project.github_url)}" class="dh-project-link" target="_blank" rel="noopener" title="GitHub">
        <i class="bi bi-github"></i>
      </a>`;
    }
    if (project.live_url) {
      linksHTML += `<a href="${SS.sanitizeHTML(project.live_url)}" class="dh-project-link" target="_blank" rel="noopener" title="Live Demo">
        <i class="bi bi-link-45deg"></i>
      </a>`;
    }

    return `
    <div class="dh-project-card" data-id="${project.id}">
      ${thumbHTML}
      <div class="dh-project-body">
        <div class="dh-project-title">${SS.sanitizeHTML(project.title)}</div>
        <div class="dh-project-desc">${SS.sanitizeHTML(project.description)}</div>
        <div class="dh-project-tags">${tags}</div>
        <div class="dh-project-footer">
          <a href="profile.html?uid=${project.author_uid}" class="dh-project-author">
            <span class="avatar">${avatar}</span>
            ${SS.sanitizeHTML(project.author_name)}${SS.getRoleBadge(project.author_role || 'user')}${project.author_is_verified ? '<span class="verified-tick">✓</span>' : ''}
          </a>
          <div style="display:flex;align-items:center;gap:8px;">
            <button class="dh-action-btn ${liked ? 'liked' : ''}" onclick="DevHub._handleLike('projects','${project.id}', this)" style="padding:4px 8px;">
              <i class="bi ${liked ? 'bi-heart-fill' : 'bi-heart'}" style="font-size:0.85rem;"></i>
              <span>${likeCount}</span>
            </button>
            <div class="dh-project-links">${linksHTML}</div>
          </div>
        </div>
      </div>
    </div>`;
  },

  renderSnippetBlock(snippet) {
    const uid = Auth.getUser()?.uid;
    const liked = (snippet.likes || []).includes(uid);
    const likeCount = (snippet.likes || []).length;
    const avatar = SS.renderAvatar({ name: snippet.author_name, avatar_url: snippet.author_avatar_url }, 'sm circle');
    const time = SS.formatDateRelative(snippet.created_at);
    const langClass = `dh-lang-${snippet.language || 'other'}`;
    const escapedCode = SS.sanitizeHTML(snippet.code || '');
    const isOwner = uid === snippet.author_uid || Auth.isAdmin();

    return `
    <div class="dh-snippet" data-id="${snippet.id}">
      <div class="dh-snippet-header">
        <div class="dh-snippet-title">${SS.sanitizeHTML(snippet.title)}</div>
        <span class="dh-snippet-lang ${langClass}">${SS.sanitizeHTML(snippet.language || 'other')}</span>
        ${isOwner ? `<button class="dh-post-menu" onclick="DevHub._confirmDelete('snippet','${snippet.id}')" title="Delete" style="margin-left:4px;">
          <i class="bi bi-trash3" style="font-size:0.85rem;"></i>
        </button>` : ''}
      </div>
      ${snippet.description ? `<div style="padding:0 20px 10px;font-size:.82rem;color:var(--text-2);">${SS.sanitizeHTML(snippet.description)}</div>` : ''}
      <div class="dh-snippet-code">
        <button class="dh-snippet-copy" onclick="DevHub.copySnippet(${JSON.stringify(snippet.code || '').replace(/</g,'\\x3c')})">Copy</button>
        <pre>${escapedCode}</pre>
      </div>
      <div class="dh-snippet-footer">
        <a href="profile.html?uid=${snippet.author_uid}" class="dh-snippet-author">
          <span class="avatar">${avatar}</span>
          ${SS.sanitizeHTML(snippet.author_name)}${SS.getRoleBadge(snippet.author_role || 'user')}${snippet.author_is_verified ? '<span class="verified-tick">✓</span>' : ''} · ${time}
        </a>
        <button class="dh-action-btn ${liked ? 'liked' : ''}" onclick="DevHub._handleLike('snippets','${snippet.id}', this)" style="padding:4px 10px;">
          <i class="bi ${liked ? 'bi-heart-fill' : 'bi-heart'}" style="font-size:0.85rem;"></i>
          <span>${likeCount}</span>
        </button>
      </div>
    </div>`;
  },

  renderIdeaCard(idea) {
    const uid = Auth.getUser()?.uid;
    const ups = idea.upvotes || [];
    const downs = idea.downvotes || [];
    const score = ups.length - downs.length;
    const votedUp = ups.includes(uid);
    const votedDown = downs.includes(uid);
    const initials = SS.getInitials(idea.author_name);
    const time = SS.formatDateRelative(idea.created_at);
    const catClass = `dh-cat-${idea.category || 'other'}`;
    const statusClass = `dh-status-${(idea.status || 'open').replace(' ','_')}`;

    return `
    <div class="dh-idea" data-id="${idea.id}">
      <div class="dh-idea-votes">
        <button class="dh-vote-btn ${votedUp ? 'active-up' : ''}" onclick="DevHub._handleVote('${idea.id}','up')">
          <i class="bi bi-chevron-up"></i>
        </button>
        <div class="dh-vote-score">${score}</div>
        <button class="dh-vote-btn ${votedDown ? 'active-down' : ''}" onclick="DevHub._handleVote('${idea.id}','down')">
          <i class="bi bi-chevron-down"></i>
        </button>
      </div>
      <div class="dh-idea-body">
        <div class="dh-idea-title">${SS.sanitizeHTML(idea.title)}</div>
        <div class="dh-idea-desc">${SS.sanitizeHTML(idea.description)}</div>
        <div class="dh-idea-meta">
          <a href="profile.html?uid=${idea.author_uid}" class="dh-idea-author">
            ${SS.renderAvatar({ name: idea.author_name, avatar_url: idea.author_avatar_url, role: idea.author_role }, 'xs circle')}
            ${SS.sanitizeHTML(idea.author_name)}${SS.getRoleBadge(idea.author_role || 'user')}${idea.author_is_verified ? '<span class="verified-tick">✓</span>' : ''}
          </a>
          <span style="color:var(--pale-slate-2);">·</span>
          <span style="font-size:.7rem;color:var(--text-3);font-family:var(--mono);">${time}</span>
          <span class="dh-cat ${catClass}">${SS.sanitizeHTML(idea.category || 'other')}</span>
          <span class="dh-status ${statusClass}">${(idea.status || 'open').replace('_',' ')}</span>
        </div>
      </div>
    </div>`;
  },

  /* ═══════════════════════════════════
     UI INTERACTION HANDLERS
     ═══════════════════════════════════ */
  async _handleLike(collection, docId, btnEl) {
    if (!Auth.getUser()) { SS.showToast('Log in to like', 'error'); return; }
    const wasLiked = btnEl.classList.contains('liked');
    btnEl.classList.toggle('liked');
    const countEl = btnEl.querySelector('span');
    const current = parseInt(countEl.textContent) || 0;
    countEl.textContent = wasLiked ? Math.max(0, current - 1) : current + 1;
    try {
      await DevHub.toggleLike(collection, docId);
    } catch(e) {
      // Revert on error
      btnEl.classList.toggle('liked');
      countEl.textContent = current;
    }
  },

  async _handleVote(ideaId, direction) {
    if (!Auth.getUser()) { SS.showToast('Log in to vote', 'error'); return; }
    try {
      await DevHub.voteIdea(ideaId, direction);
      if (window._refreshIdeas) window._refreshIdeas();
    } catch(e) { console.error(e); }
  },

  async _toggleComments(postId) {
    const container = document.getElementById(`comments-${postId}`);
    if (!container) return;
    const isOpen = container.classList.contains('open');
    if (!isOpen) {
      container.classList.add('open');
    }
    // Always refresh comments when opening or when already open
    await DevHub._loadCommentsList(postId);
  },

  async _loadCommentsList(postId) {
    const listEl = document.getElementById(`comments-list-${postId}`);
    if (!listEl) return;
    listEl.innerHTML = '<div style="text-align:center;padding:12px;color:var(--text-3);font-size:.8rem;">Loading...</div>';
    const uid = Auth.getUser()?.uid;
    const isAdmin = Auth.isAdmin();

    if (comments.length === 0) {
      listEl.innerHTML = '<div style="text-align:center;padding:12px;color:var(--text-3);font-size:.8rem;">No comments yet — be the first!</div>';
    } else {
      listEl.innerHTML = comments.map(c => {
        const isOwner = uid === c.author_uid || isAdmin;
        return `
          <div class="dh-comment" id="comment-${c.id}">
            <span class="avatar">${SS.renderAvatar({ name: c.author_name, avatar_url: c.author_avatar_url, role: c.author_role }, 'sm circle')}</span>
            <div class="dh-comment-body">
              <div class="dh-comment-header" style="display:flex;justify-content:space-between;align-items:flex-start;">
                <div class="dh-comment-author">${SS.sanitizeHTML(c.author_name)}${SS.getRoleBadge(c.author_role || 'user')}${c.author_is_verified ? '<span class="verified-tick">✓</span>' : ''}</div>
                ${isOwner ? `
                  <div class="dh-comment-actions" style="display:flex;gap:8px;">
                    <button onclick="DevHub._showEditCommentModal('${c.id}', '${SS.sanitizeHTML(c.text.replace(/'/g, "\\'")).replace(/"/g, '&quot;')}', '${postId}')" title="Edit" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:0.75rem;padding:0;"><i class="bi bi-pencil"></i></button>
                    <button onclick="DevHub._confirmDeleteComment('${c.id}', 'post', '${postId}')" title="Delete" style="background:none;border:none;color:var(--text-3);cursor:pointer;font-size:0.75rem;padding:0;"><i class="bi bi-trash"></i></button>
                  </div>
                ` : ''}
              </div>
              <div class="dh-comment-text">${SS.sanitizeHTML(c.text)}</div>
              <div class="dh-comment-time">${SS.formatDateRelative(c.created_at)}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  },

  async _submitComment(targetType, targetId) {
    const input = document.getElementById(`comment-input-${targetId}`);
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;
    input.disabled = true;
    const btn = input.nextElementSibling;
    if (btn) { btn.disabled = true; btn.textContent = '...'; }
    try {
      await DevHub.addComment(targetType, targetId, text);
      input.value = '';
      // Refresh comments (container already open, just reload list)
      await DevHub._loadCommentsList(targetId);
      // Update comment count in the action button
      const postEl = document.getElementById(`post-${targetId}`);
      if (postEl) {
        const btns = postEl.querySelectorAll('.dh-action-btn');
        if (btns[1]) {
          const s = btns[1].querySelector('span');
          if (s) s.textContent = parseInt(s.textContent || 0) + 1;
        }
      }
    } catch(e) { SS.showToast('Error posting comment', 'error'); }
    input.disabled = false;
    if (btn) { btn.disabled = false; btn.textContent = 'Send'; }
    input.focus();
  },

  _confirmDelete(type, id) {
    const nice = type.charAt(0).toUpperCase() + type.slice(1);
    SS.showModal(`
      <p style="font-size:.9rem;color:var(--text-2);margin-bottom:20px;">Are you sure you want to delete this ${type}? This cannot be undone.</p>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button class="btn" onclick="SS.closeModal()">Cancel</button>
        <button class="btn btn-primary" style="background:#d32f2f;border-color:#d32f2f;" onclick="DevHub._executeDelete('${type}','${id}')">Delete</button>
      </div>
    `, { title: `Delete ${nice}?`, closeable: true });
  },

  async _executeDelete(type, id) {
    SS.closeModal();
    if (type === 'post') await DevHub.deletePost(id);
    else if (type === 'project') await DevHub.deleteProject(id);
    else if (type === 'snippet') await DevHub.deleteSnippet(id);
    // Remove from DOM
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }
  },

  _showEditCommentModal(commentId, currentText, postId) {
    SS.showModal(`
      <form id="editCommentForm" style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group">
          <label class="form-label">Edit Comment</label>
          <textarea name="text" class="form-textarea" rows="4" required style="width:100%;">${currentText}</textarea>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;">
          <button type="button" class="btn" onclick="SS.closeModal()">Cancel</button>
          <button type="submit" class="form-submit">Save Changes</button>
        </div>
      </form>
    `, { title: 'Edit Comment' });

    document.getElementById('editCommentForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = e.target.text.value.trim();
      if (!text) return;
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = 'Saving...';
      await DevHub.updateComment(commentId, text);
      SS.closeModal();
      await DevHub._loadCommentsList(postId);
    });
  },

  _confirmDeleteComment(commentId, targetType, targetId) {
    SS.showModal(`
      <p style="font-size:.9rem;color:var(--text-2);margin-bottom:20px;">Are you sure you want to delete this comment?</p>
      <div style="display:flex;gap:10px;justify-content:flex-end;">
        <button class="btn" onclick="SS.closeModal()">Cancel</button>
        <button class="btn btn-primary" style="background:#d32f2f;border-color:#d32f2f;" onclick="DevHub._executeDeleteComment('${commentId}','${targetType}','${targetId}')">Delete</button>
      </div>
    `, { title: 'Delete Comment?', closeable: true });
  },

  async _executeDeleteComment(commentId, targetType, targetId) {
    SS.closeModal();
    await DevHub.deleteComment(commentId, targetType, targetId);
    await DevHub._loadCommentsList(targetId);
    // Update comment count in UI
    const postEl = document.getElementById(`post-${targetId}`);
    if (postEl) {
      const btns = postEl.querySelectorAll('.dh-action-btn');
      if (btns[1]) {
        const s = btns[1].querySelector('span');
        if (s) s.textContent = Math.max(0, parseInt(s.textContent || 0) - 1);
      }
    }
  },

  /* ═══════════════════════════════════
     MODAL — Create Forms
     ═══════════════════════════════════ */
  showProjectModal() {
    if (!Auth.getUser()) { SS.showToast('Please log in first', 'error'); return; }
    SS.showModal(`
      <form id="projectForm" style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group"><label class="form-label">Project Title *</label><input name="title" class="form-input" required placeholder="My Awesome Project"/></div>
        <div class="form-group"><label class="form-label">Description</label><textarea name="description" class="form-textarea" rows="3" placeholder="What does it do?"></textarea></div>
        <div class="form-group"><label class="form-label">Thumbnail URL</label><input name="thumbnail_url" class="form-input" placeholder="https://..."/></div>
        <div class="form-group"><label class="form-label">Tech Stack</label><input name="tech_stack" class="form-input" placeholder="React, Node.js, Firebase"/><div class="form-hint">Comma-separated</div></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">GitHub URL</label><input name="github_url" class="form-input" placeholder="https://github.com/..."/></div>
          <div class="form-group"><label class="form-label">Live URL</label><input name="live_url" class="form-input" placeholder="https://..."/></div>
        </div>
        <button type="submit" class="form-submit" style="align-self:flex-end;">Add Project</button>
      </form>
    `, { title: 'Add Project' });
    document.getElementById('projectForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd);
      const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Adding...';
      const projectId = await DevHub.createProject(data);
      SS.closeModal();
      if (window._refreshProjects) window._refreshProjects();
      // Offer to share as post
      if (projectId) DevHub._showShareAsPostPrompt('project', projectId, data.title, data.description);
    });
  },

  showSnippetModal() {
    if (!Auth.getUser()) { SS.showToast('Please log in first', 'error'); return; }
    SS.showModal(`
      <form id="snippetForm" style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group"><label class="form-label">Snippet Title *</label><input name="title" class="form-input" required placeholder="Array Flatten Utility"/></div>
        <div class="form-group"><label class="form-label">Description</label><input name="description" class="form-input" placeholder="Short description..."/></div>
        <div class="form-group"><label class="form-label">Language</label>
          <select name="language" class="form-select">
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="html">HTML</option>
            <option value="css">CSS</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Code *</label><textarea name="code" class="form-textarea" rows="8" required style="font-family:var(--mono);font-size:.82rem;tab-size:2;" placeholder="Paste your code here..."></textarea></div>
        <button type="submit" class="form-submit" style="align-self:flex-end;">Share Snippet</button>
      </form>
    `, { title: 'Share Snippet' });
    document.getElementById('snippetForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const data = Object.fromEntries(fd);
      const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Sharing...';
      const snippetId = await DevHub.createSnippet(data);
      SS.closeModal();
      if (window._refreshSnippets) window._refreshSnippets();
      // Offer to share as post
      if (snippetId) DevHub._showShareAsPostPrompt('snippet', snippetId, data.title, data.description);
    });
  },

  showIdeaModal() {
    if (!Auth.getUser()) { SS.showToast('Please log in first', 'error'); return; }
    SS.showModal(`
      <form id="ideaForm" style="display:flex;flex-direction:column;gap:14px;">
        <div class="form-group"><label class="form-label">Idea Title *</label><input name="title" class="form-input" required placeholder="Build a collaborative code editor"/></div>
        <div class="form-group"><label class="form-label">Description *</label><textarea name="description" class="form-textarea" rows="4" required placeholder="Describe the idea in detail..."></textarea></div>
        <div class="form-group"><label class="form-label">Category</label>
          <select name="category" class="form-select">
            <option value="project">Project</option>
            <option value="feature">Feature</option>
            <option value="tool">Tool</option>
            <option value="other">Other</option>
          </select>
        </div>
        <button type="submit" class="form-submit" style="align-self:flex-end;">Propose Idea</button>
      </form>
    `, { title: 'Propose an Idea' });
    document.getElementById('ideaForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Proposing...';
      await DevHub.createIdea(Object.fromEntries(fd));
      SS.closeModal();
      if (window._refreshIdeas) window._refreshIdeas();
    });
  },

  /* ═══════════════════════════════════
     SHARE AS POST — Auto-create post from content
     ═══════════════════════════════════ */
  _showShareAsPostPrompt(type, contentId, title, description) {
    const typeLabels = { project: 'Project', snippet: 'Snippet', pdf: 'Resource' };
    const typeIcons = { project: '🖥️', snippet: '📝', pdf: '📄' };
    setTimeout(() => {
      SS.showModal(`
        <div style="text-align:center;padding:8px 0 16px;">
          <div style="font-size:2.5rem;margin-bottom:12px;">🎉</div>
          <p style="font-size:1rem;font-weight:600;color:var(--carbon-black);margin-bottom:6px;">Your ${typeLabels[type] || 'content'} is live!</p>
          <p style="font-size:.88rem;color:var(--text-2);margin-bottom:20px;">Would you like to share it as a post so the community can discover it?</p>
          <div style="background:var(--tint);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:left;margin-bottom:20px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="font-size:1.5rem;">${typeIcons[type] || '📎'}</span>
              <div>
                <div style="font-weight:700;font-size:.92rem;color:var(--carbon-black);">${SS.sanitizeHTML(title || 'Untitled')}</div>
                ${description ? `<div style="font-size:.8rem;color:var(--text-2);margin-top:2px;">${SS.sanitizeHTML(SS.truncateText(description, 80))}</div>` : ''}
              </div>
            </div>
          </div>
          <div style="display:flex;gap:10px;justify-content:center;">
            <button class="btn" onclick="SS.closeModal()" style="padding:10px 24px;">Skip</button>
            <button class="btn btn-primary" onclick="DevHub._executeShareAsPost('${type}','${contentId}',${JSON.stringify(title||'').replace(/'/g,"\\'")},${JSON.stringify(description||'').replace(/'/g,"\\'")}); SS.closeModal();" style="padding:10px 24px;background:var(--accent);border-color:var(--accent);">Share as Post 🚀</button>
          </div>
        </div>
      `, { title: 'Share with Community', closeable: true });
    }, 400);
  },

  async _executeShareAsPost(type, contentId, title, description) {
    const typeLabels = { project: 'project', snippet: 'snippet', pdf: 'resource' };
    const content = `Check out my new ${typeLabels[type] || 'content'}: ${title || 'Untitled'}${description ? '\n\n' + SS.truncateText(description, 120) : ''}`;
    const user = Auth.getUser();
    const profile = Auth.getProfile();
    if (!user || !profile) return;
    try {
      const data = {
        author_uid: user.uid,
        author_name: profile.name || user.displayName || 'Anonymous',
        author_avatar_url: profile.avatar_url || '',
        content: content.trim(),
        image_url: '',
        link_url: '',
        shared_content: { type, id: contentId, title: title || 'Untitled', description: description || '' },
        likes: [],
        comment_count: 0,
        created_at: firebase.firestore.FieldValue.serverTimestamp()
      };
      await DB.addDoc('devhub_posts', data);
      SS.showToast('Shared as post!', 'success');
    } catch(e) {
      SS.showToast('Error sharing post', 'error');
    }
  }
};

window.DevHub = DevHub;
