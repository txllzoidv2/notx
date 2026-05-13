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
var pOverlay = document.getElementById('pOverlay');
var mMain    = document.getElementById('mMain');
var mThumbs  = document.getElementById('mThumbs');
var qVal     = document.getElementById('qVal');
var mErr     = document.getElementById('mErr');

function syncThumbs(c){ mThumbs.querySelectorAll('.m-thumb').forEach(function(t){ t.classList.toggle('on',t.dataset.color===c); }); }
function syncSwatches(c){ document.querySelectorAll('.col-btn').forEach(function(b){ b.classList.toggle('on',b.dataset.color===c); }); }

document.querySelectorAll('.card').forEach(function(card){
  card.addEventListener('click', function(){
    var imgW=card.querySelector('.img-w'), imgB=card.querySelector('.img-b');
    cur={name:card.querySelector('.card-name').textContent, price:card.querySelector('.card-price').textContent, blanc:imgW?imgW.src:'', noir:imgB?imgB.src:''};
    selSize=null; selColor=null; qty=1;
    qVal.textContent='1'; mErr.style.display='none';
    document.getElementById('mName').textContent=cur.name;
    document.getElementById('mPrice').textContent=cur.price;
    mMain.src=cur.blanc;
    mThumbs.innerHTML='';
    [['Blanc',cur.blanc],['Noir',cur.noir]].forEach(function(p,idx){
      var t=document.createElement('img');
      t.src=p[1]; t.alt=p[0]; t.className='m-thumb'+(idx===0?' on':''); t.dataset.color=p[0];
      t.addEventListener('click', function(){ mMain.src=p[1]; selColor=p[0]; syncThumbs(p[0]); syncSwatches(p[0]); });
      mThumbs.appendChild(t);
    });
    document.querySelectorAll('.sz').forEach(function(b){ b.classList.remove('on'); });
    document.querySelectorAll('.col-btn').forEach(function(b){ b.classList.remove('on'); });
    openOv(pOverlay);
  });
});
document.getElementById('mClose').addEventListener('click', function(){ closeOv(pOverlay); });
pOverlay.addEventListener('click', function(e){ if(e.target===pOverlay) closeOv(pOverlay); });

document.querySelectorAll('.sz').forEach(function(btn){
  btn.addEventListener('click', function(){
    document.querySelectorAll('.sz').forEach(function(b){ b.classList.remove('on'); });
    btn.classList.add('on'); selSize=btn.dataset.size;
  });
});
document.querySelectorAll('.col-btn').forEach(function(btn){
  btn.addEventListener('click', function(){
    selColor=btn.dataset.color; syncSwatches(selColor); syncThumbs(selColor);
    if(cur) mMain.src=selColor==='Blanc'?cur.blanc:cur.noir;
  });
});
document.getElementById('qMinus').addEventListener('click', function(){ if(qty>1){ qty--; qVal.textContent=qty; } });
document.getElementById('qPlus').addEventListener('click',  function(){ if(qty<10){ qty++; qVal.textContent=qty; } });

/* ── CHECKOUT MODAL ── */
var ckOverlay = document.getElementById('ckOverlay');
document.getElementById('mBuy').addEventListener('click', function(){
  if(!selSize||!selColor){ mErr.style.display='block'; return; }
  mErr.style.display='none';
  document.getElementById('ckSum').textContent=cur.name+' — '+selColor+', Taille '+selSize+' × '+qty+' — '+cur.price;
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
    emailjs.send('service_i00q2lj','template_abjvqzw',{product_name:cur.name,color:selColor,size:selSize,quantity:qty,price:cur.price,client_name:name,client_email:email,client_phone:phone,client_address:addr})
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
      collectionVideo.paused ? 'Lancer la vid&eacute;o' : 'Mettre la vid&eacute;o en pause'
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
