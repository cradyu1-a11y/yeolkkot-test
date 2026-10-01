(function(){
const {AX,Q,CH,OPTS,API_URL,CH_URL,JOIN_URL,VERSION} = window.YK;
const lvl = x => x>0.25?'hi':(x<-0.25?'lo':'mid');
const LV = {hi:'높은 편',lo:'낮은 편',mid:'가운데'};
const TWIST = {
  C01:'겉으로는 누구와도 금방 친해 보이는데, 사실 속마음까지 보여 주는 사람은 손에 꼽아요.',
  C02:'겉으로는 쉽게 흔들려 보이는데, 사실 남이 힘들 때 끝까지 곁에 남는 쪽은 이 사람이에요.',
  C03:'겉으로는 단톡방에 관심 없어 보이는데, 사실 대화를 제일 꼼꼼하게 다 읽고 있어요.',
  C04:'겉으로는 차갑고 깐깐해 보이는데, 사실 손해를 보더라도 한 약속은 끝까지 지켜요.',
  C05:'겉으로는 감정이 없어 보이는데, 사실 내 사람이 곤란해지기 전에 계획부터 세워 두고 있어요.',
  C06:'겉으로는 생각 없이 노는 것 같은데, 사실 머릿속에는 아직 아무도 안 꺼낸 아이디어가 가득해요.',
  C07:'겉으로는 다 맞춰 주는 것 같은데, 사실 마음속에 절대 양보하지 않는 선이 하나 있어요.',
  C08:'겉으로는 늘 밝고 시끌벅적한데, 사실 모임이 끝나면 오늘 서운했던 사람은 없었는지 혼자 곱씹어요.'
};
const COMPAT = {
  C01:{id:'C03',why:'조용한 완벽주의자가 꼼꼼하게 확인해 둔 걸, 호감형 전략가가 사람들 앞에서 설득력 있게 풀어 줘요. 혼자서는 못 여는 판이 둘이면 열려요.',send:'내가 말로 밀어붙일 때 뒤에서 다 확인해 주는 친구, 떠오르면 보내 봐.'},
  C02:{id:'C05',why:'섬세한 공감자가 먼저 알아챈 서운함을, 냉정한 보호자가 할 일 순서로 정리해 줘요. 마음은 섬세한 공감자가, 해결은 냉정한 보호자가 맡는 조합이에요.',send:'내가 걱정만 하고 있을 때 「그래서 뭐부터 할까」 묻는 친구, 떠오르면 보내 봐.'},
  C03:{id:'C01',why:'조용한 완벽주의자가 혼자 끝까지 다듬은 걸, 호감형 전략가가 알맞은 사람에게 알맞은 때 꺼내 줘요. 묵묵히 한 일이 묻히지 않아요.',send:'내가 해 놓은 걸 대신 자랑해 주는 친구, 떠오르면 보내 봐.'},
  C04:{id:'C07',why:'원칙적인 현실주의자가 하기 어려운 말을 꺼내면, 다정한 양보자가 그 말이 덜 아프게 닿도록 옆에서 받쳐 줘요. 맞는 말이 싸움으로 번지지 않아요.',send:'내가 바른말 하고 분위기 싸해질 때 수습해 주는 친구, 떠오르면 보내 봐.'},
  C05:{id:'C02',why:'냉정한 보호자가 일을 처리하느라 놓친 사람 마음을, 섬세한 공감자가 먼저 챙겨 줘요. 해결도 빠르고 뒷말도 없어요.',send:'내가 일만 보고 달릴 때 「쟤 지금 서운한 것 같아」 알려 주는 친구, 떠오르면 보내 봐.'},
  C06:{id:'C03',why:'밝은 에너지 메이커가 던진 아이디어 열 개 중에, 조용한 완벽주의자가 끝까지 해낼 하나를 골라 마무리해 줘요. 시작과 끝이 둘이면 이어져요.',send:'내가 일 벌이면 조용히 마무리해 주는 친구, 떠오르면 보내 봐.'},
  C07:{id:'C04',why:'다정한 양보자가 차마 못 하는 「그건 아니야」를, 원칙적인 현실주의자가 대신 분명하게 말해 줘요. 양보만 하다 지치지 않아요.',send:'내가 거절 못 하고 있을 때 대신 선 그어 주는 친구, 떠오르면 보내 봐.'},
  C08:{id:'C05',why:'나쁜 소식에 따뜻한 연결자가 먼저 놀라서 달려가면, 냉정한 보호자는 차분하게 다음 순서를 정해 줘요. 마음과 정리가 같이 가요.',send:'내가 호들갑 떨 때 「일단 앉아 봐」 하는 친구, 떠오르면 보내 봐.'}
};
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

/* ---------- 계산 ---------- */
function scoreAxes(a){
  const s={},n={};
  Q.forEach(([k,,dir],i)=>{ if(a[i]==null) return; s[k]=(s[k]||0)+(dir>0?a[i]:6-a[i]); n[k]=(n[k]||0)+1; });
  const u={}; AX.forEach(x=>{ u[x.k] = n[x.k] ? ((s[x.k]/n[x.k])-3)/2 : 0; }); return u;   // -1 ~ 1
}
function match(u){
  const tieKey=id=>{
    const seed=AX.map(({k})=>u[k].toFixed(3)).join('|')+'|'+id;
    let h=2166136261;
    for(let i=0;i<seed.length;i++){ h^=seed.charCodeAt(i); h=Math.imul(h,16777619); }
    return h>>>0;
  };
  return Object.entries(CH).map(([id,c])=>{
    const ks=Object.keys(c.v);
    const sim=ks.reduce((t,k)=>t+(1-Math.abs(u[k]-c.v[k])/2),0)/ks.length;
    const diffs=AX.map(({k})=>Math.abs(u[k]-(c.v[k]||0)));
    const sq=diffs.reduce((t,d)=>t+d*d,0);
    return {id,pct:Math.round(sim*100),sim,sq,tie:tieKey(id)};
  }).sort((a,b)=>b.sim-a.sim || a.sq-b.sq || a.tie-b.tie)
    .map(({id,pct})=>({id,pct}));
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
    ${f?`<div class="friend" style="--fc:${f.c}"><img src="${img(FRIEND)}" alt=""><p>친구는 <b>${f.name}</b>와 가장 닮았어요.<br>나는 누구랑 닮았을까요?</p></div>`:''}
    <div class="eyebrow">열꽃심리학 · 성격 여섯 축 테스트</div>
    <h1>열꽃 8인 중에<br>나랑 <span class="hl">제일 닮은</span> 사람은?</h1>
    <p class="lead">24문항, 3분이면 끝나요. 유형 하나로 자르지 않고, 내 성격 여섯 축의 모양이 누구와 몇 % 겹치는지 보여 드려요.</p>
    <div class="grid8">${Object.entries(CH).map(([id,c])=>`<figure><div class="tile" style="--c:${c.c}"><img src="${img(id)}" alt=""></div><figcaption>${c.name}</figcaption></figure>`).join('')}</div>
    <div class="proof" id="proof"></div>
    <button class="btn" id="go">${resume?'이어서 하기':'시작하기'}</button>
    ${resume?'<button class="btn ghost" id="reset">처음부터 다시</button>':''}
    <p class="note">진단이 아니라 재미로 보는 성격 축 프로필이에요. 성격은 유형이 아니라 정도라서, 같은 사람도 축마다 높고 낮은 자리가 다 달라요. 이름이나 연락처는 받지 않아요.</p>`;
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
  const u=scoreAxes(ans), m=match(u), top=m[0], sec=m[1], c=CH[top.id], nb=neighbours(top.id), compat=COMPAT[top.id], mate=CH[compat.id];
  document.documentElement.style.setProperty('--acc',c.c);
  if(fresh){
    send({v:VERSION,sid:sid(),from:FROM,friend:FRIEND||'',top:top.id,top_pct:top.pct,second:sec.id,
          scores:u,match:Object.fromEntries(m.map(r=>[r.id,r.pct])),answers:ans,
          secs:startedAt?Math.round((Date.now()-startedAt)/1000):null,mobile:/Mobi|Android/i.test(navigator.userAgent)});
    store.set('last',{id:top.id,pct:top.pct});
  }
  const base = location.href.split('?')[0].split('#')[0].replace(/[^/]*$/,'');
  const share = `${base}r/${top.id}.html`;
  const pctLine = top.pct>=90?'거의 쌍둥이 수준이에요.':(top.pct>=75?'꽤 많이 닮았어요.':(top.pct>=50?'은근히 닮은 데가 많아요.':'8명 모두와 조금씩 달라요. 그중 가장 가까운 사람이에요.'));
  const f = FRIEND ? CH[FRIEND] : null;
  const friendLine = !f ? '' : FRIEND===top.id
    ? `친구도 ${c.name}! 둘 다 같은 사람을 닮았어요. 말 안 해도 통하는 사이일지도 몰라요.`
    : FRIEND===nb.far
      ? `친구는 ${f.name}, 나는 ${c.name}. 성격 축이 정반대인 조합이에요. 자주 부딪혀도, 서로 못 보는 걸 대신 봐 줄 수 있어요.`
      : FRIEND===nb.near
        ? `친구는 ${f.name}, 나는 ${c.name}. 다른 사람이 나왔지만 성격 축 모양은 꽤 비슷한 조합이에요.`
        : `친구는 ${f.name}, 나는 ${c.name}. 서로 다른 사람을 닮은 조합이에요. 친구에게 「사실은…」 줄을 보여 주고 맞는지 물어보세요.`;
  app.innerHTML = `
    <div class="hero">
      <img src="${img(top.id)}" alt="${c.name}">
      <div class="who">${top.id}</div>
      <div class="eyebrow">${c.name}와 닮은 정도</div>
      <div class="pct">${top.pct}%</div>
      <h2>8명 중 <span style="white-space:nowrap">${c.name}와</span> 가장 닮았어요</h2>
      <p class="small" style="margin:4px 0 0;color:var(--muted)">${pctLine}</p>
      <p class="quote">「${esc(c.say)}」</p>
      <p class="small" id="share-of" style="margin:4px 0 0;color:var(--muted)"></p>
    </div>
    <div class="block"><h3>사실은…</h3><p>${esc(TWIST[top.id])}</p></div>
    <div class="block"><h3>${esc(c.name)}의 무기</h3><p>${esc(c.good)}</p></div>
    <div class="block"><h3>이럴 때 약해져요</h3><p>${esc(c.hard)}</p></div>
    <div class="block compat">
      <h3>${esc(c.name)}의 찰떡궁합</h3>
      <div class="compat-head"><img src="${img(compat.id)}" alt="${esc(mate.name)}"><div><strong>${esc(mate.name)}</strong><p>${esc(compat.why)}</p></div></div>
      <p class="compat-send">${esc(compat.send)}</p>
      <button class="btn ghost" id="compat-copy">친구는 누구랑 잘 맞을까?</button>
      <p class="toast" id="compat-toast"></p>
    </div>
    ${friendLine?`<div class="block"><h3>친구와 비교하면</h3><p>${esc(friendLine)}</p></div>`:''}
    <div class="pair">
      <div><img src="${img(nb.near)}" alt=""><p style="margin:0"><span>나랑 비슷한 사람</span><strong>${CH[nb.near].name}</strong></p></div>
      <div><img src="${img(nb.far)}" alt=""><p style="margin:0"><span>나랑 정반대인 사람</span><strong>${CH[nb.far].name}</strong></p></div>
    </div>
    <div class="sec"><h2>8인과 닮은 정도</h2>
      <div class="rank">${m.map(r=>`<div><img src="${img(r.id)}" alt=""><span>${CH[r.id].name}</span><em>${r.pct}%</em><div class="m"><i style="width:${r.pct}%;background:${CH[r.id].c}"></i></div></div>`).join('')}</div>
      <p class="lead small">두 번째로 가까운 사람은 ${CH[sec.id].name}(${sec.pct}%)예요.</p>
    </div>
    <div class="sec"><h2>내 성격 여섯 축</h2>
      ${AX.map(a=>{const L=lvl(u[a.k]); return `<div class="block axcard"><div class="axis"><div class="lab" style="justify-content:center"><strong>${a.name} · ${LV[L]}</strong></div><div class="scale"><i style="left:${(u[a.k]+1)*50}%"></i></div></div></div>`;}).join('')}
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
    <p class="note">짧은 재미용 검사라 다시 하면 바뀔 수 있어요.</p>
    `;
  document.getElementById('again').onclick=()=>{ ans=new Array(Q.length).fill(null); store.del('ans'); intro(); window.scrollTo({top:0}); };
  const line=`나는 열꽃 8인 중 ${c.name}와 ${top.pct}% 닮았대. 「${c.say}」 너는 누구랑 닮았어?\n${share}`;
  const compatLine=`나는 ${c.name}, 찰떡궁합은 ${mate.name}래. ${compat.send}\n${share}`;
  document.getElementById('compat-copy').onclick=()=>{
    const t=document.getElementById('compat-toast');
    (navigator.clipboard?navigator.clipboard.writeText(compatLine):Promise.reject()).then(()=>t.textContent='친구에게 보낼 문장과 링크를 복사했어요.').catch(()=>{ t.textContent=compatLine; });
  };
  document.getElementById('copy').onclick=()=>{
    const t=document.getElementById('toast');
    (navigator.clipboard?navigator.clipboard.writeText(line):Promise.reject()).then(()=>t.textContent='복사했어요. 카톡이나 댓글에 붙여 넣어 보세요.').catch(()=>{ t.textContent=line; });
  };
  loadStats().then(s=>{
    const el=document.getElementById('share-of');
    if(!el || !s || s.n<100 || !s.byTop) return;
    const counts=Object.keys(CH).map(id=>s.byTop[id]||0), count=s.byTop[top.id]||0;
    const p=Math.round(count/s.n*100), min=Math.min(...counts), max=Math.max(...counts);
    el.textContent = count===min
      ? `지금까지 참여한 사람 중 ${p}%만 ${c.name}가 나왔어요. 8명 중 가장 드문 결과예요.`
      : count===max
        ? `지금까지 참여한 사람 중 ${p}%가 ${c.name}였어요. 지금 가장 많이 나오는 결과예요.`
        : p<10
          ? `지금까지 참여한 사람 중 ${p}%만 ${c.name}가 나왔어요. 꽤 드문 결과예요.`
          : `지금까지 참여한 사람 중 ${p}%가 ${c.name}였어요.`;
  });
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
    g.fillStyle='#1E1B18'; g.font='900 52px "Noto Sans KR", sans-serif'; g.fillText(c.name+'와 가장 닮았어요', W/2, 770);
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
