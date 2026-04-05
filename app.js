const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR-ANON-KEY";
const APP_USER_ID = "shared-user";

const { createClient } = window.supabase;
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const statusEl = document.getElementById("status");
const incomeListEl = document.getElementById("income-list");
const expenseListEl = document.getElementById("expense-list");
const recurringListEl = document.getElementById("recurring-list");

const data = {
  incomeEntries: [],
  expenseEntries: [],
  recurringEntries: [],
};

function setStatus(msg, error = false) {
  statusEl.textContent = msg;
  statusEl.style.background = error ? "#fee2e2" : "#e5e7eb";
}

function cloneDataState() {
  return {
    incomeEntries: structuredClone(data.incomeEntries),
    expenseEntries: structuredClone(data.expenseEntries),
    recurringEntries: structuredClone(data.recurringEntries),
  };
}

function restoreDataState(snapshot) {
  data.incomeEntries = snapshot.incomeEntries;
  data.expenseEntries = snapshot.expenseEntries;
  data.recurringEntries = snapshot.recurringEntries;
  render();
}

function render() {
  incomeListEl.innerHTML = "";
  expenseListEl.innerHTML = "";
  recurringListEl.innerHTML = "";

  data.incomeEntries.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.month_key} • ${entry.name}: $${Number(entry.amount).toFixed(2)} (${entry.status})`;
    incomeListEl.appendChild(li);
  });

  data.expenseEntries.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.month_key} • ${entry.name}: $${Number(entry.amount).toFixed(2)} [${entry.category}]`;
    expenseListEl.appendChild(li);
  });

  data.recurringEntries.forEach((entry) => {
    const li = document.createElement("li");
    li.textContent = `${entry.freq} • ${entry.name}: $${Number(entry.amount).toFixed(2)} [${entry.category}]`;
    recurringListEl.appendChild(li);
  });
}

async function save() {
  // DB is source of truth now; keep function name for compatibility.
  await fetchAllFromDB();
}

async function fetchAllFromDB() {
  const [incomeRes, expenseRes, recurringRes] = await Promise.all([
    supabase
      .from("income_entries")
      .select("*")
      .eq("user_id", APP_USER_ID)
      .order("created_at", { ascending: true }),
    supabase
      .from("expense_entries")
      .select("*")
      .eq("user_id", APP_USER_ID)
      .order("created_at", { ascending: true }),
    supabase
      .from("recurring_entries")
      .select("*")
      .eq("user_id", APP_USER_ID)
      .order("created_at", { ascending: true }),
  ]);

  const errors = [incomeRes.error, expenseRes.error, recurringRes.error].filter(Boolean);
  if (errors.length > 0) {
    throw new Error(errors.map((err) => err.message).join("; "));
  }

  data.incomeEntries = incomeRes.data ?? [];
  data.expenseEntries = expenseRes.data ?? [];
  data.recurringEntries = recurringRes.data ?? [];
  render();
}

async function mutateWithSync({ optimisticUpdate, remoteWrite, actionLabel }) {
  const snapshot = cloneDataState();

  try {
    optimisticUpdate();
    render();

    await remoteWrite();

    // Re-fetch after mutation so both users converge to latest DB values.
    await fetchAllFromDB();
    setStatus(`${actionLabel} saved + synced.`);
  } catch (error) {
    restoreDataState(snapshot);
    setStatus(`${actionLabel} failed. Rolled back. ${error.message}`, true);
  }
}

async function insertIncome(payload) {
  const tempId = `tmp-${crypto.randomUUID()}`;

  await mutateWithSync({
    actionLabel: "Income",
    optimisticUpdate: () => {
      data.incomeEntries.push({
        id: tempId,
        created_at: new Date().toISOString(),
        ...payload,
      });
    },
    remoteWrite: async () => {
      const { error } = await supabase.from("income_entries").insert(payload);
      if (error) {
        throw new Error(error.message);
      }
    },
  });
}

async function insertExpense(payload) {
  const tempId = `tmp-${crypto.randomUUID()}`;

  await mutateWithSync({
    actionLabel: "Expense",
    optimisticUpdate: () => {
      data.expenseEntries.push({
        id: tempId,
        created_at: new Date().toISOString(),
        ...payload,
      });
    },
    remoteWrite: async () => {
      const { error } = await supabase.from("expense_entries").insert(payload);
      if (error) {
        throw new Error(error.message);
      }
    },
  });
}

async function insertRecurring(payload) {
  const tempId = `tmp-${crypto.randomUUID()}`;

  await mutateWithSync({
    actionLabel: "Recurring",
    optimisticUpdate: () => {
      data.recurringEntries.push({
        id: tempId,
        created_at: new Date().toISOString(),
        ...payload,
      });
    },
    remoteWrite: async () => {
      const { error } = await supabase.from("recurring_entries").insert(payload);
      if (error) {
        throw new Error(error.message);
      }
    },
  });
}

function formToObject(form) {
  const formData = new FormData(form);
  return Object.fromEntries(formData.entries());
}

document.getElementById("income-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const raw = formToObject(event.currentTarget);

  await insertIncome({
    user_id: APP_USER_ID,
    month_key: raw.month_key,
    name: raw.name,
    amount: Number(raw.amount),
    status: raw.status,
    origin_id: raw.origin_id || null,
    rolled_from: raw.rolled_from || null,
  });

  event.currentTarget.reset();
});

document.getElementById("expense-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const raw = formToObject(event.currentTarget);

  await insertExpense({
    user_id: APP_USER_ID,
    month_key: raw.month_key,
    name: raw.name,
    amount: Number(raw.amount),
    category: raw.category,
  });

  event.currentTarget.reset();
});

document.getElementById("recurring-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const raw = formToObject(event.currentTarget);

  await insertRecurring({
    user_id: APP_USER_ID,
    freq: raw.freq,
    name: raw.name,
    amount: Number(raw.amount),
    category: raw.category,
    start_key: raw.start_key,
    month_for_yearly: raw.month_for_yearly ? Number(raw.month_for_yearly) : null,
  });

  event.currentTarget.reset();
});

(async function init() {
  try {
    setStatus("Loading from DB…");
    await save();
    setStatus("Loaded from DB.");
  } catch (error) {
    setStatus(`Initial load failed: ${error.message}`, true);
  }
})();
