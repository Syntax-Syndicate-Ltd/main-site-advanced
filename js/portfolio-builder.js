/* ═══════════════════════════════════════
   PORTFOLIO BUILDER ENGINE
   ═══════════════════════════════════════ */
const PB = {
  data: { hero:{name:'',role:'',tagline:'',photoUrl:''}, about:{text:'',yearsExp:'',location:''}, skills:{text:''}, experience:{entries:[]}, timeline:{entries:[]}, projects:{entries:[]}, education:{entries:[]}, certifications:{entries:[]}, testimonials:{entries:[]}, contact:{email:'',phone:'',linkedin:'',github:'',twitter:'',website:''}, custom:{title:'',text:''} },
  template: 'midnight',
  uid: null,
  isPublished: false,

  TEMPLATES: [
    {id:'midnight',name:'Midnight',icon:'<i class="bi bi-moon-stars"></i>', sections:['hero','about','skills','experience','timeline','projects','github','education','certifications','testimonials','contact','custom']},
    {id:'daylight',name:'Daylight',icon:'<i class="bi bi-sun"></i>', sections:['hero','about','skills','experience','timeline','projects','github','education','certifications','testimonials','contact','custom']},
    {id:'gradient',name:'Gradient',icon:'<i class="bi bi-palette"></i>', sections:['hero','about','skills','experience','timeline','projects','github','education','certifications','testimonials','contact','custom']},
    {id:'terminal',name:'Terminal',icon:'<i class="bi bi-terminal"></i>', sections:['hero','skills','projects','github','certifications','contact']},
    {id:'bento',name:'Bento',icon:'<i class="bi bi-grid-1x2"></i>', sections:['hero','skills','projects','github','education','certifications','testimonials','contact']},
    {id:'elegant',name:'Elegant',icon:'<i class="bi bi-feather"></i>', sections:['hero','about','experience','timeline','education','certifications','contact']}
  ],

  SECTIONS: [
    {key:'hero',label:'Hero / Header',icon:'<i class="bi bi-person-badge"></i>'},
    {key:'about',label:'About Me',icon:'<i class="bi bi-file-person"></i>'},
    {key:'skills',label:'Skills & Tech Stack',icon:'<i class="bi bi-lightning"></i>'},
    {key:'experience',label:'Work Experience',icon:'<i class="bi bi-briefcase"></i>'},
    {key:'timeline',label:'Career Timeline',icon:'<i class="bi bi-clock-history"></i>'},
    {key:'projects',label:'Projects',icon:'<i class="bi bi-rocket"></i>'},
    {key:'github',label:'GitHub Live Repos',icon:'<i class="bi bi-github"></i>'},
    {key:'education',label:'Education',icon:'<i class="bi bi-mortarboard"></i>'},
    {key:'certifications',label:'Certifications',icon:'<i class="bi bi-patch-check"></i>'},
    {key:'testimonials',label:'Testimonials',icon:'<i class="bi bi-chat-quote"></i>'},
    {key:'contact',label:'Contact & Social',icon:'<i class="bi bi-envelope"></i>'},
    {key:'custom',label:'Custom Section',icon:'<i class="bi bi-pencil-square"></i>'}
  ],

  init(){
    this.renderTemplateSelector();
    this.renderSections();
    this.renderPreview();
  },

  renderTemplateSelector(){
    const g=document.getElementById('pbTplGrid');
    g.innerHTML=this.TEMPLATES.map(t=>`<div class="pb-tpl-item ${t.id===this.template?'active':''}" data-tpl="${t.id}"><div class="pb-tpl-icon">${t.icon}</div>${t.name}</div>`).join('');
    g.querySelectorAll('.pb-tpl-item').forEach(el=>{
      el.onclick=()=>{
        this.template=el.dataset.tpl;
        g.querySelectorAll('.pb-tpl-item').forEach(e=>e.classList.remove('active'));
        el.classList.add('active');
        this.renderSections();
        this.renderPreview();
      }
    });
  },

  renderSections(){
    const c=document.getElementById('pbSections');
    const tplData = this.TEMPLATES.find(t => t.id === this.template);
    const allowed = tplData?.sections || [];
    
    c.innerHTML=this.SECTIONS
      .filter(s => allowed.includes(s.key))
      .map(s=>`<div class="pb-sec open" data-key="${s.key}">
      <div class="pb-sec-head" onclick="PB.toggleSec('${s.key}')"><span class="pb-sec-label">${s.icon} ${s.label}</span><span class="pb-sec-toggle">▼</span></div>
      <div class="pb-sec-body">${this.renderFields(s.key)}</div>
    </div>`).join('');
  },

  toggleSec(key){const el=document.querySelector(`.pb-sec[data-key="${key}"]`);if(el)el.classList.toggle('open');},

  renderFields(key){
    const d=this.data;
    const F=(field,label,type)=>{
      const val=this.getFieldVal(key,field);
      if(type==='textarea') return `<div class="pb-fg"><label class="pb-fl">${label}</label><textarea class="pb-fi" oninput="PB.setField('${key}','${field}',this.value)">${val}</textarea></div>`;
      return `<div class="pb-fg"><label class="pb-fl">${label}</label><input class="pb-fi" value="${this.esc(val)}" oninput="PB.setField('${key}','${field}',this.value)"></div>`;
    };
    switch(key){
      case 'hero': 
        const curPhoto = this.getFieldVal('hero','photoUrl');
        return `
          <div class="pb-row">${F('name','Full Name')}${F('role','Role / Title')}</div>
          ${F('tagline','Tagline','textarea')}
          <div class="pb-fg">
            <label class="pb-fl">Photo URL (Portrait recommended)</label>
            <div style="display:flex;gap:12px;align-items:center;">
              <div id="pbHeroPhotoPreview" style="width:48px;height:48px;border-radius:10px;background:#f3f4f6;flex-shrink:0;overflow:hidden;border:1px solid var(--border);">
                ${curPhoto ? `<img src="${this.esc(curPhoto)}" style="width:100%;height:100%;object-fit:cover;">` : '<i class="bi bi-person" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--gray-400)"></i>'}
              </div>
              <div style="display:flex;gap:8px;flex:1;">
                <input type="text" class="pb-fi" id="heroPhotoInput" value="${this.esc(curPhoto)}" oninput="PB.setField('hero','photoUrl',this.value); document.querySelector('#pbHeroPhotoPreview img')?.setAttribute('src',this.value)">
                <button class="pb-btn" onclick="PB.useProfilePhoto()" title="Use Profile Photo"><i class="bi bi-person-circle"></i></button>
              </div>
            </div>
          </div>
        `;
      case 'about': return `${F('text','Bio / About Me','textarea')}<div class="pb-row">${F('yearsExp','Years of Experience')}${F('location','Location')}</div>`;
      case 'skills': return F('text','Skills (comma separated or grouped)','textarea');
      case 'contact': return `<div class="pb-row">${F('email','Email')}${F('phone','Phone')}</div><div class="pb-row">${F('linkedin','LinkedIn')}${F('github','GitHub')}</div><div class="pb-row">${F('twitter','Twitter/X')}${F('website','Website')}</div>`;
      case 'github': return `${F('username','GitHub Username (e.g. torvalds)')}`;
      case 'custom': return `${F('title','Section Title')}${F('text','Content','textarea')}`;
      default: return this.renderMultiFields(key);
    }
  },

  renderMultiFields(key){
    const entries = this.data[key]?.entries || [];
    const fieldMap = {
      experience:[['title','Job Title'],['company','Company'],['dates','Dates'],['description','Description','textarea']],
      timeline:[['year','Year / Date'],['title','Milestone Title'],['description','Short Description']],
      projects:[['name','Project Name'],['tech','Tech Stack'],['description','Description','textarea'],['liveUrl','Live URL'],['githubUrl','GitHub URL'],['imageUrl','Image URL']],
      education:[['degree','Degree'],['institution','Institution'],['dates','Dates']],
      certifications:[['name','Cert Name'],['issuer','Issuer'],['url','Credential URL']],
      testimonials:[['quote','Quote','textarea'],['author','Author'],['role','Author Role']]
    };
    const fields = fieldMap[key]||[];
    return entries.map((entry,i)=>
      `<div class="pb-entry"><span class="pb-entry-del" onclick="PB.removeEntry('${key}',${i})">✕</span>
      ${fields.map(([f,l,t])=>{
        const val=entry[f]||'';
        return t==='textarea'
          ? `<div class="pb-fg"><label class="pb-fl">${l}</label><textarea class="pb-fi" oninput="PB.updateEntry('${key}',${i},'${f}',this.value)">${val}</textarea></div>`
          : `<div class="pb-fg"><label class="pb-fl">${l}</label><input class="pb-fi" value="${this.esc(val)}" oninput="PB.updateEntry('${key}',${i},'${f}',this.value)"></div>`;
      }).join('')}
      </div>`
    ).join('') + `<div class="pb-add-entry" onclick="PB.addEntry('${key}')">+ Add Entry</div>`;
  },

  previewTimeout: null,
  requestPreview(){
    clearTimeout(this.previewTimeout);
    this.previewTimeout = setTimeout(() => this.renderPreview(), 400);
  },
  getFieldVal(key,field){ return this.data[key]?.[field] || ''; },
  setField(key,field,val){ if(!this.data[key])this.data[key]={};this.data[key][field]=val;this.requestPreview(); },
  updateEntry(key,i,field,val){ if(this.data[key]?.entries?.[i])this.data[key].entries[i][field]=val;this.requestPreview(); },
  addEntry(key){ if(!this.data[key])this.data[key]={entries:[]};if(!this.data[key].entries)this.data[key].entries=[];
    const empty={experience:{title:'',company:'',dates:'',description:''},timeline:{year:'',title:'',description:''},projects:{name:'',tech:'',description:'',liveUrl:'',githubUrl:'',imageUrl:''},education:{degree:'',institution:'',dates:''},certifications:{name:'',issuer:'',url:''},testimonials:{quote:'',author:'',role:''}};
    this.data[key].entries.push(empty[key]||{});this.renderSections();this.requestPreview();
  },
  removeEntry(key,i){ this.data[key].entries.splice(i,1);this.renderSections();this.requestPreview(); },
  esc(s){ return (s||'').replace(/"/g,'&quot;'); },

  renderPreview(){
    const frame=document.getElementById('pbPreview');
    if(!frame)return;
    frame.innerHTML = PB.generatePortfolioHTML(this.data, this.template, true);
    this.initGithubSync();
  },

  generatePortfolioHTML(d, tpl, isPreview){
    const e=s=>{if(!s)return'';const el=document.createElement('div');el.textContent=s;return el.innerHTML;};
    
    // Navigation items based on available data
    const navItems = [
      {id:'hero', label:'Home'},
      d.about?.text ? {id:'about', label:'About'} : null,
      d.skills?.text ? {id:'skills', label:'Skills'} : null,
      d.experience?.entries?.length ? {id:'experience', label:'Experience'} : null,
      d.timeline?.entries?.length ? {id:'timeline', label:'Timeline'} : null,
      d.projects?.entries?.length ? {id:'projects', label:'Projects'} : null,
      d.github?.username ? {id:'github_sync', label:'Open Source'} : null,
      d.education?.entries?.length ? {id:'education', label:'Education'} : null,
      d.certifications?.entries?.length ? {id:'certifications', label:'Certifications'} : null,
      d.testimonials?.entries?.length ? {id:'testimonials', label:'Testimonials'} : null,
      {id:'contact', label:'Contact'}
    ].filter(Boolean);

    let h = `<div class="portfolio-wrap ptpl-${tpl}">`;
    
    // Sticky Nav
    h += `<nav class="p-nav">
      <div class="p-nav-container">
        <div class="p-nav-logo">${e((d.hero?.name || '').split(' ')[0]) || 'Portfolio'}</div>
        <div class="p-nav-links">
          ${navItems.map(item => `<a href="#${item.id}" class="p-nav-link">${item.label}</a>`).join('')}
        </div>
        <button class="p-nav-toggle" onclick="this.parentElement.parentElement.classList.toggle('mobile-open')">
          <i class="bi bi-list open"></i>
          <i class="bi bi-x close"></i>
        </button>
      </div>
      <div class="p-mobile-menu">
        ${navItems.map(item => `<a href="#${item.id}" class="p-mobile-link" onclick="this.parentElement.parentElement.classList.remove('mobile-open')">${item.label}</a>`).join('')}
      </div>
    </nav>`;

    // Hero Section
    h += `<section id="hero" class="p-hero ${isPreview?'':'scroll-reveal'}">
      <div class="p-container">
        ${d.hero?.photoUrl ? `<div class="p-avatar-wrap"><img src="${e(d.hero.photoUrl)}" class="p-avatar" alt="Profile"></div>` : ''}
        <h1 class="p-name">${e(d.hero?.name) || 'Your Name'}</h1>
        <p class="p-role">${e(d.hero?.role) || 'Your Professional Role'}</p>
        ${d.hero?.tagline ? `<p class="p-tagline">${e(d.hero.tagline)}</p>` : ''}
        <div class="p-hero-actions">
           <a href="#contact" class="p-btn p-btn-primary">Get in Touch</a>
           ${d.projects?.entries?.length ? `<a href="#projects" class="p-btn p-btn-outline">View Work</a>` : ''}
        </div>
      </div>
    </section>`;

    // About Section
    if(d.about?.text) {
      h += `<section id="about" class="p-section ${isPreview?'':'scroll-reveal'}">
        <div class="p-container">
          <h2 class="p-sec-title">About Me</h2>
          <div class="p-about-grid">
            <div class="p-about-text">${e(d.about.text)}</div>
            ${d.about.yearsExp || d.about.location ? `
            <div class="p-about-stats">
              ${d.about.yearsExp ? `<div class="p-stat"><span class="p-stat-val">${e(d.about.yearsExp)}+</span><span class="p-stat-lbl">Years Exp</span></div>` : ''}
              ${d.about.location ? `<div class="p-stat"><span class="p-stat-val">📍</span><span class="p-stat-lbl">${e(d.about.location)}</span></div>` : ''}
            </div>` : ''}
          </div>
        </div>
      </section>`;
    }

    // Skills Section
    if(d.skills?.text) {
      h += `<section id="skills" class="p-section ${isPreview?'':'scroll-reveal'}">
        <div class="p-container">
          <h2 class="p-sec-title">Skills & Expertise</h2>
          <div class="p-tags">
            ${d.skills.text.split(',').map(s => `<span class="p-tag">${e(s.trim())}</span>`).join('')}
          </div>
        </div>
      </section>`;
    }

    // Experience Section
    if(d.experience?.entries?.length) {
      h += `<section id="experience" class="p-section ${isPreview?'':'scroll-reveal'}">
        <div class="p-container">
          <h2 class="p-sec-title">Experience</h2>
          <div class="p-timeline">
            ${d.experience.entries.map(x => `
              <div class="p-timeline-item">
                <div class="p-timeline-dot"></div>
                <div class="p-card">
                  <div class="p-card-header">
                    <h3 class="p-card-title">${e(x.title)}</h3>
                    <span class="p-card-date">${e(x.dates)}</span>
                  </div>
                  <div class="p-card-subtitle">${e(x.company)}</div>
                  ${x.description ? `<p class="p-card-desc">${e(x.description)}</p>` : ''}
                </div>
              </div>`).join('')}
          </div>
        </div>
      </section>`;
    }

    // Timeline Section
    if(d.timeline?.entries?.length) {
      h += `<section id="timeline" class="p-section ${isPreview?'':'scroll-reveal'}">
        <div class="p-container">
          <h2 class="p-sec-title">Career Milestones</h2>
          <div class="p-milestones">
            ${d.timeline.entries.map(x => `
              <div class="p-milestone">
                <div class="p-milestone-year">${e(x.year)}</div>
                <div class="p-milestone-content">
                  <h3 class="p-milestone-title">${e(x.title)}</h3>
                  <p class="p-milestone-desc">${e(x.description)}</p>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </section>`;
    }

    // Projects Section
    if(d.projects?.entries?.length) {
      h += `<section id="projects" class="p-section ${isPreview?'':'scroll-reveal'}">
        <div class="p-container">
          <h2 class="p-sec-title">Featured Projects</h2>
          <div class="p-grid ${tpl === 'bento' ? 'p-bento-grid' : 'p-project-grid'}">
            ${d.projects.entries.map(x => `
              <div class="p-card p-project-card">
                ${x.imageUrl ? `<img src="${e(x.imageUrl)}" class="p-project-img" alt="${e(x.name)}">` : `<div class="p-project-img-placeholder"></div>`}
                <div class="p-project-content">
                  <h3 class="p-card-title">${e(x.name)}</h3>
                  ${x.description ? `<p class="p-card-desc">${e(x.description)}</p>` : ''}
                  ${x.tech ? `<div class="p-tags">${x.tech.split(',').map(t => `<span class="p-tag-sm">${e(t.trim())}</span>`).join('')}</div>` : ''}
                  <div class="p-project-links">
                    ${x.liveUrl ? `<a href="${e(x.liveUrl)}" target="_blank" class="p-link">🔗 Live</a>` : ''}
                    ${x.githubUrl ? `<a href="${e(x.githubUrl)}" target="_blank" class="p-link">💻 Source</a>` : ''}
                  </div>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </section>`;
    }

    // GitHub Sync Section
    if(d.github?.username) {
      h += `<section id="github_sync" class="p-section ${isPreview?'':'scroll-reveal'}">
        <div class="p-container">
          <h2 class="p-sec-title">Open Source Contributions</h2>
          <div class="p-grid p-project-grid p-github-grid" data-user="${e(d.github.username)}">
            <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--gray-500)">
              <div class="spinner" style="border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;width:24px;height:24px;animation:spin 1s linear infinite;margin:0 auto 12px;"></div>
              Fetching repositories...
            </div>
          </div>
        </div>
      </section>`;
    }

    // Education Section
    if(d.education?.entries?.length) {
      h += `<section id="education" class="p-section ${isPreview?'':'scroll-reveal'}">
        <div class="p-container">
          <h2 class="p-sec-title">Education</h2>
          <div class="p-grid p-edu-grid">
            ${d.education.entries.map(x => `
              <div class="p-card">
                <h3 class="p-card-title">${e(x.degree)}</h3>
                <div class="p-card-subtitle">${e(x.institution)}</div>
                <div class="p-card-meta">${e(x.dates)}</div>
              </div>`).join('')}
          </div>
        </div>
      </section>`;
    }

    // Certifications Section
    if(d.certifications?.entries?.length) {
      h += `<section id="certifications" class="p-section ${isPreview?'':'scroll-reveal'}">
        <div class="p-container">
          <h2 class="p-sec-title">Certifications</h2>
          <div class="p-grid p-cert-grid">
            ${d.certifications.entries.map(x => `
              <div class="p-card p-cert-card">
                <div class="p-cert-info">
                  <h3 class="p-card-title">${e(x.name)}</h3>
                  <div class="p-card-subtitle">${e(x.issuer)}</div>
                </div>
                ${x.url ? `<a href="${e(x.url)}" target="_blank" class="p-btn p-btn-sm p-btn-outline">View Certificate</a>` : ''}
              </div>`).join('')}
          </div>
        </div>
      </section>`;
    }

    // Testimonials
    if(d.testimonials?.entries?.length) {
      h += `<section id="testimonials" class="p-section ${isPreview?'':'scroll-reveal'}">
        <div class="p-container">
          <h2 class="p-sec-title">Testimonials</h2>
          <div class="p-grid p-testimonial-grid">
            ${d.testimonials.entries.map(x => `
              <div class="p-card p-testimonial-card">
                <p class="p-testimonial-quote">"${e(x.quote)}"</p>
                <div class="p-testimonial-author">
                  <strong>${e(x.author)}</strong>
                  <span>${e(x.role)}</span>
                </div>
              </div>`).join('')}
          </div>
        </div>
      </section>`;
    }

    // Contact Section
    h += `<section id="contact" class="p-section ${isPreview?'':'scroll-reveal'}">
      <div class="p-container">
        <h2 class="p-sec-title">Get In Touch</h2>
        <div class="p-contact-card p-card">
          <p class="p-contact-intro">I'm always open to new opportunities and collaborations. Feel free to reach out!</p>
          <div class="p-contact-links">
            ${d.contact?.email ? `<a href="mailto:${e(d.contact.email)}" class="p-contact-item">📧 Email</a>` : ''}
            ${d.contact?.phone ? `<a href="tel:${e(d.contact.phone)}" class="p-contact-item">📱 Phone</a>` : ''}
            ${d.contact?.linkedin ? `<a href="${e(d.contact.linkedin)}" target="_blank" class="p-contact-item">LinkedIn</a>` : ''}
            ${d.contact?.github ? `<a href="${e(d.contact.github)}" target="_blank" class="p-contact-item">GitHub</a>` : ''}
            ${d.contact?.twitter ? `<a href="${e(d.contact.twitter)}" target="_blank" class="p-contact-item">Twitter</a>` : ''}
            ${d.contact?.website ? `<a href="${e(d.contact.website)}" target="_blank" class="p-contact-item">Website</a>` : ''}
          </div>
        </div>
      </div>
    </section>`;

    // Footer
    h += `<footer class="p-footer">
      <div class="p-container">
        <p>&copy; ${new Date().getFullYear()} ${e(d.hero?.name) || 'Developer'}.</p>
        <p class="p-powered-by">Built with <a href="index.html">Syntax Syndicate</a></p>
      </div>
    </footer>`;

    h += `</div>`;
    return h;
  },

  async autoFill(profile, user){
    if(!profile) return;
    this.data.hero.name = profile.name || '';
    this.data.hero.role = profile.headline || '';
    this.data.about.text = profile.bio || '';
    this.data.about.location = profile.location || '';
    this.data.contact.email = user?.email || '';
    this.data.contact.phone = profile.mobile || '';
    this.data.contact.linkedin = profile.linkedin || '';
    this.data.contact.github = profile.github || '';
    this.data.hero.photoUrl = profile.avatar_url || '';
    this.data.contact.website = profile.portfolio_link || '';
    this.data.skills.text = profile.skills || '';
    this.renderSections();
    this.renderPreview();
    SS.showToast('Profile data loaded!','success');
  },

  useProfilePhoto(){
    if(window._profile && window._profile.avatar_url){
      const url = window._profile.avatar_url;
      this.setField('hero','photoUrl',url);
      const input = document.getElementById('heroPhotoInput');
      if(input) input.value = url;
      const preview = document.getElementById('pbHeroPhotoPreview');
      if(preview) preview.innerHTML = `<img src="${this.esc(url)}" style="width:100%;height:100%;object-fit:cover;">`;
      SS.showToast('Using profile photo','success');
    } else {
      SS.showToast('No profile photo found','error');
    }
  },

  async save(){
    if(!this.uid){SS.showToast('Please log in','error');return;}
    try{
      await DB.savePortfolio(this.uid,{data:this.data,template:this.template,is_published:this.isPublished});
      SS.showToast('Portfolio saved!','success');
    }catch(e){console.error(e);SS.showToast('Failed to save','error');}
  },

  async load(){
    if(!this.uid) return;
    try{
      const doc=await DB.getPortfolio(this.uid);
      if(doc&&doc.data){this.data=doc.data;this.template=doc.template||'midnight';this.isPublished=!!doc.is_published;this.renderTemplateSelector();this.renderSections();this.renderPreview();this.updatePublishUI();}
    }catch(e){console.error(e);}
  },

  async togglePublish(){
    this.isPublished=!this.isPublished;
    this.updatePublishUI();
    if(this.uid){
      try{await DB.publishPortfolio(this.uid,this.isPublished);SS.showToast(this.isPublished?'Portfolio published!':'Portfolio unpublished','success');}catch(e){SS.showToast('Error updating','error');}
    }
  },

  updatePublishUI(){
    const sw=document.getElementById('publishSwitch');
    const link=document.getElementById('portfolioLink');
    if(sw){sw.className='pb-switch'+(this.isPublished?' on':'');}
    if(link){
      const baseUrl = window.location.href.split('?')[0].split('#')[0].replace('portfolio-builder.html', '');
      link.value=this.isPublished?baseUrl+'portfolio.html?uid='+this.uid:'Not published';
      link.style.display=this.isPublished?'block':'none';
    }
  },

  initGithubSync(){
    document.querySelectorAll('.p-github-grid[data-user]').forEach(el => {
      const user = el.getAttribute('data-user');
      if(el.dataset.fetched === user) return;
      el.dataset.fetched = user;
      fetch(`https://api.github.com/users/${user}/repos?sort=updated&per_page=6`)
        .then(res => res.json())
        .then(repos => {
          if(!Array.isArray(repos) || repos.length === 0) { el.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--gray-500)">No public repositories found.</div>'; return; }
          el.innerHTML = repos.filter(r=>!r.fork).slice(0,6).map(r => `
            <a href="${r.html_url}" target="_blank" class="p-card p-project-card" style="text-decoration:none;">
              <div class="p-project-content">
                <h3 class="p-card-title" style="display:flex;align-items:center;gap:8px"><i class="bi bi-github"></i> ${r.name}</h3>
                <p class="p-card-desc" style="margin-top:12px;flex:1">${r.description || 'No description available'}</p>
                <div style="display:flex;gap:12px;margin-top:20px;font-size:0.85rem;color:var(--gray-600);font-weight:600">
                  <span>⭐ ${r.stargazers_count}</span>
                  <span><i class="bi bi-circle-fill" style="color:var(--accent);font-size:0.5rem;vertical-align:middle;margin-right:4px;margin-top:-2px;display:inline-block"></i>${r.language || 'Code'}</span>
                </div>
              </div>
            </a>
          `).join('');
        }).catch(err => {
          el.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--gray-500)">Failed to load repositories.</div>';
        });
    });
  }
};
window.PB=PB;
