/* ══════════════════════════════════════════════
   SYNTAX SYNDICATE — INSTITUTE ADMIN DASHBOARD JS
   ══════════════════════════════════════════════ */

let profile = null;
let mySubmissions = [];
let rmStepCounter = 0;
let csSecCounter = 0;
let editingDocId = null;

const SECTIONS = ['overview', 'add-roadmap', 'add-cheatsheet', 'add-opportunity', 'content', 'ads', 'profile'];

async function init() {
  const user = await Auth.requireAuth();
  profile = Auth.getProfile();
  if (!profile || !['institute_admin', 'superadmin', 'team'].includes(profile.role)) {
    window.location.href = 'profile.html'; return;
  }
  document.getElementById('app').style.display = 'grid';

  // Sidebar & Header
  const name = profile.name || 'Company';
  const badge = SS.getRoleBadge(profile.role);
  document.getElementById('dCompanyName').innerHTML = name + badge;
  document.getElementById('dCompanyEmail').innerText = user.email;
  document.getElementById('dAvatarInit').innerText = SS.getInitials(name);
  document.getElementById('dWelcomeName').innerText = name.split(' ')[0];

  const vb = document.getElementById('dVerifyBadge');
  if (profile.is_verified) {
    vb.className = 'dash-verified is-verified';
    vb.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Verified Partner';
    document.getElementById('verifyBanner').style.display = 'none';
  } else if (profile.verification_status === 'pending') {
    vb.className = 'dash-verified is-pending';
    vb.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> Pending Verification';
    document.getElementById('verifyBanner').style.display = 'none';
  } else {
    document.getElementById('verifyBanner').style.display = 'block';
  }

  // Auto-show verification modal if not verified
  if (!profile.is_verified) {
    showAutoVerificationModal();
  }

  // Profile Form prefill
  document.getElementById('editName').value = profile.name || '';
  document.getElementById('editDomain').value = profile.domain || '';
  document.getElementById('editDesc').value = profile.description || '';
  document.getElementById('editAvatar').value = profile.avatar_url || '';

  // Opportunity Banner Init
  resetOppBanner();

  // Public profile link
  const linkEl = document.getElementById('publicProfileLink');
  if (linkEl) linkEl.href = 'company/profile.html?uid=' + profile.id;

  await loadData();
}

function showSection(name) {
  SECTIONS.forEach(s => {
    const el = document.getElementById('sec-' + s);
    if (el) el.classList.toggle('active', s === name);
  });
  document.querySelectorAll('.dash-nav-item').forEach(el => {
    const onclick = el.getAttribute('onclick');
    if (onclick && onclick.includes(`'${name}'`)) el.classList.add('active');
    else el.classList.remove('active');
  });
}

/* ── DATA LOADING ── */
async function loadData() {
  try {
    const [pendingSnap, approvedSnap, adSnap] = await Promise.all([
      db.collection('pending_content').where('posted_by', '==', profile.id).get(),
      db.collection('opportunities').where('posted_by', '==', profile.id).get().catch(() => ({ docs: [] })),
      db.collection('ad_campaigns').where('posted_by', '==', profile.id).get().catch(() => ({ docs: [] }))
    ]);

    const pending = pendingSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const approvedOpps = approvedSnap.docs.map(d => ({ id: d.id, ...d.data(), status: 'approved' }));
    mySubmissions = [...pending, ...approvedOpps];

    const myCampaigns = adSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Stats
    const resources = mySubmissions.filter(i => ['roadmap', 'cheatsheet', 'pdf'].includes(i.type));
    const opps = mySubmissions.filter(i => ['job', 'internship', 'hackathon', 'techEvent', 'seminar', 'course'].includes(i.type));
    
    document.getElementById('statRes').innerText = resources.length;
    document.getElementById('statOpp').innerText = opps.length;
    document.getElementById('statApproved').innerText = mySubmissions.filter(i => i.status === 'approved').length;
    document.getElementById('statPending').innerText = mySubmissions.filter(i => i.status === 'pending').length;

    renderSubmissionsTable(mySubmissions);
    renderCampaigns(myCampaigns);
    renderActivity([...mySubmissions].sort((a, b) => (b.created_at?.toMillis?.() || 0) - (a.created_at?.toMillis?.() || 0)).slice(0, 5));
  } catch (e) { console.error('loadData error:', e); }
}

