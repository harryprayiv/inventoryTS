const mainCategoryElement = document.getElementById('mainCategory') as HTMLSelectElement;
const subCategoryElement = document.getElementById('subCategory') as HTMLSelectElement;
const itemElement = document.getElementById('item') as HTMLSelectElement;
const countListElement = document.getElementById('countList') as HTMLTableElement;
const importInventoryButton = document.getElementById('importInventory') as HTMLInputElement;
importInventoryButton.addEventListener('change', handleInventoryFileInputChange);


type ItemData = {
  count: number;
  addedBy: string;
};

async function handleInventoryFileInputChange(event: Event) {
  const fileInput = event.target as HTMLInputElement;
  const file = fileInput.files?.item(0);

  if (file && file.type === "application/json") {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const inventoryData = JSON.parse(e.target?.result as string);
        // Now you have the inventory data, call your existing function
        // to populate the inventory items using this data
        populateMainCategories(inventoryData);
      } catch (error) {
        showErrorOverlay();
        messageElement.textContent = 'Error loading JSON file: Invalid JSON format.';
        setTimeout(() => {
          messageElement.textContent = '';
        }, 3000);
      }
    };
    reader.readAsText(file);
  } else {
    messageElement.textContent = 'Please select a JSON file.';
    setTimeout(() => {
      messageElement.textContent = '';
    }, 3000);
  }
}

function showErrorOverlay() {
  const overlay = document.createElement('div');
  overlay.id = 'errorOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100%';
  overlay.style.height = '100%';
  overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.zIndex = '9999';

  const gifContainer = document.createElement('div');
  gifContainer.style.width = '400px';
  gifContainer.style.height = '400px';
  gifContainer.style.backgroundImage = 'url("https://media.tenor.com/1SastyjoZWoAAAAj/dennis-nedry.gif")';
  gifContainer.style.backgroundSize = 'contain';
  gifContainer.style.backgroundRepeat = 'no-repeat';
  gifContainer.style.backgroundPosition = 'center center';

  overlay.appendChild(gifContainer);
  document.body.appendChild(overlay);

  setTimeout(() => {
    document.body.removeChild(overlay);
  }, 2000);
}

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
  .then(async response => {
    const buffer = await response.arrayBuffer();
    const hash = await digestMessage(buffer);
    const jsonData = new TextDecoder().decode(buffer);
    return { menuData: JSON.parse(jsonData), hash };
  })
  .then(({ menuData, hash }) => {
    populateMainCategories(menuData);
    localStorage.setItem('sourceHash', hash);
  })
  .catch(error => {
    console.error('Error fetching menu data:', error);
    showErrorOverlay();
  });

  function populateMainCategories(menuData: CountData): void {
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
const messageElement = document.getElementById('statusMessage') as HTMLParagraphElement;

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
    showErrorOverlay();
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

clearListButton.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear the list?')) {
    localStorage.removeItem('countData');
    countListElement.innerHTML = '';
    clearImportedFileHashes(); // Add this line to clear imported file hashes except the source hash
  }
});

