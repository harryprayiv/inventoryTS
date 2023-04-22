const loadMenuButton = document.getElementById('loadMenu') as HTMLButtonElement;
const mainCategoryElement = document.getElementById('mainCategory') as HTMLSelectElement;
const subCategoryElement = document.getElementById('subCategory') as HTMLSelectElement;
const itemElement = document.getElementById('item') as HTMLSelectElement;

loadMenuButton.addEventListener('click', () => {
  fetch('./inventory.json')
    .then(response => response.json())
    .then(menuData => {
      populateMainCategories(menuData);
    })
    .catch(error => console.error('Error fetching menu data:', error));
});

function populateMainCategories(menuData: any) {
  mainCategoryElement.innerHTML = ''; // Clear the previous menu items
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
  subCategoryElement.innerHTML = ''; // Clear the previous menu items
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
  itemElement.innerHTML = ''; // Clear the previous menu items
  Object.keys(items).forEach(key => {
    const optionItem = document.createElement('option');
    optionItem.textContent = key;
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

  // Fetch the current count
  fetch('./count.json')
    .then(response => response.json())
    .then(countData => {
      // Update the count for the selected item
      if (!countData[mainCategory]) countData[mainCategory] = {};
      if (!countData[mainCategory][subCategory]) countData[mainCategory][subCategory] = {};
      if (!countData[mainCategory][subCategory][item]) countData[mainCategory][subCategory][item] = 0;
      countData[mainCategory][subCategory][item] += count;

      // Save the updated count to the server (use a real API for production)
      console.log('Updated count:', countData);

      // Display the updated count list
      displayCountList(countData);

      // Clear the input field and show a message
      countInput.value = '0';
      messageElement.textContent = `Recorded ${count >= 0 ? 'add' : 'subtract'} ${Math.abs(count)} of ${item}!`;
      setTimeout(() => {
        messageElement.textContent = '';
      }, 3000);
    })
    .catch(error => console.error('Error fetching count data:', error));
}


function displayCount(countData: any) {
  const countListElement = document.getElementById('countList') as HTMLUListElement;
  countListElement.innerHTML = '';

  Object.entries(countData).forEach(([mainCategory, subCategories]) => {
    Object.entries(subCategories).forEach(([subCategory, items]) => {
      Object.entries(items).forEach(([item, count]) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${mainCategory} > ${subCategory} > ${item}: ${count}`;
        countListElement.appendChild(listItem);
      });
    });
  });
}

function displayCountList(countData: any) {
  const countListElement = document.getElementById('countList') as HTMLDivElement;
  // Remove the line that clears the previous count list

  const mainCategory = mainCategoryElement.value;
  const subCategory = subCategoryElement.value;
  const item = itemElement.value;
  const count = countData[mainCategory][subCategory][item];

  // Create a new div element for the item count and append it to the countListElement
  const listItem = document.createElement('div');
  listItem.textContent = `${mainCategory} > ${subCategory} > ${item}: ${count}`;
  countListElement.appendChild(listItem);
}


