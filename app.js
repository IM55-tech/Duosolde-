const KEY='duosolde.v1';
const CATS={out:[['🏠','Logement'],['🛒','Alimentation'],['🚌','Transport'],['💊','Santé'],['🎒','Enfants et éducation'],['👗','Vêtements et soins'],['📱','Communication'],['🤝','Famille et social'],['🎉','Loisirs'],['🐷','Épargne et cotisations'],['💳','Dettes'],['🏦','Frais bancaires'],['📄','Impôts et administratif'],['💼','Travail et projets'],['⚠️','Imprévus'],['👛','Argent de poche'],['📦','Autre dépense']],in:[['💰','Salaire'],['🧰','Activité'],['🤲','Cotisation reçue'],['🎁','Cadeau'],['↩️','Remboursement'],['➕','Autre apport']]};
const U={d:['jour','jours'],w:['semaine','semaines'],m:['mois','mois'],y:['an','ans']};
const TABS={accueil:'home',transactions:'tx',budget:'bud',objectifs:'obj',reglages:'set'};
const TITLE={home:'TABLEAU DE BORD COMMUN',tx:'TRANSACTIONS',bud:'BUDGET',obj:'OBJECTIFS',set:'PARAMÈTRES'};
let S={names:{m:'Monsieur',f:'Madame'},cur:'FCFA',tx:[],rec:[],bud:[],me:{},cid:'',want:'',sent:{},gone:{}},tab=TABS[location.hash.slice(1)]||'home',sub='ops',flt='';
try{Object.assign(S,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){}
S.names=Object.assign({m:'Monsieur',f:'Madame',c:'Commun'},S.names);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}push()};
const $=s=>document.querySelector(s),p2=n=>String(n).padStart(2,'0');
const iso=x=>`${x.getFullYear()}-${p2(x.getMonth()+1)}-${p2(x.getDate())}`,today=()=>iso(new Date());
const ago=n=>{const d=new Date();d.setDate(d.getDate()-n);return iso(d)};
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fd=s=>{const[y,m,d]=s.split('-');return `${d}/${m}/${y}`};
const num=n=>n.toLocaleString('fr-FR',{maximumFractionDigits:2}),money=n=>num(n)+' '+S.cur;
const icon=(t,c)=>(CATS[t].find(x=>x[1]===c)||['•'])[0];
const sum=l=>l.reduce((a,t)=>a+t.amt,0);
const T=(type,who)=>sum(S.tx.filter(t=>t.type===type&&(!who||t.who===who)));
const sorted=()=>S.tx.slice().reverse().sort((a,b)=>b.date.localeCompare(a.date));
const every=r=>r.n===1?'Chaque '+U[r.unit][0]:'Tous les '+r.n+' '+U[r.unit][1];
const opts=(t,all)=>(all?'<option value="">Toutes les catégories</option>':'')+CATS[t].map(c=>`<option>${c[1]}</option>`).join('');

/* Récurrents : date de la k-ième occurrence */
function occ(r,k){const[y,m,d]=r.start.split('-').map(Number),s=r.n*k;
 if(r.unit==='d'||r.unit==='w')return iso(new Date(y,m-1,d+s*(r.unit==='w'?7:1)));
 const t=m-1+(r.unit==='m'?s:s*12),yy=y+Math.floor(t/12),mo=t%12,last=new Date(yy,mo+1,0).getDate();
 return iso(new Date(yy,mo,Math.min(d,last)))}
function runRec(){let ch=0;S.rec.forEach(r=>{if(!r.on)return;let g=0;
 while(occ(r,r.k)<=today()&&g++<500){const id='g'+r.id+'_'+r.k;if(!S.tx.some(t=>t.id===id)&&!S.gone['tx_'+id])S.tx.push({id,type:r.type,who:r.who,amt:r.amt,cat:r.cat,note:r.note,date:occ(r,r.k),rid:r.id});r.k++;ch=1}});
 if(ch)save()}

