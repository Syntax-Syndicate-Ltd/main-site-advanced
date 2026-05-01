/* ══════════════════════════════════════════════
   SYNTAX SYNDICATE — ADMIN MODULE
   No ES6 modules — uses global compat SDK
   ══════════════════════════════════════════════ */

const COLLECTIONS = {
  JOBS: 'ss_jobs',
  INTERNSHIPS: 'ss_internships',
  HACKATHONS: 'ss_hackathons',
  TECH_EVENTS: 'ss_techEvents',
  SEMINARS: 'ss_seminars',
  COURSES: 'ss_courses',
  ADS: 'ss_ads',
  PREMIUM_PROJECTS: 'ss_premium_projects'
};

const FORM_MAP = {
  'form-job': COLLECTIONS.JOBS,
  'form-internship': COLLECTIONS.INTERNSHIPS,
  'form-hackathon': COLLECTIONS.HACKATHONS,
  'form-techevent': COLLECTIONS.TECH_EVENTS,
  'form-seminar': COLLECTIONS.SEMINARS,
  'form-course': COLLECTIONS.COURSES,
  'form-ad': COLLECTIONS.ADS,
  'form-premium-project': COLLECTIONS.PREMIUM_PROJECTS,
};

/* ── Toast helper ── */
function showToast(msg, type = 'success') {
  const container = document.querySelector('.toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

/* ── Time ago ── */
function timeAgo(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ══════════════════════════════════════════════
   AUTH GATE — require admin role
   ══════════════════════════════════════════════ */
Auth.requireAdmin().then(() => {
  initAdmin();
}).catch(() => { });

function initAdmin() {
  const user = firebase.auth().currentUser;
  document.getElementById('admin-email').textContent = user?.email || '';

  // ── Sidebar navigation ──
  document.querySelectorAll('.sidebar-link[data-section]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      // Active state
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      // Show section
      document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
      const target = document.getElementById(`section-${section}`);
      if (target) target.classList.add('active');

      // Auto-load data for certain sections
      if (section === 'dashboard') loadDashboard();
      if (section === 'manage') loadManagePosts();
      if (section === 'users') loadUsers();
      if (section === 'approvals') loadApprovals();
      if (section === 'manage-roadmaps') loadManageRoadmaps();
      if (section === 'manage-cheatsheets') loadManageCheatsheets();
      if (section === 'manage-pdfs') loadManagePdfs();
      if (section === 'manage-premium-projects') loadManagePremiumProjects();
      if (section === 'pdf-analytics') loadPdfAnalytics();
      if (section === 'notifications') loadNotificationsPanel();
      if (section === 'messages') loadMessages();
      if (section === 'institutes') loadInstitutes();
      if (section === 'verification-requests') loadVerificationRequests();

      // Close mobile sidebar
      document.getElementById('admin-sidebar')?.classList.remove('open');
      document.getElementById('sidebar-overlay')?.classList.remove('open');
    });
  });

  // Mobile sidebar toggle
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    document.getElementById('admin-sidebar')?.classList.toggle('open');
    document.getElementById('sidebar-overlay')?.classList.toggle('open');
  });
  document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
    document.getElementById('admin-sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('open');
  });

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', () => Auth.logout());

  // ── Form submissions ──
  Object.entries(FORM_MAP).forEach(([formId, collection]) => {
    const form = document.getElementById(formId);
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      // Clean empty values
      Object.keys(data).forEach(k => { if (!data[k]) delete data[k]; });
      data.postedAt = firebase.firestore.FieldValue.serverTimestamp();
      data.postedBy = user?.email || 'admin';

      try {
        await db.collection(collection).add(data);
        showToast(`✅ Published to ${collection.replace('ss_', '')} successfully!`);
        form.reset();
      } catch (err) {
        console.error('Publish error:', err);
        showToast('❌ Failed to publish: ' + err.message, 'error');
      }
    });
  });

  // Manage posts refresh
  document.getElementById('refresh-posts-btn')?.addEventListener('click', loadManagePosts);
  document.getElementById('manage-filter')?.addEventListener('change', loadManagePosts);

  // Approvals refresh
  document.getElementById('refresh-approvals-btn')?.addEventListener('click', loadApprovals);

  // Users refresh
  document.getElementById('refresh-users-btn')?.addEventListener('click', loadUsers);
  document.getElementById('users-search')?.addEventListener('input', filterUsersTable);

  // Institutes refresh
  document.getElementById('refresh-institutes-btn')?.addEventListener('click', loadInstitutes);

  // Load dashboard on init
  loadDashboard();
}

/* ══════════════════════════════════════════════
   DASHBOARD — Stats
   ══════════════════════════════════════════════ */
async function loadDashboard() {
  const colIds = Object.values(COLLECTIONS);
  let total = 0;

  for (const col of colIds) {
    try {
      const snap = await db.collection(col).get();
      const count = snap.size;
      total += count;
      // Map collection to stat element
      const key = col.replace('ss_', '').toLowerCase();
      const el = document.getElementById(`stat-${key}`);
      if (el) el.textContent = count;
    } catch (e) {
      console.warn('Stats error for', col, e);
    }
  }

  const totalEl = document.getElementById('stat-total');
  if (totalEl) totalEl.textContent = total;

  // Users count
  try {
    const usersSnap = await db.collection('users').get();
    const usersEl = document.getElementById('stat-users');
    if (usersEl) usersEl.textContent = usersSnap.size;
  } catch (e) { }
}

/* ══════════════════════════════════════════════
   MANAGE POSTS
   ══════════════════════════════════════════════ */
async function loadManagePosts() {
  const filter = document.getElementById('manage-filter')?.value || 'all';
  const tbody = document.getElementById('posts-tbody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">Loading…</td></tr>';

  let cols = filter === 'all'
    ? Object.values(COLLECTIONS)
    : [filter];

  let allItems = [];

  for (const col of cols) {
    try {
      const snap = await db.collection(col).orderBy('postedAt', 'desc').get();
      const displayCol = col.replace('ss_', '');
      snap.docs.forEach(d => {
        allItems.push({ id: d.id, _col: col, _display: displayCol, ...d.data() });
      });
    } catch (e) { console.warn('Load error for', col, e); }
  }

  // Sort by posted date
  allItems.sort((a, b) => {
    const da = a.postedAt?.toDate?.() || new Date(0);
    const db2 = b.postedAt?.toDate?.() || new Date(0);
    return db2 - da;
  });

  if (!allItems.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">No posts found</td></tr>';
    return;
  }

  tbody.innerHTML = allItems.map(item => {
    const company = item.company || item.organizer || item.instructor || item.platform || '—';
    return `<tr>
      <td style="font-weight:600;color:var(--opp-text)">${item.title || 'Untitled'}</td>
      <td><span class="badge badge-${item._display}">${item._display}</span></td>
      <td>${company}</td>
      <td>${timeAgo(item.postedAt)}</td>
      <td>
        <div class="table-actions">
          <button class="opp-btn opp-btn-sm" style="background:var(--tint);border-color:var(--border);" onclick="editPost('${item.id}','${item._col}')">✏️ Edit</button>
          <button class="opp-btn opp-btn-danger opp-btn-sm" onclick="deletePost('${item._col}','${item.id}')">🗑 Delete</button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

/* ── Delete post ── */
window.deletePost = async function (col, id) {
  if (!confirm('Are you sure you want to delete this post?')) return;
  try {
    await db.collection(col).doc(id).delete();
    showToast('✅ Post deleted');
    loadManagePosts();
  } catch (err) {
    showToast('❌ Delete failed: ' + err.message, 'error');
  }
};

/* ── Manage Premium Projects ── */
window.loadManagePremiumProjects = async function () {
  const tbody = document.getElementById('premium-projects-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">Loading premium projects...</td></tr>';

  try {
    const snap = await db.collection(COLLECTIONS.PREMIUM_PROJECTS).orderBy('postedAt', 'desc').get();
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">No premium projects found.</td></tr>';
      return;
    }
    tbody.innerHTML = snap.docs.map(doc => {
      const data = doc.data();
      return `<tr>
        <td style="font-weight:600;color:var(--opp-text)">${data.title || 'Untitled'}</td>
        <td><a href="${data.demo_link || '#'}" target="_blank" style="color:var(--opp-primary)">View Demo</a></td>
        <td><a href="${data.github_link || '#'}" target="_blank" style="color:var(--opp-primary)">GitHub</a></td>
        <td>${data.postedBy || 'Admin'}</td>
        <td>
          <div class="table-actions">
            <button class="opp-btn opp-btn-danger opp-btn-sm" onclick="deletePremiumProject('${doc.id}')">🗑 Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-danger)">Error loading projects</td></tr>';
  }
};

window.deletePremiumProject = async function (id) {
  if (!confirm('Are you sure you want to delete this premium project?')) return;
  try {
    await db.collection(COLLECTIONS.PREMIUM_PROJECTS).doc(id).delete();
    showToast('✅ Premium project deleted');
    loadManagePremiumProjects();
  } catch (err) {
    showToast('❌ Delete failed: ' + err.message, 'error');
  }
};


/* ── Edit post ── */
window.editPost = async function (id, col) {
  try {
    const snap = await db.collection(col).doc(id).get();
    if (!snap.exists) return showToast('Post not found', 'error');
    openEditModal(id, col, snap.data());
  } catch (e) {
    showToast('Error loading post: ' + e.message, 'error');
  }
};

window.closeEditModal = function () {
  const modal = document.getElementById('edit-modal');
  if (modal) modal.classList.remove('active');
};

function openEditModal(id, col, data) {
  const modal = document.getElementById('edit-modal');
  const body = document.getElementById('edit-modal-body');
  if (!modal || !body) return;

  const fields = getFieldsForCollection(col);
  body.innerHTML = `
    <form id="edit-form">
      <div class="form-grid">
        ${fields.map(f => `
          <div class="form-group ${f.full ? 'full' : ''}">
            <label class="form-label">${f.label}</label>
            ${f.type === 'textarea'
      ? `<textarea name="${f.name}" class="form-textarea" ${f.required ? 'required' : ''}>${data[f.name] || ''}</textarea>`
      : f.type === 'select'
        ? `<select name="${f.name}" class="form-select">${f.options.map(o =>
          `<option value="${o}" ${data[f.name] === o ? 'selected' : ''}>${o}</option>`).join('')}</select>`
        : `<input type="${f.type || 'text'}" name="${f.name}" class="form-input" value="${data[f.name] || ''}" ${f.required ? 'required' : ''}>`
    }
          </div>`).join('')}
      </div>
      <div style="display:flex;gap:12px;margin-top:24px">
        <button type="submit" class="opp-btn opp-btn-primary">Save Changes</button>
        <button type="button" class="opp-btn opp-btn-secondary" onclick="closeEditModal()">Cancel</button>
      </div>
    </form>`;

  modal.classList.add('active');
  document.getElementById('edit-form').addEventListener('submit', async e => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Saving…'; btn.disabled = true;
    try {
      const updates = {};
      fields.forEach(f => {
        const el = form.querySelector(`[name="${f.name}"]`);
        if (el) updates[f.name] = el.value.trim();
      });
      await db.collection(col).doc(id).update(updates);
      showToast('Post updated!', 'success');
      closeEditModal();
      loadManagePosts();
    } catch (err) {
      showToast('Update failed: ' + err.message, 'error');
    } finally {
      btn.textContent = 'Save Changes'; btn.disabled = false;
    }
  });
}