function renderSubmissionsTable(items) {
  const body = document.getElementById('submissionsBody');
  if (!items.length) {
    body.innerHTML = '<tr><td colspan="4" style="text-align:center;padding:40px;color:var(--text-3);">No submissions yet</td></tr>';
    return;
  }
  body.innerHTML = items.map(r => {
    const statusClass = r.status === 'approved' ? 'st-approved' : r.status === 'rejected' ? 'st-rejected' : 'st-pending';
    return `<tr>
      <td class="item-title">${SS.sanitizeHTML(r.title || 'Untitled')}</td>
      <td><span class="status-tag st-active">${r.type || '-'}</span></td>
      <td><span class="status-tag ${statusClass}">${r.status || 'pending'}</span></td>
      <td style="display:flex;gap:8px;">
        <button class="dash-btn dash-btn-outline dash-btn-sm" onclick="editItem('${r.status === 'approved' ? 'opportunities' : 'pending_content'}','${r.id}')"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button>
        ${r.status !== 'approved' ? `<button class="dash-btn dash-btn-danger dash-btn-sm" onclick="delItem('${r.id}')">Delete</button>` : ''}
      </td>
    </tr>`;
  }).join('');
}

function renderCampaigns(campaigns) {
  const container = document.getElementById('campaignsList');
  if (!campaigns.length) {
    container.innerHTML = `<div class="dash-empty">
      <div class="dash-empty-icon"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>
      <h4>No Active Campaigns</h4>
      <p>Launch your first ad campaign to reach thousands of developers on Syntax Syndicate.</p>
    </div>`;
    return;
  }
  container.innerHTML = campaigns.map(c => {
    const sc = c.status === 'active' ? 'st-active' : c.status === 'approved' ? 'st-approved' : 'st-pending';
    const impressions = c.impressions || 0;
    const clicks = c.clicks || 0;
    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(1) : '0.0';
    return `<div class="campaign-card" style="flex-direction:column;gap:16px;">
      <div style="display:flex;align-items:center;gap:16px;">
        <div class="campaign-icon" style="background:var(--accent-bg);color:var(--accent);">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
        </div>
        <div class="campaign-info">
          <div class="campaign-title">${SS.sanitizeHTML(c.title || c.plan || 'Campaign')}</div>
          <div class="campaign-meta">
            <span>Plan: <strong>${(c.plan || 'N/A').charAt(0).toUpperCase() + (c.plan || '').slice(1)}</strong></span>
            <span>Created: ${SS.formatDate(c.created_at)}</span>
            <span class="status-tag ${sc}">${c.status || 'pending'}</span>
          </div>
        </div>
        <button class="dash-btn dash-btn-outline dash-btn-sm" style="margin-left:auto;flex-shrink:0;" onclick="viewAnalytics('${c.id}')">
          <svg viewBox="0 0 24 24" width="14" height="14"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
          Analytics
        </button>
      </div>
      <div class="analytics-bar">
        <div class="analytics-metric"><div class="analytics-metric-val">${impressions.toLocaleString()}</div><div class="analytics-metric-label">Impressions</div></div>
        <div class="analytics-metric"><div class="analytics-metric-val">${clicks.toLocaleString()}</div><div class="analytics-metric-label">Clicks</div></div>
        <div class="analytics-metric"><div class="analytics-metric-val">${ctr}%</div><div class="analytics-metric-label">CTR</div></div>
        <div class="analytics-metric"><div class="analytics-metric-val">${(c.conversions || 0).toLocaleString()}</div><div class="analytics-metric-label">Conversions</div></div>
      </div>
    </div>`;
  }).join('');
}

