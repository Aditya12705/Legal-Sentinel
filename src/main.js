import './style.css'
import { invokeGemini31Pro, auditContractWithGemini31, generateLegalDraft } from './gemini_service.js'
import { parseDocument } from './parser.js'

// State Management
const state = {
  activeView: 'home',
  isScanning: false,
  activeDocumentText: null,
  activeDocumentName: null,
  pendingChatDoc: null,
  history: JSON.parse(localStorage.getItem('legal_sentinel_history') || '[]'),
  lensStream: null,
  scoutStream: null,
  scoutBuffer: new Set(),
  scoutInterval: null,
  isOCRPending: false,
  selectedLang: 'eng',
  isVoiceActive: false
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initAudit();
  initChat();
  initDraft();
  initHistory();
  initLens();
  initScout();
  initLangSelector();
  initVoiceInput();
  
  lucide.createIcons();
});

// 1. Simple Hash-based Router
function initRouter() {
  const handleRoute = () => {
    const hash = window.location.hash.replace('#', '') || 'home';
    state.activeView = hash;
    
    document.querySelectorAll('.view').forEach(view => {
      view.classList.toggle('active', view.id === hash);
    });
    
    document.querySelectorAll('.nav-item').forEach(nav => {
      nav.classList.toggle('active', nav.getAttribute('href') === `#${hash}`);
    });

    lucide.createIcons();
  };

  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

// 2. Audit View Logic
function initAudit() {
  const runBtn = document.querySelector('#run-audit');
  const resultsArea = document.querySelector('#audit-results');
  const textArea = document.querySelector('#audit textarea');
  const fileTrigger = document.querySelector('#file-trigger');
  const cameraTrigger = document.querySelector('#camera-trigger');
  const scoutTrigger = document.querySelector('#scout-trigger');
  const fileInput = document.querySelector('#audit-file-input');
  const scanOverlay = document.querySelector('#scanning-overlay');
  const ocrProgress = document.querySelector('#ocr-progress');
  
  if (!fileTrigger || !cameraTrigger || !scoutTrigger) return;

  fileTrigger.addEventListener('click', () => fileInput.click());
  cameraTrigger.addEventListener('click', () => {
    document.querySelector('#lens-overlay').classList.add('active');
    startLens();
  });

  scoutTrigger.addEventListener('click', startScout);

  window.handleFile = async (file) => {
    state.activeDocumentName = file.name || `Scan_${Date.now()}.png`;
    const isImage = file.type?.startsWith('image/') || file instanceof Blob;
    
    if (isImage) {
      scanOverlay.style.display = 'flex';
      ocrProgress.textContent = "initializing...";
    }

    try {
      const text = await parseDocument(file, state.selectedLang, (progress) => {
        ocrProgress.textContent = `Reading pixels... ${progress}%`;
      });
      state.activeDocumentText = text;
      
      scanOverlay.style.display = 'none';
      
      const preview = document.querySelector('#audit-file-preview');
      if (preview) {
        preview.style.display = 'block';
        preview.innerHTML = `
          <div class="glass-card" style="display: flex; align-items: center; gap: 12px; border: 1px solid var(--safe-glow); padding: 0.75rem 1rem; border-radius: var(--radius-sm);">
            <i data-lucide="file-check" style="color: var(--safe); width: 20px;"></i>
            <div style="flex: 1;">
              <div style="font-size: 0.75rem; font-weight: 900; color: var(--safe); letter-spacing: 1px;">DOCUMENT READY</div>
              <div style="font-size: 0.8rem; color: var(--text-secondary); width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${state.activeDocumentName}</div>
            </div>
          </div>
        `;
        lucide.createIcons();
      }
    } catch (err) {
      scanOverlay.style.display = 'none';
      alert(err.message);
    }
  };

  fileInput.addEventListener('change', (e) => e.target.files[0] && window.handleFile(e.target.files[0]));

  runBtn.addEventListener('click', async () => {
    const text = textArea.value.trim() || state.activeDocumentText;
    if (!text || state.isScanning) return;
    
    runBtn.disabled = true;
    runBtn.innerHTML = `<i class="pulse" data-lucide="loader-2"></i> <span class="typing-dots">Sentinel is auditing risk</span>`;
    lucide.createIcons();
    state.isScanning = true;

    try {
      const result = await auditContractWithGemini31(text);
      renderAuditResults(resultsArea, result);
      saveToHistory('Audit', state.activeDocumentName || 'Pasted Text');
    } catch (e) {
      renderAuditResults(resultsArea, "Connection lost.");
    } finally {
      state.isScanning = false;
      runBtn.disabled = false;
      runBtn.innerHTML = `<i data-lucide="scan-search"></i> Run Legal Audit`;
      lucide.createIcons();
    }
  });
}

function renderAuditResults(container, rawResult) {
  container.style.display = 'block';
  const formattedMsg = rawResult
    .replace(/(HIGH|CRITICAL)/g, '<span class="heatmap-tag h-high">$1</span>')
    .replace(/(MEDIUM|WARNING)/g, '<span class="heatmap-tag h-med">$1</span>')
    .replace(/(LOW|SAFE|CLEAN)/g, '<span class="heatmap-tag h-low">$1</span>');

  container.innerHTML = `
    <div class="glass-card insight-card danger">
      <div class="tag tag-danger">3.1-PRO AUDIT REPORT</div>
      <p class="text-secondary" style="font-size: 0.9rem; white-space: pre-wrap;">${formattedMsg}</p>
    </div>
  `;
  container.scrollIntoView({ behavior: 'smooth' });
}

// 3. Live Sentinel Lens
function initLens() {
  const closeBtn = document.querySelector('#close-lens');
  const captureBtn = document.querySelector('#capture-snapshot');
  if (closeBtn) closeBtn.onclick = stopLens;
  if (captureBtn) captureBtn.onclick = captureSnapshot;
}

async function startLens() {
  const video = document.querySelector('#lens-video');
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } }, 
      audio: false 
    });
    state.lensStream = stream;
    video.srcObject = stream;
  } catch (err) {
    alert("Could not access camera.");
    stopLens();
  }
}

