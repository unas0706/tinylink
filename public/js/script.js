const API = "/api/links";

const qs = (s) => document.querySelector(s);
const qsa = (s) => document.querySelectorAll(s);

// Show/hide loading and empty states
function showLoadingState() {
  const loadingState = qs("#loadingState");
  const emptyState = qs("#emptyState");
  const tableWrap = qs(".table-wrap");

  if (loadingState) loadingState.style.display = "flex";
  if (emptyState) emptyState.style.display = "none";
  if (tableWrap) tableWrap.style.display = "none";
}

function hideLoadingState() {
  const loadingState = qs("#loadingState");
  if (loadingState) loadingState.style.display = "none";
}

function showEmptyState() {
  const emptyState = qs("#emptyState");
  const tableWrap = qs(".table-wrap");

  if (emptyState) emptyState.style.display = "flex";
  if (tableWrap) tableWrap.style.display = "none";
}

function showTable() {
  const emptyState = qs("#emptyState");
  const tableWrap = qs(".table-wrap");

  if (emptyState) emptyState.style.display = "none";
  if (tableWrap) tableWrap.style.display = "block";
}

async function fetchLinks() {
  try {
    const res = await fetch(API);
    if (!res.ok) throw new Error("Failed to fetch links");
    return await res.json();
  } catch (e) {
    console.error(e);
    showMessage("Failed to load links", "error");
    return [];
  }
}

function formatDate(d) {
  if (!d) return "-";
  const dt = new Date(d);
  return dt.toLocaleString();
}

