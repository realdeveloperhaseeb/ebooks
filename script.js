(() => {
  'use strict';

  /* ----------------------------------------------------------
     Settings: fill these in before going live
     ---------------------------------------------------------- */
  const CONFIG = {
    // WhatsApp number that receives orders and messages (international format, digits only)
    whatsappNumber: '447988563005',

    brand: 'SkillX eBooks',
    ebookTitle: 'Python Zero to Pro',
    price: 'Rs. 29,000',

    // Pre-filled message for the floating button and contact links
    chatMessage: 'Assalam o Alaikum, mujhe Python ebook ke baare mein poochna hai.',

    // Pre-filled message when someone asks for the free sample (used when leadEndpoint is empty)
    sampleMessage: contact => `Assalam o Alaikum, mujhe free sample chapter chahiye. Mera email/WhatsApp: ${contact}`,

    // Optional: a form endpoint that accepts a JSON POST (Formspree, Google Apps Script, etc.).
    // Leave empty to send sample requests through WhatsApp instead.
    leadEndpoint: ''
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const waLink = text => `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(text)}`;
  const escapeHtml = str => str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

  /* ---------- WhatsApp links ---------- */
  document.querySelectorAll('[data-wa="chat"]').forEach(a => { a.href = waLink(CONFIG.chatMessage); });

  /* ---------- Header: scrolled state + mobile menu ---------- */
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.getElementById('nav-links');

  const progress = document.querySelector('.progress span');
  const onScroll = () => {
    header.classList.toggle('scrolled', window.scrollY > 24);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--p', max > 0 ? (window.scrollY / max).toFixed(4) : 0);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  const setMenu = open => {
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  };
  toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  navLinks.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  document.addEventListener('click', e => { if (!header.contains(e.target)) setMenu(false); });

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => {
      const siblings = [...el.parentElement.children].filter(c => c.hasAttribute('data-reveal'));
      el.style.setProperty('--d', `${Math.min(siblings.indexOf(el), 5) * 80}ms`);
      io.observe(el);
    });
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const open = !item.classList.contains('open');
      item.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ---------- Hero terminal typing ---------- */
  const typer = document.getElementById('typer');
  const snippets = [
    { code: 'print("Hello, Pakistan!")', out: 'Hello, Pakistan!' },
    { code: 'sum([1200, 800, 500])', out: '2500' },
    { code: '"python".upper()', out: "'PYTHON'" }
  ];
  const prompt = '<span class="tok-p">&gt;&gt;&gt;</span> ';
  const caret = '<span class="caret"></span>';

  const runTyper = async () => {
    for (let n = 0; ; n = (n + 1) % snippets.length) {
      const { code, out } = snippets[n];
      for (let i = 0; i <= code.length; i++) {
        typer.innerHTML = prompt + escapeHtml(code.slice(0, i)) + caret;
        await sleep(45 + Math.random() * 55);
      }
      await sleep(350);
      typer.innerHTML = `${prompt}${escapeHtml(code)}\n<span class="tok-out">${escapeHtml(out)}</span>\n${prompt}${caret}`;
      await sleep(2600);
    }
  };
  if (typer && !reduceMotion) runTyper();

  /* ---------- Free sample lead form ---------- */
  const form = document.getElementById('lead-form');
  if (form) {
    const input = form.querySelector('input');
    const button = form.querySelector('button');
    const msg = form.querySelector('.form-msg');

    const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    const isPkMobile = v => /^(\+?92|0)?3\d{9}$/.test(v.replace(/[\s-]/g, ''));
    const setMsg = (text, type) => {
      msg.textContent = text;
      msg.className = `form-msg ${type ? `is-${type}` : ''}`;
    };

    input.addEventListener('input', () => {
      input.removeAttribute('aria-invalid');
      setMsg('');
    });

    form.addEventListener('submit', async e => {
      e.preventDefault();
      const value = input.value.trim();

      if (!isEmail(value) && !isPkMobile(value)) {
        input.setAttribute('aria-invalid', 'true');
        setMsg('Sahi email ya WhatsApp number likhein (jaise 03001234567).', 'error');
        input.focus();
        return;
      }

      if (!CONFIG.leadEndpoint) {
        window.open(waLink(CONFIG.sampleMessage(value)), '_blank', 'noopener');
        setMsg('WhatsApp khul gaya hai. Message send karein, sample chapter aap ko bhej diya jayega.', 'ok');
        form.reset();
        return;
      }

      button.disabled = true;
      try {
        const res = await fetch(CONFIG.leadEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ contact: value, source: 'free-sample-chapter' })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setMsg('Shukriya! Sample chapter jald aap tak pohanch jayega.', 'ok');
        form.reset();
      } catch {
        setMsg('Kuch masla hua. Dobara koshish karein ya WhatsApp par message karein.', 'error');
      } finally {
        button.disabled = false;
      }
    });
  }

  /* ---------- Order form -> WhatsApp ---------- */
  const orderForm = document.getElementById('order-form');
  if (orderForm) {
    const msg = orderForm.querySelector('.form-msg');
    const payGroup = orderForm.querySelector('.pay-choice');
    const field = name => orderForm.elements[name];
    const setMsg = (text, type) => {
      msg.textContent = text;
      msg.className = `form-msg field-full ${type ? `is-${type}` : ''}`;
    };

    const rules = {
      name: v => v.length >= 2,
      phone: v => /^\+?\d{10,15}$/.test(v.replace(/[\s()-]/g, '')),
      email: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v),
      city: v => v.length >= 2
    };

    orderForm.addEventListener('input', e => {
      if (e.target.name === 'payment') payGroup.removeAttribute('aria-invalid');
      else e.target.removeAttribute('aria-invalid');
      setMsg('');
    });

    orderForm.addEventListener('submit', e => {
      e.preventDefault();
      const data = Object.fromEntries(['name', 'phone', 'email', 'city', 'note'].map(k => [k, field(k).value.trim()]));
      data.payment = orderForm.querySelector('input[name="payment"]:checked')?.value || '';

      const invalid = Object.keys(rules).filter(k => !rules[k](data[k]));
      invalid.forEach(k => field(k).setAttribute('aria-invalid', 'true'));
      if (!data.payment) payGroup.setAttribute('aria-invalid', 'true');

      if (invalid.length || !data.payment) {
        const bad = invalid.map(k => field(k));
        if (!data.payment) bad.push(payGroup);
        document.dispatchEvent(new CustomEvent('invalid-shake', { detail: bad }));
        setMsg('Barah-e-karam tamam zaroori fields sahi se bharein aur payment method chunein.', 'error');
        if (invalid.length) field(invalid[0]).focus();
        else orderForm.querySelector('input[name="payment"]').focus();
        return;
      }

      const lines = [
        `*New Ebook Order - ${CONFIG.brand}*`,
        `Ebook: ${CONFIG.ebookTitle} (PDF)`,
        `Price: ${CONFIG.price}`,
        '',
        `Name: ${data.name}`,
        `WhatsApp: ${data.phone}`,
        data.email ? `Email: ${data.email}` : null,
        `City: ${data.city}`,
        `Payment method: ${data.payment}`,
        data.note ? `Message: ${data.note}` : null
      ].filter(line => line !== null);

      window.open(waLink(lines.join('\n')), '_blank', 'noopener');
      setMsg('Shukriya! WhatsApp khul gaya hai, bas "Send" dabayein aur order confirm ho jayega.', 'ok');
      orderForm.reset();
    });
  }
  /* ---------- Hero headline: word-by-word entrance ---------- */
  const h1 = document.querySelector('.hero h1');
  if (h1 && !reduceMotion) {
    let i = 0;
    const split = node => {
      [...node.childNodes].forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const span = document.createElement('span');
            span.className = 'word';
            span.style.setProperty('--i', i++);
            span.textContent = part;
            frag.append(span);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          split(child);
        }
      });
    };
    split(h1);
  }

  /* ---------- Pointer effects (mouse / trackpad only) ---------- */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reduceMotion) {
    // Cursor spotlight on cards
    document.querySelectorAll('.card, .capture, .faq-item, .final-cta').forEach(el => el.classList.add('spot'));
    document.addEventListener('pointermove', e => {
      const el = e.target.closest('.spot');
      if (!el) return;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    }, { passive: true });

    // Hero glow + 3D book tilt
    const hero = document.querySelector('.hero');
    const book = document.querySelector('.book');
    hero.addEventListener('pointermove', e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      hero.style.setProperty('--hx', `${x * 100}%`);
      hero.style.setProperty('--hy', `${y * 100}%`);
      book.style.setProperty('--ry', `${(x - .5) * 22}deg`);
      book.style.setProperty('--rx', `${(.5 - y) * 14}deg`);
    });
    hero.addEventListener('pointerleave', () => {
      book.style.setProperty('--ry', '0deg');
      book.style.setProperty('--rx', '0deg');
    });

    // Tilt on sample pages
    document.querySelectorAll('.page').forEach(page => {
      page.addEventListener('pointermove', e => {
        const r = page.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5;
        const y = (e.clientY - r.top) / r.height - .5;
        page.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateY(-6px)`;
      });
      page.addEventListener('pointerleave', () => { page.style.transform = ''; });
    });

    // Magnetic large buttons
    document.querySelectorAll('.btn-lg').forEach(btn => {
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        btn.style.translate = `${dx * .12}px ${dy * .25}px`;
      });
      btn.addEventListener('pointerleave', () => { btn.style.translate = ''; });
    });
  }

  /* ---------- Active nav link (scroll spy) ---------- */
  const spyLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  if ('IntersectionObserver' in window) {
    const spy = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        spyLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`));
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(sec => spy.observe(sec));
  }

  /* ---------- Price drop counter ---------- */
  const formatRs = n => `Rs. ${Math.round(n).toLocaleString('en-US')}`;
  document.querySelectorAll('[data-count-from]').forEach(el => {
    const from = Number(el.dataset.countFrom);
    const to = Number(el.dataset.countTo);
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    el.textContent = formatRs(from);
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const duration = 1400;
      const tick = now => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = formatRs(from + (to - from) * eased);
        if (t < 1) requestAnimationFrame(tick);
      };
      setTimeout(() => requestAnimationFrame(tick), 400);
    }, { threshold: .6 });
    io.observe(el);
  });

  /* ---------- Mobile buy bar ---------- */
  const buyBar = document.getElementById('buy-bar');
  if (buyBar && 'IntersectionObserver' in window) {
    const hidden = new Set();
    const watch = ['.hero', '#pricing', '.site-footer'].map(sel => document.querySelector(sel));
    const update = () => {
      const show = hidden.size === 0;
      buyBar.classList.toggle('show', show);
      document.body.classList.toggle('bar-on', show);
    };
    const barIo = new IntersectionObserver(entries => {
      entries.forEach(entry => (entry.isIntersecting ? hidden.add(entry.target) : hidden.delete(entry.target)));
      update();
    });
    watch.forEach(el => el && barIo.observe(el));
  }

  /* ---------- Shake invalid fields ---------- */
  document.addEventListener('invalid-shake', e => {
    e.detail.forEach(el => {
      el.classList.remove('shake');
      void el.offsetWidth;
      el.classList.add('shake');
      el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
    });
  });
})();
