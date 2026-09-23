// Original procedural album materials. No reference photographs or stock textures are embedded.
export const albumShader=`#version 300 es
precision highp float;precision highp int;
in vec2 uv;out vec4 outColor;
uniform vec2 stageSize;uniform vec3 baseColour;uniform vec4 paperSettings;uniform vec3 pageSettings;uniform int material;uniform uint albumSeed;
uint h(uvec3 p){uint x=p.x*374761393u+p.y*668265263u+p.z;x=(x^(x>>13))*1274126177u;return x^(x>>16);}
float rnd(vec2 p,uint s){return float(h(uvec3(uvec2(ivec2(p)),s)))/4294967295.;}
float n(vec2 p,uint s){vec2 a=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rnd(a,s),rnd(a+vec2(1,0),s),f.x),mix(rnd(a+vec2(0,1),s),rnd(a+1.,s),f.x),f.y);}
float fb(vec2 p,uint s){return n(p,s)*.56+n(p*2.07+17.,s+31u)*.28+n(p*4.13-23.,s+71u)*.16;}
void main(){
 vec2 point=uv*stageSize,p=point/max(.1,pageSettings.z);float textureAmount=paperSettings.x,age=paperSettings.y,stains=paperSettings.z,edgeAmount=paperSettings.w;
 float fine=n(p*1.2,albumSeed+7u)-.5,tooth=n(p*.23,albumSeed+11u)-.5,cloud=fb(p/95.,albumSeed+13u)-.5;
 float fibre=n(vec2(p.x*.6,p.y*.055),albumSeed+29u)-.5;
 float grain=textureAmount*(fine*.043+tooth*.036+cloud*.05+fibre*.017);
 if(material==3)grain+=textureAmount*(n(vec2(p.x*.06,p.y*.8),albumSeed+97u)-.5)*.04;
 if(material==5){vec2 period=p*1.15;vec2 aa=vec2(1)-smoothstep(vec2(1.8),vec2(3.14159),fwidth(period));vec2 weave=sin(period)*aa;grain+=textureAmount*(weave.x*.016+weave.y*.021+weave.x*weave.y*.009);}
 vec3 colour=baseColour+grain;
 float cloudAge=smoothstep(.29,.74,fb(p/190.+vec2(n(p/310.,albumSeed),n(p/290.,albumSeed+107u))*.7,albumSeed+109u));
 vec2 border=min(point,stageSize-point);float edgeDistance=min(border.x,border.y);
 float agedEdge=exp(-edgeDistance/(24.+34.*n(p/65.,albumSeed+149u)))*(.52+.48*n(p/48.,albumSeed+157u));
 vec3 ochre=material==4?vec3(.07,.085,.11):vec3(.11,.19,.30);
 colour-=age*ochre*(cloudAge*.22+agedEdge*.22);colour-=edgeAmount*ochre*agedEdge*.65;
 // Irregular foxing clusters, with sparse smaller specks. The seed stays fixed across zoom/export.
 vec2 cell=floor(p/7.5),f=fract(p/7.5),centre=vec2(rnd(cell,albumSeed+173u),rnd(cell,albumSeed+181u));float random=rnd(cell,albumSeed+191u);
 float size=.06+.15*rnd(cell,albumSeed+199u);float spot=(1.-smoothstep(size*.35,size,length(f-centre)))*smoothstep(.969,.992,random);
 float cluster=smoothstep(.52,.76,fb(p/48.,albumSeed+211u));float broad=smoothstep(.66,.86,fb(p/128.,albumSeed+223u));
 colour-=stains*ochre*(spot*(.2+cluster*.8)+broad*.37);
 // Binding is a left-hand page crease, separate from photographic lighting.
 float x=point.x,crease=exp(-abs(x-28.)/15.)*.42+exp(-abs(x-37.)/2.6)*.15;
 colour*=1.-pageSettings.x*crease;colour+=pageSettings.x*exp(-abs(x-48.)/8.)*.033;
 outColor=vec4(clamp(colour,0.,1.),1.);
}`;
