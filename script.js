(function(){
'use strict';

/* ── PARTICLES ── */
var pc = document.getElementById('particles');
for(var i=0;i<35;i++){
  var p=document.createElement('div');
  p.className='p';
  p.style.cssText='left:'+Math.random()*100+'%;animation-duration:'+(8+Math.random()*14)+'s;animation-delay:-'+(Math.random()*14)+'s;--dx:'+(Math.random()*80-40)+'px;width:'+(1+Math.random()*2)+'px;height:'+(1+Math.random()*2)+'px;opacity:.7';
  pc.appendChild(p);
}

/* ── AUTH (localStorage) ── */
var users = JSON.parse(localStorage.getItem('notx_users')||'{}');
var session = localStorage.getItem('notx_session')||null;

function saveUsers(){ localStorage.setItem('notx_users', JSON.stringify(users)); }
function saveSession(e){ session=e; if(e) localStorage.setItem('notx_session',e); else localStorage.removeItem('notx_session'); }

function updateNavUser(){
  var navBtn  = document.getElementById('navAuthBtn');
  var navUser = document.getElementById('navUser');
  if(session && users[session]){
    var u = users[session];
    navBtn.style.display  = 'none';
    navUser.style.display = 'inline';
    navUser.textContent   = u.first + ' ' + u.last;
  } else {
    navBtn.style.display  = 'inline-block';
    navUser.style.display = 'none';
  }
}

function showAuthWelcome(){
  document.getElementById('authTabs').style.display    = 'none';
  document.getElementById('tabLogin').style.display    = 'none';
  document.getElementById('tabRegister').style.display = 'none';
  document.getElementById('authWelcome').style.display = 'block';
  var u = users[session];
  document.getElementById('authWelcomeName').textContent = 'Bonjour, ' + u.first + ' ' + u.last + ' !';
}

function showAuthForms(){
  document.getElementById('authTabs').style.display    = 'flex';
  document.getElementById('tabLogin').style.display    = 'block';
  document.getElementById('tabRegister').style.display = 'none';
  document.getElementById('authWelcome').style.display = 'none';
  document.querySelectorAll('.auth-tab').forEach(function(t){ t.classList.toggle('on', t.dataset.tab==='login'); });
}

updateNavUser();

/* ── OVERLAYS ── */
function openOv(el) { el.classList.add('open');    document.body.style.overflow='hidden'; }
function closeOv(el){ el.classList.remove('open'); document.body.style.overflow=''; }

/* ── AUTH MODAL open/close ── */
document.getElementById('navAuthBtn').addEventListener('click', function(){
  if(session && users[session]) showAuthWelcome(); else showAuthForms();
  openOv(document.getElementById('authOverlay'));
});
document.getElementById('navUser').addEventListener('click', function(){
  showAuthWelcome();
  openOv(document.getElementById('authOverlay'));
});
document.getElementById('authClose').addEventListener('click', function(){ closeOv(document.getElementById('authOverlay')); });
document.getElementById('authOverlay').addEventListener('click', function(e){ if(e.target===this) closeOv(this); });

/* ── TABS ── */
document.querySelectorAll('.auth-tab').forEach(function(tab){
  tab.addEventListener('click', function(){
    document.querySelectorAll('.auth-tab').forEach(function(t){ t.classList.remove('on'); });
    tab.classList.add('on');
    document.getElementById('tabLogin').style.display    = tab.dataset.tab==='login'    ? 'block' : 'none';
    document.getElementById('tabRegister').style.display = tab.dataset.tab==='register' ? 'block' : 'none';
  });
});

/* ── REGISTER ── */
document.getElementById('rSubmit').addEventListener('click', function(){
  var first = document.getElementById('rFirst').value.trim();
  var last  = document.getElementById('rLast').value.trim();
  var email = document.getElementById('rEmail').value.trim();
  var dob   = document.getElementById('rDob').value;
  var pass  = document.getElementById('rPass').value;
  var errE  = document.getElementById('rEmailErr');
  var errP  = document.getElementById('rErr');
  errE.style.display='none'; errP.style.display='none';
  if(!first||!last||!dob||!pass){ errP.textContent='Remplissez tous les champs.'; errP.style.display='block'; return; }
  if(!email.endsWith('@gmail.com')){ errE.style.display='block'; return; }
  if(users[email]){ errP.textContent='Ce compte existe déjà.'; errP.style.display='block'; return; }
  if(pass.length < 6){ errP.textContent='Mot de passe trop court (6 min).'; errP.style.display='block'; return; }
  users[email] = {first:first, last:last, email:email, dob:dob, pass:pass};
  saveUsers();
  saveSession(email);
  updateNavUser();
  showAuthWelcome();
});

/* ── LOGIN ── */
document.getElementById('lSubmit').addEventListener('click', function(){
  var email = document.getElementById('lEmail').value.trim();
  var pass  = document.getElementById('lPass').value;
  var err   = document.getElementById('lErr');
  err.style.display='none';
  if(!email||!pass){ err.textContent='Remplissez tous les champs.'; err.style.display='block'; return; }
  if(!users[email]||users[email].pass!==pass){ err.textContent='Email ou mot de passe incorrect.'; err.style.display='block'; return; }
  saveSession(email);
  updateNavUser();
  showAuthWelcome();
});

/* ── LOGOUT ── */
document.getElementById('btnLogout').addEventListener('click', function(){
  saveSession(null);
  updateNavUser();
  showAuthForms();
});

/* ── PRODUCT MODAL ── */
var cur=null, selSize=null, selColor=null, qty=1;
var isLimitedProduct=false, isLimitedHoodie=false, limitedText='Bleu', limitedFront='Avec texte devant';
var pOverlay = document.getElementById('pOverlay');
var mMain    = document.getElementById('mMain');
var mThumbs  = document.getElementById('mThumbs');
var qVal     = document.getElementById('qVal');
var mErr     = document.getElementById('mErr');



function makeFilledThumbSrc(src, done){
  var img = new Image();
  img.onload = function(){
    try{
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      var probe = document.createElement('canvas');
      probe.width = w;
      probe.height = h;
      var pctx = probe.getContext('2d', { willReadFrequently:true });
      pctx.drawImage(img,0,0,w,h);
      var px = pctx.getImageData(0,0,w,h).data;

      function sample(x,y){ var i=(Math.max(0,Math.min(h-1,y))*w+Math.max(0,Math.min(w-1,x)))*4; return [px[i],px[i+1],px[i+2],px[i+3]]; }
      var pts=[sample(3,3),sample(w-4,3),sample(3,h-4),sample(w-4,h-4),sample(Math.floor(w/2),3),sample(Math.floor(w/2),h-4)];
      var bg=[0,0,0];
      pts.forEach(function(c){ bg[0]+=c[0]; bg[1]+=c[1]; bg[2]+=c[2]; });
      bg[0]/=pts.length; bg[1]/=pts.length; bg[2]/=pts.length;

      // On ignore volontairement le petit logo du haut et le texte du bas :
      // la miniature doit montrer clairement le vêtement, sans déborder.
      var scanX0=Math.floor(w*0.04), scanX1=Math.ceil(w*0.96);
      var scanY0=Math.floor(h*0.10), scanY1=Math.ceil(h*0.84);
      var minX=w,minY=h,maxX=0,maxY=0,found=false;
      for(var y=scanY0;y<scanY1;y+=2){
        for(var x=scanX0;x<scanX1;x+=2){
          var i=(y*w+x)*4;
          var a=px[i+3];
          if(a<20) continue;
          var r=px[i], g=px[i+1], b=px[i+2];
          var d=Math.abs(r-bg[0])+Math.abs(g-bg[1])+Math.abs(b-bg[2]);
          var dark=(r+g+b)/3 < 238;
          var edgeLike=d>16 || dark;
          if(edgeLike){
            if(x<minX)minX=x; if(x>maxX)maxX=x;
            if(y<minY)minY=y; if(y>maxY)maxY=y;
            found=true;
          }
        }
      }
      if(!found){
        minX=Math.floor(w*0.08); maxX=Math.ceil(w*0.92);
        minY=Math.floor(h*0.12); maxY=Math.ceil(h*0.82);
      }

      var bw=maxX-minX, bh=maxY-minY;
      var padX=bw*0.07, padY=bh*0.08;
      minX=Math.max(0,minX-padX); maxX=Math.min(w,maxX+padX);
      minY=Math.max(0,minY-padY); maxY=Math.min(h,maxY+padY);
      bw=maxX-minX; bh=maxY-minY;

      var size=320;
      var canvas=document.createElement('canvas');
      canvas.width=size; canvas.height=size;
      var ctx=canvas.getContext('2d');
      ctx.fillStyle='rgb('+Math.round(bg[0])+','+Math.round(bg[1])+','+Math.round(bg[2])+')';
      ctx.fillRect(0,0,size,size);

      // Remplit bien la case, mais laisse une marge de sécurité pour ne jamais couper manches/capuche.
      var inner=size*0.90;
      var scale=Math.min(inner/bw, inner/bh);
      var dw=bw*scale, dh=bh*scale;
      var dx=(size-dw)/2, dy=(size-dh)/2;
      ctx.imageSmoothingEnabled=true;
      ctx.imageSmoothingQuality='high';
      ctx.drawImage(img,minX,minY,bw,bh,dx,dy,dw,dh);
      done(canvas.toDataURL('image/png'));
    }catch(e){ done(src); }
  };
  img.onerror = function(){ done(src); };
  img.src = src;
}
function applyFilledThumb(imgEl, fullSrc){
  imgEl.classList.add('filled-thumb');
  imgEl.decoding='async';
  makeFilledThumbSrc(fullSrc, function(thumbSrc){ imgEl.src = thumbSrc; });
}

function syncThumbs(c){ mThumbs.querySelectorAll('.m-thumb').forEach(function(t){ t.classList.toggle('on',t.dataset.color===c); }); }
function syncSwatches(c){ document.querySelectorAll('.col-btn').forEach(function(b){ b.classList.toggle('on',b.dataset.color===c); }); }

var hoodieSizeCharts = {
  'Blanc': 'assets/hoodies/size-chart-white.png',
  'Noir': 'assets/hoodies/size-chart-black.png'
};
function isHoodieModal(){
  return !!(cur && /assets\/hoodies\//.test(String(cur.blanc || '') + String(cur.noir || '')));
}
function currentSizeChart(){
  return hoodieSizeCharts[selColor || 'Blanc'] || hoodieSizeCharts.Blanc;
}
function refreshHoodieSizeThumb(){
  var chart = mThumbs.querySelector('.m-thumb-size');
  if(chart) chart.src = currentSizeChart();
}
function setRegularMainByColor(color){
  if(!cur) return;
  selColor = color;
  syncSwatches(color);
  syncThumbs(color);
  refreshHoodieSizeThumb();
  mMain.src = color === 'Noir' ? cur.noir : cur.blanc;
}
function setRegularMainToSizeChart(){
  if(!isHoodieModal()) return;
  var color = selColor || 'Blanc';
  syncSwatches(color);
  mThumbs.querySelectorAll('.m-thumb').forEach(function(t){ t.classList.toggle('on', t.dataset.role === 'size'); });
  mMain.src = currentSizeChart();
}


document.querySelectorAll('.card:not(.coming-card):not(.exclusive-card)').forEach(function(card){
  card.addEventListener('click', function(){
    var imgW=card.querySelector('.img-w'), imgB=card.querySelector('.img-b');
    isLimitedProduct=false; isLimitedHoodie=false; document.body.classList.remove('limited-product-open','limited-hoodie-open'); document.getElementById('limitedExtra').style.display='none'; var lfg=document.getElementById('limitedFrontGroup'); if(lfg) lfg.style.display='block';
    cur={name:card.querySelector('.card-name').textContent, price:card.querySelector('.card-price').textContent, blanc:imgW?imgW.src:'', noir:imgB?imgB.src:''};
    selSize=null; selColor=null; qty=1;
    qVal.textContent='1'; mErr.style.display='none';
    document.getElementById('mName').textContent=cur.name;
    document.getElementById('mPrice').textContent=cur.price;
    selColor='Blanc';
    mMain.src=cur.blanc;
    mThumbs.innerHTML='';
    [['Blanc',cur.blanc],['Noir',cur.noir]].forEach(function(p,idx){
      var t=document.createElement('img');
      t.src=p[1]; t.alt=p[0]; t.className='m-thumb'+(idx===0?' on':''); t.dataset.color=p[0]; t.dataset.role='color'; applyFilledThumb(t,p[1]);
      t.addEventListener('click', function(){ setRegularMainByColor(p[0]); });
      mThumbs.appendChild(t);
    });
    if(isHoodieModal()){
      var st=document.createElement('img');
      st.src=currentSizeChart(); st.alt='Guide des tailles'; st.className='m-thumb m-thumb-size'; st.dataset.role='size';
      st.addEventListener('click', setRegularMainToSizeChart);
      mThumbs.appendChild(st);
    }
    document.querySelectorAll('.sz').forEach(function(b){ b.classList.remove('on'); });
    document.querySelectorAll('.col-btn').forEach(function(b){ b.classList.remove('on'); });
    openOv(pOverlay);
  });
});
document.getElementById('mClose').addEventListener('click', function(){ closeOv(pOverlay); document.body.classList.remove('limited-product-open','limited-hoodie-open'); });
pOverlay.addEventListener('click', function(e){ if(e.target===pOverlay) closeOv(pOverlay); });

document.querySelectorAll('.sz').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.sz').forEach(function(b){ b.classList.remove('on'); });
    btn.classList.add('on'); selSize=btn.dataset.size;
  });
});
document.querySelectorAll('.col-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    selColor=btn.dataset.color;
    syncSwatches(selColor);
    syncThumbs(selColor);
    if(isLimitedHoodie){
      setHoodieLimitedImages(selColor);
    } else if(isLimitedProduct){
      updateLimitedGallery();
    } else if(cur){
      setRegularMainByColor(selColor);
    }
  });
});
document.getElementById('qMinus').addEventListener('click', function(){ if(qty>1){ qty--; qVal.textContent=qty; } });
document.getElementById('qPlus').addEventListener('click',  function(){ if(qty<10){ qty++; qVal.textContent=qty; } });