function renderActivity(items) {
  const container = document.getElementById('activityFeed');
  if (!items.length) { container.innerHTML = '<p style="color:var(--text-3);font-size:.88rem;padding:20px 0;">No recent activity</p>'; return; }
  container.innerHTML = items.map(item => {
    const dotClass = item.status === 'approved' ? 'dot-green' : item.status === 'rejected' ? 'dot-yellow' : 'dot-blue';
    return `<div class="activity-item">
      <div class="activity-dot ${dotClass}"></div>
      <div>
        <div class="activity-text"><strong>${SS.sanitizeHTML(item.title || 'Item')}</strong> — ${item.status || 'submitted'}</div>
        <div class="activity-time">${SS.formatDateRelative(item.created_at)}</div>
      </div>
    </div>`;
  }).join('');
}

/* ── ROADMAP BUILDER ── */
window.addRoadmapStep = function () {
  rmStepCounter++;
  const idx = rmStepCounter;
  const container = document.getElementById('rm-steps-container');
  const stepDiv = document.createElement('div');
  stepDiv.className = 'dash-card';
  stepDiv.id = `rm-step-${idx}`;
  stepDiv.style.cssText = 'border:2px solid var(--accent-bg);background:rgba(255,255,255,0.5);padding:24px;border-radius:18px;';
  stepDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:14px;font-weight:800;color:var(--accent)">Step ${container.children.length + 1}</h3>
      <div style="display:flex;gap:8px">
        <button type="button" class="dash-btn dash-btn-outline dash-btn-sm" onclick="moveRoadmapStep(${idx},-1)">↑</button>
        <button type="button" class="dash-btn dash-btn-outline dash-btn-sm" onclick="moveRoadmapStep(${idx},1)">↓</button>
        <button type="button" class="dash-btn dash-btn-danger dash-btn-sm" onclick="removeRoadmapStep(${idx})">✕</button>
      </div>
    </div>
    <div class="dash-form-grid">
      <div class="dash-form-group"><label class="dash-form-label">Step Title *</label><input type="text" class="dash-form-input rm-step-title" required placeholder="e.g. Learn HTML & CSS"></div>
      <div class="dash-form-group"><label class="dash-form-label">Est. Hours</label><input type="number" class="dash-form-input rm-step-hours" placeholder="e.g. 20"></div>
      <div class="dash-form-group dash-form-full"><label class="dash-form-label">Description</label><textarea class="dash-form-textarea rm-step-desc" rows="3" placeholder="What to learn..."></textarea></div>
      <div class="dash-form-group dash-form-full"><label class="dash-form-label">Pro Tips</label><textarea class="dash-form-textarea rm-step-tips" rows="2" placeholder="Helpful tips..."></textarea></div>
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

/* ── CHEATSHEET BUILDER ── */
window.addCheatsheetSection = function () {
  csSecCounter++;
  const idx = csSecCounter;
  const container = document.getElementById('cs-sections-container');
  const secDiv = document.createElement('div');
  secDiv.className = 'dash-card';
  secDiv.id = `cs-sec-${idx}`;
  secDiv.style.cssText = 'border:2px solid var(--green-bg);background:rgba(255,255,255,0.5);padding:24px;border-radius:18px;';
  secDiv.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h3 style="font-size:14px;font-weight:800;color:var(--green)">Section ${container.children.length + 1}</h3>
      <div style="display:flex;gap:8px">
        <button type="button" class="dash-btn dash-btn-outline dash-btn-sm" onclick="moveCSSection(${idx},-1)">↑</button>
        <button type="button" class="dash-btn dash-btn-outline dash-btn-sm" onclick="moveCSSection(${idx},1)">↓</button>
        <button type="button" class="dash-btn dash-btn-danger dash-btn-sm" onclick="removeCSSection(${idx})">✕</button>
      </div>
    </div>
    <div class="dash-form-grid">
      <div class="dash-form-group dash-form-full"><label class="dash-form-label">Heading *</label><input type="text" class="dash-form-input cs-sec-heading" required placeholder="e.g. Data Types"></div>
      <div class="dash-form-group dash-form-full"><label class="dash-form-label">Content</label><textarea class="dash-form-textarea cs-sec-content" rows="4" placeholder="Explanation..."></textarea></div>
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

/* ── OPPORTUNITY BANNER LOGIC ── */
window.resetOppBanner = function() {
  const url = profile?.avatar_url || 'https://via.placeholder.com/1200x600?text=Syntax+Syndicate+Opportunity';
  document.getElementById('opp-img').value = url;
  updateOppBannerPreview(url);
};

function updateOppBannerPreview(url) {
  const prev = document.getElementById('opp-banner-preview');
  if (prev) prev.style.backgroundImage = `url('${url}')`;
}

document.getElementById('opp-img')?.addEventListener('input', (e) => updateOppBannerPreview(e.target.value));

function toggleOppFields() {
  const t = document.getElementById('opp-type').value;
  const label = document.getElementById('opp-desc-label');
  const ta = document.getElementById('opp-desc');
  if (t === 'job') { label.innerText = 'Job Description & Salary'; ta.placeholder = 'Include salary, responsibilities, requirements...'; }
  else if (t === 'internship') { label.innerText = 'Internship Details & Stipend'; ta.placeholder = 'Include stipend, duration, PPO chances...'; }
  else if (t === 'hackathon') { label.innerText = 'Hackathon Rules & Prizes'; ta.placeholder = 'Include team size, prize pool, problem statements...'; }
  else { label.innerText = 'Event Details & Highlights'; ta.placeholder = 'What is this about? Who should join?'; }
}

/* ── SUBMISSION LOGIC ── */
document.getElementById('form-roadmap')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const steps = [];
  document.querySelectorAll('#rm-steps-container > div').forEach((el, i) => {
    steps.push({
      order: i + 1,
      title: el.querySelector('.rm-step-title').value,
      description: el.querySelector('.rm-step-desc').value,
      tips: el.querySelector('.rm-step-tips').value,
      estimated_hours: parseInt(el.querySelector('.rm-step-hours').value) || 0
    });
  });

  const data = {
    title: document.getElementById('rm-title').value,
    type: 'roadmap',
    domain: document.getElementById('rm-domain').value,
    role: document.getElementById('rm-role').value,
    level: document.getElementById('rm-level').value,
    estimated_time: document.getElementById('rm-time').value,
    icon: document.getElementById('rm-icon').value || 'bi-map',
    description: document.getElementById('rm-desc').value,
    tags: document.getElementById('rm-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    steps,
    posted_by: profile.id,
    company_name: profile.name,
    target_collection: 'ss_roadmaps',
    status: 'pending',
    created_at: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    if (editingDocId) {
      await db.collection('pending_content').doc(editingDocId).set(data);
      SS.showToast('Submission updated and sent for review!', 'success');
    } else {
      await db.collection('pending_content').add(data);
      SS.showToast('Roadmap submitted for review!', 'success');
    }
    clearRoadmapForm();
    showSection('content');
    loadData();
  } catch(err) { SS.showToast('Error: ' + err.message, 'error'); }
});

document.getElementById('form-cheatsheet')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const sections = [];
  document.querySelectorAll('#cs-sections-container > div').forEach((el, i) => {
    sections.push({
      order: i + 1,
      heading: el.querySelector('.cs-sec-heading').value,
      content: el.querySelector('.cs-sec-content').value
    });
  });

  const data = {
    title: document.getElementById('cs-title').value,
    type: 'cheatsheet',
    domain: document.getElementById('cs-domain').value,
    icon: document.getElementById('cs-icon').value || 'bi-file-code',
    download_url: document.getElementById('cs-download').value,
    description: document.getElementById('cs-desc').value,
    tags: document.getElementById('cs-tags').value.split(',').map(t => t.trim()).filter(Boolean),
    sections,
    posted_by: profile.id,
    company_name: profile.name,
    target_collection: 'ss_cheatsheets',
    status: 'pending',
    created_at: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    if (editingDocId) {
      await db.collection('pending_content').doc(editingDocId).set(data);
      SS.showToast('Submission updated and sent for review!', 'success');
    } else {
      await db.collection('pending_content').add(data);
      SS.showToast('Cheatsheet submitted for review!', 'success');
    }
    clearCheatsheetForm();
    showSection('content');
    loadData();
  } catch(err) { SS.showToast('Error: ' + err.message, 'error'); }
});

