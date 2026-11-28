/* พลุไล่ผี dev tools: FX Studio (build effects and bind them to skills) and Rig Studio (poses, weapon, body, attack poses).
   Loaded by phlu-3d.html only when the URL has ?dev. Works inside the running game so every preview uses the real engine.
   Drafts autosave to this browser (localStorage, read only with ?dev); "บันทึกไฟล์" writes art/data/fx.json or art/data/rig.json,
   which is what players get once the files are pushed. */
(()=>{
'use strict';
const LS={fx:'phlu-dev-fx',rig:'phlu-dev-rig'},FILE={fx:'fx.json',rig:'rig.json'};
const clone=o=>JSON.parse(JSON.stringify(o));
const lsGet=k=>{try{return JSON.parse(localStorage.getItem(k))}catch(e){return null}},lsSet=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));return true}catch(e){return false}};
function h(tag,props,...kids){const e=document.createElement(tag);if(props)for(const k in props){const v=props[k];if(k=='class')e.className=v;else if(k=='style')e.style.cssText=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else if(k in e)e[k]=v;else e.setAttribute(k,v)}
 for(const c of kids.flat())if(c!==null&&c!==undefined&&c!==false)e.append(c.nodeType?c:document.createTextNode(String(c)));return e}
const css=`
#dvbar{position:fixed;left:12px;bottom:12px;z-index:60;display:flex;gap:8px;font:13px/1.2 system-ui,sans-serif}
#dvbar button,#dvp button{background:#232a36;color:#e8ecf2;border:1px solid #3a4352;border-radius:8px;padding:6px 10px;cursor:pointer;font:inherit}
#dvbar button:hover,#dvp button:hover{background:#2e3747}#dvp button.on{background:#c98a2b;border-color:#e0a447;color:#1a1306}
#dvp{position:fixed;right:0;top:0;bottom:0;width:360px;z-index:60;background:#151a22f2;color:#dfe4ec;font:12px/1.35 system-ui,sans-serif;overflow-y:auto;padding:12px 12px 40px;box-sizing:border-box;border-left:1px solid #2c3442}
#dvp h2{font-size:15px;margin:0 0 8px;display:flex;justify-content:space-between;align-items:center}#dvp h3{font-size:12px;margin:14px 0 6px;color:#f0c27a;font-weight:600}
#dvp .row{display:flex;gap:6px;align-items:center;margin:4px 0;flex-wrap:wrap}#dvp label.sl{display:grid;grid-template-columns:78px 1fr 46px;gap:6px;align-items:center;margin:3px 0}
#dvp input[type=range]{width:100%}#dvp input[type=number]{width:46px;background:#0e1219;color:#dfe4ec;border:1px solid #2c3442;border-radius:4px;font:11px ui-monospace,monospace;padding:2px}
#dvp select,#dvp input[type=text]{background:#0e1219;color:#dfe4ec;border:1px solid #2c3442;border-radius:6px;padding:4px;font:inherit;max-width:100%}
#dvp .card{background:#1c222d;border:1px solid #2a3240;border-radius:10px;padding:8px;margin:6px 0}#dvp .card.off{opacity:.45}
#dvp .muted{color:#8b95a6}#dvp .st{color:#9bd29b;min-height:16px}#dvp .x{padding:2px 7px!important}
#dvp code{font:11px ui-monospace,monospace;color:#cfd6e2}`;
document.head.append(h('style',null,css));

/* ---------- state ---------- */
const D={fx:lsGet(LS.fx)||{presets:clone(FXD.presets||{}),binds:clone(FXD.binds||[])},rig:lsGet(LS.rig)||clone(RIGD||{heroes:{}})};
if(!D.fx.presets||typeof D.fx.presets!='object')D.fx.presets={};if(!Array.isArray(D.fx.binds))D.fx.binds=[];if(!D.rig.heroes)D.rig.heroes={};
FXD.presets=D.fx.presets;FXD.binds=D.fx.binds;
const handles={};let panel=null,origInput=null,ui={};
function draft(kind,msg){lsSet(LS[kind],D[kind]);status(msg||'แก้แล้ว · บันทึกเป็นร่างในเครื่องนี้ (ยังไม่ได้บันทึกไฟล์)')}
function status(t){if(ui.st)ui.st.textContent=t}
async function saveFile(kind){const txt=JSON.stringify(D[kind],null,1);
 if(window.showSaveFilePicker){try{const fh=handles[kind]||await showSaveFilePicker({suggestedName:FILE[kind],types:[{description:'JSON',accept:{'application/json':['.json']}}]});handles[kind]=fh;const w=await fh.createWritable();await w.write(txt);await w.close();status('บันทึกไฟล์ '+fh.name+' แล้ว · เก็บไว้ที่ art/data/ ของโปรเจกต์');return}catch(e){if(e.name=='AbortError')return}}
 const a=h('a',{href:URL.createObjectURL(new Blob([txt],{type:'application/json'})),download:FILE[kind]});a.click();status('ดาวน์โหลด '+FILE[kind]+' แล้ว · ย้ายไปไว้ที่ art/data/ ของโปรเจกต์')}
