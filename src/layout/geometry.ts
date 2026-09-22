import type {Project} from '../model/project';
import {EDGE_MARGIN} from '../model/edge-styles';
import {pieceEdit} from '../model/pieces';
import {hash,noise} from '../imaging/random';
export interface PaperBoundary {kind:'outer'|'inner';points:[number,number][];}
export interface Piece {id:string;x:number;y:number;width:number;height:number;dx:number;dy:number;angle:number;points:[number,number][];boundaries:PaperBoundary[];tone:number;tint:number;}
export interface Geometry {width:number;height:number;stageWidth:number;stageHeight:number;pieces:Piece[];margin:number;originX:number;originY:number;}
export const effective=(p:Project,g:'tone'|'film'|'bw'|'grain'|'paper'|'ink'|'edges'|'wrinkles'|'lighting')=>p[g].enabled?p.finishStrength*p[g].strength/10000:0;
export function cropAspect(p:Project,sw:number,sh:number){return sw*p.composition.crop.width/(sh*p.composition.crop.height);}
export function paperAspect(p:Project,sw:number,sh:number){const a=p.composition.aspect;if(a==='source')return cropAspect(p,sw,sh);if(a==='custom')return p.composition.customAspect.width/p.composition.customAspect.height;const [w,h]=a.split(':').map(Number);return w/h;}
export function partitionAxes(p:Project,w:number,h:number){let xs=[0,w],ys=[0,h];if(p.layout.mode==='strips'){const cuts=[0,...p.layout.cutPositions,1];if(p.layout.direction==='horizontal')ys=cuts.map(x=>x*h);else xs=cuts.map(x=>x*w);}if(p.layout.mode==='grid'){xs=Array.from({length:p.layout.columns+1},(_,i)=>w*i/p.layout.columns);ys=Array.from({length:p.layout.rows+1},(_,i)=>h*i/p.layout.rows);}return {xs,ys};}
export function buildGeometry(p:Project,sw:number,sh:number):Geometry {
 const aspect=paperAspect(p,sw,sh),width=1000*Math.max(1,aspect),height=1000*Math.max(1,1/aspect),{xs,ys}=partitionAxes(p,width,height);
 const gap=p.layout.gapPct*10,edge=effective(p,'edges'),tear=p.layout.tearAmount/100*p.finishStrength/100;
 const outer=(x:number,y:number)=>p.edges.profile==='clean'?0:edge*((noise(x/70,y/70,p.edges.seed)-.5)*24*p.edges.irregularity/100+(noise(x/5,y/5,p.edges.seed+13)-.5)*6*p.edges.roughness/100+(p.edges.profile==='torn'?(noise(x/17,y/17,p.edges.seed+77)-.5)*5:0));
 // Shared vertex lattice + matching edge functions: adjacent cells use the exact same path in reverse.
 const vertex=(col:number,row:number):[number,number]=>{const x=xs[col],y=ys[row];return [x+(col===0?-outer(x,y):col===xs.length-1?outer(x,y):(noise(x/41,y/41,p.layout.seed+11)-.5)*tear*9),y+(row===0?-outer(x,y):row===ys.length-1?outer(x,y):(noise(x/39,y/39,p.layout.seed+19)-.5)*tear*9)];};
 function boundary(c:number,r:number,horizontal:boolean,reverse=false):[number,number][]{const a=vertex(c,r),b=vertex(c+(horizontal?1:0),r+(horizontal?0:1)),length=horizontal?xs[c+1]-xs[c]:ys[r+1]-ys[r],n=Math.min(4096,Math.max(8,Math.ceil(length/2)));const isOuter=horizontal?(r===0||r===ys.length-1):(c===0||c===xs.length-1);const pts:[number,number][]=[];for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,envelope=Math.sin(Math.PI*t);const d=isOuter?outer(x,y)*envelope:tear*envelope*((noise(x/25,y/25,p.layout.seed+43)-.5)*16+(noise(x/3.3,y/3.3,p.layout.seed+53)-.5)*6);pts.push([x+(horizontal?0:d),y+(horizontal?d:0)]);}return reverse?pts.reverse():pts;}
 const pieces:Piece[]=[];
 for(let r=0;r<ys.length-1;r++)for(let c=0;c<xs.length-1;c++){
  const scatter=p.layout.scatter/100;
  const boundaries:PaperBoundary[]=[{kind:r===0?'outer':'inner',points:boundary(c,r,true)},{kind:c===xs.length-2?'outer':'inner',points:boundary(c+1,r,false)},{kind:r===ys.length-2?'outer':'inner',points:boundary(c,r+1,true,true)},{kind:c===0?'outer':'inner',points:boundary(c,r,false,true)}];
  pieces.push({id:`${r}:${c}`,x:xs[c],y:ys[r],width:xs[c+1]-xs[c],height:ys[r+1]-ys[r],dx:c*gap+scatter*(hash(c,r,p.layout.seed+701)-.5)*18,dy:r*gap+scatter*(hash(c,r,p.layout.seed+709)-.5)*18,angle:scatter*(hash(c,r,p.layout.seed+719)-.5)*.065,boundaries,points:boundaries.flatMap(b=>b.points),tone:hash(c,r,p.layout.seed+907)-.5,tint:hash(c,r,p.layout.seed+911)-.5});
 }
 const sum=pieces.reduce((a,x)=>a+x.width*x.height,0);const mt=pieces.reduce((a,x)=>a+x.tone*x.width*x.height,0)/sum,mw=pieces.reduce((a,x)=>a+x.tint*x.width*x.height,0)/sum;pieces.forEach(v=>{v.tone-=mt;v.tint-=mw;});
 // Fixed envelope for maximum supported edge, scatter, thickness and shadow support.
 const margin=EDGE_MARGIN+p.stage.paddingPct*10;
 let minX=0,minY=0,maxX=width+(xs.length-2)*gap,maxY=height+(ys.length-2)*gap;
 if(p.layout.mode!=='single')for(const piece of pieces){const edit=pieceEdit(p,piece.id);piece.angle+=edit.rotationDeg*Math.PI/180;piece.dx+=edit.offsetX*10;piece.dy+=edit.offsetY*10;
  if(edit.rotationDeg||edit.offsetX||edit.offsetY){const cx=piece.x+piece.dx+piece.width/2,cy=piece.y+piece.dy+piece.height/2,c=Math.cos(piece.angle),s=Math.sin(piece.angle);for(const x of [-piece.width/2,piece.width/2])for(const y of [-piece.height/2,piece.height/2]){const px=cx+x*c-y*s,py=cy+x*s+y*c;minX=Math.min(minX,px);minY=Math.min(minY,py);maxX=Math.max(maxX,px);maxY=Math.max(maxY,py);}}
 }
 return {width,height,margin,originX:margin-minX,originY:margin-minY,stageWidth:maxX-minX+2*margin,stageHeight:maxY-minY+2*margin,pieces};
}
export function imagePlacement(p:Project,sw:number,sh:number,w:number,h:number){const border=p.composition.borderPct*10,boxW=w-2*border,boxH=h-2*border,a=cropAspect(p,sw,sh);let iw=boxW,ih=boxH;if(p.composition.fit==='contain'){if(boxW/boxH>a)iw=boxH*a;else ih=boxW/a;}else{if(boxW/boxH>a)ih=boxW/a;else iw=boxH*a;}return {x:(w-iw)/2,y:(h-ih)/2,width:iw,height:ih,clipX:border,clipY:border,clipW:boxW,clipH:boxH};}


// Fit each photograph independently; rotation moves its whole paper piece.
export function pieceImagePlacement(p:Project,piece:Piece,sw:number,sh:number){
 const edit=pieceEdit(p,piece.id),crop={...edit.crop},border=Math.min(p.composition.borderPct*10,piece.width*.45,piece.height*.45);
 const boxW=piece.width-2*border,boxH=piece.height-2*border,aspect=sw*crop.width/(sh*crop.height),boxAspect=boxW/boxH;
 let width=boxW,height=boxH;
 if(edit.fit==='cover'){if(aspect>boxAspect){const w=crop.width*boxAspect/aspect;crop.x+=(crop.width-w)/2;crop.width=w;}else{const h=crop.height*aspect/boxAspect;crop.y+=(crop.height-h)/2;crop.height=h;}}
 else if(aspect>boxAspect)height=boxW/aspect;else width=boxH*aspect;
 return {x:piece.x+(piece.width-width)/2,y:piece.y+(piece.height-height)/2,width,height,crop};
}