document.getElementById('form-opportunity')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const type = document.getElementById('opp-type').value;
  const colMap = {
    job: 'ss_jobs', internship: 'ss_internships', hackathon: 'ss_hackathons',
    techEvent: 'ss_events', seminar: 'ss_seminars', course: 'ss_courses'
  };

  const data = {
    title: document.getElementById('opp-title').value,
    type,
    image_url: document.getElementById('opp-img').value,
    location: document.getElementById('opp-location').value,
    link: document.getElementById('opp-link').value,
    description: document.getElementById('opp-desc').value,
    deadline: document.getElementById('opp-deadline').value,
    posted_by: profile.id,
    company_name: profile.name,
    target_collection: colMap[type] || 'opportunities',
    status: 'pending',
    created_at: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    if (editingDocId) {
      await db.collection('pending_content').doc(editingDocId).set(data);
      SS.showToast('Opportunity updated and sent for review!', 'success');
    } else {
      await db.collection('pending_content').add(data);
      SS.showToast('Opportunity submitted!', 'success');
    }
    clearOppForm();
    showSection('content');
    loadData();
  } catch(err) { SS.showToast('Error: ' + err.message, 'error'); }
});

/* ── PROFILE FORM ── */
document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.innerText = 'Saving...'; btn.disabled = true;
  try {
    await DB.updateUserProfile(profile.id, {
      name: document.getElementById('editName').value.trim(),
      domain: document.getElementById('editDomain').value.trim(),
      description: document.getElementById('editDesc').value.trim(),
      avatar_url: document.getElementById('editAvatar').value.trim()
    });
    SS.showToast('Profile updated!', 'success');
    setTimeout(() => window.location.reload(), 800);
  } catch(e) {
    SS.showToast('Error saving profile', 'error');
    btn.innerText = 'Save Changes'; btn.disabled = false;
  }
});

