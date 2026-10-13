const D = __DATA__;
const root = document.querySelector(".fp");
const stage = root.querySelector(".fp-stage");
const readout = root.querySelector("[data-readout]");
const canvas = stage.querySelector(".fp-gl");
const said = stage.querySelector(".fp-said");
const printLayer = stage.querySelector('[data-part="prints"]');
const sheetPath = stage.querySelector('[data-part="sheet"]');
const lacePath = stage.querySelector('[data-part="lace"]');
const lineLayer = stage.querySelector('[data-part="lines"]');
const still = matchMedia("(prefers-reduced-motion: reduce)");
const themeHost = root.closest("[data-theme]");
const isPale = () => themeHost?.getAttribute("data-theme") !== "dark";
const MAXP = 12;
const KEEP = 10;
const FADE = 0.8;
const f1 = (v) => (Number.isInteger(v) ? `${v}.` : String(v));
const v2 = (a) => `vec2(${f1(a[0])},${f1(a[1])})`;

const tokenOf = (name) => {
  const text = getComputedStyle(root).getPropertyValue(name).trim();
  const hex = text.replace("#", "");
  const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex.slice(0, 6);
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255);
};

const FRAGMENT = `
#define MAXP ${MAXP}
uniform vec4 uPrint[MAXP];
uniform vec4 uAge[MAXP];
uniform vec4 uWave;
uniform vec4 uPrev;
uniform vec3 uEdge[4];
uniform vec3 uWet;uniform vec3 uDry;uniform vec3 uSkyLo;uniform vec3 uSkyHi;uniform vec3 uWater;uniform vec3 uFoam;uniform vec3 uGlint;
uniform vec4 uGain;uniform float uPool;
uniform float uClock;
const float LEN=${f1(STRIP.length)};const float WID=${f1(STRIP.width)};const float SEA=${f1(STRIP.sea)};const float RISE=${STRIP.rise.toFixed(6)};
const float FROM=${f1(SWASH.from)};const float DOWN=${DOWNHILL.toFixed(4)};const float GRAV=${f1(GRAVITY)};const float LOBE=${f1(SWASH.lobes)};const float SMOOTH=${f1(SWASH.smooth)};
const float DEPTH=${f1(GAIT.depth)};const float WALL=${f1(FOOT.wall)};
const vec2 ROLL=${v2(FOOT.roll)};
#define NS ${FOOT.sole.length}
uniform vec2 uSole[NS];
const vec4 PH=vec4(${FOOT.pressure.heel.slice(0, 4).map(f1).join(",")});const float PHW=${f1(FOOT.pressure.heel[4])};
const vec4 PL=vec4(${FOOT.pressure.ball.slice(0, 4).map(f1).join(",")});const float PLW=${f1(FOOT.pressure.ball[4])};
const vec4 PO=vec4(${FOOT.pressure.outer.slice(0, 4).map(f1).join(",")});const float POW=${f1(FOOT.pressure.outer[4])};
const float PB=${f1(FOOT.pressure.base)};
${FOOT.toes.map((toe, i) => `const vec4 T${i}=vec4(${f1(toe.c[0])},${f1(toe.c[1])},${f1(toe.r[0])},${f1(toe.r[1])});const vec2 T${i}B=vec2(${f1(toe.turn)},${f1(toe.weight)});`).join("")}
const vec3 RIM=vec3(${f1(FOOT.rim.height)},${f1(FOOT.rim.width)},${f1(FOOT.rim.front)});
const float POOL=${f1(FOOT.pool)};const vec2 SEEP=${v2(FOOT.seep)};
const vec2 PALE_UP=${v2(FOOT.pale.rise)};const vec2 PALE_DOWN=${v2(FOOT.pale.fall)};const float PALE_R=${f1(FOOT.pale.reach)};
const float LIFT=${f1(FOOT.lift)};

vec3 lin(vec3 c){return pow(c,vec3(2.2));}
float smin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}
float smax(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return max(a,b)+h*h*k*.25;}
vec2 unturn(vec2 p,float a){float c=cos(a);float s=sin(a);return vec2(c*p.x+s*p.y,-s*p.x+c*p.y);}
float sdE(vec2 p,vec2 r){float k0=length(p/r);float k1=length(p/(r*r));return k0*(k0-1.)/max(k1,1e-5);}
float dip(float sd,float wall){float s=-sd;return smoothstep(0.,wall,s)*(.66+.34*smoothstep(0.,2.6,s));}
vec2 localOf(vec2 p,vec4 P){vec2 d=p-P.xy;float c=cos(P.z);float s=sin(P.z);return vec2(d.x*c+d.y*s,(-d.x*s+d.y*c)*P.w);}

float lobe(float x,float seed){return .5*sin(x/37.+seed*6.1)+.3*sin(x/19.+seed*13.7)+.2*sin(x/11.5+seed*29.3);}
float launch(vec4 w,float x){return w.y*(1.+LOBE*lobe(x,w.z));}
float frontOf(vec4 w,float x){float s=w.x;if(s<=0.||w.w<.5)return -1e4;return FROM+launch(w,x)*s-.5*DOWN*s*s;}
float topOf(vec4 w,float x){float u=launch(w,x);return FROM+u*u/(2.*DOWN);}
float turnOf(vec4 w,float x){return launch(w,x)/DOWN;}
vec2 timesOf(vec4 w,float x,float y){float u=launch(w,x);float disc=u*u-2.*DOWN*(y-FROM);if(disc<=0.)return vec2(1e4,-1e4);float r=sqrt(disc);return vec2(u-r,u+r)/DOWN;}

float sdSole(vec2 p){
  vec2 lo=vec2(-.2,-5.4);vec2 hi=vec2(20.9,5.4);
  vec2 o=max(max(lo-p,p-hi),0.);
  float box=length(o);
  if(box>8.)return box;
  vec2 prev=uSole[NS-1];float d=1e4;float s=1.;
  for(int i=0;i<NS;i++){
    vec2 vi=uSole[i];vec2 e=prev-vi;vec2 w=p-vi;
    vec2 q=w-e*clamp(dot(w,e)/dot(e,e),0.,1.);d=min(d,dot(q,q));
    bvec3 cnd=bvec3(p.y>=vi.y,p.y<prev.y,e.x*w.y>e.y*w.x);
    if(all(cnd)||all(not(cnd)))s=-s;
    prev=vi;
  }
  return s*sqrt(d);
}
float paleOf(float t){return smoothstep(PALE_UP.x,PALE_UP.y,t)*(1.-smoothstep(PALE_DOWN.x,PALE_DOWN.y,t));}
float gauss(vec2 q,vec4 g){vec2 r=q-g.xy;return exp(-(r.x*r.x/g.z+r.y*r.y/g.w));}
float rollOf(float u,float age){return smoothstep(ROLL.x*u,ROLL.x*u+ROLL.y,age);}
float toeOf(vec2 q,vec4 t,vec2 b,float age,float wall,inout float d,inout float su){
  float st=sdE(unturn(q-t.xy,b.x),t.zw);
  d=smax(d,b.y*rollOf(t.x,age)*dip(st,wall),.15);
  su=smin(su,st,.8);
  return st;
}
float footH(vec2 q,float age,float ero,float scale,out float su,out float tl){
  float wall=WALL*(1.+4.*ero);
  float keep=1.-ero;
  float ss=sdSole(q);
  float pr=min(1.,PB+PHW*gauss(q,PH)+PLW*gauss(q,PL)+POW*gauss(q,PO));
  float d=pr*rollOf(q.x,age)*dip(ss,wall);
  su=ss;
  toeOf(q,T0,T0B,age,wall,d,su);
  toeOf(q,T1,T1B,age,wall,d,su);
  toeOf(q,T2,T2B,age,wall,d,su);
  toeOf(q,T3,T3B,age,wall,d,su);
  toeOf(q,T4,T4B,age,wall,d,su);
  float depth=d*DEPTH*scale*keep;
  tl=age-ROLL.x*clamp(q.x,0.,23.);
  float grow=rollOf(22.,age);
  float rimH=RIM.x*(1.+RIM.z*smoothstep(15.,23.,q.x))*grow*keep*keep;
  float s=max(su,0.)/(RIM.y*(1.+2.*ero));
  return rimH*s*exp(1.-s)-depth;
}

vec4 gPa;vec4 gAa;vec4 gPb;vec4 gAb;float gEa;float gEb;float gHasA;float gHasB;float gRa;float gRb;
float gSuA;float gSuB;float gTa;float gTb;

float sandAt(vec2 p){
  float h=0.;
  if(gHasA>.5)h+=footH(localOf(p,gPa),gAa.x,gEa,gAa.z,gSuA,gTa);
  if(gHasB>.5)h+=footH(localOf(p,gPb),gAb.x,gEb,gAb.z,gSuB,gTb);
  return h;
}
float poolOf(vec4 A,float ero){return -DEPTH*A.z*(1.-POOL*smoothstep(SEEP.x,SEEP.y,A.x))*(1.-ero)-3.*smoothstep(.25,.45,ero);}
float surfAt(vec2 p){
  float h=sandAt(p);
  float w=-1e3;
  if(gHasA>.5&&gSuA<-.3)w=max(w,poolOf(gAa,gEa));
  if(gHasB>.5&&gSuB<-.3)w=max(w,poolOf(gAb,gEb));
  return max(h,w);
}

vec2 cellular(vec2 p){
  vec2 i=floor(p);vec2 f=fract(p);float d1=8.;float d2=8.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
    vec2 g=vec2(float(x),float(y));
    vec2 o=vec2(hash12(i+g),hash12(i+g+19.7))*.8+.1;
    float d=length(g+o-f);
    if(d<d1){d2=d1;d1=d;}else if(d<d2){d2=d;}
  }
  return vec2(d1,d2);
}

vec3 envOf(vec3 r){
  float e=clamp(r.z,0.,1.);
  return mix(lin(uSkyLo),lin(uSkyHi),smoothstep(.05,.95,e));
}
float sparkleOf(vec2 p,float px){
  vec2 cs=p/.8;vec2 ci=floor(cs);vec2 f=fract(cs);
  float h=hash12(ci+7.3);
  vec2 o=vec2(hash12(ci+1.1),hash12(ci+2.9))*.8+.1;
  float r=length(f-o)*.8;
  float size=max(1.3*px,.16);
  float flick=pow(max(0.,sin(uClock*(1.3+2.*fract(h*91.))+h*517.)),8.);
  return smoothstep(.997,.9995,h)*flick*exp(-r*r/(size*size));
}
float fresnel(float c){return .02+.98*pow(1.-clamp(c,0.,1.),5.);}

float erodeOf(float ex){return smoothstep(0.,SMOOTH,ex);}
float exposureOf(vec4 w,vec2 t,float born){return w.w<.5?0.:max(0.,min(w.x,t.y)-max(t.x,born));}
vec3 shoulder(vec3 c){vec3 k=vec3(.8);return mix(c,k+.2*(1.-exp(-(c-k)/.2)),step(k,c));}
void geomOf(vec4 w,vec2 p,float ew,out float dist,out float up,out float turnW,out float topW,out float jag){
  float s=w.x;
  turnW=turnOf(w,p.x);
  topW=topOf(w,p.x);
  up=1.-smoothstep(turnW-.2,turnW+.2,s);
  jag=((noise2(vec2(p.x/6.,s*1.1)+w.z*7.)-.5)*2.6+(noise2(vec2(p.x/2.1,s*1.9+4.)+w.z*3.)-.5)*1.1)*mix(.35,1.,up);
  dist=frontOf(w,p.x)+jag-p.y;
}
float foamOf(vec4 w,vec2 p,float px,float ew){
  float dist;float up;float turnW;float topW;float jag;
  geomOf(w,p,ew,dist,up,turnW,topW,jag);
  float s=w.x;
  float front=frontOf(w,p.x);
  float wcover=smoothstep(-ew,ew,dist);
  float speed=max(launch(w,p.x)-DOWN*s,0.);
  float age=max(s-turnW,0.);
  float drift=.35*max(topW-front,0.)*wcover*(1.-up);
  float fy=mix(topW+jag-p.y-drift,dist,up);
  float edge=smoothstep(-ew,ew,fy);
  float pop=(1.-up)*smoothstep(0.,3.,age);
  float strength=mix(.45,1.,smoothstep(10.,130.,speed))*mix(1.,exp(-age/2.2),1.-up);
  float flow=.3*min(s,turnW);
  vec2 seed=vec2(w.z*17.,w.z*5.);
  float pa=fbm2(vec2(p.x/5.,fy/3.4+flow)+seed);
  float st=fbm2(vec2(p.x/1.6,fy/11.+flow*.5)+seed.yx);
  vec2 cl=cellular(vec2(p.x,fy)/.85+seed+vec2(0.,flow*4.));
  float walls=1.-smoothstep(.04,.16+px/.85,cl.y-cl.x);
  float lineV=.65+.35*noise2(vec2(p.x/3.,s*.7)+seed);
  float tip=exp(-max(fy,0.)/mix(.9,1.6,pop))*lineV*mix(1.,.6,pop);
  float patchy=smoothstep(.38+.24*pop,.58+.24*pop,pa+.22*exp(-max(fy,0.)/2.5));
  float bandF=exp(-max(fy,0.)/mix(3.6,8.,pop))*patchy*(.55+.45*walls);
  float trail=exp(-max(fy,0.)/14.)*smoothstep(.66,.84,st)*smoothstep(.45,.65,pa)*.35*up;
  vec2 lp=vec2(p.x,fy*1.3)/5.+seed*.3+vec2(0.,flow*1.2);
  lp+=.9*(vec2(noise2(lp*.8+3.1),noise2(lp*.8+8.4))-.5);
  float ridgeA=1.-abs(2.*noise2(lp)-1.);
  float ridgeB=1.-abs(2.*noise2(lp*2.3+5.7)-1.);
  float thinL=.012+px/14.;
  float lace=max(smoothstep(.93-thinL*4.,.985,ridgeA),.7*smoothstep(.94-thinL*6.,.99,ridgeB));
  lace*=smoothstep(.3+.3*pop,.6+.3*pop,fbm2(vec2(p.x,fy)/8.+seed.yx+3.));
  float laceAmt=exp(-max(fy,0.)/mix(6.5,16.,pop))*smoothstep(1.,6.,fy+4.*pop)*mix(.42,.8,1.-up);
  return clamp((max(tip,bandF)+trail*(.6+.4*walls)+laceAmt*lace*(.7+.3*walls))*edge*strength,0.,1.);
}
vec2 drainOf(vec4 w,vec2 p){
  if(w.w<.5||w.x<=0.)return vec2(0.);
  vec2 t=timesOf(w,p.x,p.y);
  if(t.y<=t.x||w.x<t.x)return vec2(0.);
  float q=w.x-t.y;
  float tau=${SWASH.drain[0].toFixed(2)}+${(SWASH.drain[1] - SWASH.drain[0]).toFixed(2)}*(1.-p.y/WID);
  float patchS=.75+.5*fbm2(p.xy/21.+vec2(w.z*13.,4.));
  float sheen=exp(-max(q,0.)*patchS/tau);
  float glint=smoothstep(0.,.3,q)*exp(-max(q-.3,0.)/1.2);
  return vec2(sheen,glint);
}

void main(){
  vec2 vb=viewOf(gl_FragCoord.xy);
  float pxv=uView.x/uCanvas.x;
  float px=pixelOf();
  float pxw=px/uCam.z;
  float ew=.8*pxw;
  float cover=1e4;
  for(int i=0;i<4;i++)cover=min(cover,dot(uEdge[i].xy,vb)+uEdge[i].z);
  vec3 V=towardViewer();
  float c=V.z-RISE*V.y;
  vec3 p0=onFloor(vb,SEA);
  float t0=RISE*p0.y/c;
  vec3 hp=p0+t0*V;
  vec3 pe=onWallX(vb,LEN);
  float zsE=SEA+RISE*pe.y;
  float sWave=uWave.x;
  float waveOn=uWave.w*step(0.,sWave);
  float frontE=frontOf(uWave,LEN);
  float band=0.;
  vec3 bandCol=vec3(0.);
  if(waveOn>.5&&sWave>0.&&pe.y>-1.&&pe.y<WID+1.&&pe.y<frontE+1.){
    float hw=pow(max(frontE-pe.y,0.),2.)/(9.*GRAV*sWave*sWave);
    float upE=1.-smoothstep(turnOf(uWave,LEN)-.2,turnOf(uWave,LEN)+.2,sWave);
    float head=.35*exp(-max(frontE-pe.y,0.)/5.)*upE*smoothstep(0.,40.,launch(uWave,LEN)-DOWN*sWave);
    float top=zsE+max(hw,.12)+head;
    float sz=.7*px/uCam.w;
    float inY=smoothstep(-sz,sz,pe.y)*smoothstep(-sz,sz,frontE-pe.y);
    band=smoothstep(zsE-sz,zsE+sz,pe.z)*(1.-smoothstep(top-sz,top+sz,pe.z))*inY;
    bandCol=mix(lin(uWater)*.8,lin(uFoam),clamp(smoothstep(.1,.35,head)*uGain.z,0.,1.));
  }
  if(cover<-1.5*pxv&&band<.001){gl_FragColor=vec4(0.);return;}

  gHasA=0.;gHasB=0.;gEa=0.;gEb=0.;gRa=0.;gRb=0.;gSuA=1e3;gSuB=1e3;
  vec2 tw=timesOf(uWave,hp.x,hp.y);
  vec2 tv=timesOf(uPrev,hp.x,hp.y);
  float gap=uPrev.x-uWave.x;
  for(int i=0;i<MAXP;i++){
    vec4 P=uPrint[i];vec4 A=uAge[i];
    if(abs(P.w)<.5)continue;
    vec2 q=localOf(hp.xy,P);
    if(q.x<-7.||q.x>33.||abs(q.y)>13.)continue;
    float exNow=exposureOf(uWave,tw,A.y);
    float exPrev=exposureOf(uPrev,tv,A.y+gap);
    float ero=1.-(1.-A.w)*(1.-erodeOf(exPrev))*(1.-erodeOf(exNow));
    float born=max(tw.x,A.y);
    float live=uWave.w*smoothstep(born,born+.12,sWave)*(1.-smoothstep(tw.y-.12,tw.y,sWave));
    float rate=live*smoothstep(.12*SMOOTH,.4*SMOOTH,exNow)*(1.-smoothstep(.6*SMOOTH,SMOOTH,exNow));
    if(gHasA<.5){gPa=P;gAa=A;gEa=ero;gRa=rate;gHasA=1.;}
    else if(gHasB<.5){gPb=P;gAb=A;gEb=ero;gRb=rate;gHasB=1.;}
  }
  float near=max(gHasA,gHasB);
  vec3 p=hp;
  float hs=0.;
  float pool=0.;
  if(near>.5){
    float tHi=t0+.7/c;float tLo=t0-2.6/c;
    float ta=tHi;float tb=tLo;bool found=false;
    for(int i=1;i<=14;i++){
      float t=mix(tHi,tLo,float(i)/14.);
      vec3 q=p0+t*V;
      if(c*(t-t0)<=surfAt(q.xy)){tb=t;found=true;break;}
      ta=t;
    }
    if(found){
      for(int i=0;i<5;i++){
        float t=.5*(ta+tb);
        vec3 q=p0+t*V;
        if(c*(t-t0)<=surfAt(q.xy))tb=t;else ta=t;
      }
    }
    p=p0+tb*V;
    hs=sandAt(p.xy);
    float lift=c*(tb-t0);
    pool=smoothstep(.01,.06,lift-hs);
  }
  vec3 L=lightDir();
  float e=.22;
  vec3 nflat=normalize(vec3(0.,-RISE,1.));
  float ux=.026*cos(p.x/17.+p.y/41.)+.014*cos(p.x/7.3-p.y/11.)+.004*cos(p.x/3.1+p.y/2.3);
  float uy=.022*cos(p.y/23.-p.x/53.)+.012*cos(p.y/9.1+p.x/13.)+.004*cos(p.y/2.7-p.x/3.9);
  vec3 n=nflat;
  float shadow=1.;
  float paleA=0.;
  float floorWet=0.;
  if(near>.5){
    float hx=(sandAt(p.xy+vec2(e,0.))-sandAt(p.xy-vec2(e,0.)))/(2.*e);
    float hy=(sandAt(p.xy+vec2(0.,e))-sandAt(p.xy-vec2(0.,e)))/(2.*e);
    n=normalize(vec3(-hx-ux,-RISE-hy-uy,1.));
    hs=sandAt(p.xy);
    float base=SEA+RISE*p.y+hs;
    float occ=0.;
    for(int i=1;i<=6;i++){
      float t=float(i)*.55;
      vec3 q=vec3(p.xy,base)+L*t;
      float gp=q.z-(SEA+RISE*q.y+sandAt(q.xy));
      occ=max(occ,smoothstep(.02,-.12,gp));
    }
    shadow=1.-.85*occ;
    hs=sandAt(p.xy);
    if(gHasA>.5){float k=1.-gEa;paleA=max(paleA,paleOf(gTa)*exp(-max(gSuA,0.)/PALE_R)*smoothstep(-1.2,0.,gSuA)*k);
      floorWet=max(floorWet,smoothstep(LIFT-.1,LIFT+.7,gTa)*smoothstep(0.,-.9,gSuA)*k);}
    if(gHasB>.5){float k=1.-gEb;paleA=max(paleA,paleOf(gTb)*exp(-max(gSuB,0.)/PALE_R)*smoothstep(-1.2,0.,gSuB)*k);
      floorWet=max(floorWet,smoothstep(LIFT-.1,LIFT+.7,gTb)*smoothstep(0.,-.9,gSuB)*k);}
  }else{
    n=normalize(vec3(-ux,-RISE-uy,1.));
  }

  float dist=-1e4;float up=1.;float turnW=0.;float topW=0.;float jag=0.;
  float wcover=0.;
  if(waveOn>.5){
    geomOf(uWave,p.xy,ew,dist,up,turnW,topW,jag);
    wcover=smoothstep(-ew,ew,dist);
  }
  vec2 tn=timesOf(uWave,p.x,p.y);
  float reached=waveOn>.5?max(wcover,step(tn.x,sWave)*step(tn.x,tn.y)):0.;
  vec2 dNow=drainOf(uWave,p.xy);
  vec2 dPrev=drainOf(uPrev,p.xy);
  float sheen=mix(dPrev.x,dNow.x,reached);
  float drainGlint=mix(dPrev.y,dNow.y,reached);
  float mark=0.;
  if(waveOn>.5){
    float top=topOf(uWave,p.x);
    float turn=turnOf(uWave,p.x);
    mark=exp(-pow((p.y-top+.6)/.75,2.))*smoothstep(turn,turn+.6,sWave)*exp(-max(sWave-turn,0.)/9.);
  }
  if(uPrev.w>.5){
    float topP=topOf(uPrev,p.x);
    float gone=waveOn>.5?smoothstep(0.,.3,sWave-timesOf(uWave,p.x,topP).x):0.;
    mark=max(mark,exp(-pow((p.y-topP+.6)/.75,2.))*(1.-gone)*exp(-max(uPrev.x-turnOf(uPrev,p.x),0.)/9.));
  }

  vec3 wet=lin(uWet);
  vec3 dry=lin(uDry);
  float mott=fbm2(p.xy/29.+vec2(3.1,7.7))-.5;
  float grain=noise2(p.xy*2.3)-.5;
  vec3 alb=wet*(1.+.16*mott+.12*grain);
  alb=mix(alb,dry,.09*smoothstep(70.,190.,p.y)*(1.-sheen));
  alb=mix(alb,dry,.72*paleA);
  alb*=1.-.32*floorWet;
  alb*=1.-.3*mark;
  alb*=1.-.22*sheen;
  float ndl=max(dot(n,L),0.);
  float ndl0=max(dot(nflat,L),.05);
  float amb=.55;
  float lit=(amb+(1.-amb)*ndl*shadow)/(amb+(1.-amb)*ndl0);
  vec3 col=alb*lit;
  float film=.26+.34*sheen+.4*floorWet;
  film*=1.-.9*paleA;
  vec3 R=reflect(-V,n);
  float dryTop=1.-.85*wcover;
  float inPrint=mix(1.,uPool,floorWet);
  col+=fresnel(dot(n,V))*envOf(R)*film*uGain.x*dryTop*inPrint;
  vec3 H=normalize(L+V);
  float gl=pow(max(dot(n,H),0.),mix(40.,160.,clamp(film,0.,1.)));
  col+=lin(uGlint)*gl*film*uGain.y*shadow*dryTop*inPrint;
  col+=lin(uSkyLo)*pow(max(dot(n,H),0.),9.)*.045*uGain.y*shadow*dryTop*(1.-.8*paleA);

  if(pool>.001){
    vec3 nw=normalize(vec3(-ux*.3,-RISE-uy*.3,1.));
    vec3 under=col*mix(vec3(1.),lin(uWater)/max(lin(uWet),vec3(.02)),.2)*.7;
    vec3 pw=under+fresnel(dot(nw,V))*envOf(reflect(-V,nw))*uGain.x*.4*uPool;
    float g2=pow(max(dot(nw,H),0.),260.);
    pw+=lin(uGlint)*g2*uGain.y*.8*uPool;
    col=mix(col,pw,pool*(1.-wcover));
  }

  float foamNow=waveOn>.5?foamOf(uWave,p.xy,px,ew):0.;
  float foamPrev=0.;
  if(uPrev.w>.5&&uPrev.x-turnOf(uPrev,LEN*.5)<14.)foamPrev=foamOf(uPrev,p.xy,px,ew);
  float foam=mix(foamPrev,foamNow,reached);
  if(waveOn>.5){
    float speed=max(launch(uWave,p.x)-DOWN*sWave,0.);
    float hw=pow(max(dist,0.),2.)/(9.*GRAV*max(sWave*sWave,.01));
    float deep=max(-hs,0.);
    float turb=1.-exp(-(hw+deep*.5+.02)/.5);
    vec2 seed=vec2(uWave.z*17.,uWave.z*5.);
    vec2 g=vec2(0.);
    float ripple=up*smoothstep(0.,10.,dist)*mix(.5,1.,smoothstep(10.,120.,speed))*smoothstep(.02,.25,hw);
    vec2 r1=vec2(.34,.94);vec2 r2=vec2(-.5,.87);vec2 r3=vec2(.12,.99);
    float w1=6.2832*fbm2(p.xy/14.+seed);
    float w2=6.2832*noise2(p.xy/8.3+seed.yx+5.);
    float w3=6.2832*noise2(p.xy/5.1+seed+9.);
    vec3 lod=1.-smoothstep(vec3(.16),vec3(.3),pxw*vec3(1.9,1.45,2.6)/6.2832);
    g+=1.8*ripple*(.022*lod.x*cos(dot(p.xy,r1)*1.9-sWave*7.+w1)*r1+.018*lod.y*cos(dot(p.xy,r2)*1.45-sWave*5.5+w2)*r2+.014*lod.z*cos(dot(p.xy,r3)*2.6-sWave*9.+w3)*r3);
    float kr=6.2832/6.5;
    vec2 d1=vec2(.574,.819);vec2 d2=vec2(-.574,.819);
    float om=sWave*2.4;
    float thinB=(1.-up)*smoothstep(1.,14.,dist)*exp(-max(hw-.1,0.)/.2);
    g+=.009*thinB*(cos(kr*dot(p.xy,d1)+om+w2*.3)*d1+cos(kr*dot(p.xy,d2)+om+w3*.3)*d2);
    float streak=(1.-up)*smoothstep(1.,12.,dist)*(1.-smoothstep(.3,.6,pxw/2.2));
    g.x+=.03*streak*(noise2(vec2(p.x/2.2,p.y/18.+max(sWave-turnW,0.)*2.2)+seed)-.5);
    vec3 nw=normalize(vec3(-g.x,-RISE-g.y,1.));
    float puff=0.;
    if(gHasA>.5)puff=max(puff,gRa*exp(-max(gSuA+1.,0.)/3.5));
    if(gHasB>.5)puff=max(puff,gRb*exp(-max(gSuB+1.,0.)/3.5));
    puff*=.55+.45*fbm2(p.xy/3.+vec2(0.,sWave*.8));
    vec3 seen=mix(col*(.8-.1*turb)*(1.-.45*smoothstep(.1,1.2,deep)),lin(uWater),.35*uGain.w*turb);
    seen=mix(seen,mix(lin(uWet),lin(uDry),.35)*.9,.45*clamp(puff,0.,1.));
    seen+=fresnel(dot(nw,V))*envOf(reflect(-V,nw))*uGain.x*.9;
    float gw=pow(max(dot(nw,H),0.),320.);
    seen+=lin(uGlint)*gw*uGain.y*1.2;
    float lip=exp(-max(dist,0.)/.7)*(1.-up)*(.55+.45*noise2(vec2(p.x/1.7,sWave*3.)+seed));
    seen+=lin(uFoam)*.3*lip*uGain.z;
    col=mix(col,seen,wcover);
  }
  col=mix(col,lin(uFoam),foam*uGain.z);
  col+=mix(lin(uGlint),lin(uSkyLo),.4)*sparkleOf(p.xy,pxw)*drainGlint*uGain.y*1.2*(1.-paleA)*(1.-wcover)*(1.-foam);
  col=mix(col,bandCol,band);
  vec3 outc=pow(max(shoulder(col),0.),vec3(1./2.2));
  float a=max(smoothstep(-.5*pxv,.5*pxv,cover),band);
  float nz=(hash12(gl_FragCoord.xy+fract(uClock*.61)*91.)+hash12(gl_FragCoord.yx*1.37+fract(uClock*.37)*57.)-1.)/255.;
  outc=clamp(outc+nz,0.,1.);
  gl_FragColor=vec4(outc*a,a);
}`;

