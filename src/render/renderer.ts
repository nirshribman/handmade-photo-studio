import type {Project,View} from '../model/project';
import {pieceEdit,emptyPiece} from '../model/pieces';
import type {PieceEdit} from '../model/pieces';
import {filmById,materials} from '../model/profiles';
import {buildGeometry,imagePlacement,pieceImagePlacement,effective,cropAspect} from '../layout/geometry';
import {EDGE_PAD} from '../model/edge-styles';
import {exposedEdge,edgeFibres} from './paper-edges';
import {vertex,photoShader,materialShader,highlightShader,blurShader} from './shaders';
import {surface,context2d,encodeCanvas} from './surface';
import type {Surface} from './surface';
import type {MaterialAsset} from './material-assets';
export interface RenderOptions {width:number;height:number;quality:'interactive'|'refined'|'export';view:View;includeBackground:boolean;includeShadow:boolean;flattenColour?:string;}
export interface RenderMetrics {ms:number;photoMs:number;materialMs:number;sceneMs:number;estimatedBytes:number;photoCached:boolean;warnings:string[];}
export interface Capability {webgl2:boolean;maxTexture:number;maxRenderbuffer:number;maxViewport:number[];maxPixels:number;maxSide:number;gpu:string;adapter:string;}
type Target={texture:WebGLTexture;framebuffer:WebGLFramebuffer;width:number;height:number};
const filters:Record<string,number[]>={none:[1,1,1],yellow:[1.1,1.1,.45],orange:[1.5,.8,.2],red:[2.2,.25,.08],green:[.5,1.5,.4],blue:[.25,.6,2]};
const rgb=(s:string)=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255);
const lin=(v:number)=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4;
export class Renderer {
 readonly gl:WebGL2RenderingContext;readonly canvas:Surface;readonly capability:Capability;
 private programs:Record<string,WebGLProgram>={};private locations=new Map<WebGLProgram,Map<string,WebGLUniformLocation|null>>();
 private targets=new Map<string,Target>();private sourceTexture:WebGLTexture|null=null;private sourceWidth=0;private sourceHeight=0;private photoKey='';private glowKey='';
 private pieceSources=new Map<string,{texture:WebGLTexture;width:number;height:number}>();private sourceGeneration=0;private atlasKey='';
 private materialMaps:WebGLTexture[]=[];private asset:MaterialAsset['manifest']|null=null;
 private output:Surface=surface(1,1);private face:Surface=surface(1,1);private piece:Surface=surface(1,1);
 constructor(){
  this.canvas=surface(1,1);const gl=this.canvas.getContext('webgl2',{alpha:true,premultipliedAlpha:true,preserveDrawingBuffer:true,antialias:false,depth:false,stencil:false}) as WebGL2RenderingContext|null;
  if(!gl)throw new Error('WebGL2 is unavailable. Enable browser hardware acceleration or try a current Chrome, Edge or Firefox.');this.gl=gl;
  const debug=gl.getExtension('WEBGL_debug_renderer_info');const mobile=typeof navigator!=='undefined'&&/Android|iPhone|iPad/i.test(navigator.userAgent);
  this.capability={webgl2:true,maxTexture:gl.getParameter(gl.MAX_TEXTURE_SIZE),maxRenderbuffer:gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),maxViewport:Array.from(gl.getParameter(gl.MAX_VIEWPORT_DIMS)),maxPixels:mobile?4000000:12000000,maxSide:4096,gpu:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),adapter:'WebGL2'};
  this.capability.maxSide=Math.min(4096,this.capability.maxTexture,this.capability.maxRenderbuffer,...this.capability.maxViewport);
  for(const [name,frag] of Object.entries({photo:photoShader,material:materialShader,highlight:highlightShader,blur:blurShader}))this.programs[name]=this.compile(frag);
  this.canvas.addEventListener('webglcontextlost',((e:Event)=>{e.preventDefault();this.photoKey='';this.glowKey='';}) as EventListener);
 }
 private compile(fragment:string){const gl=this.gl;const shaders=[gl.VERTEX_SHADER,gl.FRAGMENT_SHADER].map((type,i)=>{const sh=gl.createShader(type)!;gl.shaderSource(sh,i?fragment:vertex);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(sh);gl.deleteShader(sh);throw new Error(`Renderer shader could not compile: ${error}`);}return sh;});const p=gl.createProgram()!;shaders.forEach(s=>gl.attachShader(p,s));gl.linkProgram(p);shaders.forEach(s=>gl.deleteShader(s));if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p)||'Renderer link failed.');return p;}
 private uniform(p:WebGLProgram,name:string,value:number|number[],integer=false){const gl=this.gl;let cache=this.locations.get(p);if(!cache){cache=new Map();this.locations.set(p,cache);}if(!cache.has(name))cache.set(name,gl.getUniformLocation(p,name));const l=cache.get(name)!;if(l===null)return;if(typeof value==='number'){if(integer)gl.uniform1i(l,value);else gl.uniform1f(l,value);}else if(name==='mixer')gl.uniform1fv(l,value);else if(name==='pieceRects')gl.uniform4fv(l,value);else if(name==='pieceTones')gl.uniform2fv(l,value);else if(value.length===2)gl.uniform2fv(l,value);else if(value.length===3)gl.uniform3fv(l,value);else if(value.length===4)gl.uniform4fv(l,value);}
 private texture(p:WebGLProgram,name:string,tex:WebGLTexture,unit:number){const gl=this.gl;gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,tex);this.uniform(p,name,unit,true);}
 private newTexture(bitmap?:ImageBitmap|Surface,repeat=false){const gl=this.gl,t=gl.createTexture()!;gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,false);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL,gl.NONE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,repeat?gl.REPEAT:gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);if(bitmap){gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);}else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([128,128,255,255]));return t;}
 setSource(bitmap:ImageBitmap){const gl=this.gl;if(bitmap.width>this.capability.maxTexture||bitmap.height>this.capability.maxTexture)throw new Error(`This GPU accepts source textures up to ${this.capability.maxTexture}px per side. Resize the source first.`);const next=this.newTexture(bitmap);if(gl.getError()!==gl.NO_ERROR){gl.deleteTexture(next);throw new Error('The GPU could not allocate the source image. Try a smaller photograph.');}if(this.sourceTexture)gl.deleteTexture(this.sourceTexture);this.sourceTexture=next;this.sourceWidth=bitmap.width;this.sourceHeight=bitmap.height;this.sourceGeneration++;this.photoKey='';this.glowKey='';this.atlasKey='';}
 setPieceSources(sources:{id:string;bitmap:ImageBitmap}[]){
  const ids=new Set(sources.map(s=>s.id)),created:string[]=[];
  try{for(const s of sources){if(this.pieceSources.has(s.id))continue;if(Math.max(s.bitmap.width,s.bitmap.height)>this.capability.maxTexture)throw new Error('A piece photo exceeds this GPU texture limit.');const texture=this.newTexture(s.bitmap);if(this.gl.getError()!==this.gl.NO_ERROR){this.gl.deleteTexture(texture);throw new Error('Not enough graphics memory for these photos. Use smaller images.');}this.pieceSources.set(s.id,{texture,width:s.bitmap.width,height:s.bitmap.height});created.push(s.id);}}
  catch(error){for(const id of created){this.gl.deleteTexture(this.pieceSources.get(id)!.texture);this.pieceSources.delete(id);}throw error;}
  for(const [id,s] of this.pieceSources)if(!ids.has(id)){this.gl.deleteTexture(s.texture);this.pieceSources.delete(id);}
  this.atlasKey='';this.photoKey='';this.glowKey='';
 }
 setAsset(asset:MaterialAsset|null){this.materialMaps.forEach(t=>this.gl.deleteTexture(t));this.materialMaps=[];this.asset=asset?.manifest??null;if(!asset)return;
  const m=asset.maps,packed=surface(asset.manifest.width,asset.manifest.height),ctx=context2d(packed);const image=ctx.createImageData(packed.width,packed.height);for(let i=0;i<image.data.length;i+=4){image.data[i]=128;image.data[i+1]=220;image.data[i+2]=255;image.data[i+3]=0;}
  for(const [channel,index] of [['height',0],['roughness',1],['coating',2],['fibre',3]] as const){if(!m[channel])continue;ctx.clearRect(0,0,packed.width,packed.height);ctx.drawImage(m[channel]!,0,0);const bytes=ctx.getImageData(0,0,packed.width,packed.height).data;for(let i=0;i<bytes.length;i+=4)image.data[i+index]=bytes[i];}ctx.putImageData(image,0,0);
  this.materialMaps=[this.newTexture(m.albedo,true),this.newTexture(packed,true),this.newTexture(m.normal,true)];
 }
 private target(name:string,w:number,h:number){const old=this.targets.get(name);if(old&&old.width===w&&old.height===h)return old;const gl=this.gl;if(old){gl.deleteTexture(old.texture);gl.deleteFramebuffer(old.framebuffer);}const texture=this.newTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,w,h,0,gl.RGBA,gl.UNSIGNED_BYTE,null);const framebuffer=gl.createFramebuffer()!;gl.bindFramebuffer(gl.FRAMEBUFFER,framebuffer);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw new Error('GPU memory limit reached. Reduce output size.');const t={texture,framebuffer,width:w,height:h};this.targets.set(name,t);return t;}
 private pass(name:string,t:Target|null,w:number,h:number){const gl=this.gl;gl.bindFramebuffer(gl.FRAMEBUFFER,t?.framebuffer??null);gl.viewport(0,0,w,h);const p=this.programs[name];gl.useProgram(p);return p;}
 private draw(){this.gl.drawArrays(this.gl.TRIANGLES,0,3);}
 private copyGL(dest:Surface){dest.width=this.canvas.width;dest.height=this.canvas.height;const ctx=context2d(dest);ctx.save();ctx.translate(0,dest.height);ctx.scale(1,-1);ctx.drawImage(this.canvas,0,0);ctx.restore();}
 private photograph(p:Project,pw:number,ph:number,input:{texture:WebGLTexture;width:number;height:number},identity:string,adjust:Pick<PieceEdit,'exposureEv'|'contrast'|'warmth'>=emptyPiece()){
  const gl=this.gl;
  const photoTarget=this.target('photo',pw,ph);const ts=effective(p,'tone'),fs=effective(p,'film'),bs=effective(p,'bw'),gs=effective(p,'grain');
  const photoKey=JSON.stringify([identity,adjust,p.tone,p.film,p.bw,p.grain,p.finishStrength,p.composition.crop,pw,ph]);const photoCached=photoKey===this.photoKey;
  if(!photoCached){
   const hw=Math.round(512*Math.min(1,input.width/input.height)),hh=Math.round(512*Math.min(1,input.height/input.width));const ha=this.target('highlight',hw,hh),hb=this.target('blur',hw,hh),hc=this.target('glow',hw,hh);
   const glowKey=JSON.stringify([identity,adjust.exposureEv,ts*p.tone.exposureEv+adjust.exposureEv*p.finishStrength/100,fs>0&&p.film.halation>0,fs>0&&p.film.bloom>0,p.film.halationThreshold,p.film.bloomThreshold,p.film.halationRadius,p.film.bloomRadius]);
   if(glowKey!==this.glowKey){let program=this.pass('highlight',ha,hw,hh);this.texture(program,'source',input.texture,0);this.uniform(program,'exposure',ts*p.tone.exposureEv+adjust.exposureEv*p.finishStrength/100);this.uniform(program,'thresholds',[p.film.halationThreshold/100,p.film.bloomThreshold/100]);this.draw();
    const short=Math.min(hw,hh);for(let i=0;i<2;i++){program=this.pass('blur',i?hc:hb,hw,hh);this.texture(program,'source',i?hb.texture:ha.texture,0);this.uniform(program,'axis',i?[0,1/hh]:[1/hw,0]);this.uniform(program,'radii',[(.5+p.film.halationRadius*.15)/1000*short,(2+p.film.bloomRadius*.5)/1000*short]);this.draw();}this.glowKey=glowKey;
   }
   const pr=this.pass('photo',photoTarget,pw,ph);const f=filmById(p.film.profile),c=p.composition.crop;gl.uniform1ui(gl.getUniformLocation(pr,'grainSeed'),p.grain.seed);
   this.texture(pr,'source',input.texture,0);this.texture(pr,'glow',hc.texture,1);
   const values:Record<string,number|number[]>={crop:[c.x,c.y,c.width,c.height],sourceSize:[input.width,input.height],outputSize:[pw,ph],toneA:[ts,p.tone.exposureEv*ts+adjust.exposureEv*p.finishStrength/100,p.tone.contrast/100*ts+adjust.contrast*p.finishStrength/10000,p.tone.shadows/100*ts],toneB:[p.tone.highlights/100*ts,p.tone.blackLift/100*ts,p.tone.warmth/100*ts+adjust.warmth*p.finishStrength/10000,p.tone.detailSoftness/100*ts],filmA:[fs,p.film.responseMix/100,p.film.colourMix/100,p.film.balance/100*fs],filmB:[p.film.development,p.film.halation/100,p.film.bloom/100,f?f.family==='bw'?2:1:0],profileCurve:f?.curve??[1,0,0],profileHue:[...(f?.hue??[0,0,0]),f?.chroma??1],sensitivity:f?.sensitivity??[.2126,.7152,.0722],filterWeights:filters[p.bw.filter],filterAmount:p.bw.filterAmount/100,bw:[bs,p.bw.printContrast/100,['neutral','sepia','cool','selenium'].indexOf(p.bw.toner),p.bw.tonerAmount/100],mixer:Object.values(p.bw.mixer).map(x=>x/100),grainA:[gs,p.grain.size/100,p.grain.clustering/100,p.grain.shadowBias/100],grainB:[p.grain.chroma/100,24/({medium:56,large:102,'35mm':24}[p.grain.format]??24),p.grain.seed%16777216,0]};Object.entries(values).forEach(([k,v])=>this.uniform(pr,k,v));this.draw();this.photoKey=photoKey;
  }
  return {target:photoTarget,cached:photoCached};
 }
 render(p:Project,o:RenderOptions):{canvas:Surface;metrics:RenderMetrics}{
  const start=performance.now();const gl=this.gl;if(gl.isContextLost())throw new Error('Graphics context lost. Rebuilding the renderer will preserve your photograph and settings.');if(!this.sourceTexture)throw new Error('Choose a photograph first.');
  if(!Number.isInteger(o.width)||!Number.isInteger(o.height)||Math.min(o.width,o.height)<1||Math.max(o.width,o.height)>this.capability.maxSide||o.width*o.height>this.capability.maxPixels)throw new Error(`Output exceeds this device’s limit (${this.capability.maxSide}px per side, ${this.capability.maxPixels/1e6} MP).`);
  const warnings:string[]=[];const geo=buildGeometry(p,this.sourceWidth,this.sourceHeight),imageView=o.view==='image',individual=!imageView&&p.layout.mode!=='single'&&p.layout.photoMode==='individual';const aspect=cropAspect(p,this.sourceWidth,this.sourceHeight);
  if(imageView&&Math.abs(o.width/o.height-aspect)>Math.max(2/o.height,aspect*.002))throw new Error('Image-only dimensions must match the source crop aspect.');
  const faceMargin=28;const scale=Math.min(o.width/geo.stageWidth,o.height/geo.stageHeight);const fw=Math.max(1,Math.ceil((geo.width+2*faceMargin)*scale)),fh=Math.max(1,Math.ceil((geo.height+2*faceMargin)*scale));const placement=individual?{x:0,y:0,width:geo.width,height:geo.height,clipX:0,clipY:0,clipW:geo.width,clipH:geo.height}:imagePlacement(p,this.sourceWidth,this.sourceHeight,geo.width,geo.height);
  const pw=imageView?o.width:Math.min(this.capability.maxSide,Math.max(1,Math.ceil(placement.width*scale))),ph=imageView?o.height:Math.min(this.capability.maxSide,Math.max(1,Math.ceil(placement.height*scale)));
  const ts=effective(p,'tone');let photoTarget:Target;let photoCached=false;
  const mainSource={texture:this.sourceTexture,width:this.sourceWidth,height:this.sourceHeight};
  if(individual){
   const aw=Math.max(1,Math.ceil(geo.width*scale)),ah=Math.max(1,Math.ceil(geo.height*scale));photoTarget=this.target('atlas',aw,ah);
   const atlasKey=JSON.stringify([this.sourceGeneration,p.tone,p.film,p.bw,p.grain,p.finishStrength,p.composition.borderPct,aw,ah,geo.pieces.map(piece=>{const e=pieceEdit(p,piece.id);return [piece.x,piece.y,piece.width,piece.height,e.source?.id,e.crop,e.fit,e.exposureEv,e.contrast,e.warmth];})]);
   photoCached=atlasKey===this.atlasKey;
   if(!photoCached){
    gl.bindFramebuffer(gl.FRAMEBUFFER,photoTarget.framebuffer);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    for(const piece of geo.pieces){const edit=pieceEdit(p,piece.id),input=edit.source?this.pieceSources.get(edit.source.id):mainSource;
     if(!input)throw new Error('Missing photo for '+piece.id+': '+edit.source!.name+'. Choose that photo again or use the main photo.');
     const place=pieceImagePlacement(p,piece,input.width,input.height);
     const x=Math.round(place.x/geo.width*aw),y=Math.round(place.y/geo.height*ah),right=Math.round((place.x+place.width)/geo.width*aw),bottom=Math.round((place.y+place.height)/geo.height*ah);
     const w=Math.max(1,right-x),h=Math.max(1,bottom-y);
     const result=this.photograph({...p,composition:{...p.composition,crop:place.crop}},w,h,input,edit.source?.id??'main:'+this.sourceGeneration,edit);
     gl.bindFramebuffer(gl.READ_FRAMEBUFFER,result.target.framebuffer);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,photoTarget.framebuffer);gl.blitFramebuffer(0,0,w,h,x,y,x+w,y+h,gl.COLOR_BUFFER_BIT,gl.NEAREST);
    }
    this.atlasKey=atlasKey;
   }
  }else{const result=this.photograph(p,pw,ph,mainSource,'main:'+this.sourceGeneration);photoTarget=result.target;photoCached=result.cached;}
  const photoEnd=performance.now();this.output.width=o.width;this.output.height=o.height;const out=context2d(this.output);out.clearRect(0,0,o.width,o.height);
  if(o.includeBackground){out.fillStyle=o.flattenColour??p.stage.colour;out.fillRect(0,0,o.width,o.height);}
  if(imageView){
   // Copy the premultiplied photographic target without running paper or layout.
   this.canvas.width=pw;this.canvas.height=ph;gl.bindFramebuffer(gl.READ_FRAMEBUFFER,photoTarget.framebuffer);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,null);gl.blitFramebuffer(0,0,pw,ph,0,0,pw,ph,gl.COLOR_BUFFER_BIT,gl.NEAREST);this.copyGL(this.face);out.drawImage(this.face,0,0,o.width,o.height);
  }else{
   this.canvas.width=fw;this.canvas.height=fh;const pr=this.pass('material',null,fw,fh);this.texture(pr,'photo',photoTarget.texture,0);
   gl.uniform1ui(gl.getUniformLocation(pr,'paperSeed'),p.paper.seed);gl.uniform1ui(gl.getUniformLocation(pr,'inkSeed'),p.ink.seed);gl.uniform1ui(gl.getUniformLocation(pr,'wrinkleSeed'),p.wrinkles.seed);const ps=effective(p,'paper'),is=effective(p,'ink'),ws=effective(p,'wrinkles'),ls=effective(p,'lighting');this.uniform(pr,'faceMargin',faceMargin);this.uniform(pr,'fullBleed',p.composition.borderPct===0&&placement.width>=geo.width-.01&&placement.height>=geo.height-.01?1:0);
   const validAsset=this.asset?.id===p.paper.assetId&&this.asset?.version===p.paper.assetVersion;
   if(p.paper.assetId&&!validAsset)warnings.push(`Missing material ${p.paper.assetId}@${p.paper.assetVersion}; original procedural fallback used.`);
   for(let i=0;i<3;i++)this.texture(pr,['mapAlbedo','mapSurface','mapNormal'][i],validAsset?this.materialMaps[i]:this.sourceTexture,i+1);
   const values:Record<string,number|number[]>={sheetSize:[geo.width,geo.height],placement:[placement.x,placement.y,placement.width,placement.height],clipRect:[placement.clipX,placement.clipY,placement.clipW,placement.clipH],paperA:[ps,p.paper.tooth/100,p.paper.mottling/100,p.paper.fibres/100],paperB:[p.paper.fibreSize/100,p.paper.textureScale,p.paper.rotationDeg*Math.PI/180,materials.findIndex(m=>m.id===p.paper.profile)],paperC:[p.paper.sheen/100,p.paper.roughness/100,p.paper.thicknessMm,p.paper.seed%16777216],paperColour:rgb(p.paper.colour).map(lin),inkA:[is,p.ink.spread/100,p.ink.densityVariation/100,p.ink.coverageLoss/100],inkB:[p.ink.gravureGrain/100,p.ink.paperCoupling/100,p.ink.seed%16777216],creaseControls:[p.wrinkles.style==='crumpled'?1:0,p.wrinkles.definition/100],wrinkles:[ws,p.wrinkles.scale/100,p.wrinkles.density/100,p.wrinkles.seed%16777216],lightA:[ls,p.lighting.azimuthDeg*Math.PI/180,p.lighting.altitudeDeg*Math.PI/180,p.lighting.relief/100],lightSoftness:p.lighting.softness/100,flatView:o.view==='flat'?1:0,shortSideMm:p.composition.shortSideMm,variation:p.layout.toneVariation/100*ts,mapFlags:validAsset?[this.asset?.maps.albedo?1:0,this.asset?.maps.height?1:0,this.asset?.maps.normal?1:0,this.asset?.maps.roughness?1:0]:[0,0,0,0],extraMapFlags:validAsset?[this.asset?.maps.coating?1:0,this.asset?.maps.fibre?1:0]:[0,0],mapSize:validAsset?[this.asset!.sampleWidthMm,this.asset!.sampleHeightMm]:[150,150],assetMix:validAsset?p.paper.assetMix/100:0,pieceRects:geo.pieces.flatMap(x=>[x.x,x.y,x.width,x.height]),pieceTones:geo.pieces.flatMap(x=>[x.tone,x.tint])};Object.entries(values).forEach(([k,v])=>this.uniform(pr,k,v));this.uniform(pr,'pieceCount',geo.pieces.length,true);this.draw();this.copyGL(this.face);
  }
  const materialEnd=performance.now();
  if(!imageView){
   const offsetX=(o.width-geo.stageWidth*scale)/2+geo.originX*scale,offsetY=(o.height-geo.stageHeight*scale)/2+geo.originY*scale;
   const ls=o.view==='object'?effective(p,'lighting'):0;const angle=p.lighting.azimuthDeg*Math.PI/180,alt=p.lighting.altitudeDeg*Math.PI/180;
   const lift=p.lighting.elevation/100*15,shadowOffset=(1+lift)/Math.tan(alt),shadowBlur=(1.2+lift*.35)*(0.3+p.lighting.softness/100*1.3);
   const thickness=p.paper.thicknessMm/p.composition.shortSideMm*1000*effective(p,'paper')*ls;
   const drawPieces=!individual&&!Object.values(p.pieces).some(e=>e.rotationDeg||e.offsetX||e.offsetY)&&p.layout.gapPct===0&&p.layout.scatter===0&&(p.layout.tearAmount===0||p.finishStrength===0)?buildGeometry({...p,layout:{...p.layout,mode:'single'}},this.sourceWidth,this.sourceHeight).pieces:geo.pieces;
   for(const piece of drawPieces){
    const pad=EDGE_PAD;this.piece.width=Math.ceil((piece.width+pad*2)*scale);this.piece.height=Math.ceil((piece.height+pad*2)*scale);const ctx=context2d(this.piece);ctx.clearRect(0,0,this.piece.width,this.piece.height);
    ctx.setTransform(scale,0,0,scale,(pad-piece.x)*scale,(pad-piece.y)*scale);const path=new Path2D();piece.points.forEach(([x,y],i)=>i?path.lineTo(x,y):path.moveTo(x,y));path.closePath();ctx.save();ctx.clip(path);ctx.drawImage(this.face,-faceMargin,-faceMargin,geo.width+2*faceMargin,geo.height+2*faceMargin);
    exposedEdge(ctx,p,piece);ctx.restore();
    edgeFibres(ctx,p,piece,this.face,geo,faceMargin);
    out.save();const cx=offsetX+(piece.x+piece.dx+piece.width/2)*scale,cy=offsetY+(piece.y+piece.dy+piece.height/2)*scale;out.translate(cx,cy);out.rotate(piece.angle);
    const x=-(piece.width/2+pad)*scale,y=-(piece.height/2+pad)*scale;
    if(ls>0&&o.includeShadow&&p.lighting.shadowOpacity>0){out.shadowColor=`rgba(31,25,17,${ls*p.lighting.shadowOpacity/100})`;out.shadowBlur=shadowBlur*scale;out.shadowOffsetX=-Math.cos(angle)*shadowOffset*scale;out.shadowOffsetY=-Math.sin(angle)*shadowOffset*scale;out.drawImage(this.piece,x,y);out.shadowColor='transparent';}
    if(thickness>.01){out.globalAlpha=.4*ls;out.drawImage(this.piece,x-Math.cos(angle)*thickness*scale,y-Math.sin(angle)*thickness*scale);out.globalAlpha=1;}
    out.drawImage(this.piece,x,y);out.restore();
   }
  }
  if(gl.getError()!==gl.NO_ERROR)throw new Error('The GPU could not complete this render. Reduce output dimensions.');
  const end=performance.now(),mapPixels=this.asset?this.asset.width*this.asset.height:0;
  const estimatedBytes=((this.sourceWidth*this.sourceHeight+Array.from(this.pieceSources.values()).reduce((n,s)=>n+s.width*s.height,0))*3.34+(individual?geo.width*geo.height*scale*scale:0)+pw*ph+fw*fh*2+o.width*o.height*2+this.piece.width*this.piece.height+512*512*3+mapPixels*(3*1.34+Object.keys(this.asset?.maps??{}).length))*4;
  return {canvas:this.output,metrics:{ms:end-start,photoMs:photoEnd-start,materialMs:materialEnd-photoEnd,sceneMs:end-materialEnd,estimatedBytes,photoCached,warnings}};
 }
 async encode(p:Project,o:RenderOptions,type:string,quality:number){const result=this.render(p,o);const start=performance.now(),blob=await encodeCanvas(result.canvas,type,quality);return {blob,metrics:{...result.metrics,encodeMs:performance.now()-start}};}
 dispose(){const gl=this.gl;this.pieceSources.forEach(s=>gl.deleteTexture(s.texture));this.pieceSources.clear();this.targets.forEach(t=>{gl.deleteTexture(t.texture);gl.deleteFramebuffer(t.framebuffer);});this.targets.clear();Object.values(this.programs).forEach(p=>gl.deleteProgram(p));this.materialMaps.forEach(t=>gl.deleteTexture(t));if(this.sourceTexture)gl.deleteTexture(this.sourceTexture);this.canvas.width=1;this.canvas.height=1;this.output.width=1;this.face.width=1;this.piece.width=1;gl.getExtension('WEBGL_lose_context')?.loseContext();}
}

