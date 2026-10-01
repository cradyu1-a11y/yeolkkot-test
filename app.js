(function(){
const {AX,AXD,Q,CH,OPTS,API_URL,CH_URL,JOIN_URL,VERSION} = window.YK;
const lvl = x => x>0.25?'hi':(x<-0.25?'lo':'mid');
const LV = {hi:'높은 편',lo:'낮은 편',mid:'가운데'};
const batchim = w => { const ch=w.charCodeAt(w.length-1)-0xAC00; return ch>=0 && ch<=11171 && ch%28!==0; };
const app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const img = id => `img/${id}.webp`;
const P = new URLSearchParams(location.search);
const FROM = (P.get('from')||'direct').slice(0,32);
const FRIEND = CH[P.get('r')] ? P.get('r') : null;
const store = {
  get(k){ try{ return JSON.parse(localStorage.getItem('yk8_'+k)); }catch(e){ return null; } },
  set(k,v){ try{ localStorage.setItem('yk8_'+k, JSON.stringify(v)); }catch(e){} },
  del(k){ try{ localStorage.removeItem('yk8_'+k); }catch(e){} }
};
let ans = store.get('ans') || new Array(Q.length).fill(null);
if(ans.length !== Q.length) ans = new Array(Q.length).fill(null);
let cur = 0, startedAt = null, stats = null;
const SRC = `<p class="src">문항: IPIP-HEXACO 공개 문항(Ashton, Lee &amp; Goldberg, 2007)에서 24개 하위면마다 한 문항씩 골라 우리말로 옮겼어요. 축 정의: HEXACO 성격 모형(Lee &amp; Ashton, 2004). 8인 캐릭터와의 대응은 열꽃심리학이 만든 것이고, 이 24문항 축약판은 따로 검증된 검사가 아니에요. 결과 화면의 연구는 모두 상관 연구라, 원인으로 읽으면 안 돼요.</p>`;

/* ---------- 계산 ---------- */
function scoreAxes(a){
  const s={},n={};
  Q.forEach(([k,,dir],i)=>{ if(a[i]==null) return; s[k]=(s[k]||0)+(dir>0?a[i]:6-a[i]); n[k]=(n[k]||0)+1; });
  const u={}; AX.forEach(x=>{ u[x.k] = n[x.k] ? ((s[x.k]/n[x.k])-3)/2 : 0; }); return u;   // -1 ~ 1
}
function match(u){
  return Object.entries(CH).map(([id,c])=>{
    const ks=Object.keys(c.v);
    const sim = ks.reduce((t,k)=>t+(1-Math.abs(u[k]-c.v[k])/2),0)/ks.length;
    return {id,pct:Math.round(sim*100)};
  }).sort((a,b)=>b.pct-a.pct);
}
function vec(id){ return AX.map(a=>CH[id].v[a.k]||0); }
function neighbours(id){
  const me=vec(id);
  const d=Object.keys(CH).filter(x=>x!==id).map(x=>({id:x,d:vec(x).reduce((t,v,i)=>t+Math.abs(v-me[i]),0)}));
  d.sort((a,b)=>a.d-b.d);
  return {near:d[0].id, far:d[d.length-1].id};
}

/* ---------- 집계 서버 ---------- */
function loadStats(){
  if(!API_URL) return Promise.resolve(null);
  return fetch(API_URL+'?action=stats').then(r=>r.json()).then(j=>{ stats=j; return j; }).catch(()=>null);
}
function send(payload){
  if(!API_URL) return;
  try{ fetch(API_URL,{method:'POST',mode:'no-cors',headers:{'Content-Type':'text/plain'},body:JSON.stringify(payload)}); }catch(e){}
}
function sid(){ let s=store.get('sid'); if(!s){ s=Math.random().toString(36).slice(2,10)+Date.now().toString(36); store.set('sid',s);} return s; }

/* ---------- 화면: 시작 ---------- */
function intro(){
  document.documentElement.style.setProperty('--acc','var(--coral)');
  const resume = ans.some(v=>v!=null) && ans.some(v=>v==null);
  const f = FRIEND ? CH[FRIEND] : null;
  app.innerHTML = `
    ${f?`<div class="friend" style="--fc:${f.c}"><img src="${img(FRIEND)}" alt=""><p>친구는 <b>${f.name}</b>와 가장 많이 겹쳤어요.<br>나는 누구랑 닮았을까요?</p></div>`:''}
    <div class="eyebrow">열꽃심리학 · 성격 여섯 축 테스트</div>
    <h1>열꽃 8인 중에<br>나랑 <span class="hl">제일 닮은</span> 사람은?</h1>
    <p class="lead">24문항, 3분이면 끝나요. 유형 하나로 자르지 않고, 내 성격 여섯 축의 모양이 누구와 몇 % 겹치는지 보여 드려요.</p>
    <div class="grid8">${Object.entries(CH).map(([id,c])=>`<figure><div class="tile" style="--c:${c.c}"><img src="${img(id)}" alt=""></div><figcaption>${c.name}</figcaption></figure>`).join('')}</div>
    <div class="proof" id="proof"></div>
    <button class="btn" id="go">${resume?'이어서 하기':'시작하기'}</button>
    ${resume?'<button class="btn ghost" id="reset">처음부터 다시</button>':''}
    <p class="note">진단이 아니라 재미로 보는 성격 축 프로필이에요. 성격은 유형이 아니라 정도라서, 같은 사람도 축마다 높고 낮은 자리가 다 달라요. 이름이나 연락처는 받지 않아요.</p>
    ${SRC}`;
  document.getElementById('go').onclick = ()=>{ startedAt=Date.now(); cur = resume ? ans.findIndex(v=>v==null) : 0; question(); };
  const r=document.getElementById('reset'); if(r) r.onclick=()=>{ ans=new Array(Q.length).fill(null); store.del('ans'); intro(); };
  loadStats().then(s=>{ const el=document.getElementById('proof'); if(el && s && s.n>=50) el.innerHTML=`지금까지 <b>${s.n.toLocaleString('ko-KR')}명</b>이 해 봤어요`; });
}

/* ---------- 화면: 문항 ---------- */
function question(){
  const [,text] = Q[cur];
  app.innerHTML = `
    <div class="qnum"><span>${cur+1} / ${Q.length}</span><span>${Math.round(cur/Q.length*100)}%</span></div>
    <div class="bar"><i style="width:${(cur/Q.length)*100}%"></i></div>
    <p class="qtext">${esc(text)}</p>
    <div class="opts">${OPTS.map((o,i)=>`<button class="opt${ans[cur]===i+1?' on':''}" data-v="${i+1}"><b>${i+1}</b>${o}</button>`).join('')}</div>
    ${cur>0?'<button class="back" id="back">← 이전 문항</button>':''}`;
  app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{
    ans[cur]=+b.dataset.v; store.set('ans',ans); b.classList.add('on');
    setTimeout(()=>{ if(cur<Q.length-1){cur++;question();} else result(true); },160);
  });
  const bk=document.getElementById('back'); if(bk) bk.onclick=()=>{cur--;question();};
  window.scrollTo({top:0});
}

/* ---------- 화면: 결과 ---------- */
function result(fresh){
  const u=scoreAxes(ans), m=match(u), top=m[0], sec=m[1], c=CH[top.id], nb=neighbours(top.id);
  document.documentElement.style.setProperty('--acc',c.c);
  if(fresh){
    send({v:VERSION,sid:sid(),from:FROM,friend:FRIEND||'',top:top.id,top_pct:top.pct,second:sec.id,
          scores:u,match:Object.fromEntries(m.map(r=>[r.id,r.pct])),answers:ans,
          secs:startedAt?Math.round((Date.now()-startedAt)/1000):null,mobile:/Mobi|Android/i.test(navigator.userAgent)});
    store.set('last',{id:top.id,pct:top.pct});
  }
  const base = location.href.split('?')[0].split('#')[0].replace(/[^/]*$/,'');
  const share = `${base}r/${top.id}.html`;
  const parts = Object.entries(c.v).map(([k,t])=>{ const a=AX.find(x=>x.k===k); const mine=lvl(u[k]); const ok=(t>0&&mine==='hi')||(t<0&&mine==='lo'); return {txt:`${a.name}은 ${t>0?'높은':'낮은'} 쪽`, mine:`${a.name} ${LV[mine]}`, ok}; });
  const hit = parts.filter(p=>p.ok).length;
  const why = `${c.name}는 ${parts.map(p=>p.txt).join(', ')}인 모양이에요. 내 결과는 ${(()=>{const t=parts.map(p=>p.mine).join(', '); return t+(batchim(t)?'이라서':'라서');})()}, 이 사람을 가르는 축 ${parts.length}개 중 ${hit}개가 같은 방향이에요. 나머지 축은 이 사람과 상관없이 내 모양대로예요.`;
  app.innerHTML = `
    <div class="hero">
      <img src="${img(top.id)}" alt="${c.name}">
      <div class="who">${top.id}</div>
      <div class="pct">${top.pct}%</div>
      <h2><span style="white-space:nowrap">${c.name}와</span> 가장 많이 겹쳐요</h2>
      <p class="quote">「${esc(c.say)}」</p>
      <p class="small" id="share-of" style="margin:4px 0 0;color:var(--muted)"></p>
    </div>
    <div class="block"><h3>이 모양의 힘</h3><p>${esc(c.good)}</p></div>
    <div class="block"><h3>이럴 때 힘들어져요</h3><p>${esc(c.hard)}</p></div>
    <div class="block"><h3>연구로 보면</h3><p>${esc(c.study.text)}</p><span class="cite">${esc(c.study.cite)}</span></div>
    <div class="block"><h3>왜 ${c.name}일까요</h3><p>${esc(why)}</p></div>
    <div class="sec"><h2>내 성격 여섯 축 자세히 보기</h2>
      <p class="lead small">점이 가운데보다 오른쪽이면 그 축이 높은 편, 왼쪽이면 낮은 편이에요. 높고 낮은 데 좋고 나쁨은 없어요.</p>
      ${AX.map(a=>{const L=lvl(u[a.k]); return `<div class="block axcard"><div class="axis"><div class="lab"><span>${a.lo}</span><strong>${a.name} · ${LV[L]}</strong><span>${a.hi}</span></div><div class="scale"><i style="left:${(u[a.k]+1)*50}%"></i></div></div><p>${esc(AXD[a.k][L])}</p></div>`;}).join('')}
      <p class="cite">축 하나는 문항 4개로 재요. 문항 수가 적어서 축 안의 세부 면까지 나눠 말하지는 않아요.</p>
    </div>
    <div class="pair">
      <div><img src="${img(nb.near)}" alt=""><p style="margin:0"><span>축 모양이 비슷한 사람</span><strong>${CH[nb.near].name}</strong></p></div>
      <div><img src="${img(nb.far)}" alt=""><p style="margin:0"><span>축 모양이 정반대인 사람</span><strong>${CH[nb.far].name}</strong></p></div>
    </div>
    <div class="sec"><h2>8인과 겹치는 정도</h2>
      <div class="rank">${m.map(r=>`<div><img src="${img(r.id)}" alt=""><span>${CH[r.id].name}</span><em>${r.pct}%</em><div class="m"><i style="width:${r.pct}%;background:${CH[r.id].c}"></i></div></div>`).join('')}</div>
      <p class="lead small">두 번째로 가까운 사람은 ${CH[sec.id].name}(${sec.pct}%)예요.</p>
    </div>
    <div class="sec"><h2>친구한테 보내기</h2>
      <img class="card" id="card" alt="결과 카드">
      <p class="lead small">카드를 길게 누르거나 오른쪽 클릭해서 저장할 수 있어요. 링크를 보내면 친구 화면에 내 결과가 먼저 떠요.</p>
      <div class="row"><button class="btn dark" id="copy">결과 링크 복사</button><button class="btn ghost" id="again">다시 하기</button></div>
      <p class="toast" id="toast"></p>
    </div>
    <div class="member"><strong>이런 이야기를 영상으로 보고 싶다면</strong>
      <span>열꽃심리학은 매일 겪는 마음의 장면을 연구로 다시 읽어 드리는 채널이에요. 영상마다 이 여덟 명이 등장해요.</span>
      <a class="btn" href="${CH_URL}" target="_blank" rel="noopener">유튜브 열꽃심리학 보러 가기</a>
    </div>
    </div>
    <p class="note">진단이 아니라 재미로 보는 성격 축 프로필이에요. 문항이 짧아서 결과는 그날 기분에 따라 조금씩 달라질 수 있어요.</p>
    ${SRC}`;
  document.getElementById('again').onclick=()=>{ ans=new Array(Q.length).fill(null); store.del('ans'); intro(); window.scrollTo({top:0}); };
  const line=`나는 열꽃 8인 중 ${c.name}와 ${top.pct}% 겹친대. 「${c.say}」 너는 누구랑 닮았어?\n${share}`;
  document.getElementById('copy').onclick=()=>{
    const t=document.getElementById('toast');
    (navigator.clipboard?navigator.clipboard.writeText(line):Promise.reject()).then(()=>t.textContent='복사했어요. 카톡이나 댓글에 붙여 넣어 보세요.').catch(()=>{ t.textContent=line; });
  };
  loadStats().then(s=>{ const el=document.getElementById('share-of'); if(el && s && s.n>=50 && s.byTop){ const p=Math.round((s.byTop[top.id]||0)/s.n*100); el.textContent=`지금까지 참여한 사람 중 ${p}%가 ${c.name}였어요`; } });
  (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(()=>drawCard(top,c,u));
  window.scrollTo({top:0});
}

/* ---------- 결과 카드 (1080×1350) ---------- */
function drawCard(top,c,u){
  const W=1080,H=1350, cv=document.createElement('canvas'); cv.width=W; cv.height=H; const g=cv.getContext('2d');
  const rr=(x,y,w,h,r)=>{ g.beginPath(); if(g.roundRect) g.roundRect(x,y,w,h,r); else g.rect(x,y,w,h); };
  g.fillStyle='#FBF8F3'; g.fillRect(0,0,W,H);
  g.globalAlpha=.16; g.fillStyle=c.c; rr(48,48,W-96,770,48); g.fill(); g.globalAlpha=1;
  g.textAlign='center'; g.fillStyle=c.c; g.font='700 30px "Noto Sans KR", sans-serif';
  g.fillText('열꽃 8인 닮은꼴 테스트', W/2, 112);
  const im=new Image(); im.onload=()=>{
    g.drawImage(im, W/2-210, 140, 420, 420);
    g.fillStyle=c.c; g.font='900 116px "Noto Sans KR", sans-serif'; g.fillText(top.pct+'%', W/2, 690);
    g.fillStyle='#1E1B18'; g.font='900 52px "Noto Sans KR", sans-serif'; g.fillText(c.name+'와 가장 많이 겹쳐요', W/2, 770);
    g.fillStyle='#4A443D'; g.font='500 38px "Hahmlet", serif'; g.fillText('「'+c.say+'」', W/2, 885);
    AX.forEach((a,i)=>{ const y=965+i*56, x0=280, x1=W-120;
      g.textAlign='right'; g.fillStyle='#4A443D'; g.font='500 29px "Noto Sans KR", sans-serif'; g.fillText(a.name, x0-26, y+10);
      g.fillStyle='#EBE3D7'; rr(x0,y-6,x1-x0,12,6); g.fill();
      g.fillStyle=c.c; g.beginPath(); g.arc(x0+(u[a.k]+1)/2*(x1-x0), y, 15, 0, 7); g.fill();
    });
    g.textAlign='center'; g.fillStyle='#8A8278'; g.font='500 27px "Noto Sans KR", sans-serif';
    g.fillText('유튜브 열꽃심리학 @yeolkkot_psy', W/2, H-44);
    const el=document.getElementById('card'); if(el) el.src=cv.toDataURL('image/png');
  };
  im.src=img(top.id);
}

intro();
})();
