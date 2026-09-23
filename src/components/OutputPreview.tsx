import {useEffect,useRef,useState} from 'react';
import type {Project} from '../model/project';
import type {ExportSettings} from '../export/export-image';
import type {CreatePreview,PreviewSession} from '../render/preview-session';
export function OutputPreview({project,settings,createPreview,busy}:{project:Project;settings:ExportSettings;createPreview:CreatePreview;busy:boolean}){
 const canvas=useRef<HTMLCanvasElement>(null),session=useRef<Promise<PreviewSession>|null>(null);
 const [state,setState]=useState('Preparing preview');
 useEffect(()=>{if(busy){session.current=null;return;}let closed=false;const pending=createPreview();session.current=pending;pending.then(s=>{if(closed)s.dispose();}).catch(()=>{});return()=>{closed=true;void pending.then(s=>s.dispose()).catch(()=>{});};},[createPreview,busy]);
 useEffect(()=>{if(busy){setState('Rendering full image');return;}let cancelled=false;setState('Updating preview');const timer=setTimeout(()=>{void (async()=>{
  try{const renderer=await session.current;if(!renderer||cancelled)return;
   const ratio=Math.max(1,settings.width,settings.height),w=Math.max(1,Math.round(640*settings.width/ratio)),h=Math.max(1,Math.round(640*settings.height/ratio));
   const bitmap=await renderer.render(project,{width:w,height:h,quality:'refined',view:settings.view,includeBackground:settings.format==='jpeg'||!settings.transparent,includeShadow:settings.shadow&&settings.view==='object',flattenColour:settings.colour});
   if(!cancelled&&canvas.current){const c=canvas.current;c.width=bitmap.width;c.height=bitmap.height;c.getContext('2d')!.clearRect(0,0,c.width,c.height);c.getContext('2d')!.drawImage(bitmap,0,0);c.dataset.ready='true';setState('Output preview');}bitmap.close();
  }catch(error){if(!cancelled)setState('Preview unavailable: '+(error as Error).message);}
 })();},180);return()=>{cancelled=true;clearTimeout(timer);};},[project,settings,createPreview,busy]);
 return <figure className="output-preview"><div className="output-preview-surface"><canvas className="checkerboard" ref={canvas} role="img" aria-label="Export output preview"/></div><figcaption aria-live="polite">{state}<span>{settings.width} × {settings.height} px · {settings.format.toUpperCase()}</span></figcaption></figure>;
}
