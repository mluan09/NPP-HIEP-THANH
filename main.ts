import * as XLSX from "xlsx";
import { Capacitor } from "@capacitor/core";
import {
  Account,
  InventoryItem,
  DailySaleRow,
  DebtRow,
  CashbookRow,
  loadInventory,
  saveInventory,
  loadSales,
  loadDebts,
  loadCashbook,
} from "./data";
import { login } from "./auth";
// import { supabase } from "./supabaseClient";

let lastLocalMutateAt = 0;
let hasShownRefreshNotice = false;

function initRealtimeListeners() {
  // Realtime is currently disabled as Supabase is not required for now.
}

type UndoData =
  | { action: "add"; itemId: number }
  | { action: "edit"; previousItem: InventoryItem; currentItemId: number }
  | { action: "delete"; previousItem: InventoryItem };

type ActionLogRow = {
  id: string;
  time: string;
  type: string;
  content: string;
  status: "success" | "error";
  undoData?: UndoData;
  undone?: boolean;
};

type TabName = "inventory" | "sales" | "debt" | "cashbook";

let currentAccount: Account | null = null;
let inventory: InventoryItem[] = [];
let sales: DailySaleRow[] = [];
let debts: DebtRow[] = [];
let cashbook: CashbookRow[] = [];
let actionLogs: ActionLogRow[] = [];
let editingInventoryId: number | null = null;
let currentTab: TabName = "inventory";

// Dynamic page size: 10 on desktop, 5 on tablet, 3 on mobile
function getPageSize(): number {
  if (window.innerWidth >= 768) return 10;
  if (window.innerWidth >= 480) return 5;
  return 3;
}

let tabPages: Record<TabName, number> = {
  inventory: 1,
  sales: 1,
  debt: 1,
  cashbook: 1,
};

const loginScreen = document.getElementById("loginScreen") as HTMLElement;
const dashboard = document.getElementById("dashboard") as HTMLElement;

const loginEmail = document.getElementById("loginEmail") as HTMLInputElement;
const loginPassword = document.getElementById("loginPassword") as HTMLInputElement;
const rememberMe = document.getElementById("rememberMe") as HTMLInputElement;

const loginBtn = document.getElementById("loginBtn") as HTMLButtonElement;
const logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement;
const exportExcelBtn = document.getElementById("exportExcelBtn") as HTMLButtonElement;

const currentUserName = document.getElementById("currentUserName") as HTMLElement;
const currentUserRole = document.getElementById("currentUserRole") as HTMLElement;
const userRoleText = document.getElementById("userRoleText") as HTMLElement;
const pageTitle = document.getElementById("pageTitle") as HTMLElement;

const mobileMenuBtn = document.getElementById("mobileMenuBtn") as HTMLButtonElement;
const navbarNav = document.querySelector(".navbar-nav") as HTMLElement;

const navButtons = Array.from(document.querySelectorAll(".nav-btn")) as HTMLButtonElement[];
const tabPanels = Array.from(document.querySelectorAll(".tab-panel")) as HTMLElement[];

const inventoryTable = document.getElementById("inventoryTable") as HTMLTableElement;
const salesTable = document.getElementById("salesTable") as HTMLTableElement;
const debtTable = document.getElementById("debtTable") as HTMLTableElement;
const cashbookTable = document.getElementById("cashbookTable") as HTMLTableElement;

const inventoryTableBody = document.getElementById("inventoryTableBody") as HTMLElement;
const inventoryTableFoot = document.getElementById("inventoryTableFoot") as HTMLElement;
const salesTableBody = document.getElementById("salesTableBody") as HTMLElement;
const debtTableBody = document.getElementById("debtTableBody") as HTMLElement;
const cashbookTableBody = document.getElementById("cashbookTableBody") as HTMLElement;
const actionLogTableBody = document.getElementById("actionLogTableBody") as HTMLElement;

const itemNameInput = document.getElementById("itemNameInput") as HTMLInputElement;
const itemUnitInput = document.getElementById("itemUnitInput") as HTMLSelectElement;
const itemPriceInput = document.getElementById("itemPriceInput") as HTMLInputElement;
const itemOpeningQtyInput = document.getElementById("itemOpeningQtyInput") as HTMLInputElement;
const itemImport1Input = document.getElementById("itemImport1Input") as HTMLInputElement;
const itemImport2Input = document.getElementById("itemImport2Input") as HTMLInputElement;
const itemImport3Input = document.getElementById("itemImport3Input") as HTMLInputElement;
const itemExportQtyInput = document.getElementById("itemExportQtyInput") as HTMLInputElement;

const itemOpeningAmountInput = document.getElementById("itemOpeningAmountInput") as HTMLInputElement;
const itemImportAmountInput = document.getElementById("itemImportAmountInput") as HTMLInputElement;
const itemExportAmountInput = document.getElementById("itemExportAmountInput") as HTMLInputElement;

const addInventoryItemBtn = document.getElementById("addInventoryItemBtn") as HTMLButtonElement;
const cancelEditBtn = document.getElementById("cancelEditBtn") as HTMLButtonElement;
const inventoryFormTitle = document.getElementById("inventoryFormTitle") as HTMLElement;
const showAddInventoryBtn = document.getElementById("showAddInventoryBtn") as HTMLButtonElement;
const inventoryFormContainer = document.getElementById("inventoryFormContainer") as HTMLElement;

const summaryRevenue = document.getElementById("summaryRevenue") as HTMLElement;
const summaryCost = document.getElementById("summaryCost") as HTMLElement;
const summaryProfit = document.getElementById("summaryProfit") as HTMLElement;
const summaryDebt = document.getElementById("summaryDebt") as HTMLElement;

const noticeModal = document.getElementById("noticeModal") as HTMLElement;
const noticeCard = document.getElementById("noticeCard") as HTMLElement;
const noticeTitle = document.getElementById("noticeTitle") as HTMLElement;
const noticeMessage = document.getElementById("noticeMessage") as HTMLElement;
const noticeOkBtn = document.getElementById("noticeOkBtn") as HTMLButtonElement;
const noticeIcon = document.getElementById("noticeIcon") as HTMLElement;

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("vi-VN").format(value);
}

function getNowString(): string {
  return new Date().toLocaleString("vi-VN");
}

function formatPriceDisplay(raw: string): string {
  // Strip everything except digits
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  // Format with dots as thousand separator + đ suffix
  const num = parseInt(digits, 10);
  return new Intl.NumberFormat("vi-VN").format(num) + "đ";
}