function stopLens() {
  if (state.lensStream) {
    state.lensStream.getTracks().forEach(track => track.stop());
    state.lensStream = null;
  }
  document.querySelector('#lens-overlay').classList.remove('active');
}

async function captureSnapshot() {
  const video = document.querySelector('#lens-video');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  canvas.toBlob((blob) => {
    stopLens();
    window.handleFile(blob);
  }, 'image/png');
}

// 4. Sentinel Screen Scout (Real-Time Capture)
function initScout() {
  const stopBtn = document.querySelector('#stop-scout');
  const manualBtn = document.querySelector('#scout-capture-now');
  
  if (stopBtn) stopBtn.onclick = finishScout;
  if (manualBtn) manualBtn.onclick = () => scoutSamplingLoop(true);
}

async function startScout() {
  const video = document.querySelector('#scout-video');
  const overlay = document.querySelector('#scout-overlay');
  const feed = document.querySelector('#scout-text-stream');

  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ 
      video: { cursor: 'always' } 
    });
    state.scoutStream = stream;
    video.srcObject = stream;
    overlay.classList.add('active');
    state.scoutBuffer.clear();
    feed.innerHTML = `<p class="text-dim">Sentinel Vision Active. Start scrolling...</p>`;

    // End stream listener
    stream.getVideoTracks()[0].onended = finishScout;

    // Start Sampling Loop (Every 2 seconds)
    state.scoutInterval = setInterval(scoutSamplingLoop, 2000);

  } catch (err) {
    alert("Screen capture refused.");
  }
}