/* ── LIMITED T-SHIRT IN SECOND EXCLUSIVE CARD ── */
var limitedImages = {
  // Photos t-shirt NEW GEN (fond loup/lune). Ne jamais pointer vers hoodie-limited ici.
  'Blanc|Bleu|Avec texte devant': 'assets/limited/12.png',
  'Noir|Bleu|Avec texte devant': 'assets/limited/8.png',
  'Blanc|Rouge|Avec texte devant': 'assets/limited/11.png',
  'Noir|Rouge|Avec texte devant': 'assets/limited/7.png',
  'Blanc|Bleu|Sans texte devant': 'assets/limited/10.png',
  'Noir|Bleu|Sans texte devant': 'assets/limited/6.png',
  'Blanc|Rouge|Sans texte devant': 'assets/limited/9.png',
  'Noir|Rouge|Sans texte devant': 'assets/limited/5.png'
};
var limitedThumbImages = {
  'assets/limited/12.png': 'assets/limited/12.png',
  'assets/limited/8.png': 'assets/limited/8.png',
  'assets/limited/11.png': 'assets/limited/11.png',
  'assets/limited/7.png': 'assets/limited/7.png',
  'assets/limited/10.png': 'assets/limited/10.png',
  'assets/limited/9.png': 'assets/limited/9.png',
  'assets/limited/5.png': 'assets/limited/5.png',
  'assets/limited/6.png': 'assets/limited/6.png'
};
function limitedThumbSrc(src){
  return limitedThumbImages[String(src).replace(location.origin + '/', '')] || limitedThumbImages[String(src)] || src;
}

