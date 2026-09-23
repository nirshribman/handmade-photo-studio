import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
import sharp from 'sharp';

test('independent photo pixels, per-piece tone, rotation bounds, worker parity and missing-photo errors',async({page})=>{
 await page.goto('/');await expect(page.locator('.status-main')).toContainText('Refined preview');
 const result=await page.evaluate(async()=>{
  const root='/src/',m=await import(root+'model/project.ts'),pe=await import(root+'model/pieces.ts'),geo=await import(root+'layout/geometry.ts'),input=await import(root+'imaging/input.ts'),render=await import(root+'render/renderer.ts'),adapterModule=await import(root+'render/adapter.ts');
  const sources:any[]=[];for(const colour of ['#da2828','#28bc40','#285cda']){const c=new OffscreenCanvas(600,400);const ctx=c.getContext('2d')!;ctx.fillStyle=colour;ctx.fillRect(0,0,600,400);const d=await input.decodeSource(await c.convertToBlob(),colour+'.png');sources.push(d);}
  let p=m.neutral();p.layout.mode='strips';p.layout.photoMode='individual';p.composition.aspect='2:3';p.stage.paddingPct=5;
  pe.pieceSlots(p).forEach((slot:any,i:number)=>{const {id,name,width,height,fingerprint}=sources[i].info;p=pe.updatePiece(p,slot.key,{source:{id,name,width,height,fingerprint}});});
  const r=new render.Renderer();r.setSource(sources[0].bitmap);r.setPieceSources(sources.map(d=>({id:d.info.id,bitmap:d.bitmap})));
  const g=geo.buildGeometry(p,600,400),w=800,h=Math.round(w*g.stageHeight/g.stageWidth),options={width:w,height:h,quality:'export',view:'flat',includeBackground:false,includeShadow:false};
  const pixels=(c:OffscreenCanvas|HTMLCanvasElement)=>c.getContext('2d')!.getImageData(0,0,w,h).data;
  const original=new Uint8ClampedArray(pixels(r.render(p,options).canvas));
  const samples=()=>g.pieces.map((piece:any)=>{const scale=Math.min(w/g.stageWidth,h/g.stageHeight);const x=Math.round((w-g.stageWidth*scale)/2+(g.originX+piece.x+piece.dx+piece.width/2)*scale),y=Math.round((h-g.stageHeight*scale)/2+(g.originY+piece.y+piece.dy+piece.height/2)*scale);return (y*w+x)*4;});
  const centers=samples().map((i:number)=>Array.from(original.slice(i,i+4)));
  p=pe.updatePiece(p,pe.pieceSlots(p)[1].key,{exposureEv:-1});const changed=new Uint8ClampedArray(pixels(r.render(p,options).canvas));const adjusted=samples().map((i:number)=>Array.from(changed.slice(i,i+4)));
  const a=new adapterModule.RenderAdapter();await a.init();await a.setSource(sources[0].bitmap);await a.setPieceSources(sources.map(d=>({id:d.info.id,bitmap:d.bitmap})));const output=await a.render(p,options);const c=new OffscreenCanvas(w,h);c.getContext('2d')!.drawImage(output.bitmap,0,0);const worker=pixels(c);let max=0;for(let i=0;i<worker.length;i++)max=Math.max(max,Math.abs(worker[i]-changed[i]));output.bitmap.close();a.dispose();
  p=pe.updatePiece(p,pe.pieceSlots(p)[0].key,{rotationDeg:-12,offsetX:-3});const rotated=geo.buildGeometry(p,600,400);const rh=Math.round(w*rotated.stageHeight/rotated.stageWidth);const file=await r.encode(p,{...options,height:rh},'image/png',1);const bytes=new Uint8Array(await file.blob.arrayBuffer());let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));
  r.setPieceSources([]);let missing='';try{r.render(p,options);}catch(e){missing=(e as Error).message;}r.dispose();sources.forEach(d=>d.bitmap.close());
  return {centers,adjusted,parity:max,missing,base64:btoa(text),width:w,height:rh};
 });
 expect(result.centers).toEqual([[218,40,40,255],[40,188,64,255],[40,92,218,255]]);
 expect(result.adjusted[0]).toEqual(result.centers[0]);expect(result.adjusted[2]).toEqual(result.centers[2]);expect(result.adjusted[1][1]).toBeLessThan(result.centers[1][1]);expect(result.parity).toBe(0);expect(result.missing).toContain('Missing photo');
 await fs.mkdir('artifacts/sequences',{recursive:true});await fs.writeFile('artifacts/sequences/three-colour-rotation.png',Buffer.from(result.base64,'base64'));
});