function getFieldsForCollection(col) {
  const common = [
    { name: 'title', label: 'Title', required: true },
    { name: 'description', label: 'Description', type: 'textarea', full: true },
    { name: 'imagePath', label: 'Image URL', full: true },
    { name: 'applyLink', label: 'Apply / Registration Link', full: true }
  ];
  switch (col) {
    case COLLECTIONS.JOBS:
    case COLLECTIONS.INTERNSHIPS:
      return [...common,
      { name: 'company', label: 'Company' }, { name: 'location', label: 'Location' },
      { name: 'experienceLevel', label: 'Experience Level', type: 'select', options: ['', 'Entry Level', 'Junior', 'Mid Level', 'Senior', 'Lead'] },
      { name: 'requirements', label: 'Requirements', type: 'textarea', full: true },
      { name: 'benefits', label: 'Benefits', type: 'textarea', full: true },
      ...(col === COLLECTIONS.INTERNSHIPS ? [{ name: 'duration', label: 'Duration' }] : [])];
    case COLLECTIONS.HACKATHONS:
      return [...common,
      { name: 'organizer', label: 'Organizer' },
      { name: 'mode', label: 'Mode', type: 'select', options: ['Online', 'Offline', 'Hybrid'] },
      { name: 'prizePool', label: 'Prize Pool' },
      { name: 'deadline', label: 'Deadline', type: 'date' }];
    case COLLECTIONS.TECH_EVENTS:
    case COLLECTIONS.SEMINARS:
      return [...common,
      { name: 'speaker', label: 'Speaker' }, { name: 'venue', label: 'Venue' },
      { name: 'eventDate', label: 'Event Date', type: 'date' }];
    case COLLECTIONS.COURSES:
      return [
        { name: 'title', label: 'Course Title', required: true },
        { name: 'instructor', label: 'Instructor' }, { name: 'platform', label: 'Platform' },
        { name: 'level', label: 'Level', type: 'select', options: ['', 'Beginner', 'Intermediate', 'Advanced', 'All Levels'] },
        { name: 'duration', label: 'Duration' }, { name: 'price', label: 'Price' },
        { name: 'description', label: 'Description', type: 'textarea', full: true },
        { name: 'imagePath', label: 'Image URL', full: true },
        { name: 'applyLink', label: 'Enroll Link', full: true, required: true }
      ];
    case COLLECTIONS.ADS:
      return [
        { name: 'title', label: 'Ad Title', required: true },
        { name: 'imagePath', label: 'Image URL', full: true },
        { name: 'redirectLink', label: 'Redirect Link', full: true, required: true },
        { name: 'placement', label: 'Placement', type: 'select', options: ['top', 'betweenCards', 'popup'] }
      ];
    default: return common;
  }
}


/* ══════════════════════════════════════════════
   USERS
   ══════════════════════════════════════════════ */
let allUsers = [];

async function loadUsers() {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">Loading…</td></tr>';

  try {
    const snap = await db.collection('users').get();
    allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Stats
    const totalEl = document.getElementById('users-total');
    const adminsEl = document.getElementById('users-admins');
    const clicksEl = document.getElementById('users-clicks');

    if (totalEl) totalEl.textContent = allUsers.length;
    if (adminsEl) adminsEl.textContent = allUsers.filter(u => ['superadmin', 'team'].includes(u.role)).length;
    if (clicksEl) clicksEl.textContent = allUsers.reduce((s, u) => s + (u.apply_clicks || 0), 0);

    renderUsersTable(allUsers);
  } catch (err) {
    console.error('Users load error:', err);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">Failed to load users</td></tr>';
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;

  if (!users.length) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--opp-text3)">No users found</td></tr>';
    return;
  }

  const currentAdmin = Auth.getProfile() || {};
  const isSuperadmin = currentAdmin.role === 'superadmin';

  tbody.innerHTML = users.map(u => {
    const joined = u.created_at ? timeAgo(u.created_at) : '—';
    const isSuper = u.role === 'superadmin';
    const sel = r => u.role === r ? 'selected' : '';

    let roleSelect;
    if (isSuperadmin) {
      roleSelect = `<select class="form-select" style="min-width:120px;padding:4px 8px;font-size:0.8rem;border-color:var(--border); ${isSuper ? 'font-weight:700;color:var(--opp-primary)' : ''}" onchange="updateUserRole('${u.id}', this.value)">
        <option value="user" ${sel('user')}>User</option>
        <option value="company" ${sel('company')}>Company</option>
        <option value="institute_admin" ${sel('institute_admin')}>Institute Admin</option>
        <option value="team" ${sel('team')}>Team Member</option>
        <option value="superadmin" ${sel('superadmin')}>Superadmin</option>
      </select>`;
    } else {
      roleSelect = isSuper ? `<span style="color:var(--opp-primary);font-weight:700">${u.role}</span>` : `<span style="font-weight:600">${u.role || 'user'}</span>`;
    }

    return `<tr>
      <td style="font-weight:600;color:var(--opp-text)">${u.name || '—'}${SS.getRoleBadge(u.role)}</td>
      <td>${u.email || '—'}</td>
      <td>${roleSelect}</td>
      <td>${u.apply_clicks || 0}</td>
      <td>${joined}</td>
      <td>
        <button class="opp-btn opp-btn-sm" style="background:var(--tint);border-color:var(--border);color:var(--opp-text)" onclick="viewUserActivity('${u.id}')">👁️ View</button>
      </td>
    </tr>`;
  }).join('');
}

window.updateUserRole = async function (userId, newRole) {
  if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
    loadUsers(); // Reset select
    return;
  }
  try {
    await DB.updateDoc(`users/${userId}`, { role: newRole });
    showToast('Role updated successfully');
    loadUsers();
  } catch (e) {
    showToast('Error updating role: ' + e.message, 'error');
  }
};

window.viewUserActivity = function (userId) {
  const user = allUsers.find(u => u.id === userId);
  if (!user) return;
  const body = document.getElementById('edit-modal-body');
  document.querySelector('.modal-title').innerHTML = `👁️ User Activity: ${user.name || user.email}`;

  body.innerHTML = `
    <div style="font-size:0.9rem; line-height:1.6; color:var(--opp-text2)">
      <p><strong>Name:</strong> ${user.name || 'N/A'}</p>
      <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
      <p><strong>Role:</strong> ${user.role || 'user'}</p>
      <p><strong>Joined:</strong> ${user.created_at ? new Date(user.created_at.toDate ? user.created_at.toDate() : user.created_at).toLocaleString() : 'Unknown'}</p>
      <hr style="border:0;border-top:1px solid var(--border);margin:16px 0">
      <p><strong>Resources Read:</strong> ${user.books_read || 0}</p>
      <p><strong>Projects Built:</strong> ${user.projects_done || 0}</p>
      <p><strong>Opportunity Apply Clicks:</strong> ${user.apply_clicks || 0}</p>
      <hr style="border:0;border-top:1px solid var(--border);margin:16px 0">
      <p><em>Note: Real-time event tracking logs will be integrated here in future updates.</em></p>
    </div>
  `;
  document.getElementById('edit-modal').classList.add('visible');
};

function filterUsersTable() {
  const q = (document.getElementById('users-search')?.value || '').toLowerCase().trim();
  if (!q) return renderUsersTable(allUsers);
  const filtered = allUsers.filter(u =>
    `${u.name} ${u.email} ${u.role}`.toLowerCase().includes(q)
  );
  renderUsersTable(filtered);
}

/* ══════════════════════════════════════════════
   INSTITUTES (Partners)
   ══════════════════════════════════════════════ */
let allInstitutes = [];

