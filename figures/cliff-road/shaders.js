// Three WebGL layers in the figure's own isometric camera.
//  sea:   the water plane at sea level — wind chop, the swell wrapping round the headland, whitewater where
//         each crest breaks, moon glints, and the waves seen through the glass sections.
//  light: light falling on the road plane — the headlight pools, the tail lights, the road studs.
//  fx:    what hangs in the air over everything — tyre smoke, spray thrown up the cliff, the beams in the
//         sea mist (dark only), light on the portal walls and inside the bores.
// Every term is in world units; every envelope fades in and out.

const SWELL_W = (Math.PI * 2) / M.SWELL.period;
const SWELL_K = (Math.PI * 2) / (M.swellOf(6).lambda * M.U);
const SWELL_SLANT = 0.35;
const SWELL_TIP = 236;

const COMMON_GLSL = `
uniform sampler2D uCoast;uniform vec4 uTexA;uniform vec2 uTexB;uniform vec4 uBox;uniform float uPale;uniform float uFade;
vec4 coastTex(vec2 p){vec2 uv=((p-uTexA.xy)/uTexA.z+.5)/uTexB;return texture2D(uCoast,uv);}
float dWater(vec2 p){return coastTex(p).r*128.-32.;}
float dTop(vec2 p){return coastTex(p).g*128.-32.;}
vec4 inkFor(vec3 seen,float cover){vec3 ab=1.-clamp(seen,0.,1.);float a=max(max(ab.r,max(ab.g,ab.b)),cover);return vec4(vec3(a)-ab,a);}
vec4 over(vec4 top,vec4 under){return top+under*(1.-top.a);}
vec4 dithered(vec4 c){float n=(hash12(gl_FragCoord.xy+fract(uTime*.61)*91.)+hash12(gl_FragCoord.yx*1.37+fract(uTime*.37)*57.)-1.)/255.;return max(c+n*smoothstep(0.,1.5/255.,c.a),0.);}
`;