var hoodieLimitedImages = {
  'Noir|Rouge': 'assets/hoodie-limited/1.png',
  'Noir|Bleu': 'assets/hoodie-limited/2.png',
  'Blanc|Rouge': 'assets/hoodie-limited/3.png',
  'Blanc|Bleu': 'assets/hoodie-limited/4.png'
};
function hoodieLimitedKey(color){ return color+'|'+limitedText; }
function setHoodieLimitedImages(chosen){
  if(!cur) return;
  cur.blanc = hoodieLimitedImages[hoodieLimitedKey('Blanc')];
  cur.noir  = hoodieLimitedImages[hoodieLimitedKey('Noir')];
  selColor = chosen || selColor || 'Blanc';
  syncSwatches(selColor);
  mMain.src = selColor === 'Noir' ? cur.noir : cur.blanc;
  mThumbs.innerHTML='';
  [['Blanc',cur.blanc],['Noir',cur.noir]].forEach(function(p){
    var t=document.createElement('img');
    t.src=p[1];
    t.alt='Pull limité '+p[0]+' texte '+limitedText.toLowerCase();
    t.className='m-thumb limited-thumb'+(p[0]===selColor?' on':'');
    t.dataset.color=p[0];
    t.addEventListener('click', function(){
      selColor=p[0];
      mMain.src=p[1];
      syncThumbs(p[0]);
      syncSwatches(p[0]);
    });
    mThumbs.appendChild(t);
  });
}
function limitedKey(color){ return color+'|'+limitedText+'|'+limitedFront; }
function updateLimitedGallery(){
  if(!isLimitedProduct) return;
  cur.blanc = limitedImages[limitedKey('Blanc')];
  cur.noir  = limitedImages[limitedKey('Noir')];
  var chosen = selColor || 'Blanc';
  mMain.src = chosen === 'Noir' ? cur.noir : cur.blanc;
  mThumbs.innerHTML='';
  [['Blanc',cur.blanc],['Noir',cur.noir]].forEach(function(p){
    var t=document.createElement('img');
    t.src=limitedThumbSrc(p[1]);
    t.alt='T-shirt limité '+p[0];
    t.className='m-thumb limited-thumb'+(p[0]===chosen?' on':'');
    t.dataset.color=p[0];
    t.dataset.full=p[1];
    t.addEventListener('click', function(){ selColor=p[0]; mMain.src=p[1]; syncThumbs(p[0]); syncSwatches(p[0]); });
    mThumbs.appendChild(t);
  });
  syncThumbs(chosen); syncSwatches(chosen);
}

var hoodieLimitedCard=document.getElementById('openHoodieLimitedModal');
if(hoodieLimitedCard){
  var hoodieLimitedBtn = hoodieLimitedCard.querySelector('.card-cta');
  function openHoodieLimitedModal(ev){
    if(ev) ev.stopPropagation();
    isLimitedProduct=true;
    isLimitedHoodie=true;
    limitedText='Bleu';
    limitedFront='Avec texte devant';
    selSize=null;
    selColor='Blanc';
    qty=1;
    document.body.classList.add('limited-product-open','limited-hoodie-open');
    document.getElementById('limitedExtra').style.display='block';
    var frontGroup=document.getElementById('limitedFrontGroup');
    if(frontGroup) frontGroup.style.display='none';
    qVal.textContent='1';
    mErr.style.display='none';
    document.getElementById('mName').textContent='Pull limité BORZ';
    document.getElementById('mPrice').textContent='49,99 €';
    document.getElementById('mBuy').innerHTML='Commander &mdash; 49,99 &euro;';
    cur={name:'Pull limité BORZ', price:'49,99 €', blanc:'', noir:''};
    document.querySelectorAll('.sz').forEach(function(b){ b.classList.remove('on'); });
    document.querySelectorAll('.limited-choice').forEach(function(b){ b.classList.remove('on'); });
    var blueBtn=document.querySelector('[data-text="Bleu"]');
    if(blueBtn) blueBtn.classList.add('on');
    setHoodieLimitedImages('Blanc');
    openOv(pOverlay);
  }
  if(hoodieLimitedBtn) hoodieLimitedBtn.addEventListener('click', function(ev){ ev.preventDefault(); ev.stopPropagation(); openHoodieLimitedModal(ev); });
  hoodieLimitedCard.addEventListener('click', function(ev){
    if(ev.target.closest('.limited-option, .limited-choice, .sz, .col-btn')) return;
    openHoodieLimitedModal(ev);
  });
}

var limitedCard=document.getElementById('openLimitedModal');
if(limitedCard){
  limitedCard.addEventListener('click', function(){
    isLimitedProduct=true; isLimitedHoodie=false; limitedText='Bleu'; limitedFront='Avec texte devant'; selSize=null; selColor='Blanc'; qty=1;
    document.body.classList.remove('limited-hoodie-open');
    document.body.classList.add('limited-product-open');
    document.getElementById('limitedExtra').style.display='block';
    var frontGroup=document.getElementById('limitedFrontGroup');
    if(frontGroup) frontGroup.style.display='block';
    qVal.textContent='1'; mErr.style.display='none';
    document.getElementById('mName').textContent='T-shirt limité';
    document.getElementById('mPrice').textContent='49,99 €';
    cur={name:'T-shirt limité', price:'49,99 €', blanc:'', noir:''};
    document.querySelectorAll('.sz').forEach(function(b){ b.classList.remove('on'); });
    document.querySelectorAll('.limited-choice').forEach(function(b){ b.classList.remove('on'); });
    document.querySelector('[data-text="Bleu"]').classList.add('on');
    document.querySelector('[data-front="Avec texte devant"]').classList.add('on');
    updateLimitedGallery();
    openOv(pOverlay);
  });
}
document.querySelectorAll('[data-text]').forEach(function(btn){
  btn.addEventListener('click', function(){
    limitedText=btn.dataset.text;
    document.querySelectorAll('[data-text]').forEach(function(b){ b.classList.remove('on'); });
    btn.classList.add('on');
    if(isLimitedHoodie){
      setHoodieLimitedImages(selColor || 'Blanc');
    } else {
      updateLimitedGallery();
    }
  });
});
document.querySelectorAll('[data-front]').forEach(function(btn){
  btn.addEventListener('click', function(){
    limitedFront=btn.dataset.front;
    document.querySelectorAll('[data-front]').forEach(function(b){ b.classList.remove('on'); });
    btn.classList.add('on');
    updateLimitedGallery();
  });
});

