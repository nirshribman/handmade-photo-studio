/// <reference lib="webworker" />
import {Renderer} from './renderer';
let renderer:Renderer|null=null;
self.onmessage=async event=>{const {id,action,payload}=event.data;try{
 if(action==='init'){renderer?.dispose();renderer=new Renderer();self.postMessage({id,result:renderer.capability});return;}
 if(!renderer)throw new Error('Renderer is not ready.');
 if(action==='source'){try{renderer.setSource(payload);}finally{payload.close();}self.postMessage({id,result:true});}
 if(action==='pieceSources'){try{renderer.setPieceSources(payload);}finally{payload.forEach((s:{bitmap:ImageBitmap})=>s.bitmap.close());}self.postMessage({id,result:true});}
 if(action==='asset'){try{renderer.setAsset(payload);}finally{Object.values(payload?.maps??{}).forEach(b=>(b as ImageBitmap).close());}self.postMessage({id,result:true});}
 if(action==='render'){const {canvas,metrics}=renderer.render(payload.project,payload.options);const bitmap=await createImageBitmap(canvas);self.postMessage({id,result:{bitmap,metrics}},[bitmap]);}
 if(action==='export'){const result=await renderer.encode(payload.project,payload.options,payload.type,payload.quality);self.postMessage({id,result});}
 if(action==='dispose'){renderer.dispose();renderer=null;self.postMessage({id,result:true});}
 }catch(e){self.postMessage({id,error:e instanceof Error?e.message:String(e)});}};