/* Budgets et objectifs */
const bprog=b=>sum(S.tx.filter(t=>t.type===b.kind&&(!b.cat||t.cat===b.cat)&&(!b.who||t.who===b.who)&&(!b.from||t.date>=b.from)&&(!b.to||t.date<=b.to)));
const bcard=(b,del)=>{const v=bprog(b),pc=b.target?v/b.target*100:0,over=b.kind==='out'&&pc>100;
 return `<div class="bd"><div class="bh"><b>${esc(b.name)}</b><small>${b.cat?esc(b.cat):'Toutes catégories'}${b.who?' · '+esc(S.names[b.who]):''}${b.to?' · jusqu’au '+fd(b.to):''}</small></div><div class="bar"><span style="width:${Math.min(100,pc)}%;${over?'background:var(--bad)':''}"></span></div><div class="bf"><span>${money(v)} / ${money(b.target)}</span><b class="${over?'neg':''}">${Math.round(pc)} %</b></div>${del?`<div class="acts"><button data-a="delb" data-id="${b.id}">Supprimer</button></div>`:''}</div>`};

/* Affichage */
const row=(t,d)=>`<div class="row"><span class="ic ${t.who}">${icon(t.type,t.cat)}</span><div class="mid"><b>${esc(t.cat)}</b><small>${esc(S.names[t.who])} · ${fd(t.date)}${t.note?' · '+esc(t.note):''}${t.rid?' · récurrent':''}</small></div><span class="amt ${t.type}">${t.type==='in'?'+':'−'}${money(t.amt)}</span>${d?`<button class="x" data-a="del" data-id="${t.id}" aria-label="Supprimer">✕</button>`:''}</div>`;
const list=(l,d)=>l.map(t=>row(t,d)).join('')||'<p class="empty">Aucune opération pour le moment.</p>';
function donut(){const K=['m','f','c'],v=K.map(k=>T('out',k)),t=sum(v.map(x=>({amt:x}))),C=2*Math.PI*38,col={m:'var(--m)',f:'var(--f)',c:'var(--c)'};let o=0;
 return `<svg viewBox="0 0 100 100" width="104" height="104"><circle cx="50" cy="50" r="38" fill="none" stroke="var(--line)" stroke-width="18"/>${t?K.map((k,i)=>{const l=C*v[i]/t,s=`<circle cx="50" cy="50" r="38" fill="none" stroke="${col[k]}" stroke-width="18" stroke-dasharray="${l} ${C-l}" stroke-dashoffset="${-o}" transform="rotate(-90 50 50)"/>`;o+=l;return s}).join(''):''}</svg>`}