function parsePriceInput(value: string): number {
  // Remove dots, spaces and đ character then parse
  const num = parseInt(value.replace(/[.\sđ]/g, ""), 10) || 0;
  // Shortcut: if user types small values (like 150), treat as 150,000
  if (num > 0 && num <= 999) return num * 1000;
  return num;
}

function animateValue(
  element: HTMLElement,
  start: number,
  end: number,
  duration = 800,
  currency = true
): void {
  const startTime = performance.now();

  function step(currentTime: number) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (end - start) * eased);
    element.textContent = currency ? formatCurrency(current) : formatNumber(current);

    if (progress < 1) {
      requestAnimationFrame(step);
    }
  }

  requestAnimationFrame(step);
}

function initRevealAnimations(): void {
  const elements = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        }
      });
    },
    { threshold: 0.06 }
  );

  elements.forEach((el) => observer.observe(el));
}

function initButtonRipple(): void {
  const buttons = document.querySelectorAll<HTMLElement>(".btn, .nav-btn");

  buttons.forEach((button) => {
    button.addEventListener("click", (event) => {
      const mouseEvent = event as MouseEvent;
      const target = event.currentTarget as HTMLButtonElement;
      const ripple = document.createElement("span");
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = mouseEvent.clientX - rect.left - size / 2;
      const y = mouseEvent.clientY - rect.top - size / 2;

      ripple.style.position = "absolute";
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.borderRadius = "50%";
      ripple.style.background = "rgba(255,255,255,0.28)";
      ripple.style.transform = "scale(0)";
      ripple.style.pointerEvents = "none";
      ripple.style.animation = "rippleEffect 0.6s ease-out";

      target.appendChild(ripple);

      setTimeout(() => ripple.remove(), 650);
    });
  });

  const style = document.createElement("style");
  style.textContent = `
    @keyframes rippleEffect {
      to {
        transform: scale(2.6);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

function showNotice(
  title: string,
  message: string,
  status: "success" | "error" = "success"
): void {
  noticeTitle.textContent = title;
  noticeMessage.textContent = message;

  if (status === "success") {
    noticeIcon.innerHTML = `
      <svg class="animated-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path class="animated-path" d="M5 13l4 4L19 7"/>
      </svg>
    `;
    noticeIcon.classList.remove("error");
  } else {
    noticeIcon.innerHTML = `
      <svg class="animated-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <path class="animated-path" d="M12 8v4m0 4h.01"/>
        <circle class="animated-path" cx="12" cy="12" r="10" />
      </svg>
    `;
    noticeIcon.classList.add("error");
  }

  // Force re-trigger animation in case modal is already rendered
  const svgElements = noticeIcon.querySelectorAll('.animated-path');
  svgElements.forEach(el => {
    (el as HTMLElement).style.animation = 'none';
    void (el as HTMLElement).offsetHeight; // trigger reflow
    (el as HTMLElement).style.animation = '';
  });

  noticeModal.classList.remove("hidden");
}

function hideNotice(): void {
  noticeModal.classList.add("closing");
  setTimeout(() => {
    noticeModal.classList.add("hidden");
    noticeModal.classList.remove("closing");
  }, 240); // Thời gian chờ bằng thời lượng animation
}

function showConfirm(title: string, message: string): Promise<boolean> {
  return new Promise((resolve) => {
    const confirmModal = document.getElementById("confirmModal") as HTMLElement;
    const confirmTitle = document.getElementById("confirmTitle") as HTMLElement;
    const confirmMessage = document.getElementById("confirmMessage") as HTMLElement;
    const confirmOkBtn = document.getElementById("confirmOkBtn") as HTMLButtonElement;
    const confirmCancelBtn = document.getElementById("confirmCancelBtn") as HTMLButtonElement;

    confirmTitle.textContent = title;
    confirmMessage.textContent = message;
    
    const confirmIconSvg = document.getElementById("confirmIconSvg");
    if (confirmIconSvg) {
      const svgElements = confirmIconSvg.querySelectorAll('.animated-path');
      svgElements.forEach(el => {
        (el as HTMLElement).style.animation = 'none';
        void (el as HTMLElement).offsetHeight;
        (el as HTMLElement).style.animation = '';
      });
    }

    confirmModal.classList.remove("hidden");

    const cleanup = () => {
      confirmModal.classList.add("closing");
      setTimeout(() => {
        confirmModal.classList.add("hidden");
        confirmModal.classList.remove("closing");
      }, 240);
      confirmOkBtn.removeEventListener("click", onOk);
      confirmCancelBtn.removeEventListener("click", onCancel);
    };

    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };

    confirmOkBtn.addEventListener("click", onOk);
    confirmCancelBtn.addEventListener("click", onCancel);
  });
}

function showLogoutConfirm(): Promise<boolean> {
  return new Promise((resolve) => {
    const lgModal = document.getElementById("logoutModal") as HTMLElement;
    const okBtn = document.getElementById("logoutOkBtn") as HTMLButtonElement;
    const cancelBtn = document.getElementById("logoutCancelBtn") as HTMLButtonElement;

    lgModal.classList.remove("hidden");

    const svgElements = lgModal.querySelectorAll('.animated-path');
    svgElements.forEach(el => {
      (el as HTMLElement).style.animation = 'none';
      void (el as HTMLElement).offsetHeight;
      (el as HTMLElement).style.animation = '';
    });

    const cleanup = () => {
      lgModal.classList.add("closing");
      setTimeout(() => {
        lgModal.classList.add("hidden");
        lgModal.classList.remove("closing");
      }, 240);
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
    };

    const onOk = () => { cleanup(); resolve(true); };
    const onCancel = () => { cleanup(); resolve(false); };

    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
  });
}

function addActionLog(type: string, content: string, status: "success" | "error", undoData?: UndoData): void {
  actionLogs.unshift({
    id: Date.now().toString() + Math.random().toString(36).substring(7),
    time: getNowString(),
    type,
    content,
    status,
    undoData,
    undone: false,
  });

  if (actionLogs.length > 12) {
    actionLogs = actionLogs.slice(0, 12);
  }

  renderActionLogs();
}

function renderActionLogs(): void {
  if (!actionLogTableBody) return;

  if (actionLogs.length === 0) {
    actionLogTableBody.innerHTML = `
      <tr>
        <td colspan="3" class="empty-row">Chưa có thông báo nào.</td>
      </tr>
    `;
    return;
  }

  actionLogTableBody.innerHTML = actionLogs
    .map((log) => {
      let typeLabel = log.type;
      let undoHtml = "";

      if (currentAccount?.role === "owner" && log.undoData) {
        if (!log.undone) {
          undoHtml = ` <button class="btn btn-warning btn-xs" data-action="undo" data-logid="${log.id}">Hoàn tác</button>`;
        } else {
          const isDelete = log.undoData?.action === "add";
          const doneLabel = isDelete ? "Xoá" : "Hoàn tác";
          const doneColor = isDelete ? "#dc2626" : "#059669";
          undoHtml = ` <span style="display:inline-block;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;color:white;background:${doneColor};">${doneLabel}</span>`;
        }
      }

      return `
        <tr>
          <td data-label="Thời gian" class="cell-center">${log.time}</td>
          <td data-label="Loại thao tác" class="cell-center">${typeLabel}${undoHtml}</td>
          <td data-label="Nội dung">${log.content}</td>
        </tr>
      `;
    })
    .join("");
}

async function handleActionLogClick(event: Event): Promise<void> {
  const target = event.target as HTMLElement;
  if (target.getAttribute("data-action") === "undo") {
    const logId = target.getAttribute("data-logid");
    await undoAction(logId);
  }
}

async function undoAction(logId: string | null): Promise<void> {
  lastLocalMutateAt = Date.now();
  if (!logId) return;
  const log = actionLogs.find((l) => l.id === logId);
  if (!log || log.undone || !log.undoData) return;

  const undoData = log.undoData;
  let detail = "";

  if (undoData.action === "add") {
    const item = inventory.find((i) => i.id === undoData.itemId);
    detail = item ? `Đã xoá "${item.name}" khỏi bảng.` : "Đã xoá hàng hoá khỏi bảng.";
    inventory = inventory.filter((i) => i.id !== undoData.itemId);

  } else if (undoData.action === "edit") {
    const idx = inventory.findIndex((i) => i.id === undoData.currentItemId);
    if (idx !== -1) {
      const current = inventory[idx];
      const prev = undoData.previousItem;
      const changes: string[] = [];

      if (current.name !== prev.name) changes.push(`Tên: "${current.name}" → "${prev.name}"`);
      if (current.unit !== prev.unit) changes.push(`ĐVT: "${current.unit}" → "${prev.unit}"`);
      if (current.price !== prev.price) changes.push(`Đơn giá: ${formatCurrency(current.price)} → ${formatCurrency(prev.price)}`);
      if (current.openingQty !== prev.openingQty) changes.push(`Tồn đầu: ${current.openingQty} → ${prev.openingQty}`);
      if (current.import1 !== prev.import1) changes.push(`Nhập L1: ${current.import1} → ${prev.import1}`);
      if (current.import2 !== prev.import2) changes.push(`Nhập L2: ${current.import2} → ${prev.import2}`);
      if (current.import3 !== prev.import3) changes.push(`Nhập L3: ${current.import3} → ${prev.import3}`);
      if (current.exportQty !== prev.exportQty) changes.push(`Xuất: ${current.exportQty} → ${prev.exportQty}`);

      detail = `Hoàn tác "${prev.name}": ` + (changes.length > 0 ? changes.join(", ") : "không có thay đổi");
      inventory[idx] = { ...prev };
    }

  } else if (undoData.action === "delete") {
    detail = `Đã đưa "${undoData.previousItem.name}" trở lại bảng.`;
    inventory.push({ ...undoData.previousItem });
  }

  log.undone = true;
  await saveInventory(inventory);
  renderInventory();
  addActionLog("Hoàn tác", detail, "success");
  showNotice("Hoàn tác thành công", `Thao tác "${log.type}" đã được khôi phục.`, "success");
}

function computeInventoryRow(item: InventoryItem) {
  const openingAmount = item.openingQty * item.price;
  const totalImportQty = item.import1 + item.import2 + item.import3;
  const importAmount = totalImportQty * item.price;
  const exportAmount = item.exportQty * item.price;
  const closingQty = item.openingQty + totalImportQty - item.exportQty;
  const closingAmount = closingQty * item.price;

  return {
    openingAmount,
    totalImportQty,
    importAmount,
    exportAmount,
    closingQty,
    closingAmount,
  };
}

function updateInventoryFormCalculations(): void {
  const price = parsePriceInput(itemPriceInput.value);
  const openingQty = Number(itemOpeningQtyInput.value) || 0;
  const import1 = Number(itemImport1Input.value) || 0;
  const import2 = Number(itemImport2Input.value) || 0;
  const import3 = Number(itemImport3Input.value) || 0;
  const exportQty = Number(itemExportQtyInput.value) || 0;

  itemOpeningAmountInput.value = formatCurrency(openingQty * price);
  itemImportAmountInput.value = formatCurrency((import1 + import2 + import3) * price);
  itemExportAmountInput.value = formatCurrency(exportQty * price);
}

function handlePriceInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  const selectionStart = input.selectionStart || 0;
  const rawValue = input.value;
  
  // Count digits before cursor in the current raw input (before our formatting)
  const digitsBefore = rawValue.substring(0, selectionStart).replace(/\D/g, "").length;
  const allDigits = rawValue.replace(/\D/g, "");

  if (!allDigits) {
    input.value = "";
    updateInventoryFormCalculations();
    return;
  }

  const numValue = parseInt(allDigits, 10);
  const formatted = new Intl.NumberFormat("vi-VN").format(numValue) + "đ";
  input.value = formatted;

  // Find new cursor position by matching the digit count
  let newPos = 0;
  let currentDigits = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      currentDigits++;
    }
    newPos = i + 1;
    if (currentDigits >= digitsBefore) break;
  }
  
  // Fallback: stay at the end of numbers if we reached the end
  if (digitsBefore >= allDigits.length) {
    newPos = formatted.length - 1;
  }
  
  input.setSelectionRange(newPos, newPos);
  updateInventoryFormCalculations();
}

function handlePriceBlur(event: Event): void {
  const input = event.target as HTMLInputElement;
  const rawDigits = input.value.replace(/\D/g, "");
  if (!rawDigits) return;

  let numValue = parseInt(rawDigits, 10);
  
  // If user typed a small value (e.g. 150), automatically add 3 zeros
  if (numValue > 0 && numValue <= 999) {
    numValue = numValue * 1000;
    input.value = new Intl.NumberFormat("vi-VN").format(numValue) + "đ";
    updateInventoryFormCalculations();
    
    // Smooth transition effect for the auto-fill
    input.style.transition = "background-color 0.4s";
    input.style.backgroundColor = "rgba(16, 185, 129, 0.1)";
    setTimeout(() => {
      input.style.backgroundColor = "";
    }, 500);
  }
}

function openInventoryForm(): void {
  inventoryFormContainer.classList.remove("collapsed");
  setTimeout(() => {
    inventoryFormContainer.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, 100);
}

function closeInventoryForm(): void {
  inventoryFormContainer.classList.add("collapsed");
}

function resetInventoryForm(): void {
  editingInventoryId = null;
  itemNameInput.value = "";
  setUnitDropdown("Thùng");
  itemPriceInput.value = "";
  itemOpeningQtyInput.value = "";
  itemImport1Input.value = "";
  itemImport2Input.value = "";
  itemImport3Input.value = "";
  itemExportQtyInput.value = "";
  
  inventoryFormTitle.textContent = "Thêm hàng hoá mới";
  addInventoryItemBtn.textContent = "Lưu hàng hoá";
  updateInventoryFormCalculations();
}

async function startEditInventory(id: number): Promise<void> {
  if (!currentAccount || currentAccount.role !== "owner") {
    addActionLog("Sửa hàng hoá", "Bạn không có quyền sửa hàng hoá.", "error");
    showNotice("Không có quyền", "Bạn không có quyền sửa hàng hoá.", "error");
    return;
  }

  const item = inventory.find((row) => row.id === id);
  if (!item) {
    addActionLog("Sửa hàng hoá", "Không tìm thấy hàng hoá cần sửa.", "error");
    showNotice("Không tìm thấy", "Không tìm thấy hàng hoá cần sửa.", "error");
    return;
  }

  editingInventoryId = id;
  itemNameInput.value = item.name;
  setUnitDropdown(item.unit);
  itemPriceInput.value = formatPriceDisplay(String(item.price));
  itemOpeningQtyInput.value = String(item.openingQty || 0);
  itemImport1Input.value = String(item.import1 || 0);
  itemImport2Input.value = String(item.import2 || 0);
  itemImport3Input.value = String(item.import3 || 0);
  itemExportQtyInput.value = String(item.exportQty || 0);
  
  inventoryFormTitle.textContent = `Đang chỉnh sửa: ${item.name}`;
  addInventoryItemBtn.textContent = "Cập nhật hàng hoá";
  updateInventoryFormCalculations();
  openInventoryForm();

  addActionLog("Sửa hàng hoá", `Đang chỉnh sửa "${item.name}".`, "success");
  showNotice("Chế độ chỉnh sửa", `Bạn đang chỉnh sửa "${item.name}".`, "success");
}

async function deleteInventory(id: number): Promise<void> {
  lastLocalMutateAt = Date.now();
  if (!currentAccount || currentAccount.role !== "owner") {
    addActionLog("Xoá hàng hoá", "Bạn không có quyền xoá hàng hoá.", "error");
    showNotice("Không có quyền", "Bạn không có quyền xoá hàng hoá.", "error");
    return;
  }

  const item = inventory.find((row) => row.id === id);
  if (!item) {
    addActionLog("Xoá hàng hoá", "Không tìm thấy hàng hoá cần xoá.", "error");
    showNotice("Không tìm thấy", "Không tìm thấy hàng hoá cần xoá.", "error");
    return;
  }

  const confirmed = await showConfirm(
    "Xác nhận xoá",
    `Bạn có chắc chắn muốn xoá mặt hàng "${item.name}" không? Thao tác này có thể hoàn tác sau trong bảng thông báo.`
  );

  if (!confirmed) return;

  inventory = inventory.filter((row) => row.id !== id);
  await saveInventory(inventory);
  renderInventory();

  if (editingInventoryId === id) {
    resetInventoryForm();
    closeInventoryForm();
  }

  addActionLog("Xoá hàng hoá", `Đã xoá "${item.name}" khỏi danh sách.`, "success", { action: "delete", previousItem: { ...item } });
  showNotice("Xoá thành công", `Đã xoá "${item.name}" khỏi danh sách.`, "success");
}

function renderInventory(): void {
  const PAGE_SIZE = getPageSize();
  const totalPages = Math.ceil(inventory.length / PAGE_SIZE) || 1;
  if (tabPages.inventory > totalPages) tabPages.inventory = totalPages;

  const start = (tabPages.inventory - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pagedData = inventory.slice(start, end);

  inventoryTableBody.innerHTML = pagedData
    .map((item, index) => {
      const realIndex = start + index;
      const row = computeInventoryRow(item);

      return `
        <tr>
          <td data-label="STT" class="cell-center">${realIndex + 1}</td>
          <td data-label="Tên hàng hoá">${item.name}</td>
          <td data-label="ĐVT" class="cell-center">${item.unit}</td>
          <td data-label="Đơn giá" class="cell-right">${formatNumber(item.price)}</td>
          <td data-label="Tồn đầu SL" class="cell-center">${item.openingQty ? formatNumber(item.openingQty) : ""}</td>
          <td data-label="Tồn đầu Tiền" class="cell-right">${item.openingQty ? formatCurrency(row.openingAmount) : ""}</td>
          <td data-label="Nhập Lần 1" class="cell-center">${item.import1 ? formatNumber(item.import1) : ""}</td>
          <td data-label="Nhập Lần 2" class="cell-center">${item.import2 ? formatNumber(item.import2) : ""}</td>
          <td data-label="Nhập Lần 3" class="cell-center">${item.import3 ? formatNumber(item.import3) : ""}</td>
          <td data-label="Nhập Tiền" class="cell-right">${formatCurrency(row.importAmount)}</td>
          <td data-label="Xuất SL" class="cell-center">${formatNumber(item.exportQty)}</td>
          <td data-label="Xuất Tiền" class="cell-right">${formatCurrency(row.exportAmount)}</td>
          <td data-label="Tồn cuối SL" class="cell-center">${formatNumber(row.closingQty)}</td>
          <td data-label="Tồn cuối Tiền" class="cell-right">${formatCurrency(row.closingAmount)}</td>
          <td data-label="Thao tác">
            <div class="row-actions">
              <button class="btn btn-warning btn-xs" data-action="edit-inventory" data-id="${item.id}">
                Sửa
              </button>
              <button class="btn btn-danger btn-xs" data-action="delete-inventory" data-id="${item.id}">
                Xoá
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");

  renderPaginationControls("inventory", inventory.length, "inventoryPagination");

  const totals = inventory.reduce(
    (acc, item) => {
      const row = computeInventoryRow(item);
      acc.import1 += item.import1;
      acc.import2 += item.import2;
      acc.import3 += item.import3;
      acc.importAmount += row.importAmount;
      acc.exportQty += item.exportQty;
      acc.exportAmount += row.exportAmount;
      acc.closingQty += row.closingQty;
      acc.closingAmount += row.closingAmount;
      return acc;
    },
    {
      import1: 0,
      import2: 0,
      import3: 0,
      importAmount: 0,
      exportQty: 0,
      exportAmount: 0,
      closingQty: 0,
      closingAmount: 0,
    }
  );

  inventoryTableFoot.innerHTML = `
    <tr>
      <td colspan="4" class="cell-center">TỔNG CỘNG</td>
      <td></td>
      <td></td>
      <td class="cell-center">${formatNumber(totals.import1)}</td>
      <td class="cell-center">${formatNumber(totals.import2)}</td>
      <td class="cell-center">${formatNumber(totals.import3)}</td>
      <td class="cell-right">${formatCurrency(totals.importAmount)}</td>
      <td class="cell-center">${formatNumber(totals.exportQty)}</td>
      <td class="cell-right">${formatCurrency(totals.exportAmount)}</td>
      <td class="cell-center">${formatNumber(totals.closingQty)}</td>
      <td class="cell-right">${formatCurrency(totals.closingAmount)}</td>
      <td></td>
    </tr>
  `;
}

