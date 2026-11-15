/**
 * Zero-dependency LOCAL preview server (not intended as a production backend).
 * Run: node server.mjs   or   npm run dev
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT=resolve(fileURLToPath(new URL('./site/', import.meta.url)));
const MIME={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.json':'application/json; charset=utf-8'};
const port=Number(process.env.PORT)||5500;
const server=http.createServer(async(req,res)=>{
 try{
  if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405,{'Allow':'GET, HEAD'});res.end('Method not allowed');return;}
  const url=new URL(req.url,'http://localhost');let pathname=decodeURIComponent(url.pathname);if(pathname==='/'||pathname.endsWith('/'))pathname+='index.html';
  const location=resolve(ROOT,'.'+pathname);if(!(location===ROOT||location.startsWith(ROOT+sep))||pathname.split('/').some(part=>part.startsWith('.'))){res.writeHead(403);res.end('Forbidden');return;}
  const fileInfo=await stat(location).catch(()=>null);if(!fileInfo?.isFile()){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});res.end('<h1>404 — Not found</h1><a href="/">Home</a>');return;}
  const contentType=MIME[extname(location).toLowerCase()];if(!contentType){res.writeHead(403);res.end('Forbidden file type');return;}
  const bytes=await readFile(location);res.writeHead(200,{'Content-Type':contentType,'Content-Length':bytes.length,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'});
  if(req.method==='HEAD')res.end();else res.end(bytes);
 }catch(err){console.error(err);res.writeHead(500);res.end('Local preview server error');}
});
server.listen(port,'127.0.0.1',()=>console.log(`\nSAM Portfolio is running: http://localhost:${port}\nPress Ctrl+C to stop.\n`));