async function digestMessage(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
  const countListElement = document.getElementById('countList') as HTMLTableElement;
  countListElement.innerHTML = '';

  // Create table headers
  const header = countListElement.createTHead();
  const headerRow = header.insertRow(0);
  headerRow.insertCell(0).textContent = 'Count';
  headerRow.insertCell(1).textContent = 'Item';
  headerRow.insertCell(2).textContent = 'Sub Category';
  headerRow.insertCell(3).textContent = 'Main Category';
  
  // Insert table data
  for (const mainCategory in countData) {
    for (const subCategory in countData[mainCategory]) {
      for (const item in countData[mainCategory][subCategory]) {
        const count = countData[mainCategory][subCategory][item].count;
        const row = countListElement.insertRow(-1);
  
        row.insertCell(0).textContent = count.toString();
        row.insertCell(1).textContent = item;
        row.insertCell(2).textContent = subCategory;
        row.insertCell(3).textContent = mainCategory;
      }
    }
  }
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
  const sourceHash = localStorage.getItem('sourceHash');
  const exportData = {
    ...countData,
    sourceHash: sourceHash || '',
  };
  const dataString = JSON.stringify(exportData, null, 2);
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

async function handleFileInputChange(event: Event) {
  const fileInput = event.target as HTMLInputElement;
  const file = fileInput.files?.item(0);

  if (file && file.type === "application/json") {
    const buffer = await file.arrayBuffer();
    const fileHash = await digestMessage(buffer);
    const importedFileHashes = getImportedFileHashes();

    if (importedFileHashes.includes(fileHash)) {
      showErrorOverlay();
      messageElement.textContent = 'This file has already been imported.';
      setTimeout(() => {
        messageElement.textContent = '';
      }, 3000);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);

        const storedSourceHash = localStorage.getItem('sourceHash');
        const importedSourceHash = importedData.sourceHash;

        if (storedSourceHash !== importedSourceHash) {
          showErrorOverlay();
          messageElement.textContent = 'Warning: Source hash of the imported file does not match the current list source hash.';
          setTimeout(() => {
            messageElement.textContent = '';
          }, 5000);
        }

        delete importedData.sourceHash; // Remove sourceHash from jsonData before merging with the current count

        const currentData = getCountData();

        // Merge the imported data with the current data
        const mergedData = mergeCountData(currentData, importedData);

        setCountData(mergedData);
        displayCountList(mergedData);

        // Update the list of imported file hashes
        updateImportedFileHashes(fileHash);
      } catch (error) {
        showErrorOverlay();
        messageElement.textContent = 'Error loading JSON file: Invalid JSON format.';
        setTimeout(() => {
          messageElement.textContent = '';
        }, 3000);
      }
    };
    reader.readAsText(file);
  } else {
    messageElement.textContent = 'Please select a JSON file.';
    setTimeout(() => {
      messageElement.textContent = '';
    }, 3000);
  }
}

function getImportedFileHashes(): string[] {
  const importedFileHashesString = localStorage.getItem('importedFileHashes');
  if (importedFileHashesString) {
    return JSON.parse(importedFileHashesString);
  } else {
    return [];
  }
}

function updateImportedFileHashes(newHash: string): void {
  const importedFileHashes = getImportedFileHashes();
  importedFileHashes.push(newHash);
  localStorage.setItem('importedFileHashes', JSON.stringify(importedFileHashes));
}

const importListButton = document.getElementById('importList') as HTMLInputElement;
importListButton.addEventListener('change', handleFileInputChange);


function mergeCountData(currentData: CountData, importedData: CountData): CountData {
  const result: CountData = JSON.parse(JSON.stringify(currentData));

  for (const mainCategory in importedData) {
    if (!result[mainCategory]) {
      result[mainCategory] = importedData[mainCategory];
    } else {
      for (const subCategory in importedData[mainCategory]) {
        if (!result[mainCategory][subCategory]) {
          result[mainCategory][subCategory] = importedData[mainCategory][subCategory];
        } else {
          for (const item in importedData[mainCategory][subCategory]) {
            if (!result[mainCategory][subCategory][item]) {
              result[mainCategory][subCategory][item] = importedData[mainCategory][subCategory][item];
            } else {
              const currentCount = result[mainCategory][subCategory][item].count;
              const importedCount = importedData[mainCategory][subCategory][item].count;
              result[mainCategory][subCategory][item].count = currentCount + importedCount;
            }
          }
        }
      }
    }
  }

  return result;
}

function clearImportedFileHashes(): void {
  const sourceHash = localStorage.getItem('sourceHash');
  if (sourceHash) {
    localStorage.setItem('importedFileHashes', JSON.stringify([sourceHash]));
  } else {
    localStorage.removeItem('importedFileHashes');
  }
}