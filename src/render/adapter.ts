import {Renderer} from './renderer';
import type {Capability,RenderOptions,RenderMetrics} from './renderer';
import type {Project} from '../model/project';
import type {MaterialAsset} from './material-assets';
type Pending={resolve:(v:unknown)=>void;reject:(e:Error)=>void};
export class RenderAdapter {
 private worker:Worker|null=null;private main:Renderer|null=null;private pending=new Map<number,Pending>();private sequence=0;
 capability!:Capability;private disposed=false;
 async init(forceMain=false){
  if(!forceMain&&typeof Worker!=='undefined'&&typeof OffscreenCanvas!=='undefined'){
   try{this.worker=new Worker(new URL('./render.worker.ts',import.meta.url),{type:'module'});this.worker.onmessage=e=>{const p=this.pending.get(e.data.id);if(!p){e.data.result?.bitmap?.close();return;}this.pending.delete(e.data.id);if(e.data.error)p.reject(new Error(e.data.error));else p.resolve(e.data.result);};this.worker.onerror=e=>{this.pending.forEach(p=>p.reject(new Error(e.message||'Worker failed.')));this.pending.clear();};this.capability=await this.rpc<Capability>('init',null);this.capability.adapter='Worker · WebGL2';return this.capability;}catch{this.worker?.terminate();this.worker=null;this.pending.clear();}
  }
  this.main=new Renderer();this.capability={...this.main.capability,adapter:'Main thread · WebGL2'};return this.capability;
 }
 private rpc<T>(action:string,payload:unknown,transfer:Transferable[]=[]):Promise<T>{if(this.disposed)return Promise.reject(new Error('Renderer closed.'));const id=++this.sequence;return new Promise((resolve,reject)=>{this.pending.set(id,{resolve:resolve as (v:unknown)=>void,reject});this.worker!.postMessage({id,action,payload},transfer);});}
 async setSource(bitmap:ImageBitmap){if(this.worker){const copy=await createImageBitmap(bitmap,{premultiplyAlpha:'none',colorSpaceConversion:'none'});return this.rpc('source',copy,[copy]);}this.main!.setSource(bitmap);}
 async setPieceSources(sources:{id:string;bitmap:ImageBitmap}[]){if(this.worker){const copies=await Promise.all(sources.map(async s=>({id:s.id,bitmap:await createImageBitmap(s.bitmap,{premultiplyAlpha:'none',colorSpaceConversion:'none'})})));return this.rpc('pieceSources',copies,copies.map(s=>s.bitmap));}this.main!.setPieceSources(sources);}
 async setAsset(asset:MaterialAsset|null){if(this.worker){const maps:MaterialAsset['maps']={};for(const [key,b] of Object.entries(asset?.maps??{})){maps[key as keyof typeof maps]=await createImageBitmap(b!,{colorSpaceConversion:'none',premultiplyAlpha:'none'});}return this.rpc('asset',asset?{manifest:asset.manifest,maps}:null,Object.values(maps) as Transferable[]);}this.main!.setAsset(asset);}
 async render(project:Project,options:RenderOptions):Promise<{bitmap:ImageBitmap;metrics:RenderMetrics}>{const start=performance.now();if(this.worker){const result=await this.rpc<{bitmap:ImageBitmap;metrics:RenderMetrics}>('render',{project,options});result.metrics.ms=performance.now()-start;return result;}const {canvas,metrics}=this.main!.render(project,options);const bitmap=await createImageBitmap(canvas);metrics.ms=performance.now()-start;return {bitmap,metrics};}
 async export(project:Project,options:RenderOptions,type:string,quality:number):Promise<{blob:Blob;metrics:RenderMetrics&{encodeMs:number}}>{if(this.worker)return this.rpc('export',{project,options,type,quality});await new Promise(r=>requestAnimationFrame(r));return this.main!.encode(project,options,type,quality);}
 dispose(){this.disposed=true;this.worker?.terminate();this.main?.dispose();this.pending.forEach(p=>p.reject(new Error('Render cancelled.')));this.pending.clear();}
}
