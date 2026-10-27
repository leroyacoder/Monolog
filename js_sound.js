(function zvuk() {
    const GROMKOST_PO_UMOLCHANIYU = 0.55;
    const ZVUKI = {
        klik: 'mp3/klik.mp3',
        navedenie: 'mp3/navedenie.mp3',
        okno: 'mp3/okno.mp3',
        uvedomlenie: 'mp3/uvedomlenie.mp3',
        shagZagruzki: 'mp3/shag_zagruzki.mp3',
        uspekh: 'mp3/uspekh.mp3'
    };
    const GROMKOST_ZVUKOV = {
        klik: 0.8,
        navedenie: 0.35,
        okno: 0.7,
        uvedomlenie: 1,
        shagZagruzki: 0.6,
        uspekh: 0.9
    };

    const sndZvuki = {};
    let gromkost = GROMKOST_PO_UMOLCHANIYU;

    Object.entries(ZVUKI).forEach(([imya, put]) => {
        const sndZvuk = new Audio(put);
        sndZvuk.preload = 'auto';
        sndZvuki[imya] = sndZvuk;
    });

    window.playSound = function (imya) {
        const sndZvuk = sndZvuki[imya];
        if (!sndZvuk || gromkost <= 0) return;
        const kopiya = sndZvuk.cloneNode();
        kopiya.volume = Math.min(1, gromkost * (GROMKOST_ZVUKOV[imya] || 1));
        const obeshchanie = kopiya.play();
        if (obeshchanie && typeof obeshchanie.catch === 'function') obeshchanie.catch(() => {});
    };

    window.setGromkost = function (znachenie) {
        gromkost = Math.max(0, Math.min(1, znachenie));
    };

    window.getGromkost = function () {
        return gromkost;
    };
})();