const SEA_GLSL = `${COMMON_GLSL}
uniform float uSea;uniform vec4 uSwell;uniform vec3 uMoon;uniform float uX0;
const float G=49.05;
float hashN(float n){return fract(sin(n*12.9898)*43758.5453);}
void train(vec2 p,float t,vec2 dir,float lambda,float amp,float ph,inout float h,inout vec2 g){
  float k=6.2832/lambda;float w=sqrt(G*k);float th=k*dot(dir,p)-w*t+ph;
  h+=amp*sin(th);g+=amp*k*cos(th)*dir;
}
// the swell: phase from the distance to the coast (refraction wraps the crests round the headland)
// plus a slant, so each crest reaches the tip first and runs back along both cliffs
float swellPhase(vec2 p,float d){return uSwell.x*uTime-uSwell.y*(d+uSwell.w*(uSwell.z-p.x));}
float crest;
void surface(vec2 p,out float h,out vec2 g,out float foam,out float d){
  d=dWater(p);
  float t=uTime;
  h=0.;g=vec2(0.);
  float calm=smoothstep(1.,22.,d);
  train(p,t,vec2(-.96,-.28),118.,1.1*calm,0.,h,g);
  train(p,t,vec2(-.88,.47),76.,.62*calm,1.7,h,g);
  train(p,t,vec2(-.99,.12),52.,.38*calm,4.1,h,g);
  train(p,t,vec2(-.71,-.70),33.,.22*calm,2.3,h,g);
  train(p,t,vec2(-.6,.8),21.,.12*calm,5.2,h,g);
  // swell with shoaling near the cliffs
  float e=1.5;
  vec2 gd=vec2(dWater(p+vec2(e,0.))-dWater(p-vec2(e,0.)),dWater(p+vec2(0.,e))-dWater(p-vec2(0.,e)))/(2.*e);
  float th=swellPhase(p,d);
  float grow=1.+1.4*smoothstep(60.,4.,d);
  float amp=2.6*grow;
  h+=amp*sin(th);
  g+=amp*uSwell.y*cos(th)*(-(gd-vec2(uSwell.w,0.)));
  // whitewater: where a crest breaks (inside ~30 units of the rock) and behind it as it runs in
  float c=(th-1.5708)/6.2832;
  float n=floor(c);
  float psi=c-n;
  float an=.55+.45*hashN(n);
  float zone=smoothstep(36.,6.,d)*smoothstep(-1.,1.5,d);
  // the broken crest runs in with the swell: a band just behind the crest line, then its trail
  float fresh=exp(-psi*9.)+.28*exp(-psi*2.6);
  vec2 streak=vec2(gd.y,-gd.x);
  float lace=noise2(p*.16+streak*psi*3.+vec2(t*.4,t*.1))*.6+noise2(p*.37-vec2(t*.2,0.))*.4;
  float wash=smoothstep(5.,.3,d)*(.45+.55*an)*(.35+.65*exp(-psi*2.5));
  foam=zone*an*(1.5*exp(-psi*7.)+.4*exp(-psi*2.))*smoothstep(.3,.7,lace+.3*fresh);
  foam+=wash*(.55+.45*smoothstep(.3,.7,lace+.25));
  float trails=noise2(p*.06+streak*.3+vec2(.02*t,-.03*t));
  foam+=.22*smoothstep(.7,.86,trails)*smoothstep(48.,10.,d)*smoothstep(.5,.9,noise2(p*.21+vec2(t*.05,0.)));
  foam=clamp(foam,0.,1.);
  // the swell's crest line, catching the moon as it steepens over the shelf
  crest=exp(-pow(min(psi,1.-psi)*6.,2.))*smoothstep(90.,20.,d)*(.4+.6*an);
}
vec3 skyOf(vec3 r){
  float up=smoothstep(-.15,.9,r.z);
  vec3 sky=mix(vec3(.05,.07,.1),vec3(.012,.018,.03),up);
  float m=max(dot(r,uMoon),0.);
  sky+=vec3(.55,.62,.75)*(.04*pow(m,8.)+.28*pow(m,90.));
  return sky;
}
float glintOf(vec3 r){float m=max(dot(r,uMoon),0.);return pow(m,2400.)*9.;}
// capillary ripples: a fine slope field that only the glints see, so the moon breaks into sparkles
vec2 rippleOf(vec2 p,float t){
  vec2 g=vec2(0.);
  g+=.16*cos(dot(p,vec2(1.13,.31))-t*5.3)*vec2(1.13,.31);
  g+=.12*cos(dot(p,vec2(-.42,1.27))-t*6.1+1.3)*vec2(-.42,1.27);
  g+=.1*cos(dot(p,vec2(.88,-.97))-t*7.2+4.1)*vec2(.88,-.97);
  g+=.08*cos(dot(p,vec2(1.71,.55))-t*8.3+2.2)*vec2(1.71,.55);
  return g;
}
vec4 waterAt(vec2 p,float hgt,vec2 g,float foam,float d){
  vec3 n=normalize(vec3(-g,1.));
  vec3 v=towardViewer();
  vec3 r=reflect(-v,n);
  vec3 rf=reflect(-v,normalize(vec3(-g-rippleOf(p,uTime)*smoothstep(2.,14.,d),1.)));
  float spark=glintOf(rf)*(1.-foam);
  float f=.02+.98*pow(1.-max(dot(n,v),0.),5.);
  float deep=smoothstep(0.,45.,d);
  if(uPale<.5){
    vec3 body=mix(vec3(.018,.04,.05),vec3(.006,.012,.018),deep);
    vec3 col=mix(body,skyOf(r),f)+vec3(.85,.9,1.)*spark;
    col+=vec3(.05,.07,.08)*smoothstep(.5,2.6,hgt)*(1.-deep*.5);
    col+=vec3(.07,.09,.11)*crest;
    col=mix(col,vec3(.55,.6,.65),foam);
    col=tonemap(col,1.25);
    float a=mix(.62,.95,deep);
    a=max(a,foam);
    return vec4(col*a,a);
  }
  vec3 shallow=vec3(.80,.865,.885);
  vec3 deepC=vec3(.64,.725,.77);
  vec3 seen=mix(shallow,deepC,deep);
  seen*=1.-.045*smoothstep(-2.,-.2,-hgt*.6);
  seen=mix(seen,vec3(.9,.94,.95),crest*.35);
  seen=mix(seen,vec3(.95,.97,.98),f*.55);
  seen=mix(seen,vec3(1.),min(1.,spark*.6));
  float cover=mix(.5,.86,deep);
  vec4 water=inkFor(seen,cover);
  // foam is paper showing through, edged with a little cool ink
  vec4 foamInk=inkFor(vec3(.985,.99,.995),0.);
  return mix(water,foamInk,foam);
}
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  float px=pixelOf();
  vec3 q=onFloor(vb,uSea);
  float inBox=window(q.x,uBox.x,uBox.z,.7*px/uCam.z)*window(q.y,uBox.y,uBox.w,.7*px/uCam.z);
  vec4 col=vec4(0.);
  if(inBox>.001&&dWater(q.xy)>-6.){
    float hgt;vec2 g;float foam;float d;
    surface(q.xy,hgt,g,foam,d);
    col=waterAt(q.xy,hgt,g,foam,d)*inBox;
  }
  // the water seen through the two glass sections: from 37 up to the moving surface
  float pz=px/uCam.w;
  vec3 fy=onWallY(vb,uBox.w-.8);
  vec3 fx=onWallX(vb,uBox.z-.8);
  for(int k=0;k<2;k++){
    vec3 w=k==0?fy:fx;
    if(abs(w.z-uSea)>9.)continue;
    float along=k==0?window(w.x,uX0,uBox.z,.7*px/uCam.x):window(w.y,uBox.y,uBox.w,.7*px/uCam.y);
    if(along<.001)continue;
    float hgt;vec2 g;float foam;float d;
    surface(w.xy,hgt,g,foam,d);
    float top=uSea+hgt*.85;
    float band=window(w.z,uSea-3.2,top,.7*pz)*along;
    float lip=exp(-pow((w.z-top)/max(.5,.9*pz),2.))*along;
    if(uPale<.5){
      vec3 c=mix(vec3(.02,.045,.055),vec3(.6,.66,.7),max(foam,.0)*.6)+vec3(.25,.3,.34)*lip;
      vec4 b=vec4(c*.88,.88)*band+vec4(vec3(.3,.36,.4)*lip*.6,lip*.6)*(1.-band);
      col=over(b,col);
    }else{
      vec4 b=inkFor(mix(vec3(.74,.81,.84),vec3(.97),foam*.7),.0)*band;
      b=over(inkFor(vec3(.55,.63,.68),0.)*lip*.7,b);
      col=over(b,col);
    }
  }
  gl_FragColor=dithered(col*uFade);
}`;

