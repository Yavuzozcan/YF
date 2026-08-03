// =========================================
// YF — Yavuz Finans
// Kart Yönetimi ve Dashboard
// =========================================

document.addEventListener("DOMContentLoaded", () => {
  const STORAGE_KEY = "yf_cards_v1";

  let cards = loadCards();

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

  const openCardFormButton =
    document.getElementById("openCardFormButton");

  const quickAddCardButton =
    document.getElementById("quickAddCardButton");

  const closeCardFormButton =
    document.getElementById("closeCardFormButton");

  const cancelCardButton =
    document.getElementById("cancelCardButton");

  const modalBackdrop =
    document.getElementById("modalBackdrop");
  const transactionModal =
    document.getElementById("transactionModal");

const transactionForm =
    document.getElementById("transactionForm");
  const transactionPaymentMethod =
  document.getElementById("transactionPaymentMethod");

const transactionCard =
  document.getElementById("transactionCard");

const transactionCardField =
  document.getElementById("transactionCardField");

const openTransactionFormButton =
    document.getElementById("openTransactionFormButton");

const closeTransactionFormButton =
    document.getElementById("closeTransactionFormButton");

const cancelTransactionButton =
    document.getElementById("cancelTransactionButton");

const transactionModalBackdrop =
    document.getElementById("transactionModalBackdrop");

  const cardsList =
    document.getElementById("cardsList");

  const emptyCards =
    document.getElementById("emptyCards");

  const upcomingPayments =
    document.getElementById("upcomingPayments");

  const totalDebt =
    document.getElementById("totalDebt");

  const netBalance =
    document.getElementById("netBalance");

  const balanceStatus =
    document.getElementById("balanceStatus");

  const cardCount =
    document.getElementById("cardCount");

  const cardsTotalDebt =
    document.getElementById("cardsTotalDebt");

  const cardsTotalLimit =
    document.getElementById("cardsTotalLimit");

  const cardsAvailableLimit =
    document.getElementById("cardsAvailableLimit");

  setupWelcomeText();
  setupNavigation();
  setupModalEvents();

  renderEverything();

  function setupWelcomeText() {
    const welcomeText =
      document.getElementById("welcomeText");

    if (!welcomeText) return;

    const hour = new Date().getHours();

    if (hour < 12) {
      welcomeText.textContent =
        "Günaydın Yavuz 👋";
    } else if (hour < 18) {
      welcomeText.textContent =
        "İyi Günler Yavuz 👋";
    } else {
      welcomeText.textContent =
        "İyi Akşamlar Yavuz 👋";
    }
  }

  function setupNavigation() {
    navItems.forEach((button) => {
      button.addEventListener("click", () => {
        const targetPage =
          button.dataset.page;

        showPage(targetPage);

        navItems.forEach((item) => {
          item.classList.remove("active");
        });

        button.classList.add("active");

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      });
    });
  }

  function showPage(pageId) {
    pages.forEach((page) => {
      page.classList.remove("active");
    });

    const selectedPage =
      document.getElementById(pageId);

    if (selectedPage) {
      selectedPage.classList.add("active");
    }
  }

  function setupModalEvents() {
    openCardFormButton?.addEventListener(
      "click",
      openNewCardForm
    );

    quickAddCardButton?.addEventListener(
      "click",
      openNewCardForm
    );

    closeCardFormButton?.addEventListener(
      "click",
      closeCardModal
    );

    cancelCardButton?.addEventListener(
      "click",
      closeCardModal
    );

    modalBackdrop?.addEventListener(
      "click",
      closeCardModal
    );

    cardForm?.addEventListener(
      "submit",
      saveCard
    );
    openTransactionFormButton?.addEventListener("click", () => {
  transactionCard.innerHTML = '<option value="">Kart seç</option>';

  cards.forEach((card) => {
    const option = document.createElement("option");

    option.value = card.id;
    option.textContent = `${card.bank} - ${card.name}`;

    transactionCard.appendChild(option);
  });

  transactionModal?.classList.remove("hidden");
  document.body.style.overflow = "hidden";
});

closeTransactionFormButton?.addEventListener("click", () => {
    transactionModal?.classList.add("hidden");
    document.body.style.overflow = "";
});

cancelTransactionButton?.addEventListener("click", () => {
    transactionModal?.classList.add("hidden");
    document.body.style.overflow = "";
});

transactionModalBackdrop?.addEventListener("click", () => {
    transactionModal?.classList.add("hidden");
    document.body.style.overflow = "";
});
    transactionPaymentMethod?.addEventListener("change", () => {
  if (transactionPaymentMethod.value === "card") {
    transactionCardField.classList.remove("hidden");
  } else {
    transactionCardField.classList.add("hidden");
    transactionCard.value = "";
  }
});
  }

  function openNewCardForm() {
    resetCardForm();

    cardFormTitle.textContent =
      "Yeni Kart Ekle";

    openCardModal();
  }

  function openCardModal() {
    cardModal.classList.remove("hidden");

    document.body.style.overflow =
      "hidden";
  }

  function closeCardModal() {
    cardModal.classList.add("hidden");

    document.body.style.overflow =
      "";

    hideFormMessage();
  }

  function resetCardForm() {
    cardForm.reset();

    cardId.value = "";

    hideFormMessage();
  }

  function saveCard(event) {
    event.preventDefault();

    const limit =
      Number(cardLimit.value);

    const debt =
      Number(cardDebt.value);

    if (!bankName.value) {
      showFormMessage(
        "Lütfen banka seç.",
        true
      );

      return;
    }

    if (!cardName.value.trim()) {
      showFormMessage(
        "Lütfen kart adını yaz.",
        true
      );

      return;
    }

    if (
      !Number.isFinite(limit) ||
      limit < 0
    ) {
      showFormMessage(
        "Kart limitini doğru gir.",
        true
      );

      return;
    }

    if (
      !Number.isFinite(debt) ||
      debt < 0
    ) {
      showFormMessage(
        "Güncel borcu doğru gir.",
        true
      );

      return;
    }

    if (debt > limit) {
      showFormMessage(
        "Güncel borç kart limitinden büyük olamaz.",
        true
      );

      return;
    }

    const newCard = {
      id:
        cardId.value ||
        createId(),

      bank:
        bankName.value,

      name:
        cardName.value.trim(),

      limit,

      debt,

      statementDate:
        statementDate.value,

      dueDate:
        dueDate.value,

      createdAt:
        new Date().toISOString()
    };

    const existingCardIndex =
      cards.findIndex(
        (card) =>
          card.id === newCard.id
      );

    if (existingCardIndex >= 0) {
      cards[existingCardIndex] =
        newCard;
    } else {
      cards.push(newCard);
    }

    saveCards();

    renderEverything();

    showFormMessage(
      "Kart başarıyla kaydedildi.",
      false
    );

    setTimeout(() => {
      closeCardModal();
      showCardsPage();
    }, 700);
  }

  function editCard(id) {
    const card =
      cards.find(
        (item) =>
          item.id === id
      );

    if (!card) return;

    cardId.value =
      card.id;

    bankName.value =
      card.bank;

    cardName.value =
      card.name;

    cardLimit.value =
      card.limit;

    cardDebt.value =
      card.debt;

    statementDate.value =
      card.statementDate || "";

    dueDate.value =
      card.dueDate || "";

    cardFormTitle.textContent =
      "Kartı Düzenle";

    openCardModal();
  }

  function deleteCard(id) {
    const card =
      cards.find(
        (item) =>
          item.id === id
      );

    if (!card) return;

    const approved =
      window.confirm(
        `${card.bank} kartı silinsin mi?`
      );

    if (!approved) return;

    cards =
      cards.filter(
        (item) =>
          item.id !== id
      );

    saveCards();

    renderEverything();
  }

  function showCardsPage() {
    pages.forEach((page) => {
      page.classList.remove("active");
    });

    document
      .getElementById("cardsPage")
      ?.classList.add("active");

    navItems.forEach((item) => {
      item.classList.remove("active");

      if (
        item.dataset.page ===
        "cardsPage"
      ) {
        item.classList.add("active");
      }
    });
  }

  function renderEverything() {
    renderCards();
    renderDashboard();
    renderUpcomingPayments();
  }

  function renderCards() {
    cardsList.innerHTML = "";

    if (cards.length === 0) {
      emptyCards.style.display =
        "block";

      cardsList.appendChild(
        emptyCards
      );

      return;
    }

    emptyCards.style.display =
      "none";

    cards.forEach((card) => {
      const availableLimit =
        Math.max(
          0,
          card.limit - card.debt
        );

      const usageRate =
        card.limit > 0
          ? Math.min(
              100,
              Math.round(
                (card.debt /
                  card.limit) *
                  100
              )
            )
          : 0;

      const cardElement =
        document.createElement(
          "article"
        );

      cardElement.className =
        `bank-card ${getBankClass(
          card.bank
        )}`;

      cardElement.innerHTML = `
        <div class="bank-card-header">

          <div>

            <span>
              ${escapeHtml(card.bank)}
            </span>

            <h3>
              ${escapeHtml(card.name)}
            </h3>

          </div>

          <div class="bank-card-actions">

            <button
              type="button"
              data-edit="${card.id}"
            >
              Düzenle
            </button>

            <button
              type="button"
              data-delete="${card.id}"
            >
              Sil
            </button>

          </div>

        </div>

        <strong class="bank-card-debt">
          ${formatMoney(card.debt)}
        </strong>

        <div class="bank-card-details">

          <div>

            <span>
              Kart Limiti
            </span>

            <strong>
              ${formatMoney(card.limit)}
            </strong>

          </div>

          <div>

            <span>
              Kalan Limit
            </span>

            <strong>
              ${formatMoney(
                availableLimit
              )}
            </strong>

          </div>

          <div>

            <span>
              Kullanım
            </span>

            <strong>
              %${usageRate}
            </strong>

          </div>

        </div>

        <div class="bank-card-dates">

          <div>

            <span>
              Hesap Kesim
            </span>

            <strong>
              ${formatDate(
                card.statementDate
              )}
            </strong>

          </div>

          <div>

            <span>
              Son Ödeme
            </span>

            <strong>
              ${formatDate(
                card.dueDate
              )}
            </strong>

          </div>

        </div>
      `;

      const editButton =
        cardElement.querySelector(
          "[data-edit]"
        );

      const deleteButton =
        cardElement.querySelector(
          "[data-delete]"
        );

      editButton.addEventListener(
        "click",
        () =>
          editCard(card.id)
      );

      deleteButton.addEventListener(
        "click",
        () =>
          deleteCard(card.id)
      );

      cardsList.appendChild(
        cardElement
      );
    });
  }

  function renderDashboard() {
    const totalCardDebt =
      cards.reduce(
        (total, card) =>
          total +
          Number(card.debt || 0),
        0
      );

    const totalCardLimit =
      cards.reduce(
        (total, card) =>
          total +
          Number(card.limit || 0),
        0
      );

    const availableLimit =
      Math.max(
        0,
        totalCardLimit -
          totalCardDebt
      );

    const net =
      0 - totalCardDebt;

    totalDebt.textContent =
      formatMoney(totalCardDebt);

    netBalance.textContent =
      formatMoney(net);

    cardCount.textContent =
      cards.length;

    cardsTotalDebt.textContent =
      formatMoney(totalCardDebt);

    cardsTotalLimit.textContent =
      formatMoney(totalCardLimit);

    cardsAvailableLimit.textContent =
      formatMoney(availableLimit);

    if (net < 0) {
      balanceStatus.textContent =
        "Ekside";
    } else if (net > 0) {
      balanceStatus.textContent =
        "Pozitif";
    } else {
      balanceStatus.textContent =
        "Dengeli";
    }
  }

  function renderUpcomingPayments() {
    upcomingPayments.innerHTML =
      "";

    const cardsWithDueDate =
      cards
        .filter(
          (card) =>
            card.dueDate
        )
        .sort(
          (a, b) =>
            new Date(a.dueDate) -
            new Date(b.dueDate)
        );

    if (
      cardsWithDueDate.length === 0
    ) {
      upcomingPayments.innerHTML = `
        <div class="empty-state">
          Henüz kart veya ödeme kaydı bulunmuyor.
        </div>
      `;

      return;
    }

    cardsWithDueDate
      .slice(0, 3)
      .forEach((card) => {
        const item =
          document.createElement(
            "article"
          );

        item.className =
          "payment-item";

        item.innerHTML = `
          <div class="bank-icon ${getPaymentIconClass(
            card.bank
          )}">
            ${escapeHtml(
              card.bank.charAt(0)
            )}
          </div>

          <div class="payment-info">

            <strong>
              ${escapeHtml(card.bank)}
            </strong>

            <span>
              Son ödeme:
              ${formatDate(card.dueDate)}
            </span>

          </div>

          <strong class="payment-amount">
            ${formatMoney(card.debt)}
          </strong>
        `;

        upcomingPayments.appendChild(
          item
        );
      });
  }

  function showFormMessage(
    text,
    isError
  ) {
    cardFormMessage.textContent =
      text;

    cardFormMessage.classList.remove(
      "hidden"
    );

    if (isError) {
      cardFormMessage.style.background =
        "rgba(251, 113, 133, 0.12)";

      cardFormMessage.style.color =
        "#fb7185";
    } else {
      cardFormMessage.style.background =
        "rgba(52, 211, 153, 0.12)";

      cardFormMessage.style.color =
        "#34d399";
    }
  }

  function hideFormMessage() {
    cardFormMessage.classList.add(
      "hidden"
    );
  }

  function loadCards() {
    try {
      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );

      return saved
        ? JSON.parse(saved)
        : [];
    } catch (error) {
      console.error(
        "Kart verileri okunamadı:",
        error
      );

      return [];
    }
  }

  function saveCards() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(cards)
      );
    } catch (error) {
      console.error(
        "Kartlar kaydedilemedi:",
        error
      );

      window.alert(
        "Kartlar tarayıcıya kaydedilemedi."
      );
    }
  }

  function formatMoney(value) {
    return new Intl.NumberFormat(
      "tr-TR",
      {
        style: "currency",
        currency: "TRY"
      }
    ).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) {
      return "Belirtilmedi";
    }

    const date =
      new Date(
        `${value}T12:00:00`
      );

    return date.toLocaleDateString(
      "tr-TR",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );
  }

  function getBankClass(bank) {
    const bankName =
      bank.toLowerCase();

    if (
      bankName.includes("garanti")
    ) {
      return "bank-garanti";
    }

    if (
      bankName.includes("ziraat")
    ) {
      return "bank-ziraat";
    }

    if (
      bankName.includes("akbank")
    ) {
      return "bank-akbank";
    }

    if (
      bankName.includes("qnb")
    ) {
      return "bank-qnb";
    }

    if (
      bankName.includes("tom")
    ) {
      return "bank-tom";
    }

    if (
      bankName.includes("iş")
    ) {
      return "bank-is";
    }

    return "bank-default";
  }

  function getPaymentIconClass(
    bank
  ) {
    const bankName =
      bank.toLowerCase();

    if (
      bankName.includes("ziraat") ||
      bankName.includes("akbank")
    ) {
      return "red";
    }

    if (
      bankName.includes("qnb")
    ) {
      return "purple";
    }

    return "blue";
  }

  function createId() {
    if (
      window.crypto &&
      crypto.randomUUID
    ) {
      return crypto.randomUUID();
    }

    return String(
      Date.now() +
      Math.random()
    );
  }

  function escapeHtml(value) {
    return String(value).replace(
      /[&<>"']/g,
      (character) => {
        const characters = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        };

        return characters[
          character
        ];
      }
    );
  }
  // =========================================
