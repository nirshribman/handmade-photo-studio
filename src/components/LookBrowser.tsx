import {useEffect,useRef,useState} from 'react';
import {Modal} from './Modal';
import {films,materials} from '../model/profiles';
import {loadFilmLook,loadMaterial} from '../model/project';
import type {Project} from '../model/project';
import {buildGeometry} from '../layout/geometry';
import {outputAspect} from '../export/export-image';
import type {CreatePreview,PreviewSession} from '../render/preview-session';
export function LookBrowser({kind,project,width,height,createPreview,onChoose,onClose}:{kind:'film'|'paper';project:Project;width:number;height:number;createPreview:CreatePreview;onChoose:(id:string)=>void;onClose:()=>void}){
 const [previews,setPreviews]=useState<Record<string,{image:string;detail?:string}>>({}),[error,setError]=useState('');
 const initial=useRef(project),surface=useRef<HTMLCanvasElement|null>(null);
 const choices=kind==='film'?[{id:'none',name:'Neutral',description:'No film response, grain or monochrome conversion. Keeps manual tone.'},...films]:materials;
 useEffect(()=>{let stopped=false,session:PreviewSession|undefined;const urls:string[]=[];void(async()=>{try{
  session=await createPreview(kind);if(stopped){session.dispose();return;}
  for(const choice of choices){if(stopped)break;
   const p=kind==='film'?loadFilmLook(initial.current,choice.id):loadMaterial(initial.current,choice.id),view=kind==='film'?'image':'object';
   const aspect=outputAspect(p,width,height,view),long=kind==='film'?420:1000;
   const bitmap=await session.render(p,{width:Math.round(aspect>1?long:long*aspect),height:Math.round(aspect>1?long/aspect:long),quality:'refined',view,includeBackground:kind==='paper',includeShadow:true});
   if(stopped){bitmap.close();break;}
   const c=surface.current??document.createElement('canvas');surface.current=c;c.width=360;c.height=240;
   const ctx=c.getContext('2d')!;ctx.clearRect(0,0,360,240);const scale=Math.min(360/bitmap.width,240/bitmap.height);ctx.drawImage(bitmap,(360-bitmap.width*scale)/2,(240-bitmap.height*scale)/2,bitmap.width*scale,bitmap.height*scale);
   const blob=await new Promise<Blob|null>(resolve=>c.toBlob(resolve));const image=blob?URL.createObjectURL(blob):'';urls.push(image);
   let detail:string|undefined;
   if(kind==='paper'){c.width=360;c.height=110;const g=buildGeometry(p,width,height),scale=Math.min(bitmap.width/g.stageWidth,bitmap.height/g.stageHeight),sw=Math.min(220,bitmap.width),sh=Math.min(68,bitmap.height),x=Math.max(0,Math.min(bitmap.width-sw,g.originX*scale-12)),y=Math.max(0,Math.min(bitmap.height-sh,(g.originY+g.height/2)*scale-sh/2));ctx.drawImage(bitmap,x,y,sw,sh,0,0,360,110);const b=await new Promise<Blob|null>(resolve=>c.toBlob(resolve));if(b){detail=URL.createObjectURL(b);urls.push(detail);}}
   bitmap.close();if(!stopped)setPreviews(previous=>({...previous,[choice.id]:{image,detail}}));
  }
 }catch(e){if(!stopped)setError((e as Error).message);}finally{session?.dispose();if(stopped)urls.forEach(url=>URL.revokeObjectURL(url));}})();
 return()=>{stopped=true;session?.dispose();urls.forEach(url=>URL.revokeObjectURL(url));};},[kind,createPreview,width,height]);
 return <Modal wide title={kind==='film'?'Find a photographic feeling':'Choose the paper'} onClose={onClose}><p className="modal-intro">{kind==='film'?'Your current photo and crop, with each film recipe. Film also sets grain and monochrome; paper stays as it is.':'Your artwork on each procedural paper. The lower strip shows a closer view of its left edge and surface. Paper also sets recommended ink.'} Previews appear as they render.</p>{error&&<p role="alert">{error}</p>}<div className="look-grid">{choices.map(choice=><button className="look-card" key={choice.id} onClick={()=>onChoose(choice.id)} aria-label={'Use '+choice.name} aria-pressed={project[kind==='film'?'film':'paper'].profile===choice.id}><div className="look-photo">{previews[choice.id]?<img src={previews[choice.id].image} alt=""/>:<span>Rendering preview…</span>}</div>{kind==='paper'&&<div className="look-detail">{previews[choice.id]?.detail&&<img src={previews[choice.id].detail} alt="Surface detail"/>}</div>}<strong>{choice.name}</strong><small>{choice.description}</small></button>)}</div></Modal>;
}