function renderSales(): void {
  const PAGE_SIZE = getPageSize();
  const totalPages = Math.ceil(sales.length / PAGE_SIZE) || 1;
  if (tabPages.sales > totalPages) tabPages.sales = totalPages;

  const start = (tabPages.sales - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pagedData = sales.slice(start, end);

  salesTableBody.innerHTML = pagedData
    .map((row, index) => {
      const realIndex = start + index;
      const quantity = row.g8 + row.abestTall + row.abestShort;
      const revenue = quantity * row.salePrice;

      const baseCost =
        row.g8 * 157000 +
        row.abestTall * 163000 +
        row.abestShort * 153000;

      const profit = revenue - baseCost;

      return `
        <tr>
          <td data-label="STT" class="cell-center">${realIndex + 1}</td>
          <td data-label="CTV bán">${row.seller}</td>
          <td data-label="Ngày bán" class="cell-center">${row.date}</td>
          <td data-label="Khách hàng">${row.customer}</td>
          <td data-label="Địa chỉ">${row.address}</td>
          <td data-label="G8 chill" class="cell-center">${row.g8 ? formatNumber(row.g8) : ""}</td>
          <td data-label="Abest cao" class="cell-center">${row.abestTall ? formatNumber(row.abestTall) : ""}</td>
          <td data-label="Abest lùn" class="cell-center">${row.abestShort ? formatNumber(row.abestShort) : ""}</td>
          <td data-label="Giá bán" class="cell-right">${formatNumber(row.salePrice)}</td>
          <td data-label="Thành tiền" class="cell-right ${index === 10 ? "cell-accent" : ""}">${formatCurrency(revenue)}</td>
          <td data-label="Giá vốn" class="cell-right ${index === 10 ? "cell-accent" : ""}">${formatCurrency(baseCost)}</td>
          <td data-label="Lợi nhuận" class="cell-right cell-profit ${index === 10 ? "cell-accent" : ""}">${formatCurrency(profit)}</td>
        </tr>
      `;
    })
    .join("");

  renderPaginationControls("sales", sales.length, "salesPagination");
}

function renderDebts(): void {
  const PAGE_SIZE = getPageSize();
  const totalPages = Math.ceil(debts.length / PAGE_SIZE) || 1;
  if (tabPages.debt > totalPages) tabPages.debt = totalPages;

  const start = (tabPages.debt - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pagedData = debts.slice(start, end);

  debtTableBody.innerHTML = pagedData
    .map((row, index) => {
      const realIndex = start + index;
      const remaining = row.revenue - row.collected;
      const highlighted = row.stt === 19 || row.stt === 20;

      return `
        <tr>
          <td data-label="STT" class="cell-center">${realIndex + 1}</td>
          <td data-label="Ngày bán" class="cell-center ${highlighted ? "cell-accent" : ""}">${row.date}</td>
          <td data-label="Khách hàng" class="${highlighted ? "cell-accent" : ""}">${row.customer}</td>
          <td data-label="Địa chỉ" class="${highlighted ? "cell-accent" : ""}">${row.address}</td>
          <td data-label="Doanh số" class="cell-right ${highlighted ? "cell-accent" : ""}">${formatCurrency(row.revenue)}</td>
          <td data-label="Thu nợ" class="cell-right">${row.collected ? formatCurrency(row.collected) : ""}</td>
          <td data-label="Còn lại" class="cell-right">${formatCurrency(remaining)}</td>
        </tr>
      `;
    })
    .join("");

  renderPaginationControls("debt", debts.length, "debtPagination");
}

function renderCashbook(): void {
  const PAGE_SIZE = getPageSize();
  const totalPages = Math.ceil(cashbook.length / PAGE_SIZE) || 1;
  if (tabPages.cashbook > totalPages) tabPages.cashbook = totalPages;

  const start = (tabPages.cashbook - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pagedData = cashbook.slice(start, end);

  cashbookTableBody.innerHTML = pagedData
    .map((row, index) => {
      const realIndex = start + index;
      return `
        <tr>
          <td data-label="STT" class="cell-center">${realIndex + 1}</td>
          <td data-label="Ký hiệu" class="cell-center">${row.symbol}</td>
          <td data-label="Ngày" class="cell-center">${row.date}</td>
          <td data-label="Nội dung">${row.description}</td>
          <td data-label="THU" class="cell-right cell-danger">${row.income ? formatCurrency(row.income) : ""}</td>
          <td data-label="Chi mua hàng" class="cell-right">${row.expensePurchase ? formatCurrency(row.expensePurchase) : ""}</td>
          <td data-label="Chi hoạt động" class="cell-right">${row.expenseOperation ? formatCurrency(row.expenseOperation) : ""}</td>
          <td data-label="Chi khác" class="cell-right">${row.expenseOther ? formatCurrency(row.expenseOther) : ""}</td>
          <td data-label="Ghi chú">${row.note}</td>
        </tr>
      `;
    })
    .join("");

  renderPaginationControls("cashbook", cashbook.length, "cashbookPagination");
}

function renderSummary(): void {
  const totalRevenue = sales.reduce((sum, row) => {
    const qty = row.g8 + row.abestTall + row.abestShort;
    return sum + qty * row.salePrice;
  }, 0);

  const totalCost = sales.reduce((sum, row) => {
    return (
      sum +
      row.g8 * 157000 +
      row.abestTall * 163000 +
      row.abestShort * 153000
    );
  }, 0);

  const totalProfit = totalRevenue - totalCost;
  const totalDebt = debts.reduce((sum, row) => sum + (row.revenue - row.collected), 0);

  animateValue(summaryRevenue, 0, totalRevenue);
  animateValue(summaryCost, 0, totalCost);
  animateValue(summaryProfit, 0, totalProfit);
  animateValue(summaryDebt, 0, totalDebt);
}

function renderAll(): void {
  renderSummary();
  renderInventory();
  renderSales();
  renderDebts();
  renderCashbook();
  renderActionLogs();
}

function renderPaginationControls(tab: TabName, totalItems: number, containerId: string): void {
  const container = document.getElementById(containerId);
  if (!container) return;

  const PAGE_SIZE = getPageSize();
  const totalPages = Math.ceil(totalItems / PAGE_SIZE) || 1;
  const currentPage = tabPages[tab];

  if (totalItems <= PAGE_SIZE) {
    container.innerHTML = "";
    return;
  }

  // Build page number buttons (show up to 5 pages)
  const delta = 2;
  const range: number[] = [];
  for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
    range.push(i);
  }
  const pageButtons = range.map(p => `
    <button class="page-num-btn ${p === currentPage ? 'active' : ''}" onclick="changePage('${tab}', ${p})">${p}</button>
  `).join('');

  container.innerHTML = `
    <div class="pagination-controls">
      <button class="page-btn page-prev" ${currentPage === 1 ? 'disabled' : ''} onclick="changePage('${tab}', ${currentPage - 1})">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        Trước
      </button>
      <div class="page-numbers">
        ${currentPage > delta + 1 ? `<button class="page-num-btn" onclick="changePage('${tab}', 1)">1</button>${currentPage > delta + 2 ? '<span class="page-ellipsis">…</span>' : ''}` : ''}
        ${pageButtons}
        ${currentPage < totalPages - delta ? `${currentPage < totalPages - delta - 1 ? '<span class="page-ellipsis">…</span>' : ''}<button class="page-num-btn" onclick="changePage('${tab}', ${totalPages})">${totalPages}</button>` : ''}
      </div>
      <button class="page-btn page-next" ${currentPage === totalPages ? 'disabled' : ''} onclick="changePage('${tab}', ${currentPage + 1})">
        Sau
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>
  `;
}

(window as any).changePage = (tab: TabName, page: number) => {
  tabPages[tab] = page;
  switch (tab) {
    case "inventory": renderInventory(); break;
    case "sales": renderSales(); break;
    case "debt": renderDebts(); break;
    case "cashbook": renderCashbook(); break;
  }
  triggerTableAnimation(tab);
};

function triggerTableAnimation(tab: TabName): void {
  const containerId = `${tab}TableBody`;
  const el = document.getElementById(containerId);
  if (!el) return;

  el.classList.remove("table-animate");
  void el.offsetWidth; // Force reflow
  el.classList.add("table-animate");
}

function setLoggedOutUI(): void {
  currentAccount = null;
  loginScreen.classList.remove("hidden");
  dashboard.classList.add("hidden");
  resetInventoryForm();
}

function applyRolePermissions(account: Account): void {
  const inventoryButton = document.querySelector('[data-tab="inventory"]') as HTMLButtonElement;
  const inventoryPanel = document.getElementById("tab-inventory") as HTMLElement;

  if (account.role === "ctv") {
    inventoryButton.classList.add("hidden");
    inventoryPanel.classList.add("hidden");
    switchTab("sales");
  } else {
    inventoryButton.classList.remove("hidden");
    inventoryPanel.classList.remove("hidden");
    switchTab("inventory");
  }
}

function setLoggedInUI(account: Account): void {
  currentAccount = account;
  loginScreen.classList.add("hidden");
  dashboard.classList.remove("hidden");

  currentUserName.textContent = account.name;
  currentUserRole.textContent = account.role === "owner" ? "Chủ" : "CTV";
  userRoleText.textContent = account.role === "owner" ? "Vai trò: Chủ" : "Vai trò: CTV";

  applyRolePermissions(account);
  renderAll();
  addActionLog(
    "Đăng nhập",
    `${account.name} đã đăng nhập với vai trò ${account.role === "owner" ? "Chủ" : "CTV"}.`,
    "success"
  );
  showNotice(
    "Đăng nhập thành công",
    `Xin chào ${account.name}. Bạn đã đăng nhập với vai trò ${account.role === "owner" ? "Chủ" : "CTV"}.`,
    "success"
  );
}

function switchTab(tabName: TabName): void {
  if (currentTab === tabName && !document.getElementById(`tab-${tabName}`)?.classList.contains("hidden")) return;
  currentTab = tabName;

  navButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle("active", isActive);
  });

  tabPanels.forEach((panel) => {
    panel.classList.add("hidden");
  });

  const titles: Record<TabName, string> = {
    inventory: "Báo cáo xuất nhập tồn kho",
    sales: "Báo cáo chi tiết bán hàng hằng ngày",
    debt: "Báo cáo công nợ khách hàng",
    cashbook: "Nhật ký thu chi",
  };

  pageTitle.textContent = titles[tabName];
  tabPages[tabName] = 1; // Reset to page 1 when switching tabs

  const targetPanel = document.getElementById(`tab-${tabName}`) as HTMLElement | null;
  if (targetPanel) {
    targetPanel.classList.remove("hidden");
  }

  // Reload page animation effect
  const mainElements = document.querySelectorAll(".main-content .reveal");
  mainElements.forEach((el, index) => {
    const htmlEl = el as HTMLElement;
    htmlEl.classList.remove("show");
    
    // Stagger effect
    htmlEl.style.transitionDelay = `${index * 0.06}s`;
    
    // Force reflow
    void htmlEl.offsetWidth; 
    
    htmlEl.classList.add("show");
    
    // Clean up
    setTimeout(() => {
      htmlEl.style.transitionDelay = "0s";
    }, 800);
  });
}

