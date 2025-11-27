document.addEventListener('DOMContentLoaded', () => {
  const checkNowBtn = document.getElementById('check-now');
  if (checkNowBtn) {
    checkNowBtn.addEventListener('click', () => {
      window.location.href = './questionnaire.html';
    });
  }
  const form = document.getElementById('risk-form');
  const genderEl = document.getElementById('gender');
  const ageGroupEl = document.getElementById('age_group');
  const smokeChestEl = document.getElementById('smoke_chest_tightness');
  const coldDustEl = document.getElementById('cold_dust_trigger');
  const familyAsthmaEl = document.getElementById('family_asthma');
  const exerciseTriggerEl = document.getElementById('exercise_trigger');
  const nightShortEl = document.getElementById('night_shortness');
  const laughTriggerEl = document.getElementById('laugh_trigger');
  const selectEls = [genderEl, ageGroupEl, smokeChestEl, coldDustEl, familyAsthmaEl, exerciseTriggerEl, nightShortEl, laughTriggerEl];
  if (form) {
    const submitBtn = form.querySelector('.btn');
    const modalOverlay = document.getElementById('result-modal');
    const modalMessageEl = modalOverlay ? modalOverlay.querySelector('.modal-message') : null;
    const modalRecoEl = modalOverlay ? modalOverlay.querySelector('.modal-reco') : null;
    const modalAnswersEl = modalOverlay ? modalOverlay.querySelector('.modal-answers') : null;
    const modalCloseBtn = modalOverlay ? modalOverlay.querySelector('.modal-close') : null;

    const updateButtonState = () => {
      submitBtn.disabled = false;
      [smokeChestEl, nightShortEl].forEach(sel => {
        const wrap = sel.nextElementSibling;
        const btn = wrap && wrap.querySelector('.cselect-toggle');
        if (btn) btn.classList.remove('error');
        const field = sel.closest('.field');
        if (field) field.classList.remove('error');
      });
    };

    updateButtonState();
    const allSelects = [genderEl, ageGroupEl, smokeChestEl, coldDustEl, familyAsthmaEl, exerciseTriggerEl, nightShortEl, laughTriggerEl];
    allSelects.forEach(el => el.addEventListener('change', updateButtonState));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const gender = genderEl.value;
      const age_group = ageGroupEl.value;
      const smoke_chest_tightness = smokeChestEl.value;
      const cold_dust_trigger = coldDustEl.value;
      const family_asthma = familyAsthmaEl.value;
      const exercise_trigger = exerciseTriggerEl.value;
      const night_shortness = nightShortEl.value;
      const laugh_trigger = laughTriggerEl.value;

      if (!gender || !age_group || !smoke_chest_tightness || !cold_dust_trigger || !family_asthma || !exercise_trigger || !night_shortness || !laugh_trigger) {
        const selects = allSelects;
        const firstEmpty = selects.find(s => !s.value);
        selects.forEach(s => {
          const wrap = s.nextElementSibling;
          const btn = wrap && wrap.querySelector('.cselect-toggle');
          if (btn && !s.value) btn.classList.add('error');
          const field = s.closest('.field');
          if (field && !s.value) field.classList.add('error');
        });
        const wrap = firstEmpty && firstEmpty.nextElementSibling;
        const btn = wrap && wrap.querySelector('.cselect-toggle');
        if (btn) btn.focus();
        if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
        return;
      }

      submitBtn.disabled = true;
      const prevText = submitBtn.textContent;
      submitBtn.textContent = 'Sedang menghitung...';
      submitBtn.classList.add('loading');

      try {
        const res = await fetch('/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ gender, age_group, smoke_chest_tightness, cold_dust_trigger, family_asthma, exercise_trigger, night_shortness, laugh_trigger })
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Terjadi kesalahan');
        }
        const data = await res.json();
        const risk = data.risk;
        const cls = risk === 'rendah' ? 'risk-low' : risk === 'sedang' ? 'risk-medium' : 'risk-high';
        const msg = risk === 'rendah' ? 'Risiko Asma: Rendah' : risk === 'sedang' ? 'Risiko Asma: Sedang' : 'Risiko Asma: Tinggi';
        const reco = risk === 'rendah'
          ? 'Anda berada dalam kondisi yang baik! Meski risiko asma Anda rendah, tetap penting untuk menjaga kesehatan. Lakukan aktivitas fisik secara teratur, konsumsi makanan bergizi, dan hindari paparan asap rokok. Jangan lupa untuk melakukan pemeriksaan kesehatan rutin untuk memastikan kondisi Anda tetap stabil.'
          : risk === 'sedang'
          ? 'Anda memiliki risiko asma yang lebih tinggi. Disarankan untuk mengurangi paparan terhadap pemicu asma, seperti asap rokok dan debu. Cobalah untuk menjaga pola makan sehat, berolahraga secara teratur, dan konsultasikan kondisi Anda dengan dokter untuk langkah pencegahan lebih lanjut.'
          : 'Anda memiliki risiko asma yang tinggi. Pastikan untuk segera berkonsultasi dengan dokter spesialis untuk mendapatkan perawatan yang tepat. Hindari pemicu asma seperti asap rokok, polusi, dan alergi. Perhatikan kondisi kesehatan Anda secara rutin dan gunakan obat-obatan yang direkomendasikan jika perlu.';
        if (modalMessageEl) modalMessageEl.innerHTML = `<strong>Risiko Asma: <span class="${cls}">${msg.split(': ')[1].toUpperCase()}</span></strong>`;
        if (modalRecoEl) modalRecoEl.textContent = reco;
        if (modalAnswersEl) {
          modalAnswersEl.innerHTML = '';
          const getLabelText = (id) => document.querySelector(`label[for="${id}"]`)?.textContent || '';
          const getSelectedText = (sel) => sel && sel.options[sel.selectedIndex] ? sel.options[sel.selectedIndex].text : '';
          const answerPairs = [
            ['gender', genderEl],
            ['age_group', ageGroupEl],
            ['smoke_chest_tightness', smokeChestEl],
            ['cold_dust_trigger', coldDustEl],
            ['family_asthma', familyAsthmaEl],
            ['exercise_trigger', exerciseTriggerEl],
            ['night_shortness', nightShortEl],
            ['laugh_trigger', laughTriggerEl]
          ];
          const answersHtml = '<ul class="answer-list">' + answerPairs.map(([id, sel]) => {
            const q = getLabelText(id);
            const a = getSelectedText(sel);
            return `<li>${q} (${a})`;
          }).join('') + '</ul>';
          modalAnswersEl.innerHTML = answersHtml;
        }
        if (modalOverlay) {
          modalOverlay.classList.add('show');
          modalOverlay.setAttribute('aria-hidden', 'false');
        } else {
          alert(`${msg}\n\n${reco}`);
        }
        if (navigator.vibrate) navigator.vibrate(20);
      } catch (err) {
        const emsg = (err && err.message) || 'Tidak diketahui';
        if (modalMessageEl) modalMessageEl.innerHTML = `<strong>Terjadi kesalahan: <span class="risk-high">${emsg}</span></strong>`;
        if (modalRecoEl) modalRecoEl.textContent = 'Silakan coba lagi, pastikan koneksi stabil atau isi data dengan benar.';
        if (modalOverlay) {
          modalOverlay.classList.add('show');
          modalOverlay.setAttribute('aria-hidden', 'false');
        } else {
          alert(`Terjadi kesalahan: ${emsg}`);
        }
        if (navigator.vibrate) navigator.vibrate([40, 20, 40]);
      }
      submitBtn.textContent = prevText;
      submitBtn.classList.remove('loading');
      updateButtonState();
    });
    if (modalCloseBtn && modalOverlay) {
      modalCloseBtn.addEventListener('click', () => {
        modalOverlay.classList.remove('show');
        modalOverlay.setAttribute('aria-hidden', 'true');
      });
    }
  }

  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const bgCanvas = document.getElementById('bg-canvas');
  if (bgCanvas && !prefersReduced) {
    const ctx = bgCanvas.getContext('2d');
    let dpr = Math.max(1, window.devicePixelRatio || 1);
    let W = 0, H = 0;
    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      bgCanvas.width = Math.floor(W * dpr);
      bgCanvas.height = Math.floor(H * dpr);
      bgCanvas.style.width = W + 'px';
      bgCanvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const rand = (min, max) => min + Math.random() * (max - min);
    const particles = Array.from({ length: 60 }, () => ({
      x: rand(0, W), y: rand(0, H), r: rand(1.2, 2.6), a: rand(0, Math.PI * 2), s: rand(0.3, 1.2)
    }));

    const worms = Array.from({ length: 10 }, () => ({
      x: rand(0, W), y: rand(0, H), ang: rand(0, Math.PI * 2), sp: rand(0.6, 1.4), len: 40, trail: [] , seed: rand(0, 1000)
    }));

    let t0 = performance.now();
    const step = (now) => {
      const dt = (now - t0) / 1000; t0 = now;
      ctx.clearRect(0, 0, W, H);

      ctx.globalCompositeOperation = 'lighter';
      particles.forEach(p => {
        p.a += 0.6 * dt;
        p.x += Math.cos(p.a) * p.s;
        p.y += Math.sin(p.a * 1.2) * p.s;
        if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10;
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.lineWidth = 1.8;
      worms.forEach(w => {
        const n = Math.sin((now * 0.0006) + w.seed) * 0.9;
        w.ang += n * dt;
        w.x += Math.cos(w.ang) * (60 * w.sp * dt);
        w.y += Math.sin(w.ang) * (60 * w.sp * dt);
        if (w.x < 0) w.x = W; if (w.x > W) w.x = 0;
        if (w.y < 0) w.y = H; if (w.y > H) w.y = 0;
        w.trail.push({ x: w.x, y: w.y });
        if (w.trail.length > w.len) w.trail.shift();
        const g = ctx.createLinearGradient(w.trail[0]?.x || w.x, w.trail[0]?.y || w.y, w.x, w.y);
        g.addColorStop(0, 'rgba(255,255,255,0.18)');
        g.addColorStop(1, 'rgba(105,209,255,0.32)');
        ctx.strokeStyle = g;
        ctx.beginPath();
        w.trail.forEach((pt, i) => {
          if (i === 0) ctx.moveTo(pt.x, pt.y); else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
      });

      ctx.globalCompositeOperation = 'source-over';
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const buildCustomSelect = (select) => {
    if (!select) return;
    const placeholder = Array.from(select.options).find(o => o.disabled) || null;
    const currentLabel = select.value ? select.options[select.selectedIndex].text : (placeholder ? placeholder.text : 'Pilih');
    const wrap = document.createElement('div');
    wrap.className = 'cselect';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cselect-toggle';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.textContent = currentLabel;
    const menu = document.createElement('div');
    menu.className = 'cselect-menu';
    const opts = Array.from(select.options).filter(o => !o.disabled);
    opts.forEach(o => {
      const item = document.createElement('div');
      item.className = 'cselect-option' + (o.value === select.value ? ' active' : '');
      item.setAttribute('role', 'option');
      item.dataset.value = o.value;
      item.textContent = o.text;
      item.addEventListener('click', () => {
        select.value = o.value;
        btn.textContent = o.text;
        Array.from(menu.children).forEach(c => c.classList.remove('active'));
        item.classList.add('active');
        select.dispatchEvent(new Event('change', { bubbles: true }));
        wrap.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
      menu.appendChild(item);
    });
    btn.addEventListener('click', () => {
      const isOpen = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', String(isOpen));
    });
    document.addEventListener('click', (e) => {
      if (!wrap.contains(e.target)) {
        wrap.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    select.parentNode.insertBefore(wrap, select.nextSibling);
    wrap.appendChild(btn);
    wrap.appendChild(menu);
    select.style.display = 'none';
  };

  selectEls.forEach(el => buildCustomSelect(el));
});