function copyJSON(kind){navigator.clipboard.writeText(JSON.stringify(D[kind],null,1)).then(()=>status('คัดลอก JSON แล้ว'),()=>status('คัดลอกไม่ได้'))}

/* ---------- shared preview session inside the game ---------- */
const cam0={yaw:.6,pitch:.28,dist:5.2,spin:false};
function enter(kind){if(mode!='play'){start()}if(!origInput){origInput=input;input=()=>({x:0,z:0})}
 TOOL={kind,anim:null,cam:Object.assign({},cam0,kind=='fx'?{dist:8,pitch:.4,yaw:1.35}:{}),tick(dt){if(!P||mode!='play')return;P.inv=Math.max(P.inv,5);const c=TOOL.cam;if(c.spin)c.yaw+=dt*.6;
  const f=TOOL.kind=='fx'?fxPoint():{x:P.x,y:P.y+1.15,z:P.z},cp=Math.cos(c.pitch),yw=c.yaw+(P.f||0);cam.position.set(f.x+Math.sin(yw)*cp*c.dist,f.y+Math.sin(c.pitch)*c.dist,f.z+Math.cos(yw)*cp*c.dist);cam.lookAt(f.x,f.y,f.z);{const W=ren.domElement.clientWidth,H=ren.domElement.clientHeight,pw=panel?Math.min(360,W*.45):0;if(pw)cam.setViewOffset(W,H,pw/2,0,W,H);else cam.clearViewOffset()}
  if(TOOL.kind=='fx'&&ui.auto&&ui.auto.checked){TOOL.rep=(TOOL.rep||0)-dt;if(TOOL.rep<=0){TOOL.rep=1.6;playCur()}}}};
 TSC=1;open(kind)}
function leave(){cam.clearViewOffset();TOOL=null;TSC=1;if(origInput){input=origInput;origInput=null}if(panel){panel.remove();panel=null}}
function fxPoint(){const f=P.f||0;return{x:P.x+Math.sin(f)*3,y:1,z:P.z+Math.cos(f)*3}}
function slider(label,val,min,max,step,on){const n=h('input',{type:'number',value:val,step}),r=h('input',{type:'range',min,max,step,value:val});
 r.oninput=()=>{n.value=r.value;on(+r.value)};n.onchange=()=>{r.value=n.value;on(+n.value)};return h('label',{class:'sl'},label,r,n)}
function camBox(){const c=TOOL.cam;return h('div',null,h('h3',null,'กล้อง'),slider('หมุนรอบ',+c.yaw.toFixed(2),-3.14,3.14,.01,v=>c.yaw=v),slider('มุมก้ม',c.pitch,-.2,1.4,.01,v=>c.pitch=v),slider('ระยะ',c.dist,1.5,16,.1,v=>c.dist=v),
 h('div',{class:'row'},h('label',null,h('input',{type:'checkbox',checked:c.spin,onchange:e=>c.spin=e.target.checked}),' หมุนอัตโนมัติ')),
 slider('ความเร็วเวลา',TSC,0,1.5,.05,v=>TSC=v))}
function open(kind){if(panel)panel.remove();ui={};panel=h('div',{id:'dvp'});document.body.append(panel);(kind=='fx'?fxPanel:rigPanel)()}
function head(title){return h('h2',null,title,h('button',{class:'x',onclick:leave,title:'ปิด'},'ปิด'))}
function saveRow(kind){ui.st=h('div',{class:'st'});return h('div',null,h('h3',null,'บันทึก'),h('div',{class:'row'},h('button',{onclick:()=>saveFile(kind)},'บันทึกไฟล์ '+FILE[kind]),h('button',{onclick:()=>copyJSON(kind)},'คัดลอก JSON'),
 h('button',{onclick:()=>{if(!confirm('ทิ้งร่างในเครื่องนี้ แล้วกลับไปใช้ไฟล์ที่บันทึกไว้?'))return;localStorage.removeItem(LS[kind]);location.reload()}},'ทิ้งร่าง')),ui.st,
 h('div',{class:'muted'},'ร่างจะใช้ได้เฉพาะตอนเปิดด้วย ?dev ในเครื่องนี้ ผู้เล่นจะเห็นหลังบันทึกไฟล์ลง art/data/ แล้ว push'))}

