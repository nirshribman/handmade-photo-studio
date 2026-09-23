export interface SourceInfo {id:string;name:string;width:number;height:number;type:string;fingerprint:string;achromatic:boolean;}
export interface DecodedSource {info:SourceInfo;blob:Blob;bitmap:ImageBitmap;}
const ascii=(b:Uint8Array,a:number,n:number)=>String.fromCharCode(...b.subarray(a,a+n));
export function inspectHeader(b:Uint8Array):{width:number;height:number;type:string} {
 const d=new DataView(b.buffer,b.byteOffset,b.byteLength);let w=0,h=0,type='';
 if(b[0]===137&&ascii(b,1,3)==='PNG'){
  if(b.length<33)throw new Error('Truncated PNG.');type='image/png';w=d.getUint32(16);h=d.getUint32(20);
  for(let p=8;p+12<=b.length;){const len=d.getUint32(p),tag=ascii(b,p+4,4);if(tag==='acTL')throw new Error('Animated PNG is not supported. Choose a still PNG, JPEG or WebP.');if(len>b.length-p-12)throw new Error('Truncated PNG data.');p+=len+12;}
 }else if(b[0]===255&&b[1]===216){
  type='image/jpeg';let p=2;
  while(p+4<b.length){if(b[p]!==255){p++;continue;}const marker=b[p+1];if(marker===218||marker===217)break;if(marker===255){p++;continue;}if(marker===1||(marker>=208&&marker<=215)){p+=2;continue;}const len=d.getUint16(p+2);if(len<2||p+2+len>b.length)throw new Error('Truncated JPEG data.');if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){h=d.getUint16(p+5);w=d.getUint16(p+7);}p+=len+2;}
 }else if(ascii(b,0,4)==='RIFF'&&ascii(b,8,4)==='WEBP'){
  type='image/webp';for(let p=12;p+8<=b.length;){const tag=ascii(b,p,4),len=d.getUint32(p+4,true),q=p+8;if(q+len>b.length)throw new Error('Truncated WebP data.');if(tag==='ANIM'||tag==='ANMF')throw new Error('Animated WebP is not supported. Choose a static image.');if(tag==='VP8X'){if(b[q]&2)throw new Error('Animated WebP is not supported.');w=1+b[q+4]+(b[q+5]<<8)+(b[q+6]<<16);h=1+b[q+7]+(b[q+8]<<8)+(b[q+9]<<16);}if(tag==='VP8 '&&!w){w=d.getUint16(q+6,true)&16383;h=d.getUint16(q+8,true)&16383;}if(tag==='VP8L'&&!w){const bits=d.getUint32(q+1,true);w=(bits&16383)+1;h=((bits>>>14)&16383)+1;}p=q+len+(len%2);}
 }else throw new Error('Choose a JPEG, PNG or static WebP. GIF, SVG, HEIC, RAW and animated images are not supported.');
 if(!w||!h)throw new Error('Cannot read this image. The file may be corrupt.');
 if(!Number.isSafeInteger(w*h))throw new Error('Invalid image dimensions.');
 return {width:w,height:h,type};
}
export async function decodeSource(blob:Blob,name:string,maxTextureSide?:number):Promise<DecodedSource>{
 if(blob.size>512*1024*1024)throw new Error('This image exceeds the 512 MB file-size limit. Save a smaller encoded copy at the same pixel dimensions.');
 const bytes=new Uint8Array(await blob.arrayBuffer());const header=inspectHeader(bytes);
 if(maxTextureSide&&Math.max(header.width,header.height)>maxTextureSide)throw new Error(`This graphics device supports photos up to ${maxTextureSide.toLocaleString()} pixels per side. This photo is ${header.width.toLocaleString()} x ${header.height.toLocaleString()}.`);
 let decoded:ImageBitmap;try{decoded=await createImageBitmap(new Blob([bytes],{type:header.type}),{imageOrientation:'from-image',premultiplyAlpha:'none',colorSpaceConversion:'default'});}catch{throw new Error('The image could not be decoded. Your current photograph is safe.');}
 // Browser decoder corrects EXIF exactly once. An explicit sRGB canvas normalises embedded profiles.
 const canvas=surface(decoded.width,decoded.height),thumb=surface(48,48);let bitmap:ImageBitmap|null=null;
 try{
  const ctx=context2d(canvas,true);ctx.drawImage(decoded,0,0);decoded.close();
  const tc=context2d(thumb,true);tc.drawImage(canvas,0,0,48,48);const data=tc.getImageData(0,0,48,48).data;let chroma=0,n=0;for(let i=0;i<data.length;i+=4){if(data[i+3]<128)continue;chroma+=Math.max(data[i],data[i+1],data[i+2])-Math.min(data[i],data[i+1],data[i+2]);n++;}
  bitmap=await createImageBitmap(canvas,{premultiplyAlpha:'none',colorSpaceConversion:'none'});
  const hash=await crypto.subtle.digest('SHA-256',bytes);const fingerprint=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');
  return {blob,bitmap,info:{id:fingerprint.slice(0,20),name,width:bitmap.width,height:bitmap.height,type:header.type,fingerprint,achromatic:chroma/Math.max(1,n)<1.5}};
 }catch(error){bitmap?.close();throw new Error('Could not prepare this photo: '+(error as Error).message+' Your current photograph is retained.');}
 finally{decoded.close();canvas.width=canvas.height=1;thumb.width=thumb.height=1;}
}
import {surface,context2d} from '../render/surface';
