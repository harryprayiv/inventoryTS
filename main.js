var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const mainCategoryElement = document.getElementById('mainCategory');
const subCategoryElement = document.getElementById('subCategory');
const itemElement = document.getElementById('item');
const countListElement = document.getElementById('countList');
const importInventoryButton = document.getElementById('importInventory');
importInventoryButton.addEventListener('change', handleInventoryFileInputChange);
function handleInventoryFileInputChange(event) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const fileInput = event.target;
        const file = (_a = fileInput.files) === null || _a === void 0 ? void 0 : _a.item(0);
        if (file && file.type === "application/json") {
            const reader = new FileReader();
            reader.onload = (e) => __awaiter(this, void 0, void 0, function* () {
                var _b;
                try {
                    const inventoryData = JSON.parse((_b = e.target) === null || _b === void 0 ? void 0 : _b.result);
                    // Now you have the inventory data, call your existing function
                    // to populate the inventory items using this data
                    populateMainCategories(inventoryData);
                }
                catch (error) {
                    showErrorOverlay();
                    messageElement.textContent = 'Error loading JSON file: Invalid JSON format.';
                    setTimeout(() => {
                        messageElement.textContent = '';
                    }, 3000);
                }
            });
            reader.readAsText(file);
        }
        else {
            messageElement.textContent = 'Please select a JSON file.';
            setTimeout(() => {
                messageElement.textContent = '';
            }, 3000);
        }
    });
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
fetch('./inventory.json')
    .then((response) => __awaiter(this, void 0, void 0, function* () {
    const buffer = yield response.arrayBuffer();
    const hash = yield digestMessage(buffer);
    const jsonData = new TextDecoder().decode(buffer);
    return { menuData: JSON.parse(jsonData), hash };
}))
    .then(({ menuData, hash }) => {
    populateMainCategories(menuData);
    localStorage.setItem('sourceHash', hash);
})
    .catch(error => {
    console.error('Error fetching menu data:', error);
    showErrorOverlay();
});
function populateMainCategories(menuData) {
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
function populateSubCategories(subCategories) {
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
function populateItems(items) {
    itemElement.innerHTML = '';
    items.forEach((itemName) => {
        const optionItem = document.createElement('option');
        optionItem.textContent = itemName;
        itemElement.appendChild(optionItem);
    });
    itemElement.style.display = 'inline';
}
const incrementButton = document.getElementById('increment');
const decrementButton = document.getElementById('decrement');
const countInput = document.getElementById('countInput');
const messageElement = document.getElementById('statusMessage');
incrementButton.addEventListener('click', () => {
    changeCount(1);
});
decrementButton.addEventListener('click', () => {
    changeCount(-1);
});
function changeCount(sign) {
    const count = parseInt(countInput.value, 10) * sign;
    const mainCategory = mainCategoryElement.value;
    const subCategory = subCategoryElement.value;
    const item = itemElement.value;
    const countData = getCountData();
    if (!countData[mainCategory])
        countData[mainCategory] = {};
    if (!countData[mainCategory][subCategory])
        countData[mainCategory][subCategory] = {};
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
const listNameInput = document.getElementById('listName');
const renameListButton = document.getElementById('renameList');
const clearListButton = document.getElementById('clearList');
const listNameElement = document.getElementById('listName');
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
function digestMessage(buffer) {
    return __awaiter(this, void 0, void 0, function* () {
        const hashBuffer = yield crypto.subtle.digest('SHA-256', buffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
}
function updateListNameDisplay(listName) {
    listNameElement.textContent = listName;
    document.title = listName;
}
const savedListName = localStorage.getItem('listName');
if (savedListName) {
    listNameInput.value = savedListName;
    updateListNameDisplay(savedListName);
}
function displayCountList(countData) {
    const countListElement = document.getElementById('countList');
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
function getCountData() {
    const countDataString = localStorage.getItem('countData');
    if (countDataString) {
        return JSON.parse(countDataString);
    }
    else {
        return {};
    }
}
function setCountData(countData) {
    const countDataString = JSON.stringify(countData);
    localStorage.setItem('countData', countDataString);
}
const exportListButton = document.getElementById('exportList');
exportListButton.addEventListener('click', () => {
    exportListAsJSON();
});
function exportListAsJSON() {
    const countData = getCountData();
    const sourceHash = localStorage.getItem('sourceHash');
    const exportData = Object.assign(Object.assign({}, countData), { sourceHash: sourceHash || '' });
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
function getVisitorId() {
    let visitorId = localStorage.getItem('visitorId');
    if (!visitorId) {
        visitorId = generateUniqueId();
        localStorage.setItem('visitorId', visitorId);
    }
    return visitorId;
}
function generateUniqueId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
const visitorId = getVisitorId();
function handleFileInputChange(event) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const fileInput = event.target;
        const file = (_a = fileInput.files) === null || _a === void 0 ? void 0 : _a.item(0);
        if (file && file.type === "application/json") {
            const buffer = yield file.arrayBuffer();
            const fileHash = yield digestMessage(buffer);
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
            reader.onload = (e) => __awaiter(this, void 0, void 0, function* () {
                var _b;
                try {
                    const importedData = JSON.parse((_b = e.target) === null || _b === void 0 ? void 0 : _b.result);
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
                }
                catch (error) {
                    showErrorOverlay();
                    messageElement.textContent = 'Error loading JSON file: Invalid JSON format.';
                    setTimeout(() => {
                        messageElement.textContent = '';
                    }, 3000);
                }
            });
            reader.readAsText(file);
        }
        else {
            messageElement.textContent = 'Please select a JSON file.';
            setTimeout(() => {
                messageElement.textContent = '';
            }, 3000);
        }
    });
}
function getImportedFileHashes() {
    const importedFileHashesString = localStorage.getItem('importedFileHashes');
    if (importedFileHashesString) {
        return JSON.parse(importedFileHashesString);
    }
    else {
        return [];
    }
}
function updateImportedFileHashes(newHash) {
    const importedFileHashes = getImportedFileHashes();
    importedFileHashes.push(newHash);
    localStorage.setItem('importedFileHashes', JSON.stringify(importedFileHashes));
}
const importListButton = document.getElementById('importList');
importListButton.addEventListener('change', handleFileInputChange);
function mergeCountData(currentData, importedData) {
    const result = JSON.parse(JSON.stringify(currentData));
    for (const mainCategory in importedData) {
        if (!result[mainCategory]) {
            result[mainCategory] = importedData[mainCategory];
        }
        else {
            for (const subCategory in importedData[mainCategory]) {
                if (!result[mainCategory][subCategory]) {
                    result[mainCategory][subCategory] = importedData[mainCategory][subCategory];
                }
                else {
                    for (const item in importedData[mainCategory][subCategory]) {
                        if (!result[mainCategory][subCategory][item]) {
                            result[mainCategory][subCategory][item] = importedData[mainCategory][subCategory][item];
                        }
                        else {
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
function clearImportedFileHashes() {
    const sourceHash = localStorage.getItem('sourceHash');
    if (sourceHash) {
        localStorage.setItem('importedFileHashes', JSON.stringify([sourceHash]));
    }
    else {
        localStorage.removeItem('importedFileHashes');
    }
}
