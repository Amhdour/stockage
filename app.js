const STORAGE_KEY = "merch-stock-products";

const form = document.getElementById("product-form");
const inventoryBody = document.getElementById("inventory-body");
const searchInput = document.getElementById("search");
const clearAllBtn = document.getElementById("clear-all");

let products = loadProducts();

function loadProducts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function money(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function statusFor(product) {
  return product.quantity <= product.reorder ? "LOW" : "OK";
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = products.filter((p) =>
    [p.name, p.sku, p.category].some((field) => field.toLowerCase().includes(q))
  );

  inventoryBody.innerHTML = "";
  for (const p of filtered) {
    const tr = document.createElement("tr");
    const status = statusFor(p);

    tr.innerHTML = `
      <td>${p.name}</td>
      <td>${p.sku}</td>
      <td>${p.category}</td>
      <td>${money(p.price)}</td>
      <td>${p.quantity}</td>
      <td class="${status === "LOW" ? "status-low" : ""}">${status}</td>
      <td class="actions">
        <button class="adjust" data-action="inc" data-sku="${p.sku}">+1</button>
        <button class="adjust" data-action="dec" data-sku="${p.sku}">-1</button>
        <button class="delete" data-action="delete" data-sku="${p.sku}">Delete</button>
      </td>
    `;

    inventoryBody.appendChild(tr);
  }
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const product = {
    name: document.getElementById("name").value.trim(),
    sku: document.getElementById("sku").value.trim(),
    category: document.getElementById("category").value.trim(),
    price: Number(document.getElementById("price").value),
    quantity: Number(document.getElementById("quantity").value),
    reorder: Number(document.getElementById("reorder").value),
  };

  const existing = products.findIndex((p) => p.sku === product.sku);
  if (existing >= 0) {
    products[existing] = product;
  } else {
    products.push(product);
  }

  saveProducts();
  render();
  form.reset();
});

inventoryBody.addEventListener("click", (e) => {
  const target = e.target;
  if (!(target instanceof HTMLButtonElement)) return;

  const sku = target.dataset.sku;
  const action = target.dataset.action;
  const index = products.findIndex((p) => p.sku === sku);
  if (index < 0) return;

  if (action === "delete") {
    products.splice(index, 1);
  }

  if (action === "inc") {
    products[index].quantity += 1;
  }

  if (action === "dec") {
    products[index].quantity = Math.max(0, products[index].quantity - 1);
  }

  saveProducts();
  render();
});

searchInput.addEventListener("input", render);

clearAllBtn.addEventListener("click", () => {
  if (confirm("Delete all inventory items?")) {
    products = [];
    saveProducts();
    render();
  }
});

render();