async function saveInventoryItem(): Promise<void> {
  lastLocalMutateAt = Date.now();
  if (!currentAccount || currentAccount.role !== "owner") {
    addActionLog("Lưu hàng hoá", "Bạn không có quyền thêm hoặc sửa hàng hoá.", "error");
    showNotice("Không có quyền", "Bạn không có quyền thêm hoặc sửa hàng hoá.", "error");
    return;
  }

  const name = itemNameInput.value.trim();
  const unit = itemUnitInput.value.trim() || "Thùng";
  const price = parsePriceInput(itemPriceInput.value);
  const openingQty = Number(itemOpeningQtyInput.value) || 0;
  const import1 = Number(itemImport1Input.value) || 0;
  const import2 = Number(itemImport2Input.value) || 0;
  const import3 = Number(itemImport3Input.value) || 0;
  const exportQty = Number(itemExportQtyInput.value) || 0;

  if (!name) {
    addActionLog("Lưu hàng hoá", "Thiếu tên hàng hoá.", "error");
    showNotice("Thiếu dữ liệu", "Vui lòng nhập tên hàng hoá.", "error");
    return;
  }

  if (price <= 0) {
    addActionLog("Lưu hàng hoá", "Đơn giá không hợp lệ.", "error");
    showNotice("Đơn giá không hợp lệ", "Vui lòng nhập đơn giá lớn hơn 0.", "error");
    return;
  }

  const duplicated = inventory.some(
    (item) =>
      item.name.trim().toLowerCase() === name.trim().toLowerCase() &&
      item.id !== editingInventoryId
  );

  if (duplicated) {
    addActionLog("Lưu hàng hoá", `Hàng hoá "${name}" đã tồn tại trong danh sách.`, "error");
    showNotice("Bị trùng dữ liệu", `Hàng hoá "${name}" đã tồn tại trong danh sách.`, "error");
    return;
  }

  if (editingInventoryId !== null) {
    const item = inventory.find((row) => row.id === editingInventoryId);

    if (!item) {
      addActionLog("Sửa hàng hoá", "Không tìm thấy hàng hoá cần cập nhật.", "error");
      showNotice("Không tìm thấy", "Không tìm thấy hàng hoá cần cập nhật.", "error");
      return;
    }

    const previousItem = { ...item };

    item.name = name;
    item.unit = unit;
    item.price = price;
    item.openingQty = openingQty;
    item.import1 = import1;
    item.import2 = import2;
    item.import3 = import3;
    item.exportQty = exportQty;

    const changes: string[] = [];

    if (item.name !== previousItem.name) changes.push(`Tên: "${previousItem.name}" → "${item.name}"`);
    if (item.unit !== previousItem.unit) changes.push(`ĐVT: "${previousItem.unit}" → "${item.unit}"`);
    if (item.price !== previousItem.price) changes.push(`Đơn giá: ${formatCurrency(previousItem.price)} → ${formatCurrency(item.price)}`);
    if (item.openingQty !== previousItem.openingQty) changes.push(`Tồn đầu: ${previousItem.openingQty} → ${item.openingQty}`);
    if (item.import1 !== previousItem.import1) changes.push(`Nhập L1: ${previousItem.import1} → ${item.import1}`);
    if (item.import2 !== previousItem.import2) changes.push(`Nhập L2: ${previousItem.import2} → ${item.import2}`);
    if (item.import3 !== previousItem.import3) changes.push(`Nhập L3: ${previousItem.import3} → ${item.import3}`);
    if (item.exportQty !== previousItem.exportQty) changes.push(`Xuất: ${previousItem.exportQty} → ${item.exportQty}`);

    const detailMsg = changes.length > 0 ? `Cập nhật "${item.name}": ` + changes.join(", ") : `Đã cập nhật "${item.name}" (không có dữ liệu thay đổi).`;

    await saveInventory(inventory);
    renderInventory();
    addActionLog("Sửa hàng hoá", detailMsg, "success", { action: "edit", previousItem, currentItemId: item.id });
    showNotice("Cập nhật thành công", `Đã cập nhật "${item.name}" thành công.`, "success");
    resetInventoryForm();
    closeInventoryForm();
    return;
  }

  const newItem: InventoryItem = {
    id: Date.now(),
    name,
    unit,
    price,
    openingQty,
    import1,
    import2,
    import3,
    exportQty,
  };

  inventory.push(newItem);
  await saveInventory(inventory);
  tabPages.inventory = Math.ceil(inventory.length / getPageSize()); // Jump to last page
  renderInventory();
  triggerTableAnimation("inventory");
  addActionLog("Thêm hàng hoá", `Đã thêm "${name}" vào danh sách.`, "success", { action: "add", itemId: newItem.id });
  showNotice("Thêm thành công", `Đã thêm "${name}" vào danh sách.`, "success");
  resetInventoryForm();
  closeInventoryForm();
}

