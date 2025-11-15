const PIPEDREAM_URL = "https://eodnw12pzbqrlmq.m.pipedream.net";

const el = id => document.getElementById(id);

const toastEl = el('toast');
function showToast(msg, isErr = false){
  if(!toastEl) { console.log('TOAST:', msg); return; }
  toastEl.textContent = msg;
  toastEl.style.background = isErr ? '#c53030' : '#111';
 
  toastEl.classList.add('show');

  setTimeout(()=> toastEl.classList.remove('show'), 3500);
}


async function fetchJSON(path){
  try{
    const res = await fetch(path, {cache: "no-store"});
    if(!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  }catch(err){
    console.error('Failed to load', path, err);
    showToast('Failed to load data. If opening locally, run a simple HTTP server.', true);
    return null;
  }
}

const FEES_KEY_MAP = { 'uni1': 'LPU', 'uni2': 'CU' };

async function initIndex(){
  const data = await fetchJSON('universities.json');
  if(!data) return;
  const uni = data.find(u => u.id === 'uni1');
  if(!uni) return;

  if(el('overview')) el('overview').textContent = uni.overview || '';
  if(el('placements')) el('placements').textContent = `Average: ${uni.placements?.avgPackage || '-'} • Top: ${uni.placements?.top || '-'}`;

  const ul = el('courses');
  const select = el('courseSelect');
  if(ul) {
    ul.innerHTML = '';
    uni.courses.forEach(c => {
      const li = document.createElement('li'); li.textContent = `${c.name} — ${c.duration}`; ul.appendChild(li);
    });
  }
  if(select) {
    select.innerHTML = '<option value="">-- select --</option>';
    uni.courses.forEach(c => {
      const opt = document.createElement('option'); opt.value = c.code; opt.textContent = `${c.code} — ${c.name}`; select.appendChild(opt);
    });
  }

  const feesBtn = el('openFees');
  if(feesBtn) feesBtn.addEventListener('click', ()=> openFeesModal('uni1', 'modalBody'));

  const form = el('leadForm');
  if(form) form.addEventListener('submit', handleFormSubmit);
}

async function initPage2(){
  const data = await fetchJSON('universities.json');
  if(!data) return;
  const uni = data.find(u => u.id === 'uni2');
  if(!uni) return;

  if(el('overview2')) el('overview2').textContent = uni.overview || '';
  if(el('placements2')) el('placements2').textContent = `Average: ${uni.placements?.avgPackage || '-'} • Top: ${uni.placements?.top || '-'}`;

  const ul = el('courses2');
  const select = el('courseSelect2');
  if(ul) {
    ul.innerHTML = '';
    uni.courses.forEach(c => {
      const li = document.createElement('li'); li.textContent = `${c.name} — ${c.duration}`; ul.appendChild(li);
    });
  }
  if(select) {
    select.innerHTML = '<option value="">-- select --</option>';
    uni.courses.forEach(c => {
      const opt = document.createElement('option'); opt.value = c.code; opt.textContent = `${c.code} — ${c.name}`; select.appendChild(opt);
    });
  }

  const feesBtn = el('openFees2');
  if(feesBtn) feesBtn.addEventListener('click', ()=> openFeesModal('uni2', 'modalBody2'));

  const form = el('leadForm2');
  if(form) form.addEventListener('submit', handleFormSubmit);
}

async function openFeesModal(uniId, modalBodyId){
  const fees = await fetchJSON('fees.json');
  const container = el(modalBodyId);
  if(!container) return;
  const modal = container.closest('.modal');
  if(!modal) return;

  const feesKey = FEES_KEY_MAP[uniId] || uniId;
  const ufees = (fees && fees[feesKey]) ? fees[feesKey] : {};

  container.innerHTML = '';
  if(!fees || Object.keys(ufees).length === 0){
    container.innerHTML = '<p>No fee info available.</p>';
  } else {
    
    const table = document.createElement('table');
    table.className = 'fees-table';
    table.innerHTML = `
      <thead><tr><th>Course</th><th>Min (per year)</th><th>Max (per year)</th></tr></thead>
      <tbody>${Object.entries(ufees).map(([course, r])=>`
        <tr>
          <td>${course}</td>
          <td>₹${numberWithCommas(r.min)}</td>
          <td>₹${numberWithCommas(r.max)}</td>
        </tr>`).join('')}
      </tbody>
    `;
    container.appendChild(table);
  }

  modal.classList.remove('hidden');
  modal.classList.add('visible');
  modal.setAttribute('aria-hidden', 'false');
  const closeBtn = modal.querySelector('.modal-close');
  const okBtn = modal.querySelector('.modal-actions button');

  if(modal.dataset.wired === '1'){
    if(closeBtn) closeBtn.focus();
    return;
  }
  modal.dataset.wired = '1';
  const lastFocus = document.activeElement;

  function closeModal(){
    modal.classList.remove('visible');
    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');
    try{ if(lastFocus && lastFocus.focus) lastFocus.focus(); } catch(e){}
  }
  function outside(e){ if(e.target === modal) closeModal(); }

  if(closeBtn) closeBtn.addEventListener('click', closeModal);
  if(okBtn) okBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', outside);
  document.addEventListener('keydown', (e)=> { if(e.key === 'Escape' && modal.classList.contains('visible')) closeModal(); });

  if(closeBtn) closeBtn.focus();
}
function numberWithCommas(x){
  if(x === undefined || x === null) return '0';
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function handleFormSubmit(e){
  e.preventDefault();
  const form = e.target;
  const formMsg = form.querySelector('.form-msg');

  const nameField = form.querySelector('[name="fullName"]');
  const emailField = form.querySelector('[name="email"]');
  const phoneField = form.querySelector('[name="phone"]');
  const stateField = form.querySelector('[name="state"]');
  const courseField = form.querySelector('[name="course"]');
  const intakeField = form.querySelector('[name="intake"]');
  const consentField = form.querySelector('[name="consent"]');

  const data = {
    fullName: (nameField?.value || '').trim(),
    email: (emailField?.value || '').trim(),
    phone: (phoneField?.value || '').trim(),
    state: (stateField?.value || '').trim(),
    course: (courseField?.value || ''),
    intake: (intakeField?.value || '').trim(),
    consent: !!(consentField?.checked),
    submittedAt: new Date().toISOString(),
    page: location.pathname
  };

  if(!data.fullName){ if(formMsg) formMsg.textContent = 'Enter full name'; return; }
  if(!/^\S+@\S+\.\S+$/.test(data.email)){ if(formMsg) formMsg.textContent = 'Invalid email'; return; }
  if(!/^[6-9]\d{9}$/.test(data.phone)){ if(formMsg) formMsg.textContent = 'Enter valid 10-digit Indian phone'; return; }
  if(!data.consent){ if(formMsg) formMsg.textContent = 'Consent required'; return; }

  if(formMsg) formMsg.textContent = 'Submitting...';

  if(!PIPEDREAM_URL || PIPEDREAM_URL.includes('REPLACE')){
    setTimeout(()=> {
      if(formMsg) formMsg.textContent = 'Demo: lead not sent (PIPEDREAM_URL not set). Replace URL in script.js to send real leads.';
      showToast('Lead not sent (Pipedream URL not set)', true);
    }, 700);
    return;
  }

  try{
    const res = await fetch(PIPEDREAM_URL, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify(data)
    });
    if(!res.ok) throw new Error('Network error');
    if(formMsg) formMsg.textContent = 'Submitted successfully — thank you!';
    showToast('Lead submitted successfully');
    form.reset();
  }catch(err){
    console.error(err);
    if(formMsg) formMsg.textContent = 'Submission failed — try again';
    showToast('Submission failed', true);
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  if(el('overview')) initIndex();
  if(el('overview2')) initPage2();
});
