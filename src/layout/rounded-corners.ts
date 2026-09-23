import type {Project} from '../model/project';
import type {PaperBoundary} from './geometry';
import {hash,noise} from '../imaging/random';
type Point=[number,number];
function trim(points:Point[],start:number,end:number):Point[]{
 const distances=[0];for(let i=1;i<points.length;i++)distances.push(distances[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));
 const total=distances.at(-1)!,from=Math.min(start,total*.45),to=Math.max(total-end,total*.55),out:Point[]=[];
 for(let i=1;i<points.length;i++){const a=distances[i-1],b=distances[i];if(b<from||a>to||b===a)continue;const lerp=(d:number):Point=>{const t=(d-a)/(b-a);return [points[i-1][0]+(points[i][0]-points[i-1][0])*t,points[i-1][1]+(points[i][1]-points[i-1][1])*t];};if(!out.length)out.push(lerp(Math.max(a,from)));out.push(lerp(Math.min(b,to)));}
 return out.length>1?out:points;
}
export function roundCorners(boundaries:PaperBoundary[],p:Project,width:number,height:number){
 const e=p.edges,amount=e.enabled?e.strength*p.finishStrength/10000:0,base=Math.min(e.cornerRadius*10*amount,Math.min(width,height)*.4);
 const radii=boundaries.map((b,i)=>{const prev=boundaries[(i+3)%4],allowed=e.cornerScope==='pieces'||b.kind==='outer'&&prev.kind==='outer';const [x,y]=b.points[0];return allowed?Math.min(Math.min(width,height)*.44,base*(1+(hash(Math.round(x),Math.round(y),e.seed+371)-.5)*e.cornerVariation/100*.8)):0;});
 if(base===0||radii.every(r=>r===0))return {boundaries,radii};
 const lines=boundaries.map((b,i)=>({...b,points:trim(b.points,radii[i],radii[(i+1)%4])})),result:PaperBoundary[]=[];
 for(let i=0;i<4;i++){
  result.push(lines[i]);const j=(i+1)%4,r=radii[j];if(r===0)continue;
  const a=lines[i].points.at(-1)!,b=lines[j].points[0],corner=boundaries[j].points[0],n=Math.max(8,Math.ceil(r*.8)),points:Point[]=[];
  for(let k=0;k<=n;k++){const t=k/n,u=1-t;let x=u*u*a[0]+2*u*t*corner[0]+t*t*b[0],y=u*u*a[1]+2*u*t*corner[1]+t*t*b[1];const dx=2*u*(corner[0]-a[0])+2*t*(b[0]-corner[0]),dy=2*u*(corner[1]-a[1])+2*t*(b[1]-corner[1]),len=Math.hypot(dx,dy)||1;
   const wave=e.profile==='clean'?0:(noise(x/6,y/6,e.seed+193)-.5)*Math.min(3,r*.1)*e.cornerVariation/100*amount*Math.sin(Math.PI*t);x+=dy/len*wave;y-=dx/len*wave;points.push([x,y]);}
  result.push({kind:boundaries[i].kind==='inner'&&boundaries[j].kind==='inner'?'inner':'outer',points});
 }
 return {boundaries:result,radii};
}