/* ── CHECKOUT MODAL ── */
var ckOverlay = document.getElementById('ckOverlay');
document.getElementById('mBuy').addEventListener('click', function(){
  if(!selSize||!selColor){ mErr.style.display='block'; return; }
  mErr.style.display='none';
  var limitedLine = isLimitedHoodie ? (' — Texte '+limitedText.toLowerCase()) : (isLimitedProduct ? (' — Texte '+limitedText.toLowerCase()+', '+limitedFront.toLowerCase()) : '');
  document.getElementById('ckSum').textContent=cur.name+' — '+selColor+limitedLine+', Taille '+selSize+' × '+qty+' — '+cur.price;
  document.getElementById('ckForm').style.display='block';
  document.getElementById('ckSuccess').style.display='none';
  ['fEmail','fName','fPhone','fAddr'].forEach(function(id){ document.getElementById(id).value=''; });
  document.getElementById('fEmailErr').style.display='none';
  // Pre-fill email if logged in
  if(session && users[session]) document.getElementById('fEmail').value=session;
  openOv(ckOverlay);
});
document.getElementById('ckClose').addEventListener('click', function(){ closeOv(ckOverlay); });
ckOverlay.addEventListener('click', function(e){ if(e.target===ckOverlay) closeOv(ckOverlay); });

document.getElementById('fSubmit').addEventListener('click', function(){
  var email=document.getElementById('fEmail').value.trim();
  var name=document.getElementById('fName').value.trim();
  var phone=document.getElementById('fPhone').value.trim();
  var addr=document.getElementById('fAddr').value.trim();
  var errEl=document.getElementById('fEmailErr');
  var btn=document.getElementById('fSubmit');
  errEl.style.display='none';
  if(!email.endsWith('@gmail.com')){ errEl.style.display='block'; return; }
  if(!name||!phone||!addr) return;
  btn.disabled=true; btn.textContent='Envoi en cours…';
  function done(){ document.getElementById('ckForm').style.display='none'; document.getElementById('ckSuccess').style.display='block'; }
  if(typeof emailjs!=='undefined'){
    emailjs.send('service_i00q2lj','template_abjvqzw',{product_name:(isLimitedHoodie ? cur.name+' - Texte '+limitedText : (isLimitedProduct ? cur.name+' - Texte '+limitedText+' - '+limitedFront : cur.name)),color:selColor,size:selSize,quantity:qty,price:cur.price,client_name:name,client_email:email,client_phone:phone,client_address:addr})
    .then(done).catch(function(){ btn.disabled=false; btn.textContent='Confirmer la commande'; errEl.textContent='Erreur. Réessayez.'; errEl.style.display='block'; });
  } else { done(); }
});

})();


// ── COLLECTION VIDEO AUTOPLAY + PAUSE ──
const collectionVideo = document.getElementById('collectionVideo');
const videoToggle = document.getElementById('videoToggle');

if (collectionVideo && videoToggle) {
  collectionVideo.muted = false;
  collectionVideo.volume = 1;

  const updateVideoButton = () => {
    videoToggle.textContent = collectionVideo.paused ? 'Play' : 'Pause';
    videoToggle.setAttribute(
      'aria-label',
      collectionVideo.paused ? 'Lancer la vidéo' : 'Mettre la vidéo en pause'
    );
  };

  const startVideo = () => {
    collectionVideo.muted = false;
    collectionVideo.volume = 1;
    collectionVideo.play().then(updateVideoButton).catch(() => {
      videoToggle.textContent = 'Play';
    });
  };

  window.addEventListener('load', startVideo);

  videoToggle.addEventListener('click', () => {
    if (collectionVideo.paused) {
      startVideo();
    } else {
      collectionVideo.pause();
      updateVideoButton();
    }
  });

  collectionVideo.addEventListener('play', updateVideoButton);
  collectionVideo.addEventListener('pause', updateVideoButton);
}


/* ── LIQUID GLASS INTERACTIONS ── */
(function(){
  'use strict';
  var liquidTargets = '.card,.hero-btn,.nav-login,.video-toggle,.card-cta,.sz,.qty-btn,.btn-buy,.btn-submit,.btn-pp,.btn-logout,.auth-tab,.col-btn';

  function setPointerVars(el, ev){
    var r = el.getBoundingClientRect();
    var x = ((ev.clientX - r.left) / Math.max(r.width, 1)) * 100;
    var y = ((ev.clientY - r.top) / Math.max(r.height, 1)) * 100;
    el.style.setProperty('--mx', x + '%');
    el.style.setProperty('--my', y + '%');
  }

  document.addEventListener('pointermove', function(ev){
    var el = ev.target.closest('.card,.collection-video-wrap,.modal,.ck-box,.auth-box,.values-inner > *');
    if(el) setPointerVars(el, ev);
  }, {passive:true});

  document.addEventListener('pointerdown', function(ev){
    var el = ev.target.closest(liquidTargets);
    if(!el) return;

    var r = el.getBoundingClientRect();
    var rx = (ev.clientX - r.left) + 'px';
    var ry = (ev.clientY - r.top) + 'px';
    el.style.setProperty('--rx', rx);
    el.style.setProperty('--ry', ry);
    setPointerVars(el, ev);

    var ripple = document.createElement('span');
    ripple.className = 'liquid-ripple';
    ripple.style.setProperty('--rx', rx);
    ripple.style.setProperty('--ry', ry);
    el.appendChild(ripple);
    window.setTimeout(function(){ ripple.remove(); }, 760);

    if(el.classList.contains('card')){
      el.classList.remove('is-pressing');
      void el.offsetWidth;
      el.classList.add('is-pressing');
      window.setTimeout(function(){ el.classList.remove('is-pressing'); }, 560);
    }
  });
})();

