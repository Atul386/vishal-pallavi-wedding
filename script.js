/* -----------------------------
   script.js - AI-style wedding UI
   - particles, typing, countdown
   - music control, lightbox, chat-RSVP
   ----------------------------- */

/* ---------- Config ---------- */
const COUPLE_TEXT = "Vishal & Pallavi"; // typed intro
const WEDDING_ISO = "2025-09-09T12:45:00"; // ISO date/time
const MUSIC_FADE_MS = 800;

/* ---------- Particle hearts (canvas) ---------- */
(function particles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let W = canvas.width = innerWidth;
  let H = canvas.height = innerHeight;
  const hearts = [];

  function resize() { W = canvas.width = innerWidth; H = canvas.height = innerHeight; }
  addEventListener('resize', resize);

  function Heart(x,y,size,vy,life,hue){
    this.x=x;this.y=y;this.size=size;this.vy=vy;this.life=life;this.hue=hue;
  }
  Heart.prototype.draw = function(){
    ctx.save();
    ctx.translate(this.x,this.y);
    ctx.rotate(Math.PI/4);
    ctx.fillStyle = `hsla(${this.hue},85%,65%,${Math.max(0, this.life/100)})`;
    ctx.fillRect(-this.size/2,-this.size/2,this.size,this.size);
    ctx.beginPath(); ctx.arc(-this.size/2, -this.size/2, this.size/2, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(this.size/2, -this.size/2, this.size/2, 0, Math.PI*2); ctx.fill();
    ctx.restore();
  };

  function spawn(){
    const x = Math.random()*W;
    const y = H + 20;
    const size = 8 + Math.random()*18;
    const vy = 1 + Math.random()*1.6;
    const life = 80 + Math.random()*80;
    const hue = 320 + Math.random()*40;
    hearts.push(new Heart(x,y,size,vy,life,hue));
    if(hearts.length>120) hearts.shift();
  }

  function update(){
    ctx.clearRect(0,0,W,H);
    for(let i=hearts.length-1;i>=0;i--){
      const h=hearts[i];
      h.y -= h.vy;
      h.life -= 0.6;
      h.x += Math.sin(h.life*0.02)*0.6;
      h.draw();
      if(h.life<=0) hearts.splice(i,1);
    }
    if(Math.random()<0.6) spawn();
    requestAnimationFrame(update);
  }
  update();
})();

/* ---------- Typing effect for couple name ---------- */
(function typing(){
  const el = document.getElementById('typed-name');
  const text = COUPLE_TEXT;
  let idx=0;
  const speed = 70;
  function tick(){
    idx++;
    el.textContent = text.slice(0,idx);
    if(idx < text.length) setTimeout(tick, speed);
    else {
      // small glow after finished
      el.style.textShadow = "0 6px 40px rgba(255,103,176,0.3)";
    }
  }
  setTimeout(tick, 600);
})();

/* ---------- Countdown ---------- */
(function countdown(){
  const el = document.getElementById('countdown');
  const target = new Date(WEDDING_ISO).getTime();

  function update(){
    const now = Date.now();
    let diff = target - now;
    if(diff <= 0){ el.innerHTML = "🎊 Happily Married 🎊"; clearInterval(timer); return; }
    const days = Math.floor(diff / (1000*60*60*24));
    diff -= days*(1000*60*60*24);
    const hours = Math.floor(diff/(1000*60*60));
    diff -= hours*(1000*60*60);
    const mins = Math.floor(diff/(1000*60));
    diff -= mins*(1000*60);
    const secs = Math.floor(diff/1000);
    el.innerHTML = `⏳ ${days}d ${hours}h ${mins}m ${secs}s`;
  }
  update();
  const timer = setInterval(update, 1000);
})();

/* ---------- Music control (fade) ---------- */
(function music(){
  const audio = document.getElementById('bg-music');
  const btn = document.getElementById('music-toggle');
  let volTarget = 0.35;
  audio.volume = 0;
  let playing = false;

  function fadeTo(target,ms){
    const start = audio.volume;
    const startTime = Date.now();
    const step = () => {
      const t = Math.min(1,(Date.now()-startTime)/ms);
      audio.volume = start + (target-start)*t;
      if(t<1) requestAnimationFrame(step);
      else {
        if(target===0) audio.pause();
        else audio.play().catch(()=>{}); // play attempt (may be blocked until user interacts on mobile)
      }
    };
    if(target>0) audio.play().catch(()=>{});
    step();
  }

  btn.addEventListener('click', ()=>{
    if(!playing){
      fadeTo(volTarget, MUSIC_FADE_MS);
      btn.textContent = "🔈";
    } else {
      fadeTo(0, MUSIC_FADE_MS);
      btn.textContent = "🔇";
    }
    playing = !playing;
  });

  // try auto start quietly (some browsers block autoplay)
  setTimeout(()=> {
    fadeTo(0.0, 10); // keep silent until user interacts
    btn.textContent = "🔇";
  }, 200);
})();