/* ---------- FX Studio ---------- */
const LT={spark:'ประกายไฟ',burst:'พลุแตก',smoke:'ควัน',ring:'วงแหวนพื้น',flash:'แสงวาบ',puff:'กลุ่มอนุภาค',shake:'จอสั่น'};
const LF={ // field: [label,min,max,step,default]
 spark:{c:'#ffd27a',n:['จำนวน',0,80,1,14],v:['ความเร็ว',0,30,.5,6],l:['อายุ (วิ)',.05,4,.05,.7],g:['แรงโน้มถ่วง',-20,30,.5,6],dy:['ความสูง',-3,6,.1,0],at:['หน่วงเวลา',0,3,.05,0]},
 burst:{c:'#ff7ac8',k:['ball','willow','flower','ring'],n:['จำนวน',0,80,1,24],v:['ความเร็ว',0,30,.5,7],l:['อายุ (วิ)',.05,4,.05,.9],dy:['ความสูง',-3,6,.1,1.5],at:['หน่วงเวลา',0,3,.05,0]},
 smoke:{c:'#8d8798',n:['จำนวน',0,40,1,6],sz:['ขนาด',.1,5,.05,.8],v:['กระจาย',0,10,.1,1.4],dy:['ความสูง',-3,6,.1,0],at:['หน่วงเวลา',0,3,.05,0]},
 ring:{c:'#ffe08a',r:['รัศมี',.1,20,.1,3],l:['อายุ (วิ)',.05,3,.05,.4],at:['หน่วงเวลา',0,3,.05,0]},
 flash:{c:'#ffd9a0',i:['ความแรง',0,10,.1,3],dy:['ความสูง',-3,6,.1,0],at:['หน่วงเวลา',0,3,.05,0]},
 puff:{c:'#ffffff',k:['รูปแบบ',0,8,1,1],n:['จำนวน',0,60,1,10],v:['กระจาย',0,20,.1,2],up:['ลอยขึ้น',-10,20,.1,1],l:['อายุ (วิ)',.05,4,.05,.7],s0:['ขนาดเริ่ม',.02,6,.02,.4],s1:['ขนาดจบ',.02,8,.02,1.2],g:['แรงโน้มถ่วง',-20,30,.5,0],dy:['ความสูง',-3,6,.1,0],at:['หน่วงเวลา',0,3,.05,0]},
 shake:{i:['ความแรง',0,2,.05,.3],at:['หน่วงเวลา',0,3,.05,0]}};
const EV=[['hit:light','โดนตีปกติ (ที่ศัตรู)'],['hit:heavy','โดนตีหนัก/ชาร์จ (ที่ศัตรู)'],['hit:sk','โดนสกิล (ที่ศัตรู)'],['act:light','เริ่มท่าตีปกติ'],['act:air','ตีกลางอากาศ'],['act:thrust','ตีหลังแดช'],['act:charge','เริ่มชาร์จ'],['act:heavy','ปล่อยท่าหนัก'],['act:cast','ใช้สกิล'],['act:spin','ท่าหมุน'],['act:plunge','กระแทกจากฟ้า'],['act:land','ลงพื้น'],['act:guard','ตั้งการ์ด'],['act:ult','ท่าไม้ตาย'],['act:ride','ขี่จรวด'],['dash','แดช'],['jump','กระโดด']];
let cur=Object.keys(D.fx.presets)[0]||null;
function playCur(){const p=D.fx.presets[cur];if(!p||!P)return;const f=fxPoint();fxPlay(p,f.x,f.y,f.z)}
function newLayer(t){const o={t};for(const[k,v]of Object.entries(LF[t]))o[k]=typeof v=='string'?v:Array.isArray(v)&&typeof v[0]=='string'&&k=='k'&&t=='burst'?v[0]:v[4];return o}
function fxPanel(){panel.append(head('FX Studio · สร้างเอฟเฟกต์'));
 const sel=h('select',{onchange:e=>{cur=e.target.value;fxPanelRefresh()}});ui.sel=sel;
 const mk=(name,p)=>{let n=name,i=2;while(D.fx.presets[n])n=name+' '+i++;D.fx.presets[n]=p;cur=n;draft('fx');fxPanelRefresh()};
 panel.append(h('h3',null,'เอฟเฟกต์'),h('div',{class:'row'},sel),h('div',{class:'row'},
  h('button',{onclick:()=>{const n=prompt('ชื่อเอฟเฟกต์ใหม่','เอฟเฟกต์ใหม่');if(n&&n.trim())mk(n.trim().slice(0,40),{scale:1,layers:[newLayer('spark'),newLayer('flash')]})}},'สร้างใหม่'),
  h('button',{onclick:()=>{if(cur)mk(cur+' สำเนา',clone(D.fx.presets[cur]))}},'ทำสำเนา'),
  h('button',{onclick:()=>{if(!cur)return;const n=prompt('เปลี่ยนชื่อเป็น',cur);if(!n||!n.trim()||D.fx.presets[n.trim()])return;const nn=n.trim().slice(0,40);D.fx.presets[nn]=D.fx.presets[cur];delete D.fx.presets[cur];for(const b of D.fx.binds)if(b.fx==cur)b.fx=nn;cur=nn;draft('fx');fxPanelRefresh()}},'เปลี่ยนชื่อ'),
  h('button',{onclick:()=>{if(!cur||!confirm('ลบ "'+cur+'"? การผูกกับสกิลที่ใช้อันนี้จะถูกลบด้วย'))return;delete D.fx.presets[cur];for(let i=D.fx.binds.length-1;i>=0;i--)if(D.fx.binds[i].fx==cur)D.fx.binds.splice(i,1);cur=Object.keys(D.fx.presets)[0]||null;draft('fx');fxPanelRefresh()}},'ลบ')),
  h('div',{class:'row'},h('button',{class:'on',onclick:playCur},'เล่น'),h('label',null,ui.auto=h('input',{type:'checkbox',checked:true}),' เล่นซ้ำอัตโนมัติ')));
 ui.body=h('div');ui.binds=h('div');panel.append(ui.body,h('h3',null,'ผูกกับสกิล'),h('div',{class:'muted'},'เลือกตัวละคร เหตุการณ์ และเอฟเฟกต์ที่จะเล่น เอฟเฟกต์ที่ผูกจะเล่นเพิ่มจากของเดิมในเกม'),ui.binds,camBox(),saveRow('fx'));fxPanelRefresh()}
