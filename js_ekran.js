const PARAMETRY = new URLSearchParams(window.location.search);
const BEZ_EFEKTOV = PARAMETRY.get('fx') === '0';

window.pismoEkran = {
    MAKET_W: 1400,
    MAKET_H: 1040,
    kursorZamok: () => {},
    podognat: () => {}
};

(function bezEffektov() {
    if (!BEZ_EFEKTOV) return;
    const ekran = document.getElementById('ekran');
    if (ekran) ekran.classList.add('is-bez-efektov');
})();

(function shrift() {
    const ekran = document.getElementById('ekran');
    if (!ekran) return;

    const SELEKTOR = '.tablichka, .metka_zip, .podpis_puskach, .tablichka_v_pisme, .tablichka_mini, .metka_zip_v_pisme, .metka_zip_mini';
    let zhdet = false;

    function pervyyTekst(el) {
        const hod = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        let uzel = hod.nextNode();
        while (uzel && !uzel.nodeValue.trim()) uzel = hod.nextNode();
        return uzel;
    }

    function podognat() {
        zhdet = false;
        const masshtab = ekran.clientWidth / window.pismoEkran.MAKET_W;
        if (!masshtab) return;
        const spisok = Array.from(ekran.querySelectorAll(SELEKTOR));
        spisok.forEach((el) => el.style.removeProperty('--fit'));
        spisok.forEach((el) => {
            const shirinaRamki = parseFloat(getComputedStyle(el).getPropertyValue('--fit-w'));
            if (!shirinaRamki) return;
            const uzel = pervyyTekst(el);
            if (!uzel) return;
            const diapazon = document.createRange();
            diapazon.selectNodeContents(uzel);
            const natural = diapazon.getBoundingClientRect().width;
            if (!natural) return;
            const dostupno = shirinaRamki * masshtab;
            if (natural > dostupno) el.style.setProperty('--fit', (dostupno / natural).toFixed(4));
        });
    }

    function otlozhit() {
        if (zhdet) return;
        zhdet = true;
        window.requestAnimationFrame(podognat);
    }

    async function zagruzhen(css) {
        try {
            const spisok = await document.fonts.load(css, 'АЯаяЁ1Aa');
            return spisok.length > 0 && spisok.every((f) => f.status === 'loaded');
        } catch (oshibka) {
            return false;
        }
    }

    async function proverit() {
        if (!document.fonts || !document.fonts.load) return;
        const svoy = await zagruzhen('600 30px "Pixelify Local"');
        const gugl = svoy ? true : await zagruzhen('600 30px "Pixelify Sans"');
        ekran.classList.toggle('is-zapas', !(svoy || gugl));
        ekran.classList.add('is-shrift-gotov');
        otlozhit();
    }

    window.pismoEkran.podognat = otlozhit;

    proverit();
    if (document.fonts) {
        document.fonts.ready.then(otlozhit);
        document.fonts.addEventListener('loadingdone', otlozhit);
    }
    window.addEventListener('load', otlozhit);

    new MutationObserver(otlozhit).observe(ekran, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['hidden']
    });
})();

(function pikseli() {
    if (BEZ_EFEKTOV || PARAMETRY.get('pikseli') !== '1') return;
    const ekran = document.getElementById('ekran');
    const interfeys = document.getElementById('interfeys');
    const razmytie = document.getElementById('pikseli_razmytie');
    const tochka = document.getElementById('pikseli_tochka');
    const yacheyka = document.getElementById('pikseli_yacheyka');
    const blokMorf = document.getElementById('pikseli_blok');
    if (!ekran || !interfeys || !razmytie || !tochka || !yacheyka || !blokMorf) return;

    const YACHEYKA_MAKETA = 2;
    const MIN_BLOK = 3;

    function obnovit() {
        const dpr = window.devicePixelRatio || 1;
        const masshtab = ekran.clientWidth / window.pismoEkran.MAKET_W;
        const celevoy = YACHEYKA_MAKETA * masshtab * dpr;
        if (!masshtab || celevoy < MIN_BLOK - 0.5) {
            interfeys.classList.remove('is-pikseli');
            return;
        }
        const blok = Math.max(MIN_BLOK, 2 * Math.round((celevoy - 1) / 2) + 1);
        const blokCss = blok / dpr;
        const radius = (blok - 1) / 2 / dpr;
        razmytie.setAttribute('stdDeviation', (blokCss / 3).toFixed(3));
        tochka.setAttribute('x', radius.toFixed(3));
        tochka.setAttribute('y', radius.toFixed(3));
        tochka.setAttribute('width', (1 / dpr).toFixed(3));
        tochka.setAttribute('height', (1 / dpr).toFixed(3));
        yacheyka.setAttribute('width', blokCss.toFixed(3));
        yacheyka.setAttribute('height', blokCss.toFixed(3));
        blokMorf.setAttribute('radius', radius.toFixed(3));
        interfeys.classList.add('is-pikseli');
    }

    obnovit();
    let taimer = 0;
    window.addEventListener('resize', () => {
        window.clearTimeout(taimer);
        taimer = window.setTimeout(obnovit, 80);
    });
})();

