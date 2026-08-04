// =========================================
// YF — Yavuz Finans
// Kart Yönetimi, İşlemler ve Dashboard
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const CARD_STORAGE_KEY = "yf_cards_v1";
  const TRANSACTION_STORAGE_KEY = "yf_transactions_v1";

  let cards = loadJson(CARD_STORAGE_KEY, []);
  let transactions = loadJson(TRANSACTION_STORAGE_KEY, []);

  const pages = document.querySelectorAll(".page");
  const navItems = document.querySelectorAll(".nav-item");

  const cardModal = document.getElementById("cardModal");
  const cardForm = document.getElementById("cardForm");
  const cardFormTitle = document.getElementById("cardFormTitle");
  const cardFormMessage = document.getElementById("cardFormMessage");

  const cardId = document.getElementById("cardId");
  const bankName = document.getElementById("bankName");
  const cardName = document.getElementById("cardName");
  const cardLimit = document.getElementById("cardLimit");
  const cardDebt = document.getElementById("cardDebt");
  const statementDate = document.getElementById("statementDate");
  const dueDate = document.getElementById("dueDate");

  const openCardFormButton = document.getElementById("openCardFormButton");
  const quickAddCardButton = document.getElementById("quickAddCardButton");
  const closeCardFormButton = document.getElementById("closeCardFormButton");
  const cancelCardButton = document.getElementById("cancelCardButton");
  const modalBackdrop = document.getElementById("modalBackdrop");

  const transactionModal = document.getElementById("transactionModal");
  const transactionForm = document.getElementById("transactionForm");
  const transactionType = document.getElementById("transactionType");
  const transactionName = document.getElementById("transactionName");
  const transactionAmount = document.getElementById("transactionAmount");
  const transactionCategory = document.getElementById("transactionCategory");
  const transactionDate = document.getElementById("transactionDate");
  const transactionPaymentMethod = document.getElementById("transactionPaymentMethod");
  const transactionCard = document.getElementById("transactionCard");
  const transactionCardField = document.getElementById("transactionCardField");

  const openTransactionFormButton = document.getElementById("openTransactionFormButton");
  const closeTransactionFormButton = document.getElementById("closeTransactionFormButton");
  const cancelTransactionButton = document.getElementById("cancelTransactionButton");
  const transactionModalBackdrop = document.getElementById("transactionModalBackdrop");

  const cardsList = document.getElementById("cardsList");
  const emptyCards = document.getElementById("emptyCards");
  const upcomingPayments = document.getElementById("upcomingPayments");
  const transactionsList = document.getElementById("transactionsList");

  const totalDebt = document.getElementById("totalDebt");
  const totalAssets = document.getElementById("totalAssets");
  const monthlyPayment = document.getElementById("monthlyPayment");
  const netBalance = document.getElementById("netBalance");
  const balanceStatus = document.getElementById("balanceStatus");
  const cardCount = document.getElementById("cardCount");

  const cardsTotalDebt = document.getElementById("cardsTotalDebt");
  const cardsTotalLimit = document.getElementById("cardsTotalLimit");
  const cardsAvailableLimit = document.getElementById("cardsAvailableLimit");

  const totalIncome = document.getElementById("totalIncome");
  const totalExpense = document.getElementById("totalExpense");
  const transactionBalance = document.getElementById("transactionBalance");

  setupWelcomeText();
  setupNavigation();
  setupCardEvents();
  setupTransactionEvents();
  setDefaultTransactionDate();
  renderEverything();

  function setupWelcomeText() {
    const welcomeText = document.getElementById("welcomeText");
    if (!welcomeText) return;

    const hour = new Date().getHours();
    if (hour < 12) {
      welcomeText.textContent = "Günaydın Yavuz 👋";
    } else if (hour < 18) {
      welcomeText.textContent = "İyi Günler Yavuz 👋";
    } else {
      welcomeText.textContent = "İyi Akşamlar Yavuz 👋";
    }
  }

  function setupNavigation() {
    navItems.forEach((button) => {
      button.addEventListener("click", () => {
        const targetPage = button.dataset.page;
        showPage(targetPage);

        navItems.forEach((item) => item.classList.remove("active"));
        button.classList.add("active");

        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  function showPage(pageId) {
    pages.forEach((page) => page.classList.remove("active"));
    document.getElementById(pageId)?.classList.add("active");
  }

  function setupCardEvents() {
    openCardFormButton?.addEventListener("click", openNewCardForm);
    quickAddCardButton?.addEventListener("click", openNewCardForm);
    closeCardFormButton?.addEventListener("click", closeCardModal);
    cancelCardButton?.addEventListener("click", closeCardModal);
    modalBackdrop?.addEventListener("click", closeCardModal);
    cardForm?.addEventListener("submit", saveCard);
  }

  function openNewCardForm() {
    cardForm?.reset();
    if (cardId) cardId.value = "";
    if (cardFormTitle) cardFormTitle.textContent = "Yeni Kart Ekle";
    hideCardFormMessage();
    openCardModal();
  }

  function openCardModal() {
    cardModal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeCardModal() {
    cardModal?.classList.add("hidden");
    document.body.style.overflow = "";
    hideCardFormMessage();
  }

  function saveCard(event) {
    event.preventDefault();

    const limit = Number(cardLimit?.value);
    const debt = Number(cardDebt?.value);

    if (!bankName?.value) return showCardFormMessage("Lütfen banka seç.", true);
    if (!cardName?.value.trim()) return showCardFormMessage("Lütfen kart adını yaz.", true);
    if (!Number.isFinite(limit) || limit < 0) return showCardFormMessage("Kart limitini doğru gir.", true);
    if (!Number.isFinite(debt) || debt < 0) return showCardFormMessage("Güncel borcu doğru gir.", true);

    const existingId = cardId?.value || "";
    const oldCard = cards.find((card) => card.id === existingId);

    const newCard = {
      id: existingId || createId(),
      bank: bankName.value,
      name: cardName.value.trim(),
      limit,
      debt,
      statementDate: statementDate?.value || "",
      dueDate: dueDate?.value || "",
      createdAt: oldCard?.createdAt || new Date().toISOString()
    };

    const index = cards.findIndex((card) => card.id === newCard.id);
    if (index >= 0) cards[index] = newCard;
    else cards.push(newCard);

    saveCards();
    renderEverything();
    showCardFormMessage("Kart başarıyla kaydedildi.", false);

    setTimeout(() => {
      closeCardModal();
      showCardsPage();
    }, 500);
  }

  function editCard(id) {
    const card = cards.find((item) => item.id === id);
    if (!card) return;

    if (cardId) cardId.value = card.id;
    if (bankName) bankName.value = card.bank;
    if (cardName) cardName.value = card.name;
    if (cardLimit) cardLimit.value = card.limit;
    if (cardDebt) cardDebt.value = card.debt;
    if (statementDate) statementDate.value = card.statementDate || "";
    if (dueDate) dueDate.value = card.dueDate || "";
    if (cardFormTitle) cardFormTitle.textContent = "Kartı Düzenle";

    hideCardFormMessage();
    openCardModal();
  }

  function deleteCard(id) {
    const card = cards.find((item) => item.id === id);
    if (!card) return;

    if (!window.confirm(`${card.bank} kartı silinsin mi?`)) return;

    cards = cards.filter((item) => item.id !== id);
    saveCards();
    renderEverything();
  }

  function showCardsPage() {
    showPage("cardsPage");
    navItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.page === "cardsPage");
    });
  }

  function setupTransactionEvents() {
    openTransactionFormButton?.addEventListener("click", openTransactionModal);
    closeTransactionFormButton?.addEventListener("click", closeTransactionModal);
    cancelTransactionButton?.addEventListener("click", closeTransactionModal);
    transactionModalBackdrop?.addEventListener("click", closeTransactionModal);
    transactionPaymentMethod?.addEventListener("change", updateTransactionCardField);
    transactionForm?.addEventListener("submit", saveTransaction);
  }

  function openTransactionModal() {
    populateTransactionCards();
    updateTransactionCardField();
    setDefaultTransactionDate();
    transactionModal?.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeTransactionModal() {
    transactionModal?.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function populateTransactionCards() {
    if (!transactionCard) return;

    const selectedValue = transactionCard.value;
    transactionCard.innerHTML = '<option value="">Kart seç</option>';

    cards.forEach((card) => {
      const option = document.createElement("option");
      option.value = card.id;
      option.textContent = `${card.bank} - ${card.name}`;
      transactionCard.appendChild(option);
    });

    if (cards.some((card) => card.id === selectedValue)) {
      transactionCard.value = selectedValue;
    }
  }

  function updateTransactionCardField() {
    const isCardPayment = transactionPaymentMethod?.value === "card";
    transactionCardField?.classList.toggle("hidden", !isCardPayment);
    if (!isCardPayment && transactionCard) transactionCard.value = "";
  }

  function setDefaultTransactionDate() {
    if (transactionDate && !transactionDate.value) {
      transactionDate.value = new Date().toISOString().split("T")[0];
    }
  }

  function saveTransaction(event) {
    event.preventDefault();

    const type = transactionType?.value || "expense";
    const amount = Number(transactionAmount?.value);
    const paymentMethod = transactionPaymentMethod?.value || "cash";
    const selectedCardId = paymentMethod === "card" ? transactionCard?.value || "" : "";

    if (!transactionName?.value.trim()) {
      window.alert("Lütfen işlem açıklamasını yaz.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      window.alert("Lütfen geçerli bir tutar gir.");
      return;
    }

    if (!transactionCategory?.value) {
      window.alert("Lütfen kategori seç.");
      return;
    }

    if (!transactionDate?.value) {
      window.alert("Lütfen tarih seç.");
      return;
    }

    if (type === "expense" && paymentMethod === "card" && !selectedCardId) {
      window.alert("Lütfen kredi kartını seç.");
      return;
    }

    const transaction = {
      id: createId(),
      type,
      name: transactionName.value.trim(),
      amount,
      category: transactionCategory.value,
      date: transactionDate.value,
      paymentMethod,
      cardId: selectedCardId,
      cardDebtDelta: 0,
      createdAt: new Date().toISOString()
    };

    if (type === "expense" && paymentMethod === "card") {
      const selectedCard = cards.find((card) => card.id === selectedCardId);

      if (!selectedCard) {
        window.alert("Seçilen kart bulunamadı.");
        return;
      }

      selectedCard.debt = Number(selectedCard.debt || 0) + amount;
      transaction.cardDebtDelta = amount;
      saveCards();
    }

    transactions.unshift(transaction);
    saveTransactions();
    renderEverything();

    transactionForm?.reset();
    if (transactionType) transactionType.value = "income";
    if (transactionDate) transactionDate.value = new Date().toISOString().split("T")[0];
    if (transactionCard) transactionCard.value = "";
    transactionCardField?.classList.add("hidden");
    closeTransactionModal();
  }

  function deleteTransaction(id) {
    if (!window.confirm("Bu işlem silinsin mi?")) return;

    const transaction = transactions.find((item) => item.id === id);
    if (!transaction) return;

    const debtDelta = Number(
      transaction.cardDebtDelta ??
      (transaction.type === "expense" && transaction.paymentMethod === "card" ? transaction.amount : 0)
    );

    if (transaction.cardId && debtDelta !== 0) {
      const selectedCard = cards.find((card) => card.id === transaction.cardId);

      if (selectedCard) {
        selectedCard.debt = Math.max(0, Number(selectedCard.debt || 0) - debtDelta);
        saveCards();
      }
    }

    transactions = transactions.filter((item) => item.id !== id);
    saveTransactions();
    renderEverything();
  }

  function renderEverything() {
    renderCards();
    renderTransactions();
    renderDashboard();
    renderUpcomingPayments();
  }

  function renderCards() {
    if (!cardsList) return;
    cardsList.innerHTML = "";

    if (cards.length === 0) {
      const empty = emptyCards || document.createElement("div");
      empty.className = "empty-state";
      empty.textContent = "Henüz kart eklenmedi.";
      empty.style.display = "block";
      cardsList.appendChild(empty);
      return;
    }

    cards.forEach((card) => {
      const availableLimit = Number(card.limit || 0) - Number(card.debt || 0);
      const usageRate = Number(card.limit || 0) > 0
        ? Math.round((Number(card.debt || 0) / Number(card.limit || 0)) * 100)
        : 0;

      const element = document.createElement("article");
      element.className = `bank-card ${getBankClass(card.bank)}`;
      element.innerHTML = `
        <div class="bank-card-header">
          <div>
            <span>${escapeHtml(card.bank)}</span>
            <h3>${escapeHtml(card.name)}</h3>
          </div>
          <div class="bank-card-actions">
            <button type="button" data-edit="${card.id}">Düzenle</button>
            <button type="button" data-delete="${card.id}">Sil</button>
          </div>
        </div>

        <strong class="bank-card-debt">${formatMoney(card.debt)}</strong>

        <div class="bank-card-details">
          <div><span>Kart Limiti</span><strong>${formatMoney(card.limit)}</strong></div>
          <div><span>Kalan Limit</span><strong>${formatMoney(availableLimit)}</strong></div>
          <div><span>Kullanım</span><strong>%${usageRate}</strong></div>
        </div>

        <div class="bank-card-dates">
          <div><span>Hesap Kesim</span><strong>${formatDate(card.statementDate)}</strong></div>
          <div><span>Son Ödeme</span><strong>${formatDate(card.dueDate)}</strong></div>
        </div>
      `;

      element.querySelector("[data-edit]")?.addEventListener("click", () => editCard(card.id));
      element.querySelector("[data-delete]")?.addEventListener("click", () => deleteCard(card.id));
      cardsList.appendChild(element);
    });
  }

  function renderTransactions() {
    if (!transactionsList) return;
    transactionsList.innerHTML = "";

    if (transactions.length === 0) {
      transactionsList.innerHTML = '<div class="empty-state">Henüz işlem eklenmedi.</div>';
    } else {
      transactions.forEach((transaction) => {
        const item = document.createElement("article");
        item.className = "transaction-item";

        const isIncome = transaction.type === "income";
        const amountClass = isIncome ? "transaction-income" : "transaction-expense";
        const prefix = isIncome ? "+" : "-";
        const card = transaction.cardId
          ? cards.find((item) => item.id === transaction.cardId)
          : null;
        const cardText = card ? ` · ${escapeHtml(card.bank)} - ${escapeHtml(card.name)}` : "";

        item.innerHTML = `
          <div>
            <h3>${escapeHtml(transaction.name)}</h3>
            <small>${escapeHtml(transaction.category)}${cardText} · ${formatDate(transaction.date)}</small>
          </div>
          <div>
            <strong class="${amountClass}">${prefix}${formatMoney(transaction.amount)}</strong>
            <button type="button" data-delete-transaction="${transaction.id}">Sil</button>
          </div>
        `;

        item.querySelector("[data-delete-transaction]")?.addEventListener("click", () => {
          deleteTransaction(transaction.id);
        });

        transactionsList.appendChild(item);
      });
    }
  }

  function renderDashboard() {
    const totalCardDebt = cards.reduce((sum, card) => sum + Number(card.debt || 0), 0);
    const totalCardLimit = cards.reduce((sum, card) => sum + Number(card.limit || 0), 0);
    const availableLimit = totalCardLimit - totalCardDebt;

    const income = transactions
      .filter((transaction) => transaction.type === "income")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const expense = transactions
      .filter((transaction) => transaction.type === "expense")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const nonCardExpense = transactions
      .filter((transaction) => transaction.type === "expense" && transaction.paymentMethod !== "card")
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    const cashBalance = income - nonCardExpense;
    const net = cashBalance - totalCardDebt;

    setText(totalDebt, formatMoney(totalCardDebt));
    setText(totalAssets, formatMoney(Math.max(0, cashBalance)));
    setText(netBalance, formatMoney(net));
    setText(cardCount, String(cards.length));

    setText(cardsTotalDebt, formatMoney(totalCardDebt));
    setText(cardsTotalLimit, formatMoney(totalCardLimit));
    setText(cardsAvailableLimit, formatMoney(availableLimit));

    setText(totalIncome, formatMoney(income));
    setText(totalExpense, formatMoney(expense));
    setText(transactionBalance, formatMoney(cashBalance));

    const now = new Date();
    const monthlyExpense = transactions
      .filter((transaction) => {
        if (transaction.type !== "expense" || !transaction.date) return false;
        const date = new Date(`${transaction.date}T12:00:00`);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

    setText(monthlyPayment, formatMoney(monthlyExpense));

    if (balanceStatus) {
      balanceStatus.textContent = net < 0 ? "Ekside" : net > 0 ? "Pozitif" : "Dengeli";
    }
  }

  function renderUpcomingPayments() {
    if (!upcomingPayments) return;
    upcomingPayments.innerHTML = "";

    const list = cards
      .filter((card) => card.dueDate)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    if (list.length === 0) {
      upcomingPayments.innerHTML = '<div class="empty-state">Henüz kart veya ödeme kaydı bulunmuyor.</div>';
      return;
    }

    list.slice(0, 3).forEach((card) => {
      const item = document.createElement("article");
      item.className = "payment-item";
      item.innerHTML = `
        <div class="bank-icon ${getPaymentIconClass(card.bank)}">${escapeHtml(card.bank.charAt(0))}</div>
        <div class="payment-info">
          <strong>${escapeHtml(card.bank)}</strong>
          <span>Son ödeme: ${formatDate(card.dueDate)}</span>
        </div>
        <strong class="payment-amount">${formatMoney(card.debt)}</strong>
      `;
      upcomingPayments.appendChild(item);
    });
  }

  function showCardFormMessage(text, isError) {
    if (!cardFormMessage) return;
    cardFormMessage.textContent = text;
    cardFormMessage.classList.remove("hidden");
    cardFormMessage.style.background = isError
      ? "rgba(251, 113, 133, 0.12)"
      : "rgba(52, 211, 153, 0.12)";
    cardFormMessage.style.color = isError ? "#fb7185" : "#34d399";
  }

  function hideCardFormMessage() {
    cardFormMessage?.classList.add("hidden");
  }

  function loadJson(key, fallback) {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (error) {
      console.error(`${key} okunamadı:`, error);
      return fallback;
    }
  }

  function saveCards() {
    saveJson(CARD_STORAGE_KEY, cards);
  }

  function saveTransactions() {
    saveJson(TRANSACTION_STORAGE_KEY, transactions);
  }

  function saveJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`${key} kaydedilemedi:`, error);
      window.alert("Veriler tarayıcıya kaydedilemedi.");
    }
  }

  function setText(element, text) {
    if (element) element.textContent = text;
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
    return date.toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function getBankClass(bank = "") {
    const name = bank.toLocaleLowerCase("tr-TR");
    if (name.includes("garanti")) return "bank-garanti";
    if (name.includes("ziraat")) return "bank-ziraat";
    if (name.includes("akbank")) return "bank-akbank";
    if (name.includes("qnb")) return "bank-qnb";
    if (name.includes("tom")) return "bank-tom";
    if (name.includes("iş")) return "bank-is";
    return "bank-default";
  }

  function getPaymentIconClass(bank = "") {
    const name = bank.toLocaleLowerCase("tr-TR");
    if (name.includes("ziraat") || name.includes("akbank")) return "red";
    if (name.includes("qnb")) return "purple";
    return "blue";
  }

  function createId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    })[character]);
  }
});
