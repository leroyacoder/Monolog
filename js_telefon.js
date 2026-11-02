(function telefon() {
    const html = document.documentElement;
    const ekran = document.getElementById('ekran');
    const povorot = document.getElementById('povorot');
    if (!ekran) return;

    const sensor = window.matchMedia('(hover: none) and (pointer: coarse)');
    const POKAZ = 5000;
    const UHOD = 600;
    const BAZA = 15;
    const MAKS = 1.45;
    const VLEZT = '.podpis_plashki, .nadpis_uspekh, .zagolovok_tekst, .chasy_vremya';
    const OTSTUP = 6;
    let taimerPokaza = 0;
    let taimerRazmera = 0;
    let zhdetVlezt = false;

    const telefon = () => sensor.matches;
    const portret = () => window.innerHeight > window.innerWidth;

    function razmery() {
        html.style.setProperty('--vw', `${window.innerWidth}px`);
        html.style.setProperty('--vh', `${window.innerHeight}px`);
    }

    function masshtab() {
        if (!telefon()) {
            ekran.style.removeProperty('--ks');
            window.pismoEkran.podognat();
            return;
        }
        const shirina = ekran.clientWidth;
        const tekst = (shirina * 30) / window.pismoEkran.MAKET_W;
        const ks = tekst ? Math.min(MAKS, Math.max(1, BAZA / tekst)) : 1;
        ekran.style.setProperty('--ks', ks.toFixed(3));
        window.pismoEkran.podognat();
        otlozhitVlezt();
    }

    function vlezt() {
        zhdetVlezt = false;
        const spisok = Array.from(ekran.querySelectorAll(VLEZT));
        spisok.forEach((el) => el.style.removeProperty('--fit'));
        if (!telefon()) return;
        const re = ekran.getBoundingClientRect();
        const k = window.pismoEkran.ramka(re, re).width / window.pismoEkran.MAKET_W;
        spisok.forEach((el) => {
            const roditel = el.offsetParent;
            if (!roditel || !el.firstChild) return;
            const diapazon = document.createRange();
            diapazon.selectNodeContents(el);
            const tekst = window.pismoEkran.ramka(diapazon.getBoundingClientRect(), re);
            const ramka = window.pismoEkran.ramka(roditel.getBoundingClientRect(), re);
            if (!tekst.width || !ramka.width) return;
            const dostupno = ramka.left + ramka.width - tekst.left - OTSTUP * k;
            if (dostupno > 0 && tekst.width > dostupno) el.style.setProperty('--fit', (dostupno / tekst.width).toFixed(4));
        });
    }

    function otlozhitVlezt() {
        if (zhdetVlezt) return;
        zhdetVlezt = true;
        window.requestAnimationFrame(vlezt);
    }

    function obnovit() {
        razmery();
        html.classList.toggle('is-telefon', telefon());
        html.classList.toggle('is-povorot', telefon() && portret());
        masshtab();
    }

    function skryt() {
        if (!povorot || povorot.hidden || povorot.classList.contains('is-uhodit')) return;
        window.clearTimeout(taimerPokaza);
        povorot.classList.add('is-uhodit');
        window.setTimeout(() => {
            povorot.hidden = true;
        }, UHOD);
    }

    function pozzhe() {
        window.clearTimeout(taimerRazmera);
        taimerRazmera = window.setTimeout(() => {
            obnovit();
            if (!portret()) skryt();
        }, 120);
    }

    obnovit();

    if (povorot && telefon() && portret()) {
        povorot.hidden = false;
        taimerPokaza = window.setTimeout(skryt, POKAZ);
    }

    window.addEventListener('resize', pozzhe);
    window.addEventListener('orientationchange', pozzhe);
    if (sensor.addEventListener) sensor.addEventListener('change', obnovit);
    if (document.fonts) document.fonts.ready.then(masshtab);
    new MutationObserver(otlozhitVlezt).observe(ekran, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['hidden', 'class']
    });
})();
