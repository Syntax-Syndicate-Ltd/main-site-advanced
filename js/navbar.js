/* ══════════════════════════════════════════════
   SYNTAX SYNDICATE — SHARED NAVBAR COMPONENT
   Handles both Main and Dashboard navbars
   ══════════════════════════════════════════════ */

(function() {
  const Navbar = {
    // Determine path to root
    getRootPath: function() {
      const path = window.location.pathname;
      if (path.includes('/resources/') || path.includes('/opportunities/') || path.includes('/archives/') || path.includes('/devhub/') || path.includes('/company/')) {
        return '../';
      }
      return '';
    },

    templates: {
      main: function(root) {
        return `
<nav id="navbar">
  <a href="${root}index.html" class="nav-logo">
    <div class="nav-logo-badge">SS</div>
    Syntax Syndicate
  </a>



  <button class="mobile-menu-btn" aria-label="Toggle menu" onclick="document.getElementById('navbar').classList.toggle('mobile-open')">
    <svg viewBox="0 0 24 24"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  </button>

  <!-- PDF Library -->
  <div class="nav-item">
    <button class="nav-item-btn">
      PDF Library
      <svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="nav-dropdown">
      <div class="nav-dd-label">Library</div>
      <a href="${root}archives/free-library.html" class="nav-dd-link"><div class="nav-dd-icon"><svg viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg></div>Free Library</a>
      <a href="${root}archives/premium-library.html" class="nav-dd-link"><div class="nav-dd-icon"><svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>Premium Library <span style="font-size:.5rem;background:linear-gradient(135deg,#f9d423,#ff4e50);color:#fff;padding:1px 6px;border-radius:100px;margin-left:4px;">PRO</span></a>
      <a href="${root}archives/premium-projects.html" class="nav-dd-link"><div class="nav-dd-icon"><svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div>Premium Projects <span style="font-size:.5rem;background:linear-gradient(135deg,#f9d423,#ff4e50);color:#fff;padding:1px 6px;border-radius:100px;margin-left:4px;">PRO</span></a>
    </div>
  </div>

  <!-- Opportunities -->
  <div class="nav-item">
    <button class="nav-item-btn">
      Opportunities
      <svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="dropdown-mega">
      <div class="dropdown-label">Explore Opportunities</div>
      <div class="dropdown-grid">
        <a class="dropdown-item" href="${root}opportunities/browse.html?cat=jobs">
          <div class="dropdown-icon-box" style="background:#edf1ff; color:#1847c2"><i class="bi bi-briefcase"></i></div>
          <div class="dropdown-info"><strong>Jobs</strong><span>Full-time tech roles</span></div>
        </a>
        <a class="dropdown-item" href="${root}opportunities/browse.html?cat=internships">
          <div class="dropdown-icon-box" style="background:#e8f6fd; color:#0c7abf"><i class="bi bi-mortarboard"></i></div>
          <div class="dropdown-info"><strong>Internships</strong><span>Get industry experience</span></div>
        </a>
        <a class="dropdown-item" href="${root}opportunities/browse.html?cat=hackathons">
          <div class="dropdown-icon-box" style="background:#fdf0f0; color:#c41f1f"><i class="bi bi-lightning"></i></div>
          <div class="dropdown-info"><strong>Hackathons</strong><span>Build, compete, and win</span></div>
        </a>
        <a class="dropdown-item" href="${root}opportunities/browse.html?cat=techEvents">
          <div class="dropdown-icon-box" style="background:#fef8ec; color:#b45309"><i class="bi bi-cpu"></i></div>
          <div class="dropdown-info"><strong>Tech Events</strong><span>Industry meetups</span></div>
        </a>
      </div>
      <div class="nav-dd-sep" style="margin: 14px 0;"></div>
      <div class="dropdown-grid">
        <a class="dropdown-item" href="${root}opportunities/browse.html?cat=seminars">
          <div class="dropdown-icon-box" style="background:#f4f0ff; color:#6d28d9"><i class="bi bi-mic"></i></div>
          <div class="dropdown-info"><strong>Seminars</strong><span>Learn from experts</span></div>
        </a>
        <a class="dropdown-item" href="${root}opportunities/browse.html?cat=courses">
          <div class="dropdown-icon-box" style="background:#ecfdf5; color:#047857"><i class="bi bi-book"></i></div>
          <div class="dropdown-info"><strong>Courses</strong><span>Certification paths</span></div>
        </a>
      </div>
    </div>
  </div>

  <!-- Resources -->
  <div class="nav-item">
    <button class="nav-item-btn">
      Resources
      <svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="nav-dropdown">
      <div class="nav-dd-label">Learn</div>
      <a href="${root}resources/index.html" class="nav-dd-link"><div class="nav-dd-icon"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>Roadmaps</a>
      <a href="${root}resources/index.html?tab=cheatsheets" class="nav-dd-link"><div class="nav-dd-icon"><svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></div>Cheatsheets</a>
      <a href="${root}guide.html" class="nav-dd-link"><div class="nav-dd-icon"><svg viewBox="0 0 24 24"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg></div>Guide Tool</a>
    </div>
  </div>

  <!-- More -->
  <div class="nav-item">
    <button class="nav-item-btn">
      More
      <svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="dropdown-mega">
      <div class="dropdown-label">Services & Community</div>
      <div class="dropdown-grid">
        <a class="dropdown-item" href="${root}about-resume.html">
          <div class="dropdown-icon-box" style="background:#f0f9ff; color:#0369a1"><i class="bi bi-file-earmark-person"></i></div>
          <div class="dropdown-info"><strong>Resume Builder <span style="font-size:.5rem;background:linear-gradient(135deg,#f9d423,#ff4e50);color:#fff;padding:1px 6px;border-radius:100px;margin-left:4px;font-weight:800;vertical-align:middle;">PRO</span></strong><span>ATS-friendly templates</span></div>
        </a>
        <a class="dropdown-item" href="${root}about-portfolio.html">
          <div class="dropdown-icon-box" style="background:#fdf4ff; color:#a21caf"><i class="bi bi-globe2"></i></div>
          <div class="dropdown-info"><strong>Portfolio Builder <span style="font-size:.5rem;background:linear-gradient(135deg,#f9d423,#ff4e50);color:#fff;padding:1px 6px;border-radius:100px;margin-left:4px;font-weight:800;vertical-align:middle;">PRO</span></strong><span>Host your projects</span></div>
        </a>
        <a class="dropdown-item" href="https://whatsapp.com/channel/0029Val68sC23n3Z7mJ3f33E" target="_blank">
          <div class="dropdown-icon-box" style="background:#ecfdf5; color:#059669"><i class="bi bi-whatsapp"></i></div>
          <div class="dropdown-info"><strong>Community</strong><span>Join the channel</span></div>
        </a>
        <a class="dropdown-item" href="${root}index.html#blogs">
          <div class="dropdown-icon-box" style="background:#fff7ed; color:#c2410c"><i class="bi bi-journal-text"></i></div>
          <div class="dropdown-info"><strong>Blogs</strong><span>Latest updates</span></div>
        </a>
        <a class="dropdown-item" href="${root}devhub/feed.html">
          <div class="dropdown-icon-box" style="background:#f0fdf4; color:#16a34a"><i class="bi bi-code-slash"></i></div>
          <div class="dropdown-info"><strong>Developer's Hub</strong><span>Community & projects</span></div>
        </a>
      </div>
    </div>
  </div>

  <div class="nav-spacer"></div>

  <!-- Notification Bell (Always accessible on mobile) -->
  <div class="nav-item nav-notif-bell" id="notifBellWrap" style="display:none;">
    <button class="nav-notif-btn" aria-label="Notifications" onclick="event.stopPropagation(); toggleNotifs()">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <span id="notifBadge" class="nav-notif-badge" style="display:none;"></span>
    </button>
    
    <!-- Desktop Dropdown -->
    <div class="nav-dropdown notif-dropdown-desktop" style="right:0;left:auto; width: 340px; padding: 0;">
      <div style="padding: 12px 14px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
        <div class="nav-dd-label" style="padding:0;">Notifications</div>
        <div style="display: flex; gap: 8px;">
          <button onclick="markAllNotifsRead()" style="background:none; border:none; color:var(--accent); font-size:11px; font-weight:600; cursor:pointer;">Mark all as read</button>
          <button onclick="deleteAllReadNotifs()" style="background:none; border:none; color:#ef4444; font-size:11px; font-weight:600; cursor:pointer;">Delete read</button>
        </div>
      </div>
      <div class="notif-list-container" style="max-height: 400px; overflow-y: auto; padding: 4px 0;">
        <div style="padding:20px;text-align:center;color:var(--text-3);font-size:12px;">Loading notifications...</div>
      </div>
    </div>
  </div>

  <div class="nav-right">
    <div id="navGuest">
      <div class="nav-item">
        <button class="nav-item-btn">
          Login
          <svg class="nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="nav-dropdown" style="right:0;left:auto;">
          <a href="${root}login.html" class="nav-dd-link">User Login</a>
          <a href="${root}login-company.html" class="nav-dd-link">Institute Login</a>
          <div class="nav-dd-sep"></div>
          <a href="${root}register.html" class="nav-dd-link">Register</a>
        </div>
      </div>
      <a href="${root}login.html" class="nav-cta">Get Started</a>
    </div>

    <div id="navUser" class="nav-user-container" style="display:none;">
      <div class="nav-item">
        <button class="nav-item-btn" id="navUserName">My Account</button>
        <div class="nav-dropdown" style="right:0;left:auto;">
          <a href="${root}profile.html" class="nav-dd-link">My Profile</a>
          <a href="${root}devhub/profile.html?uid=" class="nav-dd-link" id="navPublicProfile">Public Profile</a>
          <a href="${root}admin.html" class="nav-dd-link" id="navAdminLink" style="display:none;">Admin Panel</a>
          <div class="nav-dd-sep"></div>
          <a href="#" class="nav-dd-link" onclick="Auth.logout();return false;">Logout</a>
        </div>
      </div>
      <a href="${root}profile.html" class="nav-cta" id="navDashCta">Dashboard</a>
    </div>
  </div>

</nav>

<!-- Mobile Notifications Popup Overlay -->
<div id="notifMobilePopup" class="notif-mobile-popup">
  <div class="notif-popup-content">
    <div class="notif-popup-header">
      <h3>Notifications</h3>
      <button onclick="toggleNotifs()" class="notif-popup-close">✕</button>
    </div>
    <div class="notif-popup-actions" style="display: flex; justify-content: flex-end; gap: 12px;">
      <button onclick="markAllNotifsRead()" style="color:var(--accent); background:none; border:none; font-weight:600; font-size:12px;">Mark all as read</button>
      <button onclick="deleteAllReadNotifs()" style="color:#ef4444; background:none; border:none; font-weight:600; font-size:12px;">Delete read</button>
    </div>
    <div class="notif-list-container mobile-list">
      <div style="padding:40px;text-align:center;color:var(--text-3);font-size:14px;">Loading notifications...</div>
    </div>
  </div>
</div>
        `;
      },
      dashboard: function(root) {
        return `
<div class="top-nav">
  <a href="${root}index.html" class="nav-logo">
    <div class="nav-logo-badge">SS</div>
    Syntax Syndicate
  </a>
  <div class="nav-actions">
    <a href="${root}index.html" class="btn">← Home</a>
    <button class="btn btn-primary" onclick="Auth.logout()">Logout</button>
  </div>
</div>
        `;
      }
    },

    init: function(type = 'main') {
      const placeholder = document.getElementById('navbar-placeholder');
      if (!placeholder) return;

      const root = this.getRootPath();
      placeholder.innerHTML = this.templates[type](root);

      // Handle auth state via the synchronized Auth listener
      if (window.Auth) {
        // Initial check
        this.updateAuthState();
        // Subscribe to hydrated state changes
        Auth.onAuthChange(() => this.updateAuthState());
      }

      // Click-to-open Dropdowns (All devices)
      placeholder.querySelectorAll('.nav-item-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const item = btn.parentElement;
          const isOpen = item.classList.contains('open');
          
          // Close others
          document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('open'));
          
          // Toggle current
          if (!isOpen) item.classList.add('open');
        });
      });

      // Close dropdowns on outside click
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav-item')) {
          document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('open'));
        }
      });
    },

    updateAuthState: function() {
      if (!window.Auth) return;
      const user = firebase.auth().currentUser;
      const profile = Auth.getProfile();
      
      const guestEl = document.getElementById('navGuest');
      const userEl = document.getElementById('navUser');
      const nameEl = document.getElementById('navUserName');
      const adminLink = document.getElementById('navAdminLink');
      const dashCta = document.getElementById('navDashCta');
      const bellWrap = document.getElementById('notifBellWrap');
      const publicProfile = document.getElementById('navPublicProfile');

      if (user && profile) {
        if (guestEl) guestEl.style.display = 'none';
        if (userEl) userEl.style.display = 'flex';
        if (bellWrap) bellWrap.style.display = 'flex';
        
        // Update Name + Avatar
        if (nameEl) {
          const initials = SS.renderAvatar(profile, 'sm circle');
          const firstName = (profile.name || user.displayName || 'Account').split(' ')[0];
          const badge = SS.getRoleBadge(profile.role);
          const tick = profile.is_verified ? '<span class="verified-tick" style="width:12px; height:12px; font-size:8px; margin-left:4px;">✓</span>' : '';
          nameEl.innerHTML = `<div class="nav-avatar-wrap">${initials}</div> <span class="nav-name-text">${firstName}${badge}${tick}</span>`;
        }
        
        // Set public profile link
        if (publicProfile) {
          publicProfile.href = SS.getProfileLink(profile);
        }

        // Handle Admin Link visibility
        if (adminLink) {
          const isAdmin = ['superadmin', 'team'].includes(profile.role);
          adminLink.style.display = isAdmin ? 'flex' : 'none';
          if (isAdmin) adminLink.href = this.getRootPath() + 'admin.html';
        }

        // Handle Dashboard CTA routing
        if (dashCta) {
          const root = this.getRootPath();
          if (['superadmin', 'team'].includes(profile.role)) {
            dashCta.href = root + 'admin.html';
          } else if (profile.role === 'institute_admin') {
            dashCta.href = root + 'dashboard-company.html';
          } else {
            dashCta.href = root + 'profile.html';
          }
        }

        // Load notifications
        if (window.loadNavNotifications) loadNavNotifications();
      } else {
        if (guestEl) guestEl.style.display = 'flex';
        if (userEl) userEl.style.display = 'none';
        if (bellWrap) bellWrap.style.display = 'none';
      }
    }
  };

  window.SyntaxNavbar = Navbar;
  window.Navbar = Navbar;

  async function loadNotifModalContent() {
    const user = firebase.auth().currentUser;
    if (!user || !window.DB) return;
    const containers = document.querySelectorAll('.notif-list-container');
    if (!containers.length) return;

    try {
      const allNotifs = await DB.fetchUserNotifications(user.uid, 40);
      const deletedIds = JSON.parse(localStorage.getItem('ss_deleted_notifs') || '[]');
      const notifs = allNotifs.filter(n => !deletedIds.includes(n.id)).slice(0, 20);

      if (!notifs.length) {
        containers.forEach(c => c.innerHTML = `
          <div style="padding:48px 20px;text-align:center;">
            <div style="margin-bottom:16px; display:flex; justify-content:center;">
              <div style="position:relative; width:64px; height:64px; background:var(--tint); border-radius:16px; display:flex; align-items:center; justify-content:center;">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--text-3); opacity:0.6;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <div style="position:absolute; width:100%; height:2px; background:linear-gradient(90deg, transparent, var(--text-3), transparent); transform:rotate(-45deg); opacity: 0.4;"></div>
              </div>
            </div>
            <div style="font-size:.95rem;font-weight:600;color:var(--carbon-black);margin-bottom:4px;">No notifications yet</div>
            <div style="font-size:.82rem;color:var(--text-3);">You're all caught up!</div>
          </div>`);
        return;
      }

      const readIds = JSON.parse(localStorage.getItem('ss_read_notifs') || '[]');
      const root = Navbar.getRootPath();

      const html = notifs.map(n => {
        const isRead = readIds.includes(n.id);
        const link = n.link ? root + n.link : '#';
        const timeStr = n.created_at ? (() => {
          const d = n.created_at.toDate ? n.created_at.toDate() : new Date(n.created_at);
          const diff = Math.floor((Date.now() - d) / 1000);
          if (diff < 60) return 'Just now';
          if (diff < 3600) return Math.floor(diff/60) + 'm ago';
          if (diff < 86400) return Math.floor(diff/3600) + 'h ago';
          return Math.floor(diff/86400) + 'd ago';
        })() : '';

        return `
        <div class="notif-modal-item ${isRead ? '' : 'unread'}">
          <a href="${link}" onclick="markNotifRead('${n.id}'); if(window.innerWidth < 850) toggleNotifs();" class="notif-modal-link">
            <div class="notif-modal-dot ${isRead ? '' : 'active'}"></div>
            <div class="notif-modal-content">
              <div class="notif-modal-title">${n.title || 'Notification'}</div>
              <div class="notif-modal-msg">${n.message || ''}</div>
              <div class="notif-modal-time">${timeStr}</div>
            </div>
          </a>
          <button class="notif-item-delete" onclick="deleteNotif('${n.id}', event)" title="Delete">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          </button>
        </div>`;
      }).join('');
      containers.forEach(c => c.innerHTML = html);
    } catch(e) {
      containers.forEach(c => c.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-3);font-size:13px;">Unable to load notifications</div>');
    }
  }

  window.toggleNotifs = function() {
    const wrap = document.getElementById('notifBellWrap');
    if (window.innerWidth <= 850) {
      const popup = document.getElementById('notifMobilePopup');
      if (popup) {
        const isOpen = popup.classList.contains('active');
        popup.classList.toggle('active');
        if (!isOpen) {
          // Close main nav if open
          const navbar = document.getElementById('navbar');
          if (navbar) navbar.classList.remove('mobile-open');
        }
      }
    } else if (wrap) {
      const isOpen = wrap.classList.contains('open');
      // Close other dropdowns
      document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) wrap.classList.add('open');
    }
  };

  window.loadNavNotifications = async function() {
    const user = firebase.auth().currentUser;
    if (!user || !window.DB) return;
    const badge = document.getElementById('notifBadge');
    
    // Always load content
    loadNotifModalContent();

    if (!badge) return;

    try {
      const allNotifs = await DB.fetchUserNotifications(user.uid, 25);
      const readIds = JSON.parse(localStorage.getItem('ss_read_notifs') || '[]');
      const deletedIds = JSON.parse(localStorage.getItem('ss_deleted_notifs') || '[]');
      
      const activeNotifs = allNotifs.filter(n => !deletedIds.includes(n.id));
      const unread = activeNotifs.filter(n => !readIds.includes(n.id)).length;
      
      if (unread > 0) {
        badge.style.display = 'flex';
        badge.textContent = unread > 9 ? '9+' : unread;
      } else {
        badge.style.display = 'none';
      }
    } catch(e) {
      if(badge) badge.style.display = 'none';
    }
  };

  window.markNotifRead = function(id) {
    const readIds = JSON.parse(localStorage.getItem('ss_read_notifs') || '[]');
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem('ss_read_notifs', JSON.stringify(readIds));
    }
  };

  window.markAllNotifsRead = function() {
    const items = document.querySelectorAll('.notif-modal-item.unread');
    const readIds = JSON.parse(localStorage.getItem('ss_read_notifs') || '[]');
    items.forEach(item => {
      item.classList.remove('unread');
      const dot = item.querySelector('.notif-modal-dot');
      if (dot) dot.classList.remove('active');
      // Extract id from delete button or link
      const delBtn = item.querySelector('.notif-item-delete');
      if (delBtn) {
        const onclick = delBtn.getAttribute('onclick') || '';
        const match = onclick.match(/deleteNotif\('([^']+)'/);
        if (match && !readIds.includes(match[1])) readIds.push(match[1]);
      }
    });
    localStorage.setItem('ss_read_notifs', JSON.stringify(readIds));
    const badge = document.getElementById('notifBadge');
    if (badge) badge.style.display = 'none';
    SS.showToast('All notifications marked as read', 'success');
  };

  window.deleteNotif = function(id, event) {
    if (event) event.stopPropagation();
    const deletedIds = JSON.parse(localStorage.getItem('ss_deleted_notifs') || '[]');
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('ss_deleted_notifs', JSON.stringify(deletedIds));
    }
    loadNavNotifications();
    SS.showToast('Notification deleted', 'info');
  };

  window.deleteAllReadNotifs = function() {
    const readIds = JSON.parse(localStorage.getItem('ss_read_notifs') || '[]');
    const deletedIds = JSON.parse(localStorage.getItem('ss_deleted_notifs') || '[]');
    
    let added = 0;
    readIds.forEach(id => {
      if (!deletedIds.includes(id)) {
        deletedIds.push(id);
        added++;
      }
    });
    
    if (added > 0) {
      localStorage.setItem('ss_deleted_notifs', JSON.stringify(deletedIds));
      loadNavNotifications();
      SS.showToast(`${added} read notifications deleted`, 'success');
    } else {
      SS.showToast('No read notifications to delete', 'info');
    }
  };

  // Auto-init based on placeholder attribute
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('navbar-placeholder');
    if (el) {
      const type = el.getAttribute('data-type') || 'main';
      Navbar.init(type);
    }
  });
})();
