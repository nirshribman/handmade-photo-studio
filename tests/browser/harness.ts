import {Renderer} from '../../src/render/renderer';
import type {RenderOptions} from '../../src/render/renderer';
import {decodeSource} from '../../src/imaging/input';
import {neutral,initialProject,presets,loadFilm,loadMaterial,applyCrumpledPaper,clone} from '../../src/model/project';
import type {Project,View} from '../../src/model/project';
import {films,materials} from '../../src/model/profiles';
import {outputAspect} from '../../src/export/export-image';
import {surface,context2d,encodeCanvas} from '../../src/render/surface';
import {loadMaterialFiles} from '../../src/render/material-assets';
export class Harness {
 renderer=new Renderer();width=600;height=400;
 neutral=neutral;initialProject=initialProject;presets=presets;films=films;materials=materials;loadFilm=loadFilm;loadMaterial=loadMaterial;applyCrumpledPaper=applyCrumpledPaper;clone=clone;
 async source(url:string){const blob=await (await fetch(url)).blob(),d=await decodeSource(blob,url);this.renderer.setSource(d.bitmap);this.width=d.info.width;this.height=d.info.height;d.bitmap.close();return d.info;}
 render(p:Project,w=600,h=400,view:View='image',transparent=true){const options:RenderOptions={width:w,height:h,quality:'export',view,includeBackground:!transparent,includeShadow:true};const result=this.renderer.render(p,options);const canvas=surface(w,h);context2d(canvas).drawImage(result.canvas,0,0);return {canvas,metrics:result.metrics,pixels:context2d(canvas).getImageData(0,0,w,h).data};}
 async output(p:Project,long=1800,view:View='object',transparent=false){const aspect=outputAspect(p,this.width,this.height,view),w=Math.round(aspect>1?long:long*aspect),h=Math.round(aspect>1?long/aspect:long);const start=performance.now();const r=this.render(p,w,h,view,transparent),blob=await encodeCanvas(r.canvas,'image/png');const bytes=new Uint8Array(await blob.arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));return {base64:btoa(s),width:w,height:h,ms:performance.now()-start,metrics:r.metrics};}
 async maps(){const names=['manifest.json','albedo.png','height.png','roughness.png'];const files=await Promise.all(names.map(async name=>new File([await (await fetch(`/tests/fixtures/material/${name}`)).blob()],name)));const a=await loadMaterialFiles(files);this.renderer.setAsset(a);Object.values(a.maps).forEach(b=>b?.close());return a.manifest;}
}
export const difference=(a:Uint8ClampedArray,b:Uint8ClampedArray,alpha=false)=>{let max=0,sum=0,n=0;for(let i=0;i<a.length;i++){if(!alpha&&i%4===3)continue;const d=Math.abs(a[i]-b[i]);max=Math.max(max,d);sum+=d;n++;}return {max,mean:sum/n};};