(function muzyka() {
    const ekran = document.getElementById('ekran');
    if (!ekran) return;

    const MELODII = {
        2020: ['mp3/muzyka_2020_1.mp3', 'mp3/muzyka_2020_2.mp3'],
        2022: ['mp3/muzyka_2022_1.mp3', 'mp3/muzyka_2022_2.mp3'],
        2024: ['mp3/muzyka_2024_1.mp3', 'mp3/muzyka_2024_2.mp3'],
        2026: ['mp3/muzyka_2026_1.mp3', 'mp3/muzyka_2026_2.mp3'],
        2028: ['mp3/muzyka_2028_1.mp3', 'mp3/muzyka_2028_2.mp3']
    };
    const GROMKOST_MELODIY = 0.15;
    const GROMKOST_SHUMA = 0.12;
    const GROMKOST_SHUMA_ZAPAS = 0.025;
    const NARASTANIE = 12;
    const PERETEKANIE = 10;
    const ZATUHANIE = 25;
    const UHOD = 3;
    const SHAG = 100;
    const PAUZA_OBNOVLENIYA = 1;

    let zapushcheno = false;
    let god = null;
    let para = null;
    let uhodyashchie = [];
    let shum = null;
    const adres = new URLSearchParams(window.location.search);
    let zhdemZapusk = Boolean(document.getElementById('zapusk')) && adres.get('fx') !== '0' && adres.get('zapusk') !== '0';
    let tishina = zhdemZapusk;
    let dolyaFona = zhdemZapusk ? 0 : 1;

    const obshchaya = () => (typeof window.getGromkost === 'function' ? window.getGromkost() : 0.55);
    const zazhat = (v) => Math.max(0, Math.min(1, v));

    function sozdat(adres) {
        const zvuk = new Audio(adres);
        zvuk.preload = 'auto';
        zvuk.volume = 0;
        return zvuk;
    }

    const faylShuma = new Audio('mp3/shum.mp3');
    faylShuma.preload = 'auto';
    faylShuma.loop = true;
    faylShuma.volume = 0;

    function zapustitShum() {
        const fayl = faylShuma;
        fayl.addEventListener('error', () => {
            shum = sobratShum();
        }, { once: true });
        const zanovo = () => {
            fayl.currentTime = 0;
            fayl.play().catch(() => {});
        };
        fayl.addEventListener('ended', zanovo);
        fayl.addEventListener('stalled', () => { if (fayl.paused) zanovo(); });
        shum = {
            gromkost: (g) => { fayl.volume = zazhat(g * GROMKOST_SHUMA); },
            storozh: () => { if (fayl.paused || fayl.ended) fayl.play().catch(() => {}); }
        };
        fayl.play().catch(() => {});
    }

    function sobratShum() {
        const Kontekst = window.AudioContext || window.webkitAudioContext;
        if (!Kontekst) return null;
        const ak = new Kontekst();
        const dlina = ak.sampleRate * 4;
        const bufer = ak.createBuffer(2, dlina, ak.sampleRate);
        for (let k = 0; k < 2; k += 1) {
            const kanal = bufer.getChannelData(k);
            let proshloe = 0;
            for (let i = 0; i < dlina; i += 1) {
                proshloe = (proshloe + 0.02 * (Math.random() * 2 - 1)) / 1.02;
                kanal[i] = proshloe * 3.5;
            }
        }
        const istochnik = ak.createBufferSource();
        istochnik.buffer = bufer;
        istochnik.loop = true;
        const filtr = ak.createBiquadFilter();
        filtr.type = 'lowpass';
        filtr.frequency.value = 1800;
        const usilenie = ak.createGain();
        usilenie.gain.value = 0;
        istochnik.connect(filtr).connect(usilenie).connect(ak.destination);
        istochnik.start();
        if (ak.state === 'suspended') ak.resume();
        return {
            gromkost: (g) => { usilenie.gain.setTargetAtTime(g * GROMKOST_SHUMA_ZAPAS, ak.currentTime, 0.1); },
            storozh: () => { if (ak.state === 'suspended') ak.resume(); }
        };
    }

    function nachatGod(novyy) {
        if (para) {
            const vremya = performance.now();
            para.forEach((zvuk) => {
                if (!zvuk.paused) uhodyashchie.push({ zvuk, s: zvuk.volume, t0: vremya });
            });
        }
        god = novyy;
        para = null;
        if (!MELODII[god]) return;
        para = MELODII[god].map(sozdat);
        const [pervaya, vtoraya] = para;
        pervaya.addEventListener('ended', () => {
            if (para && para[1] === vtoraya && vtoraya.paused && !vtoraya.ended) vtoraya.play().catch(() => {});
        });
        if (zapushcheno) pervaya.play().catch(() => {});
    }

    function pereschitat() {
        if (!zapushcheno) return;
        const shag = SHAG / 1000 / PAUZA_OBNOVLENIYA;
        dolyaFona = zazhat(dolyaFona + (tishina ? -shag : shag));
        const g = obshchaya() * dolyaFona;
        if (shum) shum.gromkost(g);

        const vremya = performance.now();
        uhodyashchie = uhodyashchie.filter((u) => {
            const dolya = zazhat(1 - (vremya - u.t0) / (UHOD * 1000));
            u.zvuk.volume = u.s * dolya;
            if (dolya > 0) return true;
            u.zvuk.pause();
            return false;
        });

        if (!para) return;
        const [pervaya, vtoraya] = para;
        const d1 = pervaya.duration;
        const d2 = vtoraya.duration;
        const t1 = pervaya.currentTime;
        const t2 = vtoraya.currentTime;
        const urovn = g * GROMKOST_MELODIY;

        const izvestna = (d) => Number.isFinite(d) && d > 0;
        if (!pervaya.paused) {
            const vhod = zazhat(t1 / NARASTANIE);
            const vyhod = izvestna(d1) ? zazhat((d1 - t1) / PERETEKANIE) : 1;
            pervaya.volume = zazhat(urovn * Math.min(vhod, vyhod));
            if (izvestna(d1) && d1 - t1 <= PERETEKANIE && vtoraya.paused && !vtoraya.ended) vtoraya.play().catch(() => {});
        }
        if (!vtoraya.paused) {
            const vhod = zazhat(t2 / PERETEKANIE);
            const vyhod = izvestna(d2) ? zazhat((d2 - t2) / ZATUHANIE) : 1;
            vtoraya.volume = zazhat(urovn * Math.min(vhod, vyhod));
        }
    }

    function razreshit() {
        if (zapushcheno) return;
        zapushcheno = true;
        zapustitShum();
        if (zhdemZapusk) return;
        if (para) para[0].play().catch(() => {});
        else nachatGod(god);
    }

    ekran.addEventListener('zapusk:konets', () => {
        if (!zhdemZapusk) return;
        zhdemZapusk = false;
        tishina = false;
        if (!zapushcheno) return;
        if (para) {
            para[0].currentTime = 0;
            para[0].play().catch(() => {});
        } else nachatGod(god);
    });
    window.addEventListener('pointerdown', razreshit, { once: true });
    window.addEventListener('keydown', razreshit, { once: true });

    ekran.addEventListener('obnovlenie:nachalo', () => {
        tishina = true;
        nachatGod(null);
    });
    ekran.addEventListener('obnovlenie:konets', () => {
        tishina = false;
    });

    ekran.addEventListener('god:izmenen', (e) => {
        if (e.detail.god === god && para) return;
        nachatGod(e.detail.god);
    });

    window.setInterval(pereschitat, SHAG);
    window.setInterval(() => {
        if (zapushcheno && shum && shum.storozh) shum.storozh();
    }, 3000);
})();