/* ---------- Lightbox for gallery ---------- */
(function lightbox(){
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-img');
  const close = document.getElementById('lightbox-close');

  document.querySelectorAll('.masonry img').forEach(img=>{
    img.addEventListener('click', ()=>{
      lbImg.src = img.dataset.full || img.src;
      lb.hidden = false;
      lb.style.display = "flex";
    });
  });
  close.addEventListener('click', ()=>{ lb.hidden=true; lb.style.display="none"; });
  lb.addEventListener('click', (e)=>{ if(e.target===lb) { lb.hidden=true; lb.style.display="none"; } });
})();

/* ---------- Chat-style RSVP assistant ---------- */
(function chatRSVP(){
  const chat = document.getElementById('chat');
  const form = document.getElementById('chat-form');
  const input = document.getElementById('chat-input');

  // simple state machine
  let stage = 0;
  const record = { name:'', attend:'', message:'' };
  const rsvps = JSON.parse(localStorage.getItem('ai_rsvps')||'[]');

  function bot(msg){
    const d = document.createElement('div'); d.className='bot-message'; d.textContent=msg;
    chat.appendChild(d); chat.scrollTop = chat.scrollHeight;
  }
  function user(msg){
    const d = document.createElement('div'); d.className='user-message'; d.textContent=msg;
    chat.appendChild(d); chat.scrollTop = chat.scrollHeight;
  }

  // initial prompt already in HTML; stage=0 -> ask name
  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const text = input.value.trim(); if(!text) return;
    user(text);

    if(stage===0){
      record.name = text;
      stage = 1;
      setTimeout(()=> bot(`Lovely, ${record.name}! Will you attend? (Yes / No / Maybe)`), 700);
    } else if(stage===1){
      record.attend = text;
      stage = 2;
      setTimeout(()=> bot(`Wonderful — any message you'd like to share with Vishal & Pallavi?`), 600);
    } else if(stage===2){
      record.message = text;
      // save RSVP
      rsvps.push({ name: record.name, attend: record.attend, message: record.message, time: new Date().toISOString() });
      localStorage.setItem('ai_rsvps', JSON.stringify(rsvps));
      stage = 3;
      setTimeout(()=> bot(`Thanks ${record.name}! Your RSVP is recorded. We'll see you soon 💐`), 700);
      // reset record for next guest
      setTimeout(()=> {
        stage = 0;
        record.name=''; record.attend=''; record.message='';
        setTimeout(()=> bot(`If someone else wants to RSVP, they can type their name.`), 900);
      }, 1200);
    }
    input.value = '';
  });

  // export RSVPs
  document.getElementById('export-rsvps').addEventListener('click', ()=>{
    const arr = JSON.parse(localStorage.getItem('ai_rsvps')||'[]');
    if(!arr.length){ alert('No RSVPs yet.'); return; }
    const rows = [['Name','Attend','Message','Time']];
    arr.forEach(r=> rows.push([r.name,r.attend,r.message,r.time]));
    const csv = rows.map(r=> r.map(c=> `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'rsvps.csv'; a.click();
    URL.revokeObjectURL(url);
  });
})();

/* ---------- Guest Wishes ---------- */
(function wishes(){
  const input = document.getElementById('wish-input');
  const btn = document.getElementById('wish-send');
  const list = document.getElementById('wish-list');
  const stored = JSON.parse(localStorage.getItem('wishes')||'[]');
  stored.forEach(w=> {
    const li = document.createElement('li'); li.textContent = w; list.appendChild(li);
  });

  btn.addEventListener('click', ()=>{
    const val = input.value.trim();
    if(!val) return;
    const li = document.createElement('li'); li.textContent = val;
    list.prepend(li);
    input.value = '';
    stored.unshift(val);
    localStorage.setItem('wishes', JSON.stringify(stored));
  });
})();