async function loadInstitutes() {
  const tbody = document.getElementById('institutes-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">Loading partners…</td></tr>';

  try {
    const snap = await db.collection('users').where('role', '==', 'institute_admin').get();
    allInstitutes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderInstitutesTable(allInstitutes);
  } catch (err) {
    console.error('Institutes load error:', err);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">Failed to load partners</td></tr>';
  }
}

function renderInstitutesTable(items) {
  const tbody = document.getElementById('institutes-tbody');
  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">No partner institutes found</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(u => {
    const joined = u.created_at ? timeAgo(u.created_at) : '—';
    const isVerified = u.is_verified === true;
    return `<tr>
      <td>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:6px;background:var(--opp-bg);display:flex;align-items:center;justify-content:center;overflow:hidden">
            ${u.avatar_url ? `<img src="${u.avatar_url}" style="width:100%;height:100%;object-fit:cover">` : SS.getInitials(u.name)}
          </div>
          <div style="font-weight:600;color:var(--opp-text)">${u.name || '—'}${SS.getRoleBadge(u.role)}${isVerified ? ' <span class="verified-tick" title="Verified">✓</span>' : ''}</div>
        </div>
      </td>
      <td>${u.email || '—'}</td>
      <td>
        <span class="status-tag ${isVerified ? 'st-approved' : 'st-pending'}">
          ${isVerified ? 'Verified Partner' : 'Not Verified'}
        </span>
      </td>
      <td>${joined}</td>
      <td>
        <div class="table-actions">
          <button class="opp-btn opp-btn-sm ${isVerified ? 'opp-btn-secondary' : 'opp-btn-primary'}" onclick="verifyInstitute('${u.id}', ${!isVerified})">
            ${isVerified ? 'Remove Verification' : '✅ Verify Institute'}
          </button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

window.verifyInstitute = async function(uid, status) {
  if (!confirm(`Are you sure you want to ${status ? 'verify' : 'unverify'} this institute?`)) return;
  try {
    const updates = { is_verified: status };
    if (!status) updates.verification_status = null; // Reset status so banner shows again

    await db.collection('users').doc(uid).update(updates);
    showToast(`Institute ${status ? 'verified' : 'unverified'} successfully!`);
    loadInstitutes();
  } catch (e) {
    showToast('Error updating status: ' + e.message, 'error');
  }
};

/* ══════════════════════════════════════════════
   VERIFICATION REQUESTS
   ══════════════════════════════════════════════ */
let allVerifRequests = [];

async function loadVerificationRequests() {
  const tbody = document.getElementById('verification-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">Loading requests…</td></tr>';

  try {
    const snap = await db.collection('verification_requests').orderBy('submitted_at', 'desc').get();
    allVerifRequests = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderVerificationTable(allVerifRequests);
  } catch (err) {
    console.error('Verification load error:', err);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">Failed to load requests</td></tr>';
  }
}

function renderVerificationTable(items) {
  const tbody = document.getElementById('verification-tbody');
  if (!tbody) return;
  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">No pending requests</td></tr>';
    return;
  }
  tbody.innerHTML = items.map(r => {
    const statusClass = r.status === 'verified' ? 'st-approved' : r.status === 'rejected' ? 'st-rejected' : 'st-pending';
    return `<tr>
      <td style="font-weight:600;color:var(--opp-text)">${r.company_name || '—'}</td>
      <td>${r.email || '—'}</td>
      <td><span class="status-tag ${statusClass}">${r.status || 'pending'}</span></td>
      <td>${timeAgo(r.submitted_at)}</td>
      <td>
        <div class="table-actions">
          <button class="opp-btn opp-btn-secondary opp-btn-sm" onclick="viewVerificationDetail('${r.id}')">👁️ Details</button>
          ${r.status === 'pending' ? `
            <button class="opp-btn opp-btn-primary opp-btn-sm" style="background:#0d9488;border-color:#0d9488;" onclick="approveVerification('${r.uid}')">✅ Verify</button>
            <button class="opp-btn opp-btn-danger opp-btn-sm" onclick="rejectVerification('${r.uid}')">❌ Reject</button>
          ` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
}

window.viewVerificationDetail = function(id) {
  const r = allVerifRequests.find(req => req.id === id);
  if (!r) return;
  const body = document.getElementById('verify-detail-body');
  body.innerHTML = `
    <div style="font-size:0.95rem; line-height:1.6; color:var(--opp-text2)">
      <p><strong>Institute Name:</strong> ${r.company_name}</p>
      <p><strong>Official Email:</strong> ${r.email}</p>
      <p><strong>Website:</strong> <a href="${r.website}" target="_blank" style="color:var(--opp-primary)">${r.website} ↗</a></p>
      <hr style="border:0;border-top:1px solid var(--opp-border);margin:16px 0">
      <div style="margin-bottom:16px">
        <strong style="color:var(--opp-text)">Institute Description:</strong><br/>
        <div style="margin-top:4px;white-space:pre-wrap;">${r.description || 'N/A'}</div>
      </div>
      <div style="margin-bottom:16px">
        <strong style="color:var(--opp-text)">Purpose of Partnering:</strong><br/>
        <div style="margin-top:4px;white-space:pre-wrap;">${r.purpose || 'N/A'}</div>
      </div>
      <hr style="border:0;border-top:1px solid var(--opp-border);margin:16px 0">
      <p style="font-size:0.8rem;color:var(--opp-text3)">Submitted on: ${new Date(r.submitted_at?.toDate?.() || Date.now()).toLocaleString()}</p>
    </div>
  `;
  document.getElementById('verify-detail-modal').classList.add('active');
};

window.approveVerification = async function(uid) {
  if (!confirm('Approve this institute and grant verified status?')) return;
  try {
    const r = allVerifRequests.find(req => req.uid === uid);
    
    // 1. Update user profile
    await db.collection('users').doc(uid).update({
      is_verified: true,
      verification_status: 'verified',
      // Update company info with verified details
      name: r.company_name,
      description: r.description,
      domain: r.website
    });

    // 2. Update request status
    await db.collection('verification_requests').doc(uid).update({
      status: 'verified'
    });

    // 3. Notify user
    await DB.sendNotificationToUser(uid, {
      title: '✅ Institute Verified!',
      message: 'Congratulations! Your institute has been verified by Syntax Syndicate. The verified tick is now visible on your profile.',
      link: 'dashboard-company.html',
      sent_by: firebase.auth().currentUser.uid
    });

    showToast('Institute verified and profile updated!');
    loadVerificationRequests();
  } catch (err) {
    showToast('Approval error: ' + err.message, 'error');
  }
};

window.rejectVerification = async function(uid) {
  if (!confirm('Reject this verification application?')) return;
  try {
    await db.collection('users').doc(uid).update({
      verification_status: 'rejected'
    });
    await db.collection('verification_requests').doc(uid).update({
      status: 'rejected'
    });
    showToast('Verification rejected');
    loadVerificationRequests();
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
};

/* ══════════════════════════════════════════════
   APPROVAL QUEUE
   ══════════════════════════════════════════════ */
async function loadApprovals() {
  const tbody = document.getElementById('approvals-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">Loading approvals...</td></tr>';

  try {
    const snap = await db.collection('pending_content').where('status', '==', 'pending').get();

    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">No pending content in the queue.</td></tr>';
      return;
    }

    // Sort manually to avoid requiring an index
    let docs = snap.docs;
    docs.sort((a, b) => {
      const da = a.data().created_at?.toDate?.() || new Date(0);
      const dbDate = b.data().created_at?.toDate?.() || new Date(0);
      return dbDate - da;
    });

    tbody.innerHTML = docs.map(doc => {
      const data = doc.data();
      const publisherName = data.company_name || data.company || data.poster_name || 'Unknown User';
      return `<tr>
        <td style="font-weight:600;color:var(--opp-text)">${data.title || 'Untitled'}</td>
        <td><span class="badge badge-accent" style="background:#e8f0fe;color:#1a73e8;border:1px solid #c2d7fa;">${data.type || 'Unknown'}</span></td>
        <td>${publisherName}</td>
        <td>${timeAgo(data.created_at)}</td>
        <td>
          <div class="table-actions">
            <button class="opp-btn opp-btn-secondary opp-btn-sm" onclick="previewApproval('${doc.id}')">🔍 Preview</button>
            <button class="opp-btn opp-btn-primary opp-btn-sm" style="background:#0d9488;border-color:#0d9488;" onclick="approveContent('${doc.id}')">✅ Approve</button>
            <button class="opp-btn opp-btn-danger opp-btn-sm" onclick="rejectContent('${doc.id}')">❌ Reject</button>
          </div>
        </td>
      </tr>`;
    }).join('');
  } catch (err) {
    console.error('Approvals load error:', err);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--opp-danger)">Failed to load queue: ' + err.message + '</td></tr>';
  }
}

window.approveContent = async function (id) {
  if (!confirm('Approve and publish this content directly to the platform?')) return;

  try {
    const docRef = db.collection('pending_content').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) throw new Error("Document not found");
    const docData = snap.data();

    // Check if it's a resource with a designated target_collection (Roadmaps, Cheatsheets, etc.)
    if (docData.target_collection && ['roadmaps', 'cheatsheets', 'pdfs', 'premium_projects'].includes(docData.target_collection)) {
      // If docData.data exists, use it; otherwise use the root fields (excluding metadata)
      let resourceData = docData.data ? Object.assign({}, docData.data) : Object.assign({}, docData);
      
      // Clean up metadata before moving to production collection
      delete resourceData.status;
      delete resourceData.target_collection;
      delete resourceData.source_collection;
      delete resourceData._collection;
      delete resourceData.original_id;
      
      resourceData.posted_by = docData.posted_by || '';
      resourceData.poster_name = docData.company || docData.company_name || docData.poster_name || 'Verified Partner';
      resourceData.poster_type = (docData.company || docData.company_name) ? 'company' : 'user';
      resourceData.created_at = firebase.firestore.FieldValue.serverTimestamp();

      const targetCol = docData.target_collection;
      const originalId = docData.original_id;
      let newId = null;

      if (originalId) {
        // Targeted update of existing live content
        const sourceCol = docData.source_collection;
        if (sourceCol && sourceCol !== targetCol) {
          await db.collection(sourceCol).doc(originalId).delete().catch(e => console.warn('Old item delete fail', e));
        }
        await db.collection(targetCol).doc(originalId).set(resourceData, { merge: true });
        newId = originalId;
      } else {
        // Create new live content
        const newDocRef = await db.collection(targetCol).add(resourceData);
        newId = newDocRef.id;
      }

      // Send notification to the user
      if (docData.posted_by) {
        try {
          const page = targetCol === 'roadmaps' ? 'archives/roadmap-viewer.html' : 'archives/cheatsheet-viewer.html';
          await DB.sendNotificationToUser(docData.posted_by, {
            title: '✅ Contribution Approved!',
            message: `Thank you! Your resource "${resourceData.title || 'Untitled'}" has been updated and is live.`,
            link: `${page}?id=${newId}`,
            sent_by: firebase.auth().currentUser.uid
          });
        } catch (ne) { console.warn('Failed to notify user', ne); }
      }
    } else {
      // Opportunity Mapping (Jobs, Internships, Hackathons)
      const TYPE_TO_COL = {
        'job': COLLECTIONS.JOBS,
        'internship': COLLECTIONS.INTERNSHIPS,
        'hackathon': COLLECTIONS.HACKATHONS,
        'techEvent': COLLECTIONS.TECH_EVENTS,
        'seminar': COLLECTIONS.SEMINARS,
        'course': COLLECTIONS.COURSES
      };

      const targetCol = docData.target_collection || TYPE_TO_COL[docData.type];
      const originalId = docData.original_id;

      if (targetCol) {
        const oppData = {
          title: docData.title || 'Untitled Opportunity',
          company: docData.company || docData.company_name || 'Verified Partner',
          location: docData.location || 'Remote / Hybrid',
          description: docData.description || '',
          applyLink: docData.applyLink || docData.link || '',
          imagePath: docData.imagePath || docData.image_url || docData.image || '',
          deadline: docData.deadline || '',
          postedAt: firebase.firestore.FieldValue.serverTimestamp(),
          posted_by: docData.posted_by || 'institute',
          created_at: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (originalId) {
          const sourceCol = docData.source_collection;
          if (sourceCol && sourceCol !== targetCol) {
            await db.collection(sourceCol).doc(originalId).delete().catch(e => console.warn('Old item delete fail', e));
          }
          await db.collection(targetCol).doc(originalId).set(oppData, { merge: true });
        } else {
          await db.collection(targetCol).add(oppData);
        }

        if (docData.posted_by) {
          try {
            await DB.sendNotificationToUser(docData.posted_by, {
              title: '✅ Opportunity Approved!',
              message: `Your opportunity "${oppData.title}" has been updated.`,
              link: `opportunities/browse.html`,
              sent_by: firebase.auth().currentUser.uid
            });
          } catch (ne) { console.warn('Failed to notify user', ne); }
        }
      }
    }

    // Delete from pending queue after successful move to production
    await docRef.delete();
    showToast('✅ Content approved and published!');
    loadApprovals();
  } catch (err) {
    showToast('❌ Failed to approve: ' + err.message, 'error');
  }
};

window.rejectContent = async function (id) {
  if (!confirm('Reject this content? The institute can still see it was rejected.')) return;
  try {
    await db.collection('pending_content').doc(id).update({ status: 'rejected' });
    showToast('✅ Content rejected');
    loadApprovals();
  } catch (err) {
    showToast('❌ Failed to reject: ' + err.message, 'error');
  }
};

window.previewApproval = async function (id) {
  try {
    const docRef = db.collection('pending_content').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) return alert('Document not found');
    const docData = snap.data();

    console.log('🔍 Previewing:', { id, type: docData.type });

    // For Roadmaps and Cheatsheets
    if (docData.type && docData.type.toLowerCase() === 'roadmap') {
      window.open(`resources/roadmap.html?id=${id}&col=pending_content`, '_blank');
      return;
    }
    if (docData.type && docData.type.toLowerCase() === 'cheatsheet') {
      window.open(`resources/cheatsheet.html?id=${id}&col=pending_content`, '_blank');
      return;
    }

    // For Opportunities (Jobs, Internships, etc.)
    const oppTypes = ['job', 'internship', 'hackathon', 'techevent', 'seminar', 'course'];
    if (docData.type && oppTypes.includes(docData.type.toLowerCase())) {
      const url = `opportunities/details.html?id=${id}&col=pending_content`;
      console.log('Opening Preview:', url);
      window.open(url, '_blank');
      return;
    }

    console.warn('Unknown type for full-page preview, falling back to modal:', docData.type);

    const body = document.getElementById('edit-modal-body');
    document.querySelector('.modal-title').innerHTML = `🔍 Preview: ${docData.title || 'Untitled'}`;

    let contentHtml = '';

    // Check if it's a library resource (PDF, etc)
    if (docData.target_collection && docData.data) {
      const data = docData.data;
      contentHtml = `
        <div style="font-size:0.9rem; line-height:1.6; color:var(--opp-text2)">
          <p><strong>Content Type:</strong> ${docData.target_collection.toUpperCase()}</p>
          <p><strong>Category:</strong> ${data.type || 'Unknown'}</p>
          <p><strong>Status Access:</strong> ${data.access || 'Free'}</p>
          <p><strong>Domain:</strong> ${data.domain || 'General'}</p>
          <p><strong>Posted By:</strong> ${(docData.company_name && docData.company_name !== 'Community User') ? docData.company_name : docData.poster_name}</p>
          ${data.url ? `<p style="margin-top:8px;"><strong>Link:</strong> <br/><a href="${data.url}" target="_blank" style="color:var(--opp-primary);word-break:break-all;">${data.url} ↗</a></p>` : ''}
          ${data.file_path ? `<p style="margin-top:8px;"><strong>File Path (/Backend):</strong> <br/>${data.file_path}</p>` : ''}
          <div style="margin-top:16px;background:var(--tint);padding:14px;border-radius:8px;border:1px solid var(--border)">
            <strong style="color:var(--opp-text)">Description:</strong><br/>
            <div style="margin-top:4px;white-space:pre-wrap;">${data.description || 'No description provided.'}</div>
          </div>
        </div>
      `;
    } else {
      // It's an Opportunity
      contentHtml = `
        <div style="font-size:0.9rem; line-height:1.6; color:var(--opp-text2)">
          <p><strong>Type:</strong> ${docData.type || 'Unknown'}</p>
          <p><strong>Company/Institute:</strong> ${docData.company_name || 'N/A'}</p>
          <p><strong>Posted By ID:</strong> ${docData.posted_by || 'Unknown'}</p>
          ${docData.location ? `<p><strong>Location:</strong> ${docData.location}</p>` : ''}
          ${docData.deadline ? `<p><strong>Deadline:</strong> ${docData.deadline}</p>` : ''}
          ${docData.link || docData.applyLink ? `<p style="margin-top:8px;"><strong>Apply Link:</strong> <br/><a href="${docData.link || docData.applyLink}" target="_blank" style="color:var(--opp-primary);word-break:break-all;">${docData.link || docData.applyLink} ↗</a></p>` : ''}
          <div style="margin-top:16px;background:var(--tint);padding:14px;border-radius:8px;border:1px solid var(--border)">
            <strong style="color:var(--opp-text)">Description / Details:</strong><br/>
            <div style="margin-top:4px;white-space:pre-wrap;">${docData.description || 'No description provided.'}</div>
          </div>
        </div>
      `;
    }

    contentHtml += `
      <div style="margin-top:24px;display:flex;gap:12px;justify-content:flex-end;">
        <button class="opp-btn opp-btn-secondary" onclick="closeEditModal()">Close Preview</button>
        <button class="opp-btn opp-btn-primary" style="background:#0d9488;border-color:#0d9488;" onclick="closeEditModal(); approveContent('${id}')">✅ Approve Now</button>
      </div>
    `;

    body.innerHTML = contentHtml;

    const modal = document.getElementById('edit-modal');
    modal.classList.add('visible');
    modal.classList.add('active');

  } catch (e) {
    showToast('Error loading preview: ' + e.message, 'error');
  }
};


/* ══════════════════════════════════════════════
   ROADMAP CMS — Step Builder
   ══════════════════════════════════════════════ */
let rmStepCounter = 0;

window.addRoadmapStep = function () {
  rmStepCounter++;
  const idx = rmStepCounter;
  const container = document.getElementById('rm-steps-container');
  const stepDiv = document.createElement('div');
  stepDiv.className = 'form-card';
  stepDiv.id = `rm-step-${idx}`;
  stepDiv.style.cssText = 'border:2px solid var(--opp-primary-light);background:var(--opp-bg);padding:20px;border-radius:14px;';
  stepDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:14px;font-weight:700;color:var(--opp-primary)">Step ${container.children.length + 1}</h3>
      <div style="display:flex;gap:6px">
        <button type="button" class="opp-btn opp-btn-sm" onclick="moveRoadmapStep(${idx},-1)" title="Move up">↑</button>
        <button type="button" class="opp-btn opp-btn-sm" onclick="moveRoadmapStep(${idx},1)" title="Move down">↓</button>
        <button type="button" class="opp-btn opp-btn-danger opp-btn-sm" onclick="removeRoadmapStep(${idx})">✕ Remove</button>
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group"><label class="form-label">Step Title *</label><input type="text" class="form-input rm-step-title" required placeholder="e.g. Learn HTML & CSS"></div>
      <div class="form-group"><label class="form-label">Est. Hours</label><input type="number" class="form-input rm-step-hours" placeholder="e.g. 20"></div>
      <div class="form-group full"><label class="form-label">Description</label><textarea class="form-textarea rm-step-desc" rows="3" placeholder="What the learner should do in this step..."></textarea></div>
      <div class="form-group full"><label class="form-label">Pro Tips</label><textarea class="form-textarea rm-step-tips" rows="2" placeholder="Pro tips for this step..."></textarea></div>
    </div>

    <div style="margin-top:14px">
      <label class="form-label" style="margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">🎬 Video URLs <button type="button" class="opp-btn opp-btn-sm" onclick="addVideoInput(${idx})">+ Add Video</button></label>
      <div class="rm-videos-list" id="rm-videos-${idx}" style="display:flex;flex-direction:column;gap:6px"></div>
    </div>

    <div style="margin-top:14px">
      <label class="form-label" style="margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">🔗 Resource Links <button type="button" class="opp-btn opp-btn-sm" onclick="addResourceInput(${idx})">+ Add Link</button></label>
      <div class="rm-resources-list" id="rm-resources-${idx}" style="display:flex;flex-direction:column;gap:8px"></div>
    </div>
  `;
  container.appendChild(stepDiv);
  renumberSteps();
};

window.removeRoadmapStep = function (idx) {
  document.getElementById(`rm-step-${idx}`)?.remove();
  renumberSteps();
};

window.moveRoadmapStep = function (idx, dir) {
  const el = document.getElementById(`rm-step-${idx}`);
  if (!el) return;
  const container = el.parentElement;
  if (dir === -1 && el.previousElementSibling) container.insertBefore(el, el.previousElementSibling);
  if (dir === 1 && el.nextElementSibling) container.insertBefore(el.nextElementSibling, el);
  renumberSteps();
};

function renumberSteps() {
  document.querySelectorAll('#rm-steps-container > div').forEach((el, i) => {
    const h = el.querySelector('h3');
    if (h) h.textContent = `Step ${i + 1}`;
  });
}

window.addVideoInput = function (stepIdx) {
  const list = document.getElementById(`rm-videos-${stepIdx}`);
  if (!list) return;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;align-items:center';
  row.innerHTML = `<input type="url" class="form-input rm-video-url" placeholder="https://youtube.com/watch?v=..." style="flex:1"><button type="button" class="opp-btn opp-btn-danger opp-btn-sm" onclick="this.parentElement.remove()">✕</button>`;
  list.appendChild(row);
};

window.addResourceInput = function (stepIdx) {
  const list = document.getElementById(`rm-resources-${stepIdx}`);
  if (!list) return;
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;gap:6px;align-items:center;flex-wrap:wrap';
  row.innerHTML = `
    <input type="text" class="form-input rm-res-title" placeholder="Resource title" style="flex:2;min-width:140px">
    <input type="url" class="form-input rm-res-url" placeholder="https://..." style="flex:3;min-width:180px">
    <select class="form-select rm-res-type" style="flex:1;min-width:100px"><option value="article">Article</option><option value="course">Course</option><option value="docs">Docs</option><option value="tool">Tool</option></select>
    <button type="button" class="opp-btn opp-btn-danger opp-btn-sm" onclick="this.parentElement.remove()">✕</button>`;
  list.appendChild(row);
};

function collectRoadmapData() {
  const title = document.getElementById('rm-title')?.value?.trim();
  if (!title) { showToast('Roadmap title is required', 'error'); return null; }

  const steps = [];
  document.querySelectorAll('#rm-steps-container > div').forEach((stepEl, i) => {
    const sTitle = stepEl.querySelector('.rm-step-title')?.value?.trim() || `Step ${i + 1}`;
    const sDesc = stepEl.querySelector('.rm-step-desc')?.value?.trim() || '';
    const sTips = stepEl.querySelector('.rm-step-tips')?.value?.trim() || '';
    const sHours = parseInt(stepEl.querySelector('.rm-step-hours')?.value) || 0;

    const videoUrls = [];
    stepEl.querySelectorAll('.rm-video-url').forEach(inp => {
      if (inp.value.trim()) videoUrls.push(inp.value.trim());
    });

    const resourceLinks = [];
    const resRows = stepEl.querySelectorAll('.rm-resources-list > div');
    resRows.forEach(row => {
      const rTitle = row.querySelector('.rm-res-title')?.value?.trim() || '';
      const rUrl = row.querySelector('.rm-res-url')?.value?.trim() || '';
      const rType = row.querySelector('.rm-res-type')?.value || 'article';
      if (rUrl) resourceLinks.push({ title: rTitle || rUrl, url: rUrl, type: rType });
    });

    steps.push({
      order: i + 1,
      title: sTitle,
      description: sDesc,
      tips: sTips,
      estimated_hours: sHours,
      video_urls: videoUrls,
      resource_links: resourceLinks
    });
  });

  const user = firebase.auth().currentUser;
  return {
    title,
    domain: document.getElementById('rm-domain')?.value?.trim() || '',
    role: document.getElementById('rm-role')?.value?.trim() || '',
    level: document.getElementById('rm-level')?.value || 'beginner',
    description: document.getElementById('rm-desc')?.value?.trim() || '',
    estimated_time: document.getElementById('rm-time')?.value?.trim() || '',
    icon: document.getElementById('rm-icon')?.value?.trim() || 'bi-map',
    tags: (document.getElementById('rm-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean),
    is_featured: document.getElementById('rm-featured')?.checked || false,
    steps,
    posted_by: editingOriginalOwner || user?.uid || '',
    poster_name: editingOriginalPosterName || 'Syntax Syndicate',
    poster_type: editingOriginalPosterType || 'admin'
  };
}

let editingRoadmapId = null;
let editingOriginalOwner = null;
let editingOriginalPosterName = null;
let editingOriginalPosterType = null;

window.publishRoadmap = async function () {
  const data = collectRoadmapData();
  if (!data) return;

  try {
    await DB.saveRoadmap(data, editingRoadmapId);
    showToast(editingRoadmapId ? '✅ Roadmap updated successfully!' : '✅ Roadmap published successfully!');
    clearRoadmapForm();
    // if editing, switch back to manage 
    if (editingRoadmapId) {
      document.querySelector('[data-section="manage-roadmaps"]').click();
    }
  } catch (err) {
    showToast('❌ Failed to publish: ' + err.message, 'error');
  }
};

window.clearRoadmapForm = function () {
  ['rm-title', 'rm-domain', 'rm-role', 'rm-desc', 'rm-time', 'rm-tags'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const icon = document.getElementById('rm-icon');
  if (icon) icon.value = '';
  const lvl = document.getElementById('rm-level');
  if (lvl) lvl.value = 'beginner';
  const feat = document.getElementById('rm-featured');
  if (feat) feat.checked = false;
  document.getElementById('rm-steps-container').innerHTML = '';
  rmStepCounter = 0;
  editingRoadmapId = null;
  editingOriginalOwner = null;
  editingOriginalPosterName = null;
  const btn = document.querySelector('button[onclick="publishRoadmap()"]');
  if (btn) btn.innerHTML = '✅ Publish Roadmap';
  document.querySelector('#section-add-roadmap h1').textContent = 'Add Roadmap 🗺️';
};

window.editRoadmapAdmin = async function (id) {
  try {
    const rm = await DB.fetchRoadmap(id);
    if (!rm) return showToast('Roadmap not found', 'error');

    editingRoadmapId = id;
    editingOriginalOwner = rm.posted_by || rm.postedBy || null;
    editingOriginalPosterName = rm.poster_name || rm.company || rm.company_name || null;
    editingOriginalPosterType = rm.poster_type || (rm.company || rm.company_name ? 'company' : 'admin');

    // Switch to add-roadmap section
    document.querySelector('[data-section="add-roadmap"]').click();
    document.querySelector('#section-add-roadmap h1').textContent = 'Edit Roadmap ✏️';
    document.querySelector('button[onclick="publishRoadmap()"]').innerHTML = '💾 Save Changes';

    // Populate simple fields
    document.getElementById('rm-title').value = rm.title || '';
    document.getElementById('rm-domain').value = rm.domain || '';
    document.getElementById('rm-role').value = rm.role || '';
    document.getElementById('rm-level').value = rm.level || 'beginner';
    document.getElementById('rm-desc').value = rm.description || '';
    document.getElementById('rm-time').value = rm.estimated_time || '';
    document.getElementById('rm-icon').value = rm.icon || rm.cover_emoji || 'bi-map';
    document.getElementById('rm-tags').value = (rm.tags || []).join(', ');
    document.getElementById('rm-featured').checked = !!rm.is_featured;

    // Clear existing steps
    document.getElementById('rm-steps-container').innerHTML = '';
    rmStepCounter = 0;

    // Populate steps
    const steps = rm.steps || [];
    steps.forEach(step => {
      window.addRoadmapStep();
      const stepEl = document.getElementById(`rm-step-${rmStepCounter}`);
      stepEl.querySelector('.rm-step-title').value = step.title || '';
      stepEl.querySelector('.rm-step-hours').value = step.estimated_hours || '';
      stepEl.querySelector('.rm-step-desc').value = step.description || '';
      stepEl.querySelector('.rm-step-tips').value = step.tips || '';

      const vUrls = step.video_urls || [];
      vUrls.filter(Boolean).forEach(v => {
        window.addVideoInput(rmStepCounter);
        const urlInputs = stepEl.querySelectorAll('.rm-video-url');
        urlInputs[urlInputs.length - 1].value = v;
      });

      const rLinks = step.resource_links || [];
      rLinks.forEach(rl => {
        window.addResourceInput(rmStepCounter);
        const rows = stepEl.querySelectorAll('.rm-resources-list > div');
        const lastRow = rows[rows.length - 1];
        lastRow.querySelector('.rm-res-title').value = rl.title || '';
        lastRow.querySelector('.rm-res-url').value = rl.url || '';
        lastRow.querySelector('.rm-res-type').value = rl.type || 'article';
      });
    });

  } catch (e) {
    showToast('Failed to load roadmap: ' + e.message, 'error');
  }
};


/* ══════════════════════════════════════════════
   CHEATSHEET CMS — Section Builder
   ══════════════════════════════════════════════ */
let csSecCounter = 0;

window.addCheatsheetSection = function () {
  csSecCounter++;
  const idx = csSecCounter;
  const container = document.getElementById('cs-sections-container');
  const secDiv = document.createElement('div');
  secDiv.className = 'form-card';
  secDiv.id = `cs-sec-${idx}`;
  secDiv.style.cssText = 'border:2px solid rgba(40,200,64,.25);background:var(--opp-bg);padding:20px;border-radius:14px;';
  secDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:14px;font-weight:700;color:#1e7a42">Section ${container.children.length + 1}</h3>
      <div style="display:flex;gap:6px">
        <button type="button" class="opp-btn opp-btn-sm" onclick="moveCSSection(${idx},-1)">↑</button>
        <button type="button" class="opp-btn opp-btn-sm" onclick="moveCSSection(${idx},1)">↓</button>
        <button type="button" class="opp-btn opp-btn-danger opp-btn-sm" onclick="removeCSSection(${idx})">✕ Remove</button>
      </div>
    </div>
    <div class="form-grid">
      <div class="form-group full"><label class="form-label">Section Heading *</label><input type="text" class="form-input cs-sec-heading" required placeholder="e.g. Data Types"></div>
      <div class="form-group full"><label class="form-label">Content</label><textarea class="form-textarea cs-sec-content" rows="4" placeholder="Explanation text..."></textarea></div>
      <div class="form-group full"><label class="form-label">Tips</label><textarea class="form-textarea cs-sec-tips" rows="2" placeholder="Helpful tips for this section..."></textarea></div>
    </div>

    <div style="margin-top:14px">
      <label class="form-label" style="margin-bottom:8px;display:flex;align-items:center;justify-content:space-between">💻 Code Snippets <button type="button" class="opp-btn opp-btn-sm" onclick="addSnippetInput(${idx})">+ Add Snippet</button></label>
      <div class="cs-snippets-list" id="cs-snippets-${idx}" style="display:flex;flex-direction:column;gap:10px"></div>
    </div>
  `;
  container.appendChild(secDiv);
  renumberCSSections();
};

window.removeCSSection = function (idx) {
  document.getElementById(`cs-sec-${idx}`)?.remove();
  renumberCSSections();
};

window.moveCSSection = function (idx, dir) {
  const el = document.getElementById(`cs-sec-${idx}`);
  if (!el) return;
  const container = el.parentElement;
  if (dir === -1 && el.previousElementSibling) container.insertBefore(el, el.previousElementSibling);
  if (dir === 1 && el.nextElementSibling) container.insertBefore(el.nextElementSibling, el);
  renumberCSSections();
};

function renumberCSSections() {
  document.querySelectorAll('#cs-sections-container > div').forEach((el, i) => {
    const h = el.querySelector('h3');
    if (h) h.textContent = `Section ${i + 1}`;
  });
}

window.addSnippetInput = function (secIdx) {
  const list = document.getElementById(`cs-snippets-${secIdx}`);
  if (!list) return;
  const row = document.createElement('div');
  row.style.cssText = 'border:1px solid var(--opp-border);border-radius:10px;padding:12px;background:var(--opp-white)';
  row.innerHTML = `
    <div style="display:flex;gap:6px;margin-bottom:8px;align-items:center">
      <select class="form-select cs-snip-lang" style="width:130px"><option value="javascript">JavaScript</option><option value="python">Python</option><option value="html">HTML</option><option value="css">CSS</option><option value="java">Java</option><option value="cpp">C++</option><option value="sql">SQL</option><option value="bash">Bash</option><option value="other">Other</option></select>
      <input type="text" class="form-input cs-snip-caption" placeholder="Caption (optional)" style="flex:1">
      <button type="button" class="opp-btn opp-btn-danger opp-btn-sm" onclick="this.closest('div[style]').remove()">✕</button>
    </div>
    <textarea class="form-textarea cs-snip-code" rows="5" placeholder="Paste code here..." style="font-family:var(--opp-font-mono,'monospace');font-size:12px;tab-size:2"></textarea>`;
  list.appendChild(row);
};

function collectCheatsheetData() {
  const title = document.getElementById('cs-title')?.value?.trim();
  if (!title) { showToast('Cheatsheet title is required', 'error'); return null; }

  const sections = [];
  document.querySelectorAll('#cs-sections-container > div').forEach((secEl, i) => {
    const heading = secEl.querySelector('.cs-sec-heading')?.value?.trim() || `Section ${i + 1}`;
    const content = secEl.querySelector('.cs-sec-content')?.value?.trim() || '';
    const tips = secEl.querySelector('.cs-sec-tips')?.value?.trim() || '';

    const snippets = [];
    secEl.querySelectorAll('.cs-snippets-list > div').forEach(snEl => {
      const lang = snEl.querySelector('.cs-snip-lang')?.value || 'other';
      const caption = snEl.querySelector('.cs-snip-caption')?.value?.trim() || '';
      const code = snEl.querySelector('.cs-snip-code')?.value || '';
      if (code.trim()) snippets.push({ language: lang, caption, code });
    });

    sections.push({ order: i + 1, heading, content, tips, code_snippets: snippets });
  });

  const user = firebase.auth().currentUser;
  return {
    title,
    domain: document.getElementById('cs-domain')?.value?.trim() || '',
    description: document.getElementById('cs-desc')?.value?.trim() || '',
    icon: document.getElementById('cs-icon')?.value?.trim() || 'bi-file-code',
    download_url: document.getElementById('cs-download')?.value?.trim() || '',
    tags: (document.getElementById('cs-tags')?.value || '').split(',').map(t => t.trim()).filter(Boolean),
    is_featured: document.getElementById('cs-featured')?.checked || false,
    sections,
    posted_by: editingOriginalOwnerCS || user?.uid || '',
    poster_name: editingOriginalPosterNameCS || 'Syntax Syndicate',
    poster_type: editingOriginalPosterTypeCS || 'admin'
  };
}

let editingCheatsheetId = null;
let editingOriginalOwnerCS = null;
let editingOriginalPosterNameCS = null;
let editingOriginalPosterTypeCS = null;

window.publishCheatsheet = async function () {
  const data = collectCheatsheetData();
  if (!data) return;

  try {
    await DB.saveCheatsheet(data, editingCheatsheetId);
    showToast(editingCheatsheetId ? '✅ Cheatsheet updated successfully!' : '✅ Cheatsheet published successfully!');
    clearCheatsheetForm();
    if (editingCheatsheetId) {
      document.querySelector('[data-section="manage-cheatsheets"]').click();
    }
  } catch (err) {
    showToast('❌ Failed to publish: ' + err.message, 'error');
  }
};

window.clearCheatsheetForm = function () {
  ['cs-title', 'cs-domain', 'cs-desc', 'cs-download', 'cs-tags'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const icon = document.getElementById('cs-icon');
  if (icon) icon.value = '';
  const feat = document.getElementById('cs-featured');
  if (feat) feat.checked = false;
  document.getElementById('cs-sections-container').innerHTML = '';
  csSecCounter = 0;
  editingCheatsheetId = null;
  editingOriginalOwnerCS = null;
  editingOriginalPosterNameCS = null;
  const btn = document.querySelector('button[onclick="publishCheatsheet()"]');
  if (btn) btn.innerHTML = '✅ Publish Cheatsheet';
  document.querySelector('#section-add-cheatsheet h1').textContent = 'Add Cheatsheet 📋';
};

window.editCheatsheetAdmin = async function (id) {
  try {
    const cs = await DB.fetchCheatsheet(id);
    if (!cs) return showToast('Cheatsheet not found', 'error');

    editingCheatsheetId = id;
    editingOriginalOwnerCS = cs.posted_by || cs.postedBy || null;
    editingOriginalPosterNameCS = cs.poster_name || cs.company || cs.company_name || null;
    editingOriginalPosterTypeCS = cs.poster_type || (cs.company || cs.company_name ? 'company' : 'admin');

    // Switch to add-cheatsheet section
    document.querySelector('[data-section="add-cheatsheet"]').click();
    document.querySelector('#section-add-cheatsheet h1').textContent = 'Edit Cheatsheet ✏️';
    document.querySelector('button[onclick="publishCheatsheet()"]').innerHTML = '💾 Save Changes';

    // Populate simple fields
    document.getElementById('cs-title').value = cs.title || '';
    document.getElementById('cs-domain').value = cs.domain || '';
    document.getElementById('cs-desc').value = cs.description || '';
    document.getElementById('cs-icon').value = cs.icon || cs.cover_emoji || 'bi-file-code';
    document.getElementById('cs-download').value = cs.download_url || '';
    document.getElementById('cs-tags').value = (cs.tags || []).join(', ');
    document.getElementById('cs-featured').checked = !!cs.is_featured;

    // Clear existing sections
    document.getElementById('cs-sections-container').innerHTML = '';
    csSecCounter = 0;

    // Populate sections
    const sections = cs.sections || [];
    sections.forEach(sec => {
      window.addCheatsheetSection();
      const secEl = document.getElementById(`cs-sec-${csSecCounter}`);
      secEl.querySelector('.cs-sec-heading').value = sec.heading || '';
      secEl.querySelector('.cs-sec-content').value = sec.content || '';
      secEl.querySelector('.cs-sec-tips').value = sec.tips || '';

      const snippets = sec.code_snippets || [];
      snippets.forEach(sn => {
        window.addSnippetInput(csSecCounter);
        const rows = secEl.querySelectorAll('.cs-snippets-list > div');
        const lastRow = rows[rows.length - 1];
        lastRow.querySelector('.cs-snip-lang').value = sn.language || 'other';
        lastRow.querySelector('.cs-snip-caption').value = sn.caption || '';
        lastRow.querySelector('.cs-snip-code').value = sn.code || '';
      });
    });

  } catch (e) {
    showToast('Failed to load cheatsheet: ' + e.message, 'error');
  }
};


/* ══════════════════════════════════════════════
   PDF LIBRARY CMS
   ══════════════════════════════════════════════ */
let editingPdfId = null;

window.togglePdfAccessField = function () {
  const access = document.getElementById('pdf-access').value;
  if (access === 'free') {
    document.getElementById('pdf-url-container').style.display = 'block';
    document.getElementById('pdf-url').required = true;
    document.getElementById('pdf-path-container').style.display = 'none';
    document.getElementById('pdf-path').required = false;
  } else {
    document.getElementById('pdf-url-container').style.display = 'none';
    document.getElementById('pdf-url').required = false;
    document.getElementById('pdf-path-container').style.display = 'block';
    document.getElementById('pdf-path').required = true;
  }
};

window.clearPdfForm = function () {
  editingPdfId = null;
  const form = document.getElementById('form-pdf-info');
  if (form) form.reset();
  togglePdfAccessField();
  document.querySelector('#section-add-pdf .admin-header h1').innerHTML = 'Add PDF / Resource 📄';
  document.querySelector('#section-add-pdf button.opp-btn-primary').innerHTML = '✅ Publish Resource';
};

window.publishPdf = async function () {
  const title = document.getElementById('pdf-title').value.trim();
  if (!title) return alert('Title is required');

  const access = document.getElementById('pdf-access').value;
  const url = document.getElementById('pdf-url').value.trim();
  const path = document.getElementById('pdf-path').value.trim();

  if (access === 'free' && !url) return alert('Google Drive URL is required for Free access.');
  if (access === 'premium' && !path) return alert('Backend file path is required for Premium access.');

  const btn = document.querySelector('#section-add-pdf button.opp-btn-primary');
  btn.disabled = true;
  btn.innerText = "Publishing...";

  try {
    const data = {
      title,
      type: document.getElementById('pdf-type').value,
      domain: document.getElementById('pdf-domain').value.trim(),
      access: access,
      description: document.getElementById('pdf-desc').value.trim(),
      tags: document.getElementById('pdf-tags').value.split(',').map(s => s.trim()).filter(Boolean),
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp(),
      poster_type: 'admin',
      posted_by: firebase.auth().currentUser.uid,
      poster_name: (Auth.getProfile() || {}).name || 'Syntax Syndicate Admin',
      poster_avatar_url: (Auth.getProfile() || {}).avatar_url || '../img/default-avatar.png'
    };

    if (access === 'free') data.url = url;
    else data.file_path = path;

    await DB.savePdf(data, editingPdfId);
    showToast(`Resource ${editingPdfId ? 'updated' : 'published'} successfully!`);

    // Auto-notify users about new resource (only on new publish, not edit)
    if (!editingPdfId && access === 'free') {
      try {
        await DB.broadcastNotification({
          title: '📄 New Resource Added!',
          message: `"${title}" has been added to the Free Library.`,
          link: 'archives/free-library.html',
          sent_by: firebase.auth().currentUser.uid
        });
      } catch (ne) { console.warn('Auto-notification failed:', ne); }
    }

    // Auto switch to Manage PDFs
    document.querySelector('.sidebar-link[data-section="manage-pdfs"]').click();
    clearPdfForm();
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  } finally {
    btn.disabled = false;
  }
};

window.loadManagePdfs = async function () {
  const tbody = document.getElementById('pdfs-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">Loading…</td></tr>';

  try {
    const snap = await db.collection('pdfs').orderBy('created_at', 'desc').get();
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">No resources found</td></tr>';
      return;
    }

    tbody.innerHTML = snap.docs.map(doc => {
      const r = doc.data();
      return `<tr>
        <td style="font-weight:600">${r.title || 'Untitled'}</td>
        <td><span class="badge" style="background:var(--tint);color:var(--text)">${r.type || 'N/A'}</span></td>
        <td><span class="badge" style="background:${r.access === 'premium' ? '#fef08a' : '#bbf7d0'};color:${r.access === 'premium' ? '#b45309' : '#166534'}">${r.access || 'free'}</span></td>
        <td>${r.poster_type || 'admin'}</td>
        <td><div class="table-actions">
          <button class="opp-btn opp-btn-sm" style="background:#fef3c7;border-color:#f59e0b;color:#b45309" onclick="editPdfAdmin('${doc.id}')">✏️ Edit</button>
          <a href="../archives/viewer.html?id=${doc.id}" target="_blank" class="opp-btn opp-btn-sm" style="background:var(--tint);border-color:var(--border)">👁 View</a>
          <button class="opp-btn opp-btn-danger opp-btn-sm" onclick="deletePdfAdmin('${doc.id}')">🗑</button>
        </div></td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--opp-danger)">Error: ${err.message}</td></tr>`;
  }
};

window.editPdfAdmin = async function (id) {
  try {
    const r = await DB.fetchPdf(id);
    if (!r) throw new Error("Not found");

    document.querySelector('.sidebar-link[data-section="add-pdf"]').click();
    editingPdfId = id;
    document.querySelector('#section-add-pdf .admin-header h1').innerHTML = 'Edit PDF / Resource ✏️';
    document.querySelector('#section-add-pdf button.opp-btn-primary').innerHTML = '💾 Save Changes';

    document.getElementById('pdf-title').value = r.title || '';
    document.getElementById('pdf-type').value = r.type || 'pdf';
    document.getElementById('pdf-domain').value = r.domain || '';
    document.getElementById('pdf-access').value = r.access || 'free';
    togglePdfAccessField();

    if (r.access === 'free') document.getElementById('pdf-url').value = r.url || '';
    else document.getElementById('pdf-path').value = r.file_path || '';

    document.getElementById('pdf-desc').value = r.description || '';
    document.getElementById('pdf-tags').value = (r.tags || []).join(', ');
  } catch (e) {
    showToast('Failed to load PDF: ' + e.message, 'error');
  }
};

window.deletePdfAdmin = async function (id) {
  if (!confirm('Delete this resource?')) return;
  try { await DB.deletePdf(id); showToast('Resource deleted'); loadManagePdfs(); }
  catch (e) { showToast('Error: ' + e.message, 'error'); }
};


/* ══════════════════════════════════════════════
   MANAGE ROADMAPS & CHEATSHEETS
   ══════════════════════════════════════════════ */
window.loadManageRoadmaps = async function () {
  const tbody = document.getElementById('roadmaps-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--opp-text3)">Loading…</td></tr>';

  try {
    const items = await DB.fetchLatestRoadmaps(100);
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--opp-text3)">No roadmaps found</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(r => `<tr>
      <td style="font-weight:600">${r.title || 'Untitled'}</td>
      <td>${r.domain || '—'}</td>
      <td><span class="level-tag lv-${r.level || 'beginner'}" style="font-size:10px;padding:2px 8px">${r.level || 'beginner'}</span></td>
      <td>${(r.steps || []).length}</td>
      <td>${r.poster_name || '—'}</td>
      <td><div class="table-actions">
        <button class="opp-btn opp-btn-sm" style="background:#fef3c7;border-color:#f59e0b;color:#b45309" onclick="editRoadmapAdmin('${r.id}')">✏️ Edit</button>
        <a href="resources/roadmap.html?id=${r.id}" target="_blank" class="opp-btn opp-btn-sm" style="background:var(--tint);border-color:var(--border)">👁 View</a>
        <button class="opp-btn opp-btn-danger opp-btn-sm" onclick="deleteRoadmapAdmin('${r.id}')">🗑</button>
      </div></td>
    </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--opp-danger)">Error: ${err.message}</td></tr>`;
  }
};

window.deleteRoadmapAdmin = async function (id) {
  if (!confirm('Delete this roadmap?')) return;
  try { await DB.deleteRoadmap(id); showToast('Roadmap deleted'); loadManageRoadmaps(); }
  catch (e) { showToast('Error: ' + e.message, 'error'); }
};

window.loadManageCheatsheets = async function () {
  const tbody = document.getElementById('cheatsheets-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">Loading…</td></tr>';

  try {
    const items = await DB.fetchLatestCheatsheets(100);
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;color:var(--opp-text3)">No cheatsheets found</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(c => `<tr>
      <td style="font-weight:600">${c.title || 'Untitled'}</td>
      <td>${c.domain || '—'}</td>
      <td>${(c.sections || []).length}</td>
      <td>${c.poster_name || '—'}</td>
      <td><div class="table-actions">
        <button class="opp-btn opp-btn-sm" style="background:#fef3c7;border-color:#f59e0b;color:#b45309" onclick="editCheatsheetAdmin('${c.id}')">✏️ Edit</button>
        <a href="resources/cheatsheet.html?id=${c.id}" target="_blank" class="opp-btn opp-btn-sm" style="background:var(--tint);border-color:var(--border)">👁 View</a>
        <button class="opp-btn opp-btn-danger opp-btn-sm" onclick="deleteCheatsheetAdmin('${c.id}')">🗑</button>
      </div></td>
    </tr>`).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--opp-danger)">Error: ${err.message}</td></tr>`;
  }
};

window.deleteCheatsheetAdmin = async function (id) {
  if (!confirm('Delete this cheatsheet?')) return;
  try { await DB.deleteCheatsheet(id); showToast('Cheatsheet deleted'); loadManageCheatsheets(); }
  catch (e) { showToast('Error: ' + e.message, 'error'); }
};


/* ══════════════════════════════════════════════
   CONTACT MESSAGES
   ══════════════════════════════════════════════ */
window.loadMessages = async function () {
  const tbody = document.getElementById('messages-tbody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--opp-text3)">Loading…</td></tr>';

  try {
    const msgs = await DB.fetchContactMessages();
    if (!msgs.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--opp-text3)">No messages yet</td></tr>';
      return;
    }
    tbody.innerHTML = msgs.map(m => {
      const statusColor = m.status === 'unread' ? 'color:var(--opp-primary);font-weight:700' : 'color:var(--opp-text3)';
      return `<tr style="cursor:pointer" onclick="viewMessage('${m.id}')">
        <td style="font-weight:${m.status === 'unread' ? '700' : '400'}">${m.name || '—'}</td>
        <td>${m.email || '—'}</td>
        <td>${m.subject || '—'}</td>
        <td>${timeAgo(m.created_at)}</td>
        <td><span style="${statusColor};font-size:11px;text-transform:uppercase">${m.status || 'unread'}</span></td>
        <td><div class="table-actions">
          ${m.status === 'unread' ? `<button class="opp-btn opp-btn-sm" style="background:var(--tint);border-color:var(--border)" onclick="event.stopPropagation();markMsgRead('${m.id}')">✓ Read</button>` : ''}
          <button class="opp-btn opp-btn-danger opp-btn-sm" onclick="event.stopPropagation();deleteMsg('${m.id}')">🗑</button>
        </div></td>
      </tr>`;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--opp-danger)">Error: ${err.message}</td></tr>`;
  }
};

window.viewMessage = async function (id) {
  try {
    const msg = await DB.getDoc(`contact_messages/${id}`);
    if (!msg) return showToast('Message not found', 'error');
    // Mark as read
    if (msg.status === 'unread') await DB.markMessageRead(id);

    const modal = document.getElementById('edit-modal');
    const body = document.getElementById('edit-modal-body');
    if (!modal || !body) return;

    document.querySelector('.modal-title').textContent = '📩 Message';
    body.innerHTML = `
      <div style="font-size:13px;color:var(--opp-text2);display:flex;flex-direction:column;gap:14px">
        <div><strong>From:</strong> ${msg.name || '—'} (${msg.email || '—'})</div>
        <div><strong>Subject:</strong> ${msg.subject || 'No subject'}</div>
        <div><strong>Date:</strong> ${timeAgo(msg.created_at)}</div>
        <div style="padding:16px;background:var(--opp-bg);border-radius:8px;border:1px solid var(--opp-border);white-space:pre-wrap;line-height:1.7">${msg.message || 'No message body'}</div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <a href="mailto:${msg.email || ''}" class="opp-btn opp-btn-primary opp-btn-sm">✉️ Reply via Email</a>
          <button class="opp-btn opp-btn-secondary opp-btn-sm" onclick="closeEditModal()">Close</button>
        </div>
      </div>
    `;
    modal.classList.add('active');
    loadMessages(); // Refresh list
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
};

window.markMsgRead = async function (id) {
  try { await DB.markMessageRead(id); showToast('Marked as read'); loadMessages(); }
  catch (e) { showToast('Error: ' + e.message, 'error'); }
};

window.deleteMsg = async function (id) {
  if (!confirm('Delete this message?')) return;
  try { await DB.deleteMessage(id); showToast('Message deleted'); loadMessages(); }
  catch (e) { showToast('Error: ' + e.message, 'error'); }
};


/* ══════════════════════════════════════════════
   PDF ANALYTICS
   ══════════════════════════════════════════════ */
window.loadPdfAnalytics = async function () {
  try {
    const pdfs = await DB.fetchAllPdfs(200);

    // Stats
    const total = pdfs.length;
    const rated = pdfs.filter(p => p.avg_rating);
    const avgAll = rated.length ? (rated.reduce((s, p) => s + p.avg_rating, 0) / rated.length).toFixed(1) : '—';
    const totalReads = pdfs.reduce((s, p) => s + (p.read_count || 0), 0);
    const totalReviews = pdfs.reduce((s, p) => s + (p.review_count || 0), 0);

    document.getElementById('pa-total').textContent = total;
    document.getElementById('pa-avg').textContent = avgAll;
    document.getElementById('pa-reads').textContent = totalReads;
    document.getElementById('pa-reviews').textContent = totalReviews;

    // Sort by rating desc for top
    const withRating = pdfs.filter(p => p.avg_rating && p.review_count);
    const topRated = [...withRating].sort((a, b) => b.avg_rating - a.avg_rating).slice(0, 5);
    const bottomRated = [...withRating].sort((a, b) => a.avg_rating - b.avg_rating).slice(0, 5);

    const renderRow = (arr, tbody) => {
      const el = document.getElementById(tbody);
      if (!arr.length) {
        el.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:var(--opp-text3)">No rated resources yet</td></tr>';
        return;
      }
      el.innerHTML = arr.map((p, i) => `<tr>
        <td style="font-weight:700;color:var(--opp-text)">${i + 1}</td>
        <td style="font-weight:600">${p.title || 'Untitled'}</td>
        <td><span style="color:#e6a817;font-weight:700">★ ${p.avg_rating.toFixed(1)}</span></td>
        <td>${p.review_count || 0}</td>
        <td>${p.read_count || 0}</td>
      </tr>`).join('');
    };

    renderRow(topRated, 'pa-top-tbody');
    renderRow(bottomRated, 'pa-bottom-tbody');
  } catch (e) {
    console.error('Analytics error:', e);
  }
};


/* ══════════════════════════════════════════════
   NOTIFICATIONS MANAGEMENT
   ══════════════════════════════════════════════ */
window.toggleNotifUserSelect = function () {
  const target = document.getElementById('notif-target').value;
  document.getElementById('notif-user-wrap').style.display = target === 'user' ? 'block' : 'none';
};

window.loadNotificationsPanel = async function () {
  // Populate user dropdown
  try {
    if (!allUsers.length) await loadUsers();
    const sel = document.getElementById('notif-user-select');
    sel.innerHTML = '<option value="">-- Select User --</option>' +
      allUsers.map(u => `<option value="${u.id}">${u.name || u.email} (${u.role || 'user'})</option>`).join('');
  } catch (e) { }

  // Load recent notifications
  try {
    const snap = await db.collection('notifications').orderBy('created_at', 'desc').limit(20).get();
    const tbody = document.getElementById('notif-log-tbody');
    if (snap.empty) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:30px;color:var(--opp-text3)">No notifications sent yet</td></tr>';
      return;
    }
    tbody.innerHTML = snap.docs.map(doc => {
      const n = doc.data();
      let targetLabel = '📢 All Users';
      if (n.target !== 'all') {
        const foundUser = allUsers.find(u => u.id === n.target_user);
        targetLabel = '👤 ' + (foundUser ? (foundUser.name || foundUser.email) : 'User: ' + (n.target_user || 'Unknown'));
      }
      return `<tr>
        <td style="font-weight:600">${n.title || 'Untitled'}</td>
        <td>${targetLabel}</td>
        <td>${n.created_at ? timeAgo(n.created_at) : '—'}</td>
      </tr>`;
    }).join('');
  } catch (e) {
    document.getElementById('notif-log-tbody').innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--opp-danger)">Error loading logs</td></tr>';
  }
};

window.sendAdminNotification = async function () {
  const title = document.getElementById('notif-title').value.trim();
  const message = document.getElementById('notif-message').value.trim();
  const link = document.getElementById('notif-link').value.trim();
  const target = document.getElementById('notif-target').value;

  if (!title || !message) return alert('Title and Message are required.');

  const data = { title, message, link: link || null, sent_by: firebase.auth().currentUser.uid };

  try {
    if (target === 'all') {
      await DB.broadcastNotification(data);
      showToast('Broadcast notification sent to all users!');
    } else {
      const userId = document.getElementById('notif-user-select').value;
      if (!userId) return alert('Please select a user.');
      await DB.sendNotificationToUser(userId, data);
      showToast('Notification sent to user!');
    }
    // Clear form
    document.getElementById('notif-title').value = '';
    document.getElementById('notif-message').value = '';
    document.getElementById('notif-link').value = '';
    loadNotificationsPanel();
  } catch (e) {
    showToast('Error: ' + e.message, 'error');
  }
};