/* ── VERIFICATION ── */
window.showAutoVerificationModal = () => {
  const modal = document.getElementById('modalVerify');
  if (!modal) return;
  
  const status = profile.verification_status;
  const form = document.getElementById('verifyForm');
  const header = modal.querySelector('.dash-modal-header h3');

  if (status === 'pending') {
    header.innerText = 'Verification Pending';
    form.innerHTML = `
      <div class="verification-status-view">
        <div class="status-view-icon pending"><i class="bi bi-hourglass-split"></i></div>
        <h4 class="status-view-title">Application Under Review</h4>
        <p class="status-view-desc">Our team is currently auditing your institute's details. This typically takes 24-48 hours. We'll notify you once your blue tick is live!</p>
        <div class="status-view-actions">
          <button type="button" class="dash-btn dash-btn-outline" onclick="closeModal('modalVerify')">Close for now</button>
        </div>
      </div>
    `;
  } else if (status === 'rejected') {
    header.innerText = 'Verification Rejected';
    form.innerHTML = `
      <div class="verification-status-view">
        <div class="status-view-icon rejected"><i class="bi bi-x-circle"></i></div>
        <h4 class="status-view-title">Verification Rejected</h4>
        <p class="status-view-desc">Your verification request was declined by our admins. Please check your details and resubmit the application.</p>
        <div class="status-view-actions">
          <button type="button" class="dash-btn dash-btn-accent" onclick="location.reload()">Re-apply Now</button>
        </div>
      </div>
    `;
  } else {
    // Normal form (already in HTML)
  }

  openModal('modalVerify');
};

window.openVerificationForm = () => {
  if (profile.verification_info) {
    const v = profile.verification_info;
    document.getElementById('vCompName').value = v.company_name || profile.name || '';
    document.getElementById('vCompBio').value = v.description || profile.description || '';
    document.getElementById('vCompWeb').value = v.website || profile.domain || '';
    document.getElementById('vPurpose').value = v.purpose || '';
  } else {
    document.getElementById('vCompName').value = profile.name || '';
    document.getElementById('vCompBio').value = profile.description || '';
    document.getElementById('vCompWeb').value = profile.domain || '';
  }
  openModal('modalVerify');
};