/* ── NOT FROM TEXAS MARQUEE — smooth JS loop ── */
(function(){
  'use strict';
  var row = document.querySelector('.notx-marquee-row');
  if(!row) return;

  var x = 0;
  var speed = 22; // pixels per second; smaller = slower
  var last = performance.now();

  function loopWidth(){
    var first = row.querySelector('.notx-marquee-track');
    return first ? first.scrollWidth : 0;
  }

  function frame(now){
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    var width = loopWidth();
    x -= speed * dt;
    if(width && Math.abs(x) >= width) x += width;

    row.style.transform = 'translate3d(' + x + 'px,0,0)';
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
})();


// ── EXCLUSIVE COUNTDOWN ──
(function(){
  const main = document.getElementById('dropCountdown');
  const copies = document.querySelectorAll('.drop-countdown-copy');
  if(!main) return;

  // Date modifiable facilement : compte à rebours de 30 jours à partir de la première visite.
  const saved = localStorage.getItem('notx_exclusive_drop_date');
  const target = saved ? new Date(saved) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if(!saved) localStorage.setItem('notx_exclusive_drop_date', target.toISOString());

  function two(n){ return String(n).padStart(2, '0'); }
  function render(){
    const diff = Math.max(0, target.getTime() - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    const txt = `${two(days)}J ${two(hours)}H ${two(mins)}M ${two(secs)}S`;
    main.textContent = txt;
    copies.forEach(el => el.textContent = txt);
  }
  render();
  setInterval(render, 1000);

/* === VRAI FIX FINAL MINIATURES: cadrage uniforme, rempli, sans ligne blanche === */
makeFilledThumbSrc = function(src, done){
  var img = new Image();
  img.onload = function(){
    try{
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      var canvas = document.createElement('canvas');
      var size = 360;
      canvas.width = size; canvas.height = size;
      var ctx = canvas.getContext('2d');

      // Fond propre qui remplit 100% du carré, aucune bande vide/ligne blanche.
      ctx.fillStyle = '#f2f2f0';
      ctx.fillRect(0,0,size,size);

      var sx, sy, sw, sh;
      if(String(src).indexOf('assets/limited/') !== -1){
        // Toutes les images limited ont le même format : cadrage fixe = rendu symétrique
        // pour blanc/noir, pulls/t-shirts, sans sauter plus haut/plus bas.
        var side = Math.min(w * 0.78, h * 0.90);
        sx = (w - side) / 2;
        sy = (h - side) / 2 + h * 0.015;
        sw = side; sh = side;
      } else {
        // Produits classiques/base64 : carré central stable, un peu zoomé mais sans crop violent.
        var side2 = Math.min(w, h) * 0.92;
        sx = (w - side2) / 2;
        sy = (h - side2) / 2;
        sw = side2; sh = side2;
      }

      // Sécurité pour ne jamais sortir de l'image.
      sx = Math.max(0, Math.min(w - sw, sx));
      sy = Math.max(0, Math.min(h - sh, sy));

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, size, size);
      done(canvas.toDataURL('image/png'));
    }catch(e){ done(src); }
  };
  img.onerror = function(){ done(src); };
  img.crossOrigin = 'anonymous';
  img.src = src;
};
applyFilledThumb = function(imgEl, fullSrc){
  imgEl.classList.add('filled-thumb');
  imgEl.decoding = 'async';
  imgEl.loading = 'eager';
  makeFilledThumbSrc(fullSrc, function(thumbSrc){ imgEl.src = thumbSrc; });
};


/* === CORRECTION PROPRE MINIATURES PRODUITS — remplies + alignées ===
   Remplace les anciens essais de crop. Cette version crée une vraie image
   miniature avec un cadrage commun pour Blanc/Noir et sans vide dans la case. */
makeFilledThumbSrc = function(src, done){
  var img = new Image();
  img.onload = function(){
    try{
      var w = img.naturalWidth || img.width;
      var h = img.naturalHeight || img.height;
      var isLimited = String(src).indexOf('assets/limited/') !== -1;
      var outW = 580;
      var outH = 340;
      var canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      var ctx = canvas.getContext('2d');

      var sx, sy, sw, sh;
      if(isLimited){
        /* Les mockups limited ont tous exactement le même gabarit.
           Crop fixe = le blanc et le noir restent parfaitement alignés.
           On enlève le logo du haut et le texte du bas, puis on garde les vêtements. */
        sx = w * 0.055;
        sy = h * 0.205;
        sw = w * 0.890;
        sh = h * 0.560;
      }else{
        /* Produits classiques : cadrage central stable. */
        var targetRatio = outW / outH;
        var srcRatio = w / h;
        if(srcRatio > targetRatio){
          sh = h * 0.86;
          sw = sh * targetRatio;
          sx = (w - sw) / 2;
          sy = h * 0.07;
        }else{
          sw = w * 0.90;
          sh = sw / targetRatio;
          sx = w * 0.05;
          sy = (h - sh) / 2;
        }
      }

      sx = Math.max(0, Math.min(w - sw, sx));
      sy = Math.max(0, Math.min(h - sh, sy));
      sw = Math.max(1, Math.min(w - sx, sw));
      sh = Math.max(1, Math.min(h - sy, sh));

      ctx.fillStyle = isLimited ? '#f2f2f0' : '#f3f3f1';
      ctx.fillRect(0, 0, outW, outH);
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
      done(canvas.toDataURL('image/png'));
    }catch(e){ done(src); }
  };
  img.onerror = function(){ done(src); };
  img.src = src;
};
applyFilledThumb = function(imgEl, fullSrc){
  imgEl.classList.add('filled-thumb');
  imgEl.decoding = 'async';
  imgEl.loading = 'eager';
  makeFilledThumbSrc(fullSrc, function(thumbSrc){ imgEl.src = thumbSrc; });
};

})();

/* ── LIMITED T-SHIRT OPTION SWITCHER ── */
document.querySelectorAll('.limited-tee-card').forEach(function(card){
  var options = card.querySelectorAll('.limited-option');
  var panels = card.querySelectorAll('.limited-views');
  options.forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var option = btn.dataset.limitedOption;
      options.forEach(function(b){
        var active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      panels.forEach(function(panel){
        panel.classList.toggle('is-active', panel.dataset.limitedPanel === option);
      });
    });
  });
});

/* === FINAL REAL THUMBNAIL FIX — stable crop, same for pulls + t-shirts === */
(function(){
  function finalThumb(src, done){
    var img = new Image();
    img.onload = function(){
      try{
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var outW = 410, outH = 360; // same ratio as the CSS thumbnail
        var canvas = document.createElement('canvas');
        canvas.width = outW; canvas.height = outH;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#f3f3f1';
        ctx.fillRect(0,0,outW,outH);

        var targetRatio = outW / outH;
        var srcRatio = w / h;
        var sx = 0, sy = 0, sw = w, sh = h;

        if (String(src).indexOf('assets/limited/') !== -1) {
          // Same exact crop for every limited product image: no vertical jump between white/black.
          // Slight zoom so the clothing fills the small thumbnail, while still showing the full product.
          sh = h * 0.80;
          sw = sh * targetRatio;
          if (sw > w * 0.92) { sw = w * 0.92; sh = sw / targetRatio; }
          sx = (w - sw) / 2;
          sy = h * 0.105;
        } else {
          // Fallback for non-limited/product-card images.
          if (srcRatio > targetRatio) { sh = h; sw = h * targetRatio; sx = (w - sw) / 2; sy = 0; }
          else { sw = w; sh = w / targetRatio; sx = 0; sy = (h - sh) / 2; }
        }

        sx = Math.max(0, Math.min(w - sw, sx));
        sy = Math.max(0, Math.min(h - sh, sy));
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
        done(canvas.toDataURL('image/png'));
      } catch(e) { done(src); }
    };
    img.onerror = function(){ done(src); };
    img.src = src;
  }
  window.makeFilledThumbSrc = makeFilledThumbSrc = finalThumb;
  window.applyFilledThumb = applyFilledThumb = function(imgEl, fullSrc){
    imgEl.classList.add('filled-thumb');
    imgEl.decoding = 'async';
    imgEl.loading = 'eager';
    finalThumb(fullSrc, function(thumbSrc){ imgEl.src = thumbSrc; });
  };
})();

