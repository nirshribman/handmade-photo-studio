import {RenderAdapter} from './adapter';
import type {RenderOptions} from './renderer';
import type {Project} from '../model/project';
import type {MaterialAsset} from './material-assets';
export interface PreviewSession {render:(project:Project,options:RenderOptions)=>Promise<ImageBitmap>;dispose:()=>void;}
export type CreatePreview=(kind?:'film'|'paper')=>Promise<PreviewSession>;
/** Modal previews own a renderer. Closing a modal releases its GPU resources. */
export async function createPreviewSession(source:ImageBitmap,pieces:{id:string;bitmap:ImageBitmap}[],asset:MaterialAsset|null):Promise<PreviewSession>{
 const adapter=new RenderAdapter();
 try{await adapter.init();await adapter.setSource(source);await adapter.setPieceSources(pieces);if(asset)await adapter.setAsset(asset);}
 catch(error){adapter.dispose();throw error;}
 let queue:Promise<unknown>=Promise.resolve(),disposed=false;
 return {render(project,options){const task=queue.then(()=>{if(disposed)throw new Error('Preview closed.');return adapter.render(project,options);}).then(result=>result.bitmap);queue=task.catch(()=>{});return task;},dispose:()=>{if(!disposed){disposed=true;adapter.dispose();}}};
}