const edges = (() => {
  const q = D.quad;
  const area = q.reduce((sum, p, i) => sum + p[0] * q[(i + 1) % 4][1] - q[(i + 1) % 4][0] * p[1], 0);
  const out = [];
  for (let i = 0; i < 4; i++) {
    const a = q[i];
    const b = q[(i + 1) % 4];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    let nx = -dy / len;
    let ny = dx / len;
    if (area < 0) {
      nx = -nx;
      ny = -ny;
    }
    out.push(nx, ny, -(nx * a[0] + ny * a[1]));
  }
  return out;
})();

const themeOf = () => ({
  uWet: tokenOf("--fp-wet"),
  uDry: tokenOf("--fp-dry"),
  uSkyLo: tokenOf("--fp-sky-lo"),
  uSkyHi: tokenOf("--fp-sky-hi"),
  uWater: tokenOf("--fp-water"),
  uFoam: tokenOf("--fp-foam"),
  uGlint: tokenOf("--fp-glint"),
  uGain: isPale() ? [5.5, 0.7, 1, 0.2] : [7, 1.1, 0.92, 0.2],
  uPool: isPale() ? 0.28 : 1,
});
const layerAt = (maxRatio) =>
  glLayer({
    canvas,
    fragment: FRAGMENT,
    view: [D.W, D.H],
    camera: D.camera,
    uniforms: ["uPrint", "uAge", "uWave", "uPrev", "uClock"],
    fixed: { uEdge: edges, uSole: FOOT.sole.flat(), ...themeOf() },
    maxRatio,
  });