function fxPanelRefresh(){const sel=ui.sel;sel.replaceChildren(...Object.keys(D.fx.presets).map(n=>h('option',{value:n,selected:n==cur},n)));if(!cur)sel.append(h('option',null,'(ยังไม่มี กด "สร้างใหม่")'));
 const p=D.fx.presets[cur];ui.body.replaceChildren();if(p){const ch=()=>{draft('fx');if(!ui.auto.checked)playCur()};
  ui.body.append(slider('ขนาดรวม',p.scale??1,.1,5,.05,v=>{p.scale=v;ch()}),h('h3',null,'ชั้นของเอฟเฟกต์ (สูงสุด 16)'));
  p.layers.forEach((L,i)=>ui.body.append(layerCard(p,L,i,ch)));
  const ts=h('select',null,Object.entries(LT).map(([k,v])=>h('option',{value:k},v)));ui.body.append(h('div',{class:'row'},ts,h('button',{onclick:()=>{if(p.layers.length>=16)return;p.layers.push(newLayer(ts.value));ch();fxPanelRefresh()}},'+ เพิ่มชั้น')))}
 bindList()}
function layerCard(p,L,i,ch){const F=LF[L.t]||{},card=h('div',{class:'card'+(L.off?' off':'')});
 card.append(h('div',{class:'row'},h('b',null,(i+1)+'. '+(LT[L.t]||L.t)),h('span',{style:'flex:1'}),
  h('button',{class:'x',title:'เปิด/ปิดชั้นนี้',onclick:()=>{L.off=!L.off;ch();fxPanelRefresh()}},L.off?'เปิด':'ปิด'),
  h('button',{class:'x',title:'เลื่อนขึ้น',onclick:()=>{if(i>0){p.layers.splice(i-1,0,p.layers.splice(i,1)[0]);ch();fxPanelRefresh()}}},'↑'),
  h('button',{class:'x',title:'ลบชั้น',onclick:()=>{p.layers.splice(i,1);ch();fxPanelRefresh()}},'×')));
 for(const[k,v]of Object.entries(F)){if(k=='c')card.append(h('label',{class:'sl'},'สี',h('input',{type:'color',value:L.c||v,oninput:e=>{L.c=e.target.value;ch()}}),h('span')));
  else if(k=='k'&&L.t=='burst')card.append(h('label',{class:'sl'},'แบบ',h('select',{onchange:e=>{L.k=e.target.value;ch()}},v.map(o=>h('option',{value:o,selected:L.k==o},{ball:'ทรงกลม',willow:'หลิวย้อย',flower:'ดอกไม้',ring:'วงแหวน'}[o]))),h('span')));
  else card.append(slider(v[0],L[k]??v[4],v[1],v[2],v[3],x=>{L[k]=x;ch()}))}
 return card}