const LIGHT_GLSL = `${COMMON_GLSL}
uniform float uRoad;uniform float uPortalX;uniform vec4 uCarA;uniform vec4 uCarB;uniform vec2 uStud[24];
vec3 lampAt(float side,out vec3 dir){
  float c=cos(uCarA.z);float s=sin(uCarA.z);
  dir=normalize(vec3(c,s,-.022));
  return vec3(uCarA.x+c*9.3-s*side*2.55,uCarA.y+s*9.3+c*side*2.55,uRoad+4.8);
}
// a low-beam lamp: a wide fan with a hot centre, falling off as h/r^3 on the ground
float headOn(vec3 q,vec3 L,vec3 dir){
  vec3 v=q-L;float r=length(v);
  vec2 hv=normalize(v.xy);
  float ca=dot(hv,normalize(dir.xy));
  float ah=acos(clamp(ca,-1.,1.));
  float pattern=exp(-pow(ah/.4,2.))*(1.+2.2*exp(-pow(ah/.12,2.)));
  float h=max(L.z-q.z,.01);
  return pattern*h/(r*r*r)*smoothstep(1.,6.,r);
}
float headAt(vec3 q){vec3 d0;vec3 d1;vec3 a=lampAt(1.,d0);vec3 b=lampAt(-1.,d1);return (headOn(q,a,d0)+headOn(q,b,d1))*uCarA.w;}
float tailAt(vec3 q){
  float c=cos(uCarA.z);float s=sin(uCarA.z);
  vec2 back=vec2(uCarA.x-c*10.8,uCarA.y-s*10.8);
  vec2 v=q.xy-back;
  float behind=smoothstep(-2.,4.,-dot(v,vec2(c,s)));
  float r=length(v);
  return behind*exp(-r/4.5)*(.35+1.4*uCarB.x)*uCarA.w;
}
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  float px=pixelOf()/uCam.z;
  vec3 q=onFloor(vb,uRoad);
  float land=1.-smoothstep(-.7*px,.7*px,dTop(q.xy));
  land*=smoothstep(uPortalX-.5*px,uPortalX+.5*px,q.x);
  land*=window(q.x,uBox.x,uBox.z,.7*px)*window(q.y,uBox.y,uBox.w,.7*px);
  if(land<.001){gl_FragColor=vec4(0.);return;}
  float e=headAt(q)*30000.;
  float t=tailAt(q)*.5;
  float stud=0.;
  for(int i=0;i<24;i++){
    vec2 s=uStud[i];
    float d2=dot(q.xy-s,q.xy-s);
    if(d2<4.)stud+=exp(-d2/.36)*min(headAt(vec3(s,uRoad))*60000.,6.);
  }
  vec4 col;
  if(uPale<.5){
    vec3 c=vec3(1.,.9,.74)*e+vec3(1.,.1,.05)*t+vec3(1.,.95,.82)*stud;
    c=tonemap(c,.62)*.82;
    col=vec4(c,max(c.r,max(c.g,c.b)));
  }else{
    float a=.62*(1.-exp(-1.1*e));
    vec4 head=vec4(vec3(1.,.8,.36)*a,a);
    float ta=.45*(1.-exp(-2.*t));
    vec4 tail=vec4(vec3(.9,.18,.12)*ta,ta);
    float sa=.92*(1.-exp(-1.5*stud));
    vec4 st=vec4(vec3(.98,.62,.08)*sa,sa);
    col=over(st,over(tail,head));
  }
  gl_FragColor=dithered(col*land*uFade);
}`;

