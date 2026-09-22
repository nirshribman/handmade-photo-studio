import {z} from 'zod';
import type {Project} from './project';

const cropSchema=z.object({x:z.number().min(0).max(1),y:z.number().min(0).max(1),width:z.number().gt(0).max(1),height:z.number().gt(0).max(1)}).strict().refine(c=>c.x+c.width<=1.000001&&c.y+c.height<=1.000001,'Crop must stay inside its photo.');
export const pieceSchema=z.object({
 source:z.object({id:z.string().regex(/^[a-f0-9]{20}$/),name:z.string().max(512),width:z.number().int().positive().max(12000),height:z.number().int().positive().max(12000),fingerprint:z.string().regex(/^[a-f0-9]{64}$/)}).strict().refine(s=>s.width*s.height<=24000000&&s.id===s.fingerprint.slice(0,20),'Invalid photo identity or dimensions.').nullable(),
 crop:cropSchema,fit:z.enum(['cover','contain']),rotationDeg:z.number().min(-45).max(45),offsetX:z.number().min(-20).max(20),offsetY:z.number().min(-20).max(20),exposureEv:z.number().min(-3).max(3),contrast:z.number().min(-50).max(50),warmth:z.number().min(-50).max(50),
}).strict();
export type PieceEdit=z.infer<typeof pieceSchema>;
export const piecesSchema=z.record(z.string().regex(/^(grid:[0-5]:[0-5]|strips:horizontal:[0-4]:0|strips:vertical:0:[0-4])$/),pieceSchema).refine(v=>Object.keys(v).length<=46,'At most 46 piece settings are supported.');
export const emptyPiece=():PieceEdit=>({source:null,crop:{x:0,y:0,width:1,height:1},fit:'cover',rotationDeg:0,offsetX:0,offsetY:0,exposureEv:0,contrast:0,warmth:0});
export const pieceKey=(p:Project,id:string)=>p.layout.mode==='grid'?`grid:${id}`:`strips:${p.layout.direction}:${id}`;
export function pieceSlots(p:Project){
 if(p.layout.mode==='single')return [];
 const rows=p.layout.mode==='grid'?p.layout.rows:p.layout.direction==='horizontal'?p.layout.stripCount:1;
 const cols=p.layout.mode==='grid'?p.layout.columns:p.layout.direction==='vertical'?p.layout.stripCount:1;
 return Array.from({length:rows*cols},(_,i)=>{const row=Math.floor(i/cols),col=i%cols,id=`${row}:${col}`;return {id,key:pieceKey(p,id),label:p.layout.mode==='grid'?`Piece ${row+1}.${col+1}`:`Strip ${i+1}`};});
}
export const pieceEdit=(p:Project,id:string)=>p.pieces[pieceKey(p,id)]??emptyPiece();
export function updatePiece(p:Project,key:string,patch:Partial<PieceEdit>):Project{return {...p,pieces:{...p.pieces,[key]:{...(p.pieces[key]??emptyPiece()),...patch}}};}
export function referencedPhotos(p:Project){return new Set(Object.values(p.pieces).flatMap(e=>e.source?[e.source.id]:[]));}

export function activePhotos(p:Project){return new Set(p.layout.photoMode==='individual'?pieceSlots(p).flatMap(s=>{const source=p.pieces[s.key]?.source;return source?[source.id]:[];}):[]);}
