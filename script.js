/* ==================================================
   ОСНОВНЫЕ ДАННЫЕ
================================================== */

const ADMIN_PASSWORD = "admin123";

let orders = JSON.parse(
    localStorage.getItem("constructionOrders") || "[]"
);

let customServices = JSON.parse(
    localStorage.getItem("customServices") || "[]"
);

let customMaterials = JSON.parse(
    localStorage.getItem("customMaterials") || "[]"
);


/* ==================================================
   УВЕДОМЛЕНИЯ
================================================== */

function showToast(message) {

    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}


/* ==================================================
   АДМИНКА
================================================== */

function openAdmin() {

    document.getElementById("adminModal")
        .classList.add("active");

    document.body.style.overflow = "hidden";

    const loggedIn =
        sessionStorage.getItem("adminLoggedIn") === "true";

    if (loggedIn) {
        showDashboard();
    } else {
        showLogin();
    }
}


function closeAdmin() {

    document.getElementById("adminModal")
        .classList.remove("active");

    document.body.style.overflow = "";
}


function showLogin() {

    document.getElementById("loginScreen")
        .style.display = "block";

    document.getElementById("adminDashboard")
        .style.display = "none";
}


function showDashboard() {

    document.getElementById("loginScreen")
        .style.display = "none";

    document.getElementById("adminDashboard")
        .style.display = "block";

    updateStatistics();
    renderOrders();
}


function loginAdmin(event) {

    event.preventDefault();

    const password =
        document.getElementById("adminPassword").value;

    if (password === ADMIN_PASSWORD) {

        sessionStorage.setItem(
            "adminLoggedIn",
            "true"
        );

        document.getElementById("loginError")
            .style.display = "none";

        document.getElementById("adminPassword")
            .value = "";

        showDashboard();

        showToast("Добро пожаловать в админ-панель!");

    } else {

        document.getElementById("loginError")
            .style.display = "block";
    }
}


function logoutAdmin() {

    sessionStorage.removeItem("adminLoggedIn");

    showLogin();

    showToast("Вы вышли из админ-панели");
}


/* ==================================================
   ФОРМА ЗАКАЗА
================================================== */

document
    .getElementById("orderForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const newOrder = {

            id: Date.now(),

            name:
                document.getElementById("clientName").value.trim(),

            phone:
                document.getElementById("clientPhone").value.trim(),

            service:
                document.getElementById("clientService").value,

            address:
                document.getElementById("clientAddress").value.trim(),

            description:
                document.getElementById("clientDescription").value.trim(),

            date:
                new Date().toLocaleString("ru-RU"),

            status: "Новая"
        };

        orders.unshift(newOrder);

        localStorage.setItem(
            "constructionOrders",
            JSON.stringify(orders)
        );

        this.reset();

        showToast(
            "✅ Заявка отправлена! Мы свяжемся с вами."
        );

    });


/* ==================================================
   СТАТИСТИКА
================================================== */

function updateStatistics() {

    document.getElementById("totalOrders")
        .textContent = orders.length;

    document.getElementById("newOrders")
        .textContent =
        orders.filter(o => o.status === "Новая").length;

    document.getElementById("workOrders")
        .textContent =
        orders.filter(o => o.status === "В работе").length;

    document.getElementById("doneOrders")
        .textContent =
        orders.filter(o => o.status === "Завершена").length;
}


/* ==================================================
   ЗАЯВКИ
================================================== */

function renderOrders() {

    const tbody =
        document.getElementById("ordersTable");

    const search =
        document.getElementById("searchOrders")
        ?.value
        .toLowerCase() || "";

    const filter =
        document.getElementById("filterStatus")
        ?.value || "all";

    let filtered = orders.filter(order => {

        const searchText = (

            order.name + " " +
            order.phone + " " +
            order.service + " " +
            order.address

        ).toLowerCase();

        const matchesSearch =
            searchText.includes(search);

        const matchesFilter =
            filter === "all" ||
            order.status === filter;

        return matchesSearch && matchesFilter;

    });


    if (filtered.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="8">
                    <div class="empty">
                        📭 Заявок пока нет
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML = filtered.map(order => {

        let statusClass = "status-new";

        if (order.status === "В работе") {
            statusClass = "status-work";
        }

        if (order.status === "Завершена") {
            statusClass = "status-done";
        }

        if (order.status === "Отменена") {
            statusClass = "status-cancel";
        }

        return `

            <tr>

                <td>
                    #${String(order.id).slice(-5)}
                </td>

                <td>
                    <strong>${escapeHtml(order.name)}</strong>

                    ${
                        order.description
                        ? `<br>
                           <small>
                               ${escapeHtml(order.description)}
                           </small>`
                        : ""
                    }

                </td>

                <td>
                    <a href="tel:${escapeHtml(order.phone)}">
                        ${escapeHtml(order.phone)}
                    </a>
                </td>

                <td>
                    ${escapeHtml(order.service)}
                </td>

                <td>
                    ${escapeHtml(order.address || "—")}
                </td>

                <td>
                    ${escapeHtml(order.date)}
                </td>

                <td>

                    <span class="status ${statusClass}">
                        ${order.status}
                    </span>

                </td>

                <td>

                    <button
                        class="small-btn blue"
                        onclick="changeStatus(${order.id})"
                    >
                        🔄 Статус
                    </button>

                    <button
                        class="small-btn red"
                        onclick="deleteOrder(${order.id})"
                    >
                        🗑️
                    </button>

                </td>

            </tr>

        `;

    }).join("");
}


/* ==================================================
   ИЗМЕНЕНИЕ СТАТУСА
================================================== */

function changeStatus(id) {

    const order =
        orders.find(o => o.id === id);

    if (!order) return;

    const statuses = [
        "Новая",
        "В работе",
        "Завершена",
        "Отменена"
    ];

    const current =
        statuses.indexOf(order.status);

    const next =
        statuses[(current + 1) % statuses.length];

    order.status = next;

    localStorage.setItem(
        "constructionOrders",
        JSON.stringify(orders)
    );

    renderOrders();
    updateStatistics();

    showToast(
        `Статус заявки изменён: ${next}`
    );
}


/* ==================================================
   УДАЛЕНИЕ ЗАЯВКИ
================================================== */

function deleteOrder(id) {

    if (!confirm("Удалить эту заявку?")) {
        return;
    }

    orders =
        orders.filter(order => order.id !== id);

    localStorage.setItem(
        "constructionOrders",
        JSON.stringify(orders)
    );

    renderOrders();
    updateStatistics();

    showToast("Заявка удалена");
}


/* ==================================================
   ОЧИСТКА ВСЕХ ЗАЯВОК
================================================== */

function clearOrders() {

    if (orders.length === 0) {
        showToast("Заявок уже нет");
        return;
    }

    if (!confirm(
        "Вы действительно хотите удалить ВСЕ заявки?"
    )) {
        return;
    }

    orders = [];

    localStorage.setItem(
        "constructionOrders",
        JSON.stringify(orders)
    );

    renderOrders();
    updateStatistics();

    showToast("Все заявки удалены");
}


/* ==================================================
   ДОБАВЛЕНИЕ УСЛУГИ
================================================== */

document
    .getElementById("serviceForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const service = {

            id: Date.now(),

            icon:
                document.getElementById("newServiceIcon").value,

            name:
                document.getElementById("newServiceName").value,

            price:
                document.getElementById("newServicePrice").value,

            description:
                document.getElementById(
                    "newServiceDescription"
                ).value

        };

        customServices.push(service);

        localStorage.setItem(
            "customServices",
            JSON.stringify(customServices)
        );

        this.reset();

        renderCustomServices();

        showToast("Услуга добавлена");

    });