document.getElementById('verifyForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  btn.disabled = true; btn.innerText = 'Submitting...';

  const vInfo = {
    company_name: document.getElementById('vCompName').value.trim(),
    description: document.getElementById('vCompBio').value.trim(),
    website: document.getElementById('vCompWeb').value.trim(),
    purpose: document.getElementById('vPurpose').value.trim(),
    submitted_at: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    // 1. Update user profile with pending status
    await db.collection('users').doc(profile.id).update({
      verification_status: 'pending',
      verification_info: vInfo
    });

    // 2. Create a request entry for admin visibility
    await db.collection('verification_requests').doc(profile.id).set({
      uid: profile.id,
      email: profile.email,
      ...vInfo,
      status: 'pending'
    });

    SS.showToast('Verification request submitted!', 'success');
    closeModal('modalVerify');
    setTimeout(() => window.location.reload(), 1000);
  } catch(err) {
    SS.showToast('Submission error: ' + err.message, 'error');
    btn.disabled = false; btn.innerText = 'Submit Application';
  }
});

/* ── AD CAMPAIGN FORM ── */
document.getElementById('adForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const plan = document.querySelector('input[name="adPlan"]:checked');
  if (!plan) { SS.showToast('Please select a plan', 'error'); return; }
  const data = {
    plan: plan.value,
    title: document.getElementById('ad-title').value,
    target_url: document.getElementById('ad-url').value,
    image_url: document.getElementById('ad-image').value,
    description: document.getElementById('ad-desc').value,
    posted_by: profile.id, company_name: profile.name,
    status: 'pending', created_at: firebase.firestore.FieldValue.serverTimestamp()
  };
  try {
    await db.collection('ad_campaigns').add(data);
    SS.showToast('Campaign submitted! Our team will review it shortly.', 'success');
    closeModal('modalAd'); e.target.reset(); loadData();
  } catch(err) {
    SS.showToast('Error submitting campaign', 'error');
  }
});

function selectAdPlan(plan) {
  document.querySelectorAll('.ad-plan').forEach(el => el.classList.remove('popular'));
  const planEl = document.querySelector(`[data-plan="${plan}"]`);
  if (planEl) planEl.classList.add('popular');
  const radio = document.querySelector(`input[name="adPlan"][value="${plan}"]`);
  if (radio) radio.checked = true;
  openModal('modalAd');
  document.getElementById('ad-plan-display').innerText = plan.charAt(0).toUpperCase() + plan.slice(1) + ' Plan';
}

/* ── FORM HELPERS ── */
window.clearRoadmapForm = () => {
  document.getElementById('form-roadmap').reset();
  document.getElementById('rm-steps-container').innerHTML = '';
  document.querySelector('#sec-add-roadmap .dash-card-title').innerText = 'Add New Roadmap';
  rmStepCounter = 0;
  editingDocId = null;
};
window.clearCheatsheetForm = () => {
  document.getElementById('form-cheatsheet').reset();
  document.getElementById('cs-sections-container').innerHTML = '';
  document.querySelector('#sec-add-cheatsheet .dash-card-title').innerText = 'Add New Cheatsheet';
  csSecCounter = 0;
  editingDocId = null;
};
window.clearOppForm = () => {
  document.getElementById('form-opportunity').reset();
  document.querySelector('#sec-add-opportunity .dash-card-title').innerText = 'Post New Opportunity';
  editingDocId = null;
  resetOppBanner();
};

/* ── MODALS & CRUD ── */
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

async function delItem(id) {
  if (!confirm('Delete this submission?')) return;
  await db.collection('pending_content').doc(id).delete();
  SS.showToast('Deleted', 'success');
  loadData();
}

