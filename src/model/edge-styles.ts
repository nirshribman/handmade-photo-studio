import type {Project} from './project';
export const edgeDefaults={outerFray:100,innerFray:100,exposedPaper:0,fibreLength:25,longFibres:0,fibreClumping:45};
export const edgeStyles=[
 {id:'soft',name:'Soft deckle',note:'A fine, softly feathered rim',values:{profile:'deckled',strength:70,irregularity:24,roughness:32,featherWidth:25,looseFibres:35,exposedPaper:18,fibreLength:18,longFibres:3,fibreClumping:35}},
 {id:'raw',name:'Raw cotton',note:'An uneven tear with dense short fibres',values:{profile:'torn',strength:100,irregularity:65,roughness:85,featherWidth:78,looseFibres:90,exposedPaper:85,fibreLength:24,longFibres:7,fibreClumping:70}},
 {id:'pulled',name:'Pulled fibres',note:'A fibrous edge with longer curling strands',values:{profile:'torn',strength:100,irregularity:45,roughness:65,featherWidth:60,looseFibres:80,exposedPaper:78,fibreLength:82,longFibres:65,fibreClumping:82}},
] as const;
export function applyEdgeStyle(p:Project,id:string):Project {const style=edgeStyles.find(s=>s.id===id);if(!style)throw new Error('Unknown edge style.');return {...p,edges:{...p.edges,...style.values,enabled:true},layout:p.layout.mode==='single'?p.layout:{...p.layout,tearAmount:Math.max(60,p.layout.tearAmount)}};}
// Fixed envelopes prevent the photograph from rescaling when fraying is adjusted.
// Includes the longest supported strand, contour displacement and grazing shadow.
export const EDGE_PAD=96;
export const EDGE_MARGIN=145;
