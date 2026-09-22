import type {Project} from '../model/project';
import type {Piece,Geometry,PaperBoundary} from '../layout/geometry';
import {effective} from '../layout/geometry';
import {hash,noise} from '../imaging/random';
import type {Surface} from './surface';
type Context=CanvasRenderingContext2D|OffscreenCanvasRenderingContext2D;

function settings(p:Project,b:PaperBoundary){
 const e=p.edges,inner=b.kind==='inner',tear=p.layout.tearAmount*p.finishStrength/10000;
 const scope=(inner?e.innerFray:e.outerFray)/100;
 const active=e.enabled&&(inner?tear>0:e.profile!=='clean');
 return {amount:active?effective(p,'edges')*scope*(inner?tear:1):0,base:active&&inner?tear*scope:0};
}

// Paint inside the paper silhouette, before the free fibres. Vary width and density
// independently so raw support looks pulled apart instead of like a uniform stroke.
export function exposedEdge(ctx:Context,p:Project,piece:Piece){
 const e=p.edges;ctx.save();ctx.fillStyle=p.paper.colour;
 for(const boundary of piece.boundaries){
  const {amount,base}=settings(p,boundary),reveal=e.exposedPaper/100*amount;
  if(base+reveal===0)continue;
  const pts=boundary.points;
  // Nested irregular ribbons are filled once each. Overlapping short strokes
  // produce beads and an opaque cord; these shallow layers avoid that artifact.
  for(let layer=0;layer<12;layer++){
   const band=new Path2D();pts.forEach(([x,y],i)=>i?band.lineTo(x,y):band.moveTo(x,y));
   for(let i=pts.length-1;i>=0;i--){
    const [x,y]=pts[i],a=pts[Math.max(0,i-2)],b=pts[Math.min(pts.length-1,i+2)],length=Math.hypot(b[0]-a[0],b[1]-a[1])||1;
    const nx=(b[1]-a[1])/length,ny=-(b[0]-a[0])/length;
    const tuft=noise(x/13,y/13,e.seed+293),fine=noise(x/1.3,y/1.3,e.seed+887+layer*31);
    const width=(base*(.5+fine*2.2)+reveal*(.4+e.featherWidth*.12)*(.12+tuft*.7+fine*.35))*(1-layer*.079);
    band.lineTo(x-nx*width,y-ny*width);
   }
   band.closePath();ctx.globalAlpha=Math.min(.23,base*.075+reveal*.13)*(layer===0?.5:1);ctx.fill(band);
  }
 }
 ctx.restore();
}

// Walk by material distance rather than output pixels. Seeded tufts, nested short
// fibrils and occasional curling threads remain in the same places at every zoom.
export function edgeFibres(ctx:Context,p:Project,piece:Piece,face:Surface,geo:Geometry,faceMargin:number){
 const e=p.edges;
 if(e.looseFibres+e.featherWidth+e.longFibres===0)return;
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 const pattern=ctx.createPattern(face,'no-repeat');
 if(pattern&&typeof DOMMatrix!=='undefined')pattern.setTransform(new DOMMatrix().translate(-faceMargin,-faceMargin).scale((geo.width+faceMargin*2)/face.width,(geo.height+faceMargin*2)/face.height));
 const printed=pattern??p.paper.colour,paper=p.paper.colour;
 const pieceSeed=e.seed+Number(piece.id.split(':')[0])*701+Number(piece.id.split(':')[1])*977;
 for(let side=0;side<piece.boundaries.length;side++){
  const boundary=piece.boundaries[side],{amount,base}=settings(p,boundary);if(amount===0)continue;
  const pts=boundary.points,fringe=e.featherWidth/100*amount*10,density=e.looseFibres/100,clumping=e.fibreClumping/100;
  const revealed=Math.min(1,e.exposedPaper/100+(boundary.kind==='inner'?base*.35:0));
  let distance=0,nextSample=.3,index=0;
  for(let i=0;i<pts.length-1;i++){
   const a=pts[i],b=pts[i+1],segment=Math.hypot(b[0]-a[0],b[1]-a[1]);if(segment===0)continue;
   while(nextSample<distance+segment){
    const t=(nextSample-distance)/segment,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
    // Smoothed tangent avoids regular radial spikes on each tiny contour tooth.
    const before=pts[Math.max(0,i-3)],after=pts[Math.min(pts.length-1,i+4)],length=Math.hypot(after[0]-before[0],after[1]-before[1])||1;
    const tx=(after[0]-before[0])/length,ty=(after[1]-before[1])/length,nx=ty,ny=-tx;
    const seed=pieceSeed+side*1999,r=(salt:number)=>hash(index,salt,seed);
    const tuft=noise(x/19,y/19,e.seed+491),cluster=(1-clumping)+clumping*(.08+2.4*tuft*tuft);
    const chance=Math.min(.98,amount*(density*.74+e.featherWidth/100*.35)*cluster);
    const draw=(reach:number,drift:number,alpha:number,width:number,long=false)=>{
     const inset=fringe*(.2+r(5)*1.1),rootX=x-nx*inset,rootY=y-ny*inset;
     const endX=x+nx*reach+tx*drift,endY=y+ny*reach+ty*drift;
     const path=new Path2D();path.moveTo(rootX,rootY);
     if(long){
      const bend=(r(14)-.5)*reach*1.3;
      path.bezierCurveTo(x+nx*reach*.8+tx*bend,y+ny*reach*.8+ty*bend,endX+nx*reach*.35-tx*drift*.3,endY+ny*reach*.35-ty*drift*.3,endX,endY);
     }else path.bezierCurveTo(x+nx*reach*.15-tx*drift*.35,y+ny*reach*.15-ty*drift*.35,x+nx*reach*.8+tx*drift*.4,y+ny*reach*.8+ty*drift*.4,endX,endY);
     ctx.lineWidth=width;ctx.globalAlpha=alpha;ctx.strokeStyle=printed;ctx.stroke(path);
     // Revealed fibres have the chosen support colour, not a fixed white halo.
     if(revealed>0){ctx.strokeStyle=paper;ctx.globalAlpha=alpha*revealed*(.55+r(11)*.45);ctx.stroke(path);}
    };
    if(r(1)<chance){
     const reach=fringe*(.15+r(2)*.6)+amount*(.4+(1+e.fibreLength*.2)*r(3)**2);
     const drift=(r(4)-.5)*(reach*1.3+fringe*1.1);
     draw(reach,drift,.22+r(6)*.5,.12+r(7)*.36);
     // A fine crossed fibre inside dense tufts gives an interwoven paper fringe.
     if(r(8)<e.featherWidth/100*.8)draw(fringe*(.1+r(9)*.55),-drift*.65,.16+r(10)*.3,.12+r(12)*.2);
    }
    if(r(20)<e.longFibres/100*amount*.019*cluster){
     const reach=amount*(12+e.fibreLength*.48)*(.3+r(21)*.5),drift=(r(22)-.5)*reach;
     draw(reach,drift,.4+r(23)*.4,.18+r(24)*.33,true);
    }
    index++;nextSample+=.7;
   }
   distance+=segment;
  }
 }
 ctx.restore();
}
