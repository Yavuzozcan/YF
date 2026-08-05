// YF v4.0 — Temizlenmiş ve çakışmaları giderilmiş tek dosya sürümü
// Eski localStorage anahtarları ve mevcut özellikler korunmuştur.
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
  function fillTxCards(){if(!txCard)return;txCard.innerHTML='<option value="">Kart seç</option>';cards.filter(c=>c.type!=="personal-loan").forEach(c=>{const o=document.createElement("option");o.value=c.id;o.textContent=`${c.bank} - ${c.name}`;txCard.appendChild(o)})}
  function toggleTxCard(){const show=txType?.value==="expense"&&txMethod?.value==="card";txCardField?.classList.toggle("hidden",!show);if(!show&&txCard)txCard.value=""}
  function openTx(){if(!txModal||!txForm)return;txForm.reset();fillTxCards();if(txDate)txDate.value=new Date().toISOString().split("T")[0];toggleTxCard();txModal.classList.remove("hidden");document.body.style.overflow="hidden"}
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
  function deleteTx(id){if(!confirm("Bu işlem silinsin mi?"))return;const t=txs.find(x=>x.id===id);if(!t)return;const c=t.cardId?cards.find(x=>x.id===t.cardId):null;if(c){if(t.type==="expense"&&Number(t.cardDebtDelta||0)>0){c.debt=round(Math.max(0,Number(c.debt||0)-Number(t.cardDebtDelta||0)))}else if(t.type==="card-payment"){c.debt=round(Number(c.debt||0)+Number(t.amount||0))}else if(t.type==="loan-payment"&&c.type==="personal-loan"){c.debt=round(Number(c.debt||0)+Number(t.amount||0));c.remainingInstallments=Number(c.remainingInstallments||0)+1;c.nextPaymentDate=subtractOneMonth(c.nextPaymentDate||c.dueDate);c.dueDate=c.nextPaymentDate}save(CK,cards)}txs=txs.filter(x=>x.id!==id);save(TK,txs);renderAll()}
  function subtractOneMonth(v){if(!v)return"";const d=new Date(`${v}T12:00:00`);if(Number.isNaN(d.getTime()))return v;const day=d.getDate();d.setDate(1);d.setMonth(d.getMonth()-1);const last=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();d.setDate(Math.min(day,last));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`}
  function renderCards(){const list=$("cardsList");if(!list)return;list.innerHTML="";if(!cards.length){list.innerHTML='<div class="empty-state">Henüz kart eklenmedi.</div>';return}cards.forEach(c=>{const i=minimumInfo(c),available=Math.max(0,c.limit-c.debt),usage=c.limit?Math.min(100,Math.round(c.debt/c.limit*100)):0,el=document.createElement("article");el.className=`bank-card ${bankClass(c.bank)}`;el.innerHTML=`<div class="bank-card-header"><div><span>${esc(c.bank)}</span><h3>${esc(c.name)}</h3></div><div class="bank-card-actions"><button data-edit="${c.id}">Düzenle</button><button data-delete="${c.id}">Sil</button></div></div><strong class="bank-card-debt">${money(c.debt)}</strong><div class="card-minimum-status"><div class="card-minimum-status-head"><div><span>Otomatik asgari (%20)</span><strong>${money(i.minimum)}</strong></div><span class="card-minimum-status-badge ${i.remaining<=0?"completed":i.paid>0?"partial":"waiting"}">${i.remaining<=0?"Asgari ödendi ✓":i.paid>0?`${money(i.remaining)} kaldı`:"Asgari bekliyor"}</span></div><div class="card-minimum-status-track"><div style="width:${i.pct}%"></div></div><small>Bu dönem: ${money(i.paid)} / ${money(i.minimum)}</small></div><div class="bank-card-details"><div><span>Kart Limiti</span><strong>${money(c.limit)}</strong></div><div><span>Kalan Limit</span><strong>${money(available)}</strong></div><div><span>Kullanım</span><strong>%${usage}</strong></div></div><div class="bank-card-dates"><div><span>Hesap Kesim</span><strong>${dateText(c.statementDate)}</strong></div><div><span>Son Ödeme</span><strong>${dateText(c.dueDate)}</strong></div></div>`;
    el.querySelector("[data-edit]").onclick=()=>openCard(c);el.querySelector("[data-delete]").onclick=()=>{if(confirm(`${c.bank} kartı silinsin mi?`)){cards=cards.filter(x=>x.id!==c.id);save(CK,cards);renderAll()}};list.appendChild(el)})}
  function renderTx(){const list=$("transactionsList");if(!list)return;list.innerHTML="";if(!txs.length){list.innerHTML='<div class="empty-state">Henüz işlem eklenmedi.</div>';return}txs.forEach(t=>{const income=t.type==="income",c=cards.find(x=>x.id===t.cardId),el=document.createElement("article"),label=t.type==="card-payment"?(t.paymentKind==="minimum"?"Asgari Ödeme":"Kart Borcu Ödemesi"):t.type==="loan-payment"?"İhtiyaç Kredisi Taksiti":(t.category||"İşlem");el.className="transaction-item";el.innerHTML=`<div><h3>${esc(t.name||label)}</h3><small>${esc(label)}${c?` · ${esc(c.bank)} - ${esc(c.name)}`:t.cardName?` · ${esc(t.cardName)}`:""} · ${dateText(t.date||t.createdAt)}</small></div><div><strong class="${income?"transaction-income":"transaction-expense"}">${income?"+":"-"}${money(t.amount)}</strong><button data-del="${t.id}">Sil</button></div>`;el.querySelector("[data-del]").onclick=()=>deleteTx(t.id);list.appendChild(el)})}
  function renderDashboard(){const debt=cards.reduce((s,c)=>s+c.debt,0),limit=cards.reduce((s,c)=>s+c.limit,0),income=txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0),expense=txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0),cashExpense=txs.filter(t=>t.type==="expense"&&t.paymentMethod!=="card").reduce((s,t)=>s+t.amount,0),payments=txs.filter(t=>(t.type==="card-payment"||t.type==="loan-payment")&&currentMonth(t.createdAt||t.date)).reduce((s,t)=>s+t.amount,0),cash=income-cashExpense-payments,net=cash-debt;
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
    const transactions = loadJson(TRANSACTION_KEY);
    const debts = loadJson(CARD_KEY).sort((a,b) => {
      const score = item => {
        if (Number(item.debt || 0) <= 0) return 9e15;
        const dateValue = item.type === "personal-loan" ? (item.nextPaymentDate || item.dueDate) : item.dueDate;
        const date = dateValue ? new Date(`${dateValue}T00:00:00`).getTime() : 8e15;
        if (item.type !== "personal-loan") {
          const statementDebt = Number(item.statementDebt ?? item.debt ?? 0);
          const minimum = roundMoney(statementDebt * 0.20);
          const paid = getCardPayments(item, transactions);
          if (minimum > 0 && paid >= minimum) return 7e15 + date;
        }
        return date;
      };
      return score(a) - score(b);
    });
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
// =========================================
// YF v2.3.3 — Yenilemede Açık Sayfayı Hatırla
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================
document.addEventListener("DOMContentLoaded", () => {
  const PAGE_KEY = "yf_last_open_page_v1";
  function savePage(pageId) {
    if (!pageId) return;
    localStorage.setItem(PAGE_KEY, pageId);
  }
  function openSavedPage() {
    const savedPage = localStorage.getItem(PAGE_KEY);
    if (!savedPage || savedPage === "dashboardPage") return;
    const navigationButton = document.querySelector(
      `[data-page="${savedPage}"]`
    );
    if (navigationButton) {
      navigationButton.click();
      return;
    }
    const page = document.getElementById(savedPage);
    if (page) {
      document
        .querySelectorAll(".page")
        .forEach(item => {
          item.classList.toggle(
            "active",
            item.id === savedPage
          );
        });
      document
        .querySelectorAll(".bottom-navigation .nav-item")
        .forEach(item => {
          item.classList.toggle(
            "active",
            item.dataset.page === savedPage
          );
        });
      window.scrollTo({ top: 0 });
    }
  }
  document.addEventListener("click", event => {
    const pageButton = event.target.closest("[data-page]");
    if (pageButton?.dataset.page) {
      savePage(pageButton.dataset.page);
    }
  });
  document
    .getElementById("openReportsButton")
    ?.addEventListener("click", () => {
      savePage("reportsPage");
    });
  document
    .getElementById("openSettingsButton")
    ?.addEventListener("click", () => {
      savePage("settingsPage");
    });
  document
    .getElementById("reportsBackButton")
    ?.addEventListener("click", () => {
      savePage("dashboardPage");
    });
  document
    .getElementById("settingsBackButton")
    ?.addEventListener("click", () => {
      savePage("dashboardPage");
    });
  setTimeout(openSavedPage, 300);
});
// =========================================
// YF v2.3.4 — Borç Seçim Penceresi
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================
document.addEventListener("DOMContentLoaded", () => {
  const CARD_KEY = "yf_cards_v1";
  const nativeSelect = document.getElementById("debtPaymentCard");
  if (!nativeSelect || document.getElementById("debtPickerButton")) return;
  installDebtPickerStyles();
  createDebtPicker();
  refreshDebtPickerButton();
  nativeSelect.addEventListener("change", refreshDebtPickerButton);
  document
    .querySelectorAll('[data-page="debtPaymentPage"]')
    .forEach(button => {
      button.addEventListener("click", () => {
        setTimeout(refreshDebtPickerButton, 180);
      });
    });
  function createDebtPicker() {
    const button = document.createElement("button");
    button.id = "debtPickerButton";
    button.type = "button";
    button.className = "debt-picker-button";
    button.innerHTML = `
      <span id="debtPickerButtonText">Kart veya kredi seç</span>
      <span class="debt-picker-arrow">›</span>
    `;
    nativeSelect.classList.add("hidden");
    nativeSelect.insertAdjacentElement("afterend", button);
    const layer = document.createElement("div");
    layer.id = "debtPickerLayer";
    layer.className = "debt-picker-layer hidden";
    layer.innerHTML = `
      <div class="debt-picker-backdrop"></div>
      <section class="debt-picker-sheet">
        <div class="debt-picker-header">
          <div>
            <span>BORÇ SEÇİMİ</span>
            <h2>Kart veya kredi seç</h2>
          </div>
          <button
            id="closeDebtPicker"
            class="debt-picker-close"
            type="button"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>
        <input
          id="debtPickerSearch"
          class="debt-picker-search"
          type="search"
          placeholder="Banka veya borç ara"
          autocomplete="off"
        >
        <div id="debtPickerList" class="debt-picker-list"></div>
      </section>
    `;
    document.body.appendChild(layer);
    button.addEventListener("click", openPicker);
    layer
      .querySelector(".debt-picker-backdrop")
      ?.addEventListener("click", closePicker);
    document
      .getElementById("closeDebtPicker")
      ?.addEventListener("click", closePicker);
    document
      .getElementById("debtPickerSearch")
      ?.addEventListener("input", renderPickerList);
  }
  function openPicker() {
    const layer = document.getElementById("debtPickerLayer");
    const search = document.getElementById("debtPickerSearch");
    if (!layer) return;
    renderPickerList();
    layer.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    if (search) {
      search.value = "";
      setTimeout(() => search.focus(), 120);
    }
  }
  function closePicker() {
    document
      .getElementById("debtPickerLayer")
      ?.classList.add("hidden");
    document.body.style.overflow = "";
  }
  function renderPickerList() {
    const list = document.getElementById("debtPickerList");
    const searchValue = String(
      document.getElementById("debtPickerSearch")?.value || ""
    )
      .toLocaleLowerCase("tr-TR")
      .trim();
    if (!list) return;
    const debts = loadJson(CARD_KEY)
      .filter(item => Number(item.debt || 0) > 0)
      .filter(item => {
        if (!searchValue) return true;
        const haystack = `${item.bank || ""} ${item.name || ""}`
          .toLocaleLowerCase("tr-TR");
        return haystack.includes(searchValue);
      });
    const loans = debts.filter(
      item => item.type === "personal-loan"
    );
    const cards = debts.filter(
      item => item.type !== "personal-loan"
    );
    list.innerHTML = "";
    if (!debts.length) {
      list.innerHTML = `
        <div class="debt-picker-empty">
          Eşleşen kart veya kredi bulunamadı.
        </div>
      `;
      return;
    }
    appendGroup("🏦 İhtiyaç Kredileri", loans);
    appendGroup("💳 Kredi Kartları", cards);
    function appendGroup(title, items) {
      if (!items.length) return;
      const group = document.createElement("section");
      group.className = "debt-picker-group";
      const heading = document.createElement("h3");
      heading.textContent = title;
      group.appendChild(heading);
      items.forEach(item => {
        const row = document.createElement("button");
        row.type = "button";
        row.className = "debt-picker-row";
        const isLoan = item.type === "personal-loan";
        row.innerHTML = `
          <span class="debt-picker-row-icon">
            ${isLoan ? "🏦" : "💳"}
          </span>
          <span class="debt-picker-row-info">
            <strong>${escapeHtml(item.bank || "Banka")}</strong>
            <small>${escapeHtml(item.name || "")}</small>
          </span>
          <span class="debt-picker-row-amount">
            <strong>${formatMoney(item.debt)}</strong>
            <small>${isLoan ? "Kalan kredi" : "Kart borcu"}</small>
          </span>
        `;
        row.addEventListener("click", () => {
          nativeSelect.value = item.id;
          nativeSelect.dispatchEvent(
            new Event("change", { bubbles: true })
          );
          refreshDebtPickerButton();
          closePicker();
        });
        group.appendChild(row);
      });
      list.appendChild(group);
    }
  }
  function refreshDebtPickerButton() {
    const text = document.getElementById("debtPickerButtonText");
    if (!text) return;
    const selected = loadJson(CARD_KEY).find(
      item => item.id === nativeSelect.value
    );
    if (!selected) {
      text.textContent = "Kart veya kredi seç";
      return;
    }
    text.textContent =
      `${selected.type === "personal-loan" ? "🏦" : "💳"} ` +
      `${selected.bank} - ${selected.name}`;
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
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function installDebtPickerStyles() {
    if (document.getElementById("debtPickerStyles")) return;
    const style = document.createElement("style");
    style.id = "debtPickerStyles";
    style.textContent = `
      .debt-picker-button {
        width: 100%;
        min-height: 50px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 0 15px;
        border: 1px solid rgba(255,255,255,.12);
        border-radius: 14px;
        color: inherit;
        background: rgba(255,255,255,.06);
        font: inherit;
        font-weight: 750;
        text-align: left;
      }
      .debt-picker-arrow {
        color: #73bbff;
        font-size: 25px;
        transform: rotate(90deg);
      }
      .debt-picker-layer {
        position: fixed;
        z-index: 3000;
        inset: 0;
      }
      .debt-picker-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.72);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
      }
      .debt-picker-sheet {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        max-height: 82vh;
        display: flex;
        flex-direction: column;
        padding:
          18px
          18px
          calc(22px + env(safe-area-inset-bottom));
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 26px 26px 0 0;
        background:
          linear-gradient(
            180deg,
            rgba(18,43,69,.99),
            rgba(8,23,38,.99)
          );
        box-shadow: 0 -24px 60px rgba(0,0,0,.45);
      }
      .debt-picker-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 14px;
      }
      .debt-picker-header span {
        display: block;
        margin-bottom: 4px;
        color: #67baff;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .14em;
      }
      .debt-picker-header h2 {
        margin: 0;
        font-size: 22px;
      }
      .debt-picker-close {
        width: 40px;
        height: 40px;
        flex: 0 0 40px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 13px;
        color: inherit;
        background: rgba(255,255,255,.05);
        font-size: 25px;
      }
      .debt-picker-search {
        width: 100%;
        min-height: 48px;
        margin-bottom: 14px;
        padding: 0 14px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 14px;
        color: inherit;
        background: rgba(255,255,255,.055);
        font: inherit;
        box-sizing: border-box;
      }
      .debt-picker-list {
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
      .debt-picker-group + .debt-picker-group {
        margin-top: 18px;
      }
      .debt-picker-group h3 {
        margin: 0 0 9px;
        color: #8fa2ba;
        font-size: 11px;
        letter-spacing: .06em;
      }
      .debt-picker-row {
        width: 100%;
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 13px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 16px;
        color: inherit;
        background: rgba(255,255,255,.035);
        text-align: left;
        font: inherit;
      }
      .debt-picker-row + .debt-picker-row {
        margin-top: 8px;
      }
      .debt-picker-row-icon {
        width: 38px;
        height: 38px;
        flex: 0 0 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: rgba(15,140,255,.10);
      }
      .debt-picker-row-info {
        min-width: 0;
        flex: 1;
      }
      .debt-picker-row-info strong,
      .debt-picker-row-info small,
      .debt-picker-row-amount strong,
      .debt-picker-row-amount small {
        display: block;
      }
      .debt-picker-row-info strong {
        overflow: hidden;
        font-size: 13px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .debt-picker-row-info small {
        margin-top: 4px;
        color: #8fa2ba;
        font-size: 10px;
      }
      .debt-picker-row-amount {
        flex: 0 0 auto;
        text-align: right;
      }
      .debt-picker-row-amount strong {
        font-size: 12px;
      }
      .debt-picker-row-amount small {
        margin-top: 4px;
        color: #8fa2ba;
        font-size: 9px;
      }
      .debt-picker-empty {
        padding: 22px;
        border: 1px dashed rgba(255,255,255,.09);
        border-radius: 16px;
        color: #8fa2ba;
        text-align: center;
        font-size: 12px;
      }
      body.light-theme .debt-picker-sheet {
        color: #102033;
        background:
          linear-gradient(
            180deg,
            rgba(250,253,255,.99),
            rgba(235,244,251,.99)
          );
      }
      body.light-theme .debt-picker-row,
      body.light-theme .debt-picker-search,
      body.light-theme .debt-picker-button {
        background: rgba(255,255,255,.82);
        border-color: rgba(20,73,112,.10);
      }
    `;
    document.head.appendChild(style);
  }
});
// YF v2.4 — Hatırlatmalar Ekranı
document.addEventListener("DOMContentLoaded", () => {
  const DK="yf_cards_v1", TK="yf_transactions_v1";
  const $=id=>document.getElementById(id);
  const load=k=>{try{return JSON.parse(localStorage.getItem(k)||"[]")}catch{return[]}};
  const money=v=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(Number(v)||0);
  const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  const round=v=>Math.round((Number(v)+Number.EPSILON)*100)/100;
  const menu=document.querySelector('.side-menu-item[data-feature="Hatırlatmalar"]');
  if(!menu)return;
  menu.classList.remove("future-menu-item");
  menu.removeAttribute("data-feature");
  menu.dataset.page="remindersPage";
  if(!$("remindersPage")){
    const page=document.createElement("section");
    page.id="remindersPage";
    page.className="page";
    page.innerHTML=`
      <header class="top-header">
        <div><p class="eyebrow">Ödeme Takibi</p><h1>Hatırlatmalar</h1></div>
        <button id="remindersBackButton" class="reports-back-button" type="button">Ana Sayfa</button>
      </header>
      <section class="reminder-summary-grid">
        <article class="reminder-summary-card overdue"><span>Geciken</span><strong id="reminderOverdueCount">0</strong></article>
        <article class="reminder-summary-card today"><span>Bugün</span><strong id="reminderTodayCount">0</strong></article>
        <article class="reminder-summary-card week"><span>Bu Hafta</span><strong id="reminderWeekCount">0</strong></article>
        <article class="reminder-summary-card completed"><span>Tamamlanan</span><strong id="reminderCompletedCount">0</strong></article>
      </section>
      <section class="content-card">
        <div class="section-heading"><div><p class="eyebrow">Filtrele</p><h2>Hatırlatma durumu</h2></div></div>
        <div class="reminder-filter-row" id="reminderFilters">
          <button class="reminder-filter active" data-filter="all" type="button">Hepsi</button>
          <button class="reminder-filter" data-filter="overdue" type="button">Geciken</button>
          <button class="reminder-filter" data-filter="today" type="button">Bugün</button>
          <button class="reminder-filter" data-filter="upcoming" type="button">Yaklaşan</button>
          <button class="reminder-filter" data-filter="completed" type="button">Tamamlanan</button>
        </div>
      </section>
      <section class="content-card">
        <div class="section-heading"><div><p class="eyebrow">Ödeme Planı</p><h2>Hatırlatmaların</h2></div></div>
        <div id="reminderList" class="reminder-list"></div>
      </section>
      <section class="content-card">
        <button id="addReminderButton" class="reminder-add-button" type="button">
          <span>＋</span><div><strong>Hatırlatma Ekle</strong><small>Kira, fatura veya özel ödeme ekle</small></div>
        </button>
      </section>`;
    document.querySelector("main.app-shell")?.appendChild(page);
  }
  if(!$("yfReminderStyles")){
    const s=document.createElement("style");
    s.id="yfReminderStyles";
    s.textContent=`
      .reminder-summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px;margin-bottom:14px}
      .reminder-summary-card{padding:16px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04)}
      .reminder-summary-card span,.reminder-summary-card strong{display:block}.reminder-summary-card span{margin-bottom:7px;color:#8fa2ba;font-size:11px}.reminder-summary-card strong{font-size:24px}
      .reminder-summary-card.overdue{border-color:rgba(255,91,122,.22);background:rgba(255,91,122,.07)}
      .reminder-summary-card.today{border-color:rgba(255,177,72,.22);background:rgba(255,177,72,.07)}
      .reminder-summary-card.week{border-color:rgba(69,166,255,.22);background:rgba(69,166,255,.07)}
      .reminder-summary-card.completed{border-color:rgba(43,211,154,.22);background:rgba(43,211,154,.07)}
      .reminder-filter-row{display:flex;gap:8px;overflow-x:auto}.reminder-filter{min-height:38px;padding:0 13px;border:1px solid rgba(255,255,255,.09);border-radius:999px;color:#9db0c4;background:rgba(255,255,255,.035);font:inherit;font-size:11px;font-weight:800;white-space:nowrap}
      .reminder-filter.active{color:#dff1ff;border-color:rgba(72,171,255,.26);background:rgba(15,140,255,.13)}
      .reminder-list{display:grid;gap:11px}.reminder-item{display:flex;align-items:center;gap:12px;padding:14px;border:1px solid rgba(255,255,255,.07);border-radius:17px;background:rgba(255,255,255,.035)}
      .reminder-item-icon{width:42px;height:42px;flex:0 0 42px;display:flex;align-items:center;justify-content:center;border-radius:14px;font-weight:900}
      .reminder-item-icon.overdue{color:#ff8298;background:rgba(255,91,122,.12)}.reminder-item-icon.today,.reminder-item-icon.week{color:#ffd073;background:rgba(255,177,72,.11)}.reminder-item-icon.upcoming{color:#72c2ff;background:rgba(15,140,255,.11)}.reminder-item-icon.completed{color:#4ce0aa;background:rgba(43,211,154,.11)}
      .reminder-item-info{min-width:0;flex:1}.reminder-item-info strong,.reminder-item-info span,.reminder-item-info small{display:block}.reminder-item-info span{margin-top:4px;color:#b7c7d7;font-size:11px}.reminder-item-info small{margin-top:6px;color:#8093a8;font-size:9.5px}
      .reminder-item-side{text-align:right}.reminder-item-side>strong{display:block;font-size:12px}.reminder-pay-button{min-height:30px;margin-top:7px;padding:0 9px;border:1px solid rgba(72,171,255,.22);border-radius:10px;color:#74c2ff;background:rgba(15,140,255,.10);font-size:9px;font-weight:850}
      .reminder-add-button{width:100%;min-height:62px;display:flex;align-items:center;gap:13px;padding:13px;border:1px dashed rgba(72,171,255,.24);border-radius:17px;color:inherit;background:rgba(15,140,255,.055);text-align:left;font:inherit}
      .reminder-add-button>span{width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:12px;color:#72c2ff;background:rgba(15,140,255,.11);font-size:21px}.reminder-add-button strong,.reminder-add-button small{display:block}.reminder-add-button small{margin-top:4px;color:#8093a8;font-size:10px}`;
    document.head.appendChild(s);
  }
  const showPage=id=>{
    document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));
    document.querySelectorAll(".bottom-navigation .nav-item").forEach(n=>n.classList.toggle("active",n.dataset.page===id));
    window.scrollTo({top:0,behavior:"smooth"});
  };
  const days=v=>{const a=new Date();a.setHours(0,0,0,0);const b=new Date(`${v}T00:00:00`);return Math.ceil((b-a)/86400000)};
  const currentMonth=v=>{const d=new Date(String(v).includes("T")?v:`${v}T12:00:00`),n=new Date();return !Number.isNaN(d.getTime())&&d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()};
  const cycle=v=>{const m=String(v||"").match(/^(\d{4})-(\d{2})/);return m?`${m[1]}-${m[2]}`:""};
  const paidFor=(c,tx)=>round(tx.filter(t=>t.type==="card-payment"&&t.cardId===c.id&&(t.statementCycle?t.statementCycle===cycle(c.dueDate):currentMonth(t.createdAt||t.date))).reduce((s,t)=>s+Number(t.amount||0),0));
  function render(filter="all"){
    const debts=load(DK),tx=load(TK),list=$("reminderList");
    const reminders=debts.filter(x=>Number(x.debt||0)>0).map(x=>{
      const isLoan=x.type==="personal-loan",date=isLoan?(x.nextPaymentDate||x.dueDate):x.dueDate;
      if(!date)return null;
      const d=days(date);
      const due=isLoan?Math.min(Number(x.monthlyInstallment||0),Number(x.debt||0)):Math.max(0,round(Number(x.statementDebt??x.debt??0)*.2)-paidFor(x,tx));
      const status=d<0?"overdue":d===0?"today":d<=7?"week":"upcoming";
      return{id:x.id,bank:x.bank,name:x.name,date,due,status,days:d,isLoan};
    }).filter(Boolean).sort((a,b)=>a.days-b.days);
    const completed=tx.filter(t=>(t.type==="card-payment"||t.type==="loan-payment")&&currentMonth(t.createdAt||t.date)).map(t=>({id:t.id,status:"completed",bank:t.cardName||t.name,name:t.type==="loan-payment"?"Kredi taksiti ödendi":"Kart borcu ödendi",due:Number(t.amount||0),date:t.createdAt||t.date}));
    $("reminderOverdueCount").textContent=reminders.filter(x=>x.status==="overdue").length;
    $("reminderTodayCount").textContent=reminders.filter(x=>x.status==="today").length;
    $("reminderWeekCount").textContent=reminders.filter(x=>x.status==="today"||x.status==="week").length;
    $("reminderCompletedCount").textContent=completed.length;
    const all=[...reminders,...completed].filter(x=>filter==="all"||x.status===filter||(filter==="upcoming"&&(x.status==="week"||x.status==="upcoming")));
    list.innerHTML="";
    if(!all.length){list.innerHTML='<div class="empty-state">Bu filtrede hatırlatma bulunmuyor.</div>';return}
    all.forEach(x=>{
      const el=document.createElement("article");
      el.className="reminder-item";
      if(x.status==="completed"){
        el.innerHTML=`<div class="reminder-item-icon completed">✓</div><div class="reminder-item-info"><strong>${esc(x.bank)}</strong><span>${esc(x.name)}</span><small>${new Date(x.date).toLocaleString("tr-TR")}</small></div><div class="reminder-item-side"><strong>${money(x.due)}</strong></div>`;
      }else{
        const text=x.days<0?`${Math.abs(x.days)} gün gecikti`:x.days===0?"Bugün son gün":x.days===1?"Yarın":`${x.days} gün kaldı`;
        el.innerHTML=`<div class="reminder-item-icon ${x.status}">${x.status==="overdue"?"!":x.status==="today"?"●":x.status==="week"?"⌛":"○"}</div><div class="reminder-item-info"><strong>${esc(x.bank)}</strong><span>${esc(x.name)}</span><small>${x.isLoan?"İhtiyaç Kredisi":"Kredi Kartı"} · ${text}</small></div><div class="reminder-item-side"><strong>${money(x.due)}</strong><button class="reminder-pay-button" type="button">Şimdi Öde</button></div>`;
        el.querySelector("button").onclick=()=>{document.querySelector('[data-page="debtPaymentPage"]')?.click();setTimeout(()=>{const s=$("debtPaymentCard");if(s){s.value=x.id;s.dispatchEvent(new Event("change",{bubbles:true}))}},220)};
      }
      list.appendChild(el);
    });
  }
  menu.addEventListener("click",()=>{document.getElementById("sideMenuLayer")?.classList.remove("open");showPage("remindersPage");render()});
  $("remindersBackButton")?.addEventListener("click",()=>showPage("dashboardPage"));
  $("reminderFilters")?.addEventListener("click",e=>{const b=e.target.closest("[data-filter]");if(!b)return;document.querySelectorAll(".reminder-filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");render(b.dataset.filter)});
  $("addReminderButton")?.addEventListener("click",()=>alert("Özel hatırlatma ekleme sonraki aşamada aktif edilecek."));
  render();
});
// =========================================
// YF v2.4.1 — Hatırlatmalar Sayfası Kaydırma Düzeltmesi
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================
document.addEventListener("DOMContentLoaded", () => {
  const reminderMenuButton = document.querySelector(
    '[data-page="remindersPage"]'
  );
  const remindersBackButton = document.getElementById(
    "remindersBackButton"
  );
  function unlockPageScroll() {
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }
  reminderMenuButton?.addEventListener("click", () => {
    setTimeout(unlockPageScroll, 50);
  });
  remindersBackButton?.addEventListener("click", () => {
    setTimeout(unlockPageScroll, 50);
  });
  window.addEventListener("pageshow", unlockPageScroll);
  setTimeout(unlockPageScroll, 150);
});
// =========================================
// YF v2.5 — Hedefler Ekranı Arayüzü
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================
document.addEventListener("DOMContentLoaded", () => {
  const DEBT_KEY = "yf_cards_v1";
  const TRANSACTION_KEY = "yf_transactions_v1";
  const menuButton = document.querySelector(
    '.side-menu-item[data-feature="Hedefler"]'
  );
  if (!menuButton) return;
  menuButton.classList.remove("future-menu-item");
  menuButton.removeAttribute("data-feature");
  menuButton.dataset.page = "goalsPage";
  installGoalStyles();
  createGoalsPage();
  setupGoalEvents();
  renderGoals();
  function createGoalsPage() {
    if (document.getElementById("goalsPage")) return;
    const main = document.querySelector("main.app-shell");
    if (!main) return;
    const page = document.createElement("section");
    page.id = "goalsPage";
    page.className = "page";
    page.innerHTML = `
      <header class="top-header">
        <div>
          <p class="eyebrow">Finans Planı</p>
          <h1>Hedefler</h1>
        </div>
        <button
          id="goalsBackButton"
          class="reports-back-button"
          type="button"
        >
          Ana Sayfa
        </button>
      </header>
      <section class="goal-summary-grid">
        <article class="goal-summary-card">
          <span>Aktif Hedef</span>
          <strong id="activeGoalCount">0</strong>
        </article>
        <article class="goal-summary-card">
          <span>Tamamlanan</span>
          <strong id="completedGoalCount">0</strong>
        </article>
        <article class="goal-summary-card wide">
          <span>Toplam Borç İlerlemesi</span>
          <strong id="totalGoalProgress">%0</strong>
        </article>
      </section>
      <section class="content-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Ana Hedef</p>
            <h2>Toplam borcu bitir</h2>
          </div>
        </div>
        <div class="main-goal-card">
          <div class="main-goal-head">
            <div>
              <span>Başlangıç Borcu</span>
              <strong id="goalOriginalDebt">₺0,00</strong>
            </div>
            <div>
              <span>Kalan Borç</span>
              <strong id="goalRemainingDebt">₺0,00</strong>
            </div>
          </div>
          <div class="goal-progress-track">
            <div id="goalMainProgress" class="goal-progress-fill"></div>
          </div>
          <div class="goal-progress-footer">
            <span id="goalPaidAmount">₺0,00 ödendi</span>
            <strong id="goalPercentText">%0</strong>
          </div>
          <p id="goalMotivationText" class="goal-motivation">
            Borçların azaldıkça ilerleme burada görünecek.
          </p>
        </div>
      </section>
      <section class="content-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">Borç Hedefleri</p>
            <h2>Kart ve krediler</h2>
          </div>
        </div>
        <div id="goalDebtList" class="goal-list">
          <div class="empty-state">Henüz borç hedefi bulunmuyor.</div>
        </div>
      </section>
      <section class="content-card">
        <button id="addGoalButton" class="goal-add-button" type="button">
          <span>＋</span>
          <div>
            <strong>Yeni Hedef Ekle</strong>
            <small>Borç kapatma veya birikim hedefi oluştur</small>
          </div>
        </button>
      </section>
    `;
    main.appendChild(page);
  }
  function setupGoalEvents() {
    menuButton.addEventListener("click", () => {
      closeSideMenu();
      showPage("goalsPage");
      renderGoals();
      localStorage.setItem("yf_last_open_page_v1", "goalsPage");
    });
    document
      .getElementById("goalsBackButton")
      ?.addEventListener("click", () => {
        showPage("dashboardPage");
        localStorage.setItem("yf_last_open_page_v1", "dashboardPage");
      });
    document
      .getElementById("addGoalButton")
      ?.addEventListener("click", () => {
        showToast("Yeni hedef ekleme formu sonraki aşamada aktif edilecek.");
      });
    window.addEventListener("storage", renderGoals);
  }
  function renderGoals() {
    const debts = loadJson(DEBT_KEY);
    const transactions = loadJson(TRANSACTION_KEY);
    const activeDebts = debts.filter(
      item => Number(item.debt || 0) > 0
    );
    const completedDebts = debts.filter(
      item => Number(item.debt || 0) <= 0
    );
    const remainingDebt = roundMoney(
      activeDebts.reduce(
        (sum, item) => sum + Number(item.debt || 0),
        0
      )
    );
    const totalPaid = roundMoney(
      transactions
        .filter(transaction =>
          transaction.type === "card-payment" ||
          transaction.type === "loan-payment"
        )
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount || 0),
          0
        )
    );
    const originalDebt = roundMoney(
      remainingDebt + totalPaid
    );
    const percent =
      originalDebt > 0
        ? Math.min(
            100,
            Math.round((totalPaid / originalDebt) * 100)
          )
        : 0;
    setText("activeGoalCount", activeDebts.length);
    setText("completedGoalCount", completedDebts.length);
    setText("totalGoalProgress", `%${percent}`);
    setText("goalOriginalDebt", formatMoney(originalDebt));
    setText("goalRemainingDebt", formatMoney(remainingDebt));
    setText("goalPaidAmount", `${formatMoney(totalPaid)} ödendi`);
    setText("goalPercentText", `%${percent}`);
    const progress = document.getElementById("goalMainProgress");
    if (progress) progress.style.width = `${percent}%`;
    const motivation = document.getElementById("goalMotivationText");
    if (motivation) {
      motivation.textContent =
        percent >= 100
          ? "Tebrikler! Tüm borç hedefin tamamlandı. 🎉"
          : percent >= 75
            ? "Hedefe çok yaklaştın. Son bölümdesin!"
            : percent >= 50
              ? "Borçlarının yarısından fazlasını tamamladın."
              : percent > 0
                ? "İlerleme başladı. Düzenli devam et."
                : "İlk ödemenle hedef ilerlemen başlayacak.";
    }
    renderDebtGoals(activeDebts, transactions);
  }
  function renderDebtGoals(debts, transactions) {
    const list = document.getElementById("goalDebtList");
    if (!list) return;
    list.innerHTML = "";
    if (!debts.length) {
      list.innerHTML = `
        <div class="empty-state">
          Aktif borç kalmadı. Tebrikler! 🎉
        </div>
      `;
      return;
    }
    debts.forEach(item => {
      const isLoan = item.type === "personal-loan";
      const paid = roundMoney(
        transactions
          .filter(transaction =>
            transaction.cardId === item.id &&
            (
              transaction.type === "card-payment" ||
              transaction.type === "loan-payment"
            )
          )
          .reduce(
            (sum, transaction) =>
              sum + Number(transaction.amount || 0),
            0
          )
      );
      const original = roundMoney(
        Number(item.debt || 0) + paid
      );
      const percent =
        original > 0
          ? Math.min(
              100,
              Math.round((paid / original) * 100)
            )
          : 0;
      const card = document.createElement("article");
      card.className = "goal-item";
      card.innerHTML = `
        <div class="goal-item-head">
          <div class="goal-item-icon">
            ${isLoan ? "🏦" : "💳"}
          </div>
          <div class="goal-item-info">
            <strong>${escapeHtml(item.bank || "Banka")}</strong>
            <span>${escapeHtml(item.name || "")}</span>
          </div>
          <strong class="goal-item-percent">%${percent}</strong>
        </div>
        <div class="goal-progress-track">
          <div class="goal-progress-fill" style="width:${percent}%"></div>
        </div>
        <div class="goal-item-footer">
          <span>Kalan: ${formatMoney(item.debt)}</span>
          <span>Ödenen: ${formatMoney(paid)}</span>
        </div>
      `;
      list.appendChild(card);
    });
  }
  function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
      page.classList.toggle("active", page.id === pageId);
    });
    document
      .querySelectorAll(".bottom-navigation .nav-item")
      .forEach(item => {
        item.classList.toggle("active", item.dataset.page === pageId);
      });
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function closeSideMenu() {
    const layer = document.getElementById("sideMenuLayer");
    layer?.classList.remove("open");
    layer?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }
  function showToast(text) {
    const toast = document.getElementById("menuToast");
    if (!toast) {
      alert(text);
      return;
    }
    toast.textContent = text;
    toast.classList.add("show");
    setTimeout(() => {
      toast.classList.remove("show");
    }, 1900);
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
  function roundMoney(value) {
    return Math.round(
      (Number(value) + Number.EPSILON) * 100
    ) / 100;
  }
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  }
  function installGoalStyles() {
    if (document.getElementById("yfGoalStyles")) return;
    const style = document.createElement("style");
    style.id = "yfGoalStyles";
    style.textContent = `
      .goal-summary-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 11px;
        margin-bottom: 14px;
      }
      .goal-summary-card {
        padding: 16px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 18px;
        background: rgba(255,255,255,.04);
      }
      .goal-summary-card.wide {
        grid-column: 1 / -1;
      }
      .goal-summary-card span,
      .goal-summary-card strong {
        display: block;
      }
      .goal-summary-card span {
        margin-bottom: 7px;
        color: #8fa2ba;
        font-size: 11px;
      }
      .goal-summary-card strong {
        font-size: 24px;
      }
      .main-goal-card {
        padding: 17px;
        border: 1px solid rgba(72,171,255,.18);
        border-radius: 19px;
        background: rgba(15,140,255,.06);
      }
      .main-goal-head {
        display: grid;
        grid-template-columns: repeat(2, minmax(0,1fr));
        gap: 12px;
        margin-bottom: 15px;
      }
      .main-goal-head span,
      .main-goal-head strong {
        display: block;
      }
      .main-goal-head span {
        margin-bottom: 5px;
        color: #8fa2ba;
        font-size: 10px;
      }
      .main-goal-head strong {
        font-size: 15px;
      }
      .goal-progress-track {
        height: 10px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,.08);
      }
      .goal-progress-fill {
        height: 100%;
        width: 0;
        border-radius: inherit;
        background: linear-gradient(90deg,#0f8cff,#52e6b2);
        transition: width .45s ease;
      }
      .goal-progress-footer {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 9px;
        color: #8fa2ba;
        font-size: 10px;
      }
      .goal-progress-footer strong {
        color: #66c3ff;
      }
      .goal-motivation {
        margin: 14px 0 0;
        color: #b9c8d8;
        font-size: 11px;
        line-height: 1.5;
      }
      .goal-list {
        display: grid;
        gap: 11px;
      }
      .goal-item {
        padding: 14px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 17px;
        background: rgba(255,255,255,.035);
      }
      .goal-item-head {
        display: flex;
        align-items: center;
        gap: 11px;
        margin-bottom: 12px;
      }
      .goal-item-icon {
        width: 40px;
        height: 40px;
        flex: 0 0 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 13px;
        background: rgba(15,140,255,.10);
      }
      .goal-item-info {
        min-width: 0;
        flex: 1;
      }
      .goal-item-info strong,
      .goal-item-info span {
        display: block;
      }
      .goal-item-info span {
        margin-top: 4px;
        color: #8fa2ba;
        font-size: 10px;
      }
      .goal-item-percent {
        color: #64c1ff;
        font-size: 13px;
      }
      .goal-item-footer {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-top: 9px;
        color: #8fa2ba;
        font-size: 9.5px;
      }
      .goal-add-button {
        width: 100%;
        min-height: 62px;
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 13px;
        border: 1px dashed rgba(72,171,255,.24);
        border-radius: 17px;
        color: inherit;
        background: rgba(15,140,255,.055);
        text-align: left;
        font: inherit;
      }
      .goal-add-button > span {
        width: 38px;
        height: 38px;
        flex: 0 0 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        color: #72c2ff;
        background: rgba(15,140,255,.11);
        font-size: 21px;
      }
      .goal-add-button strong,
      .goal-add-button small {
        display: block;
      }
      .goal-add-button small {
        margin-top: 4px;
        color: #8093a8;
        font-size: 10px;
      }
      body.light-theme .goal-summary-card,
      body.light-theme .goal-item,
      body.light-theme .main-goal-card {
        background: rgba(255,255,255,.82);
        border-color: rgba(20,73,112,.09);
      }
      body.light-theme .goal-motivation {
        color: #536b82;
      }
      @media(max-width:370px) {
        .main-goal-head {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }
});
// =========================================
// YF v2.6 — Gerçek Hedef Ekleme Sistemi
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================
document.addEventListener("DOMContentLoaded", () => {
  const GOAL_KEY = "yf_custom_goals_v1";
  const addGoalButton = document.getElementById("addGoalButton");
  const goalsPage = document.getElementById("goalsPage");
  if (!addGoalButton || !goalsPage) return;
  installCustomGoalStyles();
  createGoalModal();
  createCustomGoalSection();
  renderCustomGoals();
  addGoalButton.addEventListener("click", () => openGoalModal());
  function createCustomGoalSection() {
    if (document.getElementById("customGoalsSection")) return;
    const addButtonCard = addGoalButton.closest(".content-card");
    if (!addButtonCard) return;
    const section = document.createElement("section");
    section.id = "customGoalsSection";
    section.className = "content-card";
    section.innerHTML = `
      <div class="section-heading">
        <div>
          <p class="eyebrow">Kişisel Hedefler</p>
          <h2>Birikim ve planlar</h2>
        </div>
      </div>
      <div id="customGoalList" class="custom-goal-list">
        <div class="empty-state">Henüz özel hedef eklenmedi.</div>
      </div>
    `;
    addButtonCard.insertAdjacentElement("beforebegin", section);
  }
  function createGoalModal() {
    if (document.getElementById("customGoalModal")) return;
    const modal = document.createElement("div");
    modal.id = "customGoalModal";
    modal.className = "custom-goal-modal hidden";
    modal.innerHTML = `
      <div class="custom-goal-backdrop"></div>
      <section class="custom-goal-sheet">
        <div class="custom-goal-modal-head">
          <div>
            <span>YENİ HEDEF</span>
            <h2 id="customGoalModalTitle">Hedef Ekle</h2>
          </div>
          <button
            id="closeCustomGoalModal"
            class="custom-goal-close"
            type="button"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>
        <form id="customGoalForm">
          <input id="customGoalId" type="hidden">
          <label class="custom-goal-label">
            Hedef türü
            <select id="customGoalType" required>
              <option value="saving">💰 Birikim</option>
              <option value="phone">📱 Telefon</option>
              <option value="car">🚗 Araba</option>
              <option value="home">🏠 Ev</option>
              <option value="holiday">✈️ Tatil</option>
              <option value="education">🎓 Eğitim</option>
              <option value="wedding">❤️ Düğün</option>
              <option value="other">🎯 Diğer</option>
            </select>
          </label>
          <label class="custom-goal-label">
            Hedef adı
            <input
              id="customGoalName"
              type="text"
              placeholder="Örn. Yeni telefon"
              required
            >
          </label>
          <label class="custom-goal-label">
            Hedef tutarı
            <input
              id="customGoalTarget"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              required
            >
          </label>
          <label class="custom-goal-label">
            Şu anki birikim
            <input
              id="customGoalCurrent"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value="0"
            >
          </label>
          <label class="custom-goal-label">
            Hedef tarihi
            <input id="customGoalDate" type="date">
          </label>
          <label class="custom-goal-pin-row">
            <input id="customGoalPinned" type="checkbox">
            <span>Bu hedefi en üste sabitle</span>
          </label>
          <div class="custom-goal-actions">
            <button
              id="cancelCustomGoal"
              class="custom-goal-secondary"
              type="button"
            >
              Vazgeç
            </button>
            <button
              class="custom-goal-primary"
              type="submit"
            >
              Kaydet
            </button>
          </div>
        </form>
      </section>
    `;
    document.body.appendChild(modal);
    document
      .getElementById("closeCustomGoalModal")
      ?.addEventListener("click", closeGoalModal);
    document
      .getElementById("cancelCustomGoal")
      ?.addEventListener("click", closeGoalModal);
    modal
      .querySelector(".custom-goal-backdrop")
      ?.addEventListener("click", closeGoalModal);
    document
      .getElementById("customGoalForm")
      ?.addEventListener("submit", saveGoal);
  }
  function openGoalModal(goal = null) {
    const form = document.getElementById("customGoalForm");
    const modal = document.getElementById("customGoalModal");
    if (!form || !modal) return;
    form.reset();
    document.getElementById("customGoalId").value = goal?.id || "";
    document.getElementById("customGoalType").value =
      goal?.type || "saving";
    document.getElementById("customGoalName").value =
      goal?.name || "";
    document.getElementById("customGoalTarget").value =
      goal?.targetAmount || "";
    document.getElementById("customGoalCurrent").value =
      goal?.currentAmount || 0;
    document.getElementById("customGoalDate").value =
      goal?.targetDate || "";
    document.getElementById("customGoalPinned").checked =
      Boolean(goal?.pinned);
    document.getElementById("customGoalModalTitle").textContent =
      goal ? "Hedefi Düzenle" : "Hedef Ekle";
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeGoalModal() {
    document
      .getElementById("customGoalModal")
      ?.classList.add("hidden");
    document.body.style.overflow = "";
  }
  function saveGoal(event) {
    event.preventDefault();
    const id = document.getElementById("customGoalId").value;
    const type = document.getElementById("customGoalType").value;
    const name = document.getElementById("customGoalName").value.trim();
    const targetAmount = Number(
      document.getElementById("customGoalTarget").value
    );
    const currentAmount = Number(
      document.getElementById("customGoalCurrent").value || 0
    );
    const targetDate =
      document.getElementById("customGoalDate").value || "";
    const pinned =
      document.getElementById("customGoalPinned").checked;
    if (!name) {
      alert("Hedef adını yaz.");
      return;
    }
    if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
      alert("Hedef tutarını doğru gir.");
      return;
    }
    if (!Number.isFinite(currentAmount) || currentAmount < 0) {
      alert("Mevcut birikimi doğru gir.");
      return;
    }
    if (currentAmount > targetAmount) {
      alert("Mevcut birikim hedef tutarından büyük olamaz.");
      return;
    }
    const goals = loadGoals();
    const oldGoal = goals.find(item => item.id === id);
    const goal = {
      id: id || createId(),
      type,
      name,
      targetAmount: roundMoney(targetAmount),
      currentAmount: roundMoney(currentAmount),
      targetDate,
      pinned,
      createdAt: oldGoal?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const index = goals.findIndex(item => item.id === goal.id);
    if (index >= 0) {
      goals[index] = goal;
    } else {
      goals.unshift(goal);
    }
    saveGoals(goals);
    renderCustomGoals();
    closeGoalModal();
  }
  function renderCustomGoals() {
    const list = document.getElementById("customGoalList");
    if (!list) return;
    const goals = loadGoals().sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });
    list.innerHTML = "";
    if (!goals.length) {
      list.innerHTML = `
        <div class="empty-state">
          Henüz özel hedef eklenmedi.
        </div>
      `;
      return;
    }
    goals.forEach(goal => {
      const percent = goal.targetAmount > 0
        ? Math.min(
            100,
            Math.round(
              (goal.currentAmount / goal.targetAmount) * 100
            )
          )
        : 0;
      const remaining = Math.max(
        0,
        goal.targetAmount - goal.currentAmount
      );
      const card = document.createElement("article");
      card.className = "custom-goal-card";
      card.innerHTML = `
        <div class="custom-goal-card-head">
          <div class="custom-goal-icon">
            ${getGoalIcon(goal.type)}
          </div>
          <div class="custom-goal-card-info">
            <div class="custom-goal-title-row">
              <strong>${escapeHtml(goal.name)}</strong>
              ${
                goal.pinned
                  ? '<span class="custom-goal-pin-badge">📌 Sabit</span>'
                  : ""
              }
            </div>
            <span>${getGoalTypeText(goal.type)}</span>
          </div>
          <div class="custom-goal-menu">
            <button
              type="button"
              data-goal-menu="${goal.id}"
            >
              ⋯
            </button>
          </div>
        </div>
        <div class="goal-progress-track">
          <div
            class="goal-progress-fill"
            style="width:${percent}%"
          ></div>
        </div>
        <div class="custom-goal-stats">
          <div>
            <span>Birikim</span>
            <strong>${formatMoney(goal.currentAmount)}</strong>
          </div>
          <div>
            <span>Kalan</span>
            <strong>${formatMoney(remaining)}</strong>
          </div>
          <div>
            <span>İlerleme</span>
            <strong>%${percent}</strong>
          </div>
        </div>
        ${
          goal.targetDate
            ? `
              <div class="custom-goal-date">
                Hedef tarihi:
                <strong>${formatDate(goal.targetDate)}</strong>
              </div>
            `
            : ""
        }
        <div
          id="goalActions-${goal.id}"
          class="custom-goal-action-panel hidden"
        >
          <button
            type="button"
            data-goal-edit="${goal.id}"
          >
            ✏️ Düzenle
          </button>
          <button
            type="button"
            data-goal-pin="${goal.id}"
          >
            ${goal.pinned ? "📌 Sabitlemeyi Kaldır" : "📌 Sabitle"}
          </button>
          <button
            type="button"
            data-goal-delete="${goal.id}"
            class="danger"
          >
            🗑️ Sil
          </button>
        </div>
      `;
      card
        .querySelector("[data-goal-menu]")
        ?.addEventListener("click", () => {
          document
            .getElementById(`goalActions-${goal.id}`)
            ?.classList.toggle("hidden");
        });
      card
        .querySelector("[data-goal-edit]")
        ?.addEventListener("click", () => {
          openGoalModal(goal);
        });
      card
        .querySelector("[data-goal-pin]")
        ?.addEventListener("click", () => {
          togglePin(goal.id);
        });
      card
        .querySelector("[data-goal-delete]")
        ?.addEventListener("click", () => {
          deleteGoal(goal.id);
        });
      list.appendChild(card);
    });
  }
  function togglePin(goalId) {
    const goals = loadGoals();
    const goal = goals.find(item => item.id === goalId);
    if (!goal) return;
    goal.pinned = !goal.pinned;
    goal.updatedAt = new Date().toISOString();
    saveGoals(goals);
    renderCustomGoals();
  }
  function deleteGoal(goalId) {
    const goal = loadGoals().find(item => item.id === goalId);
    if (!goal) return;
    if (!confirm(`"${goal.name}" hedefi silinsin mi?`)) return;
    const goals = loadGoals().filter(item => item.id !== goalId);
    saveGoals(goals);
    renderCustomGoals();
  }
  function getGoalIcon(type) {
    const icons = {
      saving: "💰",
      phone: "📱",
      car: "🚗",
      home: "🏠",
      holiday: "✈️",
      education: "🎓",
      wedding: "❤️",
      other: "🎯"
    };
    return icons[type] || "🎯";
  }
  function getGoalTypeText(type) {
    const labels = {
      saving: "Birikim",
      phone: "Telefon",
      car: "Araba",
      home: "Ev",
      holiday: "Tatil",
      education: "Eğitim",
      wedding: "Düğün",
      other: "Diğer"
    };
    return labels[type] || "Diğer";
  }
  function formatMoney(value) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(Number(value) || 0);
  }
  function formatDate(value) {
    if (!value) return "";
    const date = new Date(`${value}T12:00:00`);
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }
  function roundMoney(value) {
    return Math.round(
      (Number(value) + Number.EPSILON) * 100
    ) / 100;
  }
  function createId() {
    return window.crypto?.randomUUID
      ? crypto.randomUUID()
      : String(Date.now() + Math.random());
  }
  function loadGoals() {
    try {
      return JSON.parse(localStorage.getItem(GOAL_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function saveGoals(goals) {
    localStorage.setItem(GOAL_KEY, JSON.stringify(goals));
  }
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function installCustomGoalStyles() {
    if (document.getElementById("yfCustomGoalStyles")) return;
    const style = document.createElement("style");
    style.id = "yfCustomGoalStyles";
    style.textContent = `
      .custom-goal-modal {
        position: fixed;
        z-index: 4000;
        inset: 0;
      }
      .custom-goal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.74);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
      }
      .custom-goal-sheet {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        max-height: 88vh;
        overflow-y: auto;
        padding:
          18px
          18px
          calc(22px + env(safe-area-inset-bottom));
        border-radius: 26px 26px 0 0;
        border: 1px solid rgba(255,255,255,.10);
        background:
          linear-gradient(
            180deg,
            rgba(18,43,69,.99),
            rgba(8,23,38,.99)
          );
      }
      .custom-goal-modal-head {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 16px;
      }
      .custom-goal-modal-head span {
        color: #67baff;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .14em;
      }
      .custom-goal-modal-head h2 {
        margin: 5px 0 0;
        font-size: 22px;
      }
      .custom-goal-close {
        width: 40px;
        height: 40px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 13px;
        color: inherit;
        background: rgba(255,255,255,.05);
        font-size: 25px;
      }
      .custom-goal-label {
        display: grid;
        gap: 7px;
        margin-bottom: 13px;
        color: #b9c8d8;
        font-size: 11px;
        font-weight: 750;
      }
      .custom-goal-label input,
      .custom-goal-label select {
        min-height: 48px;
        width: 100%;
        padding: 0 13px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 14px;
        color: inherit;
        background: rgba(255,255,255,.055);
        font: inherit;
        box-sizing: border-box;
      }
      .custom-goal-pin-row {
        display: flex;
        align-items: center;
        gap: 9px;
        margin: 5px 0 17px;
        color: #b9c8d8;
        font-size: 11px;
      }
      .custom-goal-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .custom-goal-primary,
      .custom-goal-secondary {
        min-height: 48px;
        border-radius: 14px;
        font: inherit;
        font-weight: 850;
      }
      .custom-goal-primary {
        border: 0;
        color: #fff;
        background: linear-gradient(135deg,#0f8cff,#1aa1ff);
      }
      .custom-goal-secondary {
        border: 1px solid rgba(255,255,255,.10);
        color: inherit;
        background: rgba(255,255,255,.04);
      }
      .custom-goal-list {
        display: grid;
        gap: 11px;
      }
      .custom-goal-card {
        padding: 14px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 17px;
        background: rgba(255,255,255,.035);
      }
      .custom-goal-card-head {
        display: flex;
        align-items: center;
        gap: 11px;
        margin-bottom: 12px;
      }
      .custom-goal-icon {
        width: 40px;
        height: 40px;
        flex: 0 0 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 13px;
        background: rgba(15,140,255,.10);
      }
      .custom-goal-card-info {
        min-width: 0;
        flex: 1;
      }
      .custom-goal-title-row {
        display: flex;
        align-items: center;
        gap: 7px;
        flex-wrap: wrap;
      }
      .custom-goal-card-info span {
        display: block;
        margin-top: 4px;
        color: #8fa2ba;
        font-size: 10px;
      }
      .custom-goal-pin-badge {
        display: inline-flex !important;
        align-items: center;
        min-height: 21px;
        margin: 0 !important;
        padding: 0 7px;
        border-radius: 999px;
        color: #ffd073 !important;
        background: rgba(255,177,72,.10);
        font-size: 8px !important;
        font-weight: 850;
      }
      .custom-goal-menu button {
        width: 34px;
        height: 34px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 11px;
        color: inherit;
        background: rgba(255,255,255,.04);
        font-size: 20px;
      }
      .custom-goal-stats {
        display: grid;
        grid-template-columns: repeat(3,minmax(0,1fr));
        gap: 8px;
        margin-top: 11px;
      }
      .custom-goal-stats > div {
        padding: 10px;
        border-radius: 12px;
        background: rgba(255,255,255,.035);
      }
      .custom-goal-stats span,
      .custom-goal-stats strong {
        display: block;
      }
      .custom-goal-stats span {
        margin-bottom: 4px;
        color: #8fa2ba;
        font-size: 8.5px;
      }
      .custom-goal-stats strong {
        font-size: 10.5px;
      }
      .custom-goal-date {
        margin-top: 10px;
        color: #8fa2ba;
        font-size: 9.5px;
      }
      .custom-goal-date strong {
        color: #b9c8d8;
      }
      .custom-goal-action-panel {
        display: grid;
        gap: 7px;
        margin-top: 11px;
      }
      .custom-goal-action-panel button {
        min-height: 38px;
        padding: 0 11px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 11px;
        color: inherit;
        background: rgba(255,255,255,.04);
        text-align: left;
        font: inherit;
        font-size: 10px;
        font-weight: 750;
      }
      .custom-goal-action-panel button.danger {
        color: #ff8298;
        border-color: rgba(255,91,122,.18);
        background: rgba(255,91,122,.06);
      }
      body.light-theme .custom-goal-sheet,
      body.light-theme .custom-goal-card {
        color: #102033;
        background: rgba(250,253,255,.98);
      }
      @media(max-width:370px) {
        .custom-goal-stats {
          grid-template-columns: 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }
});
// =========================================
// YF v2.6.1 — Hedefe Para Ekleme Sistemi
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================
document.addEventListener("DOMContentLoaded", () => {
  const GOAL_KEY = "yf_custom_goals_v1";
  const TRANSACTION_KEY = "yf_transactions_v1";
  installGoalPaymentStyles();
  enhanceGoalCards();
  window.addEventListener("storage", enhanceGoalCards);
  function enhanceGoalCards() {
    const list = document.getElementById("customGoalList");
    if (!list) return;
    setTimeout(() => {
      const goals = loadJson(GOAL_KEY);
      goals.forEach(goal => {
        const card = findGoalCard(goal.id, list);
        if (!card) return;
        if (!card.querySelector(`[data-goal-pay="${goal.id}"]`)) {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "custom-goal-pay-button";
          button.dataset.goalPay = goal.id;
          button.textContent =
            Number(goal.currentAmount || 0) >= Number(goal.targetAmount || 0)
              ? "Hedef Tamamlandı ✓"
              : "＋ Hedefe Para Ekle";
          button.disabled =
            Number(goal.currentAmount || 0) >= Number(goal.targetAmount || 0);
          button.addEventListener("click", () => {
            openGoalPaymentModal(goal.id);
          });
          card.appendChild(button);
        }
      });
    }, 100);
  }
  function findGoalCard(goalId, list) {
    const menuButton = list.querySelector(
      `[data-goal-menu="${goalId}"]`
    );
    return menuButton?.closest(".custom-goal-card") || null;
  }
  function openGoalPaymentModal(goalId) {
    const goals = loadJson(GOAL_KEY);
    const goal = goals.find(item => item.id === goalId);
    if (!goal) {
      alert("Hedef bulunamadı.");
      return;
    }
    let modal = document.getElementById("goalPaymentModal");
    if (!modal) {
      modal = createGoalPaymentModal();
    }
    document.getElementById("goalPaymentId").value = goal.id;
    document.getElementById("goalPaymentName").textContent = goal.name;
    document.getElementById("goalPaymentCurrent").textContent =
      formatMoney(goal.currentAmount);
    document.getElementById("goalPaymentRemaining").textContent =
      formatMoney(
        Math.max(
          0,
          Number(goal.targetAmount || 0) -
          Number(goal.currentAmount || 0)
        )
      );
    document.getElementById("goalPaymentAmount").value = "";
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    setTimeout(() => {
      document.getElementById("goalPaymentAmount")?.focus();
    }, 120);
  }
  function createGoalPaymentModal() {
    const modal = document.createElement("div");
    modal.id = "goalPaymentModal";
    modal.className = "goal-payment-modal hidden";
    modal.innerHTML = `
      <div class="goal-payment-backdrop"></div>
      <section class="goal-payment-sheet">
        <div class="goal-payment-head">
          <div>
            <span>HEDEFE PARA EKLE</span>
            <h2 id="goalPaymentName">Hedef</h2>
          </div>
          <button
            id="closeGoalPaymentModal"
            class="goal-payment-close"
            type="button"
          >
            ×
          </button>
        </div>
        <div class="goal-payment-summary">
          <div>
            <span>Mevcut birikim</span>
            <strong id="goalPaymentCurrent">₺0,00</strong>
          </div>
          <div>
            <span>Kalan tutar</span>
            <strong id="goalPaymentRemaining">₺0,00</strong>
          </div>
        </div>
        <form id="goalPaymentForm">
          <input id="goalPaymentId" type="hidden">
          <label class="goal-payment-label">
            Eklenecek tutar
            <input
              id="goalPaymentAmount"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0,00"
              required
            >
          </label>
          <div class="goal-payment-actions">
            <button
              id="cancelGoalPayment"
              class="goal-payment-secondary"
              type="button"
            >
              Vazgeç
            </button>
            <button
              class="goal-payment-primary"
              type="submit"
            >
              Para Ekle
            </button>
          </div>
        </form>
      </section>
    `;
    document.body.appendChild(modal);
    document
      .getElementById("closeGoalPaymentModal")
      ?.addEventListener("click", closeGoalPaymentModal);
    document
      .getElementById("cancelGoalPayment")
      ?.addEventListener("click", closeGoalPaymentModal);
    modal
      .querySelector(".goal-payment-backdrop")
      ?.addEventListener("click", closeGoalPaymentModal);
    document
      .getElementById("goalPaymentForm")
      ?.addEventListener("submit", saveGoalPayment);
    return modal;
  }
  function closeGoalPaymentModal() {
    document
      .getElementById("goalPaymentModal")
      ?.classList.add("hidden");
    document.body.style.overflow = "";
  }
  function saveGoalPayment(event) {
    event.preventDefault();
    const goalId = document.getElementById("goalPaymentId").value;
    const amount = Number(
      document.getElementById("goalPaymentAmount").value
    );
    const goals = loadJson(GOAL_KEY);
    const goal = goals.find(item => item.id === goalId);
    if (!goal) {
      alert("Hedef bulunamadı.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      alert("Geçerli bir tutar gir.");
      return;
    }
    const remaining = roundMoney(
      Math.max(
        0,
        Number(goal.targetAmount || 0) -
        Number(goal.currentAmount || 0)
      )
    );
    if (amount > remaining) {
      alert(
        `En fazla ${formatMoney(remaining)} ekleyebilirsin.`
      );
      return;
    }
    goal.currentAmount = roundMoney(
      Number(goal.currentAmount || 0) + amount
    );
    goal.updatedAt = new Date().toISOString();
    saveJson(GOAL_KEY, goals);
    const transactions = loadJson(TRANSACTION_KEY);
    const now = new Date();
    transactions.unshift({
      id: createId(),
      type: "goal-payment",
      name: goal.name,
      amount: roundMoney(amount),
      category: "Hedef Birikimi",
      date: now.toISOString().split("T")[0],
      paymentMethod: "cash",
      goalId: goal.id,
      goalName: goal.name,
      createdAt: now.toISOString()
    });
    saveJson(TRANSACTION_KEY, transactions);
    closeGoalPaymentModal();
    // Hedefler sayfasını yeniden çizmek için sayfayı yenile.
    sessionStorage.setItem("yf_open_goals_after_reload", "1");
    window.location.reload();
  }
  if (
    sessionStorage.getItem("yf_open_goals_after_reload") === "1"
  ) {
    sessionStorage.removeItem("yf_open_goals_after_reload");
    setTimeout(() => {
      document
        .querySelector('[data-page="goalsPage"]')
        ?.click();
    }, 300);
  }
  function formatMoney(value) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(Number(value) || 0);
  }
  function roundMoney(value) {
    return Math.round(
      (Number(value) + Number.EPSILON) * 100
    ) / 100;
  }
  function createId() {
    return window.crypto?.randomUUID
      ? crypto.randomUUID()
      : String(Date.now() + Math.random());
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
  function installGoalPaymentStyles() {
    if (document.getElementById("yfGoalPaymentStyles")) return;
    const style = document.createElement("style");
    style.id = "yfGoalPaymentStyles";
    style.textContent = `
      .custom-goal-pay-button {
        width: 100%;
        min-height: 42px;
        margin-top: 12px;
        border: 1px solid rgba(72,171,255,.22);
        border-radius: 12px;
        color: #74c2ff;
        background: rgba(15,140,255,.10);
        font: inherit;
        font-size: 10px;
        font-weight: 850;
      }
      .custom-goal-pay-button:disabled {
        color: #4ce0aa;
        border-color: rgba(43,211,154,.20);
        background: rgba(43,211,154,.08);
        opacity: 1;
      }
      .goal-payment-modal {
        position: fixed;
        z-index: 4500;
        inset: 0;
      }
      .goal-payment-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.74);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
      }
      .goal-payment-sheet {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        padding:
          18px
          18px
          calc(22px + env(safe-area-inset-bottom));
        border-radius: 26px 26px 0 0;
        border: 1px solid rgba(255,255,255,.10);
        background:
          linear-gradient(
            180deg,
            rgba(18,43,69,.99),
            rgba(8,23,38,.99)
          );
      }
      .goal-payment-head {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 16px;
      }
      .goal-payment-head span {
        color: #67baff;
        font-size: 10px;
        font-weight: 900;
        letter-spacing: .14em;
      }
      .goal-payment-head h2 {
        margin: 5px 0 0;
        font-size: 22px;
      }
      .goal-payment-close {
        width: 40px;
        height: 40px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 13px;
        color: inherit;
        background: rgba(255,255,255,.05);
        font-size: 25px;
      }
      .goal-payment-summary {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 10px;
        margin-bottom: 15px;
      }
      .goal-payment-summary > div {
        padding: 13px;
        border-radius: 14px;
        background: rgba(255,255,255,.04);
        border: 1px solid rgba(255,255,255,.06);
      }
      .goal-payment-summary span,
      .goal-payment-summary strong {
        display: block;
      }
      .goal-payment-summary span {
        margin-bottom: 5px;
        color: #8fa2ba;
        font-size: 9px;
      }
      .goal-payment-summary strong {
        font-size: 13px;
      }
      .goal-payment-label {
        display: grid;
        gap: 7px;
        margin-bottom: 15px;
        color: #b9c8d8;
        font-size: 11px;
        font-weight: 750;
      }
      .goal-payment-label input {
        width: 100%;
        min-height: 48px;
        padding: 0 13px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 14px;
        color: inherit;
        background: rgba(255,255,255,.055);
        font: inherit;
        box-sizing: border-box;
      }
      .goal-payment-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
      .goal-payment-primary,
      .goal-payment-secondary {
        min-height: 48px;
        border-radius: 14px;
        font: inherit;
        font-weight: 850;
      }
      .goal-payment-primary {
        border: 0;
        color: #fff;
        background: linear-gradient(135deg,#0f8cff,#1aa1ff);
      }
      .goal-payment-secondary {
        border: 1px solid rgba(255,255,255,.10);
        color: inherit;
        background: rgba(255,255,255,.04);
      }
      .custom-goal-pin-row {
        display: flex !important;
        align-items: center !important;
        gap: 10px !important;
        width: 100%;
        margin: 8px 0 18px !important;
        overflow: hidden;
      }
      .custom-goal-pin-row input {
        width: 22px !important;
        height: 22px !important;
        flex: 0 0 22px !important;
        margin: 0 !important;
      }
      .custom-goal-pin-row span {
        min-width: 0;
        color: #b9c8d8;
        font-size: 11px;
        line-height: 1.35;
      }
    `;
    document.head.appendChild(style);
  }
});
// =========================================
// YF v2.7 — Profesyonel Kart Görünümü
// Bu kod app.js dosyasının EN ALTINA eklenir.
// Mevcut hesaplama ve ödeme sistemine dokunmaz.
// =========================================
document.addEventListener("DOMContentLoaded", () => {
  installProfessionalCardStyles();
  decorateCards();
  document
    .querySelectorAll('[data-page="cardsPage"]')
    .forEach(button => {
      button.addEventListener("click", () => {
        setTimeout(decorateCards, 220);
      });
    });
  const cardsList = document.getElementById("cardsList");
  if (cardsList) {
    const observer = new MutationObserver(() => {
      decorateCards();
    });
    observer.observe(cardsList, {
      childList: true,
      subtree: true
    });
  }
  function decorateCards() {
    document
      .querySelectorAll("#cardsList .bank-card")
      .forEach(card => {
        const bankText =
          card.querySelector(".bank-card-header span")
            ?.textContent
            ?.trim() || "";
        const debtText =
          card.querySelector(".bank-card-debt")
            ?.textContent || "";
        const debt = parseMoney(debtText);
        const lower = bankText.toLocaleLowerCase("tr-TR");
        card.classList.remove(
          "pro-bank-ziraat",
          "pro-bank-garanti",
          "pro-bank-akbank",
          "pro-bank-qnb",
          "pro-bank-is",
          "pro-bank-tom",
          "pro-bank-other",
          "pro-card-completed"
        );
        if (lower.includes("ziraat")) {
          card.classList.add("pro-bank-ziraat");
        } else if (lower.includes("garanti")) {
          card.classList.add("pro-bank-garanti");
        } else if (lower.includes("akbank")) {
          card.classList.add("pro-bank-akbank");
        } else if (lower.includes("qnb")) {
          card.classList.add("pro-bank-qnb");
        } else if (lower.includes("iş")) {
          card.classList.add("pro-bank-is");
        } else if (lower.includes("tom")) {
          card.classList.add("pro-bank-tom");
        } else {
          card.classList.add("pro-bank-other");
        }
        if (debt <= 0) {
          card.classList.add("pro-card-completed");
        }
        addBankLogo(card, bankText);
        addCardStatus(card, debt);
      });
  }
  function addBankLogo(card, bankName) {
    const header = card.querySelector(".bank-card-header");
    const titleBox = header?.querySelector("div");
    if (!header || !titleBox) return;
    if (header.querySelector(".pro-bank-logo")) return;
    const logo = document.createElement("div");
    logo.className = "pro-bank-logo";
    logo.textContent =
      bankName?.trim()?.charAt(0)?.toLocaleUpperCase("tr-TR") || "B";
    header.insertBefore(logo, titleBox);
  }
  function addCardStatus(card, debt) {
    if (card.querySelector(".pro-card-status")) return;
    const debtElement = card.querySelector(".bank-card-debt");
    if (!debtElement) return;
    const status = document.createElement("div");
    status.className = "pro-card-status";
    if (debt <= 0) {
      status.classList.add("completed");
      status.textContent = "Borç tamamlandı ✓";
    } else if (card.classList.contains("loan-bank-card")) {
      status.classList.add("loan");
      status.textContent = "Aktif ihtiyaç kredisi";
    } else {
      status.classList.add("active");
      status.textContent = "Aktif kredi kartı";
    }
    debtElement.insertAdjacentElement("afterend", status);
  }
  function parseMoney(value) {
    const normalized = String(value || "")
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    return Number(normalized) || 0;
  }
  function installProfessionalCardStyles() {
    if (document.getElementById("yfProfessionalCardStyles")) return;
    const style = document.createElement("style");
    style.id = "yfProfessionalCardStyles";
    style.textContent = `
      #cardsList .bank-card {
        position: relative;
        overflow: hidden;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 24px;
        padding: 18px;
        background:
          radial-gradient(
            circle at 88% 15%,
            rgba(255,255,255,.12),
            transparent 30%
          ),
          linear-gradient(
            145deg,
            rgba(25,57,88,.98),
            rgba(10,31,52,.98)
          );
        box-shadow:
          0 20px 46px rgba(0,0,0,.22),
          inset 0 1px 0 rgba(255,255,255,.05);
        transition:
          transform .2s ease,
          border-color .2s ease,
          box-shadow .2s ease;
      }
      #cardsList .bank-card:active {
        transform: scale(.988);
      }
      #cardsList .bank-card::after {
        content: "";
        position: absolute;
        right: -55px;
        bottom: -70px;
        width: 180px;
        height: 180px;
        border-radius: 50%;
        background: rgba(255,255,255,.045);
        pointer-events: none;
      }
      #cardsList .bank-card-header {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      #cardsList .bank-card-header > div:not(.bank-card-actions):not(.pro-bank-logo) {
        min-width: 0;
        flex: 1;
      }
      .pro-bank-logo {
        width: 46px;
        height: 46px;
        flex: 0 0 46px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 15px;
        color: #fff;
        background: rgba(255,255,255,.12);
        border: 1px solid rgba(255,255,255,.12);
        font-size: 18px;
        font-weight: 950;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
      }
      #cardsList .bank-card-header > div > span {
        display: block;
        color: rgba(220,234,247,.72);
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .12em;
        text-transform: uppercase;
      }
      #cardsList .bank-card-header h3 {
        margin: 4px 0 0;
        overflow: hidden;
        color: #fff;
        font-size: 16px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      #cardsList .bank-card-debt {
        position: relative;
        z-index: 2;
        display: block;
        margin-top: 18px;
        color: #fff;
        font-size: 29px;
        line-height: 1;
        letter-spacing: -.03em;
      }
      .pro-card-status {
        position: relative;
        z-index: 2;
        display: inline-flex;
        align-items: center;
        min-height: 25px;
        margin-top: 10px;
        padding: 0 9px;
        border-radius: 999px;
        font-size: 8.5px;
        font-weight: 900;
      }
      .pro-card-status.active {
        color: #76c4ff;
        background: rgba(15,140,255,.12);
        border: 1px solid rgba(72,171,255,.18);
      }
      .pro-card-status.loan {
        color: #ffd277;
        background: rgba(255,177,72,.11);
        border: 1px solid rgba(255,177,72,.18);
      }
      .pro-card-status.completed {
        color: #4ce0aa;
        background: rgba(43,211,154,.11);
        border: 1px solid rgba(43,211,154,.18);
      }
      #cardsList .bank-card-actions {
        display: flex;
        flex: 0 0 auto;
        gap: 6px;
      }
      #cardsList .bank-card-actions button {
        min-height: 32px;
        padding: 0 9px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 10px;
        color: #dce9f5;
        background: rgba(255,255,255,.055);
        font-size: 8.5px;
        font-weight: 800;
      }
      #cardsList .card-minimum-status,
      #cardsList .loan-installment-box > div,
      #cardsList .bank-card-details > div,
      #cardsList .bank-card-dates > div {
        position: relative;
        z-index: 2;
        backdrop-filter: blur(7px);
        -webkit-backdrop-filter: blur(7px);
      }
      #cardsList .card-minimum-status {
        margin-top: 15px;
        border-color: rgba(255,255,255,.08);
        background: rgba(4,17,30,.24);
      }
      #cardsList .bank-card-details,
      #cardsList .bank-card-dates {
        position: relative;
        z-index: 2;
      }
      #cardsList .bank-card-details > div,
      #cardsList .bank-card-dates > div,
      #cardsList .loan-installment-box > div {
        background: rgba(255,255,255,.045);
        border: 1px solid rgba(255,255,255,.055);
      }
      .pro-bank-ziraat {
        border-color: rgba(239,68,68,.25) !important;
        background:
          radial-gradient(circle at 88% 15%,rgba(239,68,68,.20),transparent 31%),
          linear-gradient(145deg,#4f1721,#201020) !important;
      }
      .pro-bank-garanti {
        border-color: rgba(45,212,191,.23) !important;
        background:
          radial-gradient(circle at 88% 15%,rgba(45,212,191,.18),transparent 31%),
          linear-gradient(145deg,#0d4d45,#0a2530) !important;
      }
      .pro-bank-akbank {
        border-color: rgba(255,78,104,.24) !important;
        background:
          radial-gradient(circle at 88% 15%,rgba(255,78,104,.18),transparent 31%),
          linear-gradient(145deg,#591629,#211020) !important;
      }
      .pro-bank-qnb {
        border-color: rgba(168,85,247,.24) !important;
        background:
          radial-gradient(circle at 88% 15%,rgba(168,85,247,.20),transparent 31%),
          linear-gradient(145deg,#3f1d63,#18132c) !important;
      }
      .pro-bank-is {
        border-color: rgba(59,130,246,.24) !important;
        background:
          radial-gradient(circle at 88% 15%,rgba(59,130,246,.19),transparent 31%),
          linear-gradient(145deg,#153f6e,#101c31) !important;
      }
      .pro-bank-tom {
        border-color: rgba(34,197,94,.22) !important;
        background:
          radial-gradient(circle at 88% 15%,rgba(34,197,94,.18),transparent 31%),
          linear-gradient(145deg,#164b34,#0e2824) !important;
      }
      .pro-bank-other {
        border-color: rgba(148,163,184,.20) !important;
      }
      .pro-card-completed {
        border-color: rgba(43,211,154,.30) !important;
        background:
          radial-gradient(circle at 88% 15%,rgba(43,211,154,.22),transparent 31%),
          linear-gradient(145deg,#104b3c,#0b2826) !important;
      }
      body.light-theme #cardsList .bank-card {
        color: #102033;
        box-shadow: 0 18px 40px rgba(18,57,90,.10);
      }
      body.light-theme #cardsList .bank-card-header h3,
      body.light-theme #cardsList .bank-card-debt {
        color: #fff;
      }
      @media(max-width:370px) {
        #cardsList .bank-card {
          padding: 15px;
        }
        #cardsList .bank-card-debt {
          font-size: 25px;
        }
        .pro-bank-logo {
          width: 41px;
          height: 41px;
          flex-basis: 41px;
        }
      }
    `;
    document.head.appendChild(style);
  }
});
// =========================================
// YF v2.8 — Takvimli Borç Takibi
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================
document.addEventListener("DOMContentLoaded", () => {
  const DEBT_KEY = "yf_cards_v1";
  const TX_KEY = "yf_transactions_v1";
  const PAGE_KEY = "yf_last_open_page_v1";
  let calendarDate = new Date();
  calendarDate.setDate(1);
  installCalendarStyles();
  createCalendarMenuItem();
  createCalendarPage();
  createCalendarDayModal();
  bindCalendarEvents();
  renderCalendar();
  function createCalendarMenuItem() {
    if (document.querySelector('[data-page="calendarPage"]')) return;
    const sideMenu =
      document.querySelector(".side-menu-content") ||
      document.querySelector(".side-menu");
    if (!sideMenu) return;
    const reference =
      document.querySelector('[data-page="remindersPage"]') ||
      document.querySelector('.side-menu-item[data-feature="Hatırlatmalar"]');
    const button = document.createElement("button");
    button.type = "button";
    button.className = "side-menu-item";
    button.dataset.page = "calendarPage";
    button.innerHTML = `
      <span class="side-menu-icon">📅</span>
      <span>Takvim</span>
    `;
    if (reference) {
      reference.insertAdjacentElement("afterend", button);
    } else {
      sideMenu.appendChild(button);
    }
  }
  function createCalendarPage() {
    if (document.getElementById("calendarPage")) return;
    const main = document.querySelector("main.app-shell");
    if (!main) return;
    const page = document.createElement("section");
    page.id = "calendarPage";
    page.className = "page";
    page.innerHTML = `
      <header class="top-header">
        <div>
          <p class="eyebrow">ÖDEME TAKVİMİ</p>
          <h1>Takvim</h1>
        </div>
        <button
          id="calendarBackButton"
          class="reports-back-button"
          type="button"
        >
          Ana Sayfa
        </button>
      </header>
      <section class="calendar-summary-grid">
        <article class="calendar-summary-card overdue">
          <span>Geciken</span>
          <strong id="calendarOverdueCount">0</strong>
        </article>
        <article class="calendar-summary-card today">
          <span>Bugün</span>
          <strong id="calendarTodayCount">0</strong>
        </article>
        <article class="calendar-summary-card upcoming">
          <span>Bu Ay</span>
          <strong id="calendarMonthCount">0</strong>
        </article>
        <article class="calendar-summary-card paid">
          <span>Ödenen</span>
          <strong id="calendarPaidCount">0</strong>
        </article>
      </section>
      <section class="content-card calendar-main-card">
        <div class="calendar-toolbar">
          <button id="calendarPrevMonth" type="button" aria-label="Önceki ay">
            ‹
          </button>
          <div>
            <span>AYLIK PLAN</span>
            <h2 id="calendarMonthTitle">Ağustos 2026</h2>
          </div>
          <button id="calendarNextMonth" type="button" aria-label="Sonraki ay">
            ›
          </button>
        </div>
        <div class="calendar-weekdays">
          <span>Pzt</span>
          <span>Sal</span>
          <span>Çar</span>
          <span>Per</span>
          <span>Cum</span>
          <span>Cmt</span>
          <span>Paz</span>
        </div>
        <div id="calendarGrid" class="calendar-grid"></div>
        <div class="calendar-legend">
          <span><i class="overdue"></i> Gecikmiş</span>
          <span><i class="today"></i> Bugün</span>
          <span><i class="upcoming"></i> Yaklaşan</span>
          <span><i class="paid"></i> Ödendi</span>
        </div>
      </section>
      <section class="content-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">BU AY</p>
            <h2>Ödeme planı</h2>
          </div>
        </div>
        <div id="calendarPaymentList" class="calendar-payment-list"></div>
      </section>
    `;
    main.appendChild(page);
  }
  function createCalendarDayModal() {
    if (document.getElementById("calendarDayModal")) return;
    const modal = document.createElement("div");
    modal.id = "calendarDayModal";
    modal.className = "calendar-day-modal hidden";
    modal.innerHTML = `
      <div class="calendar-day-backdrop"></div>
      <section class="calendar-day-sheet">
        <div class="calendar-day-head">
          <div>
            <span>GÜNÜN ÖDEMELERİ</span>
            <h2 id="calendarDayTitle">Tarih</h2>
          </div>
          <button id="calendarDayClose" type="button">×</button>
        </div>
        <div id="calendarDayList" class="calendar-day-list"></div>
      </section>
    `;
    document.body.appendChild(modal);
  }
  function bindCalendarEvents() {
    document.addEventListener("click", event => {
      const pageButton = event.target.closest('[data-page="calendarPage"]');
      if (pageButton) {
        closeSideMenu();
        showPage("calendarPage");
        localStorage.setItem(PAGE_KEY, "calendarPage");
        renderCalendar();
      }
    });
    document
      .getElementById("calendarBackButton")
      ?.addEventListener("click", () => {
        showPage("dashboardPage");
        localStorage.setItem(PAGE_KEY, "dashboardPage");
      });
    document
      .getElementById("calendarPrevMonth")
      ?.addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        renderCalendar();
      });
    document
      .getElementById("calendarNextMonth")
      ?.addEventListener("click", () => {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCalendar();
      });
    document
      .getElementById("calendarDayClose")
      ?.addEventListener("click", closeDayModal);
    document
      .querySelector(".calendar-day-backdrop")
      ?.addEventListener("click", closeDayModal);
    window.addEventListener("storage", renderCalendar);
    const saved = localStorage.getItem(PAGE_KEY);
    if (saved === "calendarPage") {
      setTimeout(() => {
        showPage("calendarPage");
        renderCalendar();
      }, 350);
    }
  }
  function renderCalendar() {
    const grid = document.getElementById("calendarGrid");
    if (!grid) return;
    const debts = loadJson(DEBT_KEY);
    const transactions = loadJson(TX_KEY);
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    document.getElementById("calendarMonthTitle").textContent =
      calendarDate.toLocaleDateString("tr-TR", {
        month: "long",
        year: "numeric"
      });
    const monthItems = createMonthItems(debts, transactions, year, month);
    updateSummary(monthItems);
    renderMonthGrid(grid, monthItems, year, month);
    renderMonthPaymentList(monthItems);
  }
  function createMonthItems(debts, transactions, year, month) {
    const items = [];
    debts
      .filter(item => Number(item.debt || 0) > 0)
      .forEach(item => {
        const isLoan = item.type === "personal-loan";
        const dateValue = isLoan
          ? item.nextPaymentDate || item.dueDate
          : item.dueDate;
        if (!dateValue) return;
        const date = parseDate(dateValue);
        if (!date) return;
        if (
          date.getFullYear() !== year ||
          date.getMonth() !== month
        ) {
          return;
        }
        const paid = isDebtPaidForDate(item, transactions, date);
        const amount = isLoan
          ? Math.min(
              Number(item.monthlyInstallment || 0),
              Number(item.debt || 0)
            )
          : getRemainingMinimum(item, transactions);
        const daysLeft = differenceInDays(date, new Date());
        items.push({
          id: item.id,
          bank: item.bank || "Banka",
          name: item.name || "",
          type: isLoan ? "loan" : "card",
          date,
          dateKey: toDateKey(date),
          amount,
          debt: Number(item.debt || 0),
          paid,
          status: paid
            ? "paid"
            : daysLeft < 0
              ? "overdue"
              : daysLeft === 0
                ? "today"
                : "upcoming"
        });
      });
    transactions
      .filter(transaction =>
        (
          transaction.type === "card-payment" ||
          transaction.type === "loan-payment"
        ) &&
        isSameMonth(transaction.createdAt || transaction.date, year, month)
      )
      .forEach(transaction => {
        const date = parseDate(transaction.createdAt || transaction.date);
        if (!date) return;
        const exists = items.some(item =>
          item.id === transaction.cardId &&
          item.dateKey === toDateKey(date) &&
          item.paid
        );
        if (exists) return;
        items.push({
          id: transaction.cardId || transaction.id,
          bank: transaction.cardName || transaction.name || "Ödeme",
          name:
            transaction.type === "loan-payment"
              ? "Kredi taksiti ödendi"
              : "Kart borcu ödendi",
          type:
            transaction.type === "loan-payment"
              ? "loan"
              : "card",
          date,
          dateKey: toDateKey(date),
          amount: Number(transaction.amount || 0),
          debt: 0,
          paid: true,
          status: "paid",
          historyOnly: true
        });
      });
    return items.sort((a, b) => a.date - b.date);
  }
  function renderMonthGrid(grid, items, year, month) {
    grid.innerHTML = "";
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const leading = (firstDay.getDay() + 6) % 7;
    const totalCells = Math.ceil((leading + lastDay.getDate()) / 7) * 7;
    for (let index = 0; index < totalCells; index++) {
      const dayNumber = index - leading + 1;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "calendar-day";
      if (dayNumber < 1 || dayNumber > lastDay.getDate()) {
        button.classList.add("empty");
        button.disabled = true;
        grid.appendChild(button);
        continue;
      }
      const date = new Date(year, month, dayNumber);
      const dateKey = toDateKey(date);
      const dayItems = items.filter(item => item.dateKey === dateKey);
      button.innerHTML = `
        <span class="calendar-day-number">${dayNumber}</span>
        <span class="calendar-day-dots"></span>
      `;
      if (toDateKey(new Date()) === dateKey) {
        button.classList.add("current-day");
      }
      const dots = button.querySelector(".calendar-day-dots");
      [...new Set(dayItems.map(item => item.status))]
        .slice(0, 3)
        .forEach(status => {
          const dot = document.createElement("i");
          dot.className = status;
          dots.appendChild(dot);
        });
      if (dayItems.length) {
        button.classList.add("has-payment");
        button.addEventListener("click", () => {
          openDayModal(date, dayItems);
        });
      }
      grid.appendChild(button);
    }
  }
  function renderMonthPaymentList(items) {
    const list = document.getElementById("calendarPaymentList");
    if (!list) return;
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = `
        <div class="empty-state">
          Bu ay için ödeme kaydı bulunmuyor.
        </div>
      `;
      return;
    }
    items.forEach(item => {
      const row = document.createElement("article");
      row.className = `calendar-payment-item ${item.status}`;
      row.innerHTML = `
        <div class="calendar-payment-date">
          <strong>${item.date.getDate()}</strong>
          <span>${item.date.toLocaleDateString("tr-TR", {
            month: "short"
          })}</span>
        </div>
        <div class="calendar-payment-info">
          <strong>${escapeHtml(item.bank)}</strong>
          <span>${escapeHtml(item.name)}</span>
          <small>
            ${item.type === "loan" ? "İhtiyaç Kredisi" : "Kredi Kartı"}
          </small>
        </div>
        <div class="calendar-payment-side">
          <strong>${formatMoney(item.amount)}</strong>
          <span>${statusText(item.status)}</span>
        </div>
      `;
      row.addEventListener("click", () => {
        openDayModal(item.date, [item]);
      });
      list.appendChild(row);
    });
  }
  function openDayModal(date, items) {
    const modal = document.getElementById("calendarDayModal");
    const title = document.getElementById("calendarDayTitle");
    const list = document.getElementById("calendarDayList");
    if (!modal || !title || !list) return;
    title.textContent = date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    list.innerHTML = "";
    items.forEach(item => {
      const row = document.createElement("article");
      row.className = `calendar-day-item ${item.status}`;
      row.innerHTML = `
        <div class="calendar-day-item-icon">
          ${item.type === "loan" ? "🏦" : "💳"}
        </div>
        <div class="calendar-day-item-info">
          <strong>${escapeHtml(item.bank)}</strong>
          <span>${escapeHtml(item.name)}</span>
          <small>${statusText(item.status)}</small>
        </div>
        <div class="calendar-day-item-side">
          <strong>${formatMoney(item.amount)}</strong>
          ${
            item.paid || item.historyOnly
              ? '<span class="calendar-paid-label">Ödendi ✓</span>'
              : '<button type="button">Şimdi Öde</button>'
          }
        </div>
      `;
      row.querySelector("button")?.addEventListener("click", () => {
        closeDayModal();
        openPaymentPage(item.id);
      });
      list.appendChild(row);
    });
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }
  function closeDayModal() {
    document
      .getElementById("calendarDayModal")
      ?.classList.add("hidden");
    document.body.style.overflow = "";
  }
  function openPaymentPage(debtId) {
    document
      .querySelector('[data-page="debtPaymentPage"]')
      ?.click();
    setTimeout(() => {
      const select = document.getElementById("debtPaymentCard");
      if (!select) return;
      select.value = debtId;
      select.dispatchEvent(
        new Event("change", { bubbles: true })
      );
      document
        .getElementById("debtPickerButtonText")
        ?.dispatchEvent(new Event("change", { bubbles: true }));
    }, 260);
  }
  function updateSummary(items) {
    const nowKey = toDateKey(new Date());
    setText(
      "calendarOverdueCount",
      items.filter(item => item.status === "overdue").length
    );
    setText(
      "calendarTodayCount",
      items.filter(item =>
        item.dateKey === nowKey &&
        item.status !== "paid"
      ).length
    );
    setText(
      "calendarMonthCount",
      items.filter(item => !item.historyOnly).length
    );
    setText(
      "calendarPaidCount",
      items.filter(item => item.status === "paid").length
    );
  }
  function getRemainingMinimum(card, transactions) {
    const statementDebt = Number(
      card.statementDebt !== undefined
        ? card.statementDebt
        : card.debt || 0
    );
    const minimum = roundMoney(statementDebt * 0.20);
    const cycle =
      card.statementCycle ||
      cycleKey(card.dueDate);
    const paid = roundMoney(
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
            new Date(card.dueDate).getFullYear(),
            new Date(card.dueDate).getMonth()
          );
        })
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount || 0),
          0
        )
    );
    return roundMoney(Math.max(0, minimum - paid));
  }
  function isDebtPaidForDate(debt, transactions, date) {
    const paymentType =
      debt.type === "personal-loan"
        ? "loan-payment"
        : "card-payment";
    return transactions.some(transaction => {
      if (
        transaction.type !== paymentType ||
        transaction.cardId !== debt.id
      ) {
        return false;
      }
      return isSameMonth(
        transaction.createdAt || transaction.date,
        date.getFullYear(),
        date.getMonth()
      );
    });
  }
  function statusText(status) {
    const labels = {
      overdue: "Gecikmiş",
      today: "Bugün",
      upcoming: "Yaklaşan",
      paid: "Ödendi"
    };
    return labels[status] || "";
  }
  function differenceInDays(first, second) {
    const a = new Date(first);
    const b = new Date(second);
    a.setHours(0, 0, 0, 0);
    b.setHours(0, 0, 0, 0);
    return Math.round((a - b) / 86400000);
  }
  function parseDate(value) {
    if (!value) return null;
    const date = new Date(
      String(value).includes("T")
        ? value
        : `${value}T12:00:00`
    );
    return Number.isNaN(date.getTime()) ? null : date;
  }
  function isSameMonth(value, year, month) {
    const date = parseDate(value);
    return Boolean(
      date &&
      date.getFullYear() === year &&
      date.getMonth() === month
    );
  }
  function cycleKey(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}`;
    const now = new Date();
    return `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`;
  }
  function toDateKey(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }
  function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
      page.classList.toggle("active", page.id === pageId);
    });
    document
      .querySelectorAll(".bottom-navigation .nav-item")
      .forEach(item => {
        item.classList.toggle(
          "active",
          item.dataset.page === pageId
        );
      });
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function closeSideMenu() {
    const layer = document.getElementById("sideMenuLayer");
    layer?.classList.remove("open");
    layer?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
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
  function roundMoney(value) {
    return Math.round(
      (Number(value) + Number.EPSILON) * 100
    ) / 100;
  }
  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }
  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = String(value);
    }
  }
  function installCalendarStyles() {
    if (document.getElementById("yfCalendarStyles")) return;
    const style = document.createElement("style");
    style.id = "yfCalendarStyles";
    style.textContent = `
      .calendar-summary-grid {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 11px;
        margin-bottom: 14px;
      }
      .calendar-summary-card {
        padding: 16px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 18px;
        background: rgba(255,255,255,.04);
      }
      .calendar-summary-card span,
      .calendar-summary-card strong {
        display: block;
      }
      .calendar-summary-card span {
        margin-bottom: 7px;
        color: #8fa2ba;
        font-size: 11px;
      }
      .calendar-summary-card strong {
        font-size: 24px;
      }
      .calendar-summary-card.overdue {
        border-color: rgba(255,91,122,.20);
        background: rgba(255,91,122,.06);
      }
      .calendar-summary-card.today {
        border-color: rgba(255,177,72,.20);
        background: rgba(255,177,72,.06);
      }
      .calendar-summary-card.upcoming {
        border-color: rgba(72,171,255,.20);
        background: rgba(15,140,255,.06);
      }
      .calendar-summary-card.paid {
        border-color: rgba(43,211,154,.20);
        background: rgba(43,211,154,.06);
      }
      .calendar-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 13px;
        margin-bottom: 17px;
      }
      .calendar-toolbar > button {
        width: 42px;
        height: 42px;
        flex: 0 0 42px;
        border: 1px solid rgba(255,255,255,.09);
        border-radius: 13px;
        color: #75c3ff;
        background: rgba(255,255,255,.04);
        font-size: 27px;
      }
      .calendar-toolbar > div {
        text-align: center;
      }
      .calendar-toolbar span {
        color: #67baff;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .14em;
      }
      .calendar-toolbar h2 {
        margin: 5px 0 0;
        font-size: 19px;
        text-transform: capitalize;
      }
      .calendar-weekdays,
      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7,minmax(0,1fr));
        gap: 6px;
      }
      .calendar-weekdays {
        margin-bottom: 7px;
      }
      .calendar-weekdays span {
        color: #7f93a8;
        font-size: 8px;
        font-weight: 850;
        text-align: center;
      }
      .calendar-day {
        position: relative;
        min-width: 0;
        aspect-ratio: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        border: 1px solid rgba(255,255,255,.06);
        border-radius: 12px;
        color: inherit;
        background: rgba(255,255,255,.025);
        font: inherit;
      }
      .calendar-day.empty {
        opacity: 0;
      }
      .calendar-day.has-payment {
        background: rgba(15,140,255,.05);
        border-color: rgba(72,171,255,.13);
      }
      .calendar-day.current-day {
        border-color: rgba(72,171,255,.32);
        box-shadow: inset 0 0 0 1px rgba(72,171,255,.10);
      }
      .calendar-day-number {
        font-size: 11px;
        font-weight: 800;
      }
      .calendar-day-dots {
        min-height: 5px;
        display: flex;
        gap: 3px;
      }
      .calendar-day-dots i,
      .calendar-legend i {
        width: 5px;
        height: 5px;
        display: inline-block;
        border-radius: 50%;
      }
      .calendar-day-dots i.overdue,
      .calendar-legend i.overdue {
        background: #ff647f;
      }
      .calendar-day-dots i.today,
      .calendar-legend i.today {
        background: #ffb348;
      }
      .calendar-day-dots i.upcoming,
      .calendar-legend i.upcoming {
        background: #47a8ff;
      }
      .calendar-day-dots i.paid,
      .calendar-legend i.paid {
        background: #2bd39b;
      }
      .calendar-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-top: 15px;
        color: #8093a8;
        font-size: 8.5px;
      }
      .calendar-legend span {
        display: inline-flex;
        align-items: center;
        gap: 5px;
      }
      .calendar-payment-list,
      .calendar-day-list {
        display: grid;
        gap: 10px;
      }
      .calendar-payment-item,
      .calendar-day-item {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 13px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 16px;
        background: rgba(255,255,255,.035);
      }
      .calendar-payment-item.overdue,
      .calendar-day-item.overdue {
        border-color: rgba(255,91,122,.18);
      }
      .calendar-payment-item.today,
      .calendar-day-item.today {
        border-color: rgba(255,177,72,.18);
      }
      .calendar-payment-item.paid,
      .calendar-day-item.paid {
        border-color: rgba(43,211,154,.18);
      }
      .calendar-payment-date {
        width: 42px;
        height: 48px;
        flex: 0 0 42px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        border-radius: 13px;
        background: rgba(15,140,255,.09);
      }
      .calendar-payment-date strong {
        font-size: 16px;
      }
      .calendar-payment-date span {
        margin-top: 2px;
        color: #8fa2ba;
        font-size: 8px;
        text-transform: uppercase;
      }
      .calendar-payment-info,
      .calendar-day-item-info {
        min-width: 0;
        flex: 1;
      }
      .calendar-payment-info strong,
      .calendar-payment-info span,
      .calendar-payment-info small,
      .calendar-day-item-info strong,
      .calendar-day-item-info span,
      .calendar-day-item-info small {
        display: block;
      }
      .calendar-payment-info strong,
      .calendar-day-item-info strong {
        font-size: 12px;
      }
      .calendar-payment-info span,
      .calendar-day-item-info span {
        margin-top: 3px;
        color: #aebfd0;
        font-size: 9.5px;
      }
      .calendar-payment-info small,
      .calendar-day-item-info small {
        margin-top: 5px;
        color: #75899f;
        font-size: 8px;
      }
      .calendar-payment-side,
      .calendar-day-item-side {
        flex: 0 0 auto;
        text-align: right;
      }
      .calendar-payment-side strong,
      .calendar-payment-side span,
      .calendar-day-item-side strong {
        display: block;
      }
      .calendar-payment-side strong,
      .calendar-day-item-side strong {
        font-size: 11px;
      }
      .calendar-payment-side span {
        margin-top: 5px;
        color: #8093a8;
        font-size: 8px;
      }
      .calendar-day-modal {
        position: fixed;
        z-index: 5000;
        inset: 0;
      }
      .calendar-day-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.74);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
      }
      .calendar-day-sheet {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        max-height: 78vh;
        overflow-y: auto;
        padding:
          18px
          18px
          calc(22px + env(safe-area-inset-bottom));
        border-radius: 26px 26px 0 0;
        border: 1px solid rgba(255,255,255,.10);
        background:
          linear-gradient(
            180deg,
            rgba(18,43,69,.99),
            rgba(8,23,38,.99)
          );
      }
      .calendar-day-head {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 15px;
      }
      .calendar-day-head span {
        color: #67baff;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .14em;
      }
      .calendar-day-head h2 {
        margin: 5px 0 0;
        font-size: 21px;
      }
      .calendar-day-head button {
        width: 40px;
        height: 40px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 13px;
        color: inherit;
        background: rgba(255,255,255,.05);
        font-size: 25px;
      }
      .calendar-day-item-icon {
        width: 40px;
        height: 40px;
        flex: 0 0 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 13px;
        background: rgba(15,140,255,.09);
      }
      .calendar-day-item-side button {
        min-height: 30px;
        margin-top: 7px;
        padding: 0 9px;
        border: 1px solid rgba(72,171,255,.22);
        border-radius: 10px;
        color: #74c2ff;
        background: rgba(15,140,255,.10);
        font-size: 8px;
        font-weight: 850;
      }
      .calendar-paid-label {
        display: block;
        margin-top: 6px;
        color: #4ce0aa;
        font-size: 8px;
        font-weight: 850;
      }
      @media(max-width:370px) {
        .calendar-weekdays,
        .calendar-grid {
          gap: 4px;
        }
        .calendar-day {
          border-radius: 9px;
        }
        .calendar-day-number {
          font-size: 10px;
        }
      }
    `;
    document.head.appendChild(style);
  }
});
// =========================================
// YF v2.8.1 — Takvim Menüsü Kesin Düzeltme
// Bu kod app.js dosyasının EN ALTINA eklenir.
// Mevcut v2.8 takvim kodunu silme.
// =========================================
document.addEventListener("DOMContentLoaded", () => {
  const PAGE_KEY = "yf_last_open_page_v1";
  setTimeout(() => {
    const calendarPage = document.getElementById("calendarPage");
    if (!calendarPage) return;
    let calendarButton = document.querySelector(
      '.side-menu-item[data-page="calendarPage"]'
    );
    if (!calendarButton) {
      const allMenuItems = [
        ...document.querySelectorAll(".side-menu-item")
      ];
      const remindersButton = allMenuItems.find(item =>
        item.textContent
          ?.toLocaleLowerCase("tr-TR")
          .includes("hatırlatmalar")
      );
      const goalsButton = allMenuItems.find(item =>
        item.textContent
          ?.toLocaleLowerCase("tr-TR")
          .includes("hedefler")
      );
      calendarButton = document.createElement("button");
      calendarButton.type = "button";
      calendarButton.className = "side-menu-item";
      calendarButton.dataset.page = "calendarPage";
      calendarButton.innerHTML = `
        <span class="side-menu-icon">📅</span>
        <span>Takvim</span>
      `;
      if (remindersButton) {
        remindersButton.insertAdjacentElement(
          "afterend",
          calendarButton
        );
      } else if (goalsButton) {
        goalsButton.insertAdjacentElement(
          "afterend",
          calendarButton
        );
      } else {
        const menuContainer =
          document.querySelector(".side-menu-content") ||
          document.querySelector("#sideMenuLayer .side-menu") ||
          document.querySelector("#sideMenuLayer");
        menuContainer?.appendChild(calendarButton);
      }
    }
    calendarButton?.addEventListener("click", () => {
      document
        .querySelectorAll(".page")
        .forEach(page => {
          page.classList.toggle(
            "active",
            page.id === "calendarPage"
          );
        });
      document
        .querySelectorAll(".bottom-navigation .nav-item")
        .forEach(item => {
          item.classList.remove("active");
        });
      const layer = document.getElementById("sideMenuLayer");
      layer?.classList.remove("open");
      layer?.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      localStorage.setItem(PAGE_KEY, "calendarPage");
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
  }, 500);
});
// =========================================
// YF v3.1 — Banka / Kart Detay Paneli
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const DEBT_KEY = "yf_cards_v1";
  const TX_KEY = "yf_transactions_v1";
  const PAGE_KEY = "yf_last_open_page_v1";

  installDetailStyles();
  createDetailPage();
  bindDetailEvents();

  function createDetailPage() {
    if (document.getElementById("cardDetailPage")) return;

    const main = document.querySelector("main.app-shell");
    if (!main) return;

    const page = document.createElement("section");
    page.id = "cardDetailPage";
    page.className = "page";

    page.innerHTML = `
      <header class="top-header">
        <div>
          <p class="eyebrow">BANKA PANELİ</p>
          <h1 id="detailPageTitle">Kart Detayı</h1>
        </div>

        <button
          id="detailBackButton"
          class="reports-back-button"
          type="button"
        >
          Kartlar
        </button>
      </header>

      <section id="detailHeroCard" class="detail-hero-card">
        <div class="detail-bank-head">
          <div id="detailBankLogo" class="detail-bank-logo">B</div>

          <div class="detail-bank-name">
            <span id="detailDebtType">Kredi Kartı</span>
            <h2 id="detailBankName">Banka</h2>
            <small id="detailCardName">Kart</small>
          </div>

          <span id="detailStatusBadge" class="detail-status-badge">
            Aktif
          </span>
        </div>

        <div class="detail-main-debt">
          <span>Kalan Borç</span>
          <strong id="detailCurrentDebt">₺0,00</strong>
        </div>

        <div id="detailProgressTrack" class="detail-progress-track">
          <div id="detailProgressFill"></div>
        </div>

        <div id="detailProgressText" class="detail-progress-text">
          Borç kullanımı %0
        </div>
      </section>

      <section id="detailSummaryGrid" class="detail-summary-grid"></section>

      <section class="content-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">HIZLI İŞLEMLER</p>
            <h2>Ne yapmak istiyorsun?</h2>
          </div>
        </div>

        <div class="detail-action-grid">
          <button id="detailPayButton" type="button">
            <span>💸</span>
            <strong>Borç Öde</strong>
          </button>

          <button id="detailEditButton" type="button">
            <span>✏️</span>
            <strong>Düzenle</strong>
          </button>

          <button id="detailDeleteButton" class="danger" type="button">
            <span>🗑️</span>
            <strong>Sil</strong>
          </button>
        </div>
      </section>

      <section class="content-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">SON 6 AY</p>
            <h2>Ödeme grafiği</h2>
          </div>
        </div>

        <div id="detailChart" class="detail-chart"></div>
      </section>

      <section class="content-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">GEÇMİŞ</p>
            <h2>Son işlemler</h2>
          </div>
        </div>

        <div id="detailTransactionList" class="detail-transaction-list"></div>
      </section>
    `;

    main.appendChild(page);
  }

  function bindDetailEvents() {
    const cardsList = document.getElementById("cardsList");

    cardsList?.addEventListener("click", event => {
      if (
        event.target.closest("button") ||
        event.target.closest("[data-edit]") ||
        event.target.closest("[data-delete]") ||
        event.target.closest("[data-card-edit]") ||
        event.target.closest("[data-card-delete]") ||
        event.target.closest("[data-loan-edit]") ||
        event.target.closest("[data-loan-delete]")
      ) {
        return;
      }

      const cardElement = event.target.closest(".bank-card");
      if (!cardElement) return;

      const id = findDebtId(cardElement);
      if (!id) return;

      openDetailPage(id);
    });

    document
      .getElementById("detailBackButton")
      ?.addEventListener("click", () => {
        showPage("cardsPage");
        localStorage.setItem(PAGE_KEY, "cardsPage");
      });

    document
      .getElementById("detailPayButton")
      ?.addEventListener("click", () => {
        const id = document
          .getElementById("cardDetailPage")
          ?.dataset.debtId;

        if (!id) return;

        showPage("debtPaymentPage");

        setTimeout(() => {
          const select = document.getElementById("debtPaymentCard");
          if (!select) return;

          select.value = id;
          select.dispatchEvent(
            new Event("change", { bubbles: true })
          );
        }, 240);
      });

    document
      .getElementById("detailEditButton")
      ?.addEventListener("click", () => {
        const id = document
          .getElementById("cardDetailPage")
          ?.dataset.debtId;

        const debt = loadJson(DEBT_KEY).find(item => item.id === id);
        if (!debt) return;

        const editButton =
          document.querySelector(`[data-card-edit="${id}"]`) ||
          document.querySelector(`[data-loan-edit="${id}"]`) ||
          document.querySelector(`[data-edit="${id}"]`);

        if (editButton) {
          showPage("cardsPage");
          setTimeout(() => editButton.click(), 120);
        }
      });

    document
      .getElementById("detailDeleteButton")
      ?.addEventListener("click", () => {
        const page = document.getElementById("cardDetailPage");
        const id = page?.dataset.debtId;
        if (!id) return;

        const debts = loadJson(DEBT_KEY);
        const debt = debts.find(item => item.id === id);
        if (!debt) return;

        const typeText =
          debt.type === "personal-loan"
            ? "ihtiyaç kredisi"
            : "kredi kartı";

        if (
          !confirm(
            `${debt.bank} ${typeText} kaydı tamamen silinsin mi?`
          )
        ) {
          return;
        }

        saveJson(
          DEBT_KEY,
          debts.filter(item => item.id !== id)
        );

        showPage("cardsPage");
        window.location.reload();
      });

    window.addEventListener("storage", () => {
      const page = document.getElementById("cardDetailPage");

      if (page?.classList.contains("active") && page.dataset.debtId) {
        renderDetail(page.dataset.debtId);
      }
    });
  }

  function findDebtId(cardElement) {
    const action =
      cardElement.querySelector("[data-card-edit]") ||
      cardElement.querySelector("[data-loan-edit]") ||
      cardElement.querySelector("[data-edit]") ||
      cardElement.querySelector("[data-card-delete]") ||
      cardElement.querySelector("[data-loan-delete]") ||
      cardElement.querySelector("[data-delete]");

    if (!action) return "";

    return (
      action.dataset.cardEdit ||
      action.dataset.loanEdit ||
      action.dataset.edit ||
      action.dataset.cardDelete ||
      action.dataset.loanDelete ||
      action.dataset.delete ||
      ""
    );
  }

  function openDetailPage(id) {
    renderDetail(id);
    showPage("cardDetailPage");
    localStorage.setItem(PAGE_KEY, "cardDetailPage");
  }

  function renderDetail(id) {
    const debts = loadJson(DEBT_KEY);
    const transactions = loadJson(TX_KEY);
    const debt = debts.find(item => item.id === id);

    if (!debt) {
      alert("Kart veya kredi bulunamadı.");
      showPage("cardsPage");
      return;
    }

    const page = document.getElementById("cardDetailPage");
    if (!page) return;

    page.dataset.debtId = id;

    const isLoan = debt.type === "personal-loan";
    const currentDebt = Number(debt.debt || 0);
    const limit = Number(debt.limit || 0);
    const available = Math.max(0, limit - currentDebt);

    const originalDebt = isLoan
      ? Number(debt.originalDebt || currentDebt)
      : limit;

    const progress = originalDebt > 0
      ? Math.min(
          100,
          Math.round(
            isLoan
              ? ((originalDebt - currentDebt) / originalDebt) * 100
              : (currentDebt / originalDebt) * 100
          )
        )
      : 0;

    setText("detailPageTitle", debt.bank || "Kart Detayı");
    setText("detailBankName", debt.bank || "Banka");
    setText("detailCardName", debt.name || "");
    setText(
      "detailDebtType",
      isLoan ? "İhtiyaç Kredisi" : "Kredi Kartı"
    );
    setText("detailCurrentDebt", formatMoney(currentDebt));

    const logo = document.getElementById("detailBankLogo");
    if (logo) {
      logo.textContent =
        String(debt.bank || "B").charAt(0).toLocaleUpperCase("tr-TR");
    }

    const badge = document.getElementById("detailStatusBadge");
    if (badge) {
      if (currentDebt <= 0) {
        badge.textContent = "Borç Kapandı ✓";
        badge.className = "detail-status-badge completed";
      } else if (isLoan) {
        badge.textContent = "Aktif Kredi";
        badge.className = "detail-status-badge loan";
      } else {
        badge.textContent = "Aktif Kart";
        badge.className = "detail-status-badge active";
      }
    }

    const hero = document.getElementById("detailHeroCard");
    if (hero) {
      hero.className =
        `detail-hero-card ${bankTheme(debt.bank)} ` +
        `${currentDebt <= 0 ? "completed" : ""}`;
    }

    const fill = document.getElementById("detailProgressFill");
    if (fill) fill.style.width = `${progress}%`;

    setText(
      "detailProgressText",
      isLoan
        ? `Kredinin %${progress} kadarı ödendi`
        : `Kart limitinin %${progress} kadarı kullanılıyor`
    );

    renderSummary(debt, {
      isLoan,
      currentDebt,
      limit,
      available,
      progress
    });

    renderChart(debt, transactions);
    renderTransactions(debt, transactions);
  }

  function renderSummary(debt, info) {
    const grid = document.getElementById("detailSummaryGrid");
    if (!grid) return;

    if (info.isLoan) {
      grid.innerHTML = `
        ${summaryCard(
          "Aylık Taksit",
          formatMoney(debt.monthlyInstallment)
        )}
        ${summaryCard(
          "Kalan Taksit",
          String(Number(debt.remainingInstallments || 0))
        )}
        ${summaryCard(
          "Ödeme Günü",
          `Her ayın ${Number(debt.paymentDay || 0)}'i`
        )}
        ${summaryCard(
          "Sonraki Ödeme",
          formatDate(debt.nextPaymentDate || debt.dueDate)
        )}
      `;
    } else {
      grid.innerHTML = `
        ${summaryCard("Kart Limiti", formatMoney(info.limit))}
        ${summaryCard("Kullanılabilir", formatMoney(info.available))}
        ${summaryCard(
          "Hesap Kesim",
          formatDate(debt.statementDate)
        )}
        ${summaryCard(
          "Son Ödeme",
          formatDate(debt.dueDate)
        )}
      `;
    }
  }

  function summaryCard(label, value) {
    return `
      <article class="detail-summary-card">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </article>
    `;
  }

  function renderChart(debt, transactions) {
    const chart = document.getElementById("detailChart");
    if (!chart) return;

    const monthData = getLastSixMonths().map(month => {
      const total = transactions
        .filter(transaction => {
          if (transaction.cardId !== debt.id) return false;

          const date = parseDate(
            transaction.createdAt || transaction.date
          );

          return Boolean(
            date &&
            date.getFullYear() === month.year &&
            date.getMonth() === month.month &&
            (
              transaction.type === "card-payment" ||
              transaction.type === "loan-payment"
            )
          );
        })
        .reduce(
          (sum, transaction) =>
            sum + Number(transaction.amount || 0),
          0
        );

      return { ...month, total };
    });

    const max = Math.max(
      1,
      ...monthData.map(item => item.total)
    );

    chart.innerHTML = monthData
      .map(item => {
        const height = Math.max(
          item.total > 0 ? 12 : 3,
          Math.round((item.total / max) * 100)
        );

        return `
          <div class="detail-chart-column">
            <div class="detail-chart-value">
              ${item.total > 0 ? formatCompactMoney(item.total) : ""}
            </div>

            <div class="detail-chart-bar-wrap">
              <div
                class="detail-chart-bar"
                style="height:${height}%"
              ></div>
            </div>

            <span>${item.label}</span>
          </div>
        `;
      })
      .join("");
  }

  function renderTransactions(debt, transactions) {
    const list = document.getElementById("detailTransactionList");
    if (!list) return;

    const related = transactions
      .filter(transaction => transaction.cardId === debt.id)
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.date) -
          new Date(a.createdAt || a.date)
      )
      .slice(0, 10);

    list.innerHTML = "";

    if (!related.length) {
      list.innerHTML = `
        <div class="empty-state">
          Bu karta ait işlem bulunmuyor.
        </div>
      `;
      return;
    }

    related.forEach(transaction => {
      const isPayment =
        transaction.type === "card-payment" ||
        transaction.type === "loan-payment";

      const isIncome = transaction.type === "income";

      const item = document.createElement("article");
      item.className = "detail-transaction-item";

      item.innerHTML = `
        <div class="detail-transaction-icon ${
          isPayment ? "payment" : isIncome ? "income" : "expense"
        }">
          ${isPayment ? "✓" : isIncome ? "+" : "−"}
        </div>

        <div class="detail-transaction-info">
          <strong>
            ${escapeHtml(
              transaction.name ||
              transaction.category ||
              "İşlem"
            )}
          </strong>

          <span>
            ${escapeHtml(transactionLabel(transaction))}
          </span>

          <small>
            ${formatDateTime(
              transaction.createdAt || transaction.date
            )}
          </small>
        </div>

        <strong class="detail-transaction-amount ${
          isPayment || isIncome ? "positive" : "negative"
        }">
          ${isPayment || isIncome ? "+" : "-"}
          ${formatMoney(transaction.amount)}
        </strong>
      `;

      list.appendChild(item);
    });
  }

  function transactionLabel(transaction) {
    if (transaction.type === "card-payment") {
      return transaction.paymentKind === "minimum"
        ? "Asgari ödeme"
        : "Kart borcu ödemesi";
    }

    if (transaction.type === "loan-payment") {
      return "Kredi taksit ödemesi";
    }

    return transaction.category || "İşlem";
  }

  function getLastSixMonths() {
    const now = new Date();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      );

      result.push({
        year: date.getFullYear(),
        month: date.getMonth(),
        label: date.toLocaleDateString("tr-TR", {
          month: "short"
        })
      });
    }

    return result;
  }

  function bankTheme(bank) {
    const value = String(bank || "")
      .toLocaleLowerCase("tr-TR");

    if (value.includes("ziraat")) return "detail-ziraat";
    if (value.includes("garanti")) return "detail-garanti";
    if (value.includes("akbank")) return "detail-akbank";
    if (value.includes("qnb")) return "detail-qnb";
    if (value.includes("iş")) return "detail-is";
    if (value.includes("tom")) return "detail-tom";

    return "detail-other";
  }

  function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
      page.classList.toggle("active", page.id === pageId);
    });

    document
      .querySelectorAll(".bottom-navigation .nav-item")
      .forEach(item => {
        item.classList.toggle(
          "active",
          item.dataset.page === pageId
        );
      });

    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function parseDate(value) {
    if (!value) return null;

    const date = new Date(
      String(value).includes("T")
        ? value
        : `${value}T12:00:00`
    );

    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY"
    }).format(Number(value) || 0);
  }

  function formatCompactMoney(value) {
    const amount = Number(value) || 0;

    if (amount >= 1000000) {
      return `₺${(amount / 1000000).toFixed(1)}M`;
    }

    if (amount >= 1000) {
      return `₺${(amount / 1000).toFixed(1)}B`;
    }

    return `₺${Math.round(amount)}`;
  }

  function formatDate(value) {
    const date = parseDate(value);
    if (!date) return "Belirtilmedi";

    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function formatDateTime(value) {
    const date = parseDate(value);
    if (!date) return "Belirtilmedi";

    return date.toLocaleString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
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
    const element = document.getElementById(id);
    if (element) element.textContent = String(value);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function installDetailStyles() {
    if (document.getElementById("yfDetailStyles")) return;

    const style = document.createElement("style");
    style.id = "yfDetailStyles";

    style.textContent = `
      #cardsList .bank-card {
        cursor: pointer;
      }

      .detail-hero-card {
        position: relative;
        overflow: hidden;
        margin-bottom: 14px;
        padding: 20px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 25px;
        background:
          radial-gradient(
            circle at 88% 12%,
            rgba(255,255,255,.13),
            transparent 31%
          ),
          linear-gradient(
            145deg,
            rgba(25,57,88,.98),
            rgba(10,31,52,.98)
          );
        box-shadow: 0 20px 46px rgba(0,0,0,.22);
      }

      .detail-hero-card::after {
        content: "";
        position: absolute;
        right: -55px;
        bottom: -70px;
        width: 190px;
        height: 190px;
        border-radius: 50%;
        background: rgba(255,255,255,.045);
      }

      .detail-bank-head {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .detail-bank-logo {
        width: 50px;
        height: 50px;
        flex: 0 0 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid rgba(255,255,255,.13);
        border-radius: 16px;
        color: #fff;
        background: rgba(255,255,255,.12);
        font-size: 19px;
        font-weight: 950;
      }

      .detail-bank-name {
        min-width: 0;
        flex: 1;
      }

      .detail-bank-name span,
      .detail-bank-name small {
        display: block;
      }

      .detail-bank-name span {
        color: rgba(224,236,248,.68);
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .12em;
        text-transform: uppercase;
      }

      .detail-bank-name h2 {
        margin: 4px 0 0;
        color: #fff;
        font-size: 18px;
      }

      .detail-bank-name small {
        margin-top: 3px;
        color: rgba(224,236,248,.72);
        font-size: 10px;
      }

      .detail-status-badge {
        position: relative;
        z-index: 2;
        min-height: 25px;
        display: inline-flex;
        align-items: center;
        padding: 0 9px;
        border-radius: 999px;
        font-size: 8px;
        font-weight: 900;
      }

      .detail-status-badge.active {
        color: #78c6ff;
        background: rgba(15,140,255,.12);
        border: 1px solid rgba(72,171,255,.18);
      }

      .detail-status-badge.loan {
        color: #ffd277;
        background: rgba(255,177,72,.11);
        border: 1px solid rgba(255,177,72,.18);
      }

      .detail-status-badge.completed {
        color: #4ce0aa;
        background: rgba(43,211,154,.11);
        border: 1px solid rgba(43,211,154,.18);
      }

      .detail-main-debt {
        position: relative;
        z-index: 2;
        margin-top: 25px;
      }

      .detail-main-debt span,
      .detail-main-debt strong {
        display: block;
      }

      .detail-main-debt span {
        margin-bottom: 7px;
        color: rgba(224,236,248,.68);
        font-size: 10px;
      }

      .detail-main-debt strong {
        color: #fff;
        font-size: 31px;
        letter-spacing: -.03em;
      }

      .detail-progress-track {
        position: relative;
        z-index: 2;
        height: 9px;
        margin-top: 18px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,.11);
      }

      .detail-progress-track > div {
        height: 100%;
        width: 0;
        border-radius: inherit;
        background: linear-gradient(90deg,#0f8cff,#52e6b2);
        transition: width .45s ease;
      }

      .detail-progress-text {
        position: relative;
        z-index: 2;
        margin-top: 9px;
        color: rgba(224,236,248,.68);
        font-size: 9px;
      }

      .detail-ziraat {
        background:
          radial-gradient(circle at 88% 12%,rgba(239,68,68,.21),transparent 31%),
          linear-gradient(145deg,#4f1721,#201020);
      }

      .detail-garanti {
        background:
          radial-gradient(circle at 88% 12%,rgba(45,212,191,.19),transparent 31%),
          linear-gradient(145deg,#0d4d45,#0a2530);
      }

      .detail-akbank {
        background:
          radial-gradient(circle at 88% 12%,rgba(255,78,104,.19),transparent 31%),
          linear-gradient(145deg,#591629,#211020);
      }

      .detail-qnb {
        background:
          radial-gradient(circle at 88% 12%,rgba(168,85,247,.21),transparent 31%),
          linear-gradient(145deg,#3f1d63,#18132c);
      }

      .detail-is {
        background:
          radial-gradient(circle at 88% 12%,rgba(59,130,246,.20),transparent 31%),
          linear-gradient(145deg,#153f6e,#101c31);
      }

      .detail-tom {
        background:
          radial-gradient(circle at 88% 12%,rgba(34,197,94,.19),transparent 31%),
          linear-gradient(145deg,#164b34,#0e2824);
      }

      .detail-other {
        background:
          radial-gradient(circle at 88% 12%,rgba(148,163,184,.18),transparent 31%),
          linear-gradient(145deg,#27384b,#111d2c);
      }

      .detail-hero-card.completed {
        background:
          radial-gradient(circle at 88% 12%,rgba(43,211,154,.22),transparent 31%),
          linear-gradient(145deg,#104b3c,#0b2826);
      }

      .detail-summary-grid {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 11px;
        margin-bottom: 14px;
      }

      .detail-summary-card {
        padding: 15px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 17px;
        background: rgba(255,255,255,.04);
      }

      .detail-summary-card span,
      .detail-summary-card strong {
        display: block;
      }

      .detail-summary-card span {
        margin-bottom: 7px;
        color: #8fa2ba;
        font-size: 9px;
      }

      .detail-summary-card strong {
        font-size: 12px;
        line-height: 1.35;
      }

      .detail-action-grid {
        display: grid;
        grid-template-columns: repeat(3,minmax(0,1fr));
        gap: 9px;
      }

      .detail-action-grid button {
        min-height: 72px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 7px;
        border: 1px solid rgba(72,171,255,.16);
        border-radius: 15px;
        color: inherit;
        background: rgba(15,140,255,.065);
        font: inherit;
      }

      .detail-action-grid button span {
        font-size: 19px;
      }

      .detail-action-grid button strong {
        font-size: 9px;
      }

      .detail-action-grid button.danger {
        color: #ff8198;
        border-color: rgba(255,91,122,.17);
        background: rgba(255,91,122,.055);
      }

      .detail-chart {
        height: 180px;
        display: grid;
        grid-template-columns: repeat(6,minmax(0,1fr));
        align-items: end;
        gap: 8px;
      }

      .detail-chart-column {
        height: 100%;
        min-width: 0;
        display: grid;
        grid-template-rows: 24px 1fr 20px;
        align-items: end;
        text-align: center;
      }

      .detail-chart-value {
        overflow: hidden;
        color: #8fa2ba;
        font-size: 7px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .detail-chart-bar-wrap {
        height: 100%;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        border-radius: 10px;
        background: rgba(255,255,255,.025);
      }

      .detail-chart-bar {
        width: 65%;
        min-height: 3px;
        border-radius: 8px 8px 3px 3px;
        background: linear-gradient(180deg,#52e6b2,#0f8cff);
      }

      .detail-chart-column > span {
        padding-top: 6px;
        color: #7e91a6;
        font-size: 8px;
        text-transform: capitalize;
      }

      .detail-transaction-list {
        display: grid;
        gap: 9px;
      }

      .detail-transaction-item {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 12px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 15px;
        background: rgba(255,255,255,.035);
      }

      .detail-transaction-icon {
        width: 38px;
        height: 38px;
        flex: 0 0 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        font-weight: 900;
      }

      .detail-transaction-icon.payment,
      .detail-transaction-icon.income {
        color: #4ce0aa;
        background: rgba(43,211,154,.10);
      }

      .detail-transaction-icon.expense {
        color: #ff8298;
        background: rgba(255,91,122,.10);
      }

      .detail-transaction-info {
        min-width: 0;
        flex: 1;
      }

      .detail-transaction-info strong,
      .detail-transaction-info span,
      .detail-transaction-info small {
        display: block;
      }

      .detail-transaction-info strong {
        overflow: hidden;
        font-size: 11px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .detail-transaction-info span {
        margin-top: 3px;
        color: #9aabba;
        font-size: 9px;
      }

      .detail-transaction-info small {
        margin-top: 4px;
        color: #71859a;
        font-size: 8px;
      }

      .detail-transaction-amount {
        flex: 0 0 auto;
        font-size: 10px;
      }

      .detail-transaction-amount.positive {
        color: #4ce0aa;
      }

      .detail-transaction-amount.negative {
        color: #ff8298;
      }

      @media(max-width:370px) {
        .detail-action-grid {
          grid-template-columns: 1fr;
        }

        .detail-chart {
          gap: 5px;
        }

        .detail-main-debt strong {
          font-size: 27px;
        }
      }
    `;

    document.head.appendChild(style);
  }
});
// YF v3.2 — Canlı Profesyonel Dashboard
document.addEventListener("DOMContentLoaded", () => {
  const DK="yf_cards_v1", TK="yf_transactions_v1", $=id=>document.getElementById(id);
  const load=k=>{try{return JSON.parse(localStorage.getItem(k)||"[]")}catch{return[]}};
  const money=v=>new Intl.NumberFormat("tr-TR",{style:"currency",currency:"TRY"}).format(Number(v)||0);
  const round=v=>Math.round((Number(v)+Number.EPSILON)*100)/100;
  const parse=v=>{if(!v)return null;const d=new Date(String(v).includes("T")?v:`${v}T12:00:00`);return Number.isNaN(d.getTime())?null:d};
  const currentMonth=v=>{const d=parse(v),n=new Date();return !!d&&d.getMonth()===n.getMonth()&&d.getFullYear()===n.getFullYear()};

  if(!$("dashboardProPanel")){
    const dash=$("dashboardPage");
    if(!dash)return;
    const ref=$("todayTasksCard")||dash.querySelector(".hero-card");
    const p=document.createElement("section");
    p.id="dashboardProPanel";
    p.className="dashboard-pro-panel";
    p.innerHTML=`
      <div class="dashboard-pro-head">
        <div><span>CANLI FİNANS ÖZETİ</span><h2>Genel durumun</h2></div>
        <b id="dashboardProStatus">Güncel</b>
      </div>
      <div class="dashboard-pro-grid">
        <article><span>Toplam Borç</span><strong id="dpDebt">₺0,00</strong><small>Kartlar ve krediler</small></article>
        <article><span>Toplam Kart Limiti</span><strong id="dpLimit">₺0,00</strong><small>Sadece kredi kartları</small></article>
        <article><span>Kullanılabilir Limit</span><strong id="dpAvailable">₺0,00</strong><small>Güncel kullanılabilir</small></article>
        <article><span>Bu Ay Ödenen</span><strong id="dpPaidMonth">₺0,00</strong><small>Kart ve kredi ödemeleri</small></article>
      </div>
      <div class="dashboard-pro-progress">
        <div><span>Borç Bitirme İlerlemesi</span><strong id="dpPercent">%0</strong></div>
        <div class="dashboard-pro-track"><i id="dpFill"></i></div>
        <small id="dpMotivation">İlk ödemenle ilerleme başlayacak.</small>
      </div>
      <button id="dpNext" class="dashboard-pro-next" type="button" disabled>
        <span>📅</span>
        <div><small>SIRADAKİ ÖDEME</small><strong id="dpNextTitle">Ödeme bulunmuyor</strong><em id="dpNextText">Henüz tarihli borç yok.</em></div>
        <b>Aç</b>
      </button>`;
    ref?ref.insertAdjacentElement("afterend",p):dash.prepend(p);
  }

  function animate(id,target){
    const el=$(id); if(!el)return;
    const start=Number(el.dataset.v||0),end=Number(target||0),t0=performance.now();
    const run=t=>{const p=Math.min(1,(t-t0)/500),v=start+(end-start)*(1-Math.pow(1-p,3));el.textContent=money(v);if(p<1)requestAnimationFrame(run);else el.dataset.v=String(end)};
    requestAnimationFrame(run);
  }

  function refresh(){
    const debts=load(DK),tx=load(TK),cards=debts.filter(x=>x.type!=="personal-loan");
    const totalDebt=round(debts.reduce((s,x)=>s+Number(x.debt||0),0));
    const totalLimit=round(cards.reduce((s,x)=>s+Number(x.limit||0),0));
    const cardDebt=round(cards.reduce((s,x)=>s+Number(x.debt||0),0));
    const available=round(Math.max(0,totalLimit-cardDebt));
    const paidMonth=round(tx.filter(x=>(x.type==="card-payment"||x.type==="loan-payment")&&currentMonth(x.createdAt||x.date)).reduce((s,x)=>s+Number(x.amount||0),0));
    const paidAll=round(tx.filter(x=>x.type==="card-payment"||x.type==="loan-payment").reduce((s,x)=>s+Number(x.amount||0),0));
    const original=round(totalDebt+paidAll),pct=original?Math.min(100,Math.round(paidAll/original*100)):0;

    animate("dpDebt",totalDebt);animate("dpLimit",totalLimit);animate("dpAvailable",available);animate("dpPaidMonth",paidMonth);
    $("dpPercent").textContent=`%${pct}`;
    $("dpFill").style.width=`${pct}%`;
    $("dpMotivation").textContent=totalDebt<=0?"Tebrikler, tüm borçlar kapandı! 🎉":pct>=75?"Son düzlüktesin.":pct>=50?"Borçlarının yarısından fazlası bitti.":pct>0?"İlerleme başladı, devam et.":"İlk ödemenle ilerleme başlayacak.";
    $("dashboardProStatus").textContent=totalDebt<=0?"Borçsuz 🎉":"Güncel";

    const now=new Date();now.setHours(0,0,0,0);
    const next=debts.filter(x=>Number(x.debt||0)>0).map(x=>{const loan=x.type==="personal-loan",d=parse(loan?(x.nextPaymentDate||x.dueDate):x.dueDate);return d?{...x,loan,d,days:Math.ceil((d-now)/86400000)}:null}).filter(Boolean).sort((a,b)=>a.d-b.d)[0];
    const btn=$("dpNext");
    if(!next){$("dpNextTitle").textContent="Ödeme bulunmuyor";$("dpNextText").textContent="Henüz tarihli borç yok.";btn.disabled=true;btn.dataset.id="";return}
    const amount=next.loan?Math.min(Number(next.monthlyInstallment||0),Number(next.debt||0)):round(Number(next.statementDebt??next.debt??0)*.2);
    $("dpNextTitle").textContent=`${next.bank} · ${next.name}`;
    $("dpNextText").textContent=`${next.days<0?`${Math.abs(next.days)} gün gecikti`:next.days===0?"Bugün son gün":next.days===1?"Yarın son gün":`${next.days} gün kaldı`} · ${money(amount)}`;
    btn.disabled=false;btn.dataset.id=next.id;
  }

  $("dpNext")?.addEventListener("click",()=>{
    const id=$("dpNext").dataset.id;if(!id)return;
    document.querySelector('[data-page="debtPaymentPage"]')?.click();
    setTimeout(()=>{const s=$("debtPaymentCard");if(s){s.value=id;s.dispatchEvent(new Event("change",{bubbles:true}))}},250);
  });

  document.querySelectorAll('[data-page="dashboardPage"]').forEach(b=>b.addEventListener("click",()=>setTimeout(refresh,100)));
  window.addEventListener("storage",refresh);
  window.addEventListener("yf-refresh-dashboard",refresh);

  if(!$("yfDashboardProStyles")){
    const s=document.createElement("style");s.id="yfDashboardProStyles";s.textContent=`
      .dashboard-pro-panel{margin:18px 0;padding:18px;border:1px solid rgba(72,171,255,.15);border-radius:24px;background:radial-gradient(circle at 95% 0,rgba(15,140,255,.12),transparent 34%),linear-gradient(145deg,rgba(18,50,80,.97),rgba(9,29,48,.97));box-shadow:0 20px 48px rgba(0,0,0,.2)}
      .dashboard-pro-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:15px}.dashboard-pro-head span{display:block;color:#64baff;font-size:9px;font-weight:900;letter-spacing:.14em}.dashboard-pro-head h2{margin:5px 0 0;font-size:20px}.dashboard-pro-head>b{height:26px;display:flex;align-items:center;padding:0 9px;border-radius:999px;color:#73c2ff;background:rgba(15,140,255,.1);border:1px solid rgba(72,171,255,.18);font-size:8px}
      .dashboard-pro-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.dashboard-pro-grid article{padding:14px;border:1px solid rgba(255,255,255,.07);border-radius:16px;background:rgba(255,255,255,.035)}.dashboard-pro-grid span,.dashboard-pro-grid strong,.dashboard-pro-grid small{display:block}.dashboard-pro-grid span{color:#8fa2ba;font-size:9px}.dashboard-pro-grid strong{margin-top:7px;font-size:15px}.dashboard-pro-grid small{margin-top:5px;color:#71859a;font-size:7.5px}
      .dashboard-pro-progress{margin-top:11px;padding:15px;border:1px solid rgba(43,211,154,.14);border-radius:17px;background:rgba(43,211,154,.045)}.dashboard-pro-progress>div:first-child{display:flex;justify-content:space-between}.dashboard-pro-progress span{color:#8fa2ba;font-size:9px}.dashboard-pro-progress strong{color:#61dfb1}.dashboard-pro-progress>small{display:block;margin-top:9px;color:#8fa2ba;font-size:8.5px}.dashboard-pro-track{height:9px;margin-top:13px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.08)}.dashboard-pro-track i{display:block;width:0;height:100%;border-radius:inherit;background:linear-gradient(90deg,#0f8cff,#52e6b2);transition:width .55s ease}
      .dashboard-pro-next{width:100%;display:flex;align-items:center;gap:11px;margin-top:11px;padding:13px;border:1px solid rgba(255,177,72,.14);border-radius:17px;color:inherit;background:rgba(255,177,72,.045);text-align:left;font:inherit}.dashboard-pro-next>span{width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:13px;background:rgba(255,177,72,.1)}.dashboard-pro-next>div{min-width:0;flex:1}.dashboard-pro-next small,.dashboard-pro-next strong,.dashboard-pro-next em{display:block}.dashboard-pro-next small{color:#ffd073;font-size:8px}.dashboard-pro-next strong{margin-top:4px;overflow:hidden;font-size:11px;text-overflow:ellipsis;white-space:nowrap}.dashboard-pro-next em{margin-top:4px;color:#8093a8;font-size:8px;font-style:normal}.dashboard-pro-next>b{color:#72c2ff;font-size:9px}
      @media(max-width:370px){.dashboard-pro-grid{grid-template-columns:1fr}}
    `;document.head.appendChild(s)
  }

  refresh();
});
// =========================================
// YF v3.3 — Varlıklarım + Eski 4'lü Alanı Kaldır
// Bu kod app.js dosyasının EN ALTINA eklenir.
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const ASSET_KEY = "yf_assets_v1";
  const DEBT_KEY = "yf_cards_v1";
  const PAGE_KEY = "yf_last_open_page_v1";

  const $ = id => document.getElementById(id);

  installAssetStyles();
  removeOldDashboardSummary();
  createAssetsMenuItem();
  createAssetsPage();
  createAssetModal();
  bindAssetEvents();
  renderAssets();
  refreshAssetDashboardCard();

  // -------------------------------------------------
  // ESKİ 4'LÜ ÖZET ALANINI KALDIR
  // Toplam Kalan Borç / Toplam Varlık / Bu Ay Ödenen / Kart Sayısı
  // -------------------------------------------------
  function removeOldDashboardSummary() {
    const ids = [
      "totalDebt",
      "totalAssets",
      "monthlyPayment",
      "cardCount"
    ];

    const cards = ids
      .map(id => document.getElementById(id)?.closest(".summary-card"))
      .filter(Boolean);

    const parentCounts = new Map();

    cards.forEach(card => {
      const parent = card.parentElement;
      parentCounts.set(parent, (parentCounts.get(parent) || 0) + 1);
    });

    cards.forEach(card => card.remove());

    parentCounts.forEach((count, parent) => {
      if (!parent) return;

      const remainingSummaryCards =
        parent.querySelectorAll(".summary-card").length;

      if (remainingSummaryCards === 0) {
        parent.remove();
      }
    });

    const dashboard = $("dashboardPage");
    if (!dashboard || $("dashboardAssetCard")) return;

    const proPanel = $("dashboardProPanel");
    const assetCard = document.createElement("section");
    assetCard.id = "dashboardAssetCard";
    assetCard.className = "dashboard-asset-card";

    assetCard.innerHTML = `
      <div class="dashboard-asset-head">
        <div>
          <span>VARLIKLARIM</span>
          <h2>Finansal gücün</h2>
        </div>

        <button
          id="openAssetsFromDashboard"
          type="button"
        >
          Tümünü Gör
        </button>
      </div>

      <div class="dashboard-asset-main">
        <div>
          <span>Toplam Varlık</span>
          <strong id="dashboardAssetTotal">₺0,00</strong>
        </div>

        <div>
          <span>Net Servet</span>
          <strong id="dashboardNetWorth">₺0,00</strong>
        </div>
      </div>

      <div class="dashboard-asset-category-row" id="dashboardAssetCategories">
        <div>
          <span>💵</span>
          <strong>Nakit</strong>
          <small>₺0,00</small>
        </div>

        <div>
          <span>🏦</span>
          <strong>Banka</strong>
          <small>₺0,00</small>
        </div>

        <div>
          <span>🥇</span>
          <strong>Altın</strong>
          <small>₺0,00</small>
        </div>
      </div>
    `;

    if (proPanel) {
      proPanel.insertAdjacentElement("afterend", assetCard);
    } else {
      dashboard.appendChild(assetCard);
    }
  }

  // -------------------------------------------------
  // SOL MENÜYE VARLIKLAR EKLE
  // -------------------------------------------------
  function createAssetsMenuItem() {
    if (document.querySelector('[data-page="assetsPage"]')) return;

    const allItems = [
      ...document.querySelectorAll(".side-menu-item")
    ];

    const goals = allItems.find(item =>
      item.textContent
        ?.toLocaleLowerCase("tr-TR")
        .includes("hedefler")
    );

    const button = document.createElement("button");
    button.type = "button";
    button.className = "side-menu-item";
    button.dataset.page = "assetsPage";

    button.innerHTML = `
      <span class="side-menu-icon">💰</span>
      <span>Varlıklar</span>
    `;

    if (goals) {
      goals.insertAdjacentElement("afterend", button);
    } else {
      const container =
        document.querySelector(".side-menu-content") ||
        document.querySelector("#sideMenuLayer .side-menu") ||
        document.querySelector("#sideMenuLayer");

      container?.appendChild(button);
    }
  }

  // -------------------------------------------------
  // VARLIKLAR SAYFASI
  // -------------------------------------------------
  function createAssetsPage() {
    if ($("assetsPage")) return;

    const main = document.querySelector("main.app-shell");
    if (!main) return;

    const page = document.createElement("section");
    page.id = "assetsPage";
    page.className = "page";

    page.innerHTML = `
      <header class="top-header">
        <div>
          <p class="eyebrow">FİNANSAL VARLIKLAR</p>
          <h1>Varlıklarım</h1>
        </div>

        <button
          id="assetsBackButton"
          class="reports-back-button"
          type="button"
        >
          Ana Sayfa
        </button>
      </header>

      <section class="asset-overview-card">
        <div class="asset-overview-head">
          <div>
            <span>TOPLAM VARLIK</span>
            <strong id="assetPageTotal">₺0,00</strong>
          </div>

          <span id="assetOverviewStatus" class="asset-overview-badge">
            Güncel
          </span>
        </div>

        <div class="asset-overview-grid">
          <div>
            <span>Toplam Borç</span>
            <strong id="assetPageDebt">₺0,00</strong>
          </div>

          <div>
            <span>Net Servet</span>
            <strong id="assetPageNet">₺0,00</strong>
          </div>
        </div>
      </section>

      <section class="asset-summary-grid">
        <article>
          <span>💵 Nakit</span>
          <strong id="assetSummaryCash">₺0,00</strong>
        </article>

        <article>
          <span>🏦 Banka</span>
          <strong id="assetSummaryBank">₺0,00</strong>
        </article>

        <article>
          <span>🥇 Altın</span>
          <strong id="assetSummaryGold">₺0,00</strong>
        </article>

        <article>
          <span>🥈 Gümüş</span>
          <strong id="assetSummarySilver">₺0,00</strong>
        </article>

        <article>
          <span>🪙 Kripto</span>
          <strong id="assetSummaryCrypto">₺0,00</strong>
        </article>

        <article>
          <span>📈 Hisse</span>
          <strong id="assetSummaryStock">₺0,00</strong>
        </article>
      </section>

      <section class="content-card">
        <div class="section-heading">
          <div>
            <p class="eyebrow">KAYITLI VARLIKLAR</p>
            <h2>Varlık listesi</h2>
          </div>
        </div>

        <div id="assetList" class="asset-list"></div>
      </section>

      <section class="content-card">
        <button id="addAssetButton" class="asset-add-button" type="button">
          <span>＋</span>

          <div>
            <strong>Yeni Varlık Ekle</strong>
            <small>Nakit, banka, altın, gümüş, kripto veya hisse ekle</small>
          </div>
        </button>
      </section>
    `;

    main.appendChild(page);
  }

  // -------------------------------------------------
  // VARLIK EKLEME MODALI
  // -------------------------------------------------
  function createAssetModal() {
    if ($("assetModal")) return;

    const modal = document.createElement("div");
    modal.id = "assetModal";
    modal.className = "asset-modal hidden";

    modal.innerHTML = `
      <div class="asset-modal-backdrop"></div>

      <section class="asset-modal-sheet">
        <div class="asset-modal-head">
          <div>
            <span>YENİ VARLIK</span>
            <h2 id="assetModalTitle">Varlık Ekle</h2>
          </div>

          <button
            id="closeAssetModal"
            type="button"
            aria-label="Kapat"
          >
            ×
          </button>
        </div>

        <form id="assetForm">
          <input id="assetId" type="hidden">

          <label>
            Varlık türü

            <select id="assetType" required>
              <option value="cash">💵 Nakit</option>
              <option value="bank">🏦 Banka Hesabı</option>
              <option value="gold">🥇 Altın</option>
              <option value="silver">🥈 Gümüş</option>
              <option value="crypto">🪙 Kripto</option>
              <option value="stock">📈 Hisse Senedi</option>
            </select>
          </label>

          <label>
            Varlık adı

            <input
              id="assetName"
              type="text"
              placeholder="Örn. Ana hesap, Gram altın, Bitcoin"
              required
            >
          </label>

          <label>
            Güncel değer

            <input
              id="assetValue"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              required
            >
          </label>

          <label>
            Not

            <input
              id="assetNote"
              type="text"
              placeholder="İsteğe bağlı"
            >
          </label>

          <div class="asset-modal-actions">
            <button
              id="cancelAssetButton"
              class="asset-secondary"
              type="button"
            >
              Vazgeç
            </button>

            <button
              class="asset-primary"
              type="submit"
            >
              Kaydet
            </button>
          </div>
        </form>
      </section>
    `;

    document.body.appendChild(modal);
  }

  // -------------------------------------------------
  // OLAYLAR
  // -------------------------------------------------
  function bindAssetEvents() {
    document.addEventListener("click", event => {
      const pageButton = event.target.closest('[data-page="assetsPage"]');

      if (pageButton) {
        closeSideMenu();
        showPage("assetsPage");
        localStorage.setItem(PAGE_KEY, "assetsPage");
        renderAssets();
      }
    });

    $("openAssetsFromDashboard")?.addEventListener("click", () => {
      showPage("assetsPage");
      localStorage.setItem(PAGE_KEY, "assetsPage");
      renderAssets();
    });

    $("assetsBackButton")?.addEventListener("click", () => {
      showPage("dashboardPage");
      localStorage.setItem(PAGE_KEY, "dashboardPage");
      refreshAssetDashboardCard();
    });

    $("addAssetButton")?.addEventListener("click", () => {
      openAssetModal();
    });

    $("closeAssetModal")?.addEventListener("click", closeAssetModal);
    $("cancelAssetButton")?.addEventListener("click", closeAssetModal);

    document
      .querySelector(".asset-modal-backdrop")
      ?.addEventListener("click", closeAssetModal);

    $("assetForm")?.addEventListener("submit", saveAsset);

    window.addEventListener("storage", () => {
      renderAssets();
      refreshAssetDashboardCard();
    });

    document
      .querySelectorAll('[data-page="dashboardPage"]')
      .forEach(button => {
        button.addEventListener("click", () => {
          setTimeout(refreshAssetDashboardCard, 100);
        });
      });

    const savedPage = localStorage.getItem(PAGE_KEY);

    if (savedPage === "assetsPage") {
      setTimeout(() => {
        showPage("assetsPage");
        renderAssets();
      }, 350);
    }
  }

  // -------------------------------------------------
  // MODAL AÇ / KAPAT
  // -------------------------------------------------
  function openAssetModal(asset = null) {
    const form = $("assetForm");
    const modal = $("assetModal");

    if (!form || !modal) return;

    form.reset();

    $("assetId").value = asset?.id || "";
    $("assetType").value = asset?.type || "cash";
    $("assetName").value = asset?.name || "";
    $("assetValue").value = asset?.value || "";
    $("assetNote").value = asset?.note || "";

    $("assetModalTitle").textContent =
      asset ? "Varlığı Düzenle" : "Varlık Ekle";

    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeAssetModal() {
    $("assetModal")?.classList.add("hidden");
    document.body.style.overflow = "";
  }

  // -------------------------------------------------
  // VARLIK KAYDET
  // -------------------------------------------------
  function saveAsset(event) {
    event.preventDefault();

    const id = $("assetId").value;
    const type = $("assetType").value;
    const name = $("assetName").value.trim();
    const value = Number($("assetValue").value);
    const note = $("assetNote").value.trim();

    if (!name) {
      alert("Varlık adını yaz.");
      return;
    }

    if (!Number.isFinite(value) || value < 0) {
      alert("Güncel değeri doğru gir.");
      return;
    }

    const assets = loadJson(ASSET_KEY);
    const old = assets.find(item => item.id === id);

    const asset = {
      id: id || createId(),
      type,
      name,
      value: roundMoney(value),
      note,
      createdAt: old?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const index = assets.findIndex(item => item.id === asset.id);

    if (index >= 0) {
      assets[index] = asset;
    } else {
      assets.unshift(asset);
    }

    saveJson(ASSET_KEY, assets);

    closeAssetModal();
    renderAssets();
    refreshAssetDashboardCard();
  }

  // -------------------------------------------------
  // VARLIKLARI ÇİZ
  // -------------------------------------------------
  function renderAssets() {
    const list = $("assetList");
    if (!list) return;

    const assets = loadJson(ASSET_KEY);
    const debts = loadJson(DEBT_KEY);

    const totalAssets = roundMoney(
      assets.reduce(
        (sum, item) => sum + Number(item.value || 0),
        0
      )
    );

    const totalDebt = roundMoney(
      debts.reduce(
        (sum, item) => sum + Number(item.debt || 0),
        0
      )
    );

    const netWorth = roundMoney(totalAssets - totalDebt);

    setText("assetPageTotal", formatMoney(totalAssets));
    setText("assetPageDebt", formatMoney(totalDebt));
    setText("assetPageNet", formatMoney(netWorth));

    const status = $("assetOverviewStatus");

    if (status) {
      status.textContent =
        netWorth >= 0 ? "Pozitif" : "Ekside";

      status.className =
        netWorth >= 0
          ? "asset-overview-badge positive"
          : "asset-overview-badge negative";
    }

    const totals = getCategoryTotals(assets);

    setText("assetSummaryCash", formatMoney(totals.cash));
    setText("assetSummaryBank", formatMoney(totals.bank));
    setText("assetSummaryGold", formatMoney(totals.gold));
    setText("assetSummarySilver", formatMoney(totals.silver));
    setText("assetSummaryCrypto", formatMoney(totals.crypto));
    setText("assetSummaryStock", formatMoney(totals.stock));

    list.innerHTML = "";

    if (!assets.length) {
      list.innerHTML = `
        <div class="empty-state">
          Henüz varlık eklenmedi.
        </div>
      `;
      return;
    }

    assets.forEach(asset => {
      const card = document.createElement("article");
      card.className = "asset-item";

      card.innerHTML = `
        <div class="asset-item-icon">
          ${getAssetIcon(asset.type)}
        </div>

        <div class="asset-item-info">
          <strong>${escapeHtml(asset.name)}</strong>
          <span>${getAssetTypeLabel(asset.type)}</span>
          ${
            asset.note
              ? `<small>${escapeHtml(asset.note)}</small>`
              : ""
          }
        </div>

        <div class="asset-item-side">
          <strong>${formatMoney(asset.value)}</strong>

          <div>
            <button
              type="button"
              data-asset-edit="${asset.id}"
            >
              Düzenle
            </button>

            <button
              type="button"
              class="danger"
              data-asset-delete="${asset.id}"
            >
              Sil
            </button>
          </div>
        </div>
      `;

      card
        .querySelector("[data-asset-edit]")
        ?.addEventListener("click", () => {
          openAssetModal(asset);
        });

      card
        .querySelector("[data-asset-delete]")
        ?.addEventListener("click", () => {
          deleteAsset(asset.id);
        });

      list.appendChild(card);
    });
  }

  // -------------------------------------------------
  // DASHBOARD VARLIK KARTINI GÜNCELLE
  // -------------------------------------------------
  function refreshAssetDashboardCard() {
    const assets = loadJson(ASSET_KEY);
    const debts = loadJson(DEBT_KEY);

    const totalAssets = roundMoney(
      assets.reduce(
        (sum, item) => sum + Number(item.value || 0),
        0
      )
    );

    const totalDebt = roundMoney(
      debts.reduce(
        (sum, item) => sum + Number(item.debt || 0),
        0
      )
    );

    const netWorth = roundMoney(totalAssets - totalDebt);
    const totals = getCategoryTotals(assets);

    setText("dashboardAssetTotal", formatMoney(totalAssets));
    setText("dashboardNetWorth", formatMoney(netWorth));

    const categoryRow = $("dashboardAssetCategories");

    if (categoryRow) {
      categoryRow.innerHTML = `
        <div>
          <span>💵</span>
          <strong>Nakit</strong>
          <small>${formatMoney(totals.cash)}</small>
        </div>

        <div>
          <span>🏦</span>
          <strong>Banka</strong>
          <small>${formatMoney(totals.bank)}</small>
        </div>

        <div>
          <span>🥇</span>
          <strong>Altın</strong>
          <small>${formatMoney(totals.gold)}</small>
        </div>
      `;
    }

    const netElement = $("dashboardNetWorth");

    if (netElement) {
      netElement.classList.toggle("positive", netWorth >= 0);
      netElement.classList.toggle("negative", netWorth < 0);
    }
  }

  // -------------------------------------------------
  // VARLIK SİL
  // -------------------------------------------------
  function deleteAsset(id) {
    const assets = loadJson(ASSET_KEY);
    const asset = assets.find(item => item.id === id);

    if (!asset) return;

    if (!confirm(`"${asset.name}" varlığı silinsin mi?`)) {
      return;
    }

    saveJson(
      ASSET_KEY,
      assets.filter(item => item.id !== id)
    );

    renderAssets();
    refreshAssetDashboardCard();
  }

  // -------------------------------------------------
  // YARDIMCI FONKSİYONLAR
  // -------------------------------------------------
  function getCategoryTotals(assets) {
    const totals = {
      cash: 0,
      bank: 0,
      gold: 0,
      silver: 0,
      crypto: 0,
      stock: 0
    };

    assets.forEach(asset => {
      if (totals[asset.type] !== undefined) {
        totals[asset.type] += Number(asset.value || 0);
      }
    });

    Object.keys(totals).forEach(key => {
      totals[key] = roundMoney(totals[key]);
    });

    return totals;
  }

  function getAssetIcon(type) {
    const icons = {
      cash: "💵",
      bank: "🏦",
      gold: "🥇",
      silver: "🥈",
      crypto: "🪙",
      stock: "📈"
    };

    return icons[type] || "💰";
  }

  function getAssetTypeLabel(type) {
    const labels = {
      cash: "Nakit",
      bank: "Banka Hesabı",
      gold: "Altın",
      silver: "Gümüş",
      crypto: "Kripto",
      stock: "Hisse Senedi"
    };

    return labels[type] || "Varlık";
  }

  function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
      page.classList.toggle("active", page.id === pageId);
    });

    document
      .querySelectorAll(".bottom-navigation .nav-item")
      .forEach(item => {
        item.classList.toggle(
          "active",
          item.dataset.page === pageId
        );
      });

    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeSideMenu() {
    const layer = $("sideMenuLayer");

    layer?.classList.remove("open");
    layer?.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }

  function createId() {
    return window.crypto?.randomUUID
      ? crypto.randomUUID()
      : String(Date.now() + Math.random());
  }

  function roundMoney(value) {
    return Math.round(
      (Number(value) + Number.EPSILON) * 100
    ) / 100;
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

  function saveJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function setText(id, value) {
    const element = $(id);

    if (element) {
      element.textContent = String(value);
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

  // -------------------------------------------------
  // TASARIM
  // -------------------------------------------------
  function installAssetStyles() {
    if ($("yfAssetStyles")) return;

    const style = document.createElement("style");
    style.id = "yfAssetStyles";

    style.textContent = `
      .dashboard-asset-card {
        margin: 18px 0;
        padding: 18px;
        border: 1px solid rgba(43,211,154,.15);
        border-radius: 24px;
        background:
          radial-gradient(
            circle at 92% 5%,
            rgba(43,211,154,.13),
            transparent 34%
          ),
          linear-gradient(
            145deg,
            rgba(18,58,68,.97),
            rgba(9,31,43,.97)
          );
      }

      .dashboard-asset-head {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 15px;
      }

      .dashboard-asset-head span {
        display: block;
        color: #5ee7b4;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .14em;
      }

      .dashboard-asset-head h2 {
        margin: 5px 0 0;
        font-size: 20px;
      }

      .dashboard-asset-head button {
        min-height: 34px;
        padding: 0 11px;
        border: 1px solid rgba(43,211,154,.18);
        border-radius: 11px;
        color: #5ee7b4;
        background: rgba(43,211,154,.08);
        font-size: 8px;
        font-weight: 850;
      }

      .dashboard-asset-main {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 10px;
      }

      .dashboard-asset-main > div {
        padding: 15px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 16px;
        background: rgba(255,255,255,.035);
      }

      .dashboard-asset-main span,
      .dashboard-asset-main strong {
        display: block;
      }

      .dashboard-asset-main span {
        color: #8fa2ba;
        font-size: 9px;
      }

      .dashboard-asset-main strong {
        margin-top: 7px;
        font-size: 16px;
      }

      .dashboard-asset-main strong.positive {
        color: #4ce0aa;
      }

      .dashboard-asset-main strong.negative {
        color: #ff8298;
      }

      .dashboard-asset-category-row {
        display: grid;
        grid-template-columns: repeat(3,minmax(0,1fr));
        gap: 8px;
        margin-top: 11px;
      }

      .dashboard-asset-category-row > div {
        padding: 11px;
        border-radius: 14px;
        background: rgba(255,255,255,.03);
        text-align: center;
      }

      .dashboard-asset-category-row span,
      .dashboard-asset-category-row strong,
      .dashboard-asset-category-row small {
        display: block;
      }

      .dashboard-asset-category-row span {
        font-size: 18px;
      }

      .dashboard-asset-category-row strong {
        margin-top: 5px;
        font-size: 9px;
      }

      .dashboard-asset-category-row small {
        margin-top: 4px;
        color: #8295a9;
        font-size: 8px;
      }

      .asset-overview-card {
        margin-bottom: 14px;
        padding: 20px;
        border: 1px solid rgba(43,211,154,.17);
        border-radius: 24px;
        background:
          radial-gradient(
            circle at 90% 5%,
            rgba(43,211,154,.15),
            transparent 34%
          ),
          linear-gradient(
            145deg,
            rgba(17,65,65,.98),
            rgba(8,31,41,.98)
          );
      }

      .asset-overview-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
      }

      .asset-overview-head span,
      .asset-overview-head strong {
        display: block;
      }

      .asset-overview-head > div > span {
        color: #5ee7b4;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .14em;
      }

      .asset-overview-head > div > strong {
        margin-top: 8px;
        font-size: 29px;
      }

      .asset-overview-badge {
        height: 26px;
        display: inline-flex !important;
        align-items: center;
        padding: 0 9px;
        border-radius: 999px;
        font-size: 8px;
        font-weight: 850;
      }

      .asset-overview-badge.positive {
        color: #4ce0aa;
        background: rgba(43,211,154,.10);
        border: 1px solid rgba(43,211,154,.18);
      }

      .asset-overview-badge.negative {
        color: #ff8298;
        background: rgba(255,91,122,.10);
        border: 1px solid rgba(255,91,122,.18);
      }

      .asset-overview-grid {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 10px;
        margin-top: 18px;
      }

      .asset-overview-grid > div {
        padding: 13px;
        border-radius: 15px;
        background: rgba(255,255,255,.04);
      }

      .asset-overview-grid span,
      .asset-overview-grid strong {
        display: block;
      }

      .asset-overview-grid span {
        color: #8fa2ba;
        font-size: 9px;
      }

      .asset-overview-grid strong {
        margin-top: 6px;
        font-size: 13px;
      }

      .asset-summary-grid {
        display: grid;
        grid-template-columns: repeat(2,minmax(0,1fr));
        gap: 10px;
        margin-bottom: 14px;
      }

      .asset-summary-grid article {
        padding: 15px;
        border: 1px solid rgba(255,255,255,.08);
        border-radius: 17px;
        background: rgba(255,255,255,.04);
      }

      .asset-summary-grid span,
      .asset-summary-grid strong {
        display: block;
      }

      .asset-summary-grid span {
        color: #8fa2ba;
        font-size: 10px;
      }

      .asset-summary-grid strong {
        margin-top: 7px;
        font-size: 14px;
      }

      .asset-list {
        display: grid;
        gap: 10px;
      }

      .asset-item {
        display: flex;
        align-items: center;
        gap: 11px;
        padding: 13px;
        border: 1px solid rgba(255,255,255,.07);
        border-radius: 16px;
        background: rgba(255,255,255,.035);
      }

      .asset-item-icon {
        width: 42px;
        height: 42px;
        flex: 0 0 42px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 13px;
        background: rgba(43,211,154,.09);
        font-size: 19px;
      }

      .asset-item-info {
        min-width: 0;
        flex: 1;
      }

      .asset-item-info strong,
      .asset-item-info span,
      .asset-item-info small {
        display: block;
      }

      .asset-item-info strong {
        overflow: hidden;
        font-size: 11px;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .asset-item-info span {
        margin-top: 4px;
        color: #8fa2ba;
        font-size: 9px;
      }

      .asset-item-info small {
        margin-top: 4px;
        color: #71859a;
        font-size: 8px;
      }

      .asset-item-side {
        flex: 0 0 auto;
        text-align: right;
      }

      .asset-item-side > strong {
        display: block;
        font-size: 11px;
      }

      .asset-item-side > div {
        display: flex;
        justify-content: flex-end;
        gap: 6px;
        margin-top: 7px;
      }

      .asset-item-side button {
        min-height: 28px;
        padding: 0 8px;
        border: 1px solid rgba(72,171,255,.16);
        border-radius: 9px;
        color: #72c2ff;
        background: rgba(15,140,255,.07);
        font-size: 7.5px;
      }

      .asset-item-side button.danger {
        color: #ff8298;
        border-color: rgba(255,91,122,.16);
        background: rgba(255,91,122,.06);
      }

      .asset-add-button {
        width: 100%;
        min-height: 62px;
        display: flex;
        align-items: center;
        gap: 13px;
        padding: 13px;
        border: 1px dashed rgba(43,211,154,.22);
        border-radius: 17px;
        color: inherit;
        background: rgba(43,211,154,.05);
        text-align: left;
        font: inherit;
      }

      .asset-add-button > span {
        width: 38px;
        height: 38px;
        flex: 0 0 38px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        color: #5ee7b4;
        background: rgba(43,211,154,.10);
        font-size: 21px;
      }

      .asset-add-button strong,
      .asset-add-button small {
        display: block;
      }

      .asset-add-button small {
        margin-top: 4px;
        color: #8093a8;
        font-size: 9px;
      }

      .asset-modal {
        position: fixed;
        z-index: 5200;
        inset: 0;
      }

      .asset-modal-backdrop {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,.74);
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
      }

      .asset-modal-sheet {
        position: absolute;
        right: 0;
        bottom: 0;
        left: 0;
        max-height: 88vh;
        overflow-y: auto;
        padding:
          18px
          18px
          calc(22px + env(safe-area-inset-bottom));
        border-radius: 26px 26px 0 0;
        border: 1px solid rgba(255,255,255,.10);
        background:
          linear-gradient(
            180deg,
            rgba(18,43,69,.99),
            rgba(8,23,38,.99)
          );
      }

      .asset-modal-head {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        margin-bottom: 16px;
      }

      .asset-modal-head span {
        color: #5ee7b4;
        font-size: 9px;
        font-weight: 900;
        letter-spacing: .14em;
      }

      .asset-modal-head h2 {
        margin: 5px 0 0;
        font-size: 22px;
      }

      .asset-modal-head button {
        width: 40px;
        height: 40px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 13px;
        color: inherit;
        background: rgba(255,255,255,.05);
        font-size: 25px;
      }

      #assetForm label {
        display: grid;
        gap: 7px;
        margin-bottom: 13px;
        color: #b9c8d8;
        font-size: 11px;
        font-weight: 750;
      }

      #assetForm input,
      #assetForm select {
        width: 100%;
        min-height: 48px;
        padding: 0 13px;
        border: 1px solid rgba(255,255,255,.10);
        border-radius: 14px;
        color: inherit;
        background: rgba(255,255,255,.055);
        font: inherit;
        box-sizing: border-box;
      }

      .asset-modal-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .asset-primary,
      .asset-secondary {
        min-height: 48px;
        border-radius: 14px;
        font: inherit;
        font-weight: 850;
      }

      .asset-primary {
        border: 0;
        color: #06251b;
        background: linear-gradient(135deg,#52e6b2,#25c98d);
      }

      .asset-secondary {
        border: 1px solid rgba(255,255,255,.10);
        color: inherit;
        background: rgba(255,255,255,.04);
      }

      @media(max-width:370px) {
        .dashboard-asset-main,
        .asset-overview-grid,
        .asset-summary-grid {
          grid-template-columns: 1fr;
        }

        .dashboard-asset-category-row {
          grid-template-columns: 1fr;
        }
      }
    `;

    document.head.appendChild(style);
  }
});
// YF v3.4 — Ana Sayfadan Hızlı İşlemleri Kaldır
document.addEventListener("DOMContentLoaded", () => {
  removeQuickActions();

  document.querySelectorAll('[data-page="dashboardPage"]').forEach(button => {
    button.addEventListener("click", () => {
      setTimeout(removeQuickActions, 80);
    });
  });

  window.addEventListener("pageshow", removeQuickActions);

  function removeQuickActions() {
    const dashboard = document.getElementById("dashboardPage");
    if (!dashboard) return;

    ["quickActions","quickActionsCard","quickTransactions","dashboardQuickActions"]
      .forEach(id => document.getElementById(id)?.remove());

    const sections = [
      ...dashboard.querySelectorAll("section, article, .content-card, .dashboard-card")
    ];

    sections.forEach(section => {
      const title = section.querySelector("h1, h2, h3, .section-title, .section-heading");
      const text = String(title?.textContent || section.textContent || "")
        .toLocaleLowerCase("tr-TR")
        .replace(/\s+/g, " ")
        .trim();

      const hasQuickTitle =
        text.includes("hızlı işlemler") ||
        text.includes("hizli islemler");

      const quickButtons = section.querySelectorAll(
        '#quickAddCardButton, #openTransactionFormButton, [data-page="debtPaymentPage"], [data-page="transactionsPage"]'
      );

      const looksLikeQuickActions =
        hasQuickTitle &&
        (quickButtons.length >= 2 || section.querySelectorAll("button").length >= 3);

      if (looksLikeQuickActions) section.remove();
    });
  }
});