function bindList(){const B=D.fx.binds,box=ui.binds;box.replaceChildren();const names=Object.keys(D.fx.presets);
 const heroes=[[-1,'ทุกตัว'],...HERO.map((x,i)=>[i,x.n]).filter(([i])=>!HERO[i].x)];
 B.forEach((b,i)=>{const ch=()=>draft('fx');const card=h('div',{class:'card'+(b.off?' off':'')},
  h('div',{class:'row'},h('select',{onchange:e=>{b.hero=+e.target.value;ch()}},heroes.map(([v,n])=>h('option',{value:v,selected:+(b.hero??-1)==v},n))),
   h('select',{onchange:e=>{b.ev=e.target.value;ch()}},EV.map(([v,n])=>h('option',{value:v,selected:b.ev==v},n)))),
  h('div',{class:'row'},'เล่น ',h('select',{onchange:e=>{b.fx=e.target.value;ch()}},names.map(n=>h('option',{value:n,selected:b.fx==n},n))),' ที่ ',
   h('select',{onchange:e=>{b.at=e.target.value;ch()}},[['target','จุดเกิดเหตุ'],['hero','ตัวละคร']].map(([v,n])=>h('option',{value:v,selected:(b.at||'target')==v},n)))),
  slider('ยกสูง',b.dy??0,-3,6,.1,v=>{b.dy=v;ch()}),slider('ขนาด',b.s??1,.1,5,.05,v=>{b.s=v;ch()}),slider('เว้นช่วง (มิลลิวิ)',b.cd??60,0,2000,10,v=>{b.cd=v;ch()}),
  h('div',{class:'row'},h('button',{onclick:()=>{const f=b.at=='hero'?{x:P.x,y:P.y+1,z:P.z}:fxPoint();fxPlay(D.fx.presets[b.fx],f.x,f.y+(b.dy||0),f.z,{s:b.s})}},'ทดสอบ'),
   h('button',{onclick:()=>{b.off=!b.off;ch();bindList()}},b.off?'เปิดใช้':'ปิดชั่วคราว'),h('button',{onclick:()=>{B.splice(i,1);ch();bindList()}},'ลบ')));box.append(card)});
 box.append(h('button',{onclick:()=>{if(!names.length){status('สร้างเอฟเฟกต์ก่อน แล้วค่อยผูกกับสกิล');return}if(B.length>=64)return;B.push({hero:hero,ev:'hit:light',fx:cur||names[0],at:'target',dy:0,s:1,cd:80});draft('fx');bindList()}},'+ ผูกเอฟเฟกต์กับสกิล'))}

/* ---------- Rig Studio ---------- */
const BN=RIGB,CL=[['idle','ท่ายืน'],['walk','ท่าเดิน'],['run','ท่าวิ่ง'],['hold','แขนถืออาวุธตอนเดิน (ใช้ท่าจากท่าวิ่ง)']],AT=['light','heavy','cast','air','thrust','charge','spin','plunge','guard','ult'];
const AL={light:'ตีปกติ',heavy:'ท่าหนัก',cast:'สกิล',air:'ตีกลางอากาศ',thrust:'ตีหลังแดช',charge:'ชาร์จ',spin:'หมุน',plunge:'กระแทกจากฟ้า',guard:'การ์ด',ult:'ไม้ตาย'};
let rsel={clip:'run',bone:'LeftArm'};
function rh(i){return D.rig.heroes[i]||(D.rig.heroes[i]={})}
function rigPush(rebuild){RIGD=D.rig;rigApply();
 for(const i in GLBV){const d=GLBH[i],V=GLBV[i];if(!d)continue;for(const k of['ws','palm','grip','hl','hr','wrot','wpos'])if(!(k in V.common))delete d[k];Object.assign(d,V.common,{adj:V.opt[V.def].adj,atk:V.opt[V.def].atk,h:V.opt[V.def].h,lit:V.opt[V.def].lit,olw:V.opt[V.def].olw});
  if(d.ok){glbAdj(d.idleC,d.adj&&d.adj.idle);glbAdj(d.runC,d.adj&&d.adj.run);glbAdj(d.walkC,d.adj&&d.adj.walk);glbHold(d.walkC,d.runC,d.adj&&d.adj.hold);
   if(d.mat)d.mat.color.setScalar(d.lit||1);if(d.olu)d.olu.value=Number.isFinite(d.olw)?d.olw:.0085;for(const e of GLBL)if(e.d===d)e.m.scale.setScalar(d.h/1.7)}}
 if(rebuild){clearTimeout(rigPush.t);rigPush.t=setTimeout(rebuildHero,180)}draft('rig')}
/* ---------- pose presets ----------
   Written in body terms, per bone: [x,y,z, keep]. x = pitch (a bone pointing up leans forward, a hanging bone swings back), y = twist,
   z = roll (a hanging left limb swings out to the side at +z, a right limb at -z). keep = how much of the clip's own swing stays (1 = as is).
   Converted per hero from that hero's bind pose, so one preset fits every model. Spine, head, upper arms and upper legs swing in the parent
   bone's frame (adj e[4..6]). Elbows (ForeArm) and knees (Leg) bend around their own joint: a forearm is [0,-bend,0] (SYM mirrors it), a knee is [bend,0,0]. */
