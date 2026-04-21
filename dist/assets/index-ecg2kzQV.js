(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin===`use-credentials`?t.credentials=`include`:e.crossOrigin===`anonymous`?t.credentials=`omit`:t.credentials=`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e={activeView:`home`,isScanning:!1,chatHistory:[{sender:`bot`,text:`Hi! I'm your Legal Scout. Upload a document or just ask me anything about your consumer rights!`}]};document.addEventListener(`DOMContentLoaded`,()=>{t(),n(),i(),s(),lucide.createIcons()});function t(){let t=()=>{let t=window.location.hash.replace(`#`,``)||`home`;e.activeView=t,document.querySelectorAll(`.view`).forEach(e=>{e.classList.toggle(`active`,e.id===t)}),document.querySelectorAll(`.nav-item`).forEach(e=>{e.classList.toggle(`active`,e.getAttribute(`href`)===`#${t}`)}),lucide.createIcons()};window.addEventListener(`hashchange`,t),t()}function n(){let t=document.querySelector(`#run-audit`),n=document.querySelector(`#audit-results`);document.querySelector(`#audit textarea`),t&&t.addEventListener(`click`,()=>{e.isScanning||(t.disabled=!0,t.innerHTML=`<i class="pulse" data-lucide="loader-2"></i> Analyzing Your Rights...`,lucide.createIcons(),e.isScanning=!0,setTimeout(()=>{e.isScanning=!1,t.disabled=!1,t.innerHTML=`<i data-lucide="scan-search"></i> Run New Audit`,lucide.createIcons(),r(n)},2e3))})}function r(e){e.style.display=`block`,e.innerHTML=`
    <div class="glass-card" style="border-left: 4px solid var(--accent);">
      <div class="tag tag-danger">Critical Risk</div>
      <h3 style="margin-bottom: 0.5rem;">Hidden Cancellation Fee</h3>
      <p class="text-secondary" style="font-size: 0.9rem; margin-bottom: 1rem;">
        This contract hides a <strong>$150 termination fee</strong> that isn't mentioned in the main marketing page.
      </p>
      <div class="text-dim" style="font-size: 0.8rem; padding: 0.5rem; background: rgba(0,0,0,0.2); border-radius: 4px;">
        "Section 4.12: Consumer agrees to a service termination fee of USD 150.00 regardless of notice period..."
      </div>
    </div>

    <div class="glass-card" style="border-left: 4px solid var(--warning);">
      <div class="tag" style="background: rgba(245, 158, 11, 0.1); color: var(--warning);">Data Warning</div>
      <h3 style="margin-bottom: 0.5rem;">Automatic Data Sharing</h3>
      <p class="text-secondary" style="font-size: 0.9rem;">
        The service shares your activity with "3rd party affiliates" for advertising purposes by default.
      </p>
    </div>

    <div class="glass-card" style="border-left: 4px solid var(--primary);">
       <h3 style="margin-bottom: 0.5rem;">TL;DR Summary</h3>
       <p class="text-secondary" style="font-size: 0.9rem;">
         Overall, this is a <strong>Medium Risk</strong> agreement. The biggest red flag is the hidden exit fee. If you sign, make sure to opt-out of ad sharing in the settings.
       </p>
    </div>
  `,e.scrollIntoView({behavior:`smooth`})}function i(){let e=document.querySelector(`#chat input`),t=document.querySelector(`#chat button`);if(document.querySelector(`#chat-messages`),!t)return;let n=()=>{let t=e.value.trim();t&&(a(`user`,t),e.value=``,setTimeout(()=>{a(`bot`,o(t))},800))};t.addEventListener(`click`,n),e.addEventListener(`keypress`,e=>{e.key===`Enter`&&n()})}function a(e,t){let n=document.querySelector(`#chat-messages`),r=document.createElement(`div`);r.className=`msg msg-${e}`,r.textContent=t,n.appendChild(r),n.scrollTop=n.scrollHeight}function o(e){let t=e.toLowerCase();return t.includes(`rent`)?`Based on typical rental laws, your rent can usually only be increased once a year with a 60-day notice. Check Section 5 in your lease for specific 'Escalation' clauses!`:t.includes(`cancel`)?`Most subscription apps must provide a simple one-click cancellation. If they're making it hard, I can draft a formal dispute letter for you in the 'Draft' section!`:`That's a great question. As your Legal Scout, I recommend checking for 'Liability' or 'Indemnity' keywords in that specific part of your document.`}function s(){let e=document.querySelector(`#draft button`);e&&e.addEventListener(`click`,()=>{e.innerHTML=`<i class="pulse" data-lucide="loader-2"></i> Drafting...`,lucide.createIcons(),setTimeout(()=>{e.innerHTML=`<i data-lucide="check"></i> Document Ready!`,lucide.createIcons(),alert(`I've drafted your dispute letter! Check your downloads (simulated).`),setTimeout(()=>{e.innerHTML=`<i data-lucide="pen-tool"></i> Draft Document`,lucide.createIcons()},2e3)},1500)})}