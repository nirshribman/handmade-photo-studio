import { z } from 'zod';
import defaults from './neutral.json';
import quiet from './quiet.json';
import controlData from './control-data.json';
import { films, filmById, materials, contentHash } from './profiles';
import {stageDefaults,backgroundStyles} from './backgrounds';
import {edgeDefaults,cornerDefaults} from './edge-styles';
import {piecesSchema} from './pieces';
import type {PieceEdit} from './pieces';
export const RENDERER_VERSION='0.6.0';
export type Project=Omit<typeof defaults,'source'|'paper'|'pieces'>&{pieces:Record<string,PieceEdit>;source:Omit<typeof defaults.source,'fingerprint'>&{fingerprint:string|null};paper:Omit<typeof defaults.paper,'assetId'|'assetVersion'>&{assetId:string|null;assetVersion:string|null}};
export type Group='tone'|'film'|'bw'|'grain'|'ink'|'paper'|'edges'|'wrinkles'|'lighting';
export type View='object'|'flat'|'image';
export type Control=(typeof controlData)[number];
export const controls=controlData;
export const groups:Group[]=['tone','film','bw','grain','ink','paper','edges','wrinkles','lighting'];
export const clone=<T,>(p:T):T=>structuredClone(p);
export const neutral=():Project=>clone(defaults);
export const initialProject=():Project=>clone(quiet);
export function getValue(p:Project,path:string):unknown { return path.split('.').reduce((o,k)=>(o as Record<string,unknown>)[k],p as unknown); }
export function setValue(p:Project,path:string,value:unknown) {const next=clone(p);const parts=path.split('.');let o=next as unknown as Record<string,unknown>;for(const key of parts.slice(0,-1))o=o[key] as Record<string,unknown>;o[parts.at(-1)!]=value;return next;}
const enums:Record<string,string[]>={
 'composition.fit':['contain','cover'],'composition.aspect':['source','1:1','3:2','2:3','4:5','custom'],
 'stage.background':['transparent','solid'],'stage.material':backgroundStyles.map(s=>s.id),'stage.mounts':['none','black','ivory','kraft'],'edges.cornerScope':['sheet','pieces'],'output.view':['object','flat','image'],'layout.mode':['single','strips','grid'],'layout.direction':['horizontal','vertical'],'layout.photoMode':['continuous','individual'],
 'film.profile':['none',...films.map(f=>f.id)],'film.profileVersion':['1'],'bw.filter':['none','yellow','orange','red','green','blue'],
 'bw.toner':['neutral','sepia','cool','selenium'],'grain.format':['35mm','medium','large'],'paper.profile':materials.map(m=>m.id),'edges.profile':['deckled','torn','clean'],'wrinkles.style':['creased','crumpled'],
};
const extraRanges:Record<string,[number,number]>={'finishStrength':[0,100],'composition.borderPct':[0,15],'composition.shortSideMm':[50,600],'stage.paddingPct':[0,30],'composition.customAspect.width':[.01,100],'composition.customAspect.height':[.01,100]};
function buildSchema(v:unknown,path=''):z.ZodType {
 if(path==='schemaVersion')return z.literal(6);
 if(path==='pieces')return piecesSchema;
 if(path==='layout.cutPositions')return z.array(z.number().gt(0).lt(1)).max(4);
 if(path.endsWith('assetId')||path.endsWith('assetVersion')||path==='source.fingerprint')return z.string().max(200).nullable();
 if(typeof v==='boolean')return z.boolean();
 if(typeof v==='number'){
  const c=controls.find(c=>c.key===path);let range=c?[c.min,c.max]:extraRanges[path];
  if(path.endsWith('.seed'))return z.number().int().min(0).max(4294967295);
  if(path.startsWith('composition.crop.'))range=[0,1];
  let s=z.number().finite();if(range)s=s.min(range[0]).max(range[1]);
  if(/\.(rows|columns|stripCount)$/.test(path))s=s.int();return s;
 }
 if(typeof v==='string'){
  if(enums[path])return z.enum(enums[path] as [string,...string[]]);
  if(path.endsWith('.colour'))return z.string().regex(/^#[0-9a-f]{6}$/i,'Use a six-digit hexadecimal colour.');
  return z.string().max(512);
 }
 if(v&&typeof v==='object')return z.object(Object.fromEntries(Object.entries(v).map(([k,val])=>[k,buildSchema(val,path?`${path}.${k}`:k)]))).strict();
 return z.null();
}
const schema=buildSchema(defaults);
export function validateProject(raw:unknown):Project {
 const result=schema.safeParse(raw);if(!result.success)throw new Error(result.error.issues.slice(0,3).map(i=>`${i.path.join('.')||'Settings'}: ${i.message}`).join('\n'));
 const p=result.data as Project;const c=p.composition.crop;
 if(c.width<=0||c.height<=0||c.x+c.width>1.000001||c.y+c.height>1.000001)throw new Error('Crop must have positive area and stay inside the image.');
 if(p.layout.cutPositions.length!==p.layout.stripCount-1||p.layout.cutPositions.some((x,i,a)=>i>0&&x<=a[i-1]))throw new Error('Split positions must be ordered and match the number of strips.');
 return p;
}
export function importRecipe(text:string):{project:Project;notes:string[]} {
 if(new TextEncoder().encode(text).length>262144)throw new Error('Settings file exceeds the 256 KB limit.');
 let raw;try{raw=JSON.parse(text);}catch{throw new Error('This is not valid settings JSON.');}
 const notes:string[]=[];
 if(raw?.schemaVersion===1){
  const merged=deepMerge(neutral(),raw) as Project & {tone:Project['tone']&{monochrome?:number}};
  merged.schemaVersion=2;merged.rendererVersion=RENDERER_VERSION;
  if(!Number.isFinite(raw.tone?.monochrome)||raw.tone.monochrome<0||raw.tone.monochrome>100)throw new Error('Invalid legacy monochrome amount.');
  merged.bw.strength=raw.tone.monochrome*merged.tone.strength/100;merged.bw.enabled=merged.tone.enabled;delete merged.tone.monochrome;
  raw=merged;notes.push('Migrated schema 1 to 2. B&W strength preserved; renderer changes may alter pixels.');
 }
 if(raw?.schemaVersion===2){
  raw={...raw,schemaVersion:3,wrinkles:{style:'creased',definition:55,...raw.wrinkles}};
  notes.push('Migrated schema 2 to 3. Wrinkles now use irregular crease networks; older renderer output can differ.');
 }
 if(raw?.schemaVersion===3){raw={...raw,schemaVersion:4,layout:{photoMode:'continuous',...raw.layout},pieces:raw.pieces??{}};notes.push('Migrated schema 3 to 4. Existing single-photo layouts are preserved.');}
 if(raw?.schemaVersion===4){raw={...raw,schemaVersion:5,edges:{...edgeDefaults,...raw.edges}};notes.push('Migrated schema 4 to 5. New edge controls added; the revised fibre renderer can change older edges.');}
 if(raw?.schemaVersion===5){raw={...raw,schemaVersion:6,edges:{...cornerDefaults,...raw.edges},stage:{...stageDefaults,...raw.stage}};notes.push('Migrated schema 5 to 6. Plain backgrounds and existing corner shapes are preserved.');}
 else if(raw?.schemaVersion!==6)throw new Error('Unsupported settings schema. This application reads schema 1 through 6.');
 const project=validateProject(raw);
 if(project.rendererVersion!==RENDERER_VERSION)notes.push(`Settings use renderer ${project.rendererVersion}; this renderer is ${RENDERER_VERSION}.`);
 project.rendererVersion=RENDERER_VERSION;
 if(project.paper.assetId)notes.push(`Material asset ${project.paper.assetId} must be installed locally; otherwise a recorded procedural fallback is used.`);
 return {project,notes};
}
export function deepMerge<T>(base:T,patch:unknown):T {const out=clone(base) as Record<string,unknown>;for(const [k,v] of Object.entries(patch as Record<string,unknown>)){if(['__proto__','prototype','constructor'].includes(k))throw new Error('Invalid settings key.');out[k]=v&&typeof v==='object'&&!Array.isArray(v)&&out[k]&&typeof out[k]==='object'?deepMerge(out[k],v):v;}return out as T;}
export function resetGroup(p:Project,g:Group):Project {return {...p,[g]:{...neutral()[g],seed:p[g].seed}};}
export function loadFilm(p:Project,id:string):Project {
 if(id==='none')return {...p,film:{...p.film,profile:'none',profileVersion:'1'}};
 const f=filmById(id);if(!f)throw new Error('Unknown film profile.');const n=neutral();
 return {...p,film:{...n.film,seed:p.film.seed,enabled:true,strength:100,profile:id,profileVersion:f.version,balance:id==='tungsten-night'?-25:0,halation:f.halation,bloom:f.bloom},grain:{...n.grain,seed:p.grain.seed,enabled:true,strength:f.grain[0],size:f.grain[1],clustering:f.grain[2],chroma:f.grain[3]},bw:{...n.bw,seed:p.bw.seed,enabled:f.family==='bw',strength:f.family==='bw'?100:0}};
}
export function loadMaterial(p:Project,id:string):Project {
 const m=materials.find(m=>m.id===id);if(!m)throw new Error('Unknown material.');const n=neutral();
 return {...p,paper:{...n.paper,seed:p.paper.seed,enabled:true,profile:id,strength:65,colour:m.colour,tooth:m.tooth,fibres:m.fibres,mottling:m.mottling,sheen:m.sheen,roughness:m.roughness,thicknessMm:m.thicknessMm},ink:{...n.ink,seed:p.ink.seed,enabled:true,strength:m.ink[0],spread:m.ink[1],densityVariation:m.ink[2]},wrinkles:id==='creased-kozo'?{...p.wrinkles,enabled:true,strength:35,scale:45,density:45}:p.wrinkles};
}
export function applyCrumpledPaper(p:Project):Project {
 const material=loadMaterial(p,'creased-kozo');
 return {...material,ink:{...material.ink,spread:0},
  wrinkles:{...material.wrinkles,enabled:true,strength:88,style:'crumpled',scale:32,density:82,definition:76},
  lighting:{...p.lighting,enabled:true,strength:85,relief:65,altitudeDeg:32,softness:40},
 };
}
export const presetMeta=[
 {id:'quiet',name:'Quiet Paper',note:'Soft monochrome · fibrous kōzo'},
 {id:'dark',name:'Dark Print',note:'Deep tones · a full-bleed sheet'},
 {id:'sequence',name:'Torn Sequence',note:'One photograph · three moments'},
 {id:'fragments',name:'Toned Fragments',note:'A study in small variations'},
 {id:'gravure',name:'Soft Gravure',note:'Gentle grain · generous margins'},
 {id:'colour',name:'Gentle Colour',note:'Warm, quiet and true to colour'},
];
const patches:unknown[]=[quiet,
 {tone:{exposureEv:-.15,contrast:22,shadows:-10,blackLift:4,warmth:4},bw:{strength:100},paper:{strength:55,tooth:20,fibres:12,colour:'#ECE8DC'},ink:{strength:45,spread:12,densityVariation:18},grain:{strength:20},edges:{strength:45,irregularity:18,roughness:22,featherWidth:18},lighting:{strength:25,relief:15,shadowOpacity:18,elevation:10},stage:{colour:'#191919'}},
 {tone:{contrast:12,warmth:6},bw:{strength:100},paper:{strength:60,tooth:20,fibres:20,colour:'#F5F1E7'},ink:{strength:30,spread:8,densityVariation:10},edges:{strength:40,irregularity:12,roughness:20,featherWidth:25,looseFibres:15},lighting:{strength:20,shadowOpacity:15,elevation:8},layout:{mode:'strips',gapPct:1.8,tearAmount:65}},
 {tone:{contrast:10},bw:{strength:100},paper:{strength:50,tooth:20,mottling:12,colour:'#F0EBDD'},ink:{strength:35,densityVariation:18},edges:{strength:25,irregularity:8,roughness:12},lighting:{strength:20,shadowOpacity:16,elevation:8},layout:{mode:'grid',gapPct:.8,toneVariation:25}},
 {tone:{contrast:18,blackLift:6,detailSoftness:12},bw:{strength:100},paper:{strength:40,profile:'cotton',tooth:18,colour:'#F4F0E6'},ink:{strength:65,spread:18,densityVariation:20,gravureGrain:35},grain:{strength:8},edges:{strength:35,irregularity:12,roughness:16},composition:{borderPct:8}},
 {tone:{contrast:-5,highlights:-10,warmth:3},paper:{strength:45,tooth:15,mottling:8,fibres:10,colour:'#F7F3E8'},ink:{strength:25,spread:8,densityVariation:8},edges:{strength:40,irregularity:15,roughness:20,featherWidth:15},lighting:{strength:25,relief:15,shadowOpacity:18,elevation:10},composition:{borderPct:3}},
];
export const presets=patches.map(p=>validateProject(deepMerge(neutral(),p)));
export function applyPreset(p:Project,index:number,layoutToo:boolean) { const v=clone(presets[index]);v.source=p.source;v.output=p.output;v.pieces=p.pieces;v.layout.photoMode=p.layout.photoMode;v.composition={...v.composition,crop:p.composition.crop};if(!layoutToo){v.layout=p.layout;v.composition=p.composition;v.stage=p.stage;}return v; }
export function recipeDiagnostics(p:Project,installed:string[]=[]) {const f=filmById(p.film.profile),m=materials.find(m=>m.id===p.paper.profile);return {schemaVersion:6,rendererVersion:RENDERER_VERSION,recipeHash:contentHash(p),film:f?{id:f.id,version:f.version,hash:f.hash,calibration:f.calibrationStatus}:null,material:{id:m?.id,version:m?.version,hash:m?.hash,assetId:p.paper.assetId,provenance:p.paper.assetId&&installed.includes(p.paper.assetId)?'Installed map asset':m?.provenance,fallback:!!p.paper.assetId&&!installed.includes(p.paper.assetId)}};}