const goals=kind=>{const l=S.bud.filter(b=>b.kind===kind);return `<section class="card"><div class="th"><h2>${kind==='out'?'Plafonds de dépenses':'Objectifs d’apports'}</h2><button class="pill" data-a="add">+ Nouveau</button></div>${l.map(b=>bcard(b,1)).join('')||`<p class="empty">${kind==='out'?'Aucun plafond. Fixez une limite pour une catégorie.':'Aucun objectif. Fixez un montant à atteindre ensemble.'}</p>`}</section>`};
const V={
home(){const bal=T('in')-T('out'),side=k=>`<div class="side"><span class="lab"><i class="dot ${k}"></i>${esc(S.names[k])}</span><b>${num(T('out',k))}</b><small>Dépenses</small><small class="up">Apports +${num(T('in',k))}</small></div>`,
 g=S.bud.find(b=>b.kind==='in')||S.bud[0],pc=g&&g.target?Math.round(bprog(g)/g.target*100):0;
 return `<section class="card bal"><small>SOLDE DISPONIBLE</small><h2 class="big ${bal<0?'neg':''}">${money(bal)}</h2><div class="sums">${side('m')}${donut()}${side('f')}</div><div class="com"><i class="dot c"></i><span>${esc(S.names.c)} : dépenses <b>${num(T('out','c'))}</b> · apports <b class="up">+${num(T('in','c'))}</b></span></div></section>
 <section class="card"><div class="th"><h2>Opérations récentes</h2><button class="pill" data-a="add">+ Ajouter</button></div>${S.tx.length?list(sorted().slice(0,4)):'<p class="empty">Ajoutez votre première opération.<br><button class="pill" data-a="demo">Charger un exemple</button></p>'}${g?`<div class="goal"><b>${g.kind==='in'?'Objectif':'Budget'} ${esc(g.name)} : ${pc} % (${money(g.target)})</b><div class="bar"><span style="width:${Math.min(100,pc)}%"></span></div></div>`:''}</section>`},
tx(){const tabs=`<div class="tabs"><button data-a="sub" data-v="ops" class="${sub==='ops'?'on':''}">Opérations</button><button data-a="sub" data-v="rec" class="${sub==='rec'?'on':''}">Récurrents</button></div>`;
 if(sub==='rec')return tabs+`<div class="th"><h3>Dépenses et apports récurrents</h3><button class="pill" data-a="add">+ Nouveau</button></div>`+(S.rec.map(r=>`<section class="card"><div class="row"><span class="ic ${r.who}">${icon(r.type,r.cat)}</span><div class="mid"><b>${esc(r.cat)} <em>${r.type==='in'?'apport':'dépense'}</em></b><small>${every(r)} · ${esc(S.names[r.who])}${r.note?' · '+esc(r.note):''}</small><small>${r.on?'Prochaine : '+fd(occ(r,r.k)):'En pause'}</small></div><span class="amt ${r.type}">${r.type==='in'?'+':'−'}${money(r.amt)}</span></div><div class="acts"><button data-a="tog" data-id="${r.id}">${r.on?'Mettre en pause':'Reprendre'}</button><button data-a="delr" data-id="${r.id}">Supprimer</button></div></section>`).join('')||'<section class="card"><p class="empty">Aucun récurrent. Créez un loyer, un salaire, une cotisation…</p></section>');
 return tabs+`<div class="chips">${[['','Tous'],['m',S.names.m],['f',S.names.f],['c',S.names.c]].map(([v,n])=>`<button data-a="flt" data-v="${v}" class="${flt===v?'on '+v:''}">${esc(n)}</button>`).join('')}</div><section class="card"><div class="th"><h2>Historique</h2><button class="pill" data-a="add">+ Ajouter</button></div>${list(sorted().filter(t=>!flt||t.who===flt),1)}</section>`},
bud(){return goals('out')},obj(){return goals('in')},
set(){return `<section class="card" style="text-align:center"><img class="lg" src="logo-complet.jpg" alt="DuoSolde"></section>${sy()}<section class="card"><label>Nom de monsieur (bleu)<input data-s="m" value="${esc(S.names.m)}"></label><label>Nom de madame (rose)<input data-s="f" value="${esc(S.names.f)}"></label><label>Nom des dépenses communes<input data-s="c" value="${esc(S.names.c)}"></label><label>Devise<input data-s="cur" value="${esc(S.cur)}"></label></section><section class="card"><div class="btns" style="margin:0"><button class="ghost" data-a="exp">Exporter</button><button class="ghost" data-a="imp">Importer</button><input type="file" id="imp" accept=".json,application/json" hidden><button class="ghost" data-a="reset">Tout effacer</button></div><p class="tip">Sur Android : dans Chrome, menu ⋮ puis « Ajouter à l’écran d’accueil ».</p></section>`}};
function render(){document.querySelectorAll('#nav button').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
 $('#ttl').textContent=TITLE[tab];$('header').className=tab==='home'?'':'s';$('#view').className=tab==='home'?'':'pg';
 $('#who').innerHTML=tab==='home'?['m','f'].map(k=>`<div class="av"><div class="ring ${k}">${esc((S.names[k].trim()[0]||'?').toUpperCase())}</div><small>${esc(S.names[k])}</small></div>`).join(''):'';
 $('#view').innerHTML=V[tab]();setSt()}
function go(t){tab=t;render();scrollTo(0,0);const h=Object.keys(TABS).find(k=>TABS[k]===t);if(location.hash!=='#'+h)location.hash=h}
function route(){const h=location.hash.slice(1);if(h==='ajout')return;const t=TABS[h]||'home';if(!$('#modal').innerHTML&&t===tab)return;closeM(1);tab=t;render()}
addEventListener('hashchange',route);

/* Formulaires (le bouton retour d’Android ferme la fenêtre) */
const seg=(n,items,v,c)=>`<div class="seg">${items.map(([k,l])=>`<label class="${c?c+'-'+k:''} ${k===v?'on':''}"><input type="radio" name="${n}" value="${k}" ${k===v?'checked':''}>${l}</label>`).join('')}</div>`;
const sheet=h=>{$('#modal').innerHTML=`<div class="sheet">${h}</div>`;if(location.hash!=='#ajout')location.hash='ajout'};
const closeM=q=>{$('#modal').innerHTML='';if(!q&&location.hash==='#ajout')history.back()};
const btns='<div class="btns"><button type="button" class="ghost" data-a="close">Annuler</button><button class="pri">Enregistrer</button></div>';
function form(mode){const rec=mode==='rec';
 sheet(`<form data-f="${mode}"><h2>${rec?'Nouveau récurrent':'Nouvelle opération'}</h2>${seg('type',[['out','Dépense'],['in','Apport']],'out')}${seg('who',[['m',esc(S.names.m)],['f',esc(S.names.f)],['c',esc(S.names.c)]],S.me.side||'m','w')}
 <label>Montant (${esc(S.cur)})<input name="amt" type="number" min="0" step="any" inputmode="decimal" required></label>
 <label>Catégorie<select name="cat">${opts('out')}</select></label>
 <label>${rec?'Première date':'Date'}<input name="date" type="date" value="${today()}" required></label>
 ${rec?`<label>Répéter tous les<div class="two"><input name="n" type="number" min="1" value="1"><select name="unit"><option value="d">jour(s)</option><option value="w">semaine(s)</option><option value="m" selected>mois</option><option value="y">an(s)</option></select></div></label>`:''}
 <label>Note (facultatif)<input name="note"></label>${btns}</form>`)}
