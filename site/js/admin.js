import {api} from './api.js';
import {starterSettings} from './data.js';
import {$,$$,escapeHTML,safeUrl,imageSrc,toast,list} from './utils.js';
const data={projects:[],inquiries:[],settings:structuredClone(starterSettings),tab:'overview'};
const contactDigits=v=>String(v||'').replace(/[^0-9]/g,'');
const whatsappNumber=v=>{const raw=String(v||'').trim(),n=contactDigits(raw);return raw.startsWith('+')&&n.length>=8&&n.length<=15?n:'';};
const ownWhatsAppNumber=v=>{const n=contactDigits(v);return n.length===10?'91'+n:n;};
const form=$('#project-form'),dialog=$('#project-dialog');
function switchTab(name){data.tab=name;$$('[data-tab]').forEach(x=>x.classList.toggle('active',x.dataset.tab===name));$$('.admin-tab').forEach(x=>x.hidden=x.id!==`tab-${name}`);$('#admin-heading').textContent={overview:'Overview',projects:'Your projects',settings:'Profile & settings',inquiries:'Client inquiries',backup:'Setup & backup'}[name]||'Dashboard';$('.admin-sidebar').classList.remove('mobile-open');if(name==='inquiries')loadInquiries();}
function showDashboard(){ $('#login-view').hidden=true;$('#admin-view').hidden=false;$('#connection-status').textContent=api.connected?(api.provider==='Firebase'?'FIREBASE CONNECTED':'SUPABASE CONNECTED'):'LOCAL PREVIEW';$('#preview-banner').hidden=api.connected;$('#preview-tools').hidden=api.connected;$('#backup-nav').hidden=false;switchTab('overview');refresh();}
function showLogin(message=''){ $('#admin-view').hidden=true;$('#login-view').hidden=false;$('#login-status').textContent=message;}
async function refresh(){try{[data.projects,data.settings]=await Promise.all([api.projects({all:true}),api.settings()]);drawProjects();fillSettings();updateOverview();loadInquiries();}catch(err){toast(err.message,'error');}}
function updateOverview(){const published=data.projects.filter(x=>x.published).length;
 $('#overview-published').textContent=published;$('#overview-drafts').textContent=data.projects.length-published;
 const em=data.settings.email||starterSettings.email,ph=ownWhatsAppNumber(data.settings.phone||starterSettings.phone);
 $('#owner-email-link').textContent=em+' ↗';$('#owner-email-link').href='mailto:'+encodeURIComponent(em);
 $('#owner-whatsapp-link').href=ph?'https://wa.me/'+ph:'#';$('#owner-whatsapp-link').hidden=!ph;
 const preview=$('#profile-preview');preview.innerHTML=data.settings.profile_image?`<img src="${escapeHTML(imageSrc(data.settings.profile_image))}" alt="Profile photo preview">`:'<span>S.</span>';
}
function drawProjects(){const published=data.projects.filter(x=>x.published).length;$('#stat-published').textContent=published;$('#stat-drafts').textContent=data.projects.length-published;$('#stat-featured').textContent=data.projects.filter(x=>x.featured).length;const q=$('#project-search').value.toLowerCase();const rows=data.projects.filter(x=>`${x.title} ${x.category}`.toLowerCase().includes(q));$('#project-rows').innerHTML=rows.length?rows.map(p=>`<tr><td><div class="table-project"><img src="${escapeHTML(imageSrc(p.hero_image))}" alt=""><div><strong>${escapeHTML(p.title)}</strong><small>${escapeHTML(p.project_type||'')} · ${escapeHTML(p.year||'')}</small></div></div></td><td>${escapeHTML(p.category||'—')}</td><td><span class="status-pill ${p.published?'published':'draft'}">${p.published?'Published':'Draft'}</span></td><td>${Number(p.sort_order)||0}</td><td><div class="row-actions"><button type="button" data-action="edit" data-id="${escapeHTML(p.id)}">Edit</button><button type="button" class="delete" data-action="delete" data-id="${escapeHTML(p.id)}">Delete</button></div></td></tr>`).join(''):'<tr><td colspan="5" class="empty-table">No projects found. Click “Add project” to create your first case study.</td></tr>';}
function fillSettings(){const f=$('#settings-form');f.elements.namedItem('remove_photo').checked=false;Object.entries(data.settings).forEach(([key,value])=>{if(['skills','services'].includes(key))return;const field=f.elements.namedItem(key);if(!field)return;if(field.type==='checkbox')field.checked=Boolean(value);else field.value=String(value??'');});f.elements.namedItem('skills').value=list(data.settings.skills).join('\n');f.elements.namedItem('services').value=list(data.settings.services).map(x=>`${x.title} | ${x.desc}`).join('\n');}
function openEditor(project=null){form.reset();const p=project||{id:'',title:'',slug:'',category:'',summary:'',description:'',hero_image:'',gallery:[],stack:[],features:[],year:String(new Date().getFullYear()),project_type:'Personal project',demo_url:'',github_url:'',featured:false,published:true,sort_order:data.projects.length};
 $('#editor-title').textContent=project?'Edit project':'New project';['id','title','slug','category','summary','description','hero_image','year','project_type','demo_url','github_url','sort_order'].forEach(key=>form.elements.namedItem(key).value=String(p[key]??''));
 ['gallery','stack','features'].forEach(key=>form.elements.namedItem(key).value=list(p[key]).join('\n'));
 form.elements.namedItem('featured').checked=!!p.featured;form.elements.namedItem('published').checked=!!p.published;
 $('#project-save-status').textContent='';$('#cover-preview').innerHTML=p.hero_image?`<img src="${escapeHTML(imageSrc(p.hero_image))}" alt="Current project cover">`:'';dialog.showModal();}