/* === MINIATURES V2 — rendu carré, produit entier visible, noir/blanc alignés === */
(function(){
  function averageCornerBg(ctx, w, h){
    try{
      var pts = [[4,4],[w-5,4],[4,h-5],[w-5,h-5],[Math.floor(w/2),4],[Math.floor(w/2),h-5]];
      var r=0,g=0,b=0,n=0;
      pts.forEach(function(p){
        var d = ctx.getImageData(Math.max(0,Math.min(w-1,p[0])), Math.max(0,Math.min(h-1,p[1])), 1, 1).data;
        if(d[3] > 10){ r += d[0]; g += d[1]; b += d[2]; n++; }
      });
      if(!n) return '#f3f3f1';
      return 'rgb('+Math.round(r/n)+','+Math.round(g/n)+','+Math.round(b/n)+')';
    }catch(e){ return '#f3f3f1'; }
  }

  function squareProductThumb(src, done){
    var img = new Image();
    img.onload = function(){
      try{
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var tmp = document.createElement('canvas');
        tmp.width = w; tmp.height = h;
        var tctx = tmp.getContext('2d', { willReadFrequently:true });
        tctx.drawImage(img,0,0,w,h);
        var bg = averageCornerBg(tctx, w, h);

        var size = 420;
        var canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = bg;
        ctx.fillRect(0,0,size,size);

        // On garde le mockup complet dans un carré : pas de crop, pas de saut entre noir/blanc.
        // Le léger zoom remplit mieux la case tout en laissant voir le produit entier.
        var fit = Math.min(size / w, size / h) * 0.985;
        var dw = w * fit;
        var dh = h * fit;
        var dx = (size - dw) / 2;
        var dy = (size - dh) / 2;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, w, h, dx, dy, dw, dh);
        done(canvas.toDataURL('image/png'));
      }catch(e){ done(src); }
    };
    img.onerror = function(){ done(src); };
    img.src = src;
  }

  window.makeFilledThumbSrc = makeFilledThumbSrc = squareProductThumb;
  window.applyFilledThumb = applyFilledThumb = function(imgEl, fullSrc){
    imgEl.classList.add('filled-thumb');
    imgEl.decoding = 'async';
    imgEl.loading = 'eager';
    squareProductThumb(fullSrc, function(thumbSrc){ imgEl.src = thumbSrc; });
  };
})();

/* === MINIATURES V3 — images transparentes + alignement propre ===
   Utilise les nouveaux PNG transparents. La miniature est générée depuis
   un cadrage fixe commun : blanc/noir, rouge/bleu, avec/sans texte restent
   au même niveau et remplissent proprement la petite case. */
(function(){
  function isLimitedSrc(src){ return String(src || '').indexOf('assets/limited/') !== -1; }

  function makeCleanThumb(src, done){
    var img = new Image();
    img.onload = function(){
      try{
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var size = 640;
        var canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        var ctx = canvas.getContext('2d');

        var limited = isLimitedSrc(src);
        ctx.fillStyle = limited ? '#f4f4f2' : '#f3f3f1';
        ctx.fillRect(0, 0, size, size);

        var sx = 0, sy = 0, sw = w, sh = h;

        if(limited){
          /* Les fichiers limited sont tous en 2048×1638 avec produit transparent.
             Cadrage commun volontaire : aucun saut entre noir/blanc. */
          sx = w * 0.000;
          sy = h * 0.165;
          sw = w * 1.000;
          sh = h * 0.670;
        }else{
          /* Fallback produits classiques : crop central doux. */
          var target = 1;
          var ratio = w / h;
          if(ratio > target){
            sh = h;
            sw = h * target;
            sx = (w - sw) / 2;
            sy = 0;
          }else{
            sw = w;
            sh = w / target;
            sx = 0;
            sy = (h - sh) / 2;
          }
        }

        sx = Math.max(0, Math.min(w - sw, sx));
        sy = Math.max(0, Math.min(h - sh, sy));
        sw = Math.max(1, Math.min(w - sx, sw));
        sh = Math.max(1, Math.min(h - sy, sh));

        var pad = limited ? 14 : 10;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sw, sh, pad, pad, size - pad * 2, size - pad * 2);
        done(canvas.toDataURL('image/png'));
      }catch(e){
        done(src);
      }
    };
    img.onerror = function(){ done(src); };
    img.src = src;
  }

  window.makeFilledThumbSrc = makeFilledThumbSrc = makeCleanThumb;
  window.applyFilledThumb = applyFilledThumb = function(imgEl, fullSrc){
    imgEl.classList.add('filled-thumb');
    imgEl.decoding = 'async';
    imgEl.loading = 'eager';
    makeCleanThumb(fullSrc, function(thumbSrc){ imgEl.src = thumbSrc; });
  };
})();

/* === FIX V4 HOODIES / MINIATURES — cadrage alpha propre et aligné ===
   Remplace le crop fixe par un cadrage calculé sur la transparence de l'image.
   Résultat : pulls et t-shirts restent centrés, même hauteur, sans vide bizarre,
   et le produit reste lisible même dans les petites miniatures. */
