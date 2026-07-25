/* ============================================================
   1) PASTE YOUR FIREBASE CONFIG BELOW.
      Get this from: Firebase Console > Project settings > General
      > Your apps > SDK setup and configuration > Config
   ============================================================ */
const firebaseConfig = {
  apiKey: "AIzaSyBX-ufsyFI3LiCBjbwI8Rtjk8HBK6sdou0",
  authDomain: "vrmy-f116a.firebaseapp.com",
  projectId: "vrmy-f116a",
  storageBucket: "vrmy-f116a.firebasestorage.app",
  messagingSenderId: "831971282778",
  appId: "1:831971282778:web:d7327ffcf560df60456d63"
};
/* ============================================================ */

const CONFIGURED = firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith("PASTE_");

// Only these signed-in Google accounts get admin controls (add/edit/delete).
// This is a UI convenience only — the real enforcement must live in your
// Firestore security rules (see the rules shown alongside this file).
const ADMIN_EMAILS = ["kokomona946@gmail.com", "kokomina946@gmail.com"];

let db = null;
let auth = null;
let isAdmin = false;
if(CONFIGURED){
  firebase.initializeApp(firebaseConfig);
  db = firebase.firestore();
  auth = firebase.auth();
} else {
  document.getElementById('setup-banner').style.display = 'block';
  const sig = document.getElementById('signal-indicator');
  sig.classList.remove('ok'); sig.classList.add('bad');
  document.getElementById('signal-text').textContent = 'NOT CONNECTED';
}