// İŞLEM KAYIT SİSTEMİ
// =========================================

const TRANSACTION_STORAGE_KEY = "yf_transactions_v1";

let transactions = loadTransactions();

const transactionType =
  document.getElementById("transactionType");

const transactionName =
  document.getElementById("transactionName");

const transactionAmount =
  document.getElementById("transactionAmount");

const transactionCategory =
  document.getElementById("transactionCategory");

const transactionDate =
  document.getElementById("transactionDate");

const transactionsList =
  document.getElementById("transactionsList");

const totalIncome =
  document.getElementById("totalIncome");

const totalExpense =
  document.getElementById("totalExpense");

const transactionBalance =
  document.getElementById("transactionBalance");

const totalAssets =
  document.getElementById("totalAssets");

const monthlyPayment =
  document.getElementById("monthlyPayment");

if (transactionDate && !transactionDate.value) {
  transactionDate.value =
    new Date().toISOString().split("T")[0];
}

transactionForm?.addEventListener("submit", (event) => {
  event.preventDefault();

  const amount = Number(transactionAmount.value);

  if (!transactionName.value.trim()) {
    alert("Lütfen işlem açıklamasını yaz.");
    return;
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Lütfen geçerli bir tutar gir.");
    return;
  }

  if (!transactionCategory.value) {
    alert("Lütfen kategori seç.");
    return;
  }

  if (!transactionDate.value) {
    alert("Lütfen tarih seç.");
    return;
  }

  const transaction = {
  id: createId(),
  type: transactionType.value,
  name: transactionName.value.trim(),
  amount,
  category: transactionCategory.value,
  date: transactionDate.value,
  paymentMethod: transactionPaymentMethod.value,
  cardId:
    transactionPaymentMethod.value === "card"
      ? transactionCard.value
      : "",
  createdAt: new Date().toISOString()
};
  if (transaction.type === "expense" &&
    transactionPaymentMethod.value === "card" &&
    transactionCard.value) {

    const card = cards.find(c => c.id === transactionCard.value);

    if (card) {
        card.debt += amount;
        saveCards();
    }
}

  if (
  transaction.type === "expense" &&
  transaction.paymentMethod === "card" &&
  transaction.cardId
) {
  const card = cards.find(
    card => card.id === transaction.cardId
  );

  if (card) {
    card.debt += amount;
    saveCards();
  }
}

transactions.unshift(transaction);

saveTransactions();
renderTransactions();
renderCards();
renderDashboard();
renderUpcomingPayments();

  transactionForm.reset();

  transactionType.value = "income";
  transactionDate.value =
    new Date().toISOString().split("T")[0];

  transactionModal.classList.add("hidden");
  document.body.style.overflow = "";
});