const fxGlsl = (NS, NP) => `${COMMON_GLSL}
uniform float uRoad;uniform float uPortalX;uniform vec4 uCarA;uniform vec4 uCarB;
uniform vec4 uSmk[${NS}];uniform vec4 uSmkB[${NS}];uniform vec4 uSpr[${NP}];uniform vec4 uSprB[${NP}];
uniform vec4 uPortA;uniform vec4 uPortB;uniform float uBeams;
// the car as an oriented box: returns where the pixel's ray enters it (larger t is nearer), or -1e9
float carHit(vec3 p0,vec3 v){
  float c=cos(uCarA.z);float s=sin(uCarA.z);
  vec3 o=p0-vec3(uCarA.x,uCarA.y,uRoad+3.2);
  vec3 lo=vec3(c*o.x+s*o.y,-s*o.x+c*o.y,o.z);
  vec3 lv=vec3(c*v.x+s*v.y,-s*v.x+c*v.y,v.z);
  vec3 hb=vec3(10.9,4.4,3.3);
  vec3 inv=1./lv;
  vec3 t0=(-hb-lo)*inv;vec3 t1=(hb-lo)*inv;
  vec3 tmin=min(t0,t1);vec3 tmax=max(t0,t1);
  float ta=max(max(tmin.x,tmin.y),tmin.z);float tb=min(min(tmax.x,tmax.y),tmax.z);
  return (tb>=ta&&uCarA.w>.5)?tb:-1e9;
}
vec3 lampAt(float side,out vec3 dir){
  float c=cos(uCarA.z);float s=sin(uCarA.z);
  dir=normalize(vec3(c,s,-.022));
  return vec3(uCarA.x+c*9.3-s*side*2.55,uCarA.y+s*9.3+c*side*2.55,uRoad+4.8);
}
float headOn(vec3 q,vec3 n,vec3 L,vec3 dir){
  vec3 v=q-L;float r=length(v);
  float ca=dot(normalize(v.xy),normalize(dir.xy));
  float ah=acos(clamp(ca,-1.,1.));
  float pattern=exp(-pow(ah/.4,2.))*(1.+2.2*exp(-pow(ah/.12,2.)));
  float inc=max(dot(n,-v/r),0.);
  return pattern*inc/(r*r)*smoothstep(1.,6.,r);
}
float blob(vec3 p0,vec3 v,vec3 c,float r,float tCar){
  vec3 w=c-p0;float tc=dot(w,v);float d2=dot(w,w)-tc*tc;
  float hidden=tCar>-1e8?smoothstep(-2.,2.,tCar-tc):0.;
  return exp(-d2/(r*r))*(1.-hidden);
}
// a gaussian stretched k times taller than it is wide: a sheet of spray climbing the rock
float sheet(vec3 p0,vec3 v,vec3 c,float r,float k){
  vec3 w=c-p0;
  vec3 ws=vec3(w.xy,w.z/k);vec3 vs=vec3(v.xy,v.z/k);
  float vv=dot(vs,vs);float t=dot(ws,vs);
  float d2=dot(ws,ws)-t*t/vv;
  return exp(-d2/(r*r))*inversesqrt(vv);
}
void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  float px=pixelOf();
  vec3 v=towardViewer();
  vec3 p0=rayOf(vb);
  float tCar=carHit(p0,v);
  vec4 col=vec4(0.);
  // spray thrown up the cliff, then tyre smoke, both as soft volumes
  float spray=0.;float under=0.;
  for(int i=0;i<${NP};i++){
    vec4 s=uSpr[i];vec4 sb=uSprB[i];
    if(sb.x<.002)continue;
    float b=sheet(p0,v,s.xyz,s.w,sb.z)*sb.x*sb.y;
    spray+=b;
    under+=b*smoothstep(s.z+s.w*.2,s.z-s.w*.8,p0.z+v.z*dot(s.xyz-p0,v));
  }
  // spray is threads of water flung upward: streaks that climb; smoke billows
  float threads=.5+.5*noise2(vec2(vb.x*.42,vb.y*.045+uTime*1.4))*(.7+.3*noise2(vec2(vb.x*1.3,vb.y*.12+uTime*2.1)));
  spray*=threads*1.25;under*=threads*1.25;
  float smoke=0.;float heat=0.;
  for(int i=0;i<${NS};i++){
    vec4 s=uSmk[i];vec4 sb=uSmkB[i];
    if(sb.x<.002)continue;
    float b=blob(p0,v,s.xyz,s.w,tCar)*sb.x;
    smoke+=b;heat+=b*sb.y;
  }
  heat/=max(smoke,1e-4);
  smoke*=.55+.6*fbm2(vb*.06+vec2(uTime*.25,-uTime*.4));
  // light on the portal walls and down the bores
  float wall=0.;float bore=0.;float sodium=0.;
  {
    vec3 w0=onWallX(vb,uPortalX);
    for(int k=0;k<2;k++){
      vec4 o=k==0?uPortA:uPortB;
      float dy=w0.y-o.x;
      float top=o.w+sqrt(max(o.y*o.y-dy*dy,0.));
      float soft=1.-smoothstep(-.7*px,.7*px,max(abs(dy)-o.y,max(w0.z-top,o.z-w0.z)));
      sodium+=soft*(.5+.5*smoothstep(o.z,top,w0.z));
    }
  }
  if(uCarA.w>.5){
    vec3 d0;vec3 d1;vec3 la=lampAt(1.,d0);vec3 lb=lampAt(-1.,d1);
    vec3 w=onWallX(vb,uPortalX);
    float onWall=window(w.z,uRoad,uRoad+46.,.7*px/uCam.w)*window(w.y,uBox.y,uBox.w,.7*px);
    for(int k=0;k<2;k++){
      vec4 o=k==0?uPortA:uPortB;
      float dy=w.y-o.x;
      float inArch=step(abs(dy),o.y)*step(w.z,o.w+sqrt(max(o.y*o.y-dy*dy,0.)))*step(o.z,w.z);
      float soft=1.-smoothstep(-.7*px,.7*px,max(abs(dy)-o.y,w.z-(o.w+sqrt(max(o.y*o.y-dy*dy,0.)))));
      onWall*=1.-soft*step(o.z,w.z);
      if(soft>.001){
        vec3 f=onFloor(vb,uRoad);
        if(f.x<uPortalX){
          float e=headOn(f,vec3(0.,0.,1.),la,d0)+headOn(f,vec3(0.,0.,1.),lb,d1);
          bore+=e*soft;
        }
      }
    }
    float tw=dot(w-p0,v);
    float hid=tCar>-1e8?smoothstep(-1.,1.,tCar-tw):0.;
    wall=(headOn(w,vec3(1.,0.,0.),la,d0)+headOn(w,vec3(1.,0.,0.),lb,d1))*onWall*(1.-hid)*step(uPortalX+1.,uCarA.x)*2600.;
    bore*=2600.;
  }
  // beams in the sea mist: soft volumes along each lamp's axis (dark theme only)
  float beam=0.;
  if(uBeams>.5&&uCarA.w>.5){
    for(int k=0;k<2;k++){
      vec3 dir;vec3 L=lampAt(k==0?1.:-1.,dir);
      for(int j=0;j<8;j++){
        float r=6.*pow(1.62,float(j));
        vec3 c=L+dir*r;
        float mist=.55+.45*fbm2(c.xy*.03+vec2(uTime*.05,0.));
        float past=smoothstep(uPortalX+2.,uPortalX+8.,c.x)*smoothstep(uBox.x,uBox.x+20.,c.x)*smoothstep(uBox.z,uBox.z-20.,c.x)*smoothstep(uBox.y,uBox.y+20.,c.y)*smoothstep(uBox.w,uBox.w-20.,c.y);
        beam+=blob(p0,v,c,1.6+r*.2,tCar)*mist*past*smoothstep(4.,20.,r)/(1.+r/30.);
      }
    }
  }
  if(uPale<.5){
    vec3 c=vec3(.56,.62,.68)*(1.-exp(-spray*1.3))*.9+vec3(.62,.64,.67)*(1.-exp(-smoke*1.2))*.95+vec3(.95,.18,.1)*(1.-exp(-smoke*heat*1.6))*.6;
    c+=vec3(1.,.9,.72)*(wall+bore)+vec3(.95,.9,.78)*beam*.16+vec3(1.,.48,.12)*sodium*.11;
    c=tonemap(c,1.2);
    col=vec4(c,max(c.r,max(c.g,c.b)));
  }else{
    float sa=.9*(1.-exp(-spray*.9));
    vec4 sp=inkFor(mix(vec3(.9,.94,.965),vec3(.78,.84,.88),clamp(under/max(spray,1e-3),0.,1.)),sa);
    sp*=sa/max(sp.a,1e-4);
    float ma=.85*(1.-exp(-smoke*.9));
    vec4 sm=inkFor(mix(vec3(.86,.87,.88),vec3(.93,.84,.8),heat*.5),ma);
    sm*=ma/max(sm.a,1e-4);
    float wa=.6*(1.-exp(-1.5*(wall+bore)));
    vec4 wl=vec4(vec3(1.,.78,.34)*wa,wa);
    float na=.16*sodium;
    wl=over(wl,vec4(vec3(.95,.55,.12)*na,na));
    col=over(sm,over(sp,wl));
  }
  gl_FragColor=dithered(col*uFade);
}`;

