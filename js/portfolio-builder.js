/* ═══════════════════════════════════════
   PORTFOLIO BUILDER ENGINE
   ═══════════════════════════════════════ */
const PB = {
  data: { hero:{name:'',role:'',tagline:'',photoUrl:''}, about:{text:'',yearsExp:'',location:''}, skills:{text:''}, experience:{entries:[]}, timeline:{entries:[]}, projects:{entries:[]}, education:{entries:[]}, certifications:{entries:[]}, testimonials:{entries:[]}, contact:{email:'',phone:'',linkedin:'',github:'',twitter:'',website:''}, custom:{title:'',text:''} },
  template: 'midnight',
  uid: null,
  isPublished: false,

  TEMPLATES: [
    {id:'midnight',name:'Midnight',icon:'🌙', sections:['hero','about','skills','experience','timeline','projects','education','certifications','testimonials','contact','custom']},
    {id:'daylight',name:'Daylight',icon:'☀️', sections:['hero','about','skills','experience','timeline','projects','education','certifications','testimonials','contact','custom']},
    {id:'gradient',name:'Gradient',icon:'🎨', sections:['hero','about','skills','experience','timeline','projects','education','certifications','testimonials','contact','custom']},
    {id:'terminal',name:'Terminal',icon:'💻', sections:['hero','skills','projects','certifications','contact']},
    {id:'bento',name:'Bento',icon:'🧱', sections:['hero','skills','projects','education','certifications','testimonials','contact']},
    {id:'elegant',name:'Elegant',icon:'✨', sections:['hero','about','experience','timeline','education','certifications','contact']}
  ],

  SECTIONS: [
    {key:'hero',label:'Hero / Header',emoji:'👤'},
    {key:'about',label:'About Me',emoji:'📝'},
    {key:'skills',label:'Skills & Tech Stack',emoji:'⚡'},
    {key:'experience',label:'Work Experience',emoji:'💼'},
    {key:'timeline',label:'Career Timeline',emoji:'⏳'},
    {key:'projects',label:'Projects',emoji:'🚀'},
    {key:'education',label:'Education',emoji:'🎓'},
    {key:'certifications',label:'Certifications',emoji:'📜'},
    {key:'testimonials',label:'Testimonials',emoji:'💬'},
    {key:'contact',label:'Contact & Social',emoji:'📧'},
    {key:'custom',label:'Custom Section',emoji:'✏️'}
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
      <div class="pb-sec-head" onclick="PB.toggleSec('${s.key}')"><span class="pb-sec-label">${s.emoji} ${s.label}</span><span class="pb-sec-toggle">▼</span></div>
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
      case 'hero': return `<div class="pb-row">${F('name','Full Name')}${F('role','Role / Title')}</div>${F('tagline','Tagline','textarea')}${F('photoUrl','Photo URL')}`;
      case 'about': return `${F('text','Bio / About Me','textarea')}<div class="pb-row">${F('yearsExp','Years of Experience')}${F('location','Location')}</div>`;
      case 'skills': return F('text','Skills (comma separated or grouped)','textarea');
      case 'contact': return `<div class="pb-row">${F('email','Email')}${F('phone','Phone')}</div><div class="pb-row">${F('linkedin','LinkedIn')}${F('github','GitHub')}</div><div class="pb-row">${F('twitter','Twitter/X')}${F('website','Website')}</div>`;
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

  getFieldVal(key,field){ return this.data[key]?.[field] || ''; },
  setField(key,field,val){ if(!this.data[key])this.data[key]={};this.data[key][field]=val;this.renderPreview(); },
  updateEntry(key,i,field,val){ if(this.data[key]?.entries?.[i])this.data[key].entries[i][field]=val;this.renderPreview(); },
  addEntry(key){ if(!this.data[key])this.data[key]={entries:[]};if(!this.data[key].entries)this.data[key].entries=[];
    const empty={experience:{title:'',company:'',dates:'',description:''},timeline:{year:'',title:'',description:''},projects:{name:'',tech:'',description:'',liveUrl:'',githubUrl:'',imageUrl:''},education:{degree:'',institution:'',dates:''},certifications:{name:'',issuer:'',url:''},testimonials:{quote:'',author:'',role:''}};
    this.data[key].entries.push(empty[key]||{});this.renderSections();this.renderPreview();
  },
  removeEntry(key,i){ this.data[key].entries.splice(i,1);this.renderSections();this.renderPreview(); },
  esc(s){ return (s||'').replace(/"/g,'&quot;'); },

  renderPreview(){
    const frame=document.getElementById('pbPreview');
    if(!frame)return;
    frame.innerHTML = PB.generatePortfolioHTML(this.data, this.template, true);
  },

  generatePortfolioHTML(d, tpl, isPreview){
    const e=s=>{if(!s)return'';const el=document.createElement('div');el.textContent=s;return el.innerHTML;};
    
    // Navigation items based on available data
    const navItems = [
      {id:'hero', label:'Home'},
      d.about?.text ? {id:'about', label:'About'} : null,
      d.skills?.text ? {id:'skills', label:'Skills'} : null,
      d.projects?.entries?.length ? {id:'projects', label:'Projects'} : null,
      d.experience?.entries?.length ? {id:'experience', label:'Experience'} : null,
      d.timeline?.entries?.length ? {id:'timeline', label:'Timeline'} : null,
      d.education?.entries?.length ? {id:'education', label:'Education'} : null,
      d.certifications?.entries?.length ? {id:'certifications', label:'Certifications'} : null,
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
    this.data.contact.website = profile.portfolio_link || '';
    this.data.skills.text = profile.skills || '';
    this.renderSections();
    this.renderPreview();
    SS.showToast('Profile data loaded!','success');
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
    if(link){link.value=this.isPublished?window.location.origin+'/portfolio.html?uid='+this.uid:'Not published';link.style.display=this.isPublished?'block':'none';}
  }
};
window.PB=PB;