/* ==================================================
   ДОБАВЛЕНИЕ МАТЕРИАЛА
================================================== */

document
    .getElementById("materialForm")
    .addEventListener("submit", function(event) {

        event.preventDefault();

        const material = {

            id: Date.now(),

            icon:
                document.getElementById("newMaterialIcon").value,

            name:
                document.getElementById("newMaterialName").value,

            description:
                document.getElementById(
                    "newMaterialDescription"
                ).value,

            price:
                document.getElementById(
                    "newMaterialPrice"
                ).value

        };

        customMaterials.push(material);

        localStorage.setItem(
            "customMaterials",
            JSON.stringify(customMaterials)
        );

        this.reset();

        renderCustomMaterials();

        showToast("Материал добавлен");

    });


/* ==================================================
   РЕНДЕР ДОПОЛНИТЕЛЬНЫХ УСЛУГ
================================================== */

function renderCustomServices() {

    const grid =
        document.getElementById("servicesGrid");

    customServices.forEach(service => {

        const exists =
            document.querySelector(
                `[data-service-id="${service.id}"]`
            );

        if (exists) return;

        const card =
            document.createElement("div");

        card.className = "card";

        card.dataset.serviceId = service.id;

        card.innerHTML = `

            <div class="icon">
                ${escapeHtml(service.icon)}
            </div>

            <h3>
                ${escapeHtml(service.name)}
            </h3>

            <p>
                ${escapeHtml(service.description)}
            </p>

            <div class="price">
                ${escapeHtml(service.price)}
            </div>

        `;

        grid.appendChild(card);

    });
}


/* ==================================================
   РЕНДЕР ДОПОЛНИТЕЛЬНЫХ МАТЕРИАЛОВ
================================================== */

function renderCustomMaterials() {

    const grid =
        document.getElementById("materialsGrid");

    customMaterials.forEach(material => {

        const exists =
            document.querySelector(
                `[data-material-id="${material.id}"]`
            );

        if (exists) return;

        const card =
            document.createElement("div");

        card.className = "material";

        card.dataset.materialId =
            material.id;

        card.innerHTML = `

            <div class="material-img">
                ${escapeHtml(material.icon)}
            </div>

            <h3>
                ${escapeHtml(material.name)}
            </h3>

            <p>
                ${escapeHtml(material.description)}
            </p>

            <div class="material-price">
                ${escapeHtml(material.price)}
            </div>

            <a
                href="#order"
                class="button"
            >
                Заказать
            </a>

        `;

        grid.appendChild(card);

    });
}


/* ==================================================
   ЭКРАНИРОВАНИЕ HTML
================================================== */

function escapeHtml(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* ==================================================
   СБРОС ДОПОЛНИТЕЛЬНЫХ ДАННЫХ
================================================== */

function resetSiteData() {

    if (!confirm(
        "Удалить добавленные через админку услуги и материалы?"
    )) {
        return;
    }

    localStorage.removeItem("customServices");
    localStorage.removeItem("customMaterials");

    customServices = [];
    customMaterials = [];

    location.reload();
}


/* ==================================================
   ЗАПУСК
================================================== */

renderCustomServices();
renderCustomMaterials();


/* Закрытие админки по ESC */

document.addEventListener("keydown", function(event) {

    if (event.key === "Escape") {
        closeAdmin();
    }

});


/* Клик по фону закрывает админку */

document
    .getElementById("adminModal")
    .addEventListener("click", function(event) {

        if (event.target === this) {
            closeAdmin();
        }

    });