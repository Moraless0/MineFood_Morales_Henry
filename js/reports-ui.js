// UI de reportes

function getPaidOrders() {
  return Orders.getAll().filter(order => order.status === 'paid');
}

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function refreshReports() {
  updateReportStats();
  updateTopDishes();
  updateIngredientUsage();
}

document.addEventListener('DOMContentLoaded', refreshReports);

window.addEventListener('viewChange', function(e) {
  if (e.detail.viewId === 'view-reports') {
    refreshReports();
  }
});

window.addEventListener('reportsChanged', refreshReports);

function updateReportStats() {
  const orders = getPaidOrders();
  const totalSales = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const totalOrders = orders.length;
  const itemsSold = orders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0);
  }, 0);
  const avg = totalOrders > 0 ? totalSales / totalOrders : 0;

  const salesValue = document.getElementById('report-total-sales');
  const ordersValue = document.getElementById('report-total-orders');
  const itemsValue = document.getElementById('report-items-sold');
  const avgValue = document.getElementById('report-avg-order');

  if (salesValue) salesValue.textContent = formatCurrency(totalSales);
  if (ordersValue) ordersValue.textContent = totalOrders;
  if (itemsValue) itemsValue.textContent = itemsSold;
  if (avgValue) avgValue.textContent = formatCurrency(avg);
}

function updateTopDishes() {
  const orders = getPaidOrders();
  const dishCounts = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      const dish = Dishes.getByCode(item.code);
      if (dish) {
        dishCounts[dish.name] = (dishCounts[dish.name] || 0) + Number(item.quantity || 0);
      }
    });
  });

  const sorted = Object.entries(dishCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const chartContainer = document.getElementById('report-top-dishes');
  if (!chartContainer) return;

  if (sorted.length === 0) {
    chartContainer.innerHTML = '<div class="mc-empty-state">Sin ventas pagadas aún.</div>';
    return;
  }

  const max = sorted[0][1];

  chartContainer.innerHTML = sorted.map(([name, count]) => {
    const height = (count / max) * 100;
    const shortName = name.split(' ').slice(0, 2).join(' ');
    return `
      <div class="mc-chart-bar__item">
        <div class="mc-chart-bar__bar" data-value="${count}" style="height: ${height}%;"></div>
        <div class="mc-chart-bar__label">${shortName}</div>
      </div>
    `;
  }).join('');
}

function updateIngredientUsage() {
  const orders = getPaidOrders();
  const ingredientUsage = {};

  orders.forEach(order => {
    order.items.forEach(item => {
      const dish = Dishes.getByCode(item.code);
      if (dish && dish.ingredients) {
        Object.entries(dish.ingredients).forEach(([code, amount]) => {
          const totalAmount = Number(amount || 0) * Number(item.quantity || 0);
          ingredientUsage[code] = (ingredientUsage[code] || 0) + totalAmount;
        });
      }
    });
  });

  const sorted = Object.entries(ingredientUsage)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  const tbody = document.getElementById('report-ingredient-usage');
  if (!tbody) return;

  if (sorted.length === 0) {
    tbody.innerHTML = '<tr><td colspan="3" class="mc-empty-state">Sin consumo por ventas pagadas aún.</td></tr>';
    return;
  }

  const max = sorted[0][1];

  tbody.innerHTML = sorted.map(([code, amount]) => {
    const ingredient = Inventory.getByCode(code);
    const name = ingredient ? ingredient.name : code;
    const unit = ingredient ? ingredient.unit : '';
    const percent = ((amount / max) * 100).toFixed(0);
    return `
      <tr>
        <td data-label="Insumo">${name}</td>
        <td data-label="Usado">${amount.toFixed(2)} ${unit}</td>
        <td data-label="%">${percent}%</td>
      </tr>
    `;
  }).join('');
}