const realRatio = window.devicePixelRatio || 1;
let slowGpu = false;
try {
  Object.defineProperty(window, "devicePixelRatio", { configurable: true, get: () => (slowGpu ? Math.min(realRatio, 0.7) : realRatio) });
} catch (e) {}
function gpuOf(D, stage, pale) {
  const seaCanvas = stage.querySelector(".cr-sea-gl");
  const lightCanvas = stage.querySelector(".cr-light-gl");
  const fxCanvas = stage.querySelector(".cr-fx-gl");
  const tex = D.coast;
  const raw = Uint8Array.from(atob(tex.bytes), (c) => c.charCodeAt(0));
  const box = D.box;
  const common = {
    uTexA: [tex.x0, tex.y0, tex.step, 0],
    uTexB: [tex.nx, tex.ny],
    uBox: box,
    uPale: pale ? 1 : 0,
  };
  const moon = (() => {
    const a = (D.P.azimuth * Math.PI) / 180;
    const v = [-Math.cos(a), -Math.sin(a), 0];
    const az = Math.atan2(v[1], v[0]) + 0.5;
    const el = (56 * Math.PI) / 180;
    return [Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)];
  })();
  const sea = glLayer({ canvas: seaCanvas, fragment: SEA_GLSL, view: [D.W, D.H], camera: D.camera, maxRatio: 1.25, uniforms: ["uFade"], fixed: { ...common, uSea: D.sea, uSwell: [SWELL_W, SWELL_K, SWELL_TIP, SWELL_SLANT], uMoon: moon, uX0: D.x0 } });
  const light = sea ? glLayer({ canvas: lightCanvas, fragment: LIGHT_GLSL, view: [D.W, D.H], camera: D.camera, maxRatio: 1.25, uniforms: ["uFade", "uCarA", "uCarB"], fixed: { ...common, uRoad: D.road, uPortalX: D.portal, uStud: [...D.studs.flat(), ...Array(Math.max(0, 48 - D.studs.length * 2)).fill(-9999)].slice(0, 48) } }) : null;
  // particle counts sized to the GPU's uniform budget: older phones get fewer, not none
  const budget = (() => {
    try {
      const probe = document.createElement("canvas").getContext("webgl");
      return probe ? probe.getParameter(probe.MAX_FRAGMENT_UNIFORM_VECTORS) : 0;
    } catch (e) {
      return 0;
    }
  })();
  const NS = budget >= 224 ? 32 : 12;
  const NP = budget >= 224 ? 48 : 16;
  const fx = light ? glLayer({ canvas: fxCanvas, fragment: fxGlsl(NS, NP), view: [D.W, D.H], camera: D.camera, maxRatio: 0.6, uniforms: ["uFade", "uCarA", "uCarB", "uSmk", "uSmkB", "uSpr", "uSprB"], fixed: { ...common, uRoad: D.road, uPortalX: D.portal, uPortA: [D.portals[0].yc, D.portals[0].half, D.portals[0].z, D.portals[0].spring], uPortB: [D.portals[1].yc, D.portals[1].half, D.portals[1].z, D.portals[1].spring], uBeams: pale ? 0 : 1 } }) : null;
  if (!fx) return null;
  for (const layer of [sea, light, fx]) {
    const gl = layer.gl;
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, tex.nx, tex.ny, 0, gl.RGBA, gl.UNSIGNED_BYTE, raw);
  }
  // land height for the spray's line of sight
  const heightAt = (x, y) => {
    const i = Math.round((x - tex.x0) / tex.step);
    const j = Math.round((y - tex.y0) / tex.step);
    if (i < 0 || j < 0 || i >= tex.nx || j >= tex.ny) return 0;
    return (raw[(j * tex.nx + i) * 4 + 2] / 255) * 256;
  };
  const V = G.viewOf(D.P);
  const seen = (x, y, z) => {
    for (let t = 3; t < 300; t += 5) {
      const h = heightAt(x + V[0] * t, y + V[1] * t);
      if (h > z + V[2] * t) return 0;
    }
    return 1;
  };

  // ---- particles ------------------------------------------------------------------------------------
  const smoke = Array.from({ length: NS }, () => ({ a0: 0, age: 9, life: 1 }));
  const spray = Array.from({ length: NP }, () => ({ a0: 0, age: 9, life: 1 }));
  let smokeAt = 0;
  let smokeSide = 1;
  const crests = new Float64Array(D.sprayAt.length).fill(NaN);
  const hashN = (n) => {
    const x = Math.sin(n * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };
  const oldest = (list) => list.reduce((best, p) => (p.age / p.life > best.age / best.life ? p : best), list[0]);
  const smk = new Float32Array(NS * 4);
  const smkB = new Float32Array(NS * 4);
  const spr = new Float32Array(NP * 4);
  const sprB = new Float32Array(NP * 4);
  const windNow = (t) => {
    const w = CARS.windOf(t);
    // droplets and smoke ride at about 40% of the wind
    return [Math.cos(w.heading) * w.speed * M.U * 0.4, Math.sin(w.heading) * w.speed * M.U * 0.4];
  };
  let WIND = windNow(0);

  function step(dt, clock, car, calm) {
    WIND = windNow(clock);
    // tyre smoke from the rear wheels while the tail is out
    const slip = Math.abs(car.beta);
    smokeAt -= dt;
    if (!calm && car.dark <= 0 && slip > 0.13 && car.v > 4 && smokeAt <= 0) {
      smokeAt = 0.065;
      smokeSide = -smokeSide;
      const yaw = car.psi + car.beta;
      const c = Math.cos(yaw);
      const s = Math.sin(yaw);
      const p = oldest(smoke);
      Object.assign(p, {
        x: car.x - c * 6 - s * smokeSide * 3.55,
        y: car.y - s * 6 + c * smokeSide * 3.55,
        z: D.road + 1.2,
        vx: Math.cos(car.psi) * car.v * 5 * 0.22 + WIND[0],
        vy: Math.sin(car.psi) * car.v * 5 * 0.22 + WIND[1],
        vz: 3.2,
        age: 0,
        life: 2.9,
        a0: Math.min(1, (slip - 0.12) * 3.4) * 0.95,
        r0: 2.2,
      });
    }
    for (const p of smoke) {
      if (p.age > p.life) continue;
      p.age += dt;
      const drag = Math.exp(-dt * 1.4);
      p.vx = WIND[0] + (p.vx - WIND[0]) * drag;
      p.vy = WIND[1] + (p.vy - WIND[1]) * drag;
      p.vz *= Math.exp(-dt * 0.6);
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
    }
    // spray: each crest that reaches a point of the waterline throws a sheet up the rock
    const omega = SWELL_W;
    D.sprayAt.forEach(([x, y, nx, ny], j) => {
      const th = omega * clock - SWELL_K * SWELL_SLANT * (SWELL_TIP - x);
      const n = Math.floor((th - Math.PI / 2) / (Math.PI * 2));
      const was = crests[j];
      crests[j] = n;
      if (calm || Number.isNaN(was) || n === was) return;
      const an = 0.55 + 0.45 * hashN(n);
      if (an < 0.5 || hashN(n * 7.1 + j * 1.37) > 0.6) return;
      const p = oldest(spray);
      // each point of the waterline throws its own jet: height from the crest's size and a little luck
      const v0 = M.SPRAY.rise * M.U * (0.45 + 0.55 * an) * (0.6 + 0.7 * hashN(j + n * 3.3));
      Object.assign(p, { x: x + nx * 1.5, y: y + ny * 1.5, z: D.sea + 2, vx: nx * 4 + WIND[0] * 0.6, vy: ny * 4 + WIND[1] * 0.6, vz: v0, age: 0, life: 1.5 + hashN(j * 2.1 + n) * 0.9, a0: 0.3 + 0.25 * an, r0: 1.7 });
    });
    for (const p of spray) {
      if (p.age > p.life) continue;
      p.age += dt;
      p.vz -= 9.81 * M.U * dt * 0.55;
      const drag = Math.exp(-dt * 0.8);
      p.vx = WIND[0] + (p.vx - WIND[0]) * drag;
      p.vy = WIND[1] + (p.vy - WIND[1]) * drag;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z = Math.max(D.sea + 1, p.z + p.vz * dt);
    }
    // everything that hangs in the air fades before it leaves the block
    const inBlock = (x, y, r) => smooth(box[0] - r * 0.2, box[0] + r * 1.6 + 10, x) * smooth(box[2] + r * 0.2, box[2] - r * 1.6 - 10, x) * smooth(box[1] - r * 0.2, box[1] + r * 1.6 + 10, y) * smooth(box[3] + r * 0.2, box[3] - r * 1.6 - 10, y);
    smoke.forEach((p, i) => {
      const rr = (p.r0 || 1) + 7.5 * Math.sqrt(Math.max(0, p.age));
      const a = p.age > p.life ? 0 : p.a0 * burst(p.age, 0.12, 0.85) * smooth(p.life, p.life * 0.7, p.age) * inBlock(p.x, p.y, rr) * (seen(p.x, p.y, p.z) * 0.85 + 0.15 * seen(p.x, p.y, p.z + rr));
      smk.set([p.x || 0, p.y || 0, p.z || 0, (p.r0 || 1) + 7.5 * Math.sqrt(Math.max(0, p.age))], i * 4);
      smkB.set([a, Math.exp(-p.age * 1.2), 0, 0], i * 4);
    });
    spray.forEach((p, i) => {
      const r = (p.r0 || 1) + 5.5 * Math.sqrt(Math.max(0, p.age));
      const a = p.age > p.life ? 0 : p.a0 * burst(p.age, 0.1, 0.75) * smooth(p.life, p.life * 0.6, p.age) * inBlock(p.x, p.y, r);
      // rising, the sheet is tall; as it falls back it spreads into round mist
      const tall = 1 + 2.8 * smooth(-20, 30, p.vz || 0);
      spr.set([p.x || 0, p.y || 0, (p.z || 0) - r * (tall - 1) * 0.35, r], i * 4);
      sprB.set([a, a > 0.002 ? seen(p.x, p.y, p.z) : 0, tall, 0], i * 4);
    });
  }

  let spent = 0;
  let frames = 0;
  function draw(fade, clock, car, time) {
    const t0 = performance.now();
    drawAll(fade, clock, car, time);
    spent += performance.now() - t0;
    if (++frames === 40) {
      // 40 frames averaging over 28 ms of drawing: drop to a coarser canvas
      if (!slowGpu && spent / frames > 28) slowGpu = true;
      spent = 0;
      frames = 0;
    }
  }
  function drawAll(fade, clock, car, time) {
    const pose = car.dark > 0 ? [0, 0, 0, 0] : [car.x, car.y, car.psi + car.beta, 1];
    const carB = [car.brake || 0, car.v, 0, 0];
    sea.draw({ uFade: fade }, time);
    light.draw({ uFade: fade, uCarA: pose, uCarB: carB }, time);
    fx.draw({ uFade: fade, uCarA: pose, uCarB: carB, uSmk: smk, uSmkB: smkB, uSpr: spr, uSprB: sprB }, time);
  }
  return { step, draw };
}