(function(){
  function isTransparentProduct(src){
    return /assets\/(limited|hoodies)\//.test(String(src || '')) || /\.png(\?|#|$)/i.test(String(src || ''));
  }

  function getAlphaBox(img, w, h){
    var probeMax = 420;
    var scale = Math.min(1, probeMax / Math.max(w, h));
    var pw = Math.max(1, Math.round(w * scale));
    var ph = Math.max(1, Math.round(h * scale));
    var c = document.createElement('canvas');
    c.width = pw; c.height = ph;
    var x = c.getContext('2d', { willReadFrequently:true });
    x.drawImage(img, 0, 0, pw, ph);
    var data;
    try{ data = x.getImageData(0, 0, pw, ph).data; }
    catch(e){ return {x:0, y:0, w:w, h:h}; }

    var minX = pw, minY = ph, maxX = -1, maxY = -1;
    for(var y = 0; y < ph; y++){
      for(var xx = 0; xx < pw; xx++){
        var a = data[(y * pw + xx) * 4 + 3];
        if(a > 18){
          if(xx < minX) minX = xx;
          if(xx > maxX) maxX = xx;
          if(y < minY) minY = y;
          if(y > maxY) maxY = y;
        }
      }
    }
    if(maxX < 0) return {x:0, y:0, w:w, h:h};
    return {
      x: minX / scale,
      y: minY / scale,
      w: (maxX - minX + 1) / scale,
      h: (maxY - minY + 1) / scale
    };
  }

  function niceThumb(src, done){
    var img = new Image();
    img.onload = function(){
      try{
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var size = 720;
        var canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        var ctx = canvas.getContext('2d');

        ctx.fillStyle = '#f4f4f2';
        ctx.fillRect(0, 0, size, size);

        var box = isTransparentProduct(src) ? getAlphaBox(img, w, h) : {x:0,y:0,w:w,h:h};
        var marginX = box.w * 0.055;
        var marginY = box.h * 0.075;
        var sx = Math.max(0, box.x - marginX);
        var sy = Math.max(0, box.y - marginY);
        var sw = Math.min(w - sx, box.w + marginX * 2);
        var sh = Math.min(h - sy, box.h + marginY * 2);

        var target = size * 0.82;
        var scale = Math.min(target / sw, target / sh);
        var dw = sw * scale;
        var dh = sh * scale;
        var dx = (size - dw) / 2;
        var dy = (size - dh) / 2;

        /* Pulls/hoodies: un peu plus bas et plus gros, comme une vraie vignette produit. */
        if(/assets\/hoodies\//.test(String(src || '')) || (w === h && w >= 3000)){
          dy += size * 0.018;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        done(canvas.toDataURL('image/png'));
      }catch(e){ done(src); }
    };
    img.onerror = function(){ done(src); };
    img.src = src;
  }

  window.makeFilledThumbSrc = makeFilledThumbSrc = niceThumb;
  window.applyFilledThumb = applyFilledThumb = function(imgEl, fullSrc){
    imgEl.classList.add('filled-thumb');
    imgEl.decoding = 'async';
    imgEl.loading = 'eager';
    niceThumb(fullSrc, function(thumbSrc){ imgEl.src = thumbSrc; });
  };
})();


/* === FIX V5 DEFINITIF — miniatures hoodies propres / alignées ===
   - Remplace les anciennes images intégrées par les PNG transparents fournis.
   - Génère des vignettes carrées avec le même cadrage pour blanc/noir.
   - Remplit bien la case sans couper le pull, et garde tout visible en petit. */
(function(){
  var hoodieAssets = {
    'Borz Collection': {
      blanc: 'assets/hoodies/white/borz-collection.png',
      noir:  'assets/hoodies/black/borz-collection.png'
    },
    'Not From Texas': {
      blanc: 'assets/hoodies/white/notx-stateless.png',
      noir:  'assets/hoodies/black/notx-stateless.png'
    },
    'Stateless': {
      blanc: 'assets/hoodies/white/stateless.png',
      noir:  'assets/hoodies/black/stateless.png'
    }
  };

  function setHoodieSources(){
    document.querySelectorAll('.card:not(.coming-card):not(.limited-tee-card)').forEach(function(card){
      var nameEl = card.querySelector('.card-name');
      if(!nameEl) return;
      var data = hoodieAssets[nameEl.textContent.trim()];
      if(!data) return;
      var main = card.querySelector('.card-img');
      var white = card.querySelector('.img-w');
      var black = card.querySelector('.img-b');
      if(main)  main.src = data.blanc;
      if(white) white.src = data.blanc;
      if(black) black.src = data.noir;
      card.setAttribute('data-thumb-fixed','v5');
    });
  }

  function alphaBox(img, w, h){
    var max = 520;
    var sc = Math.min(1, max / Math.max(w, h));
    var cw = Math.max(1, Math.round(w * sc));
    var ch = Math.max(1, Math.round(h * sc));
    var c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    var ctx = c.getContext('2d', {willReadFrequently:true});
    ctx.drawImage(img, 0, 0, cw, ch);
    var data = ctx.getImageData(0, 0, cw, ch).data;
    var minX = cw, minY = ch, maxX = -1, maxY = -1;
    for(var y=0; y<ch; y++){
      for(var x=0; x<cw; x++){
        var a = data[(y*cw+x)*4+3];
        if(a > 10){
          if(x<minX) minX=x; if(x>maxX) maxX=x;
          if(y<minY) minY=y; if(y>maxY) maxY=y;
        }
      }
    }
    if(maxX < 0) return {x:0, y:0, w:w, h:h};
    return {
      x:minX/sc,
      y:minY/sc,
      w:(maxX-minX+1)/sc,
      h:(maxY-minY+1)/sc
    };
  }

  function drawV5Thumb(src, done){
    var img = new Image();
    img.onload = function(){
      try{
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var box = alphaBox(img, w, h);

        // Même cadrage visuel pour tous les hoodies : bbox alpha + marge régulière.
        var padX = box.w * 0.045;
        var padY = box.h * 0.055;
        var sx = Math.max(0, box.x - padX);
        var sy = Math.max(0, box.y - padY);
        var sw = Math.min(w - sx, box.w + padX * 2);
        var sh = Math.min(h - sy, box.h + padY * 2);

        var size = 900;
        var c = document.createElement('canvas');
        c.width = size; c.height = size;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#f7f7f5';
        ctx.fillRect(0, 0, size, size);

        // Produit assez gros pour remplir la petite case, sans couper manches/capuche.
        var targetW = size * 0.88;
        var targetH = size * 0.78;
        var scale = Math.min(targetW / sw, targetH / sh);
        var dw = sw * scale;
        var dh = sh * scale;
        var dx = (size - dw) / 2;
        var dy = (size - dh) / 2 + size * 0.015;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        done(c.toDataURL('image/png'));
      }catch(e){ done(src); }
    };
    img.onerror = function(){ done(src); };
    img.src = src;
  }

  window.makeFilledThumbSrc = makeFilledThumbSrc = drawV5Thumb;
  window.applyFilledThumb = applyFilledThumb = function(imgEl, fullSrc){
    imgEl.classList.add('filled-thumb');
    imgEl.decoding = 'async';
    imgEl.loading = 'eager';
    drawV5Thumb(fullSrc, function(thumbSrc){ imgEl.src = thumbSrc; });
  };

  setHoodieSources();
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setHoodieSources);
})();


/* === FIX FINAL USER — code réel, pas mockup ===
   Utilise le zip "miniatures hoodies" pour les grandes miniatures AVANT clic,
   et garde les petites miniatures du popup propres, centrées, remplies, alignées. */