const RATIOS = [2, 1.5, 1, 0.75];
let quality = 0;
let layer = layerAt(RATIOS[quality]);
const pace = { sum: 0, count: 0 };
function watchPace(dt) {
  if (!layer || quality >= RATIOS.length - 1 || dt <= 0) return;
  pace.sum += dt;
  pace.count += 1;
  if (pace.count < 45) return;
  const slow = pace.sum / pace.count > 0.028;
  pace.sum = 0;
  pace.count = 0;
  if (!slow) return;
  quality += 1;
  layer = layerAt(RATIOS[quality]) || layer;
}
if (layer) stage.setAttribute("data-gl", "");

const state = { clock: 0, prints: [], wave: null, prev: null, waves: 0, cycle: 0, plan: [], next: 0, side: 1, lastStep: -10, lastWord: "" };
let touring = !still.matches;
let idleTimer = 0;
let visible = false;
let frame = 0;
let last = 0;
let dirty = true;
let frozen = false;

function planCycle(at) {
  const steps = tourSteps(state.cycle);
  const plan = steps.map((foot, index) => ({ at: at + foot.at, kind: "step", foot, step: index + 1 }));
  plan.push({ at: at + LOOP.collapse, kind: "wave" });
  plan.push({ at: at + LOOP.period, kind: "cycle" });
  state.plan = plan;
  state.next = 0;
}

