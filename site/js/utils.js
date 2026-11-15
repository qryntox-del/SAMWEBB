export const $=(selector,root=document)=>root.querySelector(selector);
export const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];
export const escapeHTML=(value='')=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
export const safeUrl=(url)=>{try{const parsed=new URL(url,location.href);return ['http:','https:'].includes(parsed.protocol)?parsed.href:'';}catch{return '';}};
export const list=(value)=>Array.isArray(value)?value:[];
export const year=()=>new Date().getFullYear();
export function toast(text,type='ok'){
 let el=$('#toast');if(!el){el=document.createElement('div');el.id='toast';el.className='toast';el.setAttribute('role','status');document.body.append(el);}
 el.textContent=text;el.dataset.type=type;el.classList.add('shown');clearTimeout(window.__toastTimer);window.__toastTimer=setTimeout(()=>el.classList.remove('shown'),3500);
}
export const projectHref=(project)=>`/project.html?slug=${encodeURIComponent(project.slug)}`;
export const imageSrc=(src)=>{if(!src)return '/assets/project-studio.svg';if(src.startsWith('/assets/'))return src;if(/^data:image\/(?:jpeg|png|webp);base64,[a-z0-9+/=]+$/i.test(src))return src;return safeUrl(src)||'/assets/project-studio.svg';};
export const isExternal=(href)=>/^https?:\/\//.test(href||'');
