import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import sharp from 'sharp';

test('fibrous edges: independent scope, unchanged interior, deterministic exports, bounds and worker parity',async({page})=>{
 await fs.mkdir('artifacts/edges',{recursive:true});
 await page.goto('/');await expect(page.locator('.status-main')).toContainText('Refined preview');
 const sample=await fs.access('Sample/DSC_5377.jpg').then(()=>'/Sample/DSC_5377.jpg',()=>'/samples/mountain-lake.jpg');
 const data=await page.evaluate(async(sample)=>{
  const root='/src/',m=await import(root+'model/project.ts'),edge=await import(root+'model/edge-styles.ts'),gmod=await import(root+'layout/geometry.ts'),adapter=await import(root+'render/adapter.ts');
  const harnessURL='/tests/browser/harness.ts',hm=await import(harnessURL),h=new hm.Harness(),diff=hm.difference;
  await h.source('/tests/fixtures/dark-paper.png');
  let p=edge.applyEdgeStyle(m.neutral(),'pulled');p.composition.aspect='1:1';p.stage.paddingPct=0;p.stage.colour='#171715';p.paper.colour='#EEE9DC';p.layout.mode='strips';p.layout.stripCount=2;p.layout.cutPositions=[.5];p.layout.tearAmount=85;p.layout.gapPct=5;
  const w=1100,hp=1200,render=(q:any)=>h.render(q,w,hp,'flat').pixels,a=render(p),repeat=render(p);
  const noOuter=m.clone(p);noOuter.edges.outerFray=0;const noInner=m.clone(p);noInner.edges.innerFray=0;
  const b=render(noOuter),c=render(noInner),geo=gmod.buildGeometry(p,1600,1600),scale=Math.min(w/geo.stageWidth,hp/geo.stageHeight),ox=(w-geo.stageWidth*scale)/2+geo.originX*scale,oy=(hp-geo.stageHeight*scale)/2+geo.originY*scale;
  const region=(one:Uint8ClampedArray,two:Uint8ClampedArray,x:number,y:number,bw:number,bh:number)=>{let total=0,max=0,n=0;for(let yy=Math.round(oy+y*scale);yy<oy+(y+bh)*scale;yy++)for(let xx=Math.round(ox+x*scale);xx<ox+(x+bw)*scale;xx++)for(let k=0;k<4;k++){const d=Math.abs(one[(yy*w+xx)*4+k]-two[(yy*w+xx)*4+k]);total+=d;max=Math.max(max,d);n++;}return {mean:total/n,max};};
  const scope={outer:region(a,b,-60,120,130,250),outerKeepsJoin:region(a,b,200,470,500,120),inner:region(a,c,200,470,500,120),innerKeepsOuter:region(a,c,-60,120,130,250),interior:region(a,b,180,100,600,300)};
  const other=m.clone(p);other.edges.seed+=555;const seeded=diff(a,render(other),true);
  const imageOnly=diff(h.render(p,600,600).pixels,h.render(m.neutral(),600,600).pixels,true);
  const zero=m.clone(p);zero.finishStrength=0;const baseline=m.clone(zero);baseline.edges=m.neutral().edges;const finishZero=diff(render(zero),render(baseline),true);
  const clean=m.clone(p);clean.edges.profile='clean';clean.edges.innerFray=0;const cleanB=m.clone(clean);cleanB.edges.looseFibres=0;cleanB.edges.longFibres=0;cleanB.edges.featherWidth=0;cleanB.edges.exposedPaper=0;const cleanEqual=diff(render(clean),render(cleanB),true);
  const all=m.clone(p);Object.assign(all.edges,{outerFray:100,innerFray:100,irregularity:100,roughness:100,featherWidth:100,looseFibres:100,longFibres:100,fibreLength:100});all.lighting.enabled=true;all.lighting.strength=100;all.lighting.elevation=100;all.lighting.altitudeDeg=15;all.lighting.shadowOpacity=100;all.layout.mode='grid';all.layout.rows=6;all.layout.columns=6;all.layout.scatter=100;
  const extreme=h.render(all,1300,1300,'object'),pixels=extreme.pixels;let borderAlpha=0;for(let x=0;x<1300;x++)borderAlpha=Math.max(borderAlpha,pixels[x*4+3],pixels[((1299)*1300+x)*4+3]);for(let y=0;y<1300;y++)borderAlpha=Math.max(borderAlpha,pixels[(y*1300)*4+3],pixels[(y*1300+1299)*4+3]);
  const worker=new adapter.RenderAdapter();await worker.init();const bitmap=await createImageBitmap(await(await fetch('/tests/fixtures/dark-paper.png')).blob());await worker.setSource(bitmap);bitmap.close();const result=await worker.render(p,{width:w,height:hp,quality:'export',view:'flat',includeBackground:false,includeShadow:true});const canvas=new OffscreenCanvas(w,hp);canvas.getContext('2d')!.drawImage(result.bitmap,0,0);result.bitmap.close();const parity=diff(a,canvas.getContext('2d')!.getImageData(0,0,w,hp).data,true);worker.dispose();
  const outputs:any[]=[];
  for(const style of edge.edgeStyles){const q=edge.applyEdgeStyle(p,style.id);q.lighting.strength=55;q.lighting.shadowOpacity=35;q.lighting.elevation=12;outputs.push({id:style.id,recipe:q,...await h.output(q,2400,'object')});}
  const transparent=await h.output(p,2000,'flat',true);
  await h.source(sample);let q=edge.applyEdgeStyle(m.initialProject(),'raw');q.composition.borderPct=0;q.composition.fit='cover';q.composition.aspect='2:3';q.layout.mode='strips';q.layout.tearAmount=90;q.layout.gapPct=2.7;q.tone.detailSoftness=0;q.ink.spread=0;q.stage.colour='#EBECE7';q.edges.outerFray=45;q.edges.innerFray=100;
  outputs.push({id:'photo-sequence',recipe:q,...await h.output(q,2400,'object')});h.renderer.dispose();
  return {scope,determinism:diff(a,repeat,true),seeded,imageOnly,finishZero,cleanEqual,borderAlpha,parity,extremeSceneMs:extreme.metrics.sceneMs,outputs,transparent};
 },sample);
 for(const out of data.outputs){await fs.writeFile('artifacts/edges/'+out.id+'.png',Buffer.from(out.base64,'base64'));await fs.writeFile('artifacts/edges/'+out.id+'-settings.json',JSON.stringify(out.recipe,null,2));const meta=await sharp('artifacts/edges/'+out.id+'.png').metadata();expect(meta.height).toBe(out.height);}
 await fs.writeFile('artifacts/edges/transparent.png',Buffer.from(data.transparent.base64,'base64'));
 for(const colour of ['#000000','#ffffff','#9f22c5'])await sharp('artifacts/edges/transparent.png').flatten({background:colour}).png().toFile('artifacts/edges/over-'+colour.slice(1)+'.png');
 const {outputs,transparent,...report}=data;await fs.writeFile('artifacts/edges/checks.json',JSON.stringify(report,null,2));
 expect(data.determinism.max).toBe(0);expect(data.seeded.mean).toBeGreaterThan(.1);expect(data.scope.outer.mean).toBeGreaterThan(.1);expect(data.scope.inner.mean).toBeGreaterThan(.1);expect(data.scope.outerKeepsJoin.max).toBe(0);expect(data.scope.innerKeepsOuter.max).toBeLessThanOrEqual(1);expect(data.scope.innerKeepsOuter.mean).toBeLessThan(.001);expect(data.scope.interior.max).toBe(0);expect(data.imageOnly.max).toBe(0);expect(data.finishZero.max).toBe(0);expect(data.cleanEqual.max).toBe(0);expect(data.borderAlpha).toBeLessThanOrEqual(1);expect(data.parity.max).toBeLessThanOrEqual(1);
});

test('edge controls give live feedback, one-step preset undo, saved settings and real downloaded export',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('.status-main')).toContainText('Refined preview');
 await page.getByRole('tab',{name:/Paper$/}).click();await page.getByRole('button',{name:'Paper edges',exact:true}).click();await expect(page.getByLabel('Inner join fraying value',{exact:true})).toBeDisabled();
 await page.getByRole('tab',{name:/Compose$/}).click();await page.getByRole('button',{name:'Strips layout',exact:true}).click();await page.getByRole('tab',{name:/Paper$/}).click();await page.locator('.effect-group').filter({has:page.getByRole('button',{name:'Paper edges',exact:true})}).locator('.advanced summary').click();const before=await page.getByLabel('Edge character value',{exact:true}).inputValue();
 await page.getByRole('button',{name:'Pulled fibres',exact:true}).click();await expect(page.getByLabel('Fibre length value',{exact:true})).toHaveValue('82');await expect(page.getByLabel('Inner join fraying value',{exact:true})).toBeEnabled();
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.getByLabel('Edge character value',{exact:true})).toHaveValue(before);await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(page.getByLabel('Fibre length value',{exact:true})).toHaveValue('82');
 await expect(page.locator('.status-main')).toContainText('Refined preview');const canvas=page.getByLabel('Rendered photograph and paper',{exact:true}),revision=await canvas.getAttribute('data-render-revision');
 await page.getByLabel('Outer edge fraying value',{exact:true}).fill('25');await page.getByLabel('Outer edge fraying value',{exact:true}).blur();await expect.poll(()=>canvas.getAttribute('data-render-revision')).not.toBe(revision);await expect(page.locator('.status-main')).toContainText('Refined preview');
 await page.getByRole('button',{name:'Project options'}).click();const settings=page.waitForEvent('download');await page.getByRole('button',{name:'Download settings',exact:true}).click();const recipeFile=await settings;await recipeFile.saveAs('artifacts/edges/ui-settings.json');const recipe=JSON.parse(await fs.readFile(await recipeFile.path() as string,'utf8'));expect(recipe.schemaVersion).toBe(6);expect(recipe.edges.outerFray).toBe(25);expect(recipe.edges.longFibres).toBe(65);
 await page.getByRole('button',{name:'Soft deckle',exact:true}).click();await page.getByLabel('Choose settings file').setInputFiles('artifacts/edges/ui-settings.json');await expect(page.getByLabel('Outer edge fraying value',{exact:true})).toHaveValue('25');await expect(page.getByLabel('Fibre length value',{exact:true})).toHaveValue('82');
 await page.getByRole('button',{name:'Export',exact:true}).click();await page.getByLabel('Export width',{exact:true}).fill('1600');await page.getByLabel('Allow enlargement',{exact:false}).check();await page.getByLabel('Transparent surroundings').check();const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download PNG',exact:true}).click();await(await pending).saveAs('artifacts/edges/ui-export.png');expect((await sharp('artifacts/edges/ui-export.png').metadata()).width).toBe(1600);
 await page.getByLabel('Fibre length value',{exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:'artifacts/edges/controls-desktop.png'});await page.setViewportSize({width:390,height:900});await page.getByLabel('Exposed paper value',{exact:true}).scrollIntoViewIfNeeded();expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);await page.screenshot({path:'artifacts/edges/controls-mobile.png'});expect(errors).toEqual([]);
});
