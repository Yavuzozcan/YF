// YF v2.0 — Akıllı Asgari Ödeme Sistemi
document.addEventListener("DOMContentLoaded", () => {
  const CK="yf_cards_v1", TK="yf_transactions_v1", RATE=.20;
  let cards=load(CK), txs=load(TK);

  const $=id=>document.getElementById(id);
  const money=v=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(Number(v)||0);
  const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const round=v=>Math.round((Number(v)+Number.EPSILON)*100)/100;
  const save=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
  function load(k){try{return JSON.parse(localStorage.getItem(k))||[]}catch{return[]}}
  const cycleOf=v=>{const m=String(v||"").match(/^(\d{4})-(\d{2})/);return m?`${m[1]}-${m[2]}`:`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,"0")}`};
  const dateText=v=>{if(!v)return"Belirtilmedi";const d=new Date(String(v).includes("T")?v:`${v}T12:00:00`);return Number.isNaN(d)? "Belirtilmedi":d.toLocaleDateString("tr-TR",{day:"numeric",month:"long",year:"numeric"})};
  const currentMonth=v=>{const d=new Date(String(v).includes("T")?v:`${v}T12:00:00`),n=new Date();return d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()};
  const bankClass=b=>{b=String(b||"").toLocaleLowerCase("tr-TR");if(b.includes("ziraat"))return"bank-ziraat";if(b.includes("garanti"))return"bank-garanti";if(b.includes("akbank"))return"bank-akbank";if(b.includes("qnb"))return"bank-qnb";if(b.includes("iş"))return"bank-is";if(b.includes("tom"))return"bank-tom";return""};
  const iconClass=b=>{b=String(b||"").toLocaleLowerCase("tr-TR");if(b.includes("ziraat")||b.includes("akbank"))return"red";if(b.includes("qnb"))return"purple";return""};

  cards=cards.map(c=>({...c,id:c.id||uid(),bank:c.bank||c.bankName||"Diğer",name:c.name||c.cardName||"Kart",limit:Number(c.limit||0),debt:Number(c.debt||0),statementDebt:Number(c.statementDebt??c.debt??0),statementCycle:c.statementCycle||cycleOf(c.dueDate)}));
  txs=txs.map(t=>({...t,id:t.id||uid(),amount:Number(t.amount||0)}));
  save(CK,cards);save(TK,txs);

  const pages=document.querySelectorAll(".page"), navs=document.querySelectorAll(".nav-item");
  function showPage(id){pages.forEach(p=>p.classList.toggle("active",p.id===id));document.querySelectorAll(".bottom-navigation .nav-item").forEach(n=>n.classList.toggle("active",n.dataset.page===id));if(id==="debtPaymentPage")setTimeout(updateMinimumPanel,50);scrollTo({top:0,behavior:"smooth"})}
  navs.forEach(n=>n.addEventListener("click",()=>n.dataset.page&&showPage(n.dataset.page)));

  const welcome=$("welcomeText");if(welcome){const h=new Date().getHours();welcome.textContent=h>=5&&h<11?"Günaydın Yavuz 👋":h<18?"İyi Günler Yavuz ☀️":h<22?"İyi Akşamlar Yavuz 🌙":"İyi Geceler Yavuz 🌙"}

  const cardModal=$("cardModal"),cardForm=$("cardForm"),cardId=$("cardId"),bankName=$("bankName"),cardName=$("cardName"),cardLimit=$("cardLimit"),cardDebt=$("cardDebt"),statementDate=$("statementDate"),dueDate=$("dueDate"),cardMsg=$("cardFormMessage");
  function openCard(c=null){cardForm?.reset();cardId.value=c?.id||"";$("cardFormTitle").textContent=c?"Kartı Düzenle":"Yeni Kart Ekle";if(c){bankName.value=c.bank;cardName.value=c.name;cardLimit.value=c.limit;cardDebt.value=c.debt;statementDate.value=c.statementDate||"";dueDate.value=c.dueDate||""}cardModal.classList.remove("hidden");document.body.style.overflow="hidden"}
  function closeCard(){cardModal.classList.add("hidden");document.body.style.overflow=""}
  $("openCardFormButton")?.addEventListener("click",()=>openCard());
  $("quickAddCardButton")?.addEventListener("click",()=>openCard());
  $("closeCardFormButton")?.addEventListener("click",closeCard);
  $("cancelCardButton")?.addEventListener("click",closeCard);
  $("modalBackdrop")?.addEventListener("click",closeCard);
  cardForm?.addEventListener("submit",e=>{e.preventDefault();const limit=Number(cardLimit.value),debt=Number(cardDebt.value);if(!bankName.value||!cardName.value.trim()||!Number.isFinite(limit)||limit<0||!Number.isFinite(debt)||debt<0){alert("Kart bilgilerini doğru gir.");return}const old=cards.find(c=>c.id===cardId.value);const c={id:cardId.value||uid(),bank:bankName.value,name:cardName.value.trim(),limit,debt,statementDebt:debt,statementCycle:cycleOf(dueDate.value),statementDate:statementDate.value||"",dueDate:dueDate.value||"",createdAt:old?.createdAt||new Date().toISOString()};const i=cards.findIndex(x=>x.id===c.id);i>=0?cards[i]=c:cards.unshift(c);save(CK,cards);renderAll();closeCard();showPage("cardsPage")});

  const txModal=$("transactionModal"),txForm=$("transactionForm"),txType=$("transactionType"),txName=$("transactionName"),txAmount=$("transactionAmount"),txCat=$("transactionCategory"),txDate=$("transactionDate"),txMethod=$("transactionPaymentMethod"),txCard=$("transactionCard"),txCardField=$("transactionCardField");
  function fillTxCards(){if(!txCard)return;txCard.innerHTML='<option value="">Kart seç</option>';cards.forEach(c=>{const o=document.createElement("option");o.value=c.id;o.textContent=`${c.bank} - ${c.name}`;txCard.appendChild(o)})}
  function toggleTxCard(){const show=txType?.value==="expense"&&txMethod?.value==="card";txCardField?.classList.toggle("hidden",!show);if(!show&&txCard)txCard.value=""}
  function openTx(){txForm?.reset();fillTxCards();txDate.value=new Date().toISOString().split("T")[0];toggleTxCard();txModal.classList.remove("hidden");document.body.style.overflow="hidden"}
  function closeTx(){txModal.classList.add("hidden");document.body.style.overflow=""}
  $("openTransactionFormButton")?.addEventListener("click",openTx);
  $("closeTransactionFormButton")?.addEventListener("click",closeTx);
  $("cancelTransactionButton")?.addEventListener("click",closeTx);
  $("transactionModalBackdrop")?.addEventListener("click",closeTx);
  txType?.addEventListener("change",toggleTxCard);txMethod?.addEventListener("change",toggleTxCard);
  txForm?.addEventListener("submit",e=>{e.preventDefault();const type=txType.value,amount=Number(txAmount.value),method=txMethod.value,cardId=type==="expense"&&method==="card"?txCard.value:"";if(!txName.value.trim()||!txCat.value||!txDate.value||!Number.isFinite(amount)||amount<=0){alert("İşlem bilgilerini doğru gir.");return}const t={id:uid(),type,name:txName.value.trim(),amount,category:txCat.value,date:txDate.value,paymentMethod:method,cardId,cardDebtDelta:0,createdAt:new Date().toISOString()};if(cardId){const c=cards.find(x=>x.id===cardId);if(!c){alert("Kart bulunamadı.");return}if(c.limit>0&&c.debt+amount>c.limit){alert("Bu işlem kart limitini aşıyor.");return}c.debt+=amount;t.cardDebtDelta=amount;save(CK,cards)}txs.unshift(t);save(TK,txs);renderAll();closeTx()});

  function minimumInfo(card){
    if(!card)return{minimum:0,paid:0,remaining:0,pct:0};
    const minimum=round(Number(card.statementDebt??card.debt??0)*RATE),cycle=card.statementCycle||cycleOf(card.dueDate);
    const paid=round(load(TK).filter(t=>t.type==="card-payment"&&t.cardId===card.id&&(t.statementCycle?t.statementCycle===cycle:currentMonth(t.createdAt||t.date))).reduce((s,t)=>s+Number(t.amount||0),0));
    const remaining=round(Math.max(0,minimum-paid));return{minimum,paid,remaining,pct:minimum?Math.min(100,Math.round(paid/minimum*100)):100}
  }

  function addSmartPanel(){
    const form=$("debtPaymentForm"),box=document.querySelector(".debt-payment-summary"),amount=$("debtPaymentAmount");if(!form||!box||!amount||$("smartMinimumPanel"))return;
    const p=document.createElement("section");p.id="smartMinimumPanel";p.className="smart-minimum-panel";p.innerHTML=`<div class="smart-minimum-head"><div><span>Otomatik Asgari (%20)</span><strong id="smartMinimumAmount">${money(0)}</strong></div><span id="smartMinimumBadge" class="smart-minimum-badge waiting">Kart seç</span></div><div class="smart-minimum-grid"><div><span>Bu dönem ödendi</span><strong id="smartPaidAmount">${money(0)}</strong></div><div><span>Kalan asgari</span><strong id="smartRemainingAmount">${money(0)}</strong></div></div><div class="smart-minimum-track"><div id="smartMinimumProgress"></div></div><small id="smartMinimumText">Kart seçildiğinde otomatik hesaplanır.</small><button id="payMinimumButton" class="smart-minimum-button" type="button" disabled>⚡ Kalan Asgariyi Öde</button>`;
    box.insertAdjacentElement("afterend",p);$("debtPaymentCard")?.addEventListener("change",updateMinimumPanel);$("payMinimumButton").addEventListener("click",()=>{const c=selectedPaymentCard(),i=minimumInfo(c);if(!c||i.remaining<=0)return;amount.value=Math.min(i.remaining,c.debt).toFixed(2);form.requestSubmit()});updateMinimumPanel();
  }
  function selectedPaymentCard(){const id=$("debtPaymentCard")?.value;return load(CK).find(c=>c.id===id)||null}
  function updateMinimumPanel(){const c=selectedPaymentCard(),a=$("smartMinimumAmount"),p=$("smartPaidAmount"),r=$("smartRemainingAmount"),b=$("smartMinimumBadge"),f=$("smartMinimumProgress"),t=$("smartMinimumText"),btn=$("payMinimumButton");if(!a)return;if(!c){a.textContent=p.textContent=r.textContent=money(0);b.textContent="Kart seç";b.className="smart-minimum-badge waiting";f.style.width="0%";t.textContent="Kart seçildiğinde otomatik hesaplanır.";btn.disabled=true;return}const i=minimumInfo(c);a.textContent=money(i.minimum);p.textContent=money(i.paid);r.textContent=money(i.remaining);f.style.width=`${i.pct}%`;t.textContent=`${money(i.paid)} / ${money(i.minimum)} · %${i.pct}`;if(i.remaining<=0){b.textContent="Asgari ödendi ✓";b.className="smart-minimum-badge completed";btn.disabled=true}else if(i.paid>0){b.textContent="Kısmen ödendi";b.className="smart-minimum-badge partial";btn.disabled=false}else{b.textContent="Asgari bekliyor";b.className="smart-minimum-badge waiting";btn.disabled=false}}
  addSmartPanel();

  $("debtPaymentForm")?.addEventListener("submit",()=>{const id=$("debtPaymentCard").value,amount=Number($("debtPaymentAmount").value),stamp=Date.now();setTimeout(()=>{const list=load(TK),c=load(CK).find(x=>x.id===id),t=list.find(x=>x.type==="card-payment"&&x.cardId===id&&Math.abs(Number(x.amount)-amount)<.01&&Math.abs(new Date(x.createdAt||x.date).getTime()-stamp)<15000);if(t&&!t.statementCycle){t.statementCycle=c?.statementCycle||cycleOf(c?.dueDate);const info=minimumInfo(c);t.paymentKind=Math.abs(amount-info.remaining)<.01?"minimum":"custom";save(TK,list)}},100)},true);

  function deleteTx(id){if(!confirm("Bu işlem silinsin mi?"))return;const t=txs.find(x=>x.id===id);if(!t)return;const d=Number(t.cardDebtDelta??0);if(t.cardId&&d!==0){const c=cards.find(x=>x.id===t.cardId);if(c)c.debt=Math.max(0,c.debt-d);save(CK,cards)}txs=txs.filter(x=>x.id!==id);save(TK,txs);renderAll()}

  function renderCards(){const list=$("cardsList");if(!list)return;list.innerHTML="";if(!cards.length){list.innerHTML='<div class="empty-state">Henüz kart eklenmedi.</div>';return}cards.forEach(c=>{const i=minimumInfo(c),available=Math.max(0,c.limit-c.debt),usage=c.limit?Math.min(100,Math.round(c.debt/c.limit*100)):0,el=document.createElement("article");el.className=`bank-card ${bankClass(c.bank)}`;el.innerHTML=`<div class="bank-card-header"><div><span>${esc(c.bank)}</span><h3>${esc(c.name)}</h3></div><div class="bank-card-actions"><button data-edit="${c.id}">Düzenle</button><button data-delete="${c.id}">Sil</button></div></div><strong class="bank-card-debt">${money(c.debt)}</strong><div class="card-minimum-status"><div class="card-minimum-status-head"><div><span>Otomatik asgari (%20)</span><strong>${money(i.minimum)}</strong></div><span class="card-minimum-status-badge ${i.remaining<=0?"completed":i.paid>0?"partial":"waiting"}">${i.remaining<=0?"Asgari ödendi ✓":i.paid>0?`${money(i.remaining)} kaldı`:"Asgari bekliyor"}</span></div><div class="card-minimum-status-track"><div style="width:${i.pct}%"></div></div><small>Bu dönem: ${money(i.paid)} / ${money(i.minimum)}</small></div><div class="bank-card-details"><div><span>Kart Limiti</span><strong>${money(c.limit)}</strong></div><div><span>Kalan Limit</span><strong>${money(available)}</strong></div><div><span>Kullanım</span><strong>%${usage}</strong></div></div><div class="bank-card-dates"><div><span>Hesap Kesim</span><strong>${dateText(c.statementDate)}</strong></div><div><span>Son Ödeme</span><strong>${dateText(c.dueDate)}</strong></div></div>`;
    el.querySelector("[data-edit]").onclick=()=>openCard(c);el.querySelector("[data-delete]").onclick=()=>{if(confirm(`${c.bank} kartı silinsin mi?`)){cards=cards.filter(x=>x.id!==c.id);save(CK,cards);renderAll()}};list.appendChild(el)})}

  function renderTx(){const list=$("transactionsList");if(!list)return;list.innerHTML="";if(!txs.length){list.innerHTML='<div class="empty-state">Henüz işlem eklenmedi.</div>';return}txs.forEach(t=>{const income=t.type==="income",c=cards.find(x=>x.id===t.cardId),el=document.createElement("article"),label=t.type==="card-payment"?(t.paymentKind==="minimum"?"Asgari Ödeme":"Kart Borcu Ödemesi"):(t.category||"İşlem");el.className="transaction-item";el.innerHTML=`<div><h3>${esc(t.name||label)}</h3><small>${esc(label)}${c?` · ${esc(c.bank)} - ${esc(c.name)}`:t.cardName?` · ${esc(t.cardName)}`:""} · ${dateText(t.date||t.createdAt)}</small></div><div><strong class="${income?"transaction-income":"transaction-expense"}">${income?"+":"-"}${money(t.amount)}</strong><button data-del="${t.id}">Sil</button></div>`;el.querySelector("[data-del]").onclick=()=>deleteTx(t.id);list.appendChild(el)})}

  function renderDashboard(){const debt=cards.reduce((s,c)=>s+c.debt,0),limit=cards.reduce((s,c)=>s+c.limit,0),income=txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0),expense=txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0),cashExpense=txs.filter(t=>t.type==="expense"&&t.paymentMethod!=="card").reduce((s,t)=>s+t.amount,0),payments=txs.filter(t=>t.type==="card-payment"&&currentMonth(t.createdAt||t.date)).reduce((s,t)=>s+t.amount,0),cash=income-cashExpense-payments,net=cash-debt;
    [["totalDebt",money(debt)],["totalAssets",money(Math.max(0,cash))],["monthlyPayment",money(payments)],["netBalance",money(net)],["cardCount",String(cards.length)],["cardsTotalDebt",money(debt)],["cardsTotalLimit",money(limit)],["cardsAvailableLimit",money(Math.max(0,limit-debt))],["totalIncome",money(income)],["totalExpense",money(expense)],["transactionBalance",money(cash)]].forEach(([id,v])=>{if($(id))$(id).textContent=v});if($("balanceStatus"))$("balanceStatus").textContent=net<0?"Ekside":net>0?"Pozitif":"Dengeli"}

  function renderUpcoming(){const list=$("upcomingPayments");if(!list)return;list.innerHTML="";const arr=cards.filter(c=>c.dueDate&&c.debt>0).sort((a,b)=>new Date(a.dueDate)-new Date(b.dueDate));if(!arr.length){list.innerHTML='<div class="empty-state">Henüz kart veya ödeme kaydı bulunmuyor.</div>';return}arr.slice(0,4).forEach(c=>{const i=minimumInfo(c),el=document.createElement("article");el.className="payment-item";el.innerHTML=`<div class="bank-icon ${iconClass(c.bank)}">${esc(c.bank.charAt(0))}</div><div class="payment-info"><strong>${esc(c.bank)}</strong><span>Son ödeme: ${dateText(c.dueDate)} · Kalan asgari: ${money(i.remaining)}</span></div><strong class="payment-amount">${money(c.debt)}</strong>`;list.appendChild(el)})}

  function addStyles(){const s=document.createElement("style");s.textContent=`.smart-minimum-panel,.card-minimum-status{display:grid;gap:12px;padding:15px;border:1px solid rgba(40,212,154,.2);border-radius:17px;background:rgba(24,72,69,.35)}.smart-minimum-head,.card-minimum-status-head{display:flex;justify-content:space-between;gap:12px}.smart-minimum-head span,.card-minimum-status-head span{display:block;color:#8fa2ba;font-size:10px}.smart-minimum-head strong,.card-minimum-status-head strong{display:block;color:#fff;font-size:20px;margin-top:4px}.smart-minimum-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.smart-minimum-grid>div{padding:10px;border-radius:12px;background:rgba(255,255,255,.04)}.smart-minimum-grid span{display:block;color:#8fa2ba;font-size:9px}.smart-minimum-grid strong{display:block;color:#fff;margin-top:4px}.smart-minimum-track,.card-minimum-status-track{height:8px;overflow:hidden;border-radius:99px;background:rgba(255,255,255,.08)}.smart-minimum-track>div,.card-minimum-status-track>div{height:100%;background:linear-gradient(90deg,#25c98d,#5ee8b7)}.smart-minimum-button{min-height:48px;border:0;border-radius:14px;background:linear-gradient(135deg,#52e6b2,#25c98d);color:#08271e;font-weight:900}.smart-minimum-button:disabled{opacity:.45}.smart-minimum-badge,.card-minimum-status-badge{height:26px;padding:0 8px;border-radius:99px;font-size:9px;font-weight:800;display:flex;align-items:center}.waiting{color:#ffc96d;background:rgba(255,184,71,.12)}.partial{color:#74c2ff;background:rgba(15,140,255,.12)}.completed{color:#4de0aa;background:rgba(40,212,154,.12)}.card-minimum-status{margin:14px 0}.card-minimum-status small,#smartMinimumText{color:#8fa2ba;font-size:10px}@media(max-width:370px){.smart-minimum-grid{grid-template-columns:1fr}.smart-minimum-head,.card-minimum-status-head{flex-direction:column}}`;document.head.appendChild(s)}
  addStyles();

  function renderAll(){cards=load(CK);txs=load(TK);renderCards();renderTx();renderDashboard();renderUpcoming();fillTxCards();setTimeout(updateMinimumPanel,0)}
  renderAll();
});
// =========================================
// YF v2.0.1 — Borç Öde kart listesini düzelt
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const CARD_STORAGE_KEY = "yf_cards_v1";
  const paymentCardSelect = document.getElementById("debtPaymentCard");
  const selectedCardDebt = document.getElementById("selectedCardDebt");

  if (!paymentCardSelect) return;

  function loadCardsForPayment() {
    try {
      const savedCards = JSON.parse(
        localStorage.getItem(CARD_STORAGE_KEY) || "[]"
      );

      const oldValue = paymentCardSelect.value;

      paymentCardSelect.innerHTML =
        '<option value="">Kart seç</option>';

      savedCards
        .filter(card => Number(card.debt || 0) > 0)
        .forEach(card => {
          const option = document.createElement("option");
          option.value = card.id;
          option.textContent =
            `${card.bank} - ${card.name} (${formatTRY(card.debt)})`;

          paymentCardSelect.appendChild(option);
        });

      if (savedCards.some(card => card.id === oldValue)) {
        paymentCardSelect.value = oldValue;
      }

      updateSelectedPaymentCard();
    } catch (error) {
      console.error("Borç ödeme kartları yüklenemedi:", error);
    }
  }

  function updateSelectedPaymentCard() {
    const savedCards = JSON.parse(
      localStorage.getItem(CARD_STORAGE_KEY) || "[]"
    );

    const selectedCard = savedCards.find(
      card => card.id === paymentCardSelect.value
    );

    if (selectedCardDebt) {
      selectedCardDebt.textContent = formatTRY(
        selectedCard ? selectedCard.debt : 0
      );
    }

    window.dispatchEvent(
      new CustomEvent("yf-payment-card-changed")
    );
  }

  function formatTRY(value) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(Number(value) || 0);
  }

  paymentCardSelect.addEventListener(
    "change",
    updateSelectedPaymentCard
  );

  document
    .querySelectorAll('[data-page="debtPaymentPage"]')
    .forEach(button => {
      button.addEventListener("click", () => {
        setTimeout(loadCardsForPayment, 50);
      });
    });

  window.addEventListener("storage", loadCardsForPayment);
  window.addEventListener("yf-refresh-payment-cards", loadCardsForPayment);

  loadCardsForPayment();
});
// =========================================
// YF v2.0.2 — Ana Sayfa ödeme sonrası canlı güncelleme
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const CARD_KEY = "yf_cards_v1";
  const TRANSACTION_KEY = "yf_transactions_v1";

  function loadJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(Number(value) || 0);
  }

  function isCurrentMonth(value) {
    if (!value) return false;

    const date = new Date(
      String(value).includes("T")
        ? value
        : `${value}T12:00:00`
    );

    if (Number.isNaN(date.getTime())) return false;

    const now = new Date();

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  function refreshDashboardFromStorage() {
    const cards = loadJson(CARD_KEY);
    const transactions = loadJson(TRANSACTION_KEY);

    const totalCardDebt = cards.reduce(
      (sum, card) => sum + Number(card.debt || 0),
      0
    );

    const income = transactions
      .filter(item => item.type === "income")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const nonCardExpense = transactions
      .filter(
        item =>
          item.type === "expense" &&
          item.paymentMethod !== "card"
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const monthlyCardPayments = transactions
      .filter(
        item =>
          item.type === "card-payment" &&
          isCurrentMonth(item.createdAt || item.date)
      )
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const cashBalance =
      income - nonCardExpense - monthlyCardPayments;

    const netBalance = cashBalance - totalCardDebt;

    const totalDebtEl = document.getElementById("totalDebt");
    const totalAssetsEl = document.getElementById("totalAssets");
    const monthlyPaymentEl = document.getElementById("monthlyPayment");
    const netBalanceEl = document.getElementById("netBalance");
    const cardCountEl = document.getElementById("cardCount");
    const balanceStatusEl = document.getElementById("balanceStatus");

    if (totalDebtEl) {
      totalDebtEl.textContent = formatMoney(totalCardDebt);
    }

    if (totalAssetsEl) {
      totalAssetsEl.textContent = formatMoney(Math.max(0, cashBalance));
    }

    if (monthlyPaymentEl) {
      monthlyPaymentEl.textContent = formatMoney(monthlyCardPayments);
    }

    if (netBalanceEl) {
      netBalanceEl.textContent = formatMoney(netBalance);
    }

    if (cardCountEl) {
      cardCountEl.textContent = String(cards.length);
    }

    if (balanceStatusEl) {
      balanceStatusEl.textContent =
        netBalance < 0
          ? "Ekside"
          : netBalance > 0
            ? "Pozitif"
            : "Dengeli";
    }
  }

  document
    .querySelectorAll('[data-page="dashboardPage"]')
    .forEach(button => {
      button.addEventListener("click", () => {
        setTimeout(refreshDashboardFromStorage, 50);
      });
    });

  window.addEventListener(
    "yf-refresh-dashboard",
    refreshDashboardFromStorage
  );

  window.addEventListener(
    "storage",
    refreshDashboardFromStorage
  );

  refreshDashboardFromStorage();
});
// =========================================
// YF v2.0.3 — Net Durum hesaplama düzeltmesi
// Bu kod app.js dosyasının EN ALTINA eklenir.
// Kart ödemesi ikinci kez gider sayılmaz.
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const CARD_KEY = "yf_cards_v1";
  const TRANSACTION_KEY = "yf_transactions_v1";

  function loadJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(Number(value) || 0);
  }

  function isCurrentMonth(value) {
    if (!value) return false;

    const date = new Date(
      String(value).includes("T")
        ? value
        : `${value}T12:00:00`
    );

    if (Number.isNaN(date.getTime())) return false;

    const now = new Date();

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  function refreshCorrectDashboard() {
    const cards = loadJson(CARD_KEY);
    const transactions = loadJson(TRANSACTION_KEY);

    const totalCardDebt = cards.reduce(
      (sum, card) => sum + Number(card.debt || 0),
      0
    );

    const income = transactions
      .filter(item => item.type === "income")
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

    const normalExpenses = transactions
      .filter(item => item.type === "expense")
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

    const monthlyCardPayments = transactions
      .filter(
        item =>
          item.type === "card-payment" &&
          isCurrentMonth(item.createdAt || item.date)
      )
      .reduce(
        (sum, item) => sum + Number(item.amount || 0),
        0
      );

    /*
      Doğru mantık:
      Kart ödemesi borcu azaltır.
      Aynı ödeme Net Durumdan tekrar gider olarak düşülmez.
    */
    const net = income - normalExpenses - totalCardDebt;

    const totalDebtEl = document.getElementById("totalDebt");
    const monthlyPaymentEl = document.getElementById("monthlyPayment");
    const netBalanceEl = document.getElementById("netBalance");
    const cardCountEl = document.getElementById("cardCount");
    const balanceStatusEl = document.getElementById("balanceStatus");

    if (totalDebtEl) {
      totalDebtEl.textContent = formatMoney(totalCardDebt);
    }

    if (monthlyPaymentEl) {
      monthlyPaymentEl.textContent = formatMoney(monthlyCardPayments);
    }

    if (netBalanceEl) {
      netBalanceEl.textContent = formatMoney(net);
    }

    if (cardCountEl) {
      cardCountEl.textContent = String(cards.length);
    }

    if (balanceStatusEl) {
      balanceStatusEl.textContent =
        net < 0
          ? "Ekside"
          : net > 0
            ? "Pozitif"
            : "Dengeli";
    }
  }

  document
    .querySelectorAll('[data-page="dashboardPage"]')
    .forEach(button => {
      button.addEventListener("click", () => {
        setTimeout(refreshCorrectDashboard, 100);
      });
    });

  window.addEventListener(
    "yf-refresh-dashboard",
    refreshCorrectDashboard
  );

  window.addEventListener(
    "storage",
    refreshCorrectDashboard
  );

  refreshCorrectDashboard();
});
// =========================================
// YF v2.1 — Akıllı Yaklaşan Ödemeler
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const CARD_KEY = "yf_cards_v1";
  const TRANSACTION_KEY = "yf_transactions_v1";
  const MINIMUM_RATE = 0.20;

  const upcomingContainer = document.getElementById("upcomingPayments");
  if (!upcomingContainer) return;

  installUpcomingPaymentStyles();
  refreshUpcomingPayments();

  document
    .querySelectorAll('[data-page="dashboardPage"]')
    .forEach(button => {
      button.addEventListener("click", () => {
        setTimeout(refreshUpcomingPayments, 100);
      });
    });

  window.addEventListener("storage", refreshUpcomingPayments);
  window.addEventListener("yf-refresh-upcoming-payments", refreshUpcomingPayments);

  function refreshUpcomingPayments() {
    const cards = loadJson(CARD_KEY);
    const transactions = loadJson(TRANSACTION_KEY);

    const paymentCards = cards
      .filter(card => card.dueDate && Number(card.debt || 0) > 0)
      .map(card => ({
        ...card,
        daysLeft: getDaysLeft(card.dueDate),
        minimumInfo: getMinimumInfo(card, transactions)
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);

    upcomingContainer.innerHTML = "";

    if (paymentCards.length === 0) {
      upcomingContainer.innerHTML = `
        <div class="empty-state">
          Henüz yaklaşan kart ödemesi bulunmuyor.
        </div>
      `;
      return;
    }

    paymentCards.slice(0, 6).forEach(card => {
      const status = getStatus(card.daysLeft, card.minimumInfo);
      const item = document.createElement("article");
      item.className = `smart-upcoming-card ${status.className}`;

      item.innerHTML = `
        <div class="smart-upcoming-left">
          <div class="smart-upcoming-icon">
            ${escapeHtml((card.bank || "K").charAt(0))}
          </div>

          <div class="smart-upcoming-info">
            <div class="smart-upcoming-title-row">
              <strong>${escapeHtml(card.bank || "Banka")}</strong>
              <span class="smart-upcoming-badge ${status.className}">
                ${status.label}
              </span>
            </div>

            <span class="smart-upcoming-card-name">
              ${escapeHtml(card.name || "Kart")}
            </span>

            <div class="smart-upcoming-meta">
              <span>
                Son ödeme:
                <strong>${formatDate(card.dueDate)}</strong>
              </span>

              <span>
                Asgari:
                <strong>${formatMoney(card.minimumInfo.minimum)}</strong>
              </span>
            </div>
          </div>
        </div>

        <div class="smart-upcoming-right">
          <strong>${formatMoney(card.debt)}</strong>
          <span>${formatRemaining(card.daysLeft)}</span>
        </div>
      `;

      item.addEventListener("click", () => {
        const debtButton = document.querySelector('[data-page="debtPaymentPage"]');
        debtButton?.click();

        setTimeout(() => {
          const paymentSelect = document.getElementById("debtPaymentCard");
          if (!paymentSelect) return;

          paymentSelect.value = card.id;
          paymentSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }, 180);
      });

      upcomingContainer.appendChild(item);
    });
  }

  function getMinimumInfo(card, transactions) {
    const statementDebt = Math.max(
      0,
      Number(card.statementDebt !== undefined ? card.statementDebt : card.debt || 0)
    );

    const minimum = roundMoney(statementDebt * MINIMUM_RATE);
    const cycle = card.statementCycle || getCycleKey(card.dueDate) || getCurrentCycleKey();

    const paid = roundMoney(
      transactions
        .filter(transaction => {
          if (transaction.type !== "card-payment" || transaction.cardId !== card.id) {
            return false;
          }

          if (transaction.statementCycle) {
            return transaction.statementCycle === cycle;
          }

          return isSameMonth(
            transaction.createdAt || transaction.date,
            card.dueDate
          );
        })
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0)
    );

    const remaining = Math.max(0, minimum - paid);

    return {
      minimum,
      paid,
      remaining,
      completed: remaining <= 0
    };
  }

  function getStatus(daysLeft, minimumInfo) {
    if (minimumInfo.completed) {
      return { className: "paid", label: "Asgari ödendi ✓" };
    }

    if (daysLeft < 0) {
      return { className: "overdue", label: "Gecikmiş" };
    }

    if (daysLeft <= 2) {
      return {
        className: "urgent",
        label: daysLeft === 0 ? "Bugün" : `${daysLeft} gün`
      };
    }

    if (daysLeft <= 7) {
      return { className: "warning", label: `${daysLeft} gün kaldı` };
    }

    return { className: "safe", label: `${daysLeft} gün kaldı` };
  }

  function getDaysLeft(value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(`${value}T00:00:00`);
    due.setHours(0, 0, 0, 0);

    return Math.ceil((due - today) / 86400000);
  }

  function formatRemaining(days) {
    if (days < 0) return `${Math.abs(days)} gün gecikti`;
    if (days === 0) return "Bugün son gün";
    if (days === 1) return "Yarın son gün";
    return `${days} gün kaldı`;
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) return "Belirtilmedi";

    const date = new Date(`${value}T12:00:00`);
    if (Number.isNaN(date.getTime())) return "Belirtilmedi";

    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function loadJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function getCycleKey(value) {
    if (!value) return "";
    const match = String(value).match(/^(\d{4})-(\d{2})/);
    return match ? `${match[1]}-${match[2]}` : "";
  }

  function getCurrentCycleKey() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }

  function isSameMonth(firstValue, secondValue) {
    if (!firstValue || !secondValue) return false;

    const first = new Date(
      String(firstValue).includes("T")
        ? firstValue
        : `${firstValue}T12:00:00`
    );

    const second = new Date(`${secondValue}T12:00:00`);

    return (
      first.getMonth() === second.getMonth() &&
      first.getFullYear() === second.getFullYear()
    );
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function installUpcomingPaymentStyles() {
    if (document.getElementById("smartUpcomingStyles")) return;

    const style = document.createElement("style");
    style.id = "smartUpcomingStyles";

    style.textContent = `
      .smart-upcoming-card {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 14px;
        padding: 15px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,.08);
        background: rgba(255,255,255,.045);
        cursor: pointer;
      }

      .smart-upcoming-card + .smart-upcoming-card {
        margin-top: 11px;
      }

      .smart-upcoming-left {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .smart-upcoming-icon {
        width: 46px;
        height: 46px;
        flex: 0 0 46px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 15px;
        font-weight: 900;
        background: rgba(15,140,255,.12);
        color: #65b8ff;
      }

      .smart-upcoming-info {
        min-width: 0;
      }

      .smart-upcoming-title-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .smart-upcoming-title-row strong {
        font-size: 14px;
      }

      .smart-upcoming-card-name {
        display: block;
        margin-top: 3px;
        color: #91a3b8;
        font-size: 11px;
      }

      .smart-upcoming-meta {
        display: grid;
        gap: 3px;
        margin-top: 8px;
        color: #91a3b8;
        font-size: 10px;
      }

      .smart-upcoming-meta strong {
        color: inherit;
      }

      .smart-upcoming-right {
        flex: 0 0 auto;
        text-align: right;
      }

      .smart-upcoming-right strong {
        display: block;
        font-size: 14px;
      }

      .smart-upcoming-right span {
        display: block;
        margin-top: 5px;
        font-size: 10px;
        color: #91a3b8;
      }

      .smart-upcoming-badge {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        padding: 0 8px;
        border-radius: 999px;
        font-size: 9px;
        font-weight: 850;
      }

      .smart-upcoming-badge.paid {
        color: #47e1aa;
        background: rgba(42,211,155,.12);
        border: 1px solid rgba(42,211,155,.22);
      }

      .smart-upcoming-badge.safe {
        color: #72c2ff;
        background: rgba(15,140,255,.12);
        border: 1px solid rgba(72,171,255,.22);
      }

      .smart-upcoming-badge.warning {
        color: #ffd26f;
        background: rgba(255,190,69,.12);
        border: 1px solid rgba(255,190,69,.22);
      }

      .smart-upcoming-badge.urgent,
      .smart-upcoming-badge.overdue {
        color: #ff7f99;
        background: rgba(255,91,122,.12);
        border: 1px solid rgba(255,91,122,.22);
      }

      .smart-upcoming-card.warning {
        border-color: rgba(255,190,69,.18);
      }

      .smart-upcoming-card.urgent,
      .smart-upcoming-card.overdue {
        border-color: rgba(255,91,122,.22);
      }

      .smart-upcoming-card.paid {
        border-color: rgba(42,211,155,.18);
      }

      body.light-theme .smart-upcoming-card {
        background: rgba(255,255,255,.78);
        border-color: rgba(18,57,90,.08);
      }

      body.light-theme .smart-upcoming-card-name,
      body.light-theme .smart-upcoming-meta,
      body.light-theme .smart-upcoming-right span {
        color: #687b8f;
      }

      @media (max-width: 390px) {
        .smart-upcoming-card {
          align-items: flex-start;
        }

        .smart-upcoming-right {
          max-width: 112px;
        }
      }
    `;

    document.head.appendChild(style);
  }
});

// =========================================
// YF v2.2 — Bugün Yapılacaklar Kartı
// Bu kod app.js dosyasının EN ALTINA eklenir.
// Beğenmezsen yalnızca bu bloğu silebilirsin.
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const CARD_KEY = "yf_cards_v1";
  const TRANSACTION_KEY = "yf_transactions_v1";

  installTodayTasksStyles();
  createTodayTasksCard();
  refreshTodayTasks();

  document
    .querySelectorAll('[data-page="dashboardPage"]')
    .forEach(button => {
      button.addEventListener("click", () => {
        setTimeout(refreshTodayTasks, 100);
      });
    });

  window.addEventListener("storage", refreshTodayTasks);
  window.addEventListener("yf-refresh-dashboard", refreshTodayTasks);

  function createTodayTasksCard() {
    if (document.getElementById("todayTasksCard")) return;

    const dashboard = document.getElementById("dashboardPage");
    const heroCard = dashboard?.querySelector(".hero-card");

    if (!dashboard || !heroCard) return;

    const card = document.createElement("section");
    card.id = "todayTasksCard";
    card.className = "today-tasks-card";

    card.innerHTML = `
      <div class="today-tasks-head">
        <div>
          <span class="today-tasks-label">BUGÜN YAPILACAKLAR</span>
          <h2>Finans planın</h2>
        </div>
        <span class="today-tasks-icon">🔔</span>
      </div>

      <div id="todayTasksContent" class="today-tasks-content">
        <div class="today-tasks-empty">
          Henüz yapılacak ödeme bulunmuyor.
        </div>
      </div>
    `;

    heroCard.insertAdjacentElement("afterend", card);
  }

  function refreshTodayTasks() {
    const content = document.getElementById("todayTasksContent");
    if (!content) return;

    const cards = loadJson(CARD_KEY);
    const transactions = loadJson(TRANSACTION_KEY);

    const activeCards = cards
      .filter(card => card.dueDate && Number(card.debt || 0) > 0)
      .map(card => {
        const daysLeft = getDaysLeft(card.dueDate);
        const statementDebt = Number(
          card.statementDebt !== undefined
            ? card.statementDebt
            : card.debt || 0
        );

        const minimum = roundMoney(statementDebt * 0.20);
        const paid = getPaidForCard(card, transactions);
        const remainingMinimum = roundMoney(
          Math.max(0, minimum - paid)
        );

        return {
          ...card,
          daysLeft,
          minimum,
          paid,
          remainingMinimum
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    const monthlyPayments = transactions
      .filter(
        transaction =>
          transaction.type === "card-payment" &&
          isCurrentMonth(transaction.createdAt || transaction.date)
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );

    content.innerHTML = "";

    if (activeCards.length === 0) {
      content.innerHTML = `
        <div class="today-tasks-empty">
          Bugün için ödeme görevi bulunmuyor.
        </div>
      `;
      return;
    }

    const nearestCard = activeCards[0];
    const taskItems = [];

    if (nearestCard.remainingMinimum > 0) {
      taskItems.push({
        icon: getTaskIcon(nearestCard.daysLeft),
        title: `${nearestCard.bank} asgarisini tamamla`,
        text:
          `${formatRemaining(nearestCard.daysLeft)} · ` +
          `Kalan ${formatMoney(nearestCard.remainingMinimum)}`
      });
    } else {
      taskItems.push({
        icon: "✅",
        title: `${nearestCard.bank} asgarisi tamamlandı`,
        text:
          `${formatRemaining(nearestCard.daysLeft)} · ` +
          `Güncel borç ${formatMoney(nearestCard.debt)}`
      });
    }

    if (activeCards.length > 1) {
      const nextCard = activeCards[1];

      taskItems.push({
        icon: getTaskIcon(nextCard.daysLeft),
        title: `Sıradaki ödeme: ${nextCard.bank}`,
        text:
          `${formatRemaining(nextCard.daysLeft)} · ` +
          `Asgari ${formatMoney(nextCard.minimum)}`
      });
    }

    taskItems.push({
      icon: "💸",
      title: "Bu ay toplam ödenen",
      text: formatMoney(monthlyPayments)
    });

    taskItems.slice(0, 3).forEach(item => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "today-task-row";

      row.innerHTML = `
        <span class="today-task-row-icon">${item.icon}</span>
        <span class="today-task-row-text">
          <strong>${escapeHtml(item.title)}</strong>
          <small>${escapeHtml(item.text)}</small>
        </span>
        <span class="today-task-arrow">›</span>
      `;

      row.addEventListener("click", () => {
        document
          .querySelector('[data-page="debtPaymentPage"]')
          ?.click();

        setTimeout(() => {
          const select = document.getElementById("debtPaymentCard");

          if (!select) return;

          select.value = nearestCard.id;
          select.dispatchEvent(
            new Event("change", { bubbles: true })
          );
        }, 180);
      });

      content.appendChild(row);
    });
  }

  function getPaidForCard(card, transactions) {
    const cycle =
      card.statementCycle ||
      getCycleKey(card.dueDate) ||
      getCurrentCycleKey();

    return roundMoney(
      transactions
        .filter(transaction => {
          if (
            transaction.type !== "card-payment" ||
            transaction.cardId !== card.id
          ) {
            return false;
          }

          if (transaction.statementCycle) {
            return transaction.statementCycle === cycle;
          }

          return isSameMonth(
            transaction.createdAt || transaction.date,
            card.dueDate
          );
        })
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount || 0),
          0
        )
    );
  }

  function getDaysLeft(value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(`${value}T00:00:00`);
    due.setHours(0, 0, 0, 0);

    return Math.ceil((due - today) / 86400000);
  }

  function getTaskIcon(days) {
    if (days < 0) return "🔴";
    if (days <= 2) return "🟠";
    if (days <= 7) return "🟡";
    return "🟢";
  }

  function formatRemaining(days) {
    if (days < 0) return `${Math.abs(days)} gün gecikti`;
    if (days === 0) return "Bugün son gün";
    if (days === 1) return "Yarın son gün";

    return `${days} gün kaldı`;
  }

  function isCurrentMonth(value) {
    if (!value) return false;

    const date = new Date(
      String(value).includes("T")
        ? value
        : `${value}T12:00:00`
    );

    if (Number.isNaN(date.getTime())) return false;

    const now = new Date();

    return (
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  function isSameMonth(firstValue, secondValue) {
    if (!firstValue || !secondValue) return false;

    const first = new Date(
      String(firstValue).includes("T")
        ? firstValue
        : `${firstValue}T12:00:00`
    );

    const second = new Date(`${secondValue}T12:00:00`);

    return (
      first.getMonth() === second.getMonth() &&
      first.getFullYear() === second.getFullYear()
    );
  }

  function getCycleKey(value) {
    if (!value) return "";

    const match = String(value).match(/^(\d{4})-(\d{2})/);
    return match ? `${match[1]}-${match[2]}` : "";
  }

  function getCurrentCycleKey() {
    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
  }

  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(Number(value) || 0);
  }

  function loadJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function installTodayTasksStyles() {
    if (document.getElementById("todayTasksStyles")) return;

    const style = document.createElement("style");
    style.id = "todayTasksStyles";

    style.textContent = `
      .today-tasks-card {
        margin: 18px 0;
        padding: 18px;
        border-radius: 22px;
        border: 1px solid rgba(88, 181, 255, .16);
        background:
          linear-gradient(
            145deg,
            rgba(18, 54, 86, .96),
            rgba(12, 37, 61, .96)
          );
        box-shadow: 0 18px 42px rgba(0,0,0,.18);
      }

      .today-tasks-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 14px;
      }

      .today-tasks-label {
        display: block;
        margin-bottom: 5px;
        color: #62b8ff;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .14em;
      }

      .today-tasks-head h2 {
        margin: 0;
        font-size: 20px;
      }

      .today-tasks-icon {
        width: 38px;
        height: 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 13px;
        background: rgba(15, 140, 255, .12);
      }

      .today-tasks-content {
        display: grid;
        gap: 9px;
      }

      .today-task-row {
        width: 100%;
        min-height: 62px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 11px 12px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 16px;
        color: inherit;
        background: rgba(255,255,255,.035);
        text-align: left;
        font: inherit;
        cursor: pointer;
      }

      .today-task-row:active {
        transform: scale(.985);
      }

      .today-task-row-icon {
        width: 34px;
        height: 34px;
        flex: 0 0 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 11px;
        background: rgba(255,255,255,.05);
      }

      .today-task-row-text {
        min-width: 0;
        flex: 1;
      }

      .today-task-row-text strong,
      .today-task-row-text small {
        display: block;
      }

      .today-task-row-text strong {
        font-size: 13px;
      }

      .today-task-row-text small {
        margin-top: 4px;
        color: #91a3b8;
        font-size: 10.5px;
      }

      .today-task-arrow {
        color: #6aaef0;
        font-size: 23px;
      }

      .today-tasks-empty {
        padding: 17px;
        border: 1px dashed rgba(255,255,255,.08);
        border-radius: 15px;
        color: #91a3b8;
        text-align: center;
        font-size: 12px;
      }

      body.light-theme .today-tasks-card {
        background:
          linear-gradient(
            145deg,
            rgba(255,255,255,.96),
            rgba(239,247,255,.96)
          );
        border-color: rgba(18,57,90,.08);
      }

      body.light-theme .today-task-row {
        background: rgba(255,255,255,.78);
        border-color: rgba(18,57,90,.07);
      }

      body.light-theme .today-task-row-text small,
      body.light-theme .today-tasks-empty {
        color: #687b8f;
      }
    `;

    document.head.appendChild(style);
  }
});
// =========================================
// YF v2.3 — İhtiyaç Kredisi Sistemi
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const CARD_KEY = "yf_cards_v1";
  const TRANSACTION_KEY = "yf_transactions_v1";

  const $ = id => document.getElementById(id);

  const form = $("cardForm");
  const cardModal = $("cardModal");
  const cardId = $("cardId");
  const bankName = $("bankName");

  const creditRadio = $("debtTypeCreditCard");
  const loanRadio = $("debtTypePersonalLoan");
  const creditFields = $("creditCardFields");
  const loanFields = $("personalLoanFields");

  const cardName = $("cardName");
  const cardLimit = $("cardLimit");
  const cardDebt = $("cardDebt");
  const statementDate = $("statementDate");
  const dueDate = $("dueDate");

  const loanName = $("loanName");
  const loanRemainingDebt = $("loanRemainingDebt");
  const loanMonthlyInstallment = $("loanMonthlyInstallment");
  const loanRemainingInstallments = $("loanRemainingInstallments");
  const loanPaymentDay = $("loanPaymentDay");
  const loanNextPaymentDate = $("loanNextPaymentDate");

  if (!form || !creditRadio || !loanRadio) return;

  normalizeDebtTypes();
  installLoanStyles();
  setupDebtTypeSwitch();
  setupLoanSave();
  setupLoanPayment();
  setupLoanRendering();

  setTimeout(() => {
    toggleDebtFields();
    renderMixedDebts();
    refreshLoanAwareSummaries();
    refreshLoanAwareUpcoming();
    refreshLoanAwareTodayTasks();
    populateMixedPaymentList();
  }, 200);

  // -----------------------------
  // VERİLERİ ESKİ SÜRÜMDEN UYARLA
  // -----------------------------
  function normalizeDebtTypes() {
    const debts = loadJson(CARD_KEY);

    const normalized = debts.map(item => ({
      ...item,
      type: item.type || "credit-card",
      id: item.id || createId(),
      debt: Number(item.debt || 0),
      limit: Number(item.limit || 0),
      monthlyInstallment: Number(item.monthlyInstallment || 0),
      remainingInstallments: Number(item.remainingInstallments || 0),
      paymentDay: Number(item.paymentDay || 0)
    }));

    saveJson(CARD_KEY, normalized);
  }

  // -----------------------------
  // FORMDA KART / KREDİ SEÇİMİ
  // -----------------------------
  function setupDebtTypeSwitch() {
    creditRadio.addEventListener("change", toggleDebtFields);
    loanRadio.addEventListener("change", toggleDebtFields);

    $("openCardFormButton")?.addEventListener("click", () => {
      setTimeout(() => {
        if (!cardId?.value) {
          creditRadio.checked = true;
          loanRadio.checked = false;
        }
        toggleDebtFields();
      }, 0);
    });

    $("quickAddCardButton")?.addEventListener("click", () => {
      setTimeout(() => {
        if (!cardId?.value) {
          creditRadio.checked = true;
          loanRadio.checked = false;
        }
        toggleDebtFields();
      }, 0);
    });
  }

  function toggleDebtFields() {
    const isLoan = loanRadio.checked;

    creditFields?.classList.toggle("hidden", isLoan);
    loanFields?.classList.toggle("hidden", !isLoan);

    setRequired(cardName, !isLoan);
    setRequired(cardLimit, !isLoan);
    setRequired(cardDebt, !isLoan);

    setRequired(loanName, isLoan);
    setRequired(loanRemainingDebt, isLoan);
    setRequired(loanMonthlyInstallment, isLoan);
    setRequired(loanRemainingInstallments, isLoan);
    setRequired(loanPaymentDay, isLoan);
    setRequired(loanNextPaymentDate, isLoan);

    const title = $("cardFormTitle");
    if (title && !cardId?.value) {
      title.textContent = isLoan
        ? "Yeni İhtiyaç Kredisi Ekle"
        : "Yeni Kart Ekle";
    }
  }

  function setRequired(element, required) {
    if (!element) return;
    element.required = required;
    element.disabled = false;
  }

  // -----------------------------
  // İHTİYAÇ KREDİSİNİ KAYDET
  // capture=true: eski kart kaydetme kodundan önce çalışır
  // -----------------------------
  function setupLoanSave() {
    form.addEventListener("submit", event => {
      if (!loanRadio.checked) return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const bank = bankName?.value || "";
      const name = loanName?.value.trim() || "";
      const debt = Number(loanRemainingDebt?.value);
      const installment = Number(loanMonthlyInstallment?.value);
      const installments = Number(loanRemainingInstallments?.value);
      const paymentDay = Number(loanPaymentDay?.value);
      const nextDate = loanNextPaymentDate?.value || "";

      if (!bank) {
        alert("Lütfen banka seç.");
        return;
      }

      if (!name) {
        alert("Lütfen kredi adını yaz.");
        return;
      }

      if (!Number.isFinite(debt) || debt <= 0) {
        alert("Kalan borcu doğru gir.");
        return;
      }

      if (!Number.isFinite(installment) || installment <= 0) {
        alert("Aylık taksiti doğru gir.");
        return;
      }

      if (!Number.isInteger(installments) || installments <= 0) {
        alert("Kalan taksit sayısını doğru gir.");
        return;
      }

      if (
        !Number.isInteger(paymentDay) ||
        paymentDay < 1 ||
        paymentDay > 31
      ) {
        alert("Ödeme günü 1 ile 31 arasında olmalı.");
        return;
      }

      if (!nextDate) {
        alert("Sonraki ödeme tarihini seç.");
        return;
      }

      const debts = loadJson(CARD_KEY);
      const old = debts.find(item => item.id === cardId?.value);

      const loan = {
        id: cardId?.value || createId(),
        type: "personal-loan",
        bank,
        name,
        debt: roundMoney(debt),
        originalDebt: Number(old?.originalDebt || debt),
        monthlyInstallment: roundMoney(installment),
        remainingInstallments: installments,
        paymentDay,
        nextPaymentDate: nextDate,
        dueDate: nextDate,

        // Eski ekranların hata vermemesi için:
        limit: 0,
        statementDebt: 0,
        statementDate: "",
        statementCycle: "",

        createdAt: old?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const index = debts.findIndex(item => item.id === loan.id);

      if (index >= 0) {
        debts[index] = loan;
      } else {
        debts.unshift(loan);
      }

      saveJson(CARD_KEY, debts);

      sessionStorage.setItem("yf_open_cards_after_reload", "1");
      window.location.reload();
    }, true);
  }

  // -----------------------------
  // KREDİ TAKSİTİ ÖDEME
  // -----------------------------
  function setupLoanPayment() {
    const paymentForm = $("debtPaymentForm");
    const paymentSelect = $("debtPaymentCard");
    const paymentAmount = $("debtPaymentAmount");

    if (!paymentForm || !paymentSelect || !paymentAmount) return;

    paymentSelect.addEventListener("change", () => {
      setTimeout(updateLoanPaymentPanel, 10);
    });

    paymentForm.addEventListener("submit", event => {
      const debts = loadJson(CARD_KEY);
      const selected = debts.find(
        item => item.id === paymentSelect.value
      );

      if (!selected || selected.type !== "personal-loan") return;

      event.preventDefault();
      event.stopImmediatePropagation();

      const amount = Number(paymentAmount.value);

      if (!Number.isFinite(amount) || amount <= 0) {
        alert("Lütfen geçerli bir ödeme tutarı gir.");
        return;
      }

      if (amount > Number(selected.debt || 0)) {
        alert("Ödeme tutarı kalan kredi borcundan büyük olamaz.");
        return;
      }

      selected.debt = roundMoney(
        Math.max(0, Number(selected.debt || 0) - amount)
      );

      if (selected.remainingInstallments > 0) {
        selected.remainingInstallments -= 1;
      }

      if (selected.debt <= 0) {
        selected.debt = 0;
        selected.remainingInstallments = 0;
      }

      selected.nextPaymentDate =
        selected.debt > 0
          ? addOneMonth(selected.nextPaymentDate)
          : "";

      selected.dueDate = selected.nextPaymentDate;
      selected.updatedAt = new Date().toISOString();

      const transactions = loadJson(TRANSACTION_KEY);
      const now = new Date();

      transactions.unshift({
        id: createId(),
        type: "loan-payment",
        name: "İhtiyaç Kredisi Taksit Ödemesi",
        amount: roundMoney(amount),
        category: "loan-payment",
        date: now.toISOString().split("T")[0],
        paymentMethod: "cash",
        cardId: selected.id,
        cardName: `${selected.bank} - ${selected.name}`,
        debtType: "personal-loan",
        createdAt: now.toISOString()
      });

      saveJson(CARD_KEY, debts);
      saveJson(TRANSACTION_KEY, transactions);

      sessionStorage.setItem("yf_open_payment_after_reload", "1");
      window.location.reload();
    }, true);
  }

  function updateLoanPaymentPanel() {
    const paymentSelect = $("debtPaymentCard");
    const amountInput = $("debtPaymentAmount");
    const summaryTitle = document.querySelector(
      ".debt-payment-summary span"
    );
    const submitButton = $("debtPaymentForm")
      ?.querySelector('button[type="submit"]');

    if (!paymentSelect) return;

    const selected = loadJson(CARD_KEY).find(
      item => item.id === paymentSelect.value
    );

    const smartPanel = $("smartMinimumPanel");

    if (selected?.type === "personal-loan") {
      smartPanel?.classList.add("hidden");

      if (summaryTitle) {
        summaryTitle.textContent = "Seçilen kredinin kalan borcu";
      }

      if (submitButton) {
        submitButton.textContent = "Taksiti Öde";
      }

      if (amountInput) {
        amountInput.value = Math.min(
          Number(selected.monthlyInstallment || 0),
          Number(selected.debt || 0)
        ).toFixed(2);

        amountInput.max = Number(selected.debt || 0);
      }

      const selectedDebt = $("selectedCardDebt");
      if (selectedDebt) {
        selectedDebt.textContent = formatMoney(selected.debt);
      }
    } else {
      smartPanel?.classList.remove("hidden");

      if (summaryTitle) {
        summaryTitle.textContent = "Seçilen kartın güncel borcu";
      }

      if (submitButton) {
        submitButton.textContent = "Borcu Öde";
      }
    }
  }

  function populateMixedPaymentList() {
    const select = $("debtPaymentCard");
    if (!select) return;

    const oldValue = select.value;
    const debts = loadJson(CARD_KEY);

    select.innerHTML = '<option value="">Kart veya kredi seç</option>';

    debts
      .filter(item => Number(item.debt || 0) > 0)
      .forEach(item => {
        const option = document.createElement("option");
        option.value = item.id;

        if (item.type === "personal-loan") {
          option.textContent =
            `🏦 ${item.bank} - ${item.name} (${formatMoney(item.debt)})`;
        } else {
          option.textContent =
            `💳 ${item.bank} - ${item.name} (${formatMoney(item.debt)})`;
        }

        select.appendChild(option);
      });

    if (debts.some(item => item.id === oldValue)) {
      select.value = oldValue;
    }

    updateLoanPaymentPanel();
  }

  document
    .querySelectorAll('[data-page="debtPaymentPage"]')
    .forEach(button => {
      button.addEventListener("click", () => {
        setTimeout(() => {
          populateMixedPaymentList();
          updateLoanPaymentPanel();
        }, 160);
      });
    });

  // -----------------------------
  // KARTLARIM SAYFASINDA İKİ TÜRÜ GÖSTER
  // -----------------------------
  function setupLoanRendering() {
    document
      .querySelectorAll('[data-page="cardsPage"]')
      .forEach(button => {
        button.addEventListener("click", () => {
          setTimeout(() => {
            renderMixedDebts();
            refreshLoanAwareSummaries();
          }, 160);
        });
      });

    window.addEventListener("storage", () => {
      renderMixedDebts();
      refreshLoanAwareSummaries();
    });
  }

  function renderMixedDebts() {
    const list = $("cardsList");
    if (!list) return;

    const debts = loadJson(CARD_KEY);
    const transactions = loadJson(TRANSACTION_KEY);

    list.innerHTML = "";

    if (!debts.length) {
      list.innerHTML =
        '<div class="empty-state">Henüz kart veya kredi eklenmedi.</div>';
      return;
    }

    debts.forEach(item => {
      if (item.type === "personal-loan") {
        list.appendChild(createLoanCard(item));
      } else {
        list.appendChild(createCreditCard(item, transactions));
      }
    });
  }

  function createLoanCard(loan) {
    const element = document.createElement("article");
    element.className = "bank-card loan-bank-card";

    const paid =
      Math.max(
        0,
        Number(loan.originalDebt || loan.debt) -
        Number(loan.debt || 0)
      );

    const progress =
      Number(loan.originalDebt || 0) > 0
        ? Math.min(
            100,
            Math.round(
              (paid / Number(loan.originalDebt)) * 100
            )
          )
        : 0;

    element.innerHTML = `
      <div class="bank-card-header">
        <div>
          <span>${escapeHtml(loan.bank)}</span>
          <h3>${escapeHtml(loan.name)}</h3>
        </div>

        <div class="bank-card-actions">
          <button type="button" data-loan-edit="${loan.id}">
            Düzenle
          </button>
          <button type="button" data-loan-delete="${loan.id}">
            Sil
          </button>
        </div>
      </div>

      <span class="loan-type-badge">🏦 İhtiyaç Kredisi</span>

      <strong class="bank-card-debt">
        ${formatMoney(loan.debt)}
      </strong>

      <div class="loan-installment-box">
        <div>
          <span>Aylık taksit</span>
          <strong>${formatMoney(loan.monthlyInstallment)}</strong>
        </div>

        <div>
          <span>Kalan taksit</span>
          <strong>${Number(loan.remainingInstallments || 0)}</strong>
        </div>
      </div>

      <div class="card-minimum-status-track">
        <div style="width:${progress}%"></div>
      </div>

      <small class="loan-progress-text">
        Toplam ilerleme: %${progress}
      </small>

      <div class="bank-card-dates">
        <div>
          <span>Ödeme günü</span>
          <strong>Her ayın ${Number(loan.paymentDay || 0)}'i</strong>
        </div>

        <div>
          <span>Sonraki ödeme</span>
          <strong>${formatDate(loan.nextPaymentDate)}</strong>
        </div>
      </div>
    `;

    element
      .querySelector("[data-loan-edit]")
      ?.addEventListener("click", () => openLoanForEdit(loan));

    element
      .querySelector("[data-loan-delete]")
      ?.addEventListener("click", () => deleteDebt(loan));

    return element;
  }

  function createCreditCard(card, transactions) {
    const element = document.createElement("article");
    element.className = "bank-card";

    const limit = Number(card.limit || 0);
    const debt = Number(card.debt || 0);
    const available = Math.max(0, limit - debt);
    const usage = limit > 0
      ? Math.min(100, Math.round((debt / limit) * 100))
      : 0;

    const statementDebt = Number(
      card.statementDebt ?? card.debt ?? 0
    );

    const minimum = roundMoney(statementDebt * 0.20);
    const paid = getCardPayments(card, transactions);
    const remaining = Math.max(0, minimum - paid);
    const percent = minimum > 0
      ? Math.min(100, Math.round((paid / minimum) * 100))
      : 100;

    element.innerHTML = `
      <div class="bank-card-header">
        <div>
          <span>${escapeHtml(card.bank)}</span>
          <h3>${escapeHtml(card.name)}</h3>
        </div>

        <div class="bank-card-actions">
          <button type="button" data-card-edit="${card.id}">
            Düzenle
          </button>
          <button type="button" data-card-delete="${card.id}">
            Sil
          </button>
        </div>
      </div>

      <span class="credit-type-badge">💳 Kredi Kartı</span>

      <strong class="bank-card-debt">
        ${formatMoney(debt)}
      </strong>

      <div class="card-minimum-status">
        <div class="card-minimum-status-head">
          <div>
            <span>Otomatik asgari (%20)</span>
            <strong>${formatMoney(minimum)}</strong>
          </div>

          <span class="card-minimum-status-badge ${
            remaining <= 0
              ? "completed"
              : paid > 0
                ? "partial"
                : "waiting"
          }">
            ${
              remaining <= 0
                ? "Asgari ödendi ✓"
                : paid > 0
                  ? `${formatMoney(remaining)} kaldı`
                  : "Asgari bekliyor"
            }
          </span>
        </div>

        <div class="card-minimum-status-track">
          <div style="width:${percent}%"></div>
        </div>

        <small>
          Bu dönem: ${formatMoney(paid)} /
          ${formatMoney(minimum)}
        </small>
      </div>

      <div class="bank-card-details">
        <div>
          <span>Kart Limiti</span>
          <strong>${formatMoney(limit)}</strong>
        </div>

        <div>
          <span>Kalan Limit</span>
          <strong>${formatMoney(available)}</strong>
        </div>

        <div>
          <span>Kullanım</span>
          <strong>%${usage}</strong>
        </div>
      </div>

      <div class="bank-card-dates">
        <div>
          <span>Hesap Kesim</span>
          <strong>${formatDate(card.statementDate)}</strong>
        </div>

        <div>
          <span>Son Ödeme</span>
          <strong>${formatDate(card.dueDate)}</strong>
        </div>
      </div>
    `;

    element
      .querySelector("[data-card-edit]")
      ?.addEventListener("click", () => openCardForEdit(card));

    element
      .querySelector("[data-card-delete]")
      ?.addEventListener("click", () => deleteDebt(card));

    return element;
  }

  function openLoanForEdit(loan) {
    cardId.value = loan.id;
    bankName.value = loan.bank;

    loanRadio.checked = true;
    creditRadio.checked = false;

    loanName.value = loan.name || "";
    loanRemainingDebt.value = loan.debt || "";
    loanMonthlyInstallment.value = loan.monthlyInstallment || "";
    loanRemainingInstallments.value =
      loan.remainingInstallments || "";
    loanPaymentDay.value = loan.paymentDay || "";
    loanNextPaymentDate.value = loan.nextPaymentDate || "";

    $("cardFormTitle").textContent = "İhtiyaç Kredisini Düzenle";

    toggleDebtFields();
    cardModal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function openCardForEdit(card) {
    cardId.value = card.id;
    bankName.value = card.bank;

    creditRadio.checked = true;
    loanRadio.checked = false;

    cardName.value = card.name || "";
    cardLimit.value = card.limit || "";
    cardDebt.value = card.debt || "";
    statementDate.value = card.statementDate || "";
    dueDate.value = card.dueDate || "";

    $("cardFormTitle").textContent = "Kartı Düzenle";

    toggleDebtFields();
    cardModal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function deleteDebt(item) {
    const label =
      item.type === "personal-loan"
        ? "ihtiyaç kredisi"
        : "kart";

    if (!confirm(`${item.bank} ${label} kaydı silinsin mi?`)) {
      return;
    }

    const debts = loadJson(CARD_KEY).filter(
      debt => debt.id !== item.id
    );

    saveJson(CARD_KEY, debts);
    window.location.reload();
  }

  // -----------------------------
  // ÖZETLER
  // -----------------------------
  function refreshLoanAwareSummaries() {
    const debts = loadJson(CARD_KEY);

    const creditCards = debts.filter(
      item => item.type !== "personal-loan"
    );

    const totalCreditDebt = creditCards.reduce(
      (sum, item) => sum + Number(item.debt || 0),
      0
    );

    const totalCreditLimit = creditCards.reduce(
      (sum, item) => sum + Number(item.limit || 0),
      0
    );

    setText("cardsTotalDebt", formatMoney(totalCreditDebt));
    setText("cardsTotalLimit", formatMoney(totalCreditLimit));
    setText(
      "cardsAvailableLimit",
      formatMoney(Math.max(0, totalCreditLimit - totalCreditDebt))
    );

    setText("cardCount", String(creditCards.length));

    const totalAllDebt = debts.reduce(
      (sum, item) => sum + Number(item.debt || 0),
      0
    );

    setText("totalDebt", formatMoney(totalAllDebt));
  }

  // -----------------------------
  // YAKLAŞAN ÖDEMELER
  // -----------------------------
  function refreshLoanAwareUpcoming() {
    const container = $("upcomingPayments");
    if (!container) return;

    const debts = loadJson(CARD_KEY);
    const transactions = loadJson(TRANSACTION_KEY);

    const items = debts
      .filter(item => {
        const paymentDate =
          item.type === "personal-loan"
            ? item.nextPaymentDate
            : item.dueDate;

        return paymentDate && Number(item.debt || 0) > 0;
      })
      .map(item => {
        const paymentDate =
          item.type === "personal-loan"
            ? item.nextPaymentDate
            : item.dueDate;

        return {
          ...item,
          paymentDate,
          daysLeft: getDaysLeft(paymentDate)
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    container.innerHTML = "";

    if (!items.length) {
      container.innerHTML =
        '<div class="empty-state">Henüz yaklaşan ödeme bulunmuyor.</div>';
      return;
    }

    items.slice(0, 6).forEach(item => {
      const element = document.createElement("article");
      element.className = "smart-upcoming-card";

      const isLoan = item.type === "personal-loan";
      const minimum = isLoan
        ? Number(item.monthlyInstallment || 0)
        : roundMoney(
            Number(item.statementDebt ?? item.debt ?? 0) * 0.20
          );

      const paid = isLoan ? 0 : getCardPayments(item, transactions);
      const remaining = isLoan
        ? Math.min(minimum, Number(item.debt || 0))
        : Math.max(0, minimum - paid);

      const status =
        item.daysLeft < 0
          ? "Gecikmiş"
          : item.daysLeft === 0
            ? "Bugün"
            : item.daysLeft === 1
              ? "Yarın"
              : `${item.daysLeft} gün kaldı`;

      element.innerHTML = `
        <div class="smart-upcoming-left">
          <div class="smart-upcoming-icon">
            ${isLoan ? "🏦" : "💳"}
          </div>

          <div class="smart-upcoming-info">
            <div class="smart-upcoming-title-row">
              <strong>${escapeHtml(item.bank)}</strong>
              <span class="smart-upcoming-badge ${
                item.daysLeft <= 2 ? "urgent" :
                item.daysLeft <= 7 ? "warning" : "safe"
              }">
                ${escapeHtml(status)}
              </span>
            </div>

            <span class="smart-upcoming-card-name">
              ${escapeHtml(item.name)}
            </span>

            <div class="smart-upcoming-meta">
              <span>
                ${isLoan ? "Sonraki taksit" : "Son ödeme"}:
                <strong>${formatDate(item.paymentDate)}</strong>
              </span>

              <span>
                ${isLoan ? "Taksit" : "Kalan asgari"}:
                <strong>${formatMoney(remaining)}</strong>
              </span>
            </div>
          </div>
        </div>

        <div class="smart-upcoming-right">
          <strong>${formatMoney(item.debt)}</strong>
          <span>${isLoan ? "Kalan kredi" : "Kart borcu"}</span>
        </div>
      `;

      element.addEventListener("click", () => {
        document
          .querySelector('[data-page="debtPaymentPage"]')
          ?.click();

        setTimeout(() => {
          populateMixedPaymentList();

          const select = $("debtPaymentCard");
          if (!select) return;

          select.value = item.id;
          select.dispatchEvent(
            new Event("change", { bubbles: true })
          );
        }, 220);
      });

      container.appendChild(element);
    });
  }

  // -----------------------------
  // BUGÜN YAPILACAKLAR
  // -----------------------------
  function refreshLoanAwareTodayTasks() {
    const content = $("todayTasksContent");
    if (!content) return;

    const debts = loadJson(CARD_KEY);
    const transactions = loadJson(TRANSACTION_KEY);

    const items = debts
      .filter(item => {
        const date =
          item.type === "personal-loan"
            ? item.nextPaymentDate
            : item.dueDate;

        return date && Number(item.debt || 0) > 0;
      })
      .map(item => {
        const date =
          item.type === "personal-loan"
            ? item.nextPaymentDate
            : item.dueDate;

        const isLoan = item.type === "personal-loan";

        const dueAmount = isLoan
          ? Math.min(
              Number(item.monthlyInstallment || 0),
              Number(item.debt || 0)
            )
          : Math.max(
              0,
              roundMoney(
                Number(item.statementDebt ?? item.debt ?? 0) * 0.20
              ) - getCardPayments(item, transactions)
            );

        return {
          ...item,
          date,
          isLoan,
          daysLeft: getDaysLeft(date),
          dueAmount
        };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);

    content.innerHTML = "";

    if (!items.length) {
      content.innerHTML =
        '<div class="today-tasks-empty">Bugün için ödeme görevi bulunmuyor.</div>';
      return;
    }

    const first = items[0];

    const rows = [
      {
        item: first,
        icon: first.isLoan ? "🏦" : "💳",
        title: first.isLoan
          ? `${first.bank} kredi taksidini öde`
          : `${first.bank} asgarisini tamamla`,
        text:
          `${remainingDaysText(first.daysLeft)} · ` +
          `${formatMoney(first.dueAmount)}`
      }
    ];

    if (items[1]) {
      const second = items[1];

      rows.push({
        item: second,
        icon: second.isLoan ? "🏦" : "💳",
        title: `Sıradaki ödeme: ${second.bank}`,
        text:
          `${remainingDaysText(second.daysLeft)} · ` +
          `${formatMoney(second.dueAmount)}`
      });
    }

    const monthlyPaid = transactions
      .filter(transaction =>
        (
          transaction.type === "card-payment" ||
          transaction.type === "loan-payment"
        ) &&
        isCurrentMonth(transaction.createdAt || transaction.date)
      )
      .reduce(
        (sum, transaction) =>
          sum + Number(transaction.amount || 0),
        0
      );

    rows.push({
      item: first,
      icon: "💸",
      title: "Bu ay toplam ödenen",
      text: formatMoney(monthlyPaid)
    });

    rows.slice(0, 3).forEach(rowData => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "today-task-row";

      row.innerHTML = `
        <span class="today-task-row-icon">${rowData.icon}</span>
        <span class="today-task-row-text">
          <strong>${escapeHtml(rowData.title)}</strong>
          <small>${escapeHtml(rowData.text)}</small>
        </span>
        <span class="today-task-arrow">›</span>
      `;

      row.addEventListener("click", () => {
        document
          .querySelector('[data-page="debtPaymentPage"]')
          ?.click();

        setTimeout(() => {
          populateMixedPaymentList();

          const select = $("debtPaymentCard");
          if (!select) return;

          select.value = rowData.item.id;
          select.dispatchEvent(
            new Event("change", { bubbles: true })
          );
        }, 220);
      });

      content.appendChild(row);
    });
  }

  document
    .querySelectorAll('[data-page="dashboardPage"]')
    .forEach(button => {
      button.addEventListener("click", () => {
        setTimeout(() => {
          refreshLoanAwareSummaries();
          refreshLoanAwareUpcoming();
          refreshLoanAwareTodayTasks();
        }, 220);
      });
    });

  // -----------------------------
  // SAYFAYI YENİLEDİKTEN SONRA
  // DOĞRU SAYFAYI AÇ
  // -----------------------------
  if (sessionStorage.getItem("yf_open_cards_after_reload") === "1") {
    sessionStorage.removeItem("yf_open_cards_after_reload");

    setTimeout(() => {
      document
        .querySelector('[data-page="cardsPage"]')
        ?.click();
    }, 250);
  }

  if (sessionStorage.getItem("yf_open_payment_after_reload") === "1") {
    sessionStorage.removeItem("yf_open_payment_after_reload");

    setTimeout(() => {
      document
        .querySelector('[data-page="debtPaymentPage"]')
        ?.click();
    }, 250);
  }

  // -----------------------------
  // YARDIMCI FONKSİYONLAR
  // -----------------------------
  function getCardPayments(card, transactions) {
    const cycle =
      card.statementCycle ||
      cycleKey(card.dueDate);

    return roundMoney(
      transactions
        .filter(transaction => {
          if (
            transaction.type !== "card-payment" ||
            transaction.cardId !== card.id
          ) {
            return false;
          }

          if (transaction.statementCycle) {
            return transaction.statementCycle === cycle;
          }

          return isCurrentMonth(
            transaction.createdAt || transaction.date
          );
        })
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount || 0),
          0
        )
    );
  }

  function addOneMonth(value) {
    if (!value) return "";

    const date = new Date(`${value}T12:00:00`);
    const originalDay = date.getDate();

    date.setDate(1);
    date.setMonth(date.getMonth() + 1);

    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();

    date.setDate(Math.min(originalDay, lastDay));

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function getDaysLeft(value) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = new Date(`${value}T00:00:00`);
    date.setHours(0, 0, 0, 0);

    return Math.ceil((date - today) / 86400000);
  }

  function remainingDaysText(days) {
    if (days < 0) return `${Math.abs(days)} gün gecikti`;
    if (days === 0) return "Bugün son gün";
    if (days === 1) return "Yarın son gün";
    return `${days} gün kaldı`;
  }

  function cycleKey(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})/);

    if (match) return `${match[1]}-${match[2]}`;

    const now = new Date();

    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
  }

  function isCurrentMonth(value) {
    if (!value) return false;

    const date = new Date(
      String(value).includes("T")
        ? value
        : `${value}T12:00:00`
    );

    const now = new Date();

    return (
      !Number.isNaN(date.getTime()) &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()
    );
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) return "Tamamlandı";

    const date = new Date(`${value}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
      return "Belirtilmedi";
    }

    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function roundMoney(value) {
    return Math.round(
      (Number(value) + Number.EPSILON) * 100
    ) / 100;
  }

  function createId() {
    if (window.crypto?.randomUUID) {
      return crypto.randomUUID();
    }

    return String(Date.now() + Math.random());
  }

  function loadJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function setText(id, value) {
    const element = $(id);
    if (element) element.textContent = value;
  }

  function installLoanStyles() {
    if ($("yfLoanStyles")) return;

    const style = document.createElement("style");
    style.id = "yfLoanStyles";

    style.textContent = `
      .loan-bank-card {
        border-color: rgba(255, 193, 74, .24);
        background:
          radial-gradient(
            circle at 90% 90%,
            rgba(255, 188, 58, .13),
            transparent 35%
          ),
          linear-gradient(
            145deg,
            rgba(29, 64, 91, .98),
            rgba(13, 38, 60, .98)
          );
      }

      .loan-type-badge,
      .credit-type-badge {
        display: inline-flex;
        align-items: center;
        min-height: 27px;
        margin: 8px 0 2px;
        padding: 0 10px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 850;
      }

      .loan-type-badge {
        color: #ffd47b;
        background: rgba(255, 190, 69, .11);
        border: 1px solid rgba(255, 190, 69, .20);
      }

      .credit-type-badge {
        color: #75c3ff;
        background: rgba(15, 140, 255, .10);
        border: 1px solid rgba(76, 174, 255, .18);
      }

      .loan-installment-box {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin: 14px 0;
      }

      .loan-installment-box > div {
        padding: 13px;
        border-radius: 15px;
        background: rgba(255,255,255,.04);
        border: 1px solid rgba(255,255,255,.06);
      }

      .loan-installment-box span,
      .loan-installment-box strong {
        display: block;
      }

      .loan-installment-box span {
        margin-bottom: 6px;
        color: #8fa2ba;
        font-size: 10px;
      }

      .loan-installment-box strong {
        color: #fff;
        font-size: 14px;
      }

      .loan-progress-text {
        display: block;
        margin-top: 8px;
        color: #8fa2ba;
        font-size: 10px;
      }

      body.light-theme .loan-bank-card {
        background:
          linear-gradient(
            145deg,
            rgba(255,255,255,.98),
            rgba(247,242,225,.98)
          );
      }

      body.light-theme .loan-installment-box > div {
        background: rgba(20,73,112,.04);
        border-color: rgba(20,73,112,.08);
      }

      body.light-theme .loan-installment-box strong {
        color: #102033;
      }

      @media(max-width:370px) {
        .loan-installment-box {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }
});
// =========================================
// YF v2.3.1 — Kalan Kredi Borcu Özeti
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const CARD_KEY = "yf_cards_v1";

  createLoanDebtSummaryCard();
  refreshDebtSummaryCards();

  document
    .querySelectorAll('[data-page="cardsPage"]')
    .forEach(button => {
      button.addEventListener("click", () => {
        setTimeout(refreshDebtSummaryCards, 150);
      });
    });

  window.addEventListener("storage", refreshDebtSummaryCards);
  window.addEventListener(
    "yf-refresh-loan-summary",
    refreshDebtSummaryCards
  );

  function createLoanDebtSummaryCard() {
    if (document.getElementById("loanRemainingDebtSummary")) return;

    const cardsPage = document.getElementById("cardsPage");
    const summaryGrid = cardsPage?.querySelector(".summary-grid");
    const totalCardDebtCard =
      document.getElementById("cardsTotalDebt")?.closest(".summary-card");

    if (!summaryGrid) return;

    const article = document.createElement("article");
    article.className = "summary-card";
    article.innerHTML = `
      <span>Kalan Kredi Borcu</span>
      <strong id="loanRemainingDebtSummary">₺0,00</strong>
    `;

    if (totalCardDebtCard) {
      totalCardDebtCard.insertAdjacentElement("afterend", article);
    } else {
      summaryGrid.prepend(article);
    }
  }

  function refreshDebtSummaryCards() {
    const debts = loadJson(CARD_KEY);

    const creditCards = debts.filter(
      item => item.type !== "personal-loan"
    );

    const personalLoans = debts.filter(
      item => item.type === "personal-loan"
    );

    const totalCardDebt = creditCards.reduce(
      (sum, item) => sum + Number(item.debt || 0),
      0
    );

    const totalLoanDebt = personalLoans.reduce(
      (sum, item) => sum + Number(item.debt || 0),
      0
    );

    const totalCardLimit = creditCards.reduce(
      (sum, item) => sum + Number(item.limit || 0),
      0
    );

    const availableLimit = Math.max(
      0,
      totalCardLimit - totalCardDebt
    );

    setText("cardsTotalDebt", formatMoney(totalCardDebt));
    setText("loanRemainingDebtSummary", formatMoney(totalLoanDebt));
    setText("cardsTotalLimit", formatMoney(totalCardLimit));
    setText("cardsAvailableLimit", formatMoney(availableLimit));
  }

  function loadJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(Number(value) || 0);
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }
});
// =========================================
// YF v2.3.2 — Silinen Kredi Taksitini Geri Alma
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const DEBT_KEY = "yf_cards_v1";
  const TRANSACTION_KEY = "yf_transactions_v1";
  const REPAIR_KEY = "yf_loan_repair_v232";

  repairPreviouslyDeletedLoanPayments();
  installLoanPaymentDeleteFix();

  function installLoanPaymentDeleteFix() {
    const transactionsList = document.getElementById("transactionsList");
    if (!transactionsList) return;

    transactionsList.addEventListener(
      "click",
      event => {
        const deleteButton = event.target.closest("[data-del]");
        if (!deleteButton) return;

        const transactionId = deleteButton.dataset.del;
        const transactions = loadJson(TRANSACTION_KEY);
        const transaction = transactions.find(
          item => item.id === transactionId
        );

        if (!transaction || transaction.type !== "loan-payment") {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const approved = confirm(
          "Bu kredi taksiti silinsin ve kredi bilgileri eski haline getirilsin mi?"
        );

        if (!approved) return;

        const debts = loadJson(DEBT_KEY);
        const loan = debts.find(
          item =>
            item.id === transaction.cardId &&
            item.type === "personal-loan"
        );

        if (!loan) {
          alert("İhtiyaç kredisi kaydı bulunamadı.");
          return;
        }

        const amount = Number(transaction.amount || 0);

        loan.debt = roundMoney(
          Number(loan.debt || 0) + amount
        );

        loan.remainingInstallments =
          Number(loan.remainingInstallments || 0) + 1;

        loan.nextPaymentDate = subtractOneMonth(
          loan.nextPaymentDate || loan.dueDate
        );

        loan.dueDate = loan.nextPaymentDate;
        loan.updatedAt = new Date().toISOString();

        const updatedTransactions = transactions.filter(
          item => item.id !== transactionId
        );

        saveJson(DEBT_KEY, debts);
        saveJson(TRANSACTION_KEY, updatedTransactions);

        sessionStorage.setItem(
          "yf_open_transactions_after_loan_delete",
          "1"
        );

        window.location.reload();
      },
      true
    );
  }

  /*
    Önceden silinmiş kredi ödeme işlemlerini onarır.
    Kredi borcunu, kayıtlı kredi ödeme geçmişine göre yeniden kurar.
  */
  function repairPreviouslyDeletedLoanPayments() {
    if (localStorage.getItem(REPAIR_KEY) === "done") return;

    const debts = loadJson(DEBT_KEY);
    const transactions = loadJson(TRANSACTION_KEY);

    let changed = false;

    debts.forEach(loan => {
      if (loan.type !== "personal-loan") return;
      if (!Number(loan.originalDebt || 0)) return;

      const totalRecordedPayments = transactions
        .filter(
          transaction =>
            transaction.type === "loan-payment" &&
            transaction.cardId === loan.id
        )
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount || 0),
          0
        );

      const expectedDebt = roundMoney(
        Math.max(
          0,
          Number(loan.originalDebt || 0) -
          totalRecordedPayments
        )
      );

      const currentDebt = roundMoney(
        Number(loan.debt || 0)
      );

      if (expectedDebt > currentDebt + 0.01) {
        const restoredAmount = roundMoney(
          expectedDebt - currentDebt
        );

        const installment = Number(
          loan.monthlyInstallment || 0
        );

        const restoredInstallmentCount =
          installment > 0
            ? Math.max(
                1,
                Math.round(restoredAmount / installment)
              )
            : 1;

        loan.debt = expectedDebt;

        loan.remainingInstallments =
          installment > 0
            ? Math.ceil(expectedDebt / installment)
            : Number(loan.remainingInstallments || 0) +
              restoredInstallmentCount;

        for (
          let i = 0;
          i < restoredInstallmentCount;
          i++
        ) {
          loan.nextPaymentDate = subtractOneMonth(
            loan.nextPaymentDate || loan.dueDate
          );
        }

        loan.dueDate = loan.nextPaymentDate;
        loan.updatedAt = new Date().toISOString();

        changed = true;
      }
    });

    if (changed) {
      saveJson(DEBT_KEY, debts);
    }

    localStorage.setItem(REPAIR_KEY, "done");
  }

  if (
    sessionStorage.getItem(
      "yf_open_transactions_after_loan_delete"
    ) === "1"
  ) {
    sessionStorage.removeItem(
      "yf_open_transactions_after_loan_delete"
    );

    setTimeout(() => {
      document
        .querySelector('[data-page="transactionsPage"]')
        ?.click();
    }, 250);
  }

  function subtractOneMonth(value) {
    if (!value) return "";

    const date = new Date(`${value}T12:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    const originalDay = date.getDate();

    date.setDate(1);
    date.setMonth(date.getMonth() - 1);

    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();

    date.setDate(
      Math.min(originalDay, lastDay)
    );

    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function roundMoney(value) {
    return Math.round(
      (Number(value) + Number.EPSILON) * 100
    ) / 100;
  }

  function loadJson(key) {
    try {
      return JSON.parse(
        localStorage.getItem(key) || "[]"
      );
    } catch {
      return [];
    }
  }

  function saveJson(key, value) {
    localStorage.setItem(
      key,
      JSON.stringify(value)
    );
  }
});