async function handleInventoryTableClick(event: Event): Promise<void> {
  const target = event.target as HTMLElement;
  const action = target.getAttribute("data-action");
  const idRaw = target.getAttribute("data-id");

  if (!action || !idRaw) return;

  const id = Number(idRaw);

  if (action === "edit-inventory") {
    startEditInventory(id);
    return;
  }

  if (action === "delete-inventory") {
    await deleteInventory(id);
  }
}

function exportCurrentTabToExcel(): void {
  if (Capacitor.isNativePlatform() || window.innerWidth <= 768) {
    addActionLog("Xuất Excel", "Tính năng xuất Excel chưa hỗ trợ tải xuống trên điện thoại.", "error");
    showNotice(
      "Giới hạn nền tảng",
      "Hệ thống tạo file Excel chỉ hoạt động cực mạnh vào mượt mà trên môi trường Web PC/Laptop. Vui lòng đăng nhập trên máy tính để tải file báo cáo.",
      "error"
    );
    return;
  }

  const mapping: Record<TabName, { table: HTMLTableElement; filename: string; sheetName: string }> = {
    inventory: {
      table: inventoryTable,
      filename: "bao_cao_xuat_nhap_ton.xlsx",
      sheetName: "XuatNhapTon",
    },
    sales: {
      table: salesTable,
      filename: "bao_cao_ban_hang_hang_ngay.xlsx",
      sheetName: "BanHangHangNgay",
    },
    debt: {
      table: debtTable,
      filename: "bao_cao_cong_no_khach_hang.xlsx",
      sheetName: "CongNoKhachHang",
    },
    cashbook: {
      table: cashbookTable,
      filename: "nhat_ky_thu_chi.xlsx",
      sheetName: "NhatKyThuChi",
    },
  };

  const current = mapping[currentTab];
  if (!current) {
    addActionLog("Xuất Excel", "Không xác định được bảng cần xuất.", "error");
    showNotice("Lỗi xuất file", "Không xác định được bảng cần xuất.", "error");
    return;
  }

  const workbook = XLSX.utils.table_to_book(current.table, {
    sheet: current.sheetName,
  });

  XLSX.writeFile(workbook, current.filename);

  addActionLog("Xuất Excel", `Đã xuất file ${current.filename}.`, "success");
  showNotice("Xuất Excel thành công", `Đã xuất file ${current.filename}.`, "success");
}