function press(foot, at = state.clock, step = 0) {
  state.prints.push({ ...foot, born: at, worn: 0, fadeAt: null, step });
  const standing = state.prints.filter((print) => print.fadeAt === null);
  for (const print of standing.slice(0, Math.max(0, standing.length - KEEP))) print.fadeAt = at;
  if (still.matches) state.prints = state.prints.filter((print) => print.fadeAt === null);
  while (state.prints.length > MAXP) state.prints.shift();
  state.side = -foot.side;
  state.lastStep = at;
  dirty = true;
}

const fadeOf = (print) => (print.fadeAt === null ? 0 : ramp(print.fadeAt, print.fadeAt + FADE, state.clock));
const wornOf = (print) => 1 - (1 - print.worn) * (1 - fadeOf(print));

function launchWave(at = state.clock) {
  if (state.prev) for (const print of state.prints) print.worn = 1 - (1 - print.worn) * (1 - meanOf(print, state.prev));
  if (state.wave) state.prev = state.wave;
  state.wave = waveOf(at, state.waves++);
  dirty = true;
}

function waveAge() {
  return state.wave ? state.clock - state.wave.at : -1;
}

function waveBusy() {
  if (!state.wave) return false;
  const s = waveAge();
  return s < 2 * turnOf(state.wave, STRIP.length / 2) + 0.4;
}