const SYM=(b,v)=>({['Left'+b]:v,['Right'+b]:[v[0],-v[1],-v[2],v[3]]}),EL=(bend,k)=>SYM('ForeArm',[0,-bend,0,k]);
const PRE={
 idle:[['ค่าเริ่มต้น',null],
  ['กางแขน (A-pose)',{...SYM('Arm',[0,0,42,.25]),...EL(0,.25),Head:[-6,0,0]}],
  ['ผ่อนคลาย',{Spine:[-3,0,0],Head:[-5,0,0],...SYM('Arm',[0,0,10,1]),...EL(12,1)}],
  ['ตั้งการ์ด',{Spine:[10,18,0],Head:[-10,-14,0],LeftArm:[-45,0,15,.4],RightArm:[-35,0,-15,.4],...EL(60,.4),LeftUpLeg:[-12,0,8],RightUpLeg:[10,0,-8]}],
  ['พร้อมลุย (ย่อตัว)',{Spine:[18,0,0],Head:[-16,0,0],...SYM('Arm',[-20,0,18,.7]),...EL(50,.7),...SYM('UpLeg',[-20,0,6]),...SYM('Leg',[30,0,0])}]],
 run:[['ค่าเริ่มต้น',null],
  ['วิ่งนินจา',{Spine:[28,0,0],Head:[-22,0,0],...SYM('Arm',[40,0,12,.15]),...EL(-15,.15)}],
  ['สปรินต์',{Spine:[18,0,0],Head:[-14,0,0],...SYM('Arm',[0,0,8,1.35]),...EL(10,1.2)}],
  ['วิ่งสบาย',{Spine:[4,0,0],Head:[-4,0,0],...SYM('Arm',[0,0,14,.6]),...EL(-10,.6)}],
  ['วิ่งฮีโร่ (อกผาย)',{Spine:[-6,0,0],Head:[-8,0,0],...SYM('Arm',[0,0,16,1.2]),...EL(0,1.2)}]]};
window.RIGTOOL={PRE,applyPreset:(...a)=>applyPreset(...a)};
function bodyToParent(i,bone,b){const src=GLBH[i]&&GLBH[i].src;let bn=null;if(!src)return null;src.traverse(o=>{if(o.isBone&&o.name==bone)bn=o});if(!bn||!bn.parent)return null;src.updateMatrixWorld(true);
 const root=src.getWorldQuaternion(new THREE.Quaternion()).invert(),Pq=root.multiply(bn.parent.getWorldQuaternion(new THREE.Quaternion())),Qb=new THREE.Quaternion().setFromEuler(new THREE.Euler(b[0]*DEG,b[1]*DEG,b[2]*DEG));
 const l=Pq.clone().invert().multiply(Qb).multiply(Pq),e=new THREE.Euler().setFromQuaternion(l,'XYZ');return[e.x/DEG,e.y/DEG,e.z/DEG].map(v=>Math.round(v*10)/10)}
function bodyToOwn(i,bone,b){const src=GLBH[i]&&GLBH[i].src;let bn=null;if(!src)return null;src.traverse(o=>{if(o.isBone&&o.name==bone)bn=o});if(!bn)return null;src.updateMatrixWorld(true);
 const Bq=src.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(bn.getWorldQuaternion(new THREE.Quaternion())),Qb=new THREE.Quaternion().setFromEuler(new THREE.Euler(b[0]*DEG,b[1]*DEG,b[2]*DEG));
 const l=Bq.clone().invert().multiply(Qb).multiply(Bq),e=new THREE.Euler().setFromQuaternion(l,'XYZ');return[e.x/DEG,e.y/DEG,e.z/DEG].map(v=>Math.round(v*10)/10)}
function weaponBones(i){const V=GLBV[i],o=V&&V.opt[V.def],h=o&&o.adj&&o.adj.hold;const s=new Set(h?Object.keys(h):[]);if(s.has('LeftArm'))s.add('LeftHand');if(s.has('RightArm'))s.add('RightHand');return s}
function applyPreset(clip,spec,all,keepWeapon){const ids=all?Object.keys(GLBV).map(Number):[hero];
 for(const i of ids){const r=rh(i);r.adj=r.adj||{};if(!spec){delete r.adj[clip];continue}const m={},wb=clip=='run'&&keepWeapon?weaponBones(i):new Set();
  for(const b in spec){if(wb.has(b))continue;const v=spec[b],k=v[3]===undefined?1:v[3];
   // elbows, knees and hands bend around their own joint (post rotation in the bone's rest frame), so the bend reads the same whatever the arm is doing
   if(/ForeArm|Leg$|Hand/.test(b)&&!/UpLeg/.test(b)){const p=bodyToOwn(i,b,v);if(p)m[b]=[...p,k];continue}
   const p=bodyToParent(i,b,v);if(!p)continue;m[b]=[0,0,0,k,...p]}r.adj[clip]=m}
 rigPush(true);TOOL.anim=clip;status('ใช้พรีเซ็ตแล้ว'+(all?' กับทุกตัว':'')+' · ปรับต่อทีละกระดูกได้ด้านล่าง')}
