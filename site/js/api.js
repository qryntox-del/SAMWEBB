import {CONFIG,connected} from './config.js';
import {firebaseConnected} from './firebase-config.js';
import {firebaseApi} from './firebase-api.js';
import {starterProjects,starterSettings} from './data.js';
const STORE='sam_portfolio_preview_v2';
function upgradeSettings(input={}) {
 const x={...structuredClone(starterSettings),...input};
 if(!x.email||x.email==='hello@yourdomain.com')x.email=starterSettings.email;
 if(!x.phone)x.phone=starterSettings.phone;
 if(!x.headline||x.headline==='Digital experiences, designed to stand out.')x.headline=starterSettings.headline;
 if(!x.subheadline||x.subheadline==='I’m SAM, an independent web designer and developer crafting thoughtful, high-performance websites for ambitious brands worldwide.')x.subheadline=starterSettings.subheadline;
 return x;
}
function readPreview(){try{const data=JSON.parse(localStorage.getItem(STORE));if(data&&Array.isArray(data.projects)&&data.settings){data.settings=upgradeSettings(data.settings);data.inquiries=Array.isArray(data.inquiries)?data.inquiries:[];return data;}}catch{}return {projects:structuredClone(starterProjects),settings:structuredClone(starterSettings),inquiries:[]};}
function savePreview(data){localStorage.setItem(STORE,JSON.stringify(data));}
const URLBASE=CONFIG.supabaseUrl.replace(/\/$/,'');
const ANON=CONFIG.supabaseAnonKey;
function getSession(){try{return JSON.parse(sessionStorage.getItem('sam_auth_session')||'null');}catch{return null;}}
function setSession(session){if(session)sessionStorage.setItem('sam_auth_session',JSON.stringify(session));else sessionStorage.removeItem('sam_auth_session');}
async function refreshSession(){const s=getSession();if(!s?.refresh_token)return null;try{const res=await fetch(`${URLBASE}/auth/v1/token?grant_type=refresh_token`,{method:'POST',headers:{'apikey':ANON,'Content-Type':'application/json'},body:JSON.stringify({refresh_token:s.refresh_token})});if(!res.ok)throw Error('Session expired');const next=await res.json();setSession(next);return next;}catch{setSession(null);return null;}}
async function request(path,{method='GET',body,auth=false,headers={}}={}){
 if(!connected)throw Error('Database not connected');
 let token=auth?getSession()?.access_token:ANON;
 if(auth&&!token)throw Error('Please sign in');
 const run=()=>fetch(`${URLBASE}${path}`,{method,headers:{apikey:ANON,Authorization:`Bearer ${token}`,...(body===undefined?{}:{'Content-Type':'application/json'}),...headers},...(body===undefined?{}:{body:JSON.stringify(body)})});
 let res=await run();
 if(res.status===401&&auth){const next=await refreshSession();if(next){token=next.access_token;res=await run();}}
 if(!res.ok){let detail='';try{const err=await res.json();detail=err.message||err.msg||err.error_description||err.error||'';}catch{}throw Error(detail||`Request failed (${res.status})`);}
 if(res.status===204)return null;const text=await res.text();return text?JSON.parse(text):null;
}
const supabaseApi={
  connected,
  async projects({all=false}={}){
   if(!connected){const p=readPreview().projects;return [...p].filter(x=>all||x.published).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0));}
   return request(`/rest/v1/projects?select=*&${all?'':'published=eq.true&'}order=sort_order.asc,created_at.desc`,{auth:all});
  },
  async project(slug){if(!connected)return readPreview().projects.find(x=>x.slug===slug&&x.published)||null;
    const rows=await request(`/rest/v1/projects?select=*&slug=eq.${encodeURIComponent(slug)}&published=eq.true&limit=1`);return rows?.[0]||null;
  },
  async settings(){if(!connected)return readPreview().settings;
    const rows=await request('/rest/v1/site_settings?select=content&id=eq.main&limit=1');return upgradeSettings(rows?.[0]?.content||{});
  },
  async signIn(email,password){if(!connected)return {preview:true};
    const res=await fetch(`${URLBASE}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:ANON,'Content-Type':'application/json'},body:JSON.stringify({email,password})});
    const session=await res.json();if(!res.ok)throw Error(session.error_description||session.msg||'Invalid credentials');setSession(session);
    try{await this.assertAdmin();return session;}catch(err){setSession(null);throw err;}
  },
  async assertAdmin(){if(!connected)return true;
    const user=await request('/auth/v1/user',{auth:true});if(!user?.id)throw Error('Login required');
    const rows=await request(`/rest/v1/admins?select=id&id=eq.${encodeURIComponent(user.id)}&limit=1`,{auth:true});
    if(!rows?.length)throw Error('Your account does not have portfolio admin access');return true;
  },
  async logout(){if(connected&&getSession()?.access_token){try{await request('/auth/v1/logout',{method:'POST',auth:true});}catch{}}setSession(null);},
  hasSession(){return !connected||Boolean(getSession()?.access_token);},
  async saveProject(project){
    const record={...project,id:project.id||crypto.randomUUID(),slug:String(project.slug||'').toLowerCase().replace(/[^a-z0-9-]/g,'-')};
    if(!connected){const state=readPreview();const ix=state.projects.findIndex(x=>x.id===record.id);if(ix>=0)state.projects[ix]=record;else state.projects.push(record);savePreview(state);return record;}
    const {created_at,updated_at,...clean}=record;
    const results=await request('/rest/v1/projects?on_conflict=id',{method:'POST',auth:true,body:clean,headers:{Prefer:'resolution=merge-duplicates,return=representation'}});return results?.[0];
  },
  async deleteProject(id){if(!connected){const data=readPreview();data.projects=data.projects.filter(x=>x.id!==id);savePreview(data);return;}
    await request(`/rest/v1/projects?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',auth:true});
  },
  async saveSettings(content){if(!connected){const data=readPreview();data.settings={...content};savePreview(data);return;}
    await request('/rest/v1/site_settings?on_conflict=id',{method:'POST',auth:true,body:{id:'main',content},headers:{Prefer:'resolution=merge-duplicates'}});
  },
  async submitInquiry(record){const payload={...record,status:'new'};
    if(!connected){const data=readPreview();data.inquiries.unshift({...payload,id:crypto.randomUUID(),created_at:new Date().toISOString()});savePreview(data);return;}
    // Always submit using the anonymous key, never the owner session.
    await request('/rest/v1/inquiries',{method:'POST',body:payload});
  },
  async inquiries(){if(!connected)return readPreview().inquiries;
    return request('/rest/v1/inquiries?select=*&order=created_at.desc',{auth:true});
  },
  async updateInquiry(id,status){if(!connected){const data=readPreview();const item=data.inquiries.find(x=>x.id===id);if(item)item.status=status;savePreview(data);return;}
    await request(`/rest/v1/inquiries?id=eq.${encodeURIComponent(id)}`,{method:'PATCH',body:{status},auth:true});
  },
  async deleteInquiry(id){if(!connected){const data=readPreview();data.inquiries=data.inquiries.filter(x=>x.id!==id);savePreview(data);return;}
    await request(`/rest/v1/inquiries?id=eq.${encodeURIComponent(id)}`,{method:'DELETE',auth:true});
  },
  async uploadImage(file){if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Only JPG, PNG or WEBP allowed');if(file.size>5*1024*1024)throw Error('Maximum image size is 5 MB');
    if(!connected){
      // Compress preview images so they fit into browser localStorage.
      return await new Promise((resolve,reject)=>{
        const reader=new FileReader();reader.onerror=()=>reject(Error('Cannot read image'));
        reader.onload=()=>{const img=new Image();img.onerror=()=>reject(Error('Cannot decode image'));
          img.onload=()=>{const scale=Math.min(1,1200/Math.max(img.width,img.height));const canvas=document.createElement('canvas');
            canvas.width=Math.max(1,Math.round(img.width*scale));canvas.height=Math.max(1,Math.round(img.height*scale));
            canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/jpeg',.76));};
          img.src=reader.result;};reader.readAsDataURL(file);
      });
    }
    const ext=file.type==='image/jpeg'?'jpg':file.type==='image/png'?'png':'webp';const name=`projects/${crypto.randomUUID()}.${ext}`;
    const token=getSession()?.access_token;if(!token)throw Error('Please log in');
    const res=await fetch(`${URLBASE}/storage/v1/object/portfolio/${name}`,{method:'POST',headers:{apikey:ANON,Authorization:`Bearer ${token}`,'Content-Type':file.type,'x-upsert':'false'},body:file});
    if(!res.ok){let message='Image upload failed';try{const result=await res.json();message=result.message||result.error||message;}catch{}throw Error(message);}
    return `${URLBASE}/storage/v1/object/public/portfolio/${name}`;
  },
  exportPreview(){return JSON.stringify(readPreview(),null,2);},
  importPreview(json){const data=JSON.parse(json);if(!data||!Array.isArray(data.projects)||!data.settings||!Array.isArray(data.inquiries))throw Error('Invalid backup file');savePreview(data);},
  resetPreview(){localStorage.removeItem(STORE);}
};

// Firebase takes precedence if fully configured; otherwise preserve existing Supabase/local mode.
export const api=firebaseConnected?firebaseApi:supabaseApi;