(function zvukiSistemy() {
    const Kontekst = window.AudioContext || window.webkitAudioContext;
    const GROMKOST = 0.5;
    let ak = null;
    let shumBufer = null;
    let gul = null;

    const obshchaya = () => (typeof window.getGromkost === 'function' ? window.getGromkost() : 0.55);

    function kontekst() {
        if (!Kontekst) return null;
        if (!ak) {
            ak = new Kontekst();
            const dlina = ak.sampleRate;
            shumBufer = ak.createBuffer(1, dlina, ak.sampleRate);
            const kanal = shumBufer.getChannelData(0);
            for (let i = 0; i < dlina; i += 1) kanal[i] = Math.random() * 2 - 1;
        }
        if (ak.state === 'suspended') ak.resume();
        return ak;
    }

    function vyhod(k, sila) {
        const g = k.createGain();
        g.gain.value = obshchaya() * GROMKOST * sila;
        g.connect(k.destination);
        return g;
    }

    function vsplesk(k, kuda, t, dlit, chastota, sila, tip = 'bandpass') {
        const ist = k.createBufferSource();
        ist.buffer = shumBufer;
        const filtr = k.createBiquadFilter();
        filtr.type = tip;
        filtr.frequency.value = chastota;
        filtr.Q.value = 0.9;
        const g = k.createGain();
        g.gain.setValueAtTime(sila, t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + dlit);
        ist.connect(filtr).connect(g).connect(kuda);
        ist.start(t, Math.random() * 0.5);
        ist.stop(t + dlit + 0.02);
    }

    function ton(k, kuda, t, dlit, ot, do_, sila, forma = 'sine') {
        const osc = k.createOscillator();
        osc.type = forma;
        osc.frequency.setValueAtTime(ot, t);
        if (do_ !== ot) osc.frequency.exponentialRampToValueAtTime(do_, t + dlit);
        const g = k.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(sila, t + Math.min(0.01, dlit / 4));
        g.gain.exponentialRampToValueAtTime(0.0001, t + dlit);
        osc.connect(g).connect(kuda);
        osc.start(t);
        osc.stop(t + dlit + 0.02);
    }

    const ZVUKI = {
        knopka(k, v, t) {
            vsplesk(k, v, t, 0.025, 2600, 1);
            ton(k, v, t, 0.07, 140, 60, 0.8);
            vsplesk(k, v, t + 0.13, 0.02, 3400, 0.5);
        },
        tresk(k, v, t) {
            const dlit = 0.7;
            for (let n = 0; n < 9; n += 1) {
                const m = t + Math.random() * dlit;
                vsplesk(k, v, m, 0.006 + Math.random() * 0.008, 900 + Math.random() * 900, 0.15 + Math.random() * 0.25, 'lowpass');
            }
        },
        kineskop(k, v, t) {
            ton(k, v, t, 1.4, 50, 46, 0.9);
            ton(k, v, t, 1.1, 100, 92, 0.35, 'sawtooth');
            for (let n = 0; n < 6; n += 1) vsplesk(k, v, t + n * 0.06, 0.02, 250, 0.3, 'lowpass');
        },
        pisk(k, v, t) {
            const filtr = k.createBiquadFilter();
            filtr.type = 'lowpass';
            filtr.frequency.value = 2600;
            filtr.connect(v);
            ton(k, filtr, t, 0.22, 1000, 1000, 0.25, 'square');
        },
        disk(k, v, t) {
            const raz = 1 + Math.floor(Math.random() * 2);
            let m = t;
            for (let n = 0; n < raz; n += 1) {
                vsplesk(k, v, m, 0.008, 700 + Math.random() * 300, 0.35, 'lowpass');
                m += 0.05 + Math.random() * 0.04;
            }
        },
        tik(k, v, t) {
            vsplesk(k, v, t, 0.006, 1600 + Math.random() * 600, 0.5, 'lowpass');
        },
        privet(k, v, t) {
            [523, 659, 784, 1047].forEach((f, n) => ton(k, v, t + n * 0.12, 0.22, f, f, 0.18, 'square'));
        },
        vyklyuchenie(k, v, t) {
            ton(k, v, t, 0.5, 1400, 70, 0.3, 'triangle');
            for (let n = 0; n < 4; n += 1) vsplesk(k, v, t + Math.random() * 0.5, 0.006, 1200, 0.2, 'lowpass');
        }
    };
    const SILA = { knopka: 0.55, tresk: 0.25, kineskop: 0.32, pisk: 0.3, disk: 0.2, tik: 0.45, privet: 0.35, vyklyuchenie: 0.45 };

    window.zvukSistemy = function (imya) {
        const k = kontekst();
        const zvuk = ZVUKI[imya];
        if (!k || !zvuk || obshchaya() <= 0) return;
        zvuk(k, vyhod(k, SILA[imya] || 1), k.currentTime + 0.01);
    };

    window.gulSistemy = function (vklyuchen) {
        const k = kontekst();
        if (!k) return;
        if (vklyuchen && !gul) {
            const g = k.createGain();
            g.gain.setValueAtTime(0.0001, k.currentTime);
            g.gain.exponentialRampToValueAtTime(Math.max(0.0001, obshchaya() * GROMKOST * 0.07), k.currentTime + 1.2);
            g.connect(k.destination);
            const ist = k.createBufferSource();
            ist.buffer = shumBufer;
            ist.loop = true;
            const filtr = k.createBiquadFilter();
            filtr.type = 'lowpass';
            filtr.frequency.value = 260;
            ist.connect(filtr).connect(g);
            const set = k.createOscillator();
            set.frequency.value = 50;
            const gSet = k.createGain();
            gSet.gain.value = 0.25;
            set.connect(gSet).connect(g);
            ist.start();
            set.start();
            gul = { g, ist, set };
        } else if (!vklyuchen && gul) {
            const { g, ist, set } = gul;
            gul = null;
            g.gain.setTargetAtTime(0.0001, k.currentTime, 0.4);
            ist.stop(k.currentTime + 2);
            set.stop(k.currentTime + 2);
        }
    };
})();