async function editItem(collection, docId) {
  try {
    const doc = await db.collection(collection).doc(docId).get();
    if (!doc.exists) { SS.showToast('Item not found', 'error'); return; }
    const data = doc.data();
    editingDocId = docId;

    if (data.type === 'roadmap') {
      showSection('add-roadmap');
      document.querySelector('#sec-add-roadmap .dash-card-title').innerText = 'Edit Roadmap';
      document.getElementById('rm-title').value = data.title || '';
      document.getElementById('rm-domain').value = data.domain || '';
      document.getElementById('rm-role').value = data.role || '';
      document.getElementById('rm-level').value = data.level || 'beginner';
      document.getElementById('rm-time').value = data.estimated_time || '';
      document.getElementById('rm-icon').value = data.icon || '';
      document.getElementById('rm-desc').value = data.description || '';
      document.getElementById('rm-tags').value = (data.tags || []).join(', ');
      
      document.getElementById('rm-steps-container').innerHTML = '';
      rmStepCounter = 0;
      (data.steps || []).forEach(step => {
        window.addRoadmapStep();
        const stepEl = document.getElementById(`rm-step-${rmStepCounter}`);
        stepEl.querySelector('.rm-step-title').value = step.title || '';
        stepEl.querySelector('.rm-step-hours').value = step.estimated_hours || '';
        stepEl.querySelector('.rm-step-desc').value = step.description || '';
        stepEl.querySelector('.rm-step-tips').value = step.tips || '';
      });
    } 
    else if (data.type === 'cheatsheet') {
      showSection('add-cheatsheet');
      document.querySelector('#sec-add-cheatsheet .dash-card-title').innerText = 'Edit Cheatsheet';
      document.getElementById('cs-title').value = data.title || '';
      document.getElementById('cs-domain').value = data.domain || '';
      document.getElementById('cs-icon').value = data.icon || '';
      document.getElementById('cs-download').value = data.download_url || '';
      document.getElementById('cs-desc').value = data.description || '';
      document.getElementById('cs-tags').value = (data.tags || []).join(', ');

      document.getElementById('cs-sections-container').innerHTML = '';
      csSecCounter = 0;
      (data.sections || []).forEach(sec => {
        window.addCheatsheetSection();
        const secEl = document.getElementById(`cs-sec-${csSecCounter}`);
        secEl.querySelector('.cs-sec-heading').value = sec.heading || '';
        secEl.querySelector('.cs-sec-content').value = sec.content || '';
      });
    }
    else {
      showSection('add-opportunity');
      document.querySelector('#sec-add-opportunity .dash-card-title').innerText = 'Edit Opportunity';
      document.getElementById('opp-title').value = data.title || '';
      document.getElementById('opp-type').value = data.type || 'job';
      document.getElementById('opp-location').value = data.location || '';
      document.getElementById('opp-img').value = data.image_url || '';
      updateOppBannerPreview(data.image_url);
      document.getElementById('opp-link').value = data.link || '';
      document.getElementById('opp-deadline').value = data.deadline || '';
      document.getElementById('opp-desc').value = data.description || '';
    }

    SS.showToast('Edit mode active', 'info');
  } catch(err) {
    SS.showToast('Error loading item: ' + err.message, 'error');
  }
}

async function viewAnalytics(campaignId) {
  try {
    const doc = await db.collection('ad_campaigns').doc(campaignId).get();
    if (!doc.exists) { SS.showToast('Campaign not found', 'error'); return; }
    const c = doc.data();

    const impressions = c.impressions || 0;
    const clicks = c.clicks || 0;
    const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : '0.00';
    const conversions = c.conversions || 0;

    const html = `
      <div style="margin-bottom:24px;">
        <h4 style="font-size:1.1rem;font-weight:800;margin-bottom:4px;">${SS.sanitizeHTML(c.title || 'Campaign')}</h4>
        <p style="font-size:.82rem;color:var(--text-3);">Plan: ${(c.plan || 'N/A').charAt(0).toUpperCase() + (c.plan || '').slice(1)} · Status: ${c.status || 'pending'}</p>
      </div>
      <div class="analytics-grid">
        <div class="analytics-card"><div class="analytics-card-val">${impressions.toLocaleString()}</div><div class="analytics-card-label">Impressions</div></div>
        <div class="analytics-card"><div class="analytics-card-val">${clicks.toLocaleString()}</div><div class="analytics-card-label">Clicks</div></div>
        <div class="analytics-card"><div class="analytics-card-val">${ctr}%</div><div class="analytics-card-label">CTR</div></div>
        <div class="analytics-card"><div class="analytics-card-val">${conversions.toLocaleString()}</div><div class="analytics-card-label">Conversions</div></div>
      </div>
    `;
    document.getElementById('analyticsModalBody').innerHTML = html;
    openModal('modalAnalytics');
  } catch(err) { SS.showToast('Error loading analytics', 'error'); }
}

init();