function renderRow(url) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
        <td data-label="Short Code">
            <a class="short-link" href="/${url.shortId}" target="_blank">
                ${location.origin}/${url.shortId}
            </a>
        </td>
        <td data-label="Target URL">
            <span class="truncate" title="${url.longUrl}">${url.longUrl}</span>
        </td>
        <td data-label="Clicks" class="text-center">${url.clicks || 0}</td>
        <td data-label="Last Clicked">${formatDate(url.lastClicked)}</td>
        <td data-label="Actions" class="text-center">
            <button class="action-btn" data-copy="${
              url.shortId
            }" title="Copy short URL">
                <i class="fas fa-copy"></i>
                Copy
            </button>
            <button class="action-btn" data-delete="${
              url.shortId
            }" title="Delete link">
                <i class="fas fa-trash"></i>
                Delete
            </button>
            <a class="action-btn" href="/code/${
              url.shortId
            }" title="View statistics">
                <i class="fas fa-chart-bar"></i>
                View
            </a>
        </td>
    `;
  return tr;
}

async function refreshTable() {
  showLoadingState();

  const tbody = qs("#linksTable tbody");
  if (!tbody) {
    console.error("Table body not found");
    return;
  }

  tbody.innerHTML = "";
  const list = await fetchLinks();

  hideLoadingState();

  if (list.length === 0) {
    showEmptyState();
    return;
  }

  showTable();
  list.forEach((u) => tbody.appendChild(renderRow(u)));
}

async function createLink(longUrl, customCode) {
  const body = { longUrl };
  if (customCode) body.customCode = customCode;

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res;
}

function showMessage(msg, type = "") {
  const el = qs("#formMessage");
  if (!el) {
    console.log("Form message element not found");
    return;
  }

  el.textContent = msg;
  el.className = "form-message";
  if (type) el.classList.add(type);

  // Auto-hide success messages after 5 seconds
  if (type === "success") {
    setTimeout(() => {
      el.textContent = "";
      el.className = "form-message";
    }, 5000);
  }
}

// Add refresh button functionality
function setupRefreshButton() {
  const refreshBtn = qs("#refreshBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      refreshBtn.disabled = true;

      await refreshTable();

      setTimeout(() => {
        refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        refreshBtn.disabled = false;
      }, 1000);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = qs("#createForm");
  const longUrl = qs("#longUrl");
  const customCode = qs("#customCode");
  const submitBtn = qs("#submitBtn");
  const clearBtn = qs("#clearBtn");

  if (!form) {
    console.error("Form not found");
    return;
  }

  // Initialize the table
  refreshTable();

  // Setup refresh button
  setupRefreshButton();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    showMessage("", "");

    const url = longUrl.value.trim();
    const code = customCode.value.trim();

    if (!url) {
      showMessage("Please enter a URL", "error");
      longUrl.focus();
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      showMessage("Please enter a valid URL", "error");
      longUrl.focus();
      return;
    }

    if (code && !/^[A-Za-z0-9]{6,8}$/.test(code)) {
      showMessage("Custom code must be 6-8 alphanumeric characters", "error");
      customCode.focus();
      return;
    }

    // Update button state
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
    submitBtn.disabled = true;

    try {
      const res = await createLink(url, code);
      const data = await res.json();

      if (!res.ok) {
        showMessage(data.error || "Failed to create link", "error");
      } else {
        showMessage(`Short URL created successfully!`, "success");
        form.reset();
        await refreshTable();

        // Scroll to show the new link in table
        setTimeout(() => {
          const tableSection = qs(".list-card");
          if (tableSection) {
            tableSection.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 500);
      }
    } catch (err) {
      console.error(err);
      showMessage("Network error - please try again", "error");
    }

    // Restore button state
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  });

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (form) form.reset();
      showMessage("", "");
      longUrl.focus();
    });
  }

  // Delegate copy/delete actions
  const linksTable = qs("#linksTable");
  if (linksTable) {
    linksTable.addEventListener("click", async (e) => {
      const copyBtn = e.target.closest("[data-copy]");
      if (copyBtn) {
        const id = copyBtn.dataset.copy;
        const originalHTML = copyBtn.innerHTML;

        try {
          await navigator.clipboard.writeText(location.origin + "/" + id);
          copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
          copyBtn.style.background = "var(--success)";
          copyBtn.style.color = "white";
          copyBtn.style.borderColor = "var(--success)";

          setTimeout(() => {
            copyBtn.innerHTML = originalHTML;
            copyBtn.style.background = "";
            copyBtn.style.color = "";
            copyBtn.style.borderColor = "";
          }, 2000);
        } catch {
          showMessage("Copy failed - please try again", "error");
        }
        return;
      }

      const delBtn = e.target.closest("[data-delete]");
      if (delBtn) {
        const id = delBtn.dataset.delete;
        if (
          !confirm(
            `Are you sure you want to delete "${id}"? This action cannot be undone.`
          )
        )
          return;

        const originalHTML = delBtn.innerHTML;
        delBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        delBtn.disabled = true;

        try {
          const res = await fetch(API + "/" + id, { method: "DELETE" });
          if (res.ok) {
            showMessage(`Link "${id}" deleted successfully`, "success");
            await refreshTable();
          } else {
            const data = await res.json();
            showMessage(data.error || "Delete failed", "error");
          }
        } catch (err) {
          console.error(err);
          showMessage("Network error - please try again", "error");
        }

        delBtn.innerHTML = originalHTML;
        delBtn.disabled = false;
      }
    });
  }

  // Add real-time validation
  if (customCode) {
    customCode.addEventListener("input", () => {
      const code = customCode.value.trim();
      if (code && !/^[A-Za-z0-9]{6,8}$/.test(code)) {
        customCode.style.borderColor = "var(--danger)";
      } else {
        customCode.style.borderColor = "";
      }
    });
  }

  if (longUrl) {
    longUrl.addEventListener("input", () => {
      const url = longUrl.value.trim();
      try {
        new URL(url);
        longUrl.style.borderColor = "var(--success)";
      } catch {
        if (url) {
          longUrl.style.borderColor = "var(--danger)";
        } else {
          longUrl.style.borderColor = "";
        }
      }
    });
  }
});
