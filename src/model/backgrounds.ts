import type {Project} from './project';
export const stageDefaults={"material":"plain","texture":55,"aging":0,"stains":0,"edgeShade":0,"binding":0,"textureScale":1,"seed":1201,"mounts":"none","mountSize":6};
export const backgroundStyles=[
 {id:'plain',name:'Plain colour',colour:'#F3F0E9',texture:0,aging:0,stains:0,edgeShade:0,binding:0},
 {id:'album-ivory',name:'Ivory album paper',colour:'#E9DFC7',texture:55,aging:24,stains:12,edgeShade:18,binding:20},
 {id:'antique',name:'Aged album page',colour:'#DED0B0',texture:70,aging:70,stains:48,edgeShade:58,binding:55},
 {id:'kraft',name:'Kraft scrapbook',colour:'#AB8B61',texture:68,aging:32,stains:24,edgeShade:25,binding:12},
 {id:'charcoal',name:'Black album paper',colour:'#292C29',texture:65,aging:28,stains:12,edgeShade:28,binding:28},
 {id:'linen',name:'Linen album cloth',colour:'#C5B69C',texture:65,aging:18,stains:8,edgeShade:20,binding:10},
] as const;
export function applyBackground(p:Project,id:string):Project{const style=backgroundStyles.find(s=>s.id===id);if(!style)throw new Error('Unknown background material.');const {name:_name,id:material,...values}=style;return {...p,stage:{...p.stage,...values,material,background:'solid'}};}
