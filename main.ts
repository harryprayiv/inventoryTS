const mainCategoryElement = document.getElementById('mainCategory') as HTMLSelectElement;
const subCategoryElement = document.getElementById('subCategory') as HTMLSelectElement;
const itemElement = document.getElementById('item') as HTMLSelectElement;
const countListElement = document.getElementById('countList') as HTMLDivElement;

type ItemData = {
  count: number;
  addedBy: string;
};

type SubCategoryData = {
  [item: string]: ItemData;
};

type MainCategoryData = {
  [subCategory: string]: SubCategoryData;
};

type CountData = {
  [mainCategory: string]: MainCategoryData;
};

fetch('./inventory.json')
  .then(response => response.json())
  .then(menuData => {
    populateMainCategories(menuData);
  })
  .catch(error => console.error('Error fetching menu data:', error));

function populateMainCategories(menuData: any): void {
  mainCategoryElement.innerHTML = '';
  Object.keys(menuData).forEach(key => {
    const optionItem = document.createElement('option');
    optionItem.textContent = key;
    mainCategoryElement.appendChild(optionItem);
  });

  mainCategoryElement.style.display = 'inline';
  mainCategoryElement.addEventListener('change', () => {
    populateSubCategories(menuData[mainCategoryElement.value]);
  });

  populateSubCategories(menuData[mainCategoryElement.value]);
}

function populateSubCategories(subCategories: any) {
  subCategoryElement.innerHTML = '';
  Object.keys(subCategories).forEach(key => {
    const optionItem = document.createElement('option');
    optionItem.textContent = key;
    subCategoryElement.appendChild(optionItem);
  });

  subCategoryElement.style.display = 'inline';
  subCategoryElement.addEventListener('change', () => {
    populateItems(subCategories[subCategoryElement.value]);
  });

  populateItems(subCategories[subCategoryElement.value]);
}

function populateItems(items: any) {
  itemElement.innerHTML = '';
  items.forEach((itemName: string) => {
    const optionItem = document.createElement('option');
    optionItem.textContent = itemName;
    itemElement.appendChild(optionItem);
  });

  itemElement.style.display = 'inline';
}

const incrementButton = document.getElementById('increment') as HTMLButtonElement;
const decrementButton = document.getElementById('decrement') as HTMLButtonElement;
const countInput = document.getElementById('countInput') as HTMLInputElement;
const messageElement = document.getElementById('message') as HTMLParagraphElement;

incrementButton.addEventListener('click', () => {
  changeCount(1);
});

decrementButton.addEventListener('click', () => {
  changeCount(-1);
});

function changeCount(sign: number) {
  const count = parseInt(countInput.value, 10) * sign;
  const mainCategory = mainCategoryElement.value;
  const subCategory = subCategoryElement.value;
  const item = itemElement.value;

  const countData = getCountData();

  if (!countData[mainCategory]) countData[mainCategory] = {};
  if (!countData[mainCategory][subCategory]) countData[mainCategory][subCategory] = {};
  if (!countData[mainCategory][subCategory][item]) {
    countData[mainCategory][subCategory][item] = {
      count: 0,
      addedBy: visitorId
    };
  }

  if (sign < 0 && countData[mainCategory][subCategory][item].count + count < 0) {
    messageElement.textContent = `Cannot subtract ${Math.abs(count)} from ${item} as it doesn't have enough quantity!`;
    setTimeout(() => {
      messageElement.textContent = '';
    }, 3000);
    return;
  }

  countData[mainCategory][subCategory][item].count += count;

  setCountData(countData);

  console.log('Updated count:', countData);
  displayCountList(countData);

  countInput.value = '1';
  messageElement.textContent = `Recorded ${count >= 0 ? 'add' : 'subtract'} ${Math.abs(count)} of ${item}!`;
  setTimeout(() => {
    messageElement.textContent = '';
  }, 3000);
}

const listNameInput = document.getElementById('listName') as HTMLInputElement;
const renameListButton = document.getElementById('renameList') as HTMLButtonElement;
const clearListButton = document.getElementById('clearList') as HTMLButtonElement;
const listNameElement = document.getElementById('listName') as HTMLElement;


renameListButton.addEventListener('click', () => {
  const currentListName = listNameInput.value;
  const newListName = prompt('Enter the new name for the list:', currentListName);
  if (newListName !== null && newListName.trim() !== '') {
    listNameInput.value = newListName.trim();
    updateListNameDisplay(newListName.trim());
  }
});



renameListButton.addEventListener('click', () => {
  const listName = listNameInput.value.trim();
  if (listName) {
    localStorage.setItem('listName', listName);
    updateListNameDisplay(listName);
  } else {
    messageElement.textContent = 'Please enter a valid name for the list.';
    setTimeout(() => {
      messageElement.textContent = '';
    }, 3000);
  }
});

clearListButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the list?')) {
    localStorage.removeItem('countData');
    countListElement.innerHTML = '';
  }
});

function updateListNameDisplay(listName: string) {
  listNameElement.textContent = listName;
  document.title = listName;
}

const savedListName = localStorage.getItem('listName');
if (savedListName) {
  listNameInput.value = savedListName;
  updateListNameDisplay(savedListName);
}

function displayCountList(countData: CountData) {
  countListElement.innerHTML = ''; // Clear the previous count list

  Object.entries(countData).forEach(([mainCategory, subCategories]) => {
    const mainCategoryElement = document.createElement('div');
    mainCategoryElement.classList.add('main-category');
    mainCategoryElement.textContent = mainCategory;
    countListElement.appendChild(mainCategoryElement);

    Object.entries(subCategories).forEach(([subCategory, items]) => {
      const subCategoryElement = document.createElement('div');
      subCategoryElement.classList.add('sub-category');
      subCategoryElement.textContent = subCategory;
      mainCategoryElement.appendChild(subCategoryElement);

      Object.entries(items).forEach(([item, itemData]: [string, ItemData]) => {
        if (itemData.count > 0) {
          const itemElement = document.createElement('div');
          itemElement.classList.add('item');
      
          const countElement = document.createElement('span');
          countElement.classList.add('count');
          countElement.textContent = `${itemData.count}`;
          itemElement.appendChild(countElement);
      
          const itemTextElement = document.createElement('span');
          itemTextElement.classList.add('item-text');
          itemTextElement.textContent = `\t ${item}`;
          itemElement.appendChild(itemTextElement);
      
          subCategoryElement.appendChild(itemElement);
        }
      });
    });
  });
}


displayCountList(getCountData());

function getCountData(): CountData {
  const countDataString = localStorage.getItem('countData');
  if (countDataString) {
    return JSON.parse(countDataString);
  } else {
    return {};
  }
}

function setCountData(countData: any): void {
  const countDataString = JSON.stringify(countData);
  localStorage.setItem('countData', countDataString);
}

const exportListButton = document.getElementById('exportList') as HTMLButtonElement;

exportListButton.addEventListener('click', () => {
  exportListAsJSON();
});

function exportListAsJSON() {
  const countData = getCountData();
  const dataString = JSON.stringify(countData, null, 2);
  const blob = new Blob([dataString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;

  // Get the list name from the listNameElement and append visitor UUID
  const listName = listNameElement.textContent || 'Current_Count';
  const fileName = `${listName}_${visitorId}.json`;

  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

function getVisitorId(): string {
  let visitorId = localStorage.getItem('visitorId');
  if (!visitorId) {
    visitorId = generateUniqueId();
    localStorage.setItem('visitorId', visitorId);
  }
  return visitorId;
}

function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

const visitorId = getVisitorId();