loginBtn.addEventListener("click", () => {
  const email = loginEmail.value.trim();
  const password = loginPassword.value.trim();

  if (!email || !password) {
    showNotice("Thiếu thông tin", "Vui lòng nhập đầy đủ email và mật khẩu.", "error");
    return;
  }

  const account = login(email, password);
  
  if (!account) {
    addActionLog("Đăng nhập", "Sai email hoặc mật khẩu.", "error");
    showNotice("Đăng nhập thất bại", "Email hoặc mật khẩu không chính xác. Vui lòng thử lại.", "error");
    return;
  }

  // Handle "Remember Me"
  if (rememberMe.checked) {
    localStorage.setItem("rememberedAccount", JSON.stringify(account));
  }

  setLoggedInUI(account);
  addActionLog("Đăng nhập", `${account.name} đã đăng nhập thành công.`, "success");
  showNotice("Thành công", `Chào mừng ${account.name} quay trở lại!`, "success");
});

logoutBtn.addEventListener("click", async () => {
  const confirmed = await showLogoutConfirm();
  if (!confirmed) return;

  if (currentAccount) {
    addActionLog("Đăng xuất", `${currentAccount.name} đã đăng xuất.`, "success");
    showNotice("Đăng xuất thành công", `${currentAccount.name} đã đăng xuất.`, "success");
  }
  
  // Clear sessions
  localStorage.removeItem("rememberedAccount");
  sessionStorage.removeItem("sessionAccount");

  setLoggedOutUI();
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const tab = button.dataset.tab as TabName | undefined;
    if (!tab) return;
    switchTab(tab);
    if (window.innerWidth <= 768 && navbarNav) {
      navbarNav.classList.remove("mobile-active");
      if (mobileMenuBtn) mobileMenuBtn.classList.remove("menu-open");
    }
  });
});

