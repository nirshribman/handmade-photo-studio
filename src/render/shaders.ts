export const vertex=`#version 300 es
precision highp float;
out vec2 uv;
void main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);uv=p;gl_Position=vec4(p*2.-1.,0,1);}`;
const common=`
precision highp float;
precision highp int;
in vec2 uv;out vec4 outColor;
float sat(float x){return clamp(x,0.,1.);}
vec3 linearize(vec3 c){return mix(c/12.92,pow((max(c,vec3(0))+.055)/1.055,vec3(2.4)),step(vec3(.04045),c));}
vec3 encode(vec3 c){c=max(c,vec3(0));return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(vec3(.0031308),c));}
float lum(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
uint hashU(uvec3 p){uint h=p.x*374761393u+p.y*668265263u+p.z;h=(h^(h>>13))*1274126177u;return h^(h>>16);}
float hash(vec2 p,uint s){return float(hashU(uvec3(uvec2(ivec2(p)),s)))/4294967295.;}
float noise(vec2 p,uint s){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i,s),hash(i+vec2(1,0),s),f.x),mix(hash(i+vec2(0,1),s),hash(i+1.,s),f.x),f.y);}
float curve(float y,vec3 c){y=clamp(y,0.,1.);float a=pow(max(y,.000001),c.x),b=pow(max(1.-y,.000001),c.x);float v=a/(a+b);return sat(v+4.*c.y*v*pow(1.-v,2.)-4.*c.z*v*v*(1.-v));}
vec3 luminanceCurve(vec3 c,vec3 cv){float y=lum(c),sy=encode(vec3(y)).r;float ny=linearize(vec3(curve(sy,cv))).r;return c*(ny/max(y,.000001));}
vec3 compressGamut(vec3 c){float y=clamp(lum(c),0.,1.);vec3 d=c-y;float a=1.;for(int i=0;i<3;i++){if(c[i]>1.)a=min(a,(1.-y)/max(d[i],.00001));if(c[i]<0.)a=min(a,-y/min(d[i],-.00001));}return vec3(y)+d*a;}
`;
export const highlightShader=`#version 300 es
${common}
uniform sampler2D source;uniform float exposure;uniform vec2 thresholds;
void main(){vec4 s=texture(source,uv);float y=lum(linearize(s.rgb))*exp2(exposure);vec2 t=thresholds;vec2 mask=smoothstep(t-.04,t+.04,vec2(y))*min(y,4.)*s.a;outColor=vec4(mask,0,1);}`;
export const blurShader=`#version 300 es
${common}
uniform sampler2D source;uniform vec2 axis;uniform vec2 radii;
void main(){vec2 v=vec2(0);float total=0.;for(int i=-10;i<=10;i++){float t=float(i)/10.;float w=exp(-t*t*4.5);v.x+=texture(source,uv+axis*t*radii.x).r*w;v.y+=texture(source,uv+axis*t*radii.y).g*w;total+=w;}outColor=vec4(v/total,0,1);}`;
export const photoShader=`#version 300 es
${common}
uniform sampler2D source;uniform sampler2D glow;
uniform vec4 crop;uniform vec2 sourceSize;uniform vec2 outputSize;
uniform vec4 toneA; // effective strength, exposure, contrast, shadows
uniform vec4 toneB; // highlights, lift, warmth, softness
uniform vec4 filmA; // strength, responseMix, colourMix, balance
uniform vec4 filmB; // development, halation, bloom, family (0 none, 1 colour, 2 bw)
uniform vec3 profileCurve;uniform vec4 profileHue; // xyz hue lobes; w chroma
uniform vec3 sensitivity;uniform vec3 filterWeights;uniform float filterAmount;
uniform vec4 bw; // strength, grade, toner, toner amount
uniform float mixer[6];
uniform vec4 grainA; // strength, size, clustering, shadow bias
uniform uint grainSeed;
uniform vec4 grainB; // chroma, format scale, seed, unused
vec4 getSource(vec2 p){return texture(source,clamp(p,vec2(0),vec2(1)));}
void main(){
 vec2 p=crop.xy+uv*crop.zw;vec4 s=getSource(p);
 // Premultiplied averaging prevents hidden RGB in transparent pixels from bleeding into the image.
 if(toneB.w>0.){vec2 d=vec2(toneB.w*.0012)*vec2(min(sourceSize.x,sourceSize.y))/sourceSize;vec4 a=getSource(p+vec2(d.x,0)),b=getSource(p-vec2(d.x,0)),c=getSource(p+vec2(0,d.y)),e=getSource(p-vec2(0,d.y));float al=s.a*4.+a.a+b.a+c.a+e.a;vec3 rgb=s.rgb*s.a*4.+a.rgb*a.a+b.rgb*b.a+c.rgb*c.a+e.rgb*e.a;s=vec4(rgb/max(al,.00001),al/8.);}
 vec3 c=linearize(s.rgb)*exp2(toneA.y);
 c*=vec3(1.+filmA.w*.13,1.,1.-filmA.w*.13);
 vec2 glw=texture(glow,p).rg;c+=glw.x*filmB.y*filmA.x*vec3(.42,.07,.025)+glw.y*filmB.z*filmA.x*.22;
 // Exposure highlight knee in linear luminance, before clipping or an 8-bit intermediate.
 // At zero exposure this is identity; positive exposure retains a smooth upper gradation.
 float headroom=max(0.,exp2(toneA.y)-1.);float exposedY=lum(c);
 if(headroom>0.){float knee=1.-min(.30,headroom*.15);if(exposedY>knee){float rolled=knee+(1.-knee)*(1.-exp(-(exposedY-knee)/(1.-knee)));c*=rolled/max(exposedY,.000001);}}
 vec3 cv=profileCurve;cv.x=max(.45,cv.x+filmB.x*.11);cv.y+=filmB.x*.006;cv.z+=filmB.x*.01;
 if(filmB.w==1.){
   c=mix(c,luminanceCurve(c,cv),filmA.x*filmA.y);
   float y=lum(c);vec3 d=c-y;float chr=max(c.r,max(c.g,c.b))-min(c.r,min(c.g,c.b));
   vec3 hue=vec3(d.g-d.b,d.b-d.r,d.r-d.g)*profileHue.xyz;
   vec3 transformed=vec3(y)+d*profileHue.w+hue*chr;
   c=mix(c,compressGamut(transformed),filmA.x*filmA.z);
 }
 if(bw.x>0.){
   vec3 weights=mix(vec3(.2126,.7152,.0722),sensitivity,filmB.w==2.?filmA.x:0.);weights*=mix(vec3(1),filterWeights,filterAmount);weights/=dot(weights,vec3(1));
   float grey=dot(c,weights);float mx=max(c.r,max(c.g,c.b)),mn=min(c.r,min(c.g,c.b)),chroma=mx-mn;
   float hue=0.;if(chroma>.00001){if(mx==c.r)hue=mod((c.g-c.b)/chroma,6.);else if(mx==c.g)hue=(c.b-c.r)/chroma+2.;else hue=(c.r-c.g)/chroma+4.;hue=mod(hue+6.,6.);}
   float adj=0.,sum=0.;for(int i=0;i<6;i++){float d=abs(hue-float(i));d=min(d,6.-d);float w=exp(-d*d*2.2);adj+=mixer[i]*w;sum+=w;}
   grey=sat(grey+adj/max(sum,.001)*chroma*.42*(1.-abs(grey*2.-1.)));
   grey=linearize(vec3(curve(encode(vec3(grey)).r,vec3(exp2(bw.y*.7),0,0)))).r;
   vec3 mono=vec3(grey),tint=vec3(0);if(bw.z==1.)tint=vec3(.18,.065,-.13);if(bw.z==2.)tint=vec3(-.10,.018,.12);if(bw.z==3.)tint=vec3(.075,-.02,.09);
   mono+=tint*bw.w*(4.*grey*(1.-grey))*.42;c=mix(c,mono,bw.x);
 }
 if(filmB.w==2.)c=mix(c,luminanceCurve(c,cv),filmA.x*filmA.y);
 // One source-anchored, zero-mean, density-conditioned grain field. Suppress unresolved frequencies.
 if(grainA.x>0.){
   vec2 coord=p*sourceSize/min(sourceSize.x,sourceSize.y)*1000.;float size=(.35+grainA.y*3.2)*grainB.y;
   float footprint=max(length(dFdx(coord)),length(dFdy(coord)));float aa=smoothstep(.15,1.25,size/max(footprint,.001));
   float n=noise(coord/size,grainSeed)-.5,cl=noise(coord/(size*2.7),grainSeed+71u)-.5;n=mix(n,cl,grainA.z*.65);
   float y=lum(c),sy=encode(vec3(y)).r;float amp=grainA.x*.23*sqrt(max(0.,sy*(1.-sy)))*(1.+grainA.w*(.5-sy))*aa*(1.+filmB.x*.12*filmA.x*step(.5,filmB.w));
   vec3 chrom=vec3(noise(coord/size,grainSeed+19u),noise(coord/size,grainSeed+37u),noise(coord/size,grainSeed+53u))-.5;
   c=linearize(clamp(encode(c)+(vec3(n)+chrom*grainB.x*(1.-bw.x)*.55)*amp,0.,1.));
 }
 vec3 sc=encode(c);float y=lum(sc);
 float newY=curve(y,vec3(exp2(toneA.z*.7),0,0));newY+=toneA.w*.25*4.*y*pow(1.-y,2.)+toneB.x*.25*4.*y*y*(1.-y);
 sc*=sat(newY)/max(y,.000001);sc=sc+(1.-sc)*toneB.y*.18*pow(1.-y,2.);
 sc+=toneB.z*vec3(.08,.018,-.06)*(4.*y*(1.-y));
 outColor=vec4(clamp(sc,0.,1.)*s.a,s.a);
}`;
export const materialShader=`#version 300 es
${common}
uniform sampler2D photo;uniform vec2 sheetSize;uniform vec4 placement;uniform vec4 clipRect;uniform float faceMargin;uniform float fullBleed;
uniform vec4 paperA; // strength tooth mottling fibres
uniform vec4 paperB; // fibreSize scale rotation profile
uniform vec4 paperC; // sheen roughness thickness seed
uniform vec3 paperColour;
uniform vec4 inkA; // strength spread variation loss
uniform vec3 inkB; // gravure coupling seed
uniform vec4 wrinkles; // strength size density seed
uniform vec2 creaseControls; // crumpled style, definition
uniform vec4 lightA; // strength azimuth altitude relief
uniform float lightSoftness;uniform float flatView;
uniform float shortSideMm;uniform uint paperSeed;uniform uint inkSeed;uniform uint wrinkleSeed;
uniform vec4 pieceRects[36];uniform vec2 pieceTones[36];uniform int pieceCount;uniform float variation;
uniform sampler2D mapAlbedo;uniform sampler2D mapSurface;uniform sampler2D mapNormal;
uniform vec4 mapFlags;uniform vec2 mapSize;uniform float assetMix;uniform vec2 extraMapFlags;
vec2 rotate(vec2 p,float a){return mat2(cos(a),-sin(a),sin(a),cos(a))*p;}
float fibre(vec2 q,uint seed,float scale){
 vec2 cell=floor(q/vec2(45,32));float f=0.;for(int j=-1;j<=1;j++)for(int i=-1;i<=1;i++){vec2 id=cell+vec2(i,j);float r=hash(id,seed);if(r>.23)continue;vec2 origin=(id+vec2(hash(id,seed+3u),hash(id,seed+7u)))*vec2(45,32);vec2 d=q-origin;float len=(5.+hash(id,seed+13u)*22.)*scale;float yy=d.y-.11*d.x-sin(d.x/len*3.+r*9.)*.5;float ww=.12+scale*.3;float aa=max(fwidth(q.x),fwidth(q.y));f+=exp(-yy*yy/max(ww*ww,aa*aa*.25))*exp(-pow(d.x/len,4.))*min(1.,ww/max(.1,aa));}return min(1.,f);
}
// Warped, jittered sites form non-periodic crease junctions. Layers have unrelated
// orientations, widths and activity, so folds never repeat as parallel sine bands.
vec2 creaseNetwork(vec2 q,float size,uint seed,float density){
 vec2 v=rotate(q,hash(vec2(7,13),seed)*6.283185)/size;
 vec2 warp=vec2(noise(v*.67,seed+11u),noise(v*.67+19.,seed+23u))-.5;
 v+=warp*.85;
 v+=(vec2(noise(v*3.1,seed+29u),noise(v*3.1+31.,seed+31u))-.5)*.065;
 vec2 cell=floor(v),a=vec2(0),nearestId=cell;float first=100.;
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
   vec2 id=cell+vec2(x,y),site=id+vec2(.08)+.84*vec2(hash(id,seed),hash(id,seed+47u));
   float d=dot(site-v,site-v);
   if(d<first){first=d;a=site;nearestId=id;}
 }
 // True distance to the closest Voronoi boundary. The second-nearest site can
 // switch inside a cell; using it directly creates false seams through facets.
 float border=100.;
 for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++){
   if(x==0&&y==0)continue;
   vec2 id=nearestId+vec2(x,y),b=id+vec2(.08)+.84*vec2(hash(id,seed),hash(id,seed+47u));
   float distanceToPlane=dot((a+b)*.5-v,normalize(b-a));
   float k=mix(.16,.025,creaseControls.y);
   float blend=max(k-abs(border-distanceToPlane),0.)/k;
   border=min(border,distanceToPlane)-blend*blend*k*.25;
 }
 float distanceToEdge=max(0.,border)*size;
 // Width/depth vary continuously. Per-cell random amplitudes would introduce
 // discontinuities wherever the second-nearest site changes (etched triangles).
 float random=noise(v*.57,seed+83u);
 float coverage=smoothstep(random-.28,random+.18,density);
 float aa=max(fwidth(q.x),fwidth(q.y));
 float width=max(mix(5.5,.85,creaseControls.y)*mix(.65,1.4,noise(v*.8,seed+97u)),aa*.9);
 float depth=mix(.45,1.5,noise(v*.43+37.,seed+109u));
 // Rounded, sloping facets meet along folds; no bright/dark line overlay.
 float rounded=sqrt(distanceToEdge*distanceToEdge+width*width)-width;
 float shoulder=size*mix(.18,.03,creaseControls.y);
 float facet=(1.-exp(-rounded/shoulder))*size*.014*depth*coverage;
 float valley=exp(-distanceToEdge*distanceToEdge/(width*width*5.))*.12*coverage;
 return vec2(facet,valley);
}
vec2 foldSegments(vec2 q,float spacing,uint seed,float density){
 vec2 cell=floor(q/spacing);vec2 sum=vec2(0);
 float aa=max(fwidth(q.x),fwidth(q.y));
 for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
   vec2 id=cell+vec2(x,y);float chance=hash(id,seed+151u);
   float coverage=smoothstep(chance-.1,chance+.1,density);
   vec2 centre=(id+vec2(hash(id,seed),hash(id,seed+7u)))*spacing;
   float angle=hash(id,seed+19u)*6.283185;
   vec2 d=rotate(q-centre,angle);
   float length=spacing*mix(.32,.85,hash(id,seed+31u));
   float along=d.x/length;
   if(abs(along)>1.25)continue;
   float envelope=exp(-pow(abs(along)*1.5,4.));
   float bend=sin(along*mix(1.4,3.8,hash(id,seed+43u))+chance*6.)*spacing*.055;
   bend+=(noise(vec2(d.x/spacing*7.,chance*13.),seed+53u)-.5)*spacing*.018;
   float across=d.y-bend;
   float width=max(mix(3.4,.6,creaseControls.y)*mix(.45,1.6,hash(id,seed+61u)),aa*.9);
   float rounded=sqrt(across*across+width*width)-width;
   float shoulder=spacing*mix(.095,.022,creaseControls.y)*mix(.65,1.8,hash(id,seed+73u));
   float ridge=exp(-rounded/max(width,shoulder));
   float asymmetry=tanh(across/max(width,shoulder*1.8));
   float signedDepth=mix(-1.,1.,step(.48,hash(id,seed+89u)));
   float depth=mix(.12,1.45,pow(hash(id,seed+103u),1.7));
   float height=(ridge+asymmetry*ridge*.6)*signedDepth*spacing*.016*depth;
   sum+=vec2(height,ridge*.06)*envelope*coverage;
 }
 return sum;
}
vec2 crease(vec2 q){
 if(wrinkles.x<=0.||wrinkles.z<=0.)return vec2(0);
 float size=mix(20.,150.,pow(wrinkles.y,.9));
 vec2 main=creaseNetwork(q,size,wrinkleSeed,wrinkles.z);
 vec2 broad=creaseNetwork(q+vec2(53,181),size*2.3,wrinkleSeed+307u,wrinkles.z*.85);
 vec2 folds=foldSegments(q+vec2(197,73),size*.85,wrinkleSeed+701u,wrinkles.z);
 vec2 fine=foldSegments(q+vec2(83,267),size*.33,wrinkleSeed+997u,wrinkles.z*.85);
 float crumpled=creaseControls.x;
 vec2 field=main*mix(.6,.55,crumpled)+broad*.25+folds*mix(.4,1.0,crumpled)+fine*mix(.06,.62,crumpled);
 return field*wrinkles.x*mix(1.4,2.9,crumpled);
}
void main(){
 vec2 p=uv*(sheetSize+faceMargin*2.)-faceMargin;vec2 q=rotate(p,paperB.z)/paperB.y;uint seed=paperSeed;
 float family=paperB.w;float coarse=family==3.?7.:family==5.?1.65:family==2.?.65:2.9;
 float fine=noise(q/coarse,seed),broad=noise(q/95.,seed+17u),mid=noise(q/16.,seed+29u);
 float fib=paperA.w>0.?fibre(q,seed+101u,.5+paperB.x*1.5):0.;
 float height=(fine-.5)*paperA.y*(family==3.?2.6:.8)+(mid-.5)*paperA.y*.24+fib*paperA.w*.45;
 vec2 mapUV=q*shortSideMm/1000./mapSize;vec3 albedo=vec3(1);vec4 surf=texture(mapSurface,mapUV);
 if(mapFlags.x>0.)albedo=mix(albedo,linearize(texture(mapAlbedo,mapUV).rgb),assetMix);
 if(mapFlags.y>0.)height=mix(height,(surf.r-.5)*paperA.y*2.,assetMix);
 vec2 folds=crease(q);float h=height*paperA.x+folds.x;
 // Derivatives in stable sheet coordinates, rather than output-pixel dependent normals.
 vec2 dx=dFdx(p),dy=dFdy(p);vec2 slope=vec2(dFdx(h)/max(abs(dx.x),.001),dFdy(h)/max(abs(dy.y),.001))*lightA.w*9.;
 vec3 normal=normalize(vec3(-slope,1.));
 if(mapFlags.z>0.){vec3 mn=texture(mapNormal,mapUV).rgb*2.-1.;mn.y=-mn.y;mn.xy=rotate(mn.xy,-paperB.z);normal=normalize(mix(normal,normalize(vec3(mn.xy*paperA.y*paperA.x*lightA.w*3.,max(.05,mn.z))),assetMix));}
 vec3 substrate=mix(vec3(1),paperColour,paperA.x);
 if(extraMapFlags.y>0.)fib=mix(fib,surf.a,assetMix);
 float albedoVariation=(broad-.5)*paperA.z*.075+(mid-.5)*paperA.z*.025+fib*paperA.w*.04;
 substrate=clamp(substrate*(1.+albedoVariation*paperA.x)*mix(vec3(1),albedo,paperA.x),0.,1.);
 vec2 photoUV=(p-placement.xy)/placement.zw;bool printed=fullBleed>.5||(all(greaterThanEqual(photoUV,vec2(0)))&&all(lessThanEqual(photoUV,vec2(1)))&&all(greaterThanEqual(p,clipRect.xy))&&all(lessThanEqual(p,clipRect.xy+clipRect.zw)));
 vec3 reflectance=substrate;
 if(printed){
  vec4 img=texture(photo,photoUV);
  if(inkA.x*inkA.y>0.){vec2 d=vec2(inkA.y*inkA.x*1.3)/placement.zw;img=(img*4.+texture(photo,photoUV+vec2(d.x,0))+texture(photo,photoUV-vec2(d.x,0))+texture(photo,photoUV+vec2(0,d.y))+texture(photo,photoUV-vec2(0,d.y)))/8.;}
  vec3 c=linearize(img.rgb/max(img.a,.000001));
  if(variation>0.){for(int i=0;i<36;i++){if(i>=pieceCount)break;vec4 r=pieceRects[i];if(all(greaterThanEqual(p,r.xy))&&all(lessThanEqual(p,r.xy+r.zw))){vec2 t=pieceTones[i]*variation;c*=exp2(t.x*.28);c*=vec3(1.+t.y*.08,1.,1.-t.y*.07);break;}}}
  float independent=noise(p/11.,inkSeed);float field=mix(independent,(mid+fine)*.5,inkB.y);
  float density=(field-.5)*inkA.z*.35+(noise(p/1.6,inkSeed+73u)-.5)*inkB.x*.28;
  c=pow(max(c,vec3(.000001)),vec3(1.+density*inkA.x));
  float dry=smoothstep(1.-max(.001,inkA.w*.20),1.,field)*inkA.w*inkA.x;
  vec3 printR=mix(substrate*c,substrate,dry);reflectance=mix(substrate,printR,img.a);
 }
 if(flatView<.5&&lightA.x>0.){
  vec3 L=vec3(cos(lightA.y)*cos(lightA.z),sin(lightA.y)*cos(lightA.z),sin(lightA.z));
  float diffuse=1.+(dot(normal,L)-L.z)*mix(.5,.88,wrinkles.x*step(.0001,wrinkles.z))*lightA.x;
  diffuse*=1.-clamp(folds.y,0.,1.)*lightA.x*lightA.w*.24;
  float rough=paperC.y;if(mapFlags.w>0.)rough=mix(rough,surf.g,assetMix);
  float exponent=mix(160.,2.,clamp(rough+lightSoftness*.17,0.,1.));vec3 halfV=normalize(L+vec3(0,0,1));
  float coating=extraMapFlags.x>0.?mix(1.,surf.b,assetMix):1.;
  float spec=pow(max(0.,dot(normal,halfV)),exponent)*.12*paperC.x*paperA.x*lightA.x*coating;
  reflectance=reflectance*max(.35,diffuse)*(1.-spec)+vec3(spec);
 }
 outColor=vec4(clamp(encode(reflectance),0.,1.),1.);
}`;