const PROBES = [[4, 0.2], [12, 3.4], [17, -1.2], [17, 4.4], ...FOOT.toes.map((toe) => toe.c)];
function wearOf(wave, print, u, v) {
  if (!wave) return 0;
  const [x, y] = toWorld(print, u, v);
  return erosionOf(exposureAt(wave, x, y, state.clock - wave.at, print.born - wave.at));
}
function meanOf(print, wave) {
  return PROBES.reduce((sum, [u, v]) => sum + wearOf(wave, print, u, v), 0) / PROBES.length;
}
function erosionAt(print) {
  const worn = wornOf(print);
  let least = 1;
  for (const [u, v] of PROBES) least = Math.min(least, 1 - (1 - worn) * (1 - wearOf(state.prev, print, u, v)) * (1 - wearOf(state.wave, print, u, v)));
  return least;
}

function advance(dt) {
  state.clock += dt;
  if (touring) {
    while (state.next < state.plan.length && state.plan[state.next].at <= state.clock) {
      const item = state.plan[state.next++];
      if (item.kind === "step") press(item.foot, item.at, item.step);
      else if (item.kind === "wave") launchWave(item.at);
      else {
        state.cycle += 1;
        planCycle(item.at);
      }
    }
  }
  sweep();
}

function sweep() {
  const settled = !waveBusy();
  const keep = state.prints.filter((print) => fadeOf(print) < 1 && !(settled && erosionAt(print) >= 0.999));
  if (keep.length !== state.prints.length) state.prints = keep;
}

function uniforms() {
  const print = new Float32Array(MAXP * 4);
  const age = new Float32Array(MAXP * 4);
  const base = state.wave ? state.wave.at : 0;
  state.prints.forEach((p, i) => {
    print.set([p.x, p.y, p.heading, p.side], i * 4);
    age.set([still.matches ? 9 : state.clock - p.born, p.born - base, p.scale, wornOf(p)], i * 4);
  });
  const wave = state.wave ? [state.clock - state.wave.at, state.wave.u0, state.wave.seed, 1] : [0, 0, 0, 0];
  const prev = state.prev ? [state.clock - state.prev.at, state.prev.u0, state.prev.seed, 1] : [0, 0, 0, 0];
  return { uPrint: print, uAge: age, uWave: wave, uPrev: prev, uClock: still.matches ? 0.8 : state.clock % 1800 };
}

function phaseOf() {
  const mid = STRIP.length / 2;
  if (state.wave && waveBusy()) {
    const s = waveAge();
    const w = state.wave;
    const front = frontAt(w, mid, s);
    const turn = turnOf(w, mid);
    const alive = state.prints.filter((print) => erosionAt(print) < 0.97).length;
    if (front < 0 && s < turn) return { word: "wave breaking", text: `bore ${metres(-SWASH.from)} m out · swash coming` };
    if (Math.abs(s - turn) < 0.3) return { word: "run-up", text: `run-up ${metres(topOf(w, mid))} m · ${turn.toFixed(1)} s` };
    if (s < turn) return { word: "swash", text: `swash ${(speedAt(w, mid, s) / 100).toFixed(1)} m/s · ${metres(front)} m up` };
    if (front > 0) return { word: "backwash", text: `backwash ${(-speedAt(w, mid, s) / 100).toFixed(1)} m/s · ${alive ? `${alive} ${alive === 1 ? "print" : "prints"} left` : "prints gone"}` };
    return { word: "drained", text: `smooth again · sheen draining` };
  }
  if (state.wave && waveAge() < 2 * turnOf(state.wave, mid) + 4 && !(state.prints.length && state.clock - state.lastStep < 1.4)) return { word: "drained", text: state.prints.length ? `${state.prints.length} ${state.prints.length === 1 ? "print" : "prints"} · sheen draining` : "smooth again · sheen draining" };
  const recent = state.clock - state.lastStep;
  const standing = state.prints.filter((print) => print.fadeAt === null);
  if (standing.length && recent < 1.4) {
    const n = standing.length;
    const latest = standing[n - 1];
    const before = standing[n - 2];
    const deep = `${(GAIT.depth * latest.scale * 10).toFixed(0)} mm deep`;
    if (!latest.step) return { word: `print ${n}`, text: `print ${n} · ${deep}` };
    if (!before || before.step !== latest.step - 1) return { word: `step ${latest.step}`, text: `step ${latest.step} · ${deep}` };
    const [ax, ay] = toWorld(before, 4, 0);
    const [bx, by] = toWorld(latest, 4, 0);
    const walk = (before.heading + latest.heading) / 2;
    const along = Math.abs((bx - ax) * Math.cos(walk) + (by - ay) * Math.sin(walk));
    return { word: `step ${latest.step}`, text: `step ${latest.step} · ${metres(along)} m · ${deep}` };
  }
  if (standing.length) {
    const n = standing.length;
    return { word: `${n} ${n === 1 ? "print" : "prints"}`, text: `${n} ${n === 1 ? "print" : "prints"} · water in the heels` };
  }
  return { word: "smooth", text: state.wave ? "smooth again" : "smooth" };
}

