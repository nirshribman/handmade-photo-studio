import {spawn} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
try{const response=await fetch('http://127.0.0.1:5173');if(response.ok){console.log('Already running at http://127.0.0.1:5173');process.exit(0);}}catch{}
fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
const out=fs.openSync(path.join(root,'artifacts','dev-server.log'),'a');
const err=fs.openSync(path.join(root,'artifacts','dev-server-error.log'),'a');
const child=spawn(process.execPath,[path.join(root,'node_modules','vite','bin','vite.js'),'--host','127.0.0.1','--port','5173','--strictPort'],{cwd:root,detached:true,windowsHide:true,stdio:['ignore',out,err]});
child.unref();fs.writeFileSync(path.join(root,'artifacts','dev-server.pid'),String(child.pid));
console.log(`Started local editor (PID ${child.pid}): http://127.0.0.1:5173`);
