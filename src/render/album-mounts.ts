import type {Project} from '../model/project';
import type {Piece} from '../layout/geometry';
import {effective} from '../layout/geometry';
import {hash} from '../imaging/random';
type Context=CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D;
// Original folded paper pockets, aligned to each complete rotated photo piece.
export function drawMounts(ctx:Context,p:Project,piece:Piece,shadow:boolean){
 const style=p.stage.mounts;if(style==='none')return;
 const tones=style==='black'?['#37332d','#181918','#605747']:style==='kraft'?['#A08051','#705537','#CAB18A']:['#EAE1CC','#B9AB8E','#FFF8E5'];
 const size=Math.min(piece.width,piece.height)*p.stage.mountSize/100,positions=[[-1,-1],[1,-1],[1,1],[-1,1]];
 positions.forEach(([sx,sy],i)=>{
  const s=Math.max(size,piece.cornerRadii[i]*.95),seed=p.stage.seed+i*113;
  ctx.save();ctx.translate(sx*piece.width/2,sy*piece.height/2);ctx.scale(-sx,-sy);
  const path=new Path2D();path.moveTo(-5,-5);path.lineTo(s,-4);path.lineTo(s,0);path.quadraticCurveTo(s*.42,s*.48,0,s);path.lineTo(-4,s);path.closePath();
  if(shadow){const light=effective(p,'lighting'),angle=p.lighting.azimuthDeg*Math.PI/180;ctx.shadowColor=`rgba(25,19,11,${.24*light})`;ctx.shadowBlur=2;ctx.shadowOffsetX=-Math.cos(angle)*2;ctx.shadowOffsetY=-Math.sin(angle)*2;}
  const gradient=ctx.createLinearGradient(0,0,s*.65,s*.7);gradient.addColorStop(0,tones[0]);gradient.addColorStop(.74,tones[0]);gradient.addColorStop(1,tones[1]);ctx.fillStyle=gradient;ctx.fill(path);ctx.shadowColor='transparent';ctx.save();ctx.clip(path);
  for(let j=0;j<Math.ceil(s*s*.12);j++){const x=hash(j,1,seed)*(s+5)-5,y=hash(j,2,seed)*(s+5)-5;ctx.strokeStyle=j%2?tones[2]:tones[1];ctx.globalAlpha=.1+hash(j,3,seed)*.15;ctx.lineWidth=.2;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+1+hash(j,4,seed)*2,y+.5);ctx.stroke();}
  ctx.restore();ctx.globalAlpha=.65;ctx.strokeStyle=tones[2];ctx.lineWidth=.5;ctx.beginPath();ctx.moveTo(-2,s*.86);ctx.lineTo(-2,-2);ctx.lineTo(s*.86,-2);ctx.stroke();
  ctx.globalAlpha=.75;ctx.strokeStyle=tones[1];ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(0,s*.94);ctx.quadraticCurveTo(s*.45,s*.46,s*.94,0);ctx.stroke();ctx.restore();
 });
}
