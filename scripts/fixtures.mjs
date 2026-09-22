import fs from 'node:fs/promises';
import sharp from 'sharp';
import {createHash} from 'node:crypto';
await fs.mkdir('tests/fixtures',{recursive:true});
const svg=(body,w=600,h=400)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`);
const patches=['#e63828','#e5c839','#269c48','#37bed2','#3656c7','#b44fb9','#edc7aa','#b4826c','#775544','#ececec','#999999','#222222'];
await sharp(svg(patches.map((c,i)=>`<rect x="${i%6*100}" y="${Math.floor(i/6)*140}" width="100" height="140" fill="${c}"/>`).join('')+Array.from({length:256},(_,i)=>`<rect x="${i*600/256}" y="280" width="3" height="120" fill="rgb(${i},${i},${i})"/>`).join(''))).png().toFile('tests/fixtures/colour-chart.png');
await sharp(svg(Array.from({length:24},(_,i)=>{const x=i%6*100,y=Math.floor(i/6)*100;return `<rect x="${x}" y="${y}" width="100" height="100" fill="${(i+Math.floor(i/6))%2?'#dddddd':'#444444'}"/><text x="${x+50}" y="${y+60}" fill="${(i+Math.floor(i/6))%2?'#222':'#fff'}" font-size="32" font-family="sans-serif" text-anchor="middle">${i+1}</text>`;}).join(''))).png().toFile('tests/fixtures/checkerboard.png');
await sharp(svg('<defs><radialGradient id="a"><stop stop-color="#ee2233"/><stop offset=".65" stop-color="#ee2233" stop-opacity=".7"/><stop offset="1" stop-color="#2244ff" stop-opacity="0"/></radialGradient></defs><circle cx="300" cy="200" r="150" fill="url(#a)"/>')).png().toFile('tests/fixtures/alpha.png');
await sharp(svg('<rect width="600" height="400" fill="#13151b"/><circle cx="300" cy="190" r="13" fill="white"/><rect x="80" y="120" width="14" height="80" fill="#f43925"/><rect x="470" y="90" width="20" height="120" fill="#26b0dd"/><path d="M 0 340 Q 300 280 600 340 L 600 400 L 0 400Z" fill="#333a43"/>')).png().toFile('tests/fixtures/night.png');
await sharp({create:{width:600,height:400,channels:3,background:'#888888'}}).png().toFile('tests/fixtures/grey.png');
await sharp(svg('<rect width="600" height="400" fill="#daeded"/><path d="M150 400 Q135 280 205 270 L390 270 Q475 290 470 400Z" fill="#395a76"/><ellipse cx="300" cy="172" rx="95" ry="120" fill="#c08c6b"/><path d="M200 155 Q175 10 310 26 Q418 24 402 165 Q350 66 238 102Z" fill="#3a2e28"/><ellipse cx="267" cy="165" rx="9" ry="5" fill="#292523"/><ellipse cx="335" cy="165" rx="9" ry="5" fill="#292523"/><path d="M274 232 Q300 244 326 232" fill="none" stroke="#7c4940" stroke-width="4"/><text x="22" y="375" font-family="sans-serif" font-size="18" fill="white">PORTRAIT • original synthetic fixture</text>')).png().toFile('tests/fixtures/portrait.png');
const orientation=svg('<rect width="120" height="80" fill="#3979be"/><rect width="60" height="40" fill="#e13222"/><rect x="60" width="60" height="40" fill="#31b341"/><rect x="0" y="40" width="60" height="40" fill="#e5d531"/><text x="60" y="50" fill="white" font-size="20">UP</text>',120,80);
for(const o of [1,2,6,8])await sharp(orientation).jpeg({quality:100,chromaSubsampling:'4:4:4'}).withMetadata({orientation:o}).toFile(`tests/fixtures/orientation-${o}.jpg`);
await sharp(orientation).withIccProfile('p3').jpeg({quality:100}).toFile('tests/fixtures/display-p3.jpg');
await sharp({create:{width:4000,height:3000,channels:3,background:'#567f91'}}).composite([{input:await sharp('tests/fixtures/checkerboard.png').resize(4000,2667).toBuffer(),gravity:'center'}]).jpeg({quality:90}).toFile('tests/fixtures/large-12mp.jpg');
await fs.writeFile('tests/fixtures/corrupt.png',Buffer.from([137,80,78,71,13,10,26,10]));
await fs.writeFile('tests/fixtures/unsupported.svg','<svg xmlns="http://www.w3.org/2000/svg"/>');
// A deliberately synthetic, aligned map set exercises the map path. Never represented as captured.
await fs.mkdir('tests/fixtures/material',{recursive:true});
const mapData=Buffer.alloc(256*256*3);for(let y=0;y<256;y++)for(let x=0;x<256;x++){let v=Math.round(128+80*Math.sin(x/16)*Math.cos(y/23));let i=(y*256+x)*3;mapData[i]=mapData[i+1]=mapData[i+2]=v;}
await sharp(mapData,{raw:{width:256,height:256,channels:3}}).png().toFile('tests/fixtures/material/height.png');
await sharp({create:{width:256,height:256,channels:3,background:'#faf0d8'}}).png().toFile('tests/fixtures/material/albedo.png');
await sharp({create:{width:256,height:256,channels:3,background:'#888888'}}).png().toFile('tests/fixtures/material/roughness.png');
const maps={};for(const channel of ['height','albedo','roughness']){const b=await fs.readFile(`tests/fixtures/material/${channel}.png`);maps[channel]={file:`${channel}.png`,sha256:createHash('sha256').update(b).digest('hex'),colourSpace:channel==='albedo'?'srgb':'linear',status:'procedural'};}
await fs.writeFile('tests/fixtures/material/manifest.json',JSON.stringify({id:'validation-procedural',version:'1',author:'Handmade Photo Studio',source:'Original synthetic validation fields',permission:'CC0-1.0',status:'procedural',sampleWidthMm:150,sampleHeightMm:150,width:256,height:256,tiling:'repeat',fibreDirectionDeg:0,normalConvention:'OpenGL +Y',maps},null,2));
console.log('Original fixtures written.');
