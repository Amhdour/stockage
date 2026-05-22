const STORAGE_KEY = "merch-stock-products";

const form = document.getElementById("product-form");
const inventoryBody = document.getElementById("inventory-body");
const searchInput = document.getElementById("search");
const sortByInput = document.getElementById("sort-by");
const clearAllBtn = document.getElementById("clear-all");
const exportBtn = document.getElementById("export-json");
const formMessage = document.getElementById("form-message");

const statProducts = document.getElementById("stat-products");
const statUnits = document.getElementById("stat-units");
const statValue = document.getElementById("stat-value");
const statLow = document.getElementById("stat-low");

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

function normalize(text) {
  return text.trim().replace(/\s+/g, " ");
}

function validateProduct(product) {
  if (!product.name || !product.sku || !product.category) {
    return "Name, SKU, and category are required.";
  }
  if (Number.isNaN(product.price) || product.price < 0) {
    return "Price must be zero or greater.";
  }
  if (!Number.isInteger(product.quantity) || product.quantity < 0) {
    return "Quantity must be a whole number zero or greater.";
  }
  if (!Number.isInteger(product.reorder) || product.reorder < 0) {
    return "Reorder level must be a whole number zero or greater.";
  }
  return "";
}

function sortedProducts(list) {
  const [field, direction] = sortByInput.value.split("-");
  const dir = direction === "desc" ? -1 : 1;

  return [...list].sort((a, b) => {
    if (field === "qty") return (a.quantity - b.quantity) * dir;
    if (field === "value") return (a.price * a.quantity - b.price * b.quantity) * dir;
    return a.name.localeCompare(b.name) * dir;
  });
}

function renderFeatureCard() {
  const top = products[0];
  const featureName = document.getElementById("feature-name");
  const featurePrice = document.getElementById("feature-price");
  if (!featureName || !featurePrice) return;
  if (!top) {
    featureName.textContent = "Wool Runner";
    featurePrice.textContent = "$0.00";
    return;
  }
  featureName.textContent = top.name;
  featurePrice.textContent = money(top.price);
}

function renderStats() {
  const totalProducts = products.length;
  const totalUnits = products.reduce((sum, p) => sum + p.quantity, 0);
  const totalValue = products.reduce((sum, p) => sum + p.quantity * p.price, 0);
  const lowStock = products.filter((p) => statusFor(p) === "LOW").length;

  statProducts.textContent = String(totalProducts);
  statUnits.textContent = String(totalUnits);
  statValue.textContent = money(totalValue);
  statLow.textContent = String(lowStock);
}

function render() {
  const q = searchInput.value.trim().toLowerCase();
  const filtered = products.filter((p) =>
    [p.name, p.sku, p.category].some((field) => field.toLowerCase().includes(q))
  );
  const ordered = sortedProducts(filtered);

  inventoryBody.innerHTML = "";
  for (const p of ordered) {
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

  renderStats();
  renderFeatureCard();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const product = {
    name: normalize(document.getElementById("name").value),
    sku: normalize(document.getElementById("sku").value).toUpperCase(),
    category: normalize(document.getElementById("category").value),
    price: Number(document.getElementById("price").value),
    quantity: Number(document.getElementById("quantity").value),
    reorder: Number(document.getElementById("reorder").value),
  };

  const validationError = validateProduct(product);
  if (validationError) {
    formMessage.textContent = validationError;
    return;
  }

  const existing = products.findIndex((p) => p.sku === product.sku);
  if (existing >= 0) {
    products[existing] = product;
    formMessage.textContent = `Updated ${product.name} (${product.sku}).`;
  } else {
    products.push(product);
    formMessage.textContent = `Added ${product.name} (${product.sku}).`;
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

  if (action === "delete") products.splice(index, 1);
  if (action === "inc") products[index].quantity += 1;
  if (action === "dec") products[index].quantity = Math.max(0, products[index].quantity - 1);

  saveProducts();
  render();
});

exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(products, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

searchInput.addEventListener("input", render);
sortByInput.addEventListener("change", render);

clearAllBtn.addEventListener("click", () => {
  if (confirm("Delete all inventory items?")) {
    products = [];
    saveProducts();
    render();
  }
});

render();