function speak() {
  const phase = phaseOf();
  if (readout.textContent !== phase.text) readout.textContent = phase.text;
  if (phase.word !== state.lastWord) {
    state.lastWord = phase.word;
    if (document.activeElement === stage) said.textContent = phase.word;
  }
}

function surfacePoint(x, y) {
  return iso([x, y, surfaceAt(y)], D.P);
}

const POOLS = [[4, 0.2, 2.2, 1.5], [17, -1.2, 1.9, 2.3]];
function ellipseAt(print, [cu, cv, ru, rv]) {
  return pathOf(Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2;
    return surfacePoint(...toWorld(print, cu + ru * Math.cos(a), cv + rv * Math.sin(a)));
  }), true);
}

function drawFallback() {
  if (layer) return;
  const parts = [];
  const regions = regionsOf();
  const { rise, fall } = FOOT.pale;
  for (const print of state.prints) {
    const age = still.matches ? 9 : state.clock - print.born;
    const keep = 1 - erosionAt(print);
    if (keep < 0.02) continue;
    const rings = regions.map((region) => ({ d: pathOf(region.ring.map(([u, v]) => surfacePoint(...toWorld(print, u, v))), true), on: pressOf(region.at, age) }));
    const shown = rings.filter((ring) => ring.on > 0.02);
    const pale = ramp(rise[0], rise[1], age) * (1 - ramp(fall[0], fall[1], age));
    const seep = ramp(FOOT.seep[0], FOOT.seep[1], age) * ramp(0.4, 0.8, keep);
    const halo = pale > 0.02 ? `<path class="fp-print-pale" d="${rings[0].d}" opacity="${pale.toFixed(2)}"/>` : "";
    const pools = seep > 0.02 ? POOLS.map((pool) => `<path class="fp-print-pool" d="${ellipseAt(print, pool)}" opacity="${(0.6 * seep).toFixed(2)}"/>`).join("") : "";
    parts.push(`<g opacity="${keep.toFixed(3)}">${halo}${shown.map((ring) => `<path class="fp-print-rim" d="${ring.d}" opacity="${ring.on.toFixed(2)}"/>`).join("")}${shown.map((ring) => `<path class="fp-print-floor" d="${ring.d}" opacity="${ring.on.toFixed(2)}"/>`).join("")}${pools}</g>`);
  }
  printLayer.innerHTML = parts.join("");
  const xs = Array.from({ length: 61 }, (_, i) => (i / 60) * STRIP.length);
  let sheet = "";
  let lace = "";
  let laceOpacity = 0;
  const lines = [];
  const mid = STRIP.length / 2;
  const markOf = (wave) => {
    const s = state.clock - wave.at;
    const turn = turnOf(wave, mid);
    const shown = ramp(turn, turn + 0.6, s) * Math.exp(-Math.max(s - turn, 0) / 9);
    if (shown > 0.02) lines.push(`<path d="${pathOf(xs.map((x) => surfacePoint(x, Math.min(STRIP.width, topOf(wave, x)))))}" opacity="${shown.toFixed(2)}"/>`);
  };
  if (state.wave) {
    const s = waveAge();
    const turn = turnOf(state.wave, mid);
    if (waveBusy()) {
      const front = xs.map((x) => Math.min(STRIP.width, frontAt(state.wave, x, s)));
      if (Math.max(...front) > 0) {
        const edge = xs.map((x, i) => surfacePoint(x, Math.max(0, front[i])));
        sheet = pathOf([...edge, surfacePoint(STRIP.length, 0), surfacePoint(0, 0)], true);
        laceOpacity = 1 - ramp(turn - 0.3, turn + 0.5, s);
        if (laceOpacity > 0.02) lace = pathOf(edge);
      }
    }
    if (state.prev) markOf(state.prev);
    markOf(state.wave);
  }
  sheetPath.setAttribute("d", sheet);
  lacePath.setAttribute("d", lace);
  lacePath.setAttribute("opacity", laceOpacity.toFixed(2));
  lineLayer.innerHTML = lines.join("");
}

function draw() {
  if (layer && canvas.clientWidth) layer.draw(uniforms(), still.matches ? 0.8 : state.clock);
  drawFallback();
  speak();
}