function presetBox(){const all=h('input',{type:'checkbox'}),kw=h('input',{type:'checkbox',checked:true});
 const row=clip=>h('div',{class:'row'},...PRE[clip].map(([n,s])=>h('button',{onclick:()=>{applyPreset(clip,s,all.checked,kw.checked);open('rig')}},n)));
 return h('div',null,h('h3',null,'พรีเซ็ตท่า'),h('div',{class:'muted'},'ท่ายืน'),row('idle'),h('div',{class:'muted'},'ท่าวิ่ง'),row('run'),
  h('div',{class:'row'},h('label',null,all,' ใช้กับทุกตัว')),h('div',{class:'row'},h('label',null,kw,' ไม่เปลี่ยนแขนที่ถืออาวุธตอนวิ่ง')),
  h('div',{class:'muted'},'พรีเซ็ตแทนค่าท่านั้นทั้งหมด "ค่าเริ่มต้น" คืนเป็นท่าที่จูนไว้ในเกม'))}
function rebuildHero(){if(!P||!P.g||mode!='play')return;const o=P.g,g=heroModel(hero);g.position.copy(o.position);g.rotation.copy(o.rotation);g.scale.copy(o.scale);sc.remove(o);sc.add(g);P.g=g}
function curVal(){const d=GLBH[hero];if(!d)return[0,0,0,1];if(rsel.clip.startsWith('atk:')){const a=rsel.clip.slice(4),v=d.atk&&d.atk[a]&&d.atk[a][rsel.bone];return v?[...v,1]:[0,0,0,1]}
 const v=d.adj&&d.adj[rsel.clip]&&d.adj[rsel.clip][rsel.bone];return v?[v[0]||0,v[1]||0,v[2]||0,v[3]===undefined?1:v[3],...v.slice(4)]:[0,0,0,1]}
function setVal(v){const r=rh(hero);if(rsel.clip.startsWith('atk:')){const a=rsel.clip.slice(4);r.atk=r.atk||{};const d=GLBH[hero];r.atk[a]=Object.assign({},d&&d.atk&&d.atk[a],r.atk[a]);r.atk[a][rsel.bone]=v.slice(0,3)}
 else{r.adj=r.adj||{};r.adj[rsel.clip]=r.adj[rsel.clip]||{};r.adj[rsel.clip][rsel.bone]=v}rigPush(false)}