function bform(kind){sheet(`<form data-f="bud"><h2>${kind==='in'?'Nouvel objectif':'Nouveau budget'}</h2>${seg('kind',[['out','Plafond de dépenses'],['in','Objectif d’apports']],kind)}
 <label>Nom<input name="name" required placeholder="Ex. Vacances, Courses du mois"></label>
 <label>Montant visé (${esc(S.cur)})<input name="target" type="number" min="1" step="any" inputmode="decimal" required></label>
 <label>Catégorie (facultatif)<select name="cat">${opts(kind,1)}</select></label>
 <label>Concerne<select name="who"><option value="">Les deux</option><option value="m">${esc(S.names.m)}</option><option value="f">${esc(S.names.f)}</option><option value="c">${esc(S.names.c)}</option></select></label>
 <label>Du (facultatif)<input name="from" type="date"></label><label>Au (facultatif)<input name="to" type="date"></label>${btns}</form>`)}
const openForm=()=>tab==='bud'?bform('out'):tab==='obj'?bform('in'):form(tab==='tx'&&sub==='rec'?'rec':'tx');

function demo(){const a=(type,who,amt,cat,date,note='')=>S.tx.push({id:uid(),type,who,amt,cat,date,note});
 a('in','m',350000,'Salaire',ago(12));a('in','f',180000,'Activité',ago(9));a('out','m',45000,'Alimentation',ago(6),'Marché');a('out','f',20000,'Transport',ago(4));a('out','f',15000,'Vêtements et soins',ago(2));a('out','c',25000,'Alimentation',ago(3),'Courses du foyer');
 S.rec.push({id:uid(),type:'out',who:'c',amt:60000,cat:'Logement',note:'Loyer',start:ago(30),n:1,unit:'m',k:0,on:true});
 S.bud.push({id:uid(),name:'Courses du mois',kind:'out',target:120000,cat:'Alimentation',who:'',from:'',to:''},{id:uid(),name:'Vacances',kind:'in',target:500000,cat:'',who:'',from:'',to:''});runRec()}

/* Jumelage et synchronisation (version en ligne, base partagée) */
let db=null,unsub=null,pw=null,pt=null,busy=0,again=0,lastSync=0,syncErr=0;
const gen=()=>'DUO-'+Array.from({length:6},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random()*32|0]).join('');
const col=()=>db.collection('couples/'+S.cid+'/items');
const rm=(k,id)=>{S[k]=S[k].filter(i=>i.id!==id);if(S.cid)S.gone[k+'_'+id]=1};
const hm=t=>new Date(t).toTimeString().slice(0,5);
const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
function setSt(t){const e=$('#st');if(!e)return;e.textContent=t||(!navigator.onLine?'Hors ligne · enregistré sur l’appareil':S.cid?(syncErr?'Jumelé · synchro en attente':'Jumelé · synchronisé '+hm(lastSync||Date.now())):'')}
const push=()=>{if(!db||!S.cid)return;if(busy){again=1;return}clearTimeout(pt);pt=setTimeout(doPush,400)};
async function doPush(){if(!db||!S.cid||busy)return;busy=1;setSt('Synchronisation…');
 try{const cur={};['tx','rec','bud'].forEach(k=>S[k].forEach(i=>cur[k+'_'+i.id]={k,i}));
  for(const key in cur){const h=JSON.stringify(cur[key].i);if(S.sent[key]!==h){await col().doc(key).set({k:cur[key].k,i:cur[key].i.id,d:cur[key].i,u:Date.now()});S.sent[key]=h}}
  for(const key of Object.keys(S.gone)){const p=key.split('_');await col().doc(key).set({k:p[0],i:p.slice(1).join('_'),del:true,u:Date.now()});delete S.gone[key];delete S.sent[key]}
  lastSync=Date.now();syncErr=0}catch(e){syncErr=1}
 store();busy=0;setSt();if(again){again=0;push()}}
