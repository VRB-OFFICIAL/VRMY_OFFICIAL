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
  const chatViewonly = document.getElementById('chat-viewonly');
  const chatInputRow = document.getElementById('chat-input-row');
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
  const killsRoblox = document.getElementById('kills-roblox');
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
  const dmUsernamePicker = document.getElementById('dm-username-picker');
  const dmUsernameInput = document.getElementById('dm-username-input');
  const dmUsernameClaimBtn = document.getElementById('dm-username-claim-btn');
  const dmUsernameError = document.getElementById('dm-username-error');
  const dmUsernameLocked = document.getElementById('dm-username-locked');
  const dmMyUsername = document.getElementById('dm-my-username');
  const dmRobloxInput = document.getElementById('dm-roblox-input');
  const dmRobloxSaveBtn = document.getElementById('dm-roblox-save-btn');
  const dmUsernameSwitch = document.getElementById('dm-username-switch');
  const dmUsernameSwitchInput = document.getElementById('dm-username-switch-input');
  const dmUsernameSwitchBtn = document.getElementById('dm-username-switch-btn');
  const dmUsernameSwitchError = document.getElementById('dm-username-switch-error');
  const dmConversationsList = document.getElementById('dm-conversations');
  const dmNewBtn = document.getElementById('dm-new-btn');
  const dmNewSearch = document.getElementById('dm-new-search');
  const dmTargetUsername = document.getElementById('dm-target-username');
  const dmSearchResults = document.getElementById('dm-search-results');
  const dmOpenBtn = document.getElementById('dm-open-btn');
  const dmThreadLabel = document.getElementById('dm-thread-label');
  const dmLog = document.getElementById('dm-log');
  const dmMsgInput = document.getElementById('dm-msg-input');
  const dmSendBtn = document.getElementById('dm-send-btn');

  const profileSection = document.getElementById('profile-section');
  const profilePhotoPreview = document.getElementById('profile-photo-preview');
  const profilePhotoInput = document.getElementById('profile-photo-input');
  const profilePhotoBtn = document.getElementById('profile-photo-btn');
  const profilePhotoRemoveBtn = document.getElementById('profile-photo-remove-btn');
  const profilePhotoError = document.getElementById('profile-photo-error');
  const profileNameInput = document.getElementById('profile-name-input');
  const profileRoleInput = document.getElementById('profile-role-input');
  const profileSaveBtn = document.getElementById('profile-save-btn');
  const profileSaveError = document.getElementById('profile-save-error');

  const adminReserved = document.getElementById('admin-reserved');
  const reserveUsernameInput = document.getElementById('reserve-username-input');
  const reserveUsernameBtn = document.getElementById('reserve-username-btn');
  const reserveUsernameError = document.getElementById('reserve-username-error');
  const reservedUsernamesList = document.getElementById('reserved-usernames-list');
  const reserveRobloxInput = document.getElementById('reserve-roblox-input');
  const reserveRobloxBtn = document.getElementById('reserve-roblox-btn');
  const reserveRobloxError = document.getElementById('reserve-roblox-error');
  const reservedRobloxList = document.getElementById('reserved-roblox-list');

  let currentDmConvo = null;
  let dmUnsub = null;
  let dmConvoListUnsub = null;
  let latestConvoDocs = [];
  let myUsername = null;
  let myRoblox = null;
  let myPhoto = null;

  let latestKills = [];
  let latestSkill = [];

  function updateAuthUI(user){
    if(user && ADMIN_EMAILS.includes(user.email)){
      isAdmin = true;
      authSigninBtn.style.display = 'none';
      authSignoutBtn.style.display = '';
      authStatus.style.display = '';
      authStatus.classList.add('is-admin');
      authStatus.textContent = 'Admin';
    } else if(user){
      isAdmin = false;
      authSigninBtn.style.display = 'none';
      authSignoutBtn.style.display = '';
      authStatus.style.display = '';
      authStatus.classList.remove('is-admin');
      authStatus.textContent = 'Signed in';
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
    adminReserved.style.display = isAdmin ? '' : 'none';
    if(myUsername) dmUsernameSwitch.style.display = isAdmin ? '' : 'none';
    if(isAdmin){ loadReservedUsernames(); loadReservedRoblox(); }
    if(!user){
      if(dmUnsub){ dmUnsub(); dmUnsub = null; }
      if(dmConvoListUnsub){ dmConvoListUnsub(); dmConvoListUnsub = null; }
      latestConvoDocs = [];
      currentDmConvo = null;
      myUsername = null;
      myRoblox = null;
      myPhoto = null;
      dmUsernameInput.value = '';
      dmRobloxInput.value = '';
      profileSection.style.display = 'none';
      profileNameInput.value = '';
      profileRoleInput.value = '';
      profilePhotoPreview.style.backgroundImage = '';
      profilePhotoPreview.textContent = '';
      profilePhotoRemoveBtn.style.display = 'none';
      dmUsernameError.style.display = 'none';
      dmThreadLabel.textContent = 'no conversation open';
      dmLog.innerHTML = '<div class="empty-state">open a DM above to see messages</div>';
      dmMsgInput.disabled = true;
      dmSendBtn.disabled = true;
      dmTargetUsername.value = '';
      dmConversationsList.innerHTML = '<div class="empty-state" style="padding:16px;">no conversations yet</div>';
    }
    updateChatAccess();
  }

  function updateChatAccess(){
    const canChat = !!(auth && auth.currentUser && myUsername);
    chatInputRow.style.display = canChat ? '' : 'none';
    chatViewonly.style.display = canChat ? 'none' : '';
  }

  function showUsernamePicker(){
    dmUsernamePicker.style.display = '';
    dmUsernameLocked.style.display = 'none';
    updateChatAccess();
  }
  function showUsernameLocked(username){
    myUsername = username;
    dmMyUsername.textContent = username;
    dmUsernamePicker.style.display = 'none';
    dmUsernameLocked.style.display = '';
    dmUsernameSwitch.style.display = isAdmin ? '' : 'none';
    updateChatAccess();
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
        db.collection('users').doc(user.uid).get().then(doc => {
          const existing = doc.exists ? doc.data().username : null;
          myRoblox = doc.exists ? (doc.data().roblox || null) : null;
          myPhoto = doc.exists ? (doc.data().photo || null) : null;
          dmRobloxInput.value = myRoblox || '';
          profileNameInput.value = doc.exists ? (doc.data().displayName || '') : '';
          profileRoleInput.value = doc.exists ? (doc.data().role || '') : '';
          renderProfilePreview();
          profileSection.style.display = '';
          if(existing){
            showUsernameLocked(existing);
          } else {
            showUsernamePicker();
          }
          if(isAdmin) loadReservedUsernames();
          // keep the account's email privately for admin checks; never displayed
          return db.collection('users').doc(user.uid).set({
            hasAccount: true,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        }).catch(e => console.error('profile load failed', e));
        subscribeToConversationList();
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

  function escapeHtml(s){
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function timeAgo(ts){
    if(!ts) return '';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
  }
  function adminBadge(){
    return '<svg class="icon admin-crown" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M5 19h14L17 9l-5 4-2-7-2 7-5-4 2 10z" fill="currentColor" stroke="none"/></svg>';
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
        <span class="who${m.isAdmin ? ' admin' : ''}">${m.isAdmin ? adminBadge() : ''}${escapeHtml(m.name)}</span>
        ${m.roblox ? `<span class="roblox-tag" style="display:inline; margin-left:6px;">@${escapeHtml(m.roblox)}</span>` : ''}
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
      const delCell = isAdmin ? `<button class="del-btn" data-id="${e.id}" title="remove"><svg class="icon icon-only" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>` : '';
      return `
        <tr>
          <td class="rank ${rankClass}">#${i+1}</td>
          <td>
            <span class="lb-name">${escapeHtml(e.name)}</span>
            ${e.roblox ? `<span class="roblox-tag">@${escapeHtml(e.roblox)}</span>` : ''}
          </td>
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
    const roblox = killsRoblox.value.trim().replace(/^@/,'').slice(0,24);
    const kills = parseInt(killsCount.value, 10);
    if(!name || isNaN(kills) || !db) return;
    killsAddBtn.disabled = true;
    try{
      const entry = { name, kills };
      if(roblox) entry.roblox = roblox;
      await db.collection('leaderboard_kills').add(entry);
      killsName.value = ''; killsRoblox.value = ''; killsCount.value = '';
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
    skillBody.innerHTML = sorted.map((e, i)=>{
      const rankClass = i===0 ? 'r1' : i===1 ? 'r2' : i===2 ? 'r3' : '';
      const tierClass = 'tier-' + (e.tier || '1');
      const label = (tierLabel[e.tier] || e.tier) + ' (Tier ' + e.tier + ')';
      const rankCell = isAdmin
        ? `<span class="rank-cell-wrap ${rankClass}"><span class="rank-hash">#</span><input type="number" class="rank-edit ${rankClass}" data-id="${e.id}" value="${e.rank}"></span>`
        : `<span class="rank ${rankClass}">#${e.rank}</span>`;
      const delCell = isAdmin ? `<button class="del-btn" data-id="${e.id}" title="remove"><svg class="icon icon-only" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg></button>` : '';
      return `
        <tr>
          <td>${rankCell}</td>
          <td><span class="skill-name ${tierClass}">${escapeHtml(e.name)}</span></td>
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
    if(!auth || !auth.currentUser || !myUsername || !db) return;
    const text = msgInput.value.trim();
    if(!text) return;
    sendBtn.disabled = true;
    try{
      const entry = { name: myUsername, text, isAdmin, t: firebase.firestore.FieldValue.serverTimestamp() };
      if(myRoblox) entry.roblox = myRoblox;
      await db.collection('messages').add(entry);
      msgInput.value = '';
    }catch(e){ console.error('send failed', e); }
    sendBtn.disabled = false;
    msgInput.focus();
  }

  // ---------- DIRECT MESSAGES (1-on-1, permanent username required) ----------

  const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
  const RESERVED_WORDS_RE = /(dev|owner|admin|developer|helper)/i;
  const VRB_LOCKED_RE = /vrb/i;
  const SUPER_ADMIN_EMAIL = 'kokomona946@gmail.com';

  async function claimUsername(){
    if(!auth || !auth.currentUser || !db) return;
    const name = dmUsernameInput.value.trim();
    dmUsernameError.style.display = 'none';
    if(!USERNAME_RE.test(name)){
      dmUsernameError.textContent = '3-20 characters, letters/numbers/underscore only.';
      dmUsernameError.style.display = '';
      return;
    }
    if(RESERVED_WORDS_RE.test(name) && !ADMIN_EMAILS.includes(auth.currentUser.email)){
      dmUsernameError.textContent = 'That username contains a reserved word and can\'t be used.';
      dmUsernameError.style.display = '';
      return;
    }
    if(VRB_LOCKED_RE.test(name) && auth.currentUser.email !== SUPER_ADMIN_EMAIL){
      dmUsernameError.textContent = 'That username isn\'t available.';
      dmUsernameError.style.display = '';
      return;
    }
    const lower = name.toLowerCase();
    dmUsernameClaimBtn.disabled = true;
    try{
      await db.runTransaction(async tx => {
        const unameRef = db.collection('usernames').doc(lower);
        const unameDoc = await tx.get(unameRef);
        if(unameDoc.exists){
          throw new Error('taken');
        }
        tx.set(unameRef, { uid: auth.currentUser.uid, username: name });
        tx.set(db.collection('users').doc(auth.currentUser.uid), {
          username: name,
          usernameLower: lower,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      });
      showUsernameLocked(name);
    }catch(e){
      if(e && e.message === 'taken'){
        dmUsernameError.textContent = 'That username is already taken — try another.';
      } else {
        console.error('claim username failed', e);
        dmUsernameError.textContent = 'Something went wrong — try again.';
      }
      dmUsernameError.style.display = '';
    }
    dmUsernameClaimBtn.disabled = false;
  }

  const ROBLOX_RE = /^[a-zA-Z0-9_]{0,24}$/;

  async function saveRoblox(){
    if(!auth || !auth.currentUser || !db) return;
    const raw = dmRobloxInput.value.trim().replace(/^@/, '');
    if(!ROBLOX_RE.test(raw)){
      dmRobloxInput.title = 'Letters, numbers, underscore only (max 24 chars).';
      dmRobloxInput.style.borderColor = 'var(--red)';
      return;
    }
    if(raw && RESERVED_WORDS_RE.test(raw) && !ADMIN_EMAILS.includes(auth.currentUser.email)){
      dmRobloxInput.title = 'That Roblox username contains a reserved word.';
      dmRobloxInput.style.borderColor = 'var(--red)';
      return;
    }
    if(raw && VRB_LOCKED_RE.test(raw) && auth.currentUser.email !== SUPER_ADMIN_EMAIL){
      dmRobloxInput.title = 'That Roblox username isn\'t available.';
      dmRobloxInput.style.borderColor = 'var(--red)';
      return;
    }
    dmRobloxInput.title = '';
    dmRobloxInput.style.borderColor = '';
    dmRobloxSaveBtn.disabled = true;
    try{
      await db.collection('users').doc(auth.currentUser.uid).set({
        roblox: raw || firebase.firestore.FieldValue.delete(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      myRoblox = raw || null;
      dmRobloxInput.value = raw;
    }catch(e){
      console.error('save roblox failed', e);
      if(e && e.code === 'permission-denied'){
        dmRobloxInput.title = 'That Roblox username is reserved and can\'t be used.';
        dmRobloxInput.style.borderColor = 'var(--red)';
      }
    }
    dmRobloxSaveBtn.disabled = false;
  }

  // ---------- PROFILE (display name, role, picture) ----------

  const MAX_PHOTO_BYTES = 700000; // ~700KB, keeps the doc well under Firestore's 1MB limit
  const MAX_PHOTO_DIMENSION = 256; // downscaled square, plenty for an avatar

  function renderProfilePreview(){
    if(myPhoto){
      profilePhotoPreview.style.backgroundImage = `url(${myPhoto})`;
      profilePhotoPreview.textContent = '';
      profilePhotoRemoveBtn.style.display = '';
    } else {
      profilePhotoPreview.style.backgroundImage = '';
      const initial = (profileNameInput.value || myUsername || '?').trim().charAt(0).toUpperCase();
      profilePhotoPreview.textContent = initial;
      profilePhotoRemoveBtn.style.display = 'none';
    }
  }

  function resizeImageFile(file){
    return new Promise((resolve, reject)=>{
      const reader = new FileReader();
      reader.onerror = ()=> reject(new Error('read failed'));
      reader.onload = ()=>{
        const img = new Image();
        img.onerror = ()=> reject(new Error('decode failed'));
        img.onload = ()=>{
          const size = MAX_PHOTO_DIMENSION;
          const canvas = document.createElement('canvas');
          canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext('2d');
          // center-crop to a square, then scale down
          const side = Math.min(img.width, img.height);
          const sx = (img.width - side) / 2;
          const sy = (img.height - side) / 2;
          ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
          let quality = 0.85;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          while(dataUrl.length > MAX_PHOTO_BYTES && quality > 0.3){
            quality -= 0.15;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
          }
          if(dataUrl.length > MAX_PHOTO_BYTES){
            reject(new Error('too large'));
          } else {
            resolve(dataUrl);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handlePhotoChosen(){
    const file = profilePhotoInput.files && profilePhotoInput.files[0];
    profilePhotoInput.value = '';
    if(!file || !auth || !auth.currentUser || !db) return;
    profilePhotoError.style.display = 'none';
    if(!file.type.startsWith('image/')){
      profilePhotoError.textContent = 'Please choose an image file.';
      profilePhotoError.style.display = '';
      return;
    }
    profilePhotoBtn.disabled = true;
    try{
      const dataUrl = await resizeImageFile(file);
      await db.collection('users').doc(auth.currentUser.uid).set({
        photo: dataUrl,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      myPhoto = dataUrl;
      renderProfilePreview();
    }catch(e){
      console.error('photo upload failed', e);
      profilePhotoError.textContent = (e && e.message === 'too large')
        ? 'That image is too large even after compressing — try a smaller one.'
        : 'Something went wrong — try a different image.';
      profilePhotoError.style.display = '';
    }
    profilePhotoBtn.disabled = false;
  }

  async function removePhoto(){
    if(!auth || !auth.currentUser || !db) return;
    profilePhotoRemoveBtn.disabled = true;
    try{
      await db.collection('users').doc(auth.currentUser.uid).set({
        photo: firebase.firestore.FieldValue.delete(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      myPhoto = null;
      renderProfilePreview();
    }catch(e){ console.error('remove photo failed', e); }
    profilePhotoRemoveBtn.disabled = false;
  }

  async function saveProfile(){
    if(!auth || !auth.currentUser || !db) return;
    const displayName = profileNameInput.value.trim();
    const role = profileRoleInput.value.trim();
    profileSaveError.style.display = 'none';
    profileSaveBtn.disabled = true;
    try{
      await db.collection('users').doc(auth.currentUser.uid).set({
        displayName: displayName || firebase.firestore.FieldValue.delete(),
        role: role || firebase.firestore.FieldValue.delete(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      renderProfilePreview();
    }catch(e){
      console.error('save profile failed', e);
      profileSaveError.textContent = 'Something went wrong — try again.';
      profileSaveError.style.display = '';
    }
    profileSaveBtn.disabled = false;
  }

  // ---------- ADMIN: RESERVED NAMES (usernames + roblox names) ----------
  // Admins can claim as many usernames/roblox names as they like; while
  // claimed, nobody else can register that username or set that roblox
  // name on their own profile. Unclaiming (delete) frees the name again.
  // Enforcement lives in Firestore rules — this is just the UI for it.

  function renderReservedList(container, items, onUnclaim, emptyText){
    if(!items.length){
      container.innerHTML = `<div class="dm-search-empty">${emptyText}</div>`;
      return;
    }
    container.innerHTML = items.map(it => `
      <div class="dm-search-item" style="display:flex; align-items:center; justify-content:space-between;">
        <span>${escapeHtml(it.label)}</span>
        <button class="del-btn" data-id="${it.id}" title="unclaim">
          <svg class="icon icon-only" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </button>
      </div>
    `).join('');
    container.querySelectorAll('.del-btn').forEach(btn=>{
      btn.addEventListener('click', ()=> onUnclaim(btn.dataset.id));
    });
  }

  async function loadReservedUsernames(){
    if(!isAdmin || !auth || !auth.currentUser || !db) return;
    try{
      const snap = await db.collection('usernames').where('uid', '==', auth.currentUser.uid).get();
      const items = snap.docs
        .map(d => ({ id: d.id, label: d.data().username || d.id }))
        .filter(it => it.id !== (myUsername || '').toLowerCase()); // hide your own active username
      renderReservedList(reservedUsernamesList, items, unclaimUsername, 'no extra usernames reserved');
    }catch(e){ console.error('load reserved usernames failed', e); }
  }

  async function loadReservedRoblox(){
    if(!isAdmin || !auth || !auth.currentUser || !db) return;
    try{
      const snap = await db.collection('robloxNames').where('uid', '==', auth.currentUser.uid).get();
      const items = snap.docs.map(d => ({ id: d.id, label: d.data().roblox || d.id }));
      renderReservedList(reservedRobloxList, items, unclaimRoblox, 'no roblox names reserved');
    }catch(e){ console.error('load reserved roblox failed', e); }
  }

  async function reserveUsername(){
    if(!isAdmin || !auth || !auth.currentUser || !db) return;
    const raw = reserveUsernameInput.value.trim();
    reserveUsernameError.style.display = 'none';
    if(!USERNAME_RE.test(raw)){
      reserveUsernameError.textContent = '3-20 characters, letters/numbers/underscore only.';
      reserveUsernameError.style.display = '';
      return;
    }
    if(VRB_LOCKED_RE.test(raw) && auth.currentUser.email !== SUPER_ADMIN_EMAIL){
      reserveUsernameError.textContent = 'That username isn\'t available.';
      reserveUsernameError.style.display = '';
      return;
    }
    const lower = raw.toLowerCase();
    reserveUsernameBtn.disabled = true;
    try{
      await db.collection('usernames').doc(lower).set({ uid: auth.currentUser.uid, username: raw });
      reserveUsernameInput.value = '';
      loadReservedUsernames();
    }catch(e){
      console.error('reserve username failed', e);
      reserveUsernameError.textContent = (e && e.code === 'permission-denied')
        ? 'That username is already taken or reserved.'
        : 'Something went wrong — try again.';
      reserveUsernameError.style.display = '';
    }
    reserveUsernameBtn.disabled = false;
  }

  async function unclaimUsername(name){
    if(!isAdmin || !db) return;
    try{ await db.collection('usernames').doc(name).delete(); loadReservedUsernames(); }
    catch(e){ console.error('unclaim username failed', e); }
  }

  async function switchUsername(){
    if(!isAdmin || !auth || !auth.currentUser || !db) return;
    const raw = dmUsernameSwitchInput.value.trim();
    dmUsernameSwitchError.style.display = 'none';
    if(!USERNAME_RE.test(raw)){
      dmUsernameSwitchError.textContent = '3-20 characters, letters/numbers/underscore only.';
      dmUsernameSwitchError.style.display = '';
      return;
    }
    if(VRB_LOCKED_RE.test(raw) && auth.currentUser.email !== SUPER_ADMIN_EMAIL){
      dmUsernameSwitchError.textContent = 'That username isn\'t available.';
      dmUsernameSwitchError.style.display = '';
      return;
    }
    dmUsernameSwitchBtn.disabled = true;
    try{
      await db.collection('users').doc(auth.currentUser.uid).set({
        username: raw,
        usernameLower: raw.toLowerCase(),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      dmUsernameSwitchInput.value = '';
      showUsernameLocked(raw);
      loadReservedUsernames();
    }catch(e){
      console.error('switch username failed', e);
      dmUsernameSwitchError.textContent = (e && e.code === 'permission-denied')
        ? "You haven't reserved that username — reserve it below first."
        : 'Something went wrong — try again.';
      dmUsernameSwitchError.style.display = '';
    }
    dmUsernameSwitchBtn.disabled = false;
  }

  async function reserveRoblox(){
    if(!isAdmin || !auth || !auth.currentUser || !db) return;
    const raw = reserveRobloxInput.value.trim().replace(/^@/, '');
    reserveRobloxError.style.display = 'none';
    if(!ROBLOX_RE.test(raw) || !raw){
      reserveRobloxError.textContent = 'Letters, numbers, underscore only (max 24 chars).';
      reserveRobloxError.style.display = '';
      return;
    }
    if(VRB_LOCKED_RE.test(raw) && auth.currentUser.email !== SUPER_ADMIN_EMAIL){
      reserveRobloxError.textContent = 'That roblox username isn\'t available.';
      reserveRobloxError.style.display = '';
      return;
    }
    const lower = raw.toLowerCase();
    reserveRobloxBtn.disabled = true;
    try{
      await db.collection('robloxNames').doc(lower).set({ uid: auth.currentUser.uid, roblox: raw });
      reserveRobloxInput.value = '';
      loadReservedRoblox();
    }catch(e){
      console.error('reserve roblox failed', e);
      reserveRobloxError.textContent = (e && e.code === 'permission-denied')
        ? 'That roblox username is already reserved.'
        : 'Something went wrong — try again.';
      reserveRobloxError.style.display = '';
    }
    reserveRobloxBtn.disabled = false;
  }

  async function unclaimRoblox(name){
    if(!isAdmin || !db) return;
    try{ await db.collection('robloxNames').doc(name).delete(); loadReservedRoblox(); }
    catch(e){ console.error('unclaim roblox failed', e); }
  }

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
      const who = mine ? 'You' : (m.senderName || 'them');
      return `
        <div class="msg ${mine ? 'mine' : ''}">
          <span class="when">${timeAgo(m.t)}</span>
          <span class="who${m.isAdmin ? ' admin' : ''}">${m.isAdmin ? adminBadge() : ''}${escapeHtml(who)}</span>
          ${m.senderRoblox ? `<span class="roblox-tag" style="display:inline; margin-left:6px;">@${escapeHtml(m.senderRoblox)}</span>` : ''}
          <span class="body">${escapeHtml(m.text)}</span>
        </div>
      `;
    }).join('');
    if(wasNearBottom) dmLog.scrollTop = dmLog.scrollHeight;
  }

  function subscribeToConversationList(){
    if(dmConvoListUnsub){ dmConvoListUnsub(); dmConvoListUnsub = null; }
    if(!auth || !auth.currentUser || !db) return;
    dmConvoListUnsub = db.collection('dms')
      .where('participants', 'array-contains', auth.currentUser.uid)
      .orderBy('updatedAt', 'desc')
      .limit(50)
      .onSnapshot(snap => {
        latestConvoDocs = snap.docs;
        renderConversationList();
      }, err => console.error('conversation list error', err));
  }

  function renderConversationList(){
    const myUid = auth.currentUser ? auth.currentUser.uid : null;
    if(!latestConvoDocs.length){
      dmConversationsList.innerHTML = '<div class="empty-state" style="padding:16px;">no conversations yet</div>';
      return;
    }
    dmConversationsList.innerHTML = latestConvoDocs.map(d=>{
      const data = d.data();
      const otherUid = (data.participants || []).find(id => id !== myUid);
      const otherName = (data.participantNames && data.participantNames[otherUid]) || 'unknown';
      const preview = data.lastMessage ? escapeHtml(data.lastMessage) : '';
      const activeClass = currentDmConvo === d.id ? 'active' : '';
      const initial = otherName.charAt(0).toUpperCase();
      return `
        <div class="dm-conv-item ${activeClass}" data-id="${d.id}" data-name="${escapeHtml(otherName)}">
          <div class="dm-conv-avatar">${escapeHtml(initial)}</div>
          <div class="dm-conv-text">
            <div class="dm-conv-name">${escapeHtml(otherName)}</div>
            <div class="dm-conv-preview">${preview}</div>
          </div>
        </div>
      `;
    }).join('');
    dmConversationsList.querySelectorAll('.dm-conv-item').forEach(el=>{
      el.addEventListener('click', ()=> subscribeToDm(el.dataset.id, el.dataset.name));
    });
  }

  function subscribeToDm(convoId, otherUsername){
    if(dmUnsub){ dmUnsub(); dmUnsub = null; }
    currentDmConvo = convoId;
    dmThreadLabel.textContent = 'Chatting with: ' + otherUsername;
    dmMsgInput.disabled = false;
    dmSendBtn.disabled = false;
    dmLog.innerHTML = '<div class="empty-state">loading…</div>';
    dmNewSearch.style.display = 'none';
    dmTargetUsername.value = '';
    hideDmSearchResults();
    dmUnsub = db.collection('dms').doc(convoId).collection('messages')
      .orderBy('t', 'asc').limit(200)
      .onSnapshot(snap => {
        const messages = snap.docs.map(d => d.data());
        renderDm(messages);
      }, err => console.error('dm listener error', err));

    // register/refresh this conversation so it shows up in both users' history
    const otherUid = convoId.split('_').find(id => id !== auth.currentUser.uid);
    db.collection('dms').doc(convoId).set({
      participants: convoId.split('_'),
      participantNames: {
        [auth.currentUser.uid]: myUsername,
        [otherUid]: otherUsername
      },
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(e => console.error('convo registration failed', e));

    renderConversationList();
  }

  let dmSearchDebounce = null;

  function hideDmSearchResults(){
    dmSearchResults.classList.remove('show');
    dmSearchResults.innerHTML = '';
  }

  function pickDmResult(uid, username){
    dmTargetUsername.value = username;
    hideDmSearchResults();
    subscribeToDm(convoIdFor(auth.currentUser.uid, uid), username);
  }

  async function searchUsernames(){
    const raw = dmTargetUsername.value.trim();
    if(!raw || !auth || !auth.currentUser || !db){ hideDmSearchResults(); return; }
    const prefix = raw.toLowerCase();
    try{
      const snap = await db.collection('usernames')
        .orderBy(firebase.firestore.FieldPath.documentId())
        .startAt(prefix).endAt(prefix + '\uf8ff')
        .limit(8).get();
      const items = snap.docs
        .filter(d => d.id !== (myUsername || '').toLowerCase())
        .map(d => ({ uid: d.data().uid, username: d.data().username || d.id }));
      if(!items.length){
        dmSearchResults.innerHTML = '<div class="dm-search-empty">no matching usernames</div>';
      } else {
        dmSearchResults.innerHTML = items.map(it =>
          `<div class="dm-search-item" data-uid="${it.uid}" data-username="${escapeHtml(it.username)}">${escapeHtml(it.username)}</div>`
        ).join('');
        dmSearchResults.querySelectorAll('.dm-search-item').forEach(el=>{
          el.addEventListener('click', ()=> pickDmResult(el.dataset.uid, el.dataset.username));
        });
      }
      dmSearchResults.classList.add('show');
    }catch(e){ console.error('username search failed', e); hideDmSearchResults(); }
  }

  async function openDm(){
    if(!auth || !auth.currentUser || !db || !myUsername) return;
    const target = dmTargetUsername.value.trim();
    if(!target) return;
    const lower = target.toLowerCase();
    if(lower === myUsername.toLowerCase()){
      dmThreadLabel.textContent = "That's your own username — enter someone else's.";
      return;
    }
    dmOpenBtn.disabled = true;
    try{
      const unameDoc = await db.collection('usernames').doc(lower).get();
      if(!unameDoc.exists){
        dmThreadLabel.textContent = 'No user found with that username.';
      } else {
        const data = unameDoc.data();
        hideDmSearchResults();
        subscribeToDm(convoIdFor(auth.currentUser.uid, data.uid), data.username || target);
      }
    }catch(e){ console.error('open dm failed', e); }
    dmOpenBtn.disabled = false;
  }

  async function sendDm(){
    if(!currentDmConvo || !auth || !auth.currentUser || !db || !myUsername) return;
    const text = dmMsgInput.value.trim();
    if(!text) return;
    dmSendBtn.disabled = true;
    try{
      const entry = {
        senderId: auth.currentUser.uid,
        senderName: myUsername,
        isAdmin,
        text,
        t: firebase.firestore.FieldValue.serverTimestamp()
      };
      if(myRoblox) entry.senderRoblox = myRoblox;
      await db.collection('dms').doc(currentDmConvo).collection('messages').add(entry);
      await db.collection('dms').doc(currentDmConvo).set({
        lastMessage: text.slice(0, 120),
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      dmMsgInput.value = '';
    }catch(e){ console.error('send dm failed', e); }
    dmSendBtn.disabled = false;
    dmMsgInput.focus();
  }

  dmUsernameClaimBtn.addEventListener('click', claimUsername);
  dmUsernameInput.addEventListener('keydown', e=>{ if(e.key === 'Enter') claimUsername(); });
  dmUsernameSwitchBtn.addEventListener('click', switchUsername);
  dmUsernameSwitchInput.addEventListener('keydown', e=>{ if(e.key === 'Enter') switchUsername(); });
  dmRobloxSaveBtn.addEventListener('click', saveRoblox);
  dmRobloxInput.addEventListener('keydown', e=>{ if(e.key === 'Enter') saveRoblox(); });
  profilePhotoBtn.addEventListener('click', ()=> profilePhotoInput.click());
  profilePhotoInput.addEventListener('change', handlePhotoChosen);
  profilePhotoRemoveBtn.addEventListener('click', removePhoto);
  profileSaveBtn.addEventListener('click', saveProfile);
  profileNameInput.addEventListener('keydown', e=>{ if(e.key === 'Enter') saveProfile(); });
  profileRoleInput.addEventListener('keydown', e=>{ if(e.key === 'Enter') saveProfile(); });
  reserveUsernameBtn.addEventListener('click', reserveUsername);
  reserveUsernameInput.addEventListener('keydown', e=>{ if(e.key === 'Enter') reserveUsername(); });
  reserveRobloxBtn.addEventListener('click', reserveRoblox);
  reserveRobloxInput.addEventListener('keydown', e=>{ if(e.key === 'Enter') reserveRoblox(); });
  dmNewBtn.addEventListener('click', ()=>{
    const showing = dmNewSearch.style.display !== 'none';
    dmNewSearch.style.display = showing ? 'none' : '';
    if(!showing) dmTargetUsername.focus();
    else hideDmSearchResults();
  });
  dmOpenBtn.addEventListener('click', openDm);
  dmTargetUsername.addEventListener('keydown', e=>{ if(e.key === 'Enter') openDm(); });
  dmTargetUsername.addEventListener('input', ()=>{
    if(dmSearchDebounce) clearTimeout(dmSearchDebounce);
    dmSearchDebounce = setTimeout(searchUsernames, 250);
  });
  dmTargetUsername.addEventListener('focus', ()=>{
    if(dmTargetUsername.value.trim()) searchUsernames();
  });
  document.addEventListener('click', e=>{
    if(!dmSearchResults.contains(e.target) && e.target !== dmTargetUsername) hideDmSearchResults();
  });
  dmSendBtn.addEventListener('click', sendDm);
  dmMsgInput.addEventListener('keydown', e=>{ if(e.key === 'Enter') sendDm(); });

  sendBtn.addEventListener('click', sendMessage);
  msgInput.addEventListener('keydown', e=>{ if(e.key === 'Enter') sendMessage(); });
  killsAddBtn.addEventListener('click', addKillsEntry);
  killsCount.addEventListener('keydown', e=>{ if(e.key === 'Enter') addKillsEntry(); });
  killsName.addEventListener('keydown', e=>{ if(e.key === 'Enter') addKillsEntry(); });
  killsRoblox.addEventListener('keydown', e=>{ if(e.key === 'Enter') addKillsEntry(); });
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