(function(){
  const chatLog = document.getElementById('chat-log');
  const nameInput = document.getElementById('name-input');
  const msgInput = document.getElementById('msg-input');
  const sendBtn = document.getElementById('send-btn');

  const authSigninBtn = document.getElementById('auth-signin-btn');
  const authSignoutBtn = document.getElementById('auth-signout-btn');
  const authStatus = document.getElementById('auth-status');
  const killsAddForm = document.getElementById('kills-add-form');
  const killsViewonly = document.getElementById('kills-viewonly');
  const skillAddForm = document.getElementById('skill-add-form');
  const skillViewonly = document.getElementById('skill-viewonly');

  const killsName = document.getElementById('kills-name');
  const killsCount = document.getElementById('kills-count');
  const killsAddBtn = document.getElementById('kills-add-btn');
  const killsBody = document.getElementById('kills-body');
  const killsEmpty = document.getElementById('kills-empty');

  const skillName = document.getElementById('skill-name');
  const skillTier = document.getElementById('skill-tier');
  const skillRank = document.getElementById('skill-rank');
  const skillAddBtn = document.getElementById('skill-add-btn');
  const skillBody = document.getElementById('skill-body');
  const skillEmpty = document.getElementById('skill-empty');

  const dmSignedOut = document.getElementById('dm-signed-out');
  const dmSignedIn = document.getElementById('dm-signed-in');
  const dmTargetEmail = document.getElementById('dm-target-email');
  const dmOpenBtn = document.getElementById('dm-open-btn');
  const dmThreadLabel = document.getElementById('dm-thread-label');
  const dmLog = document.getElementById('dm-log');
  const dmMsgInput = document.getElementById('dm-msg-input');
  const dmSendBtn = document.getElementById('dm-send-btn');

  let currentDmConvo = null;
  let dmUnsub = null;

  let latestKills = [];
  let latestSkill = [];

  function updateAuthUI(user){
    if(user && ADMIN_EMAILS.includes(user.email)){
      isAdmin = true;
      authSigninBtn.style.display = 'none';
      authSignoutBtn.style.display = '';
      authStatus.style.display = '';
      authStatus.classList.add('is-admin');
      authStatus.textContent = 'Admin: ' + user.email;
    } else if(user){
      isAdmin = false;
      authSigninBtn.style.display = 'none';
      authSignoutBtn.style.display = '';
      authStatus.style.display = '';
      authStatus.classList.remove('is-admin');
      authStatus.textContent = 'Signed in: ' + user.email;
    } else {
      isAdmin = false;
      authSigninBtn.style.display = '';
      authSignoutBtn.style.display = 'none';
      authStatus.style.display = 'none';
    }
    killsAddForm.style.display = isAdmin ? '' : 'none';
    killsViewonly.style.display = isAdmin ? 'none' : '';
    skillAddForm.style.display = isAdmin ? '' : 'none';
    skillViewonly.style.display = isAdmin ? 'none' : '';
    renderKills(latestKills);
    renderSkill(latestSkill);

    dmSignedOut.style.display = user ? 'none' : '';
    dmSignedIn.style.display = user ? '' : 'none';
    if(!user){
      if(dmUnsub){ dmUnsub(); dmUnsub = null; }
      currentDmConvo = null;
      dmThreadLabel.textContent = 'no conversation open';
      dmLog.innerHTML = '<div class="empty-state">open a DM above to see messages</div>';
      dmMsgInput.disabled = true;
      dmSendBtn.disabled = true;
      dmTargetEmail.value = '';
    }
  }

  if(auth){
    authSigninBtn.addEventListener('click', ()=>{
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider).catch(e => console.error('sign-in failed', e));
    });
    authSignoutBtn.addEventListener('click', ()=> auth.signOut());
    auth.onAuthStateChanged(user => {
      updateAuthUI(user);
      if(user && db){
        db.collection('users').doc(user.uid).set({
          email: user.email,
          displayName: user.displayName || '',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true }).catch(e => console.error('profile upsert failed', e));
      }
    });
  }

  // main tabs
  document.querySelectorAll('.tab').forEach(t=>{
    t.addEventListener('click', ()=>{
      document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      document.getElementById('panel-chat').style.display = t.dataset.tab === 'chat' ? '' : 'none';
      document.getElementById('panel-lb').style.display = t.dataset.tab === 'lb' ? '' : 'none';
      document.getElementById('panel-dm').style.display = t.dataset.tab === 'dm' ? '' : 'none';
    });
  });

  // rankings sub-tabs
  document.querySelectorAll('.subtab').forEach(t=>{
    t.addEventListener('click', ()=>{
      document.querySelectorAll('.subtab').forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      const isKills = t.dataset.subtab === 'kills';
      document.getElementById('board-kills').style.display = isKills ? '' : 'none';
      document.getElementById('board-skill').style.display = isKills ? 'none' : '';
    });
  });

  const savedName = localStorage.getItem('vrmy_callsign');
  if(savedName) nameInput.value = savedName;

  function escapeHtml(s){
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function timeAgo(ts){
    if(!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }

  function renderChat(messages){
    if(!messages.length){
      chatLog.innerHTML = '<div class="empty-state">no transmissions yet — say something</div>';
      return;
    }
    const wasNearBottom = chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 60;
    chatLog.innerHTML = messages.map(m => `
      <div class="msg">
        <span class="when">${timeAgo(m.t)}</span>
        <span class="who">${escapeHtml(m.name)}</span>
        <span class="body">${escapeHtml(m.text)}</span>
      </div>
    `).join('');
    if(wasNearBottom) chatLog.scrollTop = chatLog.scrollHeight;
  }

  // ---------- KILLS BOARD (auto-sorted by kill count) ----------
  function renderKills(entries){
    latestKills = entries;
    const sorted = [...entries].sort((a,b)=> (b.kills||0) - (a.kills||0));
    if(!sorted.length){ killsBody.innerHTML = ''; killsEmpty.style.display = ''; return; }
    killsEmpty.style.display = 'none';
    killsBody.innerHTML = sorted.map((e, i)=>{
      const rankClass = i===0 ? 'r1' : i===1 ? 'r2' : i===2 ? 'r3' : '';
      const delCell = isAdmin ? `<button class="del-btn" data-id="${e.id}" title="remove">&times;</button>` : '';
      return `
        <tr>
          <td class="rank ${rankClass}">#${i+1}</td>
          <td>${escapeHtml(e.name)}</td>
          <td class="lb-score-cell">${e.kills}</td>
          <td>${delCell}</td>
        </tr>
      `;
    }).join('');
    killsBody.querySelectorAll('.del-btn').forEach(btn=>{
      btn.addEventListener('click', ()=> removeKillsEntry(btn.dataset.id));
    });
  }

  async function addKillsEntry(){
    if(!isAdmin) return;
    const name = killsName.value.trim().slice(0,24);
    const kills = parseInt(killsCount.value, 10);
    if(!name || isNaN(kills) || !db) return;
    killsAddBtn.disabled = true;
    try{
      await db.collection('leaderboard_kills').add({ name, kills });
      killsName.value = ''; killsCount.value = '';
    }catch(e){ console.error('add kills failed', e); }
    killsAddBtn.disabled = false;
    killsName.focus();
  }

  async function removeKillsEntry(id){
    if(!isAdmin || !db) return;
    try{ await db.collection('leaderboard_kills').doc(id).delete(); }
    catch(e){ console.error('remove kills failed', e); }
  }

  // ---------- SKILL BOARD (tier + manually editable rank number) ----------
  const tierLabel = {
    '1':'Novice', '2':'Apprentice', '3':'Combatant', '4':'Warrior', '5':'Vanguard',
    '6':'High Striker', '7':'High Elite', '8':'Apex', '9':'The Elite Guardian',
    '10':'Omnipotens (The All-Powerful)'
  };

  function tierIcon(tierNum){
    const leaf = tierNum === '1'
      ? '<path d="M10,3 C11,0 14,0.5 13,3 C11.5,3.4 10.4,3.4 10,3 Z" fill="#4CAF50" stroke="#2E7D32" stroke-width="0.3"/>'
      : '';
    return `<svg class="tier-icon" viewBox="0 0 20 24" xmlns="http://www.w3.org/2000/svg">
      ${leaf}
      <path d="M10 3 L18 6 V12 C18 17.5 14.5 21 10 23 C5.5 21 2 17.5 2 12 V6 Z" fill="url(#grad-tier-${tierNum})" stroke="rgba(0,0,0,0.4)" stroke-width="0.6"/>
    </svg>`;
  }

  function renderSkill(entries){
    latestSkill = entries;
    // sorted by the user-assigned rank number, ascending
    const sorted = [...entries].sort((a,b)=> (a.rank||9999) - (b.rank||9999));
    if(!sorted.length){ skillBody.innerHTML = ''; skillEmpty.style.display = ''; return; }
    skillEmpty.style.display = 'none';
    skillBody.innerHTML = sorted.map(e=>{
      const tierClass = 'tier-' + (e.tier || '1');
      const label = (tierLabel[e.tier] || e.tier) + ' (Tier ' + e.tier + ')';
      const rankCell = isAdmin
        ? `<input type="number" class="rank-edit" data-id="${e.id}" value="${e.rank}">`
        : `<span class="rank">#${e.rank}</span>`;
      const delCell = isAdmin ? `<button class="del-btn" data-id="${e.id}" title="remove">&times;</button>` : '';
      return `
        <tr>
          <td>${rankCell}</td>
          <td>${escapeHtml(e.name)}</td>
          <td><span class="tier-badge ${tierClass}">${tierIcon(e.tier)}${label}</span></td>
          <td>${delCell}</td>
        </tr>
      `;
    }).join('');
    skillBody.querySelectorAll('.del-btn').forEach(btn=>{
      btn.addEventListener('click', ()=> removeSkillEntry(btn.dataset.id));
    });
    skillBody.querySelectorAll('.rank-edit').forEach(inp=>{
      inp.addEventListener('change', ()=> updateSkillRank(inp.dataset.id, inp.value));
    });
  }

  async function addSkillEntry(){
    if(!isAdmin) return;
    const name = skillName.value.trim().slice(0,24);
    const tier = skillTier.value;
    const rank = parseInt(skillRank.value, 10);
    if(!name || isNaN(rank) || !db) return;
    skillAddBtn.disabled = true;
    try{
      await db.collection('leaderboard_skill').add({ name, tier, rank });
      skillName.value = ''; skillRank.value = '';
    }catch(e){ console.error('add skill failed', e); }
    skillAddBtn.disabled = false;
    skillName.focus();
  }

  async function updateSkillRank(id, value){
    if(!isAdmin) return;
    const rank = parseInt(value, 10);
    if(isNaN(rank) || !db) return;
    try{ await db.collection('leaderboard_skill').doc(id).update({ rank }); }
    catch(e){ console.error('update rank failed', e); }
  }

  async function removeSkillEntry(id){
    if(!isAdmin || !db) return;
    try{ await db.collection('leaderboard_skill').doc(id).delete(); }
    catch(e){ console.error('remove skill failed', e); }
  }

  // ---------- CHAT ----------
  async function sendMessage(){
    const name = (nameInput.value || 'anon').trim().slice(0,20) || 'anon';
    const text = msgInput.value.trim();
    if(!text || !db) return;
    localStorage.setItem('vrmy_callsign', name);
    sendBtn.disabled = true;
    try{
      await db.collection('messages').add({
        name, text, t: firebase.firestore.FieldValue.serverTimestamp()
      });
      msgInput.value = '';
    }catch(e){ console.error('send failed', e); }
    sendBtn.disabled = false;
    msgInput.focus();
  }

  // ---------- DIRECT MESSAGES (1-on-1, signed-in users only) ----------
  function convoIdFor(uidA, uidB){
    return [uidA, uidB].sort().join('_');
  }

  function renderDm(messages){
    if(!messages.length){
      dmLog.innerHTML = '<div class="empty-state">no messages yet — say hello</div>';
      return;
    }
    const wasNearBottom = dmLog.scrollHeight - dmLog.scrollTop - dmLog.clientHeight < 60;
    const myUid = auth.currentUser ? auth.currentUser.uid : null;
    dmLog.innerHTML = messages.map(m=>{
      const mine = m.senderId === myUid;
      return `
        <div class="msg ${mine ? 'mine' : ''}">
          <span class="when">${timeAgo(m.t)}</span>
          <span class="who">${escapeHtml(mine ? 'You' : m.senderEmail)}</span>
          <span class="body">${escapeHtml(m.text)}</span>
        </div>
      `;
    }).join('');
    if(wasNearBottom) dmLog.scrollTop = dmLog.scrollHeight;
  }

  function subscribeToDm(convoId, otherEmail){
    if(dmUnsub){ dmUnsub(); dmUnsub = null; }
    currentDmConvo = convoId;
    dmThreadLabel.textContent = 'Chatting with: ' + otherEmail;
    dmMsgInput.disabled = false;
    dmSendBtn.disabled = false;
    dmLog.innerHTML = '<div class="empty-state">loading…</div>';
    dmUnsub = db.collection('dms').doc(convoId).collection('messages')
      .orderBy('t', 'asc').limit(200)
      .onSnapshot(snap => {
        const messages = snap.docs.map(d => d.data());
        renderDm(messages);
      }, err => console.error('dm listener error', err));
  }

  async function openDm(){
    if(!auth || !auth.currentUser || !db) return;
    const email = dmTargetEmail.value.trim().toLowerCase();
    if(!email) return;
    if(email === auth.currentUser.email.toLowerCase()){
      dmThreadLabel.textContent = "That's your own email — enter someone else's.";
      return;
    }
    dmOpenBtn.disabled = true;
    try{
      const snap = await db.collection('users').where('email', '==', email).limit(1).get();
      if(snap.empty){
        dmThreadLabel.textContent = 'No signed-in user found with that email yet.';
      } else {
        const otherUid = snap.docs[0].id;
        subscribeToDm(convoIdFor(auth.currentUser.uid, otherUid), email);
      }
    }catch(e){ console.error('open dm failed', e); }
    dmOpenBtn.disabled = false;
  }

  async function sendDm(){
    if(!currentDmConvo || !auth || !auth.currentUser || !db) return;
    const text = dmMsgInput.value.trim();
    if(!text) return;
    dmSendBtn.disabled = true;
    try{
      await db.collection('dms').doc(currentDmConvo).collection('messages').add({
        senderId: auth.currentUser.uid,
        senderEmail: auth.currentUser.email,
        text,
        t: firebase.firestore.FieldValue.serverTimestamp()
      });
      dmMsgInput.value = '';
    }catch(e){ console.error('send dm failed', e); }
    dmSendBtn.disabled = false;
    dmMsgInput.focus();
  }

  dmOpenBtn.addEventListener('click', openDm);
  dmTargetEmail.addEventListener('keydown', e=>{ if(e.key === 'Enter') openDm(); });
  dmSendBtn.addEventListener('click', sendDm);
  dmMsgInput.addEventListener('keydown', e=>{ if(e.key === 'Enter') sendDm(); });

  sendBtn.addEventListener('click', sendMessage);
  msgInput.addEventListener('keydown', e=>{ if(e.key === 'Enter') sendMessage(); });
  killsAddBtn.addEventListener('click', addKillsEntry);
  killsCount.addEventListener('keydown', e=>{ if(e.key === 'Enter') addKillsEntry(); });
  killsName.addEventListener('keydown', e=>{ if(e.key === 'Enter') addKillsEntry(); });
  skillAddBtn.addEventListener('click', addSkillEntry);
  skillRank.addEventListener('keydown', e=>{ if(e.key === 'Enter') addSkillEntry(); });
  skillName.addEventListener('keydown', e=>{ if(e.key === 'Enter') addSkillEntry(); });

  if(db){
    db.collection('messages').orderBy('t', 'asc').limit(200)
      .onSnapshot(snap => {
        const messages = snap.docs.map(d => d.data());
        renderChat(messages);
      }, err => console.error('chat listener error', err));

    db.collection('leaderboard_kills')
      .onSnapshot(snap => {
        const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderKills(entries);
      }, err => console.error('kills listener error', err));

    db.collection('leaderboard_skill')
      .onSnapshot(snap => {
        const entries = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderSkill(entries);
      }, err => console.error('skill listener error', err));
  } else {
    renderChat([]);
    renderKills([]);
    renderSkill([]);
  }
})();