function applyDocs(docs){let ch=0;docs.forEach(d=>{const x=d.data();if(!x||!S[x.k])return;const key=d.id,arr=S[x.k],i=arr.findIndex(t=>t.id===x.i);
 if(x.del){if(i>=0){arr.splice(i,1);ch=1}delete S.sent[key];return}
 if(S.gone[key]||!x.d)return;
 const dd=JSON.parse(JSON.stringify(x.d)),h=JSON.stringify(dd);S.sent[key]=h;
 if(i<0){arr.push(dd);ch=1}else if(JSON.stringify(arr[i])!==h){if(x.k==='rec')dd.k=Math.max(dd.k,arr[i].k);arr[i]=dd;ch=1}});
 return ch}
function startSync(){if(!db||!S.cid||unsub)return;const t=setTimeout(()=>setSt('Serveur injoignable pour le moment'),10000);
 unsub=col().onSnapshot(s=>{clearTimeout(t);const ch=applyDocs(s.docs);lastSync=Date.now();syncErr=0;if(ch){store();render()}setSt();push()},()=>{clearTimeout(t);unsub=null;syncErr=1;setSt()});push()}
async function refresh(){if(!db||!S.cid)return;setSt('Actualisation…');
 try{const s=await col().get();if(applyDocs(s.docs)){store();render()}lastSync=Date.now();syncErr=0}catch(e){syncErr=1}push();setSt()}
async function setup(){try{
 if(!S.me.code){S.me.code=gen();while((await db.doc('codes/'+S.me.code).get()).exists)S.me.code=gen()}
 const sig=S.me.code+'|'+(S.me.side||'');if(S.me.reg!==sig){await db.doc('codes/'+S.me.code).set({side:S.me.side||''});S.me.reg=sig}
 store();if(S.cid)startSync();else if(S.want)watchPair()}catch(e){syncErr=1}render()}
function watchPair(){if(pw||!db||!S.want)return;
 pw=db.doc('pairs/'+S.want).onSnapshot(s=>{const d=s.exists&&s.data();if(d&&d.with===S.me.code&&!S.cid){S.cid=[S.me.code,S.want].sort().join('_');S.sent={};S.want='';if(pw){pw();pw=null}store();startSync();render()}},()=>{pw=null})}
async function pair(code){code=String(code||'').trim().toUpperCase();const say=t=>{const m=$('#pmsg');if(m)m.textContent=t};
 if(!/^DUO-[A-Z0-9]{6}$/.test(code))return say('Identifiant invalide (exemple : DUO-7K3M9Q).');
 if(code===S.me.code)return say('C’est votre propre identifiant.');
 try{const c=await db.doc('codes/'+code).get();if(!c.exists)return say('Identifiant introuvable.');
  await db.doc('pairs/'+S.me.code).set({with:code});S.want=code;store();watchPair();render()}catch(e){say('Impossible pour le moment (connexion ou droit de modification requis).')}}
async function unpair(){if(unsub){unsub();unsub=null}if(pw){pw();pw=null}try{await db.doc('pairs/'+S.me.code).delete()}catch(e){}S.cid='';S.want='';S.sent={};S.gone={};store();render()}
function mergeIn(o){['tx','rec','bud'].forEach(k=>(o[k]||[]).forEach(i=>{if(i&&i.id&&!S[k].some(t=>t.id===i.id)&&!S.gone[k+'_'+i.id])S[k].push(i)}));save();render()}
async function initSync(){try{const c=window.claude;db=c&&c.use?await c.use('db'):null}catch(e){db=null}if(db)setup();else render()}
addEventListener('online',()=>{setSt();push()});addEventListener('offline',()=>setSt());
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.cid&&db)refresh()});
const sy=()=>{const H='<h3 style="margin-top:0">Jumelage du couple</h3>';
 if(!db)return `<section class="card">${H}<p class="tip">Le jumelage en direct est disponible dans la version en ligne de DuoSolde. Ici, vos données restent sur l’appareil et fonctionnent sans connexion ; vous pouvez les échanger avec Exporter et Importer.</p></section>`;
 const sd=S.me.side||'',b=(v,n)=>`<button data-a="side" data-v="${v}" class="${sd===v?'on':''}">${esc(n)}</button>`;
 return `<section class="card">${H}<label>Mon identifiant (à donner à l’autre)</label><div class="idc"><b>${S.me.code||'…'}</b><button class="x" data-a="copy" style="width:auto;padding:0 8px">Copier</button></div><label>Je suis</label><div class="tabs">${b('m',S.names.m)}${b('f',S.names.f)}</div><p id="pmsg" class="tip"></p>`+
 (S.cid?`<p>✅ Jumelés : les opérations de l’un apparaissent chez l’autre.</p><div class="btns"><button class="ghost" data-a="refresh">Actualiser</button><button class="ghost" data-a="unpair">Rompre</button></div>`
 :S.want?`<p>⏳ En attente de l’autre personne : elle doit saisir <b>${S.me.code}</b> de son côté.</p><div class="btns"><button class="ghost" data-a="unpair">Annuler</button></div>`
 :`<label>Identifiant de l’autre<input id="oc" placeholder="DUO-XXXXXX" autocapitalize="characters" autocomplete="off"></label><div class="btns"><button class="pri" data-a="pair">Jumeler</button></div>`)+`</section>`};

