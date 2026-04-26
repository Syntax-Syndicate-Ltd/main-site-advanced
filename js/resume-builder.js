/* ═══════════════════════════════════════
   RESUME BUILDER ENGINE
   ═══════════════════════════════════════ */

const RB = {
  sections: [],
  template: 'minimal',
  uid: null,

  SECTION_DEFS: {
    contact:      { label:'Contact & Header', icon:'bi-person-vcard', single:true },
    summary:      { label:'Professional Summary', icon:'bi-file-text', single:true },
    education:    { label:'Education', icon:'bi-mortarboard', multi:true },
    experience:   { label:'Work Experience', icon:'bi-briefcase', multi:true },
    projects:     { label:'Projects', icon:'bi-rocket-takeoff', multi:true },
    skills:       { label:'Technical Skills', icon:'bi-lightning-charge', single:true },
    certifications:{ label:'Certifications', icon:'bi-patch-check', multi:true },
    awards:       { label:'Awards & Achievements', icon:'bi-trophy', multi:true },
    publications: { label:'Publications & Research', icon:'bi-journal-text', multi:true },
    volunteer:    { label:'Volunteer Experience', icon:'bi-heart', multi:true },
    languages:    { label:'Languages', icon:'bi-translate', multi:true },
    extracurricular:{ label:'Extracurriculars', icon:'bi-bullseye', multi:true },
    references:   { label:'References', icon:'bi-people', multi:true },
    hobbies:      { label:'Hobbies & Interests', icon:'bi-palette', single:true },
    custom:       { label:'Custom Section', icon:'bi-pencil-square', single:true }
  },

  TEMPLATES: [
    { id:'minimal', name:'Minimal', icon:'bi-file-earmark' },
    { id:'modern', name:'Modern', icon:'bi-gem' },
    { id:'executive', name:'Executive', icon:'bi-person-badge' },
    { id:'twocol', name:'Two-Col', icon:'bi-columns-gap' },
    { id:'creative', name:'Creative', icon:'bi-palette2' },
    { id:'developer', name:'Developer', icon:'bi-code-slash' },
    { id:'compact', name:'Compact', icon:'bi-distribute-vertical' },
    { id:'professional', name:'Pro', icon:'bi-star-fill' }
  ],

  init() {
    this.renderTemplateSelector();
    this.sections = [
      { type:'contact', id:this.genId(), data:{ name:'',email:'',phone:'',linkedin:'',github:'',portfolio:'',location:'' }},
      { type:'summary', id:this.genId(), data:{ text:'' }},
      { type:'education', id:this.genId(), data:{ entries:[{ degree:'',institution:'',dates:'',gpa:'',description:'' }]}},
      { type:'experience', id:this.genId(), data:{ entries:[{ title:'',company:'',dates:'',location:'',bullets:'' }]}},
      { type:'skills', id:this.genId(), data:{ text:'' }},
    ];
    this.renderSections();
    this.renderPreview();
  },

  genId(){ return 'sec_'+Math.random().toString(36).substr(2,9); },

  renderTemplateSelector(){
    const g = document.getElementById('tplGrid');
    g.innerHTML = this.TEMPLATES.map(t =>
      `<div class="rb-tpl-item ${t.id===this.template?'active':''}" data-tpl="${t.id}">
        <div class="rb-tpl-icon"><i class="bi ${t.icon}"></i></div>${t.name}
      </div>`
    ).join('');
    g.querySelectorAll('.rb-tpl-item').forEach(el => {
      el.onclick = () => {
        this.template = el.dataset.tpl;
        g.querySelectorAll('.rb-tpl-item').forEach(e=>e.classList.remove('active'));
        el.classList.add('active');
        this.renderPreview();
      };
    });
  },

  showPicker(){
    const overlay = document.getElementById('sectionPicker');
    const grid = overlay.querySelector('.rb-picker-grid');
    const used = this.sections.map(s=>s.type);
    grid.innerHTML = Object.entries(this.SECTION_DEFS).map(([k,v])=>{
      const dis = used.includes(k) && k!=='custom' ? 'disabled' : '';
      return `<div class="rb-picker-item ${dis}" data-type="${k}">
        <span class="rb-picker-emoji"><i class="bi ${v.icon}"></i></span>
        <span class="rb-picker-name">${v.label}</span>
      </div>`;
    }).join('');
    grid.querySelectorAll('.rb-picker-item:not(.disabled)').forEach(el => {
      el.onclick = () => { this.addSection(el.dataset.type); overlay.classList.remove('active'); };
    });
    overlay.classList.add('active');
  },

  closePicker(){ document.getElementById('sectionPicker').classList.remove('active'); },

  addSection(type){
    const def = this.SECTION_DEFS[type];
    let data = {};
    if(type==='contact') data={name:'',email:'',phone:'',linkedin:'',github:'',portfolio:'',location:''};
    else if(type==='summary'||type==='hobbies') data={text:''};
    else if(type==='skills') data={text:''};
    else if(type==='custom') data={title:'',text:''};
    else if(def.multi) data={entries:[this.emptyEntry(type)]};
    this.sections.push({ type, id:this.genId(), data });
    this.renderSections();
    this.renderPreview();
  },

  emptyEntry(type){
    const map = {
      education:{ degree:'',institution:'',dates:'',gpa:'',description:'' },
      experience:{ title:'',company:'',dates:'',location:'',bullets:'' },
      projects:{ name:'',tech:'',description:'',links:'' },
      certifications:{ name:'',issuer:'',date:'',credentialId:'' },
      awards:{ title:'',issuer:'',date:'',description:'' },
      publications:{ title:'',journal:'',date:'',doi:'' },
      volunteer:{ role:'',org:'',dates:'',description:'' },
      languages:{ language:'',proficiency:'' },
      extracurricular:{ activity:'',role:'',dates:'',description:'' },
      references:{ name:'',title:'',company:'',contact:'' }
    };
    return map[type] || {};
  },

  removeSection(id){
    this.sections = this.sections.filter(s=>s.id!==id);
    this.renderSections();
    this.renderPreview();
  },

  renderSections(){
    const c = document.getElementById('sectionsList');
    c.innerHTML = this.sections.map((sec,idx) => {
      const def = this.SECTION_DEFS[sec.type];
      return `<div class="rb-sec open" data-id="${sec.id}">
        <div class="rb-sec-head" onclick="RB.toggleSec('${sec.id}')">
          <span class="rb-sec-drag" draggable="true" ondragstart="RB.dragStart(event,'${sec.id}')" ondragover="event.preventDefault()" ondrop="RB.drop(event,'${sec.id}')">⠿</span>
          <span class="rb-sec-label"><i class="bi ${def.icon}" style="margin-right:8px;font-size:0.9rem;"></i> ${def.label}</span>
          <span class="rb-sec-del" onclick="event.stopPropagation();RB.removeSection('${sec.id}')">✕</span>
          <span class="rb-sec-toggle">▼</span>
        </div>
        <div class="rb-sec-body">${this.renderFields(sec)}</div>
      </div>`;
    }).join('');
  },

  toggleSec(id){
    const el = document.querySelector(`.rb-sec[data-id="${id}"]`);
    if(el) el.classList.toggle('open');
  },

  draggedId:null,
  dragStart(e,id){ this.draggedId=id; e.dataTransfer.effectAllowed='move'; },
  drop(e,targetId){
    e.preventDefault();
    if(!this.draggedId||this.draggedId===targetId) return;
    const fi = this.sections.findIndex(s=>s.id===this.draggedId);
    const ti = this.sections.findIndex(s=>s.id===targetId);
    const [item] = this.sections.splice(fi,1);
    this.sections.splice(ti,0,item);
    this.draggedId=null;
    this.renderSections();
    this.renderPreview();
  },

  renderFields(sec){
    const t=sec.type, d=sec.data, id=sec.id;
    if(t==='contact') return this.fieldGrid(id,[
      ['name','Full Name'],['email','Email'],['phone','Phone'],['location','Location'],
      ['linkedin','LinkedIn URL'],['github','GitHub URL'],['portfolio','Portfolio URL']
    ],d);
    if(t==='summary') return `<div class="rb-fg"><label class="rb-fl">Professional Summary</label><textarea class="rb-fi" oninput="RB.updateField('${id}','text',this.value)">${d.text||''}</textarea></div>`;
    if(t==='skills') return `<div class="rb-fg"><label class="rb-fl">Skills (comma separated or grouped with colon, e.g. "Languages: JS, Python")</label><textarea class="rb-fi" oninput="RB.updateField('${id}','text',this.value)">${d.text||''}</textarea></div>`;
    if(t==='hobbies') return `<div class="rb-fg"><label class="rb-fl">Hobbies (comma separated)</label><textarea class="rb-fi" oninput="RB.updateField('${id}','text',this.value)">${d.text||''}</textarea></div>`;
    if(t==='custom') return `<div class="rb-fg"><label class="rb-fl">Section Title</label><input class="rb-fi" value="${d.title||''}" oninput="RB.updateField('${id}','title',this.value)"></div><div class="rb-fg"><label class="rb-fl">Content</label><textarea class="rb-fi" oninput="RB.updateField('${id}','text',this.value)">${d.text||''}</textarea></div>`;
    // Multi-entry sections
    const fields = this.entryFields(t);
    return (d.entries||[]).map((entry,ei) =>
      `<div class="rb-entry">
        <span class="rb-entry-del" onclick="RB.removeEntry('${id}',${ei})">✕</span>
        ${fields.map(([k,l]) =>
          `<div class="rb-fg"><label class="rb-fl">${l}</label>${
            k==='bullets'||k==='description'
              ? `<textarea class="rb-fi" oninput="RB.updateEntry('${id}',${ei},'${k}',this.value)">${entry[k]||''}</textarea>`
              : `<input class="rb-fi" value="${this.escAttr(entry[k]||'')}" oninput="RB.updateEntry('${id}',${ei},'${k}',this.value)">`
          }</div>`
        ).join('')}
      </div>`
    ).join('') + `<div class="rb-add-entry" onclick="RB.addEntry('${id}')">+ Add Entry</div>`;
  },

  entryFields(t){
    const m = {
      education:[['degree','Degree / Program'],['institution','Institution'],['dates','Dates'],['gpa','GPA'],['description','Description']],
      experience:[['title','Job Title'],['company','Company'],['dates','Dates'],['location','Location'],['bullets','Description / Bullet Points']],
      projects:[['name','Project Name'],['tech','Tech Stack'],['description','Description'],['links','Links']],
      certifications:[['name','Certification Name'],['issuer','Issuing Organization'],['date','Date'],['credentialId','Credential ID']],
      awards:[['title','Award Title'],['issuer','Issuing Organization'],['date','Date'],['description','Description']],
      publications:[['title','Title'],['journal','Journal / Conference'],['date','Date'],['doi','DOI / Link']],
      volunteer:[['role','Role'],['org','Organization'],['dates','Dates'],['description','Description']],
      languages:[['language','Language'],['proficiency','Proficiency Level']],
      extracurricular:[['activity','Activity'],['role','Role / Position'],['dates','Dates'],['description','Description']],
      references:[['name','Name'],['title','Title / Position'],['company','Company'],['contact','Contact Info']]
    };
    return m[t]||[];
  },

  fieldGrid(id,fields,data){
    return `<div class="rb-row">${fields.map(([k,l])=>
      `<div class="rb-fg"><label class="rb-fl">${l}</label><input class="rb-fi" value="${this.escAttr(data[k]||'')}" oninput="RB.updateField('${id}','${k}',this.value)"></div>`
    ).join('')}</div>`;
  },

  escAttr(s){ return (s||'').replace(/"/g,'&quot;'); },

  updateField(secId,field,val){
    const sec = this.sections.find(s=>s.id===secId);
    if(sec){ sec.data[field]=val; this.renderPreview(); }
  },

  updateEntry(secId,idx,field,val){
    const sec = this.sections.find(s=>s.id===secId);
    if(sec&&sec.data.entries&&sec.data.entries[idx]){ sec.data.entries[idx][field]=val; this.renderPreview(); }
  },

  addEntry(secId){
    const sec = this.sections.find(s=>s.id===secId);
    if(sec&&sec.data.entries){ sec.data.entries.push(this.emptyEntry(sec.type)); this.renderSections(); }
  },

  removeEntry(secId,idx){
    const sec = this.sections.find(s=>s.id===secId);
    if(sec&&sec.data.entries){ sec.data.entries.splice(idx,1); this.renderSections(); this.renderPreview(); }
  },

  /* ── PREVIEW RENDERER ── */
  renderPreview(){
    const paper = document.getElementById('resumePaper');
    if(!paper) return;
    const tpl = this.template;
    let html = `<div class="rb-resume tpl-${tpl}">`;

    for(const sec of this.sections){
      const d = sec.data;
      switch(sec.type){
        case 'contact':
          html += `<div class="r-header">
            <div class="r-name">${this.esc(d.name)||'Your Name'}</div>
            <div class="r-contact">${[d.email,d.phone,d.location,d.linkedin,d.github,d.portfolio].filter(Boolean).join(' · ')}</div>
          </div>`;
          break;
        case 'summary':
          if(d.text) html += `<div class="r-section"><div class="r-sec-title">Professional Summary</div><div class="r-desc">${this.esc(d.text)}</div></div>`;
          break;
        case 'education':
          if(d.entries?.length) html += `<div class="r-section"><div class="r-sec-title">Education</div>${d.entries.map(e=>
            `<div class="r-item"><div class="r-item-title">${this.esc(e.degree)}</div><div class="r-item-meta"><span>${this.esc(e.institution)}</span><span>${this.esc(e.dates)}</span></div>${e.gpa?`<div class="r-desc">GPA: ${this.esc(e.gpa)}</div>`:''}${e.description?`<div class="r-desc">${this.esc(e.description)}</div>`:''}</div>`
          ).join('')}</div>`;
          break;
        case 'experience':
          if(d.entries?.length) html += `<div class="r-section"><div class="r-sec-title">Work Experience</div>${d.entries.map(e=>
            `<div class="r-item"><div class="r-item-title">${this.esc(e.title)}</div><div class="r-item-meta"><span>${this.esc(e.company)}${e.location?' — '+this.esc(e.location):''}</span><span>${this.esc(e.dates)}</span></div>${e.bullets?`<div class="r-desc">${this.esc(e.bullets)}</div>`:''}</div>`
          ).join('')}</div>`;
          break;
        case 'projects':
          if(d.entries?.length) html += `<div class="r-section"><div class="r-sec-title">Projects</div>${d.entries.map(e=>
            `<div class="r-item"><div class="r-item-title">${this.esc(e.name)}${e.tech?' <span style="font-weight:400;color:#666;font-size:.8rem"> | '+this.esc(e.tech)+'</span>':''}</div>${e.description?`<div class="r-desc">${this.esc(e.description)}</div>`:''}${e.links?`<div class="r-desc" style="font-size:.75rem;color:var(--accent)">${this.esc(e.links)}</div>`:''}</div>`
          ).join('')}</div>`;
          break;
        case 'skills':
          if(d.text) html += `<div class="r-section"><div class="r-sec-title">Technical Skills</div><div class="r-skills-grid">${d.text.split(',').map(s=>`<span class="r-skill-tag">${this.esc(s.trim())}</span>`).join('')}</div></div>`;
          break;
        case 'certifications':
          if(d.entries?.length) html += `<div class="r-section"><div class="r-sec-title">Certifications</div>${d.entries.map(e=>
            `<div class="r-item"><div class="r-item-title">${this.esc(e.name)}</div><div class="r-item-meta"><span>${this.esc(e.issuer)}</span><span>${this.esc(e.date)}</span></div>${e.credentialId?`<div class="r-desc">ID: ${this.esc(e.credentialId)}</div>`:''}</div>`
          ).join('')}</div>`;
          break;
        case 'awards':
          if(d.entries?.length) html += `<div class="r-section"><div class="r-sec-title">Awards & Achievements</div>${d.entries.map(e=>
            `<div class="r-item"><div class="r-item-title">${this.esc(e.title)}</div><div class="r-item-meta"><span>${this.esc(e.issuer)}</span><span>${this.esc(e.date)}</span></div>${e.description?`<div class="r-desc">${this.esc(e.description)}</div>`:''}</div>`
          ).join('')}</div>`;
          break;
        case 'publications':
          if(d.entries?.length) html += `<div class="r-section"><div class="r-sec-title">Publications</div>${d.entries.map(e=>
            `<div class="r-item"><div class="r-item-title">${this.esc(e.title)}</div><div class="r-item-meta"><span>${this.esc(e.journal)}</span><span>${this.esc(e.date)}</span></div>${e.doi?`<div class="r-desc">${this.esc(e.doi)}</div>`:''}</div>`
          ).join('')}</div>`;
          break;
        case 'volunteer':
          if(d.entries?.length) html += `<div class="r-section"><div class="r-sec-title">Volunteer Experience</div>${d.entries.map(e=>
            `<div class="r-item"><div class="r-item-title">${this.esc(e.role)}</div><div class="r-item-meta"><span>${this.esc(e.org)}</span><span>${this.esc(e.dates)}</span></div>${e.description?`<div class="r-desc">${this.esc(e.description)}</div>`:''}</div>`
          ).join('')}</div>`;
          break;
        case 'languages':
          if(d.entries?.length) html += `<div class="r-section"><div class="r-sec-title">Languages</div><div class="r-skills-grid">${d.entries.map(e=>`<span class="r-skill-tag">${this.esc(e.language)}${e.proficiency?' — '+this.esc(e.proficiency):''}</span>`).join('')}</div></div>`;
          break;
        case 'extracurricular':
          if(d.entries?.length) html += `<div class="r-section"><div class="r-sec-title">Extracurricular Activities</div>${d.entries.map(e=>
            `<div class="r-item"><div class="r-item-title">${this.esc(e.activity)}</div><div class="r-item-meta"><span>${this.esc(e.role)}</span><span>${this.esc(e.dates)}</span></div>${e.description?`<div class="r-desc">${this.esc(e.description)}</div>`:''}</div>`
          ).join('')}</div>`;
          break;
        case 'references':
          if(d.entries?.length) html += `<div class="r-section"><div class="r-sec-title">References</div>${d.entries.map(e=>
            `<div class="r-item"><div class="r-item-title">${this.esc(e.name)}</div><div class="r-item-meta"><span>${this.esc(e.title)}${e.company?', '+this.esc(e.company):''}</span></div>${e.contact?`<div class="r-desc">${this.esc(e.contact)}</div>`:''}</div>`
          ).join('')}</div>`;
          break;
        case 'hobbies':
          if(d.text) html += `<div class="r-section"><div class="r-sec-title">Hobbies & Interests</div><div class="r-desc">${this.esc(d.text)}</div></div>`;
          break;
        case 'custom':
          if(d.text) html += `<div class="r-section"><div class="r-sec-title">${this.esc(d.title||'Custom Section')}</div><div class="r-desc">${this.esc(d.text)}</div></div>`;
          break;
      }
    }
    html += '</div>';
    paper.innerHTML = html;
  },

  esc(s){ if(!s) return ''; const d=document.createElement('div'); d.textContent=s; return d.innerHTML; },

  /* ── SAVE / LOAD ── */
  async save(){
    if(!this.uid){ SS.showToast('Please log in first','error'); return; }
    try{
      await DB.saveResume(this.uid, { sections:this.sections, template:this.template });
      SS.showToast('Resume saved!','success');
    }catch(e){ console.error(e); SS.showToast('Failed to save','error'); }
  },

  async load(){
    if(!this.uid) return;
    try{
      const data = await DB.getResume(this.uid);
      if(data && data.sections){
        this.sections = data.sections;
        this.template = data.template || 'minimal';
        this.renderTemplateSelector();
        this.renderSections();
        this.renderPreview();
        SS.showToast('Resume loaded!','success');
      }
    }catch(e){ console.error(e); }
  },

  printResume(){ window.print(); }
};

window.RB = RB;