function slugify(text){return String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');}
async function saveProject(e){
 e.preventDefault();
 const f=new FormData(form);
 const id=String(f.get('id')||'')||crypto.randomUUID();
 // Keep the same ID if a write times out, so a retry updates rather than duplicates.
 form.elements.namedItem('id').value=id;
 const title=String(f.get('title')||'').trim();
 const slug=slugify(f.get('slug'));
 if(!slug){toast('A valid URL slug is required','error');return;}
 if(data.projects.some(x=>x.slug===slug&&x.id!==id)){toast('This project URL slug is already used','error');return;}
 const lines=k=>String(f.get(k)||'').split('\n').map(x=>x.trim()).filter(Boolean);
 const project={id,title,slug,category:String(f.get('category')||'').trim(),summary:String(f.get('summary')||'').trim(),description:String(f.get('description')||'').trim(),hero_image:String(f.get('hero_image')||'').trim(),gallery:lines('gallery').filter(safeUrl),stack:lines('stack'),features:lines('features'),year:String(f.get('year')||''),project_type:String(f.get('project_type')||'Personal project'),demo_url:String(f.get('demo_url')||'').trim(),github_url:String(f.get('github_url')||'').trim(),sort_order:Number(f.get('sort_order'))||0,featured:f.get('featured')==='on',published:f.get('published')==='on'};
 for(const key of ['demo_url','github_url'])if(project[key]&&!safeUrl(project[key])){toast('Please use a valid https:// URL','error');return;}
 const file=form.elements.namedItem('coverFile').files?.[0];
 const galleryFiles=[...form.elements.namedItem('galleryFiles').files];
 const button=$('#save-project');
 const status=$('#project-save-status');
 button.disabled=true;
 status.textContent='Preparing project…';
 try{
   if(file||galleryFiles.length){
     try{
       if(file){
         status.textContent='Uploading cover photo…';
         project.hero_image=await api.uploadImage(file,pct=>{status.textContent=`Uploading cover photo… ${pct}%`;});
       }
       for(let i=0;i<galleryFiles.length;i++){
         status.textContent=`Uploading gallery photo ${i+1}/${galleryFiles.length}…`;
         project.gallery.push(await api.uploadImage(galleryFiles[i],pct=>{status.textContent=`Gallery ${i+1}/${galleryFiles.length}: ${pct}%`; }));
       }
     }catch(uploadError){
       const message=uploadError?.message||String(uploadError);
       const skip=confirm(`Photo upload could not finish: ${message}\n\nSave the project DETAILS without the failed photos? You can add photos later using an HTTPS image URL.`);
       if(!skip)throw Error('Upload failed. No project data was saved. '+message);
       // Retain any images that finished uploading and any previously entered URLs.
       status.textContent='Skipping unavailable photo upload; saving project details…';
     }
   }
   status.textContent='Saving project details to Firebase…';
   await api.saveProject(project);
   status.textContent='Project saved successfully.';
   dialog.close();
   toast('Project saved');
   // Do not keep the modal open for a slow project list refresh.
   await refresh();
 }catch(err){
   status.textContent='Save failed: '+(err?.message||String(err));
   toast(err?.message||String(err),'error');
 }finally{button.disabled=false;}
}
async function deleteProject(id){const p=data.projects.find(x=>x.id===id);if(!p)return;if(!confirm(`Delete “${p.title}”? This cannot be undone.`))return;try{await api.deleteProject(id);await refresh();toast('Project deleted');}catch(err){toast(err.message,'error');}}
async function saveSettings(e){e.preventDefault();const f=new FormData(e.currentTarget);const text=k=>String(f.get(k)||'').trim();const setting={...data.settings,brand:text('brand'),email:text('email'),phone:text('phone'),headline:text('headline'),subheadline:text('subheadline'),about:text('about'),location:text('location'),linkedin:text('linkedin'),github:text('github'),instagram:text('instagram'),upwork:text('upwork'),profile_image:text('profile_image'),availability:f.get('availability')==='on',skills:text('skills').split('\n').map(x=>x.trim()).filter(Boolean),services:text('services').split('\n').map(x=>x.split('|')).filter(parts=>parts.length>=2).map(([title,...rest],i)=>({number:String(i+1).padStart(2,'0'),title:title.trim(),desc:rest.join('|').trim()})).filter(x=>x.title&&x.desc)};
 if(contactDigits(setting.phone).length<10||contactDigits(setting.phone).length>15){toast('Enter a valid phone number including country code if outside India','error');return;}
 for(const k of ['linkedin','github','instagram','upwork','profile_image'])if(setting[k]&&!safeUrl(setting[k])){toast(`${k} must be a valid link`,'error');return;}
 const button=$('#save-settings');button.disabled=true;$('#settings-status').textContent='Saving…';try{const photo=$('#settings-form').elements.namedItem('profileFile').files?.[0];if(f.get('remove_photo')==='on')setting.profile_image='';if(photo)setting.profile_image=await api.uploadImage(photo);await api.saveSettings(setting);data.settings=setting;updateOverview();$('#settings-form').elements.namedItem('remove_photo').checked=false;$('#settings-status').textContent='Saved successfully. Refresh the public website to see updates.';toast('Site settings saved');}catch(err){$('#settings-status').textContent=err.message;toast(err.message,'error');}finally{button.disabled=false;}
}
async function loadInquiries(){try{data.inquiries=await api.inquiries();const newCount=data.inquiries.filter(x=>x.status==='new').length;$('#unread-count').textContent=newCount||'';$('#overview-inquiries').textContent=newCount;const root=$('#inquiry-list');root.innerHTML=data.inquiries.length?data.inquiries.map(x=>`<article class="inquiry-card"><header><div><span class="eyebrow quiet">${escapeHTML(new Date(x.created_at).toLocaleString())}</span><h3>${escapeHTML(x.name)}</h3><a href="mailto:${encodeURIComponent(x.email)}">${escapeHTML(x.email)} ↗</a></div><span class="status-pill ${x.status==='new'?'draft':'published'}">${escapeHTML(x.status||'new')}</span></header><p class="inquiry-meta">${escapeHTML(x.company||'No company')} · ${escapeHTML(x.service||'')} · ${escapeHTML(x.budget||'')} ${x.phone?' · '+escapeHTML(x.phone):''}</p><p class="inquiry-message">${escapeHTML(x.message)}</p><div class="row-actions inquiry-replies"><a class="reply-action" href="mailto:${encodeURIComponent(x.email)}?subject=${encodeURIComponent('Re: Your website project inquiry')}">↗ Reply by email</a>${whatsappNumber(x.phone)?`<a class="reply-action" href="https://wa.me/${whatsappNumber(x.phone)}?text=${encodeURIComponent('Hi '+x.name+', thanks for reaching out about your website project.')}" target="_blank" rel="noopener noreferrer">↗ Reply on WhatsApp</a>`:''}<button data-inquiry="${escapeHTML(x.id)}" data-status="contacted">Mark contacted</button><button data-inquiry="${escapeHTML(x.id)}" data-status="read">Mark read</button><button data-inquiry="${escapeHTML(x.id)}" data-status="new">Mark new</button><button class="delete" data-inquiry="${escapeHTML(x.id)}" data-status="delete">Delete</button></div></article>`).join(''):'<div class="setup-card">No inquiries yet. They will appear here after someone submits the contact form.</div>';}catch(err){$('#inquiry-list').innerHTML=`<div class="setup-card">${escapeHTML(err.message)}</div>`;}}
async function updateInquiry(button){const id=button.dataset.inquiry,status=button.dataset.status;if(status==='delete'&&!confirm('Delete this inquiry permanently?'))return;try{if(status==='delete')await api.deleteInquiry(id);else await api.updateInquiry(id,status);await loadInquiries();toast('Inbox updated');}catch(err){toast(err.message,'error');}}
async function start(){if(!api.connected)return showDashboard();if(!api.hasSession())return showLogin();try{await api.assertAdmin();showDashboard();}catch(err){await api.logout();showLogin(err.message);}}
$('#login-form').addEventListener('submit',async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const button=$('#login-button');button.disabled=true;$('#login-status').textContent='Verifying account…';try{await api.signIn(String(f.get('email')),String(f.get('password')));showDashboard();}catch(err){$('#login-status').textContent=err.message;}finally{button.disabled=false;}});
$$('[data-tab]').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
$('[data-tab-link="backup"]').addEventListener('click',e=>{e.preventDefault();switchTab('backup');});
$('#new-project').addEventListener('click',()=>openEditor());
$('#overview-new-project').addEventListener('click',()=>{switchTab('projects');openEditor();});
$$('[data-open-tab]').forEach(x=>x.addEventListener('click',()=>switchTab(x.dataset.openTab)));
$('#settings-form').elements.namedItem('profileFile').addEventListener('change',e=>{const file=e.target.files?.[0];if(!file)return;const url=URL.createObjectURL(file);$('#profile-preview').innerHTML=`<img src="${url}" alt="New profile photo preview">`;setTimeout(()=>URL.revokeObjectURL(url),60000);});
$('#project-search').addEventListener('input',drawProjects);
$('#project-rows').addEventListener('click',e=>{const button=e.target.closest('[data-action]');if(!button)return;const id=button.dataset.id;if(button.dataset.action==='edit')openEditor(data.projects.find(x=>x.id===id));else deleteProject(id);});
$('#project-form').addEventListener('submit',saveProject);
$('#settings-form').addEventListener('submit',saveSettings);
$('#close-dialog').addEventListener('click',()=>dialog.close());
$('#cancel-dialog').addEventListener('click',()=>dialog.close());
$('#project-form').elements.namedItem('title').addEventListener('input',e=>{const slug=$('#project-form').elements.namedItem('slug');if(!slug.dataset.touched)slug.value=slugify(e.target.value);});
$('#project-form').elements.namedItem('slug').addEventListener('input',e=>e.target.dataset.touched='1');
dialog.addEventListener('close',()=>{form.elements.namedItem('slug').dataset.touched='';});
$('#project-form').elements.namedItem('coverFile').addEventListener('change',e=>{const file=e.target.files[0];if(!file)return;const url=URL.createObjectURL(file);$('#cover-preview').innerHTML=`<img src="${url}" alt="New cover image preview">`;dialog.addEventListener('close',()=>URL.revokeObjectURL(url),{once:true});});
$('#reload-inquiries').addEventListener('click',loadInquiries);
$('#inquiry-list').addEventListener('click',e=>{const b=e.target.closest('[data-inquiry]');if(b)updateInquiry(b);});
$('#logout-button').addEventListener('click',async()=>{await api.logout();if(api.connected)showLogin('Signed out.');else location.href='/index.html';});
$('#admin-menu').addEventListener('click',()=>$('.admin-sidebar').classList.toggle('mobile-open'));
$('#export-button').addEventListener('click',()=>{const blob=new Blob([api.exportPreview()],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='sam-portfolio-preview-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);});
$('#import-file').addEventListener('change',async e=>{const file=e.target.files?.[0];if(!file)return;try{api.importPreview(await file.text());await refresh();toast('Preview backup restored');}catch(err){toast(err.message,'error');}});
$('#reset-button').addEventListener('click',async()=>{if(!confirm('Reset all local preview edits and sample inquiries?'))return;api.resetPreview();await refresh();toast('Local preview reset');});
start();