test('choose three photos, individual crop and tilt, undo, saved restore and real frame export',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await expect(page.locator('.status-main')).toContainText('Refined preview');await page.getByRole('button',{name:'Strips layout',exact:true}).click();
 await page.getByLabel('Photos in pieces',{exact:true}).selectOption('individual');await page.getByRole('button',{name:'Make a portrait triptych',exact:true}).click();
 const personal=await fs.access('Sample/DSC_5377.jpg').then(()=>true,()=>false);
 const files=personal?['Sample/DSC_5377.jpg','Sample/fire-night.jpg','Sample/dying-sun.jpg']:['public/samples/mountain-lake.jpg','tests/fixtures/night.png','tests/fixtures/portrait.png'];
 await page.getByLabel('Choose photos for pieces',{exact:true}).setInputFiles(files);await expect(page.getByRole('status')).toContainText('3 piece photos loaded');
 await page.getByRole('button',{name:'Select Strip 2',exact:true}).click();await page.getByLabel('Piece rotation value',{exact:true}).fill('3.5');await page.getByLabel('Piece rotation value',{exact:true}).blur();
 await page.getByRole('button',{name:'Undo',exact:true}).click();await expect(page.getByLabel('Piece rotation value',{exact:true})).toHaveValue('0');await page.getByRole('button',{name:'Redo',exact:true}).click();await expect(page.getByLabel('Piece rotation value',{exact:true})).toHaveValue('3.5');
 await page.getByRole('button',{name:'Crop / zoom',exact:true}).click();await page.getByLabel('Crop zoom value',{exact:true}).fill('140');await page.getByRole('button',{name:'Apply crop',exact:true}).click();
 await page.getByRole('button',{name:'Gentle stagger',exact:true}).click();await expect(page.locator('.status-main')).toContainText('Refined preview');
 await page.getByRole('button',{name:'Project options'}).click();await page.getByRole('button',{name:'Save on this device',exact:true}).click();await expect(page.getByRole('status')).toContainText('including all original photos');
 await page.reload();await expect(page.locator('.status-main')).toContainText('Refined preview');await page.getByRole('button',{name:'Project options'}).click();await page.getByRole('button',{name:'Open saved project',exact:true}).click();await page.getByRole('button',{name:'Open',exact:true}).click();
 await expect(page.getByLabel('Photos in pieces',{exact:true})).toHaveValue('individual');await page.getByRole('button',{name:'Select Strip 2',exact:true}).click();await expect(page.getByLabel('Piece rotation value',{exact:true})).toHaveValue('2.4');await expect(page.locator('.status-main')).toContainText('Refined preview');
 await page.screenshot({path:'artifacts/sequences/editor.png',fullPage:true});
 await page.getByRole('button',{name:'Export',exact:true}).click();await page.getByLabel('Export height',{exact:true}).fill('2200');await page.getByLabel('Allow enlargement',{exact:false}).check();
 const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Download PNG',exact:true}).click();const download=await pending;await download.saveAs('artifacts/sequences/three-photo-triptych.png');const metadata=await sharp(await download.path() as string).metadata();expect(metadata.height).toBe(2200);
 await page.getByRole('button',{name:'Project options'}).click();const settings=page.waitForEvent('download');await page.getByRole('button',{name:'Download settings',exact:true}).click();const recipeFile=await settings;await recipeFile.saveAs('artifacts/sequences/triptych-settings.json');const recipe=JSON.parse(await fs.readFile(await recipeFile.path() as string,'utf8'));expect(Object.values(recipe.pieces).filter((e:any)=>e.source)).toHaveLength(3);expect(recipe.schemaVersion).toBe(6);expect(recipe.pieces['strips:horizontal:1:0'].crop.width).toBeLessThan(1);expect(errors).toEqual([]);
});

test('section framing has live feedback, drag, zoom, cancel, one-step undo and mobile layout',async({page})=>{
 await page.goto('/');await expect(page.locator('.status-main')).toContainText('Refined preview');await page.getByRole('button',{name:'Strips layout',exact:true}).click();await page.getByLabel('Photos in pieces',{exact:true}).selectOption('individual');await page.getByRole('button',{name:'Make a portrait triptych',exact:true}).click();
 await page.getByLabel('Choose photos for pieces',{exact:true}).setInputFiles(['tests/fixtures/colour-chart.png','tests/fixtures/portrait.png','tests/fixtures/night.png']);await expect(page.getByRole('status')).toContainText('3 piece photos loaded');
 await page.getByRole('button',{name:'Crop / zoom',exact:true}).click();const preview=page.getByLabel('Live whole-frame crop preview',{exact:true});await expect.poll(()=>preview.evaluate((c:HTMLCanvasElement)=>c.width)).toBeGreaterThan(300);
 const before=await preview.evaluate((c:HTMLCanvasElement)=>c.toDataURL());await page.getByLabel('Crop zoom value',{exact:true}).fill('160');
 await expect.poll(()=>preview.evaluate((c:HTMLCanvasElement)=>c.toDataURL())).not.toBe(before);
 const crop=page.getByLabel('Section crop preview; drag to position, scroll to zoom, arrow keys to move',{exact:true}),box=(await crop.boundingBox())!;
 const oldX=await page.getByLabel('Photo horizontal position value',{exact:true}).inputValue();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+45,box.y+box.height/2+12,{steps:5});await page.mouse.up();await expect(page.getByLabel('Photo horizontal position value',{exact:true})).not.toHaveValue(oldX);
 await page.screenshot({path:'artifacts/sequences/framing-desktop.png',fullPage:true});await page.getByRole('button',{name:'Cancel',exact:true}).click();
 await page.getByRole('button',{name:'Crop / zoom',exact:true}).click();await expect(page.getByLabel('Crop zoom value',{exact:true})).toHaveValue('100');await page.getByLabel('Crop zoom value',{exact:true}).fill('180');await page.getByRole('button',{name:'Apply crop',exact:true}).click();await page.getByRole('button',{name:'Undo',exact:true}).click();await page.getByRole('button',{name:'Crop / zoom',exact:true}).click();await expect(page.getByLabel('Crop zoom value',{exact:true})).toHaveValue('100');
 await page.setViewportSize({width:390,height:900});await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);const dialog=(await page.getByRole('dialog').boundingBox())!;expect(dialog.width).toBeLessThanOrEqual(390);await page.screenshot({path:'artifacts/sequences/framing-mobile.png',fullPage:true});await page.getByRole('button',{name:'Cancel',exact:true}).click();
});
