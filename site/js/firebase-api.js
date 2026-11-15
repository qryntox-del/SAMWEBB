import {firebaseConfig,ownerUid,firebaseConnected} from './firebase-config.js';
import {starterSettings} from './data.js';

// Firebase JS SDK official browser-module CDN — no npm install required.
// Loaded only after Firebase config has been set.
const SDK='https://www.gstatic.com/firebasejs/13.3.0/';
let sdkPromise;
async function kit(){
  if(!firebaseConnected)throw Error('Firebase config and owner UID are required.');
  if(!sdkPromise){
    sdkPromise=Promise.all([
      import(SDK+'firebase-app.js'),import(SDK+'firebase-auth.js'),
      import(SDK+'firebase-firestore.js'),import(SDK+'firebase-storage.js')
    ]).then(([core,auth,fs,st])=>{
      const app=core.getApps().length?core.getApp():core.initializeApp(firebaseConfig);
      return {auth,fs,st,login:auth.getAuth(app),db:fs.getFirestore(app),store:st.getStorage(app)};
    });
  }
  return sdkPromise;
}
function withTimeout(promise,ms,message){
 let timer;
 return Promise.race([
  promise,
  new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error(message)),ms);})
 ]).finally(()=>clearTimeout(timer));
}
const sorted=(arr)=>arr.sort((a,b)=>(Number(a.sort_order)||0)-(Number(b.sort_order)||0));
async function requireOwner(){
  const k=await kit();await k.login.authStateReady();
  if(!k.login.currentUser)throw Error('Please sign in to manage this portfolio.');
  if(k.login.currentUser.uid!==ownerUid)throw Error('This account is not the authorized portfolio owner.');
  return k;
}
const dateIso=x=>x?.toDate?.()?.toISOString?.()||new Date().toISOString();
const fromSnap=d=>({id:d.id,...d.data(),created_at:dateIso(d.data().created_at)});
export const firebaseApi={
  connected:true, provider:'Firebase',
  // Only public/published projects may be returned to visitors.
  async projects({all=false}={}){
    const k=all?await requireOwner():await kit();
    const ref=k.fs.collection(k.db,'projects');
    const q=all?ref:k.fs.query(ref,k.fs.where('published','==',true));
    return sorted((await k.fs.getDocs(q)).docs.map(fromSnap));
  },
  async project(slug){
    const k=await kit();const ref=k.fs.collection(k.db,'projects');
    const q=k.fs.query(ref,k.fs.where('published','==',true),k.fs.where('slug','==',slug));
    const s=await k.fs.getDocs(q);return s.empty?null:fromSnap(s.docs[0]);
  },
  async settings(){
    const k=await kit();const d=await k.fs.getDoc(k.fs.doc(k.db,'site_settings','main'));
    return {...structuredClone(starterSettings),...(d.exists()?d.data().content:{})};
  },
  async signIn(email,password){
    const k=await kit();await k.auth.signInWithEmailAndPassword(k.login,email,password);
    try{await requireOwner();return {uid:k.login.currentUser.uid};}
    catch(e){await k.auth.signOut(k.login);throw e;}
  },
  async assertAdmin(){await requireOwner();return true;},
  async logout(){const k=await kit();await k.auth.signOut(k.login);},
  hasSession(){return true;}, // Auth persistence resolves asynchronously inside assertAdmin.
  async saveProject(project){
    const k=await requireOwner();const id=project.id||crypto.randomUUID();
    const clean={...project,id,slug:String(project.slug||'').toLowerCase().replace(/[^a-z0-9-]/g,'-')};
    delete clean.created_at;delete clean.updated_at;
    await withTimeout(k.fs.setDoc(k.fs.doc(k.db,'projects',id),{...clean,updated_at:k.fs.serverTimestamp()},{merge:true}),40000,'Firestore did not confirm this save within 40 seconds. Check Firestore > Data before retrying. This can happen with an offline connection.');
    return clean;
  },
  async deleteProject(id){const k=await requireOwner();await k.fs.deleteDoc(k.fs.doc(k.db,'projects',id));},
  async saveSettings(content){const k=await requireOwner();await k.fs.setDoc(k.fs.doc(k.db,'site_settings','main'),{content,updated_at:k.fs.serverTimestamp()});},
  async submitInquiry(record){
    const k=await kit();const raw=Object.fromEntries(['name','email','phone','company','service','budget','message'].map(key=>[key,String(record[key]||'').trim()]));
    if(!raw.name||!raw.email||!raw.message)throw Error('Name, email and a message are required.');
    await k.fs.addDoc(k.fs.collection(k.db,'inquiries'),{...raw,status:'new',created_at:k.fs.serverTimestamp()});
  },
  async inquiries(){const k=await requireOwner();const snap=await k.fs.getDocs(k.fs.collection(k.db,'inquiries'));return snap.docs.map(fromSnap).sort((a,b)=>Date.parse(b.created_at)-Date.parse(a.created_at));},
  async updateInquiry(id,status){
    const k=await requireOwner();if(!['new','read','contacted'].includes(status))throw Error('Invalid inquiry status');
    await k.fs.updateDoc(k.fs.doc(k.db,'inquiries',id),{status});
  },
  async deleteInquiry(id){const k=await requireOwner();await k.fs.deleteDoc(k.fs.doc(k.db,'inquiries',id));},
  async uploadImage(file,onProgress=()=>{}){
    const k=await requireOwner();
    if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Only JPG, PNG or WEBP allowed.');
    if(file.size>5*1024*1024)throw Error('Maximum image size is 5 MB.');
    const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
    const ref=k.st.ref(k.store,`portfolio/${crypto.randomUUID()}.${ext}`);
    const task=k.st.uploadBytesResumable(ref,file,{contentType:file.type});
    return await new Promise((resolve,reject)=>{
      let finished=false;
      const stop=(err,url)=>{
        if(finished)return;
        finished=true;clearTimeout(timer);
        if(err)reject(err);else resolve(url);
      };
      const timer=setTimeout(()=>{
        task.cancel();
        stop(Error('Firebase Storage upload timed out after 45 seconds. Check that Storage is enabled, billing if required, and Storage Rules are published.'));
      },45000);
      task.on('state_changed',
        snap=>{const pct=Math.round(100*snap.bytesTransferred/Math.max(1,snap.totalBytes));onProgress(pct);},
        err=>stop(Error('Firebase Storage: '+(err?.message||String(err)))),
        async()=>{
          try{stop(null,await k.st.getDownloadURL(ref));}
          catch(err){stop(Error('Cannot get uploaded photo URL: '+(err?.message||String(err))));}
        }
      );
    });
  },
  exportPreview(){throw Error('Backup export is only available in local preview mode');},
  importPreview(){throw Error('Backup import is only available in local preview mode');},
  resetPreview(){throw Error('Preview reset is only available in local preview mode');}
};