async function scoutSamplingLoop(isManual = false) {
  const video = document.querySelector('#scout-video');
  const feed = document.querySelector('#scout-text-stream');
  
  if (!video || video.videoWidth < 100) return; 
  if (state.isOCRPending && !isManual) return; 

  const canvas = document.createElement('canvas');
  // Scale UP for better accuracy on small screen text
  const scale = 1.2;
  canvas.width = video.videoWidth * scale;
  canvas.height = video.videoHeight * scale;
  
  const ctx = canvas.getContext('2d');
  ctx.filter = 'contrast(1.4) grayscale(1) brightness(1.1)';
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  canvas.toBlob(async (blob) => {
    state.isOCRPending = true;
    try {
      const text = await parseDocument(blob, state.selectedLang);
      const cleanedText = text.trim();
      
      if (cleanedText.length > 25 && !state.scoutBuffer.has(cleanedText)) {
        state.scoutBuffer.add(cleanedText);
        const item = document.createElement('div');
        item.className = 'feed-item';
        item.innerHTML = `<span style="color:var(--safe)">[SCANNED]</span> ${cleanedText.substring(0, 150)}...`;
        feed.prepend(item);
        if (feed.children.length > 20) feed.lastChild.remove();
        
        // Visual ping
        feed.parentElement.style.borderColor = "var(--primary)";
        setTimeout(() => feed.parentElement.style.borderColor = "transparent", 300);
      }
    } catch (e) {
      console.warn("Retrying scan...");
    } finally {
      state.isOCRPending = false;
    }
  });
}

function finishScout() {
  const manualBtn = document.querySelector('#scout-capture-now');
  clearInterval(state.scoutInterval);
  
  if (state.scoutStream) {
    state.scoutStream.getTracks().forEach(track => track.stop());
    state.scoutStream = null;
  }
  document.querySelector('#scout-overlay').classList.remove('active');

  const fullText = Array.from(state.scoutBuffer).join('\n\n');
  if (fullText.length > 50) {
    state.activeDocumentText = fullText;
    state.activeDocumentName = "Screen Scout Capture";
    const scoutLabel = document.querySelector('#scout-trigger .media-label');
    if (scoutLabel) scoutLabel.innerHTML = `<i data-lucide="check" style="width:14px; color:var(--safe);"></i> Scout Ready`;
    lucide.createIcons();
    
    // Switch view and trigger audit automatically
    window.location.hash = '#audit';
    setTimeout(() => {
        const runBtn = document.querySelector('#run-audit');
        if (runBtn) runBtn.click();
    }, 100);

  } else {
    alert("Sentinel Vision failed: No legal text captured. Try scrolling slower or using 'Harvest Now'.");
  }
}

// 5. Language Selector Logic (Sync across Audit/Chat)
function initLangSelector() {
  const auditTrigger = document.querySelector('#lang-menu-trigger');
  const chatTrigger = document.querySelector('#chat-lang-trigger');
  const labelTexts = document.querySelectorAll('.active-lang-text, #active-lang');
  const allOptions = document.querySelectorAll('.lang-option');

  const updateGlobalLang = (lang, display) => {
    state.selectedLang = (lang === 'eng') ? 'eng' : `eng+${lang}`;
    labelTexts.forEach(label => label.textContent = display);
    
    allOptions.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.lang === lang);
    });
  };

  [auditTrigger, chatTrigger].forEach(trigger => {
    if (!trigger) return;
    trigger.onclick = (e) => {
      e.stopPropagation();
      document.querySelectorAll('.lang-selector-pill').forEach(t => {
          if (t !== trigger) t.classList.remove('active');
      });
      trigger.classList.toggle('active');
    };
  });

  document.onclick = () => document.querySelectorAll('.lang-selector-pill').forEach(t => t.classList.remove('active'));

  allOptions.forEach(opt => {
    opt.onclick = (e) => {
      e.stopPropagation();
      const lang = opt.dataset.lang;
      const display = opt.textContent.split(' (')[0];
      updateGlobalLang(lang, display);
      document.querySelectorAll('.lang-selector-pill').forEach(t => t.classList.remove('active'));
    };
  });
}

