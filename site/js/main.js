import {api} from './api.js';
import {starterSettings,serviceOptions,budgetOptions} from './data.js';
import {$,$$,escapeHTML,safeUrl,projectHref,imageSrc,list,year} from './utils.js';
let settings={...starterSettings};let projects=[];
const page=document.body.dataset.page;
function renderShell(){
 $('#site-header').innerHTML=`<header class="site-header"><div class="wrap nav"><a href="/index.html" class="brand" aria-label="SAM home"><span data-brand>SAM</span><sup>®</sup></a><nav id="desktop-nav" aria-label="Primary"><a href="/index.html">Home</a><a href="/work.html">Work</a><a href="/index.html#services">Services</a><a href="/index.html#about">About</a><a href="/index.html#contact">Contact</a></nav><a class="nav-cta" href="/index.html#contact">LET’S TALK <span>↗</span></a><button class="menu-button" type="button" aria-expanded="false" aria-controls="mobile-nav" aria-label="Toggle menu"><span></span><span></span></button></div><nav class="mobile-nav" id="mobile-nav" aria-label="Mobile navigation"><a href="/index.html">Home</a><a href="/work.html">Work</a><a href="/index.html#services">Services</a><a href="/index.html#about">About</a><a href="/index.html#contact">Contact</a></nav></header>`;
 $('#site-footer').innerHTML=`<footer class="footer"><div class="wrap"><div class="footer-top"><a href="/index.html" class="footer-logo" data-brand>SAM</a><a href="#" id="back-to-top">BACK TO TOP ↑</a></div><div class="footer-bottom"><span>© <span id="footer-year"></span> SAM. BUILT WITH INTENTION.</span><span>INDEPENDENT & WORLDWIDE</span></div></div></footer>`;
 $('#footer-year').textContent=year();
 $('.menu-button').addEventListener('click',()=>{const expanded=$('.menu-button').getAttribute('aria-expanded')==='true';$('.menu-button').setAttribute('aria-expanded',String(!expanded));$('.mobile-nav').classList.toggle('open',!expanded);});
 $$('.mobile-nav a').forEach(a=>a.addEventListener('click',()=>{$('.mobile-nav').classList.remove('open');$('.menu-button').setAttribute('aria-expanded','false');}));
 $('#back-to-top').addEventListener('click',e=>{e.preventDefault();window.scrollTo({top:0,behavior:'smooth'});});
 let last=0;window.addEventListener('scroll',()=>{const y=window.scrollY;$('.site-header')?.classList.toggle('scrolled',y>30);$('.site-header')?.classList.toggle('nav-hidden',y>260&&y>last+4);last=y;},{passive:true});
}
function digits(value){return String(value||'').replace(/[^0-9]/g,'');}
function whatsAppNumber(value){const n=digits(value);return n.length===10?'91'+n:n;}
function whatsappURL(number,message=''){const n=whatsAppNumber(number);return n?`https://wa.me/${n}${message?'?text='+encodeURIComponent(message):''}`:'';}
function collectInquiry(form){const f=new FormData(form);return {name:String(f.get('name')||'').trim(),email:String(f.get('email')||'').trim(),phone:String(f.get('phone')||'').trim(),company:String(f.get('company')||'').trim(),service:String(f.get('service')||''),budget:String(f.get('budget')||''),message:String(f.get('message')||'').trim()};}
function inquiryMessage(record){return `Hello SAM, I have a website project inquiry.\n\nName: ${record.name}\nEmail: ${record.email}\nWhatsApp: ${record.phone||'Not provided'}\nBusiness: ${record.company||'Not provided'}\nService: ${record.service}\nBudget: ${record.budget}\n\nProject details:\n${record.message}`;}
function renderSettings(){document.title=page==='home'?`${settings.brand}® — Independent Web Designer & Developer`:page==='work'?`Selected Work — ${settings.brand}®`:document.title;
 $$('[data-brand]').forEach(el=>el.textContent=settings.brand||'SAM');
 if(page!=='home')return;
 const headline=escapeHTML(settings.headline||starterSettings.headline);
 $('[data-headline]').innerHTML=headline.replace(/\.\s+/,'.<br>').replace(/Built with purpose\./i,'<em>Built with purpose.</em>');
 $('[data-subheadline]').textContent=settings.subheadline||starterSettings.subheadline;
 $('[data-about]').textContent=settings.about||starterSettings.about;
 if(settings.profile_image){const portrait=`<img src="${escapeHTML(imageSrc(settings.profile_image))}" alt="Portrait of ${escapeHTML(settings.brand||'SAM')}" loading="eager">`;
   const hero=$('#hero-photo');hero.querySelector('.portrait-placeholder').innerHTML=portrait;hero.classList.add('has-portrait');
   const aboutArt=$('#about-art');aboutArt.innerHTML=`<img class="about-portrait" src="${escapeHTML(imageSrc(settings.profile_image))}" alt="Portrait of ${escapeHTML(settings.brand||'SAM')}">`;
 }

 $('[data-location]').textContent=(settings.location||starterSettings.location).toUpperCase();
 $('[data-availability]').textContent=settings.availability?'AVAILABLE FOR SELECT PROJECTS':'CURRENTLY BOOKED — ENQUIRIES WELCOME';
 const email=$('#contact-email');email.textContent=(settings.email||starterSettings.email)+' ↗';email.href=`mailto:${encodeURIComponent(settings.email||starterSettings.email)}`;
 const phone=whatsAppNumber(settings.phone||starterSettings.phone);
 const directWA=$('#direct-whatsapp');if(directWA){directWA.href=whatsappURL(phone,'Hi SAM, I would like to discuss a website project.');directWA.hidden=!phone;}
 const directEmail=$('#direct-email');if(directEmail)directEmail.href=`mailto:${encodeURIComponent(settings.email||starterSettings.email)}`;
 $('#social-links').innerHTML=['upwork','linkedin','github','instagram'].filter(k=>safeUrl(settings[k])).map(k=>`<a href="${escapeHTML(safeUrl(settings[k]))}" target="_blank" rel="noopener noreferrer">${k.toUpperCase()} ↗</a>`).join('');
 const upwork=$('#direct-upwork');if(upwork){upwork.hidden=!safeUrl(settings.upwork);if(!upwork.hidden)upwork.href=safeUrl(settings.upwork);}
 $('#skills').innerHTML=list(settings.skills).map(x=>`<span>${escapeHTML(x)}</span>`).join('');
 const services=list(settings.services).length?settings.services:starterSettings.services;
 $('#services-list').innerHTML=services.map((s,i)=>`<a href="#contact" class="service-row reveal"><span class="service-num">${escapeHTML(s.number||String(i+1).padStart(2,'0'))}</span><div><h3>${escapeHTML(s.title)}</h3><p>${escapeHTML(s.desc)}</p></div><span class="service-arrow">↗</span></a>`).join('');
 $('#service-select').innerHTML='<option value="">Select a service</option>'+serviceOptions.map(x=>`<option>${escapeHTML(x)}</option>`).join('');
 $('#budget-select').innerHTML='<option value="">Select an approximate range</option>'+budgetOptions.map(x=>`<option>${escapeHTML(x)}</option>`).join('');
}
function card(project,index=0){return `<article class="project-card reveal" style="--delay:${Math.min(index*90,270)}ms"><a href="${projectHref(project)}" class="project-image" aria-label="View ${escapeHTML(project.title)} project"><img src="${escapeHTML(imageSrc(project.hero_image))}" alt="${escapeHTML(project.title)} project preview" loading="lazy"><div class="project-overlay"><span>VIEW CASE STUDY</span><span class="project-circle">↗</span></div></a><div class="project-caption"><div><span class="eyebrow quiet">${escapeHTML(project.category||'WEB PROJECT')} / ${escapeHTML(project.year||'')}</span><h3><a href="${projectHref(project)}">${escapeHTML(project.title)}</a></h3><p>${escapeHTML(project.summary||'')}</p>${String(project.project_type||'').toLowerCase().includes('concept')?'<span class="concept-tag">CONCEPT / SAMPLE</span>':''}</div><span class="card-arrow">↗</span></div></article>`;}
function renderHome(){const featured=projects.filter(x=>x.featured).slice(0,4);const chosen=featured.length?featured:projects.slice(0,4);$('#featured-projects').innerHTML=chosen.length?chosen.map(card).join(''):'<div class="empty-state">Projects are being prepared. Check back soon.</div>';
 const form=$('#inquiry-form');
 const validRecord=()=>{if(!form.reportValidity())return null;const record=collectInquiry(form);if(form.elements.namedItem('website').value)return null;return record;};
 $('#inquiry-whatsapp').addEventListener('click',()=>{const record=validRecord();if(!record)return;
  const url=whatsappURL(settings.phone||starterSettings.phone,inquiryMessage(record));if(url)window.open(url,'_blank','noopener,noreferrer');
  $('#form-state').textContent='WhatsApp opened. Please press Send in WhatsApp to deliver your inquiry.';
 });
 $('#inquiry-email').addEventListener('click',()=>{const record=validRecord();if(!record)return;
  const url=`mailto:${encodeURIComponent(settings.email||starterSettings.email)}?subject=${encodeURIComponent('Website project inquiry from '+record.name)}&body=${encodeURIComponent(inquiryMessage(record))}`;
  window.location.href=url;$('#form-state').textContent='Your email app was opened. Please send the composed message to complete your inquiry.';
 });
 form.addEventListener('submit',async e=>{e.preventDefault();const record=validRecord();if(!record)return;
  const button=$('#submit-inquiry'),status=$('#form-state');button.disabled=true;
  status.textContent=api.connected?'Sending your inquiry…':'Saving in local preview…';
  try{await api.submitInquiry(record);if(api.connected){form.reset();status.textContent='Inquiry received. Thank you! You can also message me on WhatsApp.';}else{status.textContent='LOCAL PREVIEW ONLY — this request has not reached SAM. Please use “Send via WhatsApp” or “Send via email” to contact directly.';}}
  catch(err){status.textContent=`Could not submit: ${err.message}`;}finally{button.disabled=false;}
 });
}
function renderWork(){const root=$('#all-projects');const categories=['All',...new Set(projects.map(x=>x.category).filter(Boolean))];let active='All';const paint=()=>{root.innerHTML=projects.filter(x=>active==='All'||x.category===active).map(card).join('')||'<div class="empty-state">No projects in this category yet.</div>';observeReveals();};
 $('#work-filters').innerHTML=categories.map(x=>`<button type="button" class="filter-btn ${x===active?'active':''}" data-category="${escapeHTML(x)}">${escapeHTML(x)}</button>`).join('');
 $('#work-filters').addEventListener('click',e=>{const btn=e.target.closest('button[data-category]');if(!btn)return;active=btn.dataset.category;$$('.filter-btn').forEach(b=>b.classList.toggle('active',b.dataset.category===active));paint();});
 $('#project-count').textContent=`${String(projects.length).padStart(2,'0')} PROJECTS`;paint();
}
function renderDetail(){const slug=new URLSearchParams(location.search).get('slug');const p=projects.find(x=>x.slug===slug);
 if(!p){$('#project-detail').innerHTML='<section class="interior-hero"><div class="wrap"><span class="eyebrow quiet">404 / PROJECT NOT FOUND</span><h1 class="interior-title">Not <em>found.</em></h1><p><a class="text-link" href="/work.html">← Back to work</a></p></div></section>';return;}
 document.title=`${p.title} — ${settings.brand}`;
 const demo=safeUrl(p.demo_url),github=safeUrl(p.github_url);
 const links=[demo?`<a class="btn btn-light" href="${escapeHTML(demo)}" target="_blank" rel="noopener noreferrer">Visit website ↗</a>`:'',github?`<a class="text-link" href="${escapeHTML(github)}" target="_blank" rel="noopener noreferrer">View source ↗</a>`:''].join('');
 const gallery=list(p.gallery).filter(Boolean);
 $('#project-detail').innerHTML=`<section class="project-hero"><div class="wrap"><a class="back-link" href="/work.html">← BACK TO ALL WORK</a><span class="eyebrow quiet">${escapeHTML(p.category)} / ${escapeHTML(p.year||'')}</span><h1 class="interior-title">${escapeHTML(p.title)}</h1><p class="project-lede">${escapeHTML(p.summary||'')}</p>${String(p.project_type||'').toLowerCase().includes('concept')?'<p class="concept-tag standalone">CONCEPT / SAMPLE — NOT A CLIENT CASE STUDY</p>':''}</div></section><section class="project-detail-art"><div class="wrap"><img src="${escapeHTML(imageSrc(p.hero_image))}" alt="${escapeHTML(p.title)} main project visual"></div></section><section class="section project-overview"><div class="wrap overview-layout"><div><span class="eyebrow quiet">THE OVERVIEW</span><h2>Behind the <em>work.</em></h2></div><div><p class="overview-description">${escapeHTML(p.description||p.summary||'')}</p><div class="project-info"><div><span>PROJECT TYPE</span><strong>${escapeHTML(p.project_type||'Independent project')}</strong></div><div><span>YEAR</span><strong>${escapeHTML(p.year||'')}</strong></div><div><span>CATEGORY</span><strong>${escapeHTML(p.category||'')}</strong></div></div><div class="detail-links">${links}</div></div></div></section>${gallery.length?`<section class="project-gallery"><div class="wrap">${gallery.map((src,i)=>`<img loading="lazy" src="${escapeHTML(imageSrc(src))}" alt="${escapeHTML(p.title)} project gallery image ${i+1}">`).join('')}</div></section>`:''}<section class="section"><div class="wrap"><div class="section-heading"><div><span class="eyebrow quiet">PROJECT DETAILS</span><h2>What went <em>into it.</em></h2></div></div><div class="detail-two-col"><div><h3>Features</h3><ul class="detail-list">${list(p.features).map(x=>`<li>${escapeHTML(x)}</li>`).join('')||'<li>Details will be added soon.</li>'}</ul></div><div><h3>Tools & technologies</h3><div class="skills">${list(p.stack).map(x=>`<span>${escapeHTML(x)}</span>`).join('')||'<span>To be updated</span>'}</div></div></div></div></section><section class="mini-cta"><div class="wrap"><span>READY TO MAKE SOMETHING GREAT?</span><a href="/index.html#contact">Start a conversation <b>↗</b></a></div></section>`;
}
function observeReveals(){const elements=$$('.reveal:not(.revealed)');if(!('IntersectionObserver' in window)){elements.forEach(x=>x.classList.add('revealed'));return;}const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');io.unobserve(entry.target);}})},{threshold:0.07,rootMargin:'0px 0px -22px 0px'});elements.forEach(x=>io.observe(x));}
async function init(){renderShell();try{[settings,projects]=await Promise.all([api.settings(),api.projects()]);}catch(err){console.error('Portfolio data unavailable:',err);$('#site-header')?.insertAdjacentHTML('afterend',`<div class="data-warning">Could not load portfolio data. ${escapeHTML(err.message)} · <a href="/admin.html">Owner setup</a></div>`);settings={...starterSettings};}
 renderSettings();if(page==='home')renderHome();if(page==='work')renderWork();if(page==='project')renderDetail();observeReveals();}
init();