if (mobileMenuBtn && navbarNav) {
  mobileMenuBtn.addEventListener("click", () => {
    navbarNav.classList.toggle("mobile-active");
    mobileMenuBtn.classList.toggle("menu-open");
  });
  
  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (window.innerWidth <= 768 && navbarNav.classList.contains("mobile-active")) {
      const target = e.target as HTMLElement;
      if (!navbarNav.contains(target) && !mobileMenuBtn.contains(target)) {
        navbarNav.classList.remove("mobile-active");
        mobileMenuBtn.classList.remove("menu-open");
      }
    }
  });
}

showAddInventoryBtn.addEventListener("click", () => {
  resetInventoryForm();
  openInventoryForm();
});
addInventoryItemBtn.addEventListener("click", async () => {
  await saveInventoryItem();
});
cancelEditBtn.addEventListener("click", () => {
  if (editingInventoryId !== null) {
    const item = inventory.find((i) => i.id === editingInventoryId);
    if (item) {
      addActionLog("Huỷ thao tác", `Đã huỷ chỉnh sửa hàng hoá "${item.name}".`, "success");
    }
  } else {
    // Nếu đang rỗng (thêm hàng hoá mới)
    const nameInput = itemNameInput.value.trim();
    if (nameInput) {
      addActionLog("Huỷ thao tác", `Đã huỷ thêm mới hàng hoá "${nameInput}".`, "success");
    }
  }
  resetInventoryForm();
  closeInventoryForm();
});
inventoryTableBody.addEventListener("click", async (e) => {
  await handleInventoryTableClick(e);
});
exportExcelBtn.addEventListener("click", exportCurrentTabToExcel);
actionLogTableBody.addEventListener("click", handleActionLogClick);