// 6. Voice Input (Sentinel Ear)
function initVoiceInput() {
  const trigger = document.querySelector('#voice-trigger');
  const chatInput = document.querySelector('.chat-input');
  
  if (!trigger) return;

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    trigger.onclick = () => alert("Voice input is not supported in this browser or over insecure connections (HTTPS required).");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;

  const langMap = {
    'eng': 'en-IN',
    'eng+hin': 'hi-IN',
    'eng+kan': 'kn-IN',
    'eng+tam': 'ta-IN',
    'eng+tel': 'te-IN',
    'eng+ben': 'bn-IN'
  };

  trigger.onclick = () => {
    if (state.isVoiceActive) {
      recognition.stop();
    } else {
      recognition.lang = langMap[state.selectedLang] || 'en-IN';
      recognition.start();
    }
  };

  recognition.onstart = () => {
    state.isVoiceActive = true;
    trigger.classList.add('recording');
    chatInput.classList.add('listening');
    chatInput.placeholder = "Listening to you...";
  };

  recognition.onresult = (e) => {
    let transcript = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
    }
    chatInput.value = transcript;
  };

  recognition.onerror = () => {
    stopVoice();
  };

  recognition.onend = () => {
    stopVoice();
  };

  const stopVoice = () => {
    state.isVoiceActive = false;
    trigger.classList.remove('recording');
    chatInput.classList.remove('listening');
    chatInput.placeholder = "Ask your legal scout...";
  };
}

// 6. Chat Logic
function initChat() {
  const chatInput = document.querySelector('.chat-input');
  const chatBtn = document.querySelector('.chat-send-trigger');
  const uploadBtn = document.querySelector('#chat-upload-trigger');
  const fileInput = document.querySelector('#chat-file-input');
  const attachmentPreview = document.querySelector('#pending-attachment');

  if (!chatBtn) return;

  uploadBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      attachmentPreview.style.display = 'block';
      attachmentPreview.innerHTML = `<i data-lucide="file-text" style="width:12px;"></i> ${file.name} 
        <i data-lucide="x" style="width:12px; cursor:pointer;" id="remove-attachment"></i>`;
      lucide.createIcons();

      document.querySelector('#remove-attachment').onclick = () => {
          state.pendingChatDoc = null;
          attachmentPreview.style.display = 'none';
      };

      const text = await parseDocument(file, state.selectedLang);
      state.pendingChatDoc = { name: file.name, text: text };
    }
  });

  const sendMessage = async () => {
    const text = chatInput.value.trim();
    if (!text && !state.pendingChatDoc) return;

    if (state.pendingChatDoc) addFileMessage(state.pendingChatDoc.name);
    if (text) addMessage('user', text);
    
    const userTextCopy = text;
    const pendingDocCopy = state.pendingChatDoc;
    
    chatInput.value = '';
    attachmentPreview.style.display = 'none';
    state.pendingChatDoc = null;

    const botMsg = addMessage('bot', '');
    botMsg.innerHTML = `<span class="typing-dots">Sentinel is typing</span>`;
    
    try {
      let prompt = userTextCopy;
      if (pendingDocCopy) {
        prompt = `[FILE: ${pendingDocCopy.name}]\nContent: ${pendingDocCopy.text.substring(0, 3000)}\n\nQuestion: ${userTextCopy}`;
      }
      const response = await invokeGemini31Pro(prompt);
      botMsg.textContent = response;
      saveToHistory('Chat', userTextCopy || (pendingDocCopy ? pendingDocCopy.name : "Chat Message"));
    } catch (e) {
      botMsg.textContent = "Error.";
    }
  };

  chatBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') sendMessage(); });
}

function addMessage(sender, text) {
  const container = document.querySelector('#chat-messages');
  const msg = document.createElement('div');
  msg.className = `msg msg-${sender}`;
  msg.textContent = text;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
  return msg;
}

function addFileMessage(filename) {
  const container = document.querySelector('#chat-messages');
  const msg = document.createElement('div');
  msg.className = `msg msg-file`;
  msg.innerHTML = `
    <div class="file-icon-box"><i data-lucide="file-text"></i></div>
    <div style="flex: 1; overflow: hidden;">
      <div style="font-weight: 600; font-size: 0.8rem;">${filename}</div>
      <div style="font-size: 0.65rem; color: var(--text-dim);">Document Sent</div>
    </div>
  `;
  container.appendChild(msg);
  lucide.createIcons();
}

// 7. Draft Logic
function initDraft() {
  const draftBtn = document.querySelector('#run-draft');
  const resultsArea = document.querySelector('#draft-results');
  const docType = document.querySelector('#draft select');
  const docDetails = document.querySelector('#draft textarea');

  if (!draftBtn) return;

  draftBtn.addEventListener('click', async () => {
    if (state.isScanning) return;
    
    const type = docType.value;
    const details = docDetails.value.trim();
    if (!details) {
      alert("Please provide some details for the draft.");
      return;
    }

    draftBtn.disabled = true;
    draftBtn.innerHTML = `<i class="pulse" data-lucide="loader-2"></i> <span class="typing-dots">Sentinel is drafting</span>`;
    lucide.createIcons();
    state.isScanning = true;

    try {
      const result = await generateLegalDraft(type, details);
      renderDraftResults(resultsArea, result);
      saveToHistory('Draft', `${type}: ${details.substring(0, 20)}...`);
    } catch (e) {
      alert("Failed to generate draft.");
    } finally {
      state.isScanning = false;
      draftBtn.disabled = false;
      draftBtn.innerHTML = `<i data-lucide="pen-tool"></i> Draft Document`;
      lucide.createIcons();
    }
  });
}

function renderDraftResults(container, rawResult) {
  container.style.display = 'block';
  container.innerHTML = `
    <div class="glass-card" style="border: 1px solid var(--primary-glow); position: relative;">
      <div class="tag tag-primary" style="margin-bottom: 1rem;">GENERATED DRAFT</div>
      <p id="draft-text" class="text-secondary" style="font-size: 0.9rem; white-space: pre-wrap; font-family: monospace; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.05);">${rawResult}</p>
      <button class="btn-primary" id="copy-draft-btn" style="margin-top: 1rem; width: auto; font-size: 0.8rem; padding: 0.5rem 1rem;">
        <i data-lucide="copy"></i> <span class="btn-text">Copy Draft</span>
      </button>
    </div>
  `;
  lucide.createIcons();
  const copyBtn = container.querySelector('#copy-draft-btn');
  const btnText = copyBtn.querySelector('.btn-text');
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(rawResult).then(() => {
      btnText.textContent = "Copied!";
      copyBtn.style.background = "var(--safe)";
      setTimeout(() => { btnText.textContent = "Copy Draft"; copyBtn.style.background = ""; }, 2000);
    });
  };
  container.scrollIntoView({ behavior: 'smooth' });
}

// 8. History System
function initHistory() {
  const overlay = document.querySelector('#history-overlay');
  const openBtn = document.querySelector('#view-history');
  const closeBtn = document.querySelector('#close-history');
  const list = document.querySelector('#history-list');
  if (!openBtn) return;
  openBtn.onclick = () => { overlay.classList.add('active'); renderHistoryList(list); };
  closeBtn.onclick = () => overlay.classList.remove('active');
}

function saveToHistory(type, summary) {
  state.history.unshift({ type, summary, date: new Date().toLocaleString() });
  if (state.history.length > 10) state.history.pop();
  localStorage.setItem('legal_sentinel_history', JSON.stringify(state.history));
}

function renderHistoryList(container) {
  if (state.history.length === 0) {
    container.innerHTML = `<p class="text-dim" style="text-align: center; margin-top: 2rem;">No history yet.</p>`;
    return;
  }
  container.innerHTML = state.history.map(item => `
    <div class="history-item">
      <div>
        <div style="font-size: 0.6rem; color: var(--primary); text-transform: uppercase; font-weight: 800;">${item.type}</div>
        <div style="font-weight: 600; font-size: 0.9rem;">${item.summary}</div>
        <div style="font-size: 0.7rem; color: var(--text-dim);">${item.date}</div>
      </div>
      <i data-lucide="chevron-right" style="color: var(--text-dim);"></i>
    </div>
  `).join('');
  lucide.createIcons();
}
