/* BuildSim 0.2.0 — project manager, fluid controls and electronic devices. */
(function(){
'use strict';
const $=id=>document.getElementById(id),clone=v=>JSON.parse(JSON.stringify(v));
const KEY='buildsim-projects-v2';let projects=[],activeProjectId=null,ready=false,saveTimer=null;
catalog.electronics.push(['💡','Светодиод','led'],['🔔','Зуммер','buzzer'],['▣','Цифровой дисплей','digitalDisplay'],['🔢','Счётчик импульсов','counter'],['🔁','Реле','relay'],['🌡️','Термодатчик','temperatureSensor'],['🧭','Датчик давления','pressureSensor'],['⚖️','Компаратор','comparator'],['🎛️','Панель управления','controlPanel']);
catalog.pipes.push(['🌡️','Термометр','thermometer'],['🧯','Манометр','pressureGauge'],['🧪','Смеситель','mixer']);
const style=document.createElement('style');
style.textContent='#projectsOpen{padding:9px 11px;border-radius:11px;background:#24395e;border:1px solid #46699e;font-size:12px;font-weight:850}#projectModal{position:fixed;inset:0;z-index:20000;background:#050a15d9;display:none;align-items:center;justify-content:center;padding:14px}#projectModal.show{display:flex}#projectCard{width:min(680px,100%);max-height:92dvh;overflow:auto;background:#121d33;border:1px solid #39547e;border-radius:18px;padding:16px;box-shadow:0 20px 70px #000b}#projectCard h2{font-size:19px;margin:0 0 5px}#projectCard p{font-size:12px;color:#9fb1d0;margin:0 0 13px}.pv-actions{display:flex;gap:7px;flex-wrap:wrap;margin:10px 0}.pv-btn{background:#223657;border:1px solid #3b5783;border-radius:9px;padding:9px 11px;font-size:12px;font-weight:800}.pv-btn.primary{background:#1766d1;border-color:#398dff}.pv-list{display:grid;gap:7px;margin:10px 0}.pv-row{display:flex;align-items:center;gap:8px;background:#1a2944;border:1px solid #2f456a;border-radius:10px;padding:9px}.pv-row.active{border-color:#42b9ff;background:#19365a}.pv-name{flex:1;min-width:0;font-size:13px;font-weight:800}.pv-meta{font-size:10px;color:#9fb1d0}.pv-row button{background:#30496f;border-radius:7px;padding:7px 9px;font-size:11px}#projectTransfer{width:100%;min-height:84px;resize:vertical;background:#0b1426;color:#eaf2ff;border:1px solid #344b70;border-radius:9px;padding:9px;font:11px monospace}#fluidControls,#deviceControls{display:none;gap:7px;align-items:center;flex-wrap:wrap;width:100%;border-top:1px solid #344b70;padding-top:7px}#fluidControls.show,#deviceControls.show{display:flex}#fluidControls label,#deviceControls label{display:flex;align-items:center;gap:5px}#fluidControls input,#deviceControls input{width:62px;background:#243657;color:white;border:1px solid #526b91;border-radius:7px;padding:6px}.part-info{font-size:9px!important;color:#91dfff!important}.part[data-kind=led].running .part-art,.part[data-kind=buzzer].running .part-art{filter:drop-shadow(0 0 9px #55eaff)}@media(max-width:650px){#projectsOpen{padding:8px;font-size:10px}#projectCard{padding:12px}.pv-row{flex-wrap:wrap}.pv-name{min-width:45%}}';
document.head.appendChild(style);
const projectButton=document.createElement('button');projectButton.id='projectsOpen';projectButton.textContent='▦ Проекты';$('save').before(projectButton);
const modal=document.createElement('div');modal.id='projectModal';
modal.innerHTML='<section id="projectCard"><h2>Мои проекты</h2><p>Проекты хранятся отдельно на устройстве. Для переноса используй JSON экспорт и импорт.</p><div class="pv-actions"><button class="pv-btn primary" id="projectNew">＋ Новый проект</button><button class="pv-btn" id="projectRename">Переименовать</button><button class="pv-btn" id="projectDelete">Удалить</button><button class="pv-btn" id="projectExport">Экспорт JSON</button></div><div class="pv-list" id="projectList"></div><label style="font-size:12px;font-weight:800">Импорт / экспорт проекта</label><textarea id="projectTransfer" placeholder="Экспортируй проект или вставь сюда JSON для импорта."></textarea><div class="pv-actions"><button class="pv-btn primary" id="projectImport">Импортировать JSON</button><button class="pv-btn" id="projectCopy">Копировать текст</button><button class="pv-btn" id="projectClose">Закрыть</button></div></section>';
document.body.appendChild(modal);
const fluid=document.createElement('div');fluid.id='fluidControls';
fluid.innerHTML='<label id="pumpFlowField">Подача, %/с <input id="pumpFlow" type="number" min=".1" max="20" step=".1"></label><label id="pumpPressureField">Давление, бар <input id="pumpPressure" type="number" min=".1" max="8" step=".1"></label><label id="pipeDiameterField">Диаметр трубы, мм <input id="pipeDiameter" type="number" min="4" max="100"></label><label id="valveOpeningField">Открытие клапана, % <input id="valveOpening" type="number" min="0" max="100" step="5"></label><label id="heaterTempField">Температура, °C <input id="heaterTemp" type="number" min="0" max="120"></label>';
$('props').appendChild(fluid);
const device=document.createElement('div');device.id='deviceControls';
device.innerHTML='<label id="deviceThresholdField">Порог <input id="deviceThreshold" type="number" step="1"></label><label id="deviceTextField">Текст <input id="deviceText" type="text" maxlength="16" style="width:110px"></label><button id="deviceToggle" style="background:#243657;border-radius:8px;padding:7px">Вкл./выкл.</button>';
$('props').appendChild(device);
function stopSimulation(){if(sim){sim=false;if(simLoop){clearInterval(simLoop);simLoop=null}parts.forEach(p=>{p.active=false;if(p.type==='lamp')p.lit=false});$('simulate').textContent='▶ Симуляция'}}
function newId(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function persist(){if(!ready)return;const p=projects.find(x=>x.id===activeProjectId);if(p){p.parts=clone(parts);p.updatedAt=Date.now()}try{localStorage.setItem(KEY,JSON.stringify({version:2,activeProjectId,projects}))}catch(e){toast('Не удалось сохранить: память устройства заполнена')}}
function queueSave(){if(!ready)return;clearTimeout(saveTimer);saveTimer=setTimeout(persist,500)}
function migrate(){
 try{const raw=localStorage.getItem(KEY);if(raw){const d=JSON.parse(raw);if(Array.isArray(d.projects))projects=d.projects;activeProjectId=d.activeProjectId}}catch(e){projects=[]}
 if(!projects.length){let old=[];try{const x=JSON.parse(localStorage.getItem('buildsim-project')||'[]');if(Array.isArray(x))old=x}catch(e){}projects=[{id:newId(),name:'Мой первый проект',parts:old,createdAt:Date.now(),updatedAt:Date.now()}]}
 if(!projects.some(p=>p.id===activeProjectId))activeProjectId=projects[0].id;
 const p=projects.find(x=>x.id===activeProjectId);if(p&&Array.isArray(p.parts))parts=clone(p.parts);
 ready=true;persist();
}
function renderProjects(){
 const list=$('projectList');list.innerHTML='';
 projects.forEach(p=>{const row=document.createElement('div');row.className='pv-row'+(p.id===activeProjectId?' active':'');const name=document.createElement('div');name.className='pv-name';name.textContent=p.name;const meta=document.createElement('div');meta.className='pv-meta';meta.textContent=(p.parts||[]).length+' деталей';const open=document.createElement('button');open.textContent=p.id===activeProjectId?'Открыт':'Открыть';open.onclick=()=>{if(p.id===activeProjectId)return;persist();stopSimulation();activeProjectId=p.id;parts=clone(p.parts||[]);selected=null;connectWire=null;drawWorld();persist();renderProjects();toast('Открыт проект: '+p.name)};row.append(name,meta,open);list.appendChild(row)});
}
function openModal(){persist();renderProjects();modal.classList.add('show')}
function closeModal(){modal.classList.remove('show');persist()}
projectButton.onclick=openModal;$('projectClose').onclick=closeModal;
modal.addEventListener('pointerdown',e=>{if(e.target===modal)closeModal()});
$('projectNew').onclick=()=>{const name=prompt('Название нового проекта:','Новый проект');if(name===null)return;persist();stopSimulation();const p={id:newId(),name:name.trim().slice(0,40)||'Новый проект',parts:[],createdAt:Date.now(),updatedAt:Date.now()};projects.push(p);activeProjectId=p.id;parts=[];selected=null;connectWire=null;drawWorld();persist();renderProjects();toast('Создан новый проект')};
$('projectRename').onclick=()=>{const p=projects.find(x=>x.id===activeProjectId);if(!p)return;const n=prompt('Новое название проекта:',p.name);if(n===null)return;p.name=n.trim().slice(0,40)||p.name;persist();renderProjects();toast('Название обновлено')};
$('projectDelete').onclick=()=>{if(projects.length<2){toast('Нельзя удалить последний проект');return}const p=projects.find(x=>x.id===activeProjectId);if(!p||!confirm('Удалить проект «'+p.name+'»?'))return;projects=projects.filter(x=>x.id!==p.id);activeProjectId=projects[0].id;parts=clone(projects[0].parts||[]);selected=null;stopSimulation();drawWorld();persist();renderProjects();toast('Проект удалён')};
$('projectExport').onclick=()=>{persist();const p=projects.find(x=>x.id===activeProjectId);if(p)$('projectTransfer').value=JSON.stringify({format:'BuildSimProject',version:2,project:p},null,2)};
$('projectImport').onclick=()=>{try{const d=JSON.parse($('projectTransfer').value),p=d.project||d;if(!p||!Array.isArray(p.parts))throw Error('В JSON не найден список деталей parts');const n={id:newId(),name:String(p.name||'Импортированный проект').slice(0,40),parts:p.parts,createdAt:Date.now(),updatedAt:Date.now()};projects.push(n);activeProjectId=n.id;stopSimulation();parts=clone(n.parts);selected=null;drawWorld();persist();renderProjects();toast('Проект импортирован')}catch(e){toast('Ошибка импорта: '+e.message)}};
$('projectCopy').onclick=()=>{const t=$('projectTransfer');t.focus();t.select();try{if(navigator.clipboard?.writeText)navigator.clipboard.writeText(t.value).then(()=>toast('JSON скопирован')).catch(()=>toast('Выдели текст и скопируй вручную'));else toast('Выдели текст и скопируй вручную')}catch(e){toast('Выдели текст и скопируй вручную')}};
const oldUpdateProps=updateProps;
updateProps=function(){oldUpdateProps();const p=parts.find(x=>x.id===selected);fluid.classList.toggle('show',!!p&&['pump','pipe','valve','heater'].includes(p.type));['pumpFlowField','pumpPressureField','pipeDiameterField','valveOpeningField','heaterTempField'].forEach(id=>$(id).style.display='none');if(p){if(p.type==='pump'){$('pumpFlowField').style.display='flex';$('pumpPressureField').style.display='flex';$('pumpFlow').value=p.flowRate??5;$('pumpPressure').value=p.pressureBar??2}if(p.type==='pipe'){$('pipeDiameterField').style.display='flex';$('pipeDiameter').value=p.diameterMm??20}if(p.type==='valve'){$('valveOpeningField').style.display='flex';$('valveOpening').value=p.openPercent??100}if(p.type==='heater'){$('heaterTempField').style.display='flex';$('heaterTemp').value=p.targetTempC??80}}const kinds=['led','buzzer','digitalDisplay','counter','relay','temperatureSensor','pressureSensor','comparator','controlPanel','thermometer','pressureGauge','mixer'];device.classList.toggle('show',!!p&&kinds.includes(p.type));$('deviceThresholdField').style.display=p&&['temperatureSensor','pressureSensor','comparator'].includes(p.type)?'flex':'none';$('deviceTextField').style.display=p&&p.type==='digitalDisplay'?'flex':'none';$('deviceToggle').style.display=p&&['controlPanel','relay'].includes(p.type)?'inline-block':'none';if(p){$('deviceThreshold').value=p.threshold??50;$('deviceText').value=p.displayText||'BUILD SIM';$('deviceToggle').textContent=p.type==='relay'?(p.on?'Разомкнуть реле':'Замкнуть реле'):(p.on?'Выключить панель':'Включить панель')}};
function edit(fn){const p=parts.find(x=>x.id===selected);if(!p)return;fn(p);drawWorld();queueSave()}
$('pumpFlow').onchange=e=>edit(p=>p.flowRate=Math.max(.1,Math.min(20,Number(e.target.value)||5)));
$('pumpPressure').onchange=e=>edit(p=>p.pressureBar=Math.max(.1,Math.min(8,Number(e.target.value)||2)));
$('pipeDiameter').onchange=e=>edit(p=>p.diameterMm=Math.max(4,Math.min(100,Number(e.target.value)||20)));
$('valveOpening').onchange=e=>edit(p=>p.openPercent=Math.max(0,Math.min(100,Number(e.target.value)||0)));
$('heaterTemp').onchange=e=>edit(p=>p.targetTempC=Math.max(0,Math.min(120,Number(e.target.value)||20)));
$('deviceThreshold').onchange=e=>edit(p=>p.threshold=Number(e.target.value)||0);
$('deviceText').onchange=e=>edit(p=>p.displayText=(e.target.value||'BUILD SIM').slice(0,16));
$('deviceToggle').onclick=()=>edit(p=>p.on=!p.on);
const oldAddPart=addPart;
addPart=function(x,y){oldAddPart(x,y);const p=parts.find(q=>q.id===selected);if(!p)return;if(p.type==='pump'){p.flowRate=5;p.pressureBar=2}if(p.type==='pipe')p.diameterMm=20;if(p.type==='valve')p.openPercent=100;if(p.type==='heater')p.targetTempC=80;if(p.type==='temperatureSensor')p.threshold=50;if(p.type==='pressureSensor')p.threshold=1;if(p.type==='comparator')p.threshold=50;if(p.type==='digitalDisplay')p.displayText='BUILD SIM';if(p.type==='counter')p.count=0;if(p.type==='controlPanel'||p.type==='relay')p.on=false;queueSave()};
const oldDrawWorld=drawWorld;
drawWorld=function(){parts.forEach(p=>{if(p.type==='digitalDisplay')p.text=p.displayText||'BUILD SIM';if(p.type==='counter')p.text=String(p.count||0)});oldDrawWorld();if(ready){parts.forEach(p=>{const el=world.querySelector('[data-id="'+p.id+'"]');if(!el)return;let info='';if(p.type==='pump')info=' '+Number(p.calculatedPressureBar??p.pressureBar??2).toFixed(1)+' бар · '+Number(p.calculatedFlow??p.flowRate??5).toFixed(1)+'%/с';if(p.type==='pipe')info=' Ø'+(p.diameterMm??20)+' мм';if(p.type==='valve')info=' '+(p.openPercent??100)+'% открыт';if(p.type==='heater')info=' '+(p.targetTempC??80)+'°C';if(['cup','coffee','tank'].includes(p.type)&&p.temperatureC!=null)info=' '+Math.round(p.temperatureC)+'°C';if(['cup','coffee'].includes(p.type)&&p.pressureBar!=null)info+=' · '+Number(p.pressureBar).toFixed(1)+' бар';if(p.type==='digitalDisplay')info=' '+(p.displayText||'');if(p.type==='counter')info=' '+(p.count||0);if(['temperatureSensor','thermometer'].includes(p.type))info=' '+Math.round(p.readingC??20)+'°C';if(['pressureSensor','pressureGauge'].includes(p.type))info=' '+Number(p.readingBar??0).toFixed(2)+' бар';if(p.type==='comparator')info=' '+(p.outputState?'ВЫСОКИЙ':'НИЗКИЙ');if(info){const small=document.createElement('small');small.className='part-info';small.textContent=info;el.appendChild(small)}});queueSave()}};
const oldVisualSVG=visualSVG;
visualSVG=function(type,lit,label){const sh={
led:'<circle cx="50" cy="38" r="27" fill="'+(lit?'#b8faff':'#52677c')+'" stroke="'+(lit?'#e8ffff':'#a9bbcd')+'" stroke-width="5"/><path d="M39 63v8m22-8v8" stroke="#c5d5e5" stroke-width="4"/>',
buzzer:'<path d="M22 30h18l25-17v50L40 46H22Z" fill="'+(lit?'#69dcff':'#53677f')+'" stroke="#d5e5f4" stroke-width="3"/><path d="M73 27q16 11 0 22m6-31q27 20 0 40" fill="none" stroke="#aeeeff" stroke-width="4"/>',
digitalDisplay:'<rect x="8" y="12" width="84" height="54" rx="8" fill="#0a1725" stroke="#6f9ec5" stroke-width="4"/><rect x="15" y="19" width="70" height="40" rx="4" fill="#102b3b"/><text x="50" y="44" text-anchor="middle" font-size="12" fill="#7df0ff" font-weight="800">'+String(label||'BUILD SIM').replace(/[&<>"]/g,'')+'</text>',
counter:'<rect x="10" y="10" width="80" height="58" rx="8" fill="#253c56" stroke="#9fb6ce" stroke-width="3"/><rect x="20" y="20" width="60" height="25" rx="4" fill="#081523"/><text x="50" y="39" text-anchor="middle" font-size="18" fill="#8af0ff">'+String(label||'0').replace(/[&<>"]/g,'')+'</text>',
relay:'<rect x="13" y="16" width="74" height="48" rx="8" fill="#263c56" stroke="#b6c8db" stroke-width="3"/><path d="M23 40h18l12-13 13 13h12" fill="none" stroke="'+(lit?'#5be3ff':'#d3dfeb')+'" stroke-width="4"/>',
temperatureSensor:'<rect x="24" y="12" width="52" height="54" rx="12" fill="#34475d" stroke="#b9cada" stroke-width="3"/><path d="M45 25v25a10 10 0 1 0 10 0V25a5 5 0 0 0-10 0Z" fill="#e8f4ff" stroke="#6adfff" stroke-width="3"/>',
pressureSensor:'<circle cx="50" cy="39" r="30" fill="#34485f" stroke="#b6c8da" stroke-width="4"/><path d="M50 39 68 23" stroke="#63e1ff" stroke-width="4"/><circle cx="50" cy="39" r="5" fill="#e8f5ff"/>',
comparator:'<path d="M20 12v52l55-26Z" fill="#294762" stroke="'+(lit?'#66eaff':'#aec5d9')+'" stroke-width="4"/><path d="M4 27h16m-16 22h16m55-11h21" stroke="#cce8f8" stroke-width="4"/>',
controlPanel:'<rect x="9" y="10" width="82" height="58" rx="8" fill="#273c57" stroke="#b6c9dc" stroke-width="3"/><circle cx="30" cy="30" r="8" fill="'+(lit?'#53e2a0':'#d24e60')+'"/><circle cx="50" cy="30" r="8" fill="#e7bd55"/><circle cx="70" cy="30" r="8" fill="#54c8ff"/>',
thermometer:'<rect x="42" y="8" width="16" height="49" rx="8" fill="#dce9f5" stroke="#6b829b" stroke-width="3"/><circle cx="50" cy="60" r="14" fill="#ff7564" stroke="#dce9f5" stroke-width="3"/>',
pressureGauge:'<circle cx="50" cy="39" r="31" fill="#e7f0f8" stroke="#7b93aa" stroke-width="5"/><path d="M50 39 70 24" stroke="#e65d61" stroke-width="4"/>',
mixer:'<rect x="18" y="17" width="64" height="48" rx="9" fill="#31556c" stroke="#a8d6e9" stroke-width="3"/><path d="M28 34q22 23 44 0M28 48q22-23 44 0" fill="none" stroke="#64d7ee" stroke-width="4"/>'
};return sh[type]?'<svg viewBox="0 0 100 76" xmlns="http://www.w3.org/2000/svg">'+sh[type]+'</svg>':oldVisualSVG(type,lit,label)};
const originalRunCircuit=runCircuit;
runCircuit=function(){
 originalRunCircuit();
 const wires=parts.filter(p=>p.type==='wire'&&(p.connections||[]).length===2);
 function group(seed,kind){const edges=parts.filter(p=>p.type===kind&&(p.connections||[]).length===2),seen=new Set([seed.id]),q=[seed];while(q.length){const c=q.shift();for(const e of edges){const ids=e.connections||[];if(ids.includes(c.id))for(const id of ids){const n=parts.find(p=>p.id===id);if(n&&!seen.has(n.id)){seen.add(n.id);q.push(n)}}}}return parts.filter(p=>seen.has(p.id))}
 for(const pump of parts.filter(p=>p.type==='pump')){const g=group(pump,'pipe'),ps=g.filter(p=>p.type==='pipe'),vs=g.filter(p=>p.type==='valve');const loss=ps.reduce((n,p)=>n+Math.pow(20/Math.max(4,p.diameterMm||20),4)*.025,0),v=vs.reduce((n,p)=>n*Math.max(.02,Math.min(1,(p.openPercent??100)/100)),1);pump.calculatedPressureBar=Math.max(0,(pump.pressureBar??2)-loss);pump.calculatedFlow=(pump.flowRate??5)*(pump.calculatedPressureBar/Math.max(.1,pump.pressureBar??2))*v}
 for(const s of parts.filter(p=>['temperatureSensor','pressureSensor','thermometer','pressureGauge'].includes(p.type))){const g=group(s,'pipe'),r=g.find(p=>['cup','coffee','tank'].includes(p.type)),pump=g.find(p=>p.type==='pump');s.readingC=r?.temperatureC??20;s.readingBar=r?.pressureBar??pump?.calculatedPressureBar??0;if(s.type==='temperatureSensor')s.active=s.readingC>=(s.threshold??50);if(s.type==='pressureSensor')s.active=s.readingBar>=(s.threshold??1)}
 for(const c of parts.filter(p=>p.type==='comparator')){const g=group(c,'wire'),s=g.find(p=>['temperatureSensor','pressureSensor','fluidSensor'].includes(p.type)),v=s?(s.type==='temperatureSensor'?s.readingC??20:s.type==='pressureSensor'?s.readingBar??0:s.active?100:0):0;c.outputState=v>=(c.threshold??50);c.active=c.outputState}
 for(const c of parts.filter(p=>p.type==='counter')){const g=group(c,'wire'),b=g.find(p=>p.type==='button'),pressed=!!b?.pressed;if(pressed&&!c._wasPressed)c.count=(c.count||0)+1;c._wasPressed=pressed}
 for(const d of parts.filter(p=>p.type==='digitalDisplay')){const g=group(d,'wire'),c=g.find(p=>p.type==='counter'),s=g.find(p=>['temperatureSensor','pressureSensor'].includes(p.type));d.displayText=c?String(c.count||0):s?(s.type==='temperatureSensor'?Math.round(s.readingC||20)+' C':(s.readingBar||0).toFixed(2)+' bar'):(d.displayText||'BUILD SIM')}
 for(const p of parts.filter(p=>p.type==='led'))p.lit=!!p.active;
 const msg=[];if(parts.some(p=>p.type==='buzzer'&&p.active))msg.push('зуммер подаёт сигнал');if(parts.some(p=>p.type==='comparator'&&p.outputState))msg.push('компаратор: условие выполнено');if(msg.length)status.innerHTML+='<br><span style="color:#80dfff">'+msg.join(' · ')+'</span>';
 drawWorld();
};
const oldToggle=$('toggleSwitch').onclick;
$('toggleSwitch').onclick=function(){const p=parts.find(x=>x.id===selected);if(p&&['controlPanel','relay'].includes(p.type)){p.on=!p.on;drawWorld();toast(p.type==='relay'?(p.on?'Реле замкнуто':'Реле разомкнуто'):(p.on?'Панель включена':'Панель выключена'));queueSave();return}oldToggle()};
const oldConnect=$('connect').onclick;
$('connect').onclick=function(){const p=parts.find(x=>x.id===selected);if(p&&['led','buzzer','digitalDisplay','counter','relay','temperatureSensor','pressureSensor','comparator','controlPanel'].includes(p.type)){connectWire=p.id;toast('Теперь выбери компонент для соединения');return}oldConnect()};
$('save').onclick=()=>{persist();localStorage.setItem('buildsim-project',JSON.stringify(parts));toast('Проект сохранён')};
const oldReset=$('reset').onclick;$('reset').onclick=()=>{oldReset();queueSave()};
migrate();renderItems();drawWorld();
const tag=document.querySelector('.tag');if(tag)tag.textContent='СТРОЙ • ПРОВЕРЯЙ • СОЗДАВАЙ · 0.2.0';
window.addEventListener('beforeunload',persist);

/* BuildSim 0.2.0 — real two-input liquid mixer and new liquid ingredients. */
device.insertAdjacentHTML('beforeend','<label id="mixerRatioField" style="display:none;align-items:center;gap:5px">Доля первого входа, % <input id="mixerRatio" type="number" min="0" max="100" step="5" value="50"></label>');
const previousUpdateProps=updateProps;
updateProps=function(){
 previousUpdateProps();
 const p=parts.find(x=>x.id===selected);
 $('mixerRatioField').style.display=p&&p.type==='mixer'?'flex':'none';
 if(p&&p.type==='mixer')$('mixerRatio').value=p.ratioA??50;
};
$('mixerRatio').onchange=e=>{
 const p=parts.find(x=>x.id===selected);
 if(!p||p.type!=='mixer')return;
 p.ratioA=Math.max(0,Math.min(100,Number(e.target.value)||0));
 e.target.value=p.ratioA;
 queueSave();
 toast('Пропорция установлена: '+p.ratioA+' / '+(100-p.ratioA));
};
const previousAddPart=addPart;
addPart=function(x,y){
 previousAddPart(x,y);
 const p=parts.find(q=>q.id===selected);
 if(p&&p.type==='mixer'){p.ratioA=50;p._mixFlowAt=0;p._mixLastTick=0;queueSave()}
};
const previousPartDown=partDown;
partDown=function(e,p){
 if(fillMode&&p.type==='tank'&&['syrup','milk','juiceBase'].includes(fillMode)){
  p.ingredients=p.ingredients||[];p.levels=p.levels||{};
  if(!p.ingredients.includes(fillMode))p.ingredients.push(fillMode);
  p.levels[fillMode]=100;
  const label={syrup:'сироп',milk:'молоко',juiceBase:'концентрат сока'}[fillMode];
  fillMode=null;toast(label+' добавлен в резервуар');drawWorld();queueSave();return;
 }
 previousPartDown(e,p);
};
function mixerPath(from,to,pipes){
 const queue=[from.id],prev=new Map([[from.id,null]]),via=new Map();
 while(queue.length){
  const id=queue.shift();if(id===to.id)break;
  for(const edge of pipes){
   const ids=edge.connections||[];
   if(ids.length!==2||!ids.includes(id))continue;
   const next=ids[0]===id?ids[1]:ids[0];
   if(prev.has(next))continue;
   prev.set(next,id);via.set(next,edge);queue.push(next);
  }
 }
 if(!prev.has(to.id))return null;
 const edges=[];let at=to.id;
 while(at!==from.id){edges.unshift(via.get(at));at=prev.get(at)}
 return {edges};
}
const previousRunCircuit=runCircuit;
runCircuit=function(){
 previousRunCircuit();
 const pipes=parts.filter(p=>p.type==='pipe'&&(p.connections||[]).length===2);
 const mixers=parts.filter(p=>p.type==='mixer');
 const labels={water:'вода',syrup:'сироп',milk:'молоко',juiceBase:'концентрат сока'};
 const products={
  'syrup|water':{id:'lemonade',name:'лимонад'},
  'milk|water':{id:'milkDrink',name:'молочный напиток'},
  'milk|syrup':{id:'milkshake',name:'молочный коктейль'},
  'juiceBase|water':{id:'juice',name:'сок'}
 };
 const now=Date.now(),notes=[];
 for(const mixer of mixers){
  const inputTanks=parts.filter(t=>t.type==='tank'&&(t.ingredients||[]).some(k=>labels[k]));
  const candidates=inputTanks.map(t=>{
   const key=(t.ingredients||[]).find(k=>labels[k]&&(t.levels||{})[k]>0);
   return {tank:t,key,path:mixerPath(t,mixer,pipes)};
  }).filter(x=>x.key&&x.path);
  let pair=null;
  for(let i=0;i<candidates.length&&!pair;i++)for(let k=i+1;k<candidates.length;k++){
   if(candidates[i].key!==candidates[k].key){
    const recipeKey=[candidates[i].key,candidates[k].key].sort().join('|');
    if(products[recipeKey]){pair=[candidates[i],candidates[k]];break}
   }
  }
  const outputs=parts.filter(p=>p.type==='cup'||p.type==='coffee').map(p=>({part:p,path:mixerPath(mixer,p,pipes)})).filter(x=>x.path);
  const receiver=outputs[0]?.part,outputPath=outputs[0]?.path;
  const pump=parts.find(p=>p.type==='pump'&&mixerPath(p,mixer,pipes));
  const valve=parts.find(p=>p.type==='valve'&&mixerPath(mixer,p,pipes));
  const ready=!!(pair&&receiver&&outputPath&&pump&&pump.on&&pump.active&&mixer.active&&(!valve||valve.on));
  if(!ready){
   mixer._mixFlowAt=0;mixer._mixLastTick=0;
   for(const edge of pipes)if((edge.connections||[]).includes(mixer.id))edge.fluid='empty';
   if(!pair)notes.push('смеситель: подключи два резервуара с разными жидкостями (вода, сироп, молоко или концентрат сока)');
   else if(!receiver)notes.push('смеситель: подключи чашку или кофейный блок к выходу');
   else if(!pump||!pump.on||!pump.active)notes.push('смеситель: нужен включённый насос с электричеством');
   else if(!mixer.active)notes.push('смеситель не получает электричество');
   else if(valve&&!valve.on)notes.push('смеситель: открой клапан');
   continue;
  }
  const [a,b]=pair,recipeKey=[a.key,b.key].sort().join('|'),recipe=products[recipeKey];
  const ratio=Math.max(0,Math.min(100,Number(mixer.ratioA??50)))/100;
  const ratioA=ratio,ratioB=1-ratio;
  mixer._mixFlowAt=mixer._mixFlowAt||now;
  const seconds=Math.floor((now-mixer._mixFlowAt)/1000),last=mixer._mixLastTick||0,ticks=Math.max(0,seconds-last);
  const leftA=Math.max(0,Number(a.tank.levels?.[a.key]||0)),leftB=Math.max(0,Number(b.tank.levels?.[b.key]||0));
  const room=Math.max(0,100-Number(receiver.liquidLevel||0));
  const rate=Math.max(.1,Math.min(20,Number(pump.calculatedFlow??pump.flowRate??5)));
  const maxA=ratioA>0?leftA/ratioA:Infinity,maxB=ratioB>0?leftB/ratioB:Infinity;
  const canMove=Math.min(rate*ticks,room,maxA,maxB);
  if(ticks>0&&canMove>0){
   a.tank.levels[a.key]=Math.max(0,leftA-canMove*ratioA);
   b.tank.levels[b.key]=Math.max(0,leftB-canMove*ratioB);
   receiver.liquid=recipe.id;receiver.liquidLevel=Math.min(100,Number(receiver.liquidLevel||0)+canMove);
   receiver.temperatureC=20;receiver.mixture={first:a.key,second:b.key,ratioA:Math.round(ratioA*100),ratioB:Math.round(ratioB*100)};
   mixer._mixLastTick=seconds;
  }
  a.path.edges.forEach(edge=>edge.fluid=a.key);
  b.path.edges.forEach(edge=>edge.fluid=b.key);
  outputPath.edges.forEach(edge=>edge.fluid=recipe.id);
  mixer.active=true;
  notes.push('смеситель: '+labels[a.key]+' + '+labels[b.key]+' → '+recipe.name+' ('+Math.round(ratioA*100)+'/'+Math.round(ratioB*100)+')');
  if(room<=0)notes.push('чашка заполнена — смешивание остановлено');
  if(leftA<=0||leftB<=0)notes.push('один из резервуаров пуст');
 }
 if(notes.length){
  status.innerHTML+='<br><span style="color:#8ee7ff">'+notes.join(' · ')+'</span>';
  drawWorld();
 }
};
const previousDrawWorld=drawWorld;
drawWorld=function(){
 previousDrawWorld();
 if(!ready)return;
 parts.forEach(p=>{
  const el=world.querySelector('[data-id="'+p.id+'"]');if(!el)return;
  const info=el.querySelector('.part-info');
  if(p.type==='mixer'){
   const small=document.createElement('small');small.className='part-info';
   small.textContent=' '+(p.ratioA??50)+'/'+(100-(p.ratioA??50))+'%';
   el.appendChild(small);
  }
  if(p.type==='tank'&&p.ingredients?.length){
   const small=el.querySelector('small');
   if(small)small.textContent=p.name+' · '+p.ingredients.map(k=>(labelsForLiquid[k]||k)+' '+Math.round(p.levels?.[k]??100)+'%').join(' + ');
  }
  if((p.type==='cup'||p.type==='coffee')&&p.liquidLevel>0){
   const small=el.querySelector('small');
   const liquidNames={lemonade:'лимонад',milkDrink:'молочный напиток',milkshake:'молочный коктейль',juice:'сок',sparklingWater:'газ. вода',water:'вода',coffee:'кофе'};
   if(small)small.textContent=p.name+' · '+(liquidNames[p.liquid]||p.liquid||'жидкость')+' '+Math.round(p.liquidLevel)+'%';
  }
 });
};
const labelsForLiquid={water:'вода',beans:'зёрна',syrup:'сироп',milk:'молоко',juiceBase:'концентрат сока'};

/* Liquid rendering fix: show every liquid's color in pipes, tanks and cups. */
const visualSVGBeforeLiquidFix=visualSVG;
const liquidPalette={
 water:'#39c8ff',syrup:'#d58a24',milk:'#f4eee0',juiceBase:'#ff9135',
 lemonade:'#f1ce3d',milkDrink:'#eee2c7',milkshake:'#d7b58b',juice:'#ff8628',
 sparklingWater:'#53d6c2',coffee:'#87502f',beans:'#a86a3d'
};
visualSVG=function(type,lit,label){
 if(type==='cup'||type==='coffee'){
  const kind=lit&&typeof lit==='object'?(lit.kind||'empty'):(typeof lit==='string'?lit:'empty');
  const level=Math.max(0,Math.min(100,Number(lit&&typeof lit==='object'?lit.level:0)||0));
  const fill=liquidPalette[kind]||'#49b9f0';
  let liquid='';
  if(level>0){
   const ratio=level/100,top=64-42*ratio,left=30-6*ratio,right=63+5*ratio;
   liquid='<path d="M'+left.toFixed(1)+' '+top.toFixed(1)+' Q46 '+(top-2.5).toFixed(1)+' '+right.toFixed(1)+' '+top.toFixed(1)+' L63 64 H30 Z" fill="'+fill+'" opacity=".96"/><path d="M'+(left+4).toFixed(1)+' '+(top+5).toFixed(1)+' Q45 '+(top+2).toFixed(1)+' '+(right-4).toFixed(1)+' '+(top+5).toFixed(1)+'" fill="none" stroke="#ffffff" stroke-opacity=".35" stroke-width="2"/>';
  }
  return '<svg viewBox="0 0 100 76" xmlns="http://www.w3.org/2000/svg"><path d="M20 16h52l-6 52H27Z" fill="#e4e9ef" fill-opacity=".88" stroke="#9eafc2" stroke-width="3"/>'+liquid+'<path d="M72 25h8q14 0 8 18-4 9-20 8" fill="none" stroke="#cbd6e1" stroke-width="6"/><path d="M25 20h42" stroke="#ffffff" stroke-opacity=".6" stroke-width="2"/></svg>';
 }
 if(type==='tank'){
  const kind=lit&&typeof lit==='object'?(lit.kind||'water'):'water';
  const level=Math.max(0,Math.min(100,Number(lit&&typeof lit==='object'?lit.level:100)||0));
  const fill=liquidPalette[kind]||'#39aee8',top=66-49*level/100;
  return '<svg viewBox="0 0 100 76" xmlns="http://www.w3.org/2000/svg"><rect x="24" y="10" width="52" height="58" rx="13" fill="#68a9c7" fill-opacity=".32" stroke="#c3e8f8" stroke-width="3"/>'+(level>0?'<path d="M28 '+top.toFixed(1)+' Q50 '+(top-3).toFixed(1)+' 72 '+top.toFixed(1)+' V64 Q72 66 68 66 H32 Q28 66 28 64Z" fill="'+fill+'" opacity=".92"/>':'')+'<path d="M35 10V5h30v5M34 17v40" stroke="#e8f8ff" stroke-opacity=".65" stroke-width="3" fill="none"/></svg>';
 }
 return visualSVGBeforeLiquidFix(type,lit,label);
};
const drawWorldBeforeLiquidFix=drawWorld;
drawWorld=function(){
 drawWorldBeforeLiquidFix();
 const svg=world.querySelector('svg');
 if(!svg)return;
 const edges=parts.filter(p=>(p.type==='wire'||p.type==='pipe'||p.type==='motor')&&p.connections&&p.connections.length===2);
 const lines=svg.querySelectorAll('line');
 lines.forEach((line,index)=>{
  const edge=edges[index];
  if(!edge||edge.type!=='pipe')return;
  const key=edge.fluid||'empty';
  if(key!=='empty'){
   const color=liquidPalette[key]||'#55bde8';
   line.style.stroke=color;
   line.style.color=color;
   line.style.strokeWidth='14';
   line.style.filter='drop-shadow(0 0 7px '+color+'99)';
   line.classList.add('flowing');
  }else{
   line.style.stroke='#8793a3';
   line.style.color='#8793a3';
   line.style.strokeWidth='12';
   line.style.filter='drop-shadow(0 0 2px #8793a388)';
   line.classList.remove('flowing');
  }
 });
};

})();