itemPriceInput.addEventListener("input", handlePriceInput);
itemPriceInput.addEventListener("blur", handlePriceBlur);
itemOpeningQtyInput.addEventListener("input", updateInventoryFormCalculations);
itemImport1Input.addEventListener("input", updateInventoryFormCalculations);
itemImport2Input.addEventListener("input", updateInventoryFormCalculations);
itemImport3Input.addEventListener("input", updateInventoryFormCalculations);
itemExportQtyInput.addEventListener("input", updateInventoryFormCalculations);

noticeOkBtn.addEventListener("click", hideNotice);
noticeModal.addEventListener("click", (event) => {
  if (event.target === noticeModal) {
    hideNotice();
  }
});
noticeCard.addEventListener("click", (event) => {
  event.stopPropagation();
});

// ── Custom Dropdown for ĐVT ──────────────────────────────
function initUnitDropdown(): void {
  const wrap = document.getElementById("unitSelectWrap");
  const trigger = document.getElementById("unitSelectTrigger");
  const optionsBox = document.getElementById("unitSelectOptions");
  const label = document.getElementById("unitSelectLabel");
  if (!wrap || !trigger || !optionsBox || !label) return;

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    wrap.classList.toggle("open");
  });

  optionsBox.querySelectorAll(".custom-select-option:not(.disabled)").forEach((opt) => {
    opt.addEventListener("click", (e) => {
      e.stopPropagation();
      const val = (opt as HTMLElement).dataset.value ?? "";
      const text = (opt.querySelector("span") as HTMLElement).textContent ?? val;

      // Update hidden input
      itemUnitInput.value = val;
      // Update label
      label.textContent = text;
      // Update selected state
      optionsBox.querySelectorAll(".custom-select-option").forEach((o) =>
        o.classList.remove("selected")
      );
      opt.classList.add("selected");
      // Close
      wrap.classList.remove("open");
    });
  });

  // Close when clicking outside
  document.addEventListener("click", () => {
    wrap.classList.remove("open");
  });
}

function setUnitDropdown(value: string): void {
  const label = document.getElementById("unitSelectLabel");
  const optionsBox = document.getElementById("unitSelectOptions");
  if (!label || !optionsBox) return;

  itemUnitInput.value = value;
  optionsBox.querySelectorAll(".custom-select-option").forEach((opt) => {
    const el = opt as HTMLElement;
    if (el.dataset.value === value) {
      opt.classList.add("selected");
      label.textContent = (opt.querySelector("span") as HTMLElement).textContent ?? value;
    } else {
      opt.classList.remove("selected");
    }
  });
}

async function initData() {
  initRealtimeListeners();
  initRevealAnimations();
  initButtonRipple();
  initUnitDropdown();
  
  // Show a loading notice (optional)
  // showNotice("Đang tải", "Vui lòng chờ dữ liệu từ hệ thống đám mây...", "success");

  try {
    inventory = await loadInventory();
    sales = await loadSales();
    debts = await loadDebts();
    cashbook = await loadCashbook();

    renderActionLogs();

    // Check for existing session
    const remembered = localStorage.getItem("rememberedAccount");
    
    if (remembered) {
      const acc = JSON.parse(remembered);
      setLoggedInUI(acc);
    } else {
      setLoggedOutUI();
    }
  } catch (err) {
    console.error("Failed to load data:", err);
    showNotice("Lỗi kết nối", "Không thể tải dữ liệu từ Cloud. Vui lòng kiểm tra mạng.", "error");
  }
}

window.addEventListener("load", initData);