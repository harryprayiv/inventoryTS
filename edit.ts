type SubCategoryData = {
  [item: string]: ItemData;
};

type MainCategoryData = {
  [subCategory: string]: SubCategoryData;
};

type CountData = {
  [mainCategory: string]: MainCategoryData;
};

interface ItemData {
  count: number;
  addedBy: string;
  notes: Array<[string, number]>; // Array of tuples with string and number
}

function createEditableTable(data: any): HTMLTableElement {
  const table = document.createElement('table');
  const thead = document.createElement('thead');
  const tbody = document.createElement('tbody');

  const headerRow = document.createElement('tr');
  ['Item', 'Count'].forEach((headerText) => {
    const th = document.createElement('th');
    th.textContent = headerText;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  for (const item in data) {
    const tr = document.createElement('tr');
    const tdName = document.createElement('td');
    tdName.textContent = item;
    tr.appendChild(tdName);

    const tdCount = document.createElement('td');
    const countInput = document.createElement('input');
    countInput.type = 'number';
    countInput.value = data[item].count;
    countInput.min = '0';
    countInput.addEventListener('input', (e) => {
      data[item].count = parseInt((e.target as HTMLInputElement).value);
    });
    tdCount.appendChild(countInput);
    tr.appendChild(tdCount);

    tbody.appendChild(tr);
  }

  table.appendChild(tbody);

  return table;
}

// const downloadButton = document.getElementById('download-btn') as HTMLButtonElement;
// downloadButton.addEventListener('click', () => {
//   downloadModifiedInventory(menuData);
// });

function downloadModifiedInventory(inventoryData: CountData): void {
  const a = document.createElement('a');
  const file = new Blob([JSON.stringify(inventoryData, null, 2)], { type: 'application/json' });
  a.href = URL.createObjectURL(file);
  a.download = 'modified_inventory.json';
  a.click();
}

// function populateItems(items: any) {
//   itemsContainer.innerHTML = '';
//   const table = createEditableTable(items);
//   itemsContainer.appendChild(table);
// }