// Ferah sitesi: açılış animasyonu, belirme efektleri ve e-posta doğrulamalı indirme.
(() => {
  "use strict";

  const AYAR = window.FERAH_AYAR || {};
  const API = AYAR.api || "/api";
  const azHareket = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sayiBicimi = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  // ---------- Ayarlardan gelen metinler ----------
  document.querySelectorAll("[data-ayar]").forEach((el) => {
    const deger = AYAR[el.dataset.ayar];
    if (deger) {
      el.textContent = deger;
      el.classList.remove("doldur");
    }
  });
  document.querySelectorAll("[data-iletisim]").forEach((el) => {
    if (AYAR.iletisim) {
      el.href = "mailto:" + AYAR.iletisim;
      if (el.dataset.iletisim === "metin") {
        el.textContent = AYAR.iletisim;
        el.classList.remove("doldur");
      }
    } else if (el.tagName === "A" && el.dataset.iletisim !== "metin") {
      el.hidden = true;
    }
  });
  // Arka uç adresi girilmemişse: yerel deneme modu, gerçek e-posta gitmez.
  if (!AYAR.api) {
    const serit = document.createElement("div");
    serit.className = "deneme-serit";
    serit.setAttribute("role", "status");
    serit.textContent = "Yerel deneme modu: doğrulama kodu e-postayla gönderilmez, formda gösterilir. Gerçek e-posta için ayarlar.js'e Apps Script adresini yaz.";
    document.body.prepend(serit);
  }

  const yil = document.getElementById("yil");
  if (yil) yil.textContent = new Date().getFullYear();

  // ---------- Belirme ----------
  const belirenler = document.querySelectorAll("[data-goster]");
  if (azHareket || !("IntersectionObserver" in window)) {
    belirenler.forEach((el) => el.classList.add("gorundu"));
  } else {
    const gozcu = new IntersectionObserver((girdiler) => {
      girdiler.forEach((g) => {
        if (g.isIntersecting) {
          g.target.classList.add("gorundu");
          gozcu.unobserve(g.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    belirenler.forEach((el) => gozcu.observe(el));
  }

  // ---------- Açılış animasyonu: dosyalar renkli parçacıklar olarak halkaya akar ----------
  const tuval = document.getElementById("akis");
  if (tuval) akisAnimasyonu(tuval);

  function akisAnimasyonu(canvas) {
    const ctx = canvas.getContext("2d");
    const renkler = ["#5AA9FF", "#F5A524", "#B69CFF", "#3DD68C", "#F07FB6", "#4FD1C5"];
    const zemin = "#0E0F12";
    const PARCACIK = 110;
    const sabit = (n, tohum) => { const x = Math.sin(n * tohum) * 43758.5453; return x - Math.floor(x); };
    const birim = (x) => x - Math.floor(x);
    let genislik = 0, yukseklik = 0, olcek = 1, calisiyor = true, kare = 0;

    function boyutla() {
      const k = canvas.getBoundingClientRect();
      olcek = Math.min(window.devicePixelRatio || 1, 2);
      genislik = k.width; yukseklik = k.height;
      canvas.width = Math.round(genislik * olcek);
      canvas.height = Math.round(yukseklik * olcek);
      ctx.setTransform(olcek, 0, 0, olcek, 0, 0);
    }

    function dilim(m, ic, dis, bas, bit) {
      const a0 = bas * Math.PI * 2 - Math.PI / 2;
      const a1 = bit * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(m.x, m.y, dis, a0, a1, false);
      ctx.arc(m.x, m.y, ic, a1, a0, true);
      ctx.closePath();
    }

    function ciz(zaman) {
      const t = zaman / 1000;
      const r = Math.min(genislik, yukseklik) / 2;
      const m = { x: genislik / 2, y: yukseklik / 2 };
      const hedef = r * 0.5;
      ctx.clearRect(0, 0, genislik, yukseklik);

      for (let k = 0; k < PARCACIK; k++) {
        const periyot = 2.6 + 2.6 * sabit(k + 1, 3.71);
        const faz = sabit(k + 1, 9.13) * periyot;
        const u = birim((t + faz) / periyot);
        const e = u * u;
        const aci = (sabit(k + 1, 5.37) + 0.3 * e) * Math.PI * 2 - Math.PI / 2;
        const uzaklik = r * 0.98 - (r * 0.98 - hedef) * e;
        const x = m.x + uzaklik * Math.cos(aci);
        const y = m.y + uzaklik * Math.sin(aci);
        const cap = 1.6 + 3 * (1 - e);
        ctx.globalAlpha = Math.sin(Math.PI * u);
        ctx.fillStyle = renkler[k % renkler.length];
        ctx.beginPath();
        ctx.arc(x, y, cap, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      const nabiz = 0.5 + 0.5 * Math.sin(t * 2.4);
      const donus = birim(t * 0.06);
      const kalinlik = Math.max(8, r * 0.05);
      for (let i = 0; i < 6; i++) {
        const b = donus + i / 6;
        dilim(m, hedef - kalinlik - nabiz * 2, hedef + kalinlik + nabiz * 2, b + 0.006, b + 1 / 6 - 0.006);
        ctx.fillStyle = renkler[i];
        ctx.fill();
      }
      ctx.beginPath();
      ctx.arc(m.x, m.y, hedef - kalinlik - 4, 0, Math.PI * 2);
      ctx.fillStyle = zemin;
      ctx.fill();
    }

    function dongu(zaman) {
      if (!calisiyor) return;
      ciz(zaman);
      kare = requestAnimationFrame(dongu);
    }

    boyutla();
    window.addEventListener("resize", () => { boyutla(); if (azHareket) ciz(2000); });
    if (azHareket) { ciz(2000); return; }

    // Görünmüyorsa pil harcamasın
    const gozcu = new IntersectionObserver(([g]) => {
      const gorunur = g.isIntersecting && !document.hidden;
      if (gorunur && !calisiyor) { calisiyor = true; kare = requestAnimationFrame(dongu); }
      if (!gorunur) { calisiyor = false; cancelAnimationFrame(kare); }
    });
    gozcu.observe(canvas);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { calisiyor = false; cancelAnimationFrame(kare); }
      else if (!calisiyor) { calisiyor = true; kare = requestAnimationFrame(dongu); }
    });
    kare = requestAnimationFrame(dongu);
    sayacDongusu();
  }

  // Ortadaki sayaç: görünen boyuttan gerçek boyuta iner.
  function sayacDongusu() {
    const deger = document.getElementById("sayac-deger");
    const etiket = document.getElementById("sayac-etiket");
    if (!deger || !etiket) return;
    const GORUNEN = 582.6, GERCEK = 37.9;
    const BEKLE = 2200, IN = 2600, DUR = 3600;
    let baslangic = performance.now();
    function adim(simdi) {
      const g = (simdi - baslangic) % (BEKLE + IN + DUR);
      let v = GORUNEN;
      if (g > BEKLE && g <= BEKLE + IN) {
        const p = (g - BEKLE) / IN;
        const e = 1 - Math.pow(1 - p, 3);
        v = GORUNEN + (GERCEK - GORUNEN) * e;
      } else if (g > BEKLE + IN) {
        v = GERCEK;
      }
      deger.textContent = sayiBicimi.format(v);
      const gercekMi = g > BEKLE + IN * 0.6;
      etiket.textContent = gercekMi ? "gerçek" : "görünen";
      etiket.classList.toggle("gercek", gercekMi);
      requestAnimationFrame(adim);
    }
    requestAnimationFrame(adim);
  }

  // ---------- İndirme: e-posta, doğrulama kodu, indirme ----------
  const epostaFormu = document.getElementById("eposta-formu");
  const kodFormu = document.getElementById("kod-formu");
  const basari = document.getElementById("basari");
  if (!epostaFormu || !kodFormu || !basari) return;

  const epostaGirdisi = document.getElementById("eposta");
  const aydinlatma = document.getElementById("aydinlatma");
  const pazarlama = document.getElementById("pazarlama");
  const tuzak = document.getElementById("web");
  const haneler = Array.from(kodFormu.querySelectorAll(".hane"));
  const yenidenGonder = document.getElementById("yeniden-gonder");
  const adresDegistir = document.getElementById("adres-degistir");
  const gonderilenAdres = document.getElementById("gonderilen-adres");
  const indirmeBaglantisi = document.getElementById("indirme-baglantisi");

  let eposta = "";
  let geriSayim = 0;

  const EPOSTA_DESENI = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  async function istek(veri) {
    const yanit = await fetch(API, {
      method: "POST",
      // text/plain: Apps Script'e ön kontrol (CORS preflight) istemeden gider
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(veri),
    });
    if (!yanit.ok) throw new Error("Sunucuya ulaşılamadı.");
    return yanit.json();
  }

  function hataGoster(form, metin) {
    form.querySelector(".hata").textContent = metin || "";
  }

  function yukleniyor(dugme, durum, metin) {
    if (durum) {
      dugme.dataset.metin = dugme.textContent;
      dugme.setAttribute("aria-busy", "true");
      dugme.disabled = true;
      dugme.innerHTML = '<span class="donen" aria-hidden="true"></span>' + metin;
    } else {
      dugme.removeAttribute("aria-busy");
      dugme.disabled = false;
      dugme.textContent = dugme.dataset.metin || dugme.textContent;
    }
  }

  let sayacZamanlayici = 0;
  function geriSayimBaslat(saniye) {
    clearTimeout(sayacZamanlayici);
    geriSayim = saniye;
    yenidenGonder.disabled = true;
    const guncelle = () => {
      if (geriSayim <= 0) {
        yenidenGonder.disabled = false;
        yenidenGonder.textContent = "Kodu yeniden gönder";
        return;
      }
      yenidenGonder.textContent = `Kodu yeniden gönder (${geriSayim} sn)`;
      geriSayim -= 1;
      sayacZamanlayici = setTimeout(guncelle, 1000);
    };
    guncelle();
  }

  async function kodGonder(dugme) {
    const sonuc = await istek({ islem: "kodGonder", eposta, pazarlama: pazarlama.checked, web: tuzak.value });
    if (!sonuc.ok) {
      if (sonuc.bekle) geriSayimBaslat(sonuc.bekle);
      throw new Error(sonuc.hata || "Kod gönderilemedi.");
    }
    geriSayimBaslat(60);
    return sonuc;
  }

  epostaFormu.addEventListener("submit", async (olay) => {
    olay.preventDefault();
    hataGoster(epostaFormu, "");
    eposta = epostaGirdisi.value.trim().toLowerCase();
    epostaGirdisi.setAttribute("aria-invalid", "false");
    if (!EPOSTA_DESENI.test(eposta)) {
      epostaGirdisi.setAttribute("aria-invalid", "true");
      hataGoster(epostaFormu, "Geçerli bir e-posta adresi yaz.");
      epostaGirdisi.focus();
      return;
    }
    if (!aydinlatma.checked) {
      hataGoster(epostaFormu, "Devam etmek için Aydınlatma Metni'ni okuduğunu onayla.");
      aydinlatma.focus();
      return;
    }
    const dugme = epostaFormu.querySelector("button[type=submit]");
    yukleniyor(dugme, true, "Gönderiliyor…");
    let sonucKodu = "";
    try {
      sonucKodu = (await kodGonder(dugme)).denemeKodu || "";
      gonderilenAdres.textContent = eposta;
      denemeKodunuGoster(sonucKodu);
      epostaFormu.hidden = true;
      kodFormu.hidden = false;
      haneler.forEach((h) => (h.value = ""));
      haneler[0].focus();
    } catch (h) {
      hataGoster(epostaFormu, h.message || "Bir sorun oluştu, biraz sonra tekrar dene.");
    } finally {
      yukleniyor(dugme, false);
    }
  });

  // Kod haneleri: yazınca ilerle, silince geri dön, yapıştırınca dağıt
  haneler.forEach((hane, i) => {
    hane.addEventListener("input", () => {
      const rakamlar = hane.value.replace(/\D/g, "");
      if (rakamlar.length > 1) {
        dagit(rakamlar, i);
        return;
      }
      hane.value = rakamlar;
      if (rakamlar && i < haneler.length - 1) haneler[i + 1].focus();
      if (kod().length === 6) kodFormu.requestSubmit();
    });
    hane.addEventListener("keydown", (olay) => {
      if (olay.key === "Backspace" && !hane.value && i > 0) {
        haneler[i - 1].focus();
        haneler[i - 1].value = "";
        olay.preventDefault();
      } else if (olay.key === "ArrowLeft" && i > 0) {
        haneler[i - 1].focus();
      } else if (olay.key === "ArrowRight" && i < haneler.length - 1) {
        haneler[i + 1].focus();
      }
    });
    hane.addEventListener("paste", (olay) => {
      const metin = (olay.clipboardData || window.clipboardData).getData("text").replace(/\D/g, "");
      if (metin) {
        olay.preventDefault();
        dagit(metin, 0);
      }
    });
  });

  function dagit(rakamlar, bas) {
    rakamlar.slice(0, 6 - bas).split("").forEach((r, j) => (haneler[bas + j].value = r));
    const sonraki = Math.min(bas + rakamlar.length, haneler.length - 1);
    haneler[sonraki].focus();
    if (kod().length === 6) kodFormu.requestSubmit();
  }

  const kod = () => haneler.map((h) => h.value).join("");

  let dogrulaniyor = false;
  kodFormu.addEventListener("submit", async (olay) => {
    olay.preventDefault();
    if (dogrulaniyor) return;
    hataGoster(kodFormu, "");
    if (kod().length !== 6) {
      hataGoster(kodFormu, "6 haneli kodun tamamını gir.");
      return;
    }
    const dugme = kodFormu.querySelector("button[type=submit]");
    dogrulaniyor = true;
    yukleniyor(dugme, true, "Doğrulanıyor…");
    try {
      const sonuc = await istek({ islem: "dogrula", eposta, kod: kod(), pazarlama: pazarlama.checked });
      if (!sonuc.ok) throw new Error(sonuc.hata || "Kod doğrulanamadı.");
      kodFormu.hidden = true;
      basari.hidden = false;
      basari.focus();
      if (sonuc.indirmeUrl) {
        indirmeBaglantisi.href = sonuc.indirmeUrl;
        if (/\.dmg($|\?)/i.test(sonuc.indirmeUrl)) window.location.href = sonuc.indirmeUrl;
      }
    } catch (h) {
      hataGoster(kodFormu, h.message || "Bir sorun oluştu, biraz sonra tekrar dene.");
      haneler.forEach((h) => (h.value = ""));
      haneler[0].focus();
    } finally {
      dogrulaniyor = false;
      yukleniyor(dugme, false);
    }
  });

  function denemeKodunuGoster(kodMetni) {
    let kutu = document.getElementById("deneme-kodu");
    if (!kodMetni) { if (kutu) kutu.remove(); return; }
    if (!kutu) {
      kutu = document.createElement("p");
      kutu.id = "deneme-kodu";
      kutu.className = "deneme-kodu";
      kodFormu.querySelector(".form-alt").after(kutu);
    }
    kutu.textContent = "Yerel deneme kodu: " + kodMetni;
  }

  yenidenGonder.addEventListener("click", async () => {
    hataGoster(kodFormu, "");
    yukleniyor(yenidenGonder, true, "Gönderiliyor…");
    try {
      denemeKodunuGoster((await kodGonder(yenidenGonder)).denemeKodu || "");
      hataGoster(kodFormu, "");
    } catch (h) {
      hataGoster(kodFormu, h.message);
    } finally {
      yenidenGonder.removeAttribute("aria-busy");
      if (geriSayim <= 0) {
        yenidenGonder.disabled = false;
        yenidenGonder.textContent = "Kodu yeniden gönder";
      }
    }
  });

  adresDegistir.addEventListener("click", () => {
    kodFormu.hidden = true;
    epostaFormu.hidden = false;
    epostaGirdisi.focus();
    epostaGirdisi.select();
  });
})();
