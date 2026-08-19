// Mr Steeeck — floating live chat widget
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  'https://tckzvajdoyxpycbzonsf.supabase.co',
  'sb_publishable_ArwWZFwAMOu5mmkwIIQebg_d4xwIUR6'
);

function getSessionId(){
  let id = localStorage.getItem('steeeck_chat_session');
  if (!id){
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('steeeck_chat_session', id);
  }
  return id;
}

function getSavedName(){
  return localStorage.getItem('steeeck_chat_name') || '';
}

const sessionId = getSessionId();

const styleTag = document.createElement('style');
styleTag.textContent = `
  #steeeckChatBubble{
    position:fixed; bottom:20px; right:20px; z-index:200;
    width:58px; height:58px; border-radius:50%;
    background:var(--honey-bright, #e0a854); color:#241a13;
    border:none; font-size:1.5rem; cursor:pointer;
    box-shadow:0 10px 24px rgba(0,0,0,0.35);
    display:flex; align-items:center; justify-content:center;
    transition:transform 0.2s ease;
  }
  #steeeckChatBubble:hover{transform:scale(1.06);}
  #steeeckChatPanel{
    position:fixed; bottom:90px; right:20px; z-index:200;
    width:min(340px, 88vw); max-height:70vh;
    background:#f1e7d3; border:1px solid #d8c6a2; border-radius:10px;
    box-shadow:0 20px 40px rgba(0,0,0,0.4);
    display:none; flex-direction:column; overflow:hidden;
    font-family:'Work Sans', sans-serif;
  }
  #steeeckChatPanel.open{display:flex;}
  #steeeckChatHeader{
    background:#241a13; color:#faf6ef; padding:0.9rem 1rem;
    font-family:'Fraunces', serif; font-weight:600; font-size:0.95rem;
    display:flex; align-items:center; justify-content:space-between;
  }
  #steeeckChatHeader button{background:none; border:none; color:#e0d3bd; font-size:1.1rem; cursor:pointer;}
  #steeeckChatMessages{
    flex:1; overflow-y:auto; padding:0.9rem; display:flex; flex-direction:column; gap:0.6rem;
    min-height:180px; max-height:340px;
  }
  .steeeck-msg{max-width:82%; padding:0.55rem 0.8rem; border-radius:10px; font-size:0.86rem; line-height:1.4;}
  .steeeck-msg.customer{align-self:flex-end; background:#e0a854; color:#241a13; border-bottom-right-radius:2px;}
  .steeeck-msg.admin{align-self:flex-start; background:#fff; border:1px solid #d8c6a2; color:#3a2818; border-bottom-left-radius:2px;}
  #steeeckChatForm{border-top:1px solid #d8c6a2; padding:0.7rem; display:flex; gap:0.5rem;}
  #steeeckChatInput{
    flex:1; padding:0.55rem 0.7rem; border:1px solid #d8c6a2; border-radius:6px;
    font-size:0.86rem; font-family:inherit;
  }
  #steeeckChatSend{
    background:#4a2e1e; color:#faf6ef; border:none; border-radius:6px;
    padding:0.55rem 0.9rem; font-size:0.86rem; cursor:pointer;
  }
  #steeeckChatNamePrompt{padding:0.9rem; font-size:0.85rem;}
  #steeeckChatNamePrompt input{
    width:100%; padding:0.6rem 0.7rem; border:1px solid #d8c6a2; border-radius:6px;
    margin-top:0.6rem; font-size:0.88rem;
  }
  #steeeckChatNamePrompt button{
    margin-top:0.7rem; width:100%; background:#e0a854; color:#241a13;
    border:none; border-radius:6px; padding:0.6rem; font-weight:600; cursor:pointer;
  }
`;
document.head.appendChild(styleTag);

const bubble = document.createElement('button');
bubble.id = 'steeeckChatBubble';
bubble.setAttribute('aria-label', 'Open live chat');
bubble.textContent = '💬';
document.body.appendChild(bubble);

const panel = document.createElement('div');
panel.id = 'steeeckChatPanel';
panel.innerHTML = `
  <div id="steeeckChatHeader">
    <span>Chat with Mr Steeeck</span>
    <button id="steeeckChatClose" aria-label="Close chat">&times;</button>
  </div>
  <div id="steeeckChatMessages"></div>
  <div id="steeeckChatForm">
    <input type="text" id="steeeckChatInput" placeholder="Type a message…">
    <button id="steeeckChatSend">Send</button>
  </div>
`;
document.body.appendChild(panel);

const messagesEl = document.getElementById('steeeckChatMessages');
const formEl = document.getElementById('steeeckChatForm');
const inputEl = document.getElementById('steeeckChatInput');
const sendBtn = document.getElementById('steeeckChatSend');

function renderMessage(m){
  const div = document.createElement('div');
  div.className = 'steeeck-msg ' + (m.sender === 'admin' ? 'admin' : 'customer');
  div.textContent = m.message;
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function loadHistory(){
  const { data } = await supabase
    .from('chat_messages')
    .select('sender, message, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });
  messagesEl.innerHTML = '';
  if (data && data.length){
    data.forEach(renderMessage);
  } else {
    const welcome = document.createElement('div');
    welcome.className = 'steeeck-msg admin';
    welcome.textContent = "Hey! Send a message and we'll get back to you as soon as we can.";
    messagesEl.appendChild(welcome);
  }
}

let subscribed = false;
function subscribeRealtime(){
  if (subscribed) return;
  subscribed = true;
  supabase
    .channel('chat_' + sessionId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `session_id=eq.${sessionId}` }, (payload) => {
      if (payload.new.sender === 'admin') renderMessage(payload.new);
    })
    .subscribe();
}

async function sendMessage(text, name){
  if (!text.trim()) return;
  renderMessage({ sender: 'customer', message: text });
  await supabase.from('chat_messages').insert({
    session_id: sessionId,
    sender: 'customer',
    name: name,
    message: text.trim()
  });
}

function openPanel(){
  panel.classList.add('open');
  const savedName = getSavedName();
  if (!savedName){
    messagesEl.style.display = 'none';
    formEl.style.display = 'none';
    const prompt = document.createElement('div');
    prompt.id = 'steeeckChatNamePrompt';
    prompt.innerHTML = `
      <p>What's your name?</p>
      <input type="text" id="steeeckChatNameInput" placeholder="Your name">
      <button id="steeeckChatNameSubmit">Start Chat</button>
    `;
    panel.insertBefore(prompt, formEl);
    document.getElementById('steeeckChatNameSubmit').addEventListener('click', () => {
      const val = document.getElementById('steeeckChatNameInput').value.trim();
      if (!val) return;
      localStorage.setItem('steeeck_chat_name', val);
      prompt.remove();
      messagesEl.style.display = 'flex';
      formEl.style.display = 'flex';
      loadHistory();
      subscribeRealtime();
    });
  } else {
    loadHistory();
    subscribeRealtime();
  }
}

bubble.addEventListener('click', () => {
  panel.classList.toggle('open');
  if (panel.classList.contains('open')) openPanel();
});
document.getElementById('steeeckChatClose').addEventListener('click', () => panel.classList.remove('open'));

formEl.addEventListener('submit', (e) => e.preventDefault());
sendBtn.addEventListener('click', () => {
  const text = inputEl.value;
  sendMessage(text, getSavedName());
  inputEl.value = '';
});
inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter'){
    const text = inputEl.value;
    sendMessage(text, getSavedName());
    inputEl.value = '';
  }
});