function loadTransactions() {
  try {
    const saved =
      localStorage.getItem(TRANSACTION_STORAGE_KEY);

    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("İşlemler okunamadı:", error);
    return [];
  }
}

function saveTransactions() {
  localStorage.setItem(
    TRANSACTION_STORAGE_KEY,
    JSON.stringify(transactions)
  );
}

function deleteTransaction(id) {
  const approved =
    confirm("Bu işlem silinsin mi?");

  if (!approved) return;

  transactions =
    transactions.filter(
      transaction => transaction.id !== id
    );

  saveTransactions();
  renderTransactions();
}

function renderTransactions() {
  if (!transactionsList) return;

  transactionsList.innerHTML = "";

  if (transactions.length === 0) {
    transactionsList.innerHTML = `
      <div class="empty-state">
        Henüz işlem eklenmedi.
      </div>
    `;
  } else {
    transactions.forEach(transaction => {
      const item = document.createElement("article");

      item.className = "transaction-item";

      const amountClass =
        transaction.type === "income"
          ? "transaction-income"
          : "transaction-expense";

      const amountPrefix =
        transaction.type === "income"
          ? "+"
          : "-";

      item.innerHTML = `
        <div>
          <h3>${escapeHtml(transaction.name)}</h3>

          <small>
            ${escapeHtml(transaction.category)}
            ·
            ${formatDate(transaction.date)}
          </small>
        </div>

        <div>
          <strong class="${amountClass}">
            ${amountPrefix}${formatMoney(transaction.amount)}
          </strong>

          <button
            type="button"
            data-delete-transaction="${transaction.id}"
          >
            Sil
          </button>
        </div>
      `;

      item
        .querySelector("[data-delete-transaction]")
        .addEventListener("click", () => {
          deleteTransaction(transaction.id);
        });

      transactionsList.appendChild(item);
    });
  }

  const income = transactions
    .filter(transaction => transaction.type === "income")
    .reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );

  const expense = transactions
    .filter(transaction => transaction.type === "expense")
    .reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );

  const nonCardExpense = transactions
  .filter(
    transaction =>
      transaction.type === "expense" &&
      transaction.paymentMethod !== "card"
  )
  .reduce(
    (sum, transaction) =>
      sum + Number(transaction.amount),
    0
  );

const balance = income - nonCardExpense;

  totalIncome.textContent = formatMoney(income);
  totalExpense.textContent = formatMoney(expense);
  transactionBalance.textContent = formatMoney(balance);

  if (totalAssets) {
    totalAssets.textContent =
      formatMoney(Math.max(0, balance));
  }

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const thisMonthExpense = transactions
    .filter(transaction => {
      const date =
        new Date(`${transaction.date}T12:00:00`);

      return (
        transaction.type === "expense" &&
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear
      );
    })
    .reduce(
      (sum, transaction) => sum + Number(transaction.amount),
      0
    );

  if (monthlyPayment) {
    monthlyPayment.textContent =
      formatMoney(thisMonthExpense);
  }

  const cardDebt = cards.reduce(
    (sum, card) => sum + Number(card.debt || 0),
    0
  );

  if (netBalance) {
    netBalance.textContent =
      formatMoney(balance - cardDebt);
  }
}

renderTransactions();
});
