document.addEventListener('DOMContentLoaded', () => {
    const nav = document.getElementById('navbar');
    if (nav) {
        window.addEventListener('scroll', () => {
            nav.classList.toggle('scrolled', window.scrollY > 10);
        }, { passive: true });
    }

    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.getElementById('navLinks');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            const oppen = navLinks.classList.toggle('open');
            hamburger.setAttribute('aria-expanded', String(oppen));
        });
        navLinks.querySelectorAll('a').forEach((a) =>
            a.addEventListener('click', () => {
                navLinks.classList.remove('open');
                hamburger.setAttribute('aria-expanded', 'false');
            })
        );
    }

    // Svepande fördröjning per kort i rutnäten – ger en "våg" när de tonas in
    document.querySelectorAll('.video-list, .shorts-list, .kat-grid, .sponsor-grid, .tack-grid').forEach((grid) =>
        [...grid.children].forEach((el, i) => {
            if (el.classList.contains('fade-in')) el.style.setProperty('--fade-delay', ((i % 6) * 80) + 'ms');
        })
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Klicka-för-att-spela (händelsedelegering så att även JS-byggda kort funkar):
    // miniatyren byts mot YouTube-spelaren först vid klick
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.video-facade');
        if (!btn) return;
        const iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + btn.getAttribute('data-yt') + '?autoplay=1';
        iframe.title = btn.getAttribute('aria-label') || '';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        btn.replaceWith(iframe);
    });

    // === Kategorisidornas rutnät ===
    // HTML:en innehåller bara första batchen kort; resten ligger som JSON i
    // #merData och byggs först när besökaren klickar "Visa fler" eller söker.
    // Byggda kort får .dold (batch-dolda) så att befintlig logik tar vid.
    const grid = document.querySelector('[data-batch]');
    const merData = document.getElementById('merData');
    let resterande = [];
    if (merData) {
        try { resterande = JSON.parse(merData.textContent); } catch (e) { /* trasig JSON – visa bara batchen */ }
    }

    const byggKort = (it, staende, spela) => {
        const kort = document.createElement('div');
        kort.className = 'video-block fade-in dold';

        const embed = document.createElement('div');
        embed.className = 'video-embed' + (staende ? ' video-embed--staende' : '');
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'video-facade';
        btn.setAttribute('data-yt', it.y);
        btn.setAttribute('aria-label', spela + ': ' + it.t);
        const img = document.createElement('img');
        img.setAttribute('data-src', 'https://i.ytimg.com/vi/' + it.y + '/hqdefault.jpg');
        img.alt = '';
        img.loading = 'lazy';
        const play = document.createElement('span');
        play.className = 'video-play';
        play.setAttribute('aria-hidden', 'true');
        play.textContent = '▶';
        btn.append(img, play);
        embed.appendChild(btn);
        kort.appendChild(embed);

        const rubrik = document.createElement('h2');
        rubrik.textContent = it.t;
        kort.appendChild(rubrik);
        if (it.d) {
            const datum = document.createElement('p');
            datum.className = 'video-date';
            datum.textContent = it.d;
            kort.appendChild(datum);
        }
        if (it.b) {
            const besk = document.createElement('p');
            besk.className = 'video-description';
            besk.textContent = it.b;
            kort.appendChild(besk);
        }
        return kort;
    };

    const byggAlla = () => {
        if (!grid || !resterande.length) return;
        const staende = grid.hasAttribute('data-staende');
        const spela = grid.getAttribute('data-spela') || 'Spela';
        const frag = document.createDocumentFragment();
        resterande.forEach((it) => {
            const kort = byggKort(it, staende, spela);
            frag.appendChild(kort);
            observer.observe(kort);
        });
        grid.appendChild(frag);
        resterande = [];
    };

    const laddaBild = (el) => {
        const img = el.querySelector('img[data-src]');
        if (img) {
            img.src = img.getAttribute('data-src');
            img.removeAttribute('data-src');
        }
    };

    // "Visa fler": avtäcker nästa omgång och räknar ner hur många som är kvar
    document.querySelectorAll('.visa-fler').forEach((btn) => {
        if (!grid) return;
        btn.addEventListener('click', () => {
            byggAlla();
            const batch = parseInt(grid.getAttribute('data-batch'), 10) || 12;
            const dolda = grid.querySelectorAll('.video-block.dold');
            for (let i = 0; i < batch && i < dolda.length; i++) {
                laddaBild(dolda[i]);
                dolda[i].classList.remove('dold');
            }
            const kvar = grid.querySelectorAll('.video-block.dold').length;
            if (kvar > 0) {
                btn.textContent = btn.getAttribute('data-text') + ' (' + kvar + ')';
            } else {
                btn.parentElement.remove();
            }
        });
    });

    // Sökfältet filtrerar korten på titel. Träffar bortom första batchen
    // avtäcks; när sökningen rensas återgår sidan till batch-läget.
    const sokFalt = document.getElementById('mediaSok');
    if (sokFalt && grid) {
        const tomt = document.getElementById('sokTomt');
        sokFalt.addEventListener('input', () => {
            const q = sokFalt.value.trim().toLowerCase();
            if (q) byggAlla();
            let traffar = 0;
            grid.querySelectorAll('.video-block').forEach((el) => {
                if (!q) {
                    el.classList.remove('dold-sok');
                    return;
                }
                const titel = (el.querySelector('h2, h3')?.textContent || '').toLowerCase();
                const traff = titel.includes(q);
                el.classList.toggle('dold-sok', !traff);
                if (traff) {
                    traffar++;
                    laddaBild(el);
                    el.classList.remove('dold');
                    el.classList.add('visible');
                }
            });
            if (tomt) tomt.hidden = !q || traffar > 0;
            const visaFlerRad = document.querySelector('.visa-fler')?.parentElement;
            if (visaFlerRad) visaFlerRad.style.display = q ? 'none' : '';
        });
    }

    // Räknare som tickar upp från noll när de blir synliga: kategorikortens
    // antal och hero-sektionens följarsiffror. HTML:en innehåller slutvärdet
    // (så att siffran stämmer även utan JS/med reducerad rörelse) och
    // animationen skriver bara om texten på vägen dit.
    const lugntLage = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!lugntLage) {
        const sprak = document.documentElement.lang || 'sv';
        const raknare = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                raknare.unobserve(entry.target);
                const el = entry.target;
                let mal, format;
                if (el.dataset.mal) {
                    // Följarsiffra: råvärdet ligger i data-mal, visas lokaliserat
                    mal = parseInt(el.dataset.mal, 10);
                    format = (v) => v.toLocaleString(sprak);
                } else {
                    // Kategorikort: "457 inslag" – behåll suffixet
                    const m = el.textContent.match(/\d+/);
                    if (!m) return;
                    mal = parseInt(m[0], 10);
                    const suffix = el.textContent.slice(m.index + m[0].length);
                    format = (v) => v + suffix;
                }
                const start = performance.now();
                const tid = 1100;
                const tick = (nu) => {
                    const t = Math.min((nu - start) / tid, 1);
                    el.textContent = format(Math.round(mal * (1 - Math.pow(1 - t, 3))));
                    if (t < 1) requestAnimationFrame(tick);
                };
                requestAnimationFrame(tick);
            });
        }, { threshold: 0.4 });
        document.querySelectorAll('.kat-antal, .stat-antal').forEach((el) => raknare.observe(el));
    }

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        const updateIcon = () => {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            themeToggle.textContent = isDark ? '☀️' : '🌙';
        };
        updateIcon();
        themeToggle.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'light';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            try { localStorage.setItem('theme', next); } catch (e) { /* ignore */ }
            updateIcon();
        });
    }

    // Swish-rutor på sponsorsidan: knappen öppnar sin <dialog>; krysset, Esc
    // eller ett klick utanför rutan stänger den.
    document.addEventListener('click', (e) => {
        const oppna = e.target.closest('[data-dialog]');
        if (oppna) {
            const ruta = document.getElementById(oppna.getAttribute('data-dialog'));
            if (ruta && typeof ruta.showModal === 'function' && !ruta.open) ruta.showModal();
            return;
        }
        const stang = e.target.closest('[data-stang]');
        if (stang) {
            const ruta = stang.closest('dialog');
            if (ruta) ruta.close();
            return;
        }
        if (e.target instanceof HTMLDialogElement && e.target.open) e.target.close();
    });

});