(function(){
  var openingThumbs = {
    'Borz Collection': 'assets/hoodie-miniatures/borz-collection-ouverture.png',
    'Not From Texas': 'assets/hoodie-miniatures/not-from-texas-ouverture.png',
    'Stateless': 'assets/hoodie-miniatures/stateless-ouverture.png'
  };
  var hoodieProductAssets = {
    'Borz Collection': {
      blanc: 'assets/hoodies/white/borz-collection.png',
      noir:  'assets/hoodies/black/borz-collection.png'
    },
    'Not From Texas': {
      blanc: 'assets/hoodies/white/notx-stateless.png',
      noir:  'assets/hoodies/black/notx-stateless.png'
    },
    'Stateless': {
      blanc: 'assets/hoodies/white/stateless.png',
      noir:  'assets/hoodies/black/stateless.png'
    }
  };

  function applyOpeningCards(){
    document.querySelectorAll('.card[data-name]').forEach(function(card){
      var name = card.getAttribute('data-name') || '';
      var opening = openingThumbs[name];
      var assets = hoodieProductAssets[name];
      if(!opening || !assets) return;

      // Grande miniature avant clic = EXACTEMENT les images fournies dans le zip miniatures hoodies.
      var main = card.querySelector('img.card-img');
      if(main){
        main.src = opening;
        main.classList.add('hoodie-opening-thumb');
        main.alt = name + ' miniature';
      }
      card.setAttribute('data-opening-thumb','hoodie');

      // Sources utilisées au clic pour le popup/couleur: PNG propres et transparents.
      var white = card.querySelector('img.img-w');
      var black = card.querySelector('img.img-b');
      if(white) white.src = assets.blanc;
      if(black) black.src = assets.noir;
    });
  }

  function alphaBox(img, w, h){
    var max = 520;
    var sc = Math.min(1, max / Math.max(w, h));
    var cw = Math.max(1, Math.round(w * sc));
    var ch = Math.max(1, Math.round(h * sc));
    var c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    var ctx = c.getContext('2d', {willReadFrequently:true});
    ctx.drawImage(img, 0, 0, cw, ch);
    var d = ctx.getImageData(0, 0, cw, ch).data;
    var minX=cw, minY=ch, maxX=-1, maxY=-1;
    for(var y=0;y<ch;y++){
      for(var x=0;x<cw;x++){
        var a=d[(y*cw+x)*4+3];
        if(a>12){
          if(x<minX)minX=x; if(x>maxX)maxX=x;
          if(y<minY)minY=y; if(y>maxY)maxY=y;
        }
      }
    }
    if(maxX<0) return {x:0,y:0,w:w,h:h};
    return {x:minX/sc,y:minY/sc,w:(maxX-minX+1)/sc,h:(maxY-minY+1)/sc};
  }

  function finalCleanThumb(src, done){
    var img = new Image();
    img.onload = function(){
      try{
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var box = alphaBox(img, w, h);
        var size = 720;
        var c = document.createElement('canvas');
        c.width = size; c.height = size;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#f7f7f5';
        ctx.fillRect(0, 0, size, size);

        // Crop autour du vêtement avec une marge régulière: même position blanc/noir.
        var padX = box.w * 0.060;
        var padY = box.h * 0.070;
        var sx = Math.max(0, box.x - padX);
        var sy = Math.max(0, box.y - padY);
        var sw = Math.min(w - sx, box.w + padX * 2);
        var sh = Math.min(h - sy, box.h + padY * 2);

        // Remplit la petite case, mais sans couper capuche/manches.
        var targetW = size * 0.90;
        var targetH = size * 0.82;
        var sc = Math.min(targetW / sw, targetH / sh);
        var dw = sw * sc;
        var dh = sh * sc;
        var dx = (size - dw) / 2;
        var dy = (size - dh) / 2 + size * 0.010;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        done(c.toDataURL('image/png'));
      }catch(e){ done(src); }
    };
    img.onerror = function(){ done(src); };
    img.src = src;
  }

  window.makeFilledThumbSrc = makeFilledThumbSrc = finalCleanThumb;
  window.applyFilledThumb = applyFilledThumb = function(imgEl, fullSrc){
    imgEl.classList.add('filled-thumb');
    imgEl.decoding = 'async';
    imgEl.loading = 'eager';
    finalCleanThumb(fullSrc, function(thumbSrc){ imgEl.src = thumbSrc; });
  };

  applyOpeningCards();
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyOpeningCards);
  window.addEventListener('load', applyOpeningCards);
})();

/* === FIX V10 — T-SHIRTS LIMITED: petites miniatures propres + images transparentes ===
   - garde la grande miniature d'ouverture avec le loup/la lune inchangée
   - utilise les PNG transparents fournis dans assets/limited/ pour le popup
   - les petites miniatures du bas sont générées en carré, centrées, remplies,
     alignées blanc/noir, sans couper le produit. */
(function(){
  function isLimited(src){ return /assets\/limited\/(2|3|5|6|8|9|11|12)\.png/i.test(String(src || '')); }
  function isHoodie(src){ return /assets\/hoodies\//i.test(String(src || '')); }

  function alphaBox(img, w, h){
    var maxSide = 620;
    var scale = Math.min(1, maxSide / Math.max(w, h));
    var cw = Math.max(1, Math.round(w * scale));
    var ch = Math.max(1, Math.round(h * scale));
    var c = document.createElement('canvas');
    c.width = cw; c.height = ch;
    var ctx = c.getContext('2d', {willReadFrequently:true});
    ctx.drawImage(img, 0, 0, cw, ch);
    var d = ctx.getImageData(0, 0, cw, ch).data;
    var minX=cw, minY=ch, maxX=-1, maxY=-1;
    for(var y=0;y<ch;y++){
      for(var x=0;x<cw;x++){
        var i=(y*cw+x)*4;
        if(d[i+3] > 10){
          if(x<minX)minX=x; if(x>maxX)maxX=x;
          if(y<minY)minY=y; if(y>maxY)maxY=y;
        }
      }
    }
    if(maxX < 0) return {x:0,y:0,w:w,h:h};
    return {x:minX/scale, y:minY/scale, w:(maxX-minX+1)/scale, h:(maxY-minY+1)/scale};
  }

  function cleanProductThumb(src, done){
    var img = new Image();
    img.onload = function(){
      try{
        var w = img.naturalWidth || img.width;
        var h = img.naturalHeight || img.height;
        var limited = isLimited(src);
        var hoodie = isHoodie(src);
        var box = alphaBox(img, w, h);

        var out = 720;
        var c = document.createElement('canvas');
        c.width = out; c.height = out;
        var ctx = c.getContext('2d');
        ctx.fillStyle = '#f7f7f5';
        ctx.fillRect(0,0,out,out);

        var padX = box.w * (limited ? 0.035 : 0.060);
        var padY = box.h * (limited ? 0.050 : 0.070);
        var sx = Math.max(0, box.x - padX);
        var sy = Math.max(0, box.y - padY);
        var sw = Math.min(w - sx, box.w + padX * 2);
        var sh = Math.min(h - sy, box.h + padY * 2);

        /* T-shirt: remplir la case en gardant les 2 vues entières.
           Pull: garde le cadrage V9 propre. */
        var targetW = out * (limited ? 0.925 : 0.900);
        var targetH = out * (limited ? 0.780 : 0.820);
        var sc = Math.min(targetW / sw, targetH / sh);
        var dw = sw * sc;
        var dh = sh * sc;
        var dx = (out - dw) / 2;
        var dy = (out - dh) / 2 + out * (limited ? 0.010 : 0.010);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
        done(c.toDataURL('image/png'));
      }catch(e){ done(src); }
    };
    img.onerror = function(){ done(src); };
    img.src = src;
  }

  window.makeFilledThumbSrc = makeFilledThumbSrc = cleanProductThumb;
  window.applyFilledThumb = applyFilledThumb = function(imgEl, fullSrc){
    imgEl.classList.add('filled-thumb');
    imgEl.decoding = 'async';
    imgEl.loading = 'eager';
    cleanProductThumb(fullSrc, function(thumbSrc){ imgEl.src = thumbSrc; });
  };
})();
