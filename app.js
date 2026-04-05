/* global window, document, supabase */

const statusEl = document.getElementById('status');
const totalEl = document.getElementById('total');
const expenseListEl = document.getElementById('expense-list');
const form = document.getElementById('expense-form');

const today = new Date().toISOString().slice(0, 10);
document.getElementById('spent_on').value = today;

const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || SUPABASE_URL.includes('YOUR_PROJECT_REF')) {
  setStatus('Update config.js with your Supabase URL and anon key.', true);
}

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

form.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    title: String(formData.get('title')).trim(),
    amount: Number(formData.get('amount')),
    spent_on: String(formData.get('spent_on'))
  };

  if (!payload.title || Number.isNaN(payload.amount) || payload.amount <= 0 || !payload.spent_on) {
    setStatus('Please provide valid description, amount, and date.', true);
    return;
  }

  setStatus('Saving expense...');
  const { error } = await client.from('expenses').insert(payload);
  if (error) {
    setStatus(`Could not save expense: ${error.message}`, true);
    return;
  }

  form.reset();
  document.getElementById('spent_on').value = today;
  setStatus('Expense added.');
  await loadExpenses();
});

async function loadExpenses() {
  setStatus('Loading expenses...');
  const { data, error } = await client
    .from('expenses')
    .select('id, title, amount, spent_on, created_at')
    .order('spent_on', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    setStatus(`Failed to load expenses: ${error.message}`, true);
    return;
  }

  renderList(data || []);
  setStatus(data.length ? 'Loaded expenses.' : 'No expenses yet. Add your first item.');
}

function renderList(rows) {
  expenseListEl.innerHTML = '';

  const total = rows.reduce((sum, row) => sum + Number(row.amount || 0), 0);
  totalEl.textContent = `Total: $${total.toFixed(2)}`;

  for (const row of rows) {
    const item = document.createElement('li');
    item.className = 'expense-item';

    const meta = document.createElement('div');
    meta.className = 'expense-meta';
    const title = document.createElement('span');
    title.className = 'expense-title';
    title.textContent = row.title;
    const date = document.createElement('span');
    date.className = 'expense-date';
    date.textContent = new Date(row.spent_on).toLocaleDateString();

    meta.append(title, date);

    const actions = document.createElement('div');
    actions.className = 'expense-actions';

    const amount = document.createElement('strong');
    amount.textContent = `$${Number(row.amount).toFixed(2)}`;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.type = 'button';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
      const confirmed = window.confirm(`Delete expense "${row.title}"?`);
      if (!confirmed) return;

      setStatus('Deleting expense...');
      const { error } = await client.from('expenses').delete().eq('id', row.id);
      if (error) {
        setStatus(`Could not delete expense: ${error.message}`, true);
        return;
      }

      setStatus('Expense deleted.');
      await loadExpenses();
    });

    actions.append(amount, deleteBtn);
    item.append(meta, actions);
    expenseListEl.append(item);
  }
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? '#b91c1c' : '#4b5563';
}

void loadExpenses();
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