function tick(now) {
  const raw = last ? (now - last) / 1000 : 0;
  const dt = last ? Math.min(raw, 0.25) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (!calm && !frozen) {
    advance(dt);
    if (raw < 1) watchPace(raw);
  }
  const busy = !calm && !frozen && (touring || waveBusy() || state.prints.some((print) => state.clock - print.born < FOOT.seep[1] + 0.5) || (state.wave && waveAge() < 2 * turnOf(state.wave, STRIP.length / 2) + 8));
  if (busy || dirty) draw();
  dirty = false;
  frame = visible && (busy || dirty) ? requestAnimationFrame(tick) : 0;
}

function run() {
  if (!frame && visible) {
    last = 0;
    frame = requestAnimationFrame(tick);
  }
}

function hold() {
  touring = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (still.matches) return;
    touring = true;
    const at = state.clock + (state.prints.length && !waveBusy() ? 0.6 : 0);
    state.plan = [];
    state.next = 0;
    if (state.prints.length && !waveBusy()) state.plan.push({ at, kind: "wave" });
    const resume = at + (state.prints.length || waveBusy() ? 7.5 : 1.2);
    state.plan.push({ at: resume, kind: "cycle" });
    run();
  }, 4200);
}

function planeAt(clientX, clientY) {
  const box = stage.getBoundingClientRect();
  const sx = ((clientX - box.left) / box.width) * D.W;
  const sy = ((clientY - box.top) / box.height) * D.H;
  const { sinA, cosA, sinE, cosE, k } = cameraOf(D.P);
  const a = (sx - D.P.origin[0]) / k;
  const b = (sy - D.P.origin[1]) / k + STRIP.sea * cosE;
  const m11 = sinA, m12 = -cosA;
  const m21 = cosA * sinE, m22 = sinA * sinE - STRIP.rise * cosE;
  const det = m11 * m22 - m12 * m21;
  return [(a * m22 - m12 * b) / det, (m11 * b - m21 * a) / det];
}

function stepAt(x, y, step = 0) {
  const foot = footAt(x - FOOT.length / 2, y, 0, state.side, Math.random());
  press(foot, state.clock, step);
}

function clearLine() {
  const lines = [GAIT.line, GAIT.line - 26, GAIT.line + 26, GAIT.line + 48];
  const near = state.prints.filter((print) => print.x < FOOT.length + GAIT.step);
  const gap = (y) => Math.min(Infinity, ...near.map((print) => Math.abs(print.y - y)));
  return lines.reduce((best, y) => (gap(y) > gap(best) ? y : best));
}

let down = null;
stage.addEventListener("pointerdown", (event) => {
  down = event.pointerType === "mouse" ? null : { x: event.clientX, y: event.clientY, at: performance.now(), id: event.pointerId };
  if (event.pointerType === "mouse" && event.button === 0) tapAt(event.clientX, event.clientY);
});
stage.addEventListener("pointerup", (event) => {
  if (!down || down.id !== event.pointerId) return;
  const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
  if (moved < 10 && performance.now() - down.at < 500) tapAt(event.clientX, event.clientY);
  down = null;
});
stage.addEventListener("pointercancel", () => {
  down = null;
});

function tapAt(clientX, clientY) {
  const [x, y] = planeAt(clientX, clientY);
  if (x < -4 || x > STRIP.length + 4 || y < -4 || y > STRIP.width + 4) return;
  const cx = Math.min(STRIP.length - FOOT.length / 2 - 4, Math.max(FOOT.length / 2 + 4, x));
  const cy = Math.min(STRIP.width - 12, Math.max(12, y));
  hold();
  stepAt(cx, cy);
  run();
}

stage.addEventListener("keydown", (event) => {
  if (event.key === " " || event.key === "Enter") {
    event.preventDefault();
    hold();
    if (still.matches) {
      state.clock += 7;
      launchWave(state.clock - 6.5);
      sweep();
    } else if (!waveBusy()) launchWave(state.clock);
    run();
    return;
  }
  if (event.key === "ArrowRight") {
    event.preventDefault();
    hold();
    const lastPrint = state.prints[state.prints.length - 1];
    const lineOf = (print) => print.y - (print.side * GAIT.width) / 2;
    let x = lastPrint ? lastPrint.x + GAIT.step + FOOT.length / 2 : FOOT.length / 2 + 12;
    let y = lastPrint ? lineOf(lastPrint) : GAIT.line;
    let step = lastPrint && lastPrint.step ? lastPrint.step + 1 : 1;
    if (x > STRIP.length - FOOT.length / 2 - 4) {
      x = FOOT.length / 2 + 12;
      y = clearLine();
      step = 1;
    }
    stepAt(x, y, step);
    run();
  }
});

new IntersectionObserver(
  (entries) => {
    visible = entries[entries.length - 1].isIntersecting;
    if (visible) run();
  },
  { rootMargin: "120px 0px" },
).observe(stage);

still.addEventListener("change", () => {
  clearTimeout(idleTimer);
  touring = !still.matches;
  frozen = false;
  if (still.matches) stillScene();
  else tourScene();
  dirty = true;
  run();
});
if (themeHost)
  new MutationObserver(() => {
    if (layer) layer.set(themeOf());
    dirty = true;
    run();
  }).observe(themeHost, { attributes: true, attributeFilter: ["data-theme"] });
window.addEventListener("resize", () => {
  dirty = true;
  run();
});
stage.addEventListener("focus", () => {
  said.textContent = phaseOf().word;
});
if (matchMedia("(hover: none)").matches) {
  const hint = root.querySelector('[data-corner="hint"]');
  if (hint) hint.textContent = "Tap the sand to step";
}

function tourScene() {
  Object.assign(state, { clock: 0, prints: [], wave: null, prev: null, waves: 0, cycle: 0, lastStep: -10, side: 1 });
  planCycle(0);
}

function stillScene() {
  Object.assign(state, { clock: 0, prints: [], wave: null, prev: null, waves: 0, cycle: 0, plan: [], next: 0, lastStep: -10, side: 1 });
  tourSteps(0).forEach((foot, index) => press(foot, -9, index + 1));
  launchWave(-timesAt(waveOf(0, 0), STRIP.length / 2, GAIT.line - 24)[0]);
  state.lastStep = -10;
}

window.__fpSeek = (t, hold = true) => {
  touring = true;
  tourScene();
  while (state.clock < t - 1e-9) advance(Math.min(1 / 60, t - state.clock));
  frozen = hold;
  dirty = true;
  draw();
  run();
  return readout.textContent;
};

if (still.matches) stillScene();
else tourScene();
draw();
