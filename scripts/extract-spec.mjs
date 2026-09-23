import fs from 'node:fs';
const spec = fs.readFileSync('HANDMADE_PHOTO_STUDIO_SPEC.md','utf8');
const example = JSON.parse(spec.match(/~~~json\s*(\{\s*"schemaVersion": 2,[\s\S]*?)~~~/)[1]);
// Additive post-Release-1 controls. Historical documents remain unchanged.
example.schemaVersion=6;example.rendererVersion='0.6.0';example.layout.photoMode='continuous';example.pieces={};
Object.assign(example.edges,{"outerFray":100,"innerFray":100,"exposedPaper":0,"fibreLength":25,"longFibres":0,"fibreClumping":45});
Object.assign(example.edges,{"cornerRadius":0,"cornerVariation":35,"cornerScope":"sheet","rimWear":0});Object.assign(example.stage,{"material":"plain","texture":55,"aging":0,"stains":0,"edgeShade":0,"binding":0,"textureScale":1,"seed":1201,"mounts":"none","mountSize":6});
example.wrinkles.style='creased';example.wrinkles.definition=55;
const base = structuredClone(example);
base.composition.borderPct=0;
const neutral = {
tone:{strength:100,contrast:0,blackLift:0,warmth:0}, film:{}, bw:{strength:0}, grain:{},
ink:{strength:0,spread:0,densityVariation:0}, paper:{strength:0,colour:'#FFFFFF',tooth:0,mottling:0,fibres:0},
edges:{strength:0,irregularity:0,roughness:0,featherWidth:0,looseFibres:0}, wrinkles:{},
lighting:{strength:0,relief:0,shadowOpacity:0,elevation:0}};
for(const [key, values] of Object.entries(neutral)) {Object.assign(base[key],values); base[key].enabled=true;}
fs.mkdirSync('src/model',{recursive:true});
fs.writeFileSync('src/model/neutral.json',JSON.stringify(base,null,2)+'\n');
fs.writeFileSync('src/model/quiet.json',JSON.stringify(example,null,2)+'\n');
const groups = {'5.3':'tone','5.4':'grain','5.5':'ink','5.6':'paper','5.7':'edges','5.8':'wrinkles','5.9':'lighting','5.10':'layout','5.12':'film','5.13':'bw'};
const controls=[];
let group='';
for(const line of spec.split('\n')) {
 const header=line.match(/^### (5\.\d+) /); if(header) group=groups[header[1]]||'';
 if(!group||!line.startsWith('| '))continue;
 const [key,label,range,description]=line.split('|').slice(1).map(s=>s.trim());
 if(!key||['Key inside','---'].some(x=>key.startsWith(x)))continue;
 const rr=range.replaceAll('−','-').match(/^(-?\d+(?:\.\d+)?)\s*(?:–|to)\s*\+?(-?\d+(?:\.\d+)?)/);
 if(!rr)continue;
 const min=+rr[1],max=+rr[2];
 const path=`${group}.${key}`;
 let def=key.split('.').reduce((o,k)=>o[k],base[group]);
 controls.push({key:path,label,min,max,step:['exposureEv','development'].includes(key)?0.05:key==='thicknessMm'?0.01:key==='textureScale'||key==='gapPct'?0.05:1,neutral:def,group,description,kind:['size','clustering','format','fibreSize','textureScale','rotationDeg','roughness','scale','density','azimuthDeg','altitudeDeg','softness','halationRadius','bloomRadius','halationThreshold','bloomThreshold'].includes(key)?'structure':group==='layout'?'placement':'amplitude',finish:group!=='layout',invalidates:group==='layout'?['geometry','scene']:['tone','film','bw','grain'].includes(group)?['photo','material','scene']:group==='lighting'?['material','shadow','scene']:['material','scene'],seedNamespace:group,fixture:['film','bw','tone'].includes(group)?'colour-chart':group==='layout'?'checkerboard':'grey-sheet',conversion:'UI units; percentages divided by 100 in renderer; angles in radians; material units 1000 per sheet short side',prerequisite: key==='roughness'&&group==='paper'?'Active lighting and nonzero surface sheen':key==='colourMix'?'Colour film profile':null});
}
for(const [key,label,min,max,step,neutralValue,kind,group,fixture] of [
 ['finishStrength','Finish strength',0,100,1,100,'amplitude','global','colour-chart'],
 ['composition.borderPct','Image border',0,15,.1,0,'placement','composition','checkerboard'],
 ['composition.shortSideMm','Paper reference size',50,600,1,150,'structure','composition','grey-sheet'],
 ['composition.customAspect.width','Custom paper width',.01,100,.1,3,'structure','composition','checkerboard'],
 ['composition.customAspect.height','Custom paper height',.01,100,.1,2,'structure','composition','checkerboard'],
 ['stage.paddingPct','Surrounding space',0,30,1,8,'placement','stage','checkerboard'],
 ...['x','y','width','height'].map(k=>[`composition.crop.${k}`,`Crop ${k}`,0,1,.001,k==='width'||k==='height'?1:0,'placement','composition','checkerboard'])
])controls.push({key,label,min,max,step,neutral:neutralValue,group,description:label,kind,finish:key==='finishStrength',invalidates:['geometry','photo','material','scene'],seedNamespace:null,fixture,conversion:'Normalised source crop; sheet design units for composition; strength percentage divided by 100',prerequisite:null});
const wrinkleSize=controls.find(c=>c.key==='wrinkles.scale');
controls.push({...wrinkleSize,key:'wrinkles.definition',label:'Crease definition',neutral:55,kind:'structure',description:'Broad, soft bends through narrow, sharply folded creases. Does not blur the photograph.'});
controls.find(c=>c.key==='wrinkles.density').description='Coverage of irregular crease junctions, from scattered folds to dense crumpling.';

const edgeControl=controls.find(c=>c.key==='edges.looseFibres');
for(const [key,label,description] of [["outerFray","Outer edge fraying","Amount of fraying and exposed support on the outside perimeter. Does not change the cut outline."],["innerFray","Inner join fraying","Amount of fraying and exposed support on torn joins. Set Torn inner edges above zero in the layout."],["exposedPaper","Exposed paper","Additional bare paper revealed through the torn print edge. Zero keeps printed outer fibres; inner tears retain their narrow exposed support. Higher values reveal more support and pale fibres."],["fibreLength","Fibre length","Length of individual fibres. Varies naturally along the edge, in fixed sheet coordinates."],["longFibres","Long strands","Sparse, longer curling threads among the short paper fibres. Length follows Fibre length."],["fibreClumping","Fibre clumping","Groups fibres in irregular tufts with quieter gaps between them."]])controls.push({...edgeControl,key:'edges.'+key,label,description,neutral:example.edges[key],kind:['fibreLength','fibreClumping'].includes(key)?'structure':'amplitude',invalidates:['geometry','scene']});
Object.assign(controls.find(c=>c.key==='edges.featherWidth'),{label:'Frayed edge width',description:'Width of the fine tangled fringe and exposed torn support. Does not blur the photograph.'});
Object.assign(edgeControl,{label:'Fibre density',description:'Number of fine, individually drawn paper fibres. Use Fibre length and Long strands for visible threads.'});
for(const [key,label,min,max,step,neutral,kind,description] of [["edges.cornerRadius","Corner rounding",0,12,0.1,0,"amplitude","Radius as a percentage of the sheet short side. Clamped to fit each section."],["edges.cornerVariation","Uneven corners",0,100,1,35,"structure","Varies corner radii and their contours with the saved edge pattern."],["edges.rimWear","Worn rim",0,100,1,0,"amplitude","Fine edge scuffs and a shallow worn lip. Object view follows the light; Flat keeps only wear."],["stage.texture","Background texture",0,100,1,55,"amplitude","Fine paper fibres or linen weave in the album background."],["stage.aging","Paper age",0,100,1,0,"amplitude","Uneven aged colour in the background support. Does not change the photograph."],["stage.stains","Foxing and stains",0,100,1,0,"amplitude","Seeded brown specks and softly mottled patches on the background."],["stage.edgeShade","Page edge aging",0,100,1,0,"amplitude","Irregular darkening towards the album page edges."],["stage.binding","Binding crease",0,100,1,0,"amplitude","A shallow fold and binding shadow along the left edge of the album page."],["stage.textureScale","Background texture scale",0.5,3,0.05,1,"structure","Size of paper fibres, mottling and cloth weave in sheet coordinates."],["stage.mountSize","Mount corner size",2,15,0.5,6,"structure","Size of folded photo corner pockets as a percentage of each piece short side."]])controls.push({...edgeControl,key,label,min,max,step,neutral,kind,description,group:key.split('.')[0],finish:key.startsWith('edges.'),invalidates:['geometry','scene'],seedNamespace:key.split('.')[0]});
fs.writeFileSync('src/model/control-data.json',JSON.stringify(controls,null,2)+'\n');