function rigPanel(){panel.append(head('Rig Studio · จัดท่าตัวละคร'));const gl=Object.keys(GLBV).map(Number);
 if(!GLBV[hero])status('');
 const hs=h('select',{onchange:e=>{hero=+e.target.value;start();setTimeout(()=>open('rig'),300)}},gl.map(i=>h('option',{value:i,selected:i==hero},HERO[i].n+' ('+HERO[i].en+')')));
 panel.append(h('h3',null,'ตัวละคร (เฉพาะที่มีโมเดล 3D)'),h('div',{class:'row'},hs));
 if(!GLBV[hero]){panel.append(h('p',{class:'muted'},'ตัวนี้ยังไม่มีโมเดล 3D เลือกตัวในรายการด้านบน'),camBox(),saveRow('rig'));return}
 const d=GLBH[hero],r=rh(hero);
 panel.append(h('h3',null,'ดูท่า'),h('div',{class:'row'},...[['bind','กางแขน (T-pose)'],['idle','ยืน'],['walk','เดิน'],['run','วิ่ง'],[null,'ตามเกม']].map(([k,n])=>h('button',{class:TOOL.anim==k?'on':'',onclick:e=>{TOOL.anim=k;e.target.parentNode.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b==e.target))}},n))),
  h('div',{class:'row'},h('button',{onclick:()=>press('light')},'ตี'),h('button',{onclick:()=>press('heavy')},'ท่าหนัก'),h('button',{onclick:()=>press('e')},'สกิล E'),h('button',{onclick:()=>{press('jump');setTimeout(()=>press('light'),260)}},'ตีกลางอากาศ'),h('button',{onclick:()=>{press('dash');setTimeout(()=>press('light'),120)}},'แดช+ตี')),
  h('div',{class:'muted'},'ชะลอเวลาได้ที่ "ความเร็วเวลา" ในหัวข้อกล้อง'),presetBox());
 // pose editor
 const cs=h('select',{onchange:e=>{rsel.clip=e.target.value;poseBox()}},CL.map(([v,n])=>h('option',{value:v,selected:rsel.clip==v},n)),h('optgroup',{label:'ท่าโจมตี (เติมเพิ่มระหว่างท่า)'},AT.map(a=>h('option',{value:'atk:'+a,selected:rsel.clip=='atk:'+a},AL[a]))));
 const bs=h('select',{onchange:e=>{rsel.bone=e.target.value;poseBox()}},BN.map(b=>h('option',{value:b,selected:rsel.bone==b},b)));
 ui.pose=h('div');panel.append(h('h3',null,'ท่าทาง (หมุนกระดูก องศา)'),h('div',{class:'row'},cs,bs),ui.pose);poseBox();
 // body
 panel.append(h('h3',null,'ตัว'),slider('ความสูง',d.h,1.2,4,.01,v=>{r.h=v;rigPush(false)}),slider('ความสว่าง',d.lit||1,.6,1.8,.01,v=>{r.lit=v;rigPush(false)}),slider('เส้นขอบ',+((Number.isFinite(d.olw)?d.olw:.0085)*1000).toFixed(1),0,30,.5,v=>{r.olw=v/1000;rigPush(false)}));
 // weapon
 const W=h('div');panel.append(h('h3',null,'อาวุธในมือ'),W);
 if(d.gun)W.append(h('p',{class:'muted'},'ตัวนี้ใช้อาวุธลอย (ปืน/บั้งไฟ) ไม่ได้ถือด้วยกระดูกมือ ปรับได้แค่ขนาด'));
 const v3=(key,label,def,min,max,step)=>{const cur=(d[key]||def).slice();return ['x','y','z'].map((ax,j)=>slider(label+' '+ax,cur[j],min,max,step,v=>{const a=(r[key]||d[key]||def).slice();a[j]=v;r[key]=a;rigPush(true)}))};
 W.append(slider('ขนาดอาวุธ',d.ws||1,.2,3,.01,v=>{r.ws=v;rigPush(true)}));
 if(!d.gun){W.append(slider('เลื่อนเข้าฝ่ามือ',d.palm||0,0,.3,.005,v=>{r.palm=v;rigPush(true)}),...v3('grip','จุดจับ',[0,0,0],-1.5,1.5,.01),...v3('wrot','หมุนอาวุธ',[0,0,0],-180,180,1),...v3('wpos','เลื่อนอาวุธ',[0,0,0],-.5,.5,.005),
  ...v3('hl','งอแขนซ้าย',[0,0,0],-3,3,.01),...v3('hr','งอแขนขวา',[0,0,0],-3,3,.01))}
 panel.append(h('div',{class:'row'},h('button',{onclick:()=>{if(!confirm('ล้างค่าที่ปรับไว้ทั้งหมดของ '+HERO[hero].n+'? (กลับไปใช้ค่าในเกม)'))return;delete D.rig.heroes[hero];draft('rig');location.reload()}},'ล้างค่าตัวนี้')),camBox(),saveRow('rig'))}
function poseBox(){const v=curVal(),atk=rsel.clip.startsWith('atk:'),box=ui.pose;box.replaceChildren();const nv=v.slice();
 ['x','y','z'].forEach((ax,j)=>box.append(slider('หมุน '+ax,nv[j],-180,180,1,x=>{nv[j]=x;setVal(atk?nv.slice(0,3):nv)})));
 if(!atk)box.append(slider('คงการแกว่ง',nv[3],0,2,.01,x=>{nv[3]=x;setVal(nv)}),h('div',{class:'muted'},'คงการแกว่ง 1 = แกว่งตามท่าเดิม, 0 = นิ่งที่ท่าเฉลี่ย, มากกว่า 1 = แกว่งแรงขึ้น'));
 else box.append(h('div',{class:'muted'},'ค่านี้เติมเพิ่มระหว่างท่า มากสุดกลางท่า กดปุ่มท่าด้านบนเพื่อดู'));
 const d=GLBH[hero],used=atk?(d.atk&&d.atk[rsel.clip.slice(4)])||{}:(d.adj&&d.adj[rsel.clip])||{};const names=Object.keys(used).filter(b=>used[b]);
 box.append(h('div',{class:'row'},h('button',{onclick:()=>{const r=rh(hero);if(atk){r.atk=r.atk||{};const a=rsel.clip.slice(4);r.atk[a]=Object.assign({},used);delete r.atk[a][rsel.bone]}else{r.adj=r.adj||{};r.adj[rsel.clip]=r.adj[rsel.clip]||{};r.adj[rsel.clip][rsel.bone]=null}rigPush(false);poseBox()}},'คืนค่ากระดูกนี้')),
  h('div',{class:'muted'},'กระดูกที่ปรับไว้ในท่านี้: ',names.length?names.join(', '):'ยังไม่มี'))}

/* ---------- entry buttons ---------- */
document.body.append(h('div',{id:'dvbar'},h('button',{onclick:()=>enter('fx')},'FX Studio'),h('button',{onclick:()=>enter('rig')},'Rig Studio')));
addEventListener('keydown',e=>{if(e.key=='Escape'&&panel)leave()},true);
})();
