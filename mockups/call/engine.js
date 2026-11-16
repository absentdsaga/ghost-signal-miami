/* Ghost Signal call engine. One frame for all 11 machines; each machine is one data file (window.CALL). */
(()=>{
const C=window.CALL,$=q=>document.querySelector(q),B=document.body;
const RANKS=[[0,"ROOKIE"],[3,"OPERATOR"],[7,"FLIGHT CONTROLLER"],[11,"FLIGHT DIRECTOR"]];
const rankOf=n=>RANKS.filter(r=>n>=r[0]).pop()[1];
const store=()=>{try{return JSON.parse(localStorage.getItem("gs-found")||"{}")}catch(e){return{}}};
let MAN={},run=0,fuel=3,log=[],pending=null,tries=0;
fetch(C.voiceDir+"manifest.json").then(r=>r.json()).then(j=>MAN=j).catch(()=>{});

/* ---------- audio ---------- */
let AC;const ac=()=>{try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();AC.state==="suspended"&&AC.resume()}catch(e){}return AC};
function tone(f,d,type="sine",v=.08,at=0){const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain(),t=a.currentTime+at;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(a.destination);o.start(t);o.stop(t+d)}
const quindar=()=>tone(2525,.22,"sine",.06);
function crackle(ms=200,v=.14){const a=ac();if(!a)return;const n=a.sampleRate*ms/1000|0,b=a.createBuffer(1,n,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*v*(Math.random()<.3);const s=a.createBufferSource();s.buffer=b;s.connect(a.destination);s.start()}
const sfx={ok(){tone(660,.12,"triangle",.1);tone(990,.18,"triangle",.1,.09);tone(1320,.25,"triangle",.08,.18)},
  bad(){tone(180,.28,"sawtooth",.09);tone(120,.4,"square",.05,.1);crackle(300,.25)},
  tick(){tone(1400,.04,"square",.03)},
  stamp(){tone(90,.25,"sine",.25);crackle(80,.3)},
  win(){[523,659,784,1047,1319].forEach((f,i)=>tone(f,.35,"triangle",.09,i*.1))}};
const vo=new Audio();vo.preload="auto";const real=C.realAudio?new Audio(C.realAudio):null;if(real)real.preload="auto";
let curFin=null;
function voice(o){return new Promise(res=>{let done=false;const fin=()=>{if(!done){done=true;clearTimeout(t);curFin=null;res()}};curFin=fin;
  const t=setTimeout(fin,Math.max(3500,o.say.length*85));const f=MAN[o.who+"|"+o.say];
  if(f){vo.onended=fin;vo.onerror=fin;vo.src=C.voiceDir+f;vo.play().catch(fin);return}
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(o.say);u.pitch=.8;u.rate=1.05;u.onend=fin;speechSynthesis.speak(u)}catch(e){setTimeout(fin,o.say.length*55)}})}
function stopVoice(){try{vo.pause()}catch(e){}try{speechSynthesis.cancel()}catch(e){}curFin&&curFin()}
function realClip(a,b){return new Promise(res=>{if(!real)return res();let done=false;const fin=()=>{if(done)return;done=true;real.pause();res()};
  try{real.currentTime=a;real.ontimeupdate=()=>{if(real.currentTime>=b)fin()};real.play().catch(fin);setTimeout(fin,(b-a)*1000+1500)}catch(e){fin()}})}
const wait=ms=>new Promise(r=>setTimeout(r,ms));

/* ---------- view ---------- */
function setup(){
  $("#ground").src=C.layers+"ground.webp";$("#shadow").src=C.layers+"shadow.webp";$("#mach").src=C.layers+"machine.webp";$("#mach").alt=C.name+", "+C.what;
  $("#name").textContent=C.name;$("#where").textContent=C.what+" · "+C.where;$("#mlabel").textContent=C.meter;
  $("#ringImg").src=C.cut||C.layers+"machine.webp";$("#ringName").textContent=C.name;$("#ringK").textContent=C.ring;$("#ringRules").textContent=C.rules;
  const n=Object.keys(store()).length;$("#found").textContent=`${n} of 11 machines found · ${rankOf(n)}`;
  $("#pips").innerHTML=C.cards.map(()=>'<i class="pip"></i>').join("")+'<i class="pip"></i>';
  if(!SR)$("#keys").classList.add("nomic"),$("#mic").remove();
  document.documentElement.style.setProperty("--grey",1);
  const dock=()=>document.documentElement.style.setProperty("--dock",$("#dock").offsetHeight+"px");dock();addEventListener("resize",dock);
}
function grey(v){document.documentElement.style.setProperty("--grey",Math.max(0,Math.min(1,v)))}
function line(o,talking){$("#who").textContent=o.who;$("#say").textContent=o.say;$("#fact").innerHTML="";$("#line").classList.toggle("talk",!!talking)}
async function speak(o){quindar();crackle();line(o,true);await voice(o);$("#line").classList.remove("talk")}
function fact(t,src){$("#fact").innerHTML=t?`${t}<a href="${src}" target="_blank" rel="noopener">NASA SOURCE ↗</a>`:""}
function pips(i){[...document.querySelectorAll(".pip")].forEach((p,j)=>{p.className="pip"+(log[j]===1?" ok":log[j]===0?" bad":log[j]===2?" ok":"")+(j===i?" now":"")})}
function segs(){[...document.querySelectorAll(".seg")].forEach((s,i)=>s.classList.toggle("gone",i>=fuel))}
function stamp(ok,big,small){const s=$("#stamp");s.className="stamp "+(ok?"ok":"bad");$("#stB").textContent=big;$("#stS").textContent=small;void s.offsetWidth;s.classList.add("show");sfx.stamp()}
function unstamp(){$("#stamp").className="stamp"}
function fx(cls,ms=650){B.classList.remove(cls);void B.offsetWidth;B.classList.add(cls);setTimeout(()=>B.classList.remove(cls),ms)}
const hint=t=>$("#hint").innerHTML=t||"";

/* ---------- input: tap, or say it ---------- */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null;
function ask(card,ms){return new Promise(res=>{
  const kA=$("#kA"),kB=$("#kB"),keys=$("#keys");kA.className=kB.className="key";
  kA.querySelector("b").textContent=card.a.cap;kB.querySelector("b").textContent=card.b.cap;
  keys.classList.remove("off");keys.classList.add("on");setTimeout(()=>keys.classList.remove("on"),600);
  hint(SR?"TAP A BUTTON <b>OR HOLD THE MIC AND SAY IT</b>":"TAP YOUR CALL");
  let done=false,t0=performance.now(),raf;const mic=$("#mic");
  const end=v=>{if(done)return;done=true;cancelAnimationFrame(raf);kA.onclick=kB.onclick=null;keys.classList.add("off");mic&&mic.classList.remove("listen","low");try{rec&&rec.abort()}catch(e){}hint("");pending=null;res(v)};
  pending=end;kA.onclick=()=>end("a");kB.onclick=()=>end("b");
  let last=-1;const loop=()=>{const p=ms?(performance.now()-t0)/ms:0;if(mic){mic.style.setProperty("--t",Math.max(0,1-p));mic.classList.toggle("low",p>.66)}
    const sec=Math.ceil(ms/1000*(1-p));if(ms&&p>.5&&sec!==last){last=sec;sfx.tick()}
    if(ms&&p>=1)return end("slow");raf=requestAnimationFrame(loop)};loop();
  if(mic&&SR){const start=e=>{e.preventDefault();if(done)return;try{rec=new SR();rec.lang="en-US";rec.interimResults=true;rec.maxAlternatives=3;
      rec.onresult=ev=>{const said=[...ev.results].map(r=>r[0].transcript).join(" ").toLowerCase();hint("HEARD: <b>"+said.toUpperCase()+"</b>");
        const hit=k=>card[k].keys.some(w=>new RegExp("\\b"+w+"\\b").test(said));
        const A=hit("a"),Bb=hit("b");if(A!==Bb)setTimeout(()=>end(A?"a":"b"),250)};
      rec.onend=()=>mic.classList.remove("listen");rec.start();mic.classList.add("listen")}catch(err){}};
    mic.onpointerdown=start;mic.onpointerup=mic.onpointerleave=()=>{try{rec&&rec.stop()}catch(e){}}}
})}

/* ---------- the call ---------- */
async function bet(card,i,id){
  pips(i);B.classList.toggle("lift",!!(card.fx&&card.fx.lift));B.classList.remove("long");
  $("#kA b").textContent=card.a.cap;$("#kB b").textContent=card.b.cap;$("#kA").className=$("#kB").className="key";
  const L=$("#lamp");L.textContent=card.lamp||"";L.classList.toggle("on",!!card.lamp);if(card.lamp){tone(880,.15,"square",.05);tone(880,.15,"square",.05,.3)}
  if(card.warn){await speak(card.warn);if(id!==run)return}
  await speak(card);if(id!==run)return;
  const v=await ask(card,9000);if(id!==run)return;
  $("#lamp").classList.remove("on");const ok=v===card.right;
  const k=v==="a"?$("#kA"):v==="b"?$("#kB"):null;k&&k.classList.add(ok?"pick-ok":"pick-bad");
  if(!ok)(card.right==="a"?$("#kA"):$("#kB")).classList.add("was");
  log[i]=ok?1:0;pips(i);
  if(ok){sfx.ok();fx("good");$("#segs").classList.remove("pulse");void $("#segs").offsetWidth;$("#segs").classList.add("pulse");grey(1-(log.filter(x=>x).length/(C.cards.length+1)));
    if(card.fx&&card.fx.lift)B.classList.add("long");stamp(true,"SAME CALL",card.was)}
  else{sfx.bad();fx("hit",520);fuel--;segs();stamp(false,v==="slow"?"TOO SLOW":"NOT IN "+C.year,card.was)}
  let react=ok?{who:C.name,say:card.yes}:v==="slow"?C.slow:{who:C.name,say:card.no};
  if(!ok&&fuel===1&&C.miss2)react=C.miss2;
  if(fuel<=0)return lose(id);
  await speak(react);if(id!==run)return;
  fact(card.fact,card.src);
  if(card.twist==="real"&&card.real){unstamp();B.classList.remove("lift","long");$("#realTag").textContent=card.real.tag;$("#real").classList.add("on");
    line({who:"REAL 1969 RADIO",say:card.real.line},true);fact(card.fact,card.src);await realClip(card.real.at[0],card.real.at[1]);$("#real").classList.remove("on");$("#line").classList.remove("talk")}
  else await wait(2600);
  unstamp();
}
async function heart(id){
  const H=C.heart,i=C.cards.length;pips(i);B.classList.remove("lift","long");
  await speak(H);if(id!==run)return;
  const v=await ask(H,0);if(id!==run)return;
  ($("#k"+(v==="a"?"A":"B"))).classList.add("pick-ok");log[i]=2;pips(i);
  grey(0);sfx.win();fx("good",900);
  await speak(H.reveal);if(id!==run)return;fact("",H.src);
  await speak(H.after);if(id!==run)return;
}
async function play(){
  const id=++run;fuel=3;log=[];segs();grey(1);unstamp();$("#chips").hidden=true;$("#keys").hidden=false;$("#keys").classList.add("off");
  await speak(tries?C.again:C.open);if(id!==run)return;
  for(let i=0;i<C.cards.length;i++){await bet(C.cards[i],i,id);if(id!==run)return}
  await heart(id);if(id!==run)return;keepsake();
}
async function lose(id){
  stopVoice();await speak(C.abort);if(id!==run)return;
  $("#lostLine").textContent=C.abort.say;$("#lost").classList.add("on");B.classList.add("over");staticNoise();
}
function staticNoise(){const c=$("#static"),x=c.getContext("2d"),img=x.createImageData(160,90);const loop=()=>{if(!$("#lost").classList.contains("on"))return;
  for(let i=0;i<img.data.length;i+=4){const v=Math.random()*255|0;img.data[i]=img.data[i+1]=img.data[i+2]=v;img.data[i+3]=255}x.putImageData(img,0,0);crackle(60,.05);setTimeout(loop,70)};loop()}
function keepsake(){
  const K=C.keepsake,left=fuel,grade=left===3?"PERFECT CALL":left===2?"CLEAN CALL":"CLOSE CALL";
  const st=store();const first=!st[C.id];st[C.id]={grade,at:Date.now()};try{localStorage.setItem("gs-found",JSON.stringify(st))}catch(e){}
  const n=Object.keys(st).length,before=rankOf(n-(first?1:0)),now=rankOf(n);
  $("#kImg").src=K.img;$("#kTitle").textContent=K.title;$("#kCap").innerHTML=`${K.cap}<a href="${K.src}" target="_blank" rel="noopener">NASA ↗</a>`;
  $("#kSt").textContent=`MEMORY ${n} OF 11`;
  $("#kRow").innerHTML=log.map((v,i)=>`<i class="${v===0?"x":i===C.cards.length?"h":""}"></i>`).join("");
  $("#kGrade").textContent=grade;$("#kRank").textContent=`${C.meter} LEFT ${left}/3 · ${now}`;
  $("#keep").classList.add("on");B.classList.add("over");sfx.win();
  ["kNext","kTalk","kAgain"].forEach(b=>$("#"+b).hidden=true);$("#kToday").hidden=!K.today;
  speak(K.line);
  if(before!==now)setTimeout(()=>{$("#promoT").textContent=now;$("#promo").classList.add("on");sfx.win();setTimeout(()=>$("#promo").classList.remove("on"),2200)},900);
  if(!K.today)showEnd();
}
function showEnd(){["kNext","kTalk","kAgain"].forEach(b=>$("#"+b).hidden=false);$("#kToday").hidden=true}
$("#kToday").onclick=()=>{const T=C.keepsake.today,img=$("#kImg");img.style.opacity=0;setTimeout(()=>{img.src=T.img;img.style.opacity=1},350);
  $("#keepK").textContent="STILL THERE TODAY";$("#kTitle").textContent="ME, RIGHT NOW";$("#kCap").innerHTML=`${T.cap}<a href="${T.src}" target="_blank" rel="noopener">NASA ↗</a>`;
  stopVoice();speak(T.line);showEnd()};
$("#kNext").onclick=()=>{location.href=C.next};
$("#kAgain").onclick=()=>{$("#keep").classList.remove("on");B.classList.remove("over");tries++;play()};
$("#kTalk").onclick=()=>{$("#keep").classList.remove("on");B.classList.remove("over");$("#keys").hidden=true;const ch=$("#chips");ch.hidden=false;hint("PICK ONE. EVERY STORY IS FROM A NASA FILE.");
  line({who:C.name,say:"Line's open, caller. Pick one."});
  ch.innerHTML=C.talk.map((t,i)=>`<button class="chip" data-i="${i}">${t.label}</button>`).join("")+`<button class="chip" id="hang">HANG UP</button>`;
  ch.querySelectorAll("[data-i]").forEach(b=>b.onclick=async()=>{const t=C.talk[b.dataset.i];stopVoice();await speak(t);fact("",t.src)});
  $("#hang").onclick=()=>{stopVoice();$("#keep").classList.add("on");B.classList.add("over")}};
$("#answer").onclick=()=>{ac();B.classList.remove("pre");$("#incoming").classList.remove("on");sfx.ok();play()};
$("#again").onclick=()=>{$("#lost").classList.remove("on");B.classList.remove("over");tries++;play()};
$("#line").onclick=null;
document.addEventListener("keydown",e=>{if(!pending)return;if(e.key==="ArrowLeft"||e.key==="1")pending("a");if(e.key==="ArrowRight"||e.key==="2")pending("b")});
setup();window.__call={get fuel(){return fuel},get log(){return log}};
})();