/* Événements */
document.addEventListener('click',e=>{if(e.target.id==='modal')return closeM();
 const a=e.target.closest('[data-a]');if(!a)return;const A=a.dataset.a,id=a.dataset.id;
 if(A==='tab')return go(a.dataset.t);
 if(A==='pair')return pair($('#oc').value);
 if(A==='unpair')return unpair();
 if(A==='refresh')return refresh();
 if(A==='imp')return $('#imp').click();
 if(A==='side'){S.me.side=a.dataset.v;save();setup();return render()}
 if(A==='copy'){try{navigator.clipboard.writeText(S.me.code)}catch(e){}a.textContent='Copié ✓';return}
 if(A==='add')return openForm();
 if(A==='close')return closeM();
 if(A==='sub')sub=a.dataset.v;
 else if(A==='flt')flt=a.dataset.v;
 else if(A==='del')rm('tx',id);
 else if(A==='delr')rm('rec',id);
 else if(A==='delb')rm('bud',id);
 else if(A==='demo')demo();
 else if(A==='tog'){const r=S.rec.find(r=>r.id===id);r.on=!r.on;if(r.on){let g=0;while(occ(r,r.k)<today()&&g++<3000)r.k++}}
 else if(A==='exp'){const u=document.createElement('a');u.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));u.download='duosolde-sauvegarde.json';u.click();return}
 else if(A==='reset'){if(!a.dataset.c){a.dataset.c=1;a.textContent=S.cid?'Confirmer (efface aussi chez l’autre)':'Confirmer l’effacement';return}['tx','rec','bud'].forEach(k=>S[k].slice().forEach(i=>rm(k,i.id)))}
 save();render()});
document.addEventListener('submit',e=>{e.preventDefault();const f=e.target,d=Object.fromEntries(new FormData(f)),k=f.dataset.f;
 if(k==='tx')S.tx.push({id:uid(),type:d.type,who:d.who,amt:+d.amt,cat:d.cat,date:d.date,note:d.note});
 if(k==='rec'){S.rec.push({id:uid(),type:d.type,who:d.who,amt:+d.amt,cat:d.cat,note:d.note,start:d.date,n:Math.max(1,+d.n||1),unit:d.unit,k:0,on:true});runRec()}
 if(k==='bud')S.bud.push({id:uid(),name:d.name,kind:d.kind,target:+d.target,cat:d.cat,who:d.who,from:d.from,to:d.to});
 save();closeM();render()});
document.addEventListener('change',e=>{const t=e.target;
 if(t.id==='imp'&&t.files[0]){t.files[0].text().then(x=>mergeIn(JSON.parse(x))).catch(()=>{});return}
 if(t.closest('.seg')){t.closest('.seg').querySelectorAll('label').forEach(l=>l.classList.toggle('on',l.querySelector('input').checked));
  if(t.name==='type'||t.name==='kind')t.form.querySelector('[name=cat]').innerHTML=opts(t.value,t.form.dataset.f==='bud')}
 if(t.dataset.s){const v=t.value.trim(),k=t.dataset.s;if(k==='cur')S.cur=v||'FCFA';else S.names[k]=v||{m:'Monsieur',f:'Madame',c:'Commun'}[k];save();render()}});
runRec();render();initSync();
if('serviceWorker' in navigator&&/^https?:/.test(location.protocol)&&!window.claude)navigator.serviceWorker.register('sw.js').catch(()=>{});