(function shum() {
    const sloy = document.getElementById('shum');
    if (!sloy || BEZ_EFEKTOV) return;
    try {
        const RAZMER = 256;
        const holst = document.createElement('canvas');
        holst.width = RAZMER;
        holst.height = RAZMER;
        const kontekst = holst.getContext('2d');
        const kadr = kontekst.createImageData(RAZMER, RAZMER);
        const d = kadr.data;
        for (let i = 0; i < d.length; i += 4) {
            const svetloe = Math.random() < 0.5;
            const c = svetloe ? 255 : 0;
            d[i] = c;
            d[i + 1] = c;
            d[i + 2] = c;
            d[i + 3] = Math.floor(Math.random() * 54);
        }
        kontekst.putImageData(kadr, 0, 0);
        sloy.style.backgroundImage = `url(${holst.toDataURL('image/png')})`;
        sloy.style.backgroundSize = `${RAZMER}px ${RAZMER}px`;
    } catch (oshibka) {
        sloy.hidden = true;
    }
})();

(function vhs() {
    const sbo = document.getElementById('vhs_sbo');
    if (!sbo || BEZ_EFEKTOV) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const MIN_PAUZA = 5000;
    const MAKS_PAUZA = 12000;
    const DLITELNOST = 120;

    function zapustit() {
        sbo.style.top = `${10 + Math.random() * 80}%`;
        sbo.classList.add('is-aktivno');
        window.setTimeout(() => sbo.classList.remove('is-aktivno'), DLITELNOST);
        zhdat();
    }

    function zhdat() {
        window.setTimeout(zapustit, MIN_PAUZA + Math.random() * (MAKS_PAUZA - MIN_PAUZA));
    }

    zhdat();
})();

(function strazh() {
    const ekran = document.getElementById('ekran');
    if (!ekran || BEZ_EFEKTOV) return;

    const DLITELNOST_PROVERKI = 5000;
    let nachalo = 0;
    let proshlyy = 0;
    let kadrov = 0;
    let dolgih = 0;

    function shag(t) {
        if (!nachalo) {
            nachalo = t;
            proshlyy = t;
        }
        const dt = t - proshlyy;
        proshlyy = t;
        if (dt > 0 && dt < 1000) {
            kadrov += 1;
            if (dt > 45) dolgih += 1;
        }
        if (t - nachalo < DLITELNOST_PROVERKI) {
            window.requestAnimationFrame(shag);
        } else if (kadrov > 20 && dolgih / kadrov > 0.3) {
            ekran.classList.add('is-legko');
        }
    }

    window.requestAnimationFrame(shag);
})();

(function kursor() {
    const ekran = document.getElementById('ekran');
    const el = document.getElementById('kursor');
    if (!ekran || !el) return;

    const VID_RUCHKI = { n: 'ns', s: 'ns', e: 'ew', w: 'ew', nw: 'nwse', se: 'nwse', ne: 'nesw', sw: 'nesw' };

    let zamok = null;
    let poslednee = null;
    let zhdet = false;

    function ustanovitVid(vid) {
        if (el.dataset.vid !== vid) el.dataset.vid = vid;
    }

    function opredelitVid() {
        zhdet = false;
        if (zamok) {
            ustanovitVid(zamok);
            return;
        }
        if (!poslednee) return;
        const pod = document.elementFromPoint(poslednee.clientX, poslednee.clientY);
        const ruchka = pod && pod.closest ? pod.closest('[data-ruchka]') : null;
        ustanovitVid(ruchka && VID_RUCHKI[ruchka.dataset.ruchka] ? VID_RUCHKI[ruchka.dataset.ruchka] : 'strelka');
    }

    function otlozhit() {
        if (zhdet) return;
        zhdet = true;
        window.requestAnimationFrame(opredelitVid);
    }

    function perenesti(e) {
        if (e.pointerType === 'touch') return;
        poslednee = e;
        const r = ekran.getBoundingClientRect();
        const vnutri = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        el.style.transform = `translate(${(e.clientX - r.left).toFixed(1)}px, ${(e.clientY - r.top).toFixed(1)}px)`;
        document.documentElement.classList.add('js-kursor');
        el.classList.toggle('is-vidno', vnutri);
        otlozhit();
    }

    window.pismoEkran.kursorZamok = (vid) => {
        zamok = vid || null;
        otlozhit();
    };

    window.addEventListener('pointermove', perenesti, { passive: true });
    window.addEventListener('pointerdown', (e) => {
        perenesti(e);
        el.classList.add('is-nazhat');
    }, { passive: true });
    window.addEventListener('pointerup', () => el.classList.remove('is-nazhat'), { passive: true });
    document.documentElement.addEventListener('mouseleave', () => el.classList.remove('is-vidno'));
    window.addEventListener('blur', () => el.classList.remove('is-vidno'));
})();
