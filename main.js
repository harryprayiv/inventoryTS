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
const countInput = document.getElementById('countInput');
const messageElement = document.getElementById('statusMessage');
const renameListButton = document.getElementById('renameList');
let selectedMainCategory = null;
let selectedSubCategory = null;
let selectedItem = null;
const listNameElement = document.getElementById('listName');
const listNameInput = document.getElementById('listName');
const importInventoryButton = document.getElementById('importInventory');
importInventoryButton.addEventListener('change', handleInventoryFileInputChange);
const clearBrowserDataButton = document.getElementById('clearBrowserDataButton');
clearBrowserDataButton.addEventListener('click', clearAllBrowserData);
const incrementButton = document.getElementById('increment');
incrementButton.addEventListener('click', () => {
    changeCount(1);
});
const decrementButton = document.getElementById('decrement');
decrementButton.addEventListener('click', () => {
    changeCount(-1);
});
const clearListButton = document.getElementById('clearList');
clearListButton.addEventListener('click', () => {
    if (confirm('Are you sure you want to clear the list?')) {
        localStorage.removeItem('countData');
        countListElement.innerHTML = '';
        clearImportedFileHashes(); // Add this line to clear imported file hashes except the source hash
    }
});
const exportCsvButton = document.getElementById('exportCsv');
exportCsvButton.addEventListener('click', () => {
    exportListAsCSV();
});
const exportListButton = document.getElementById('exportList');
exportListButton.addEventListener('click', () => {
    exportListAsJSON();
});
const importListButton = document.getElementById('importList');
importListButton.addEventListener('change', handleFileInputChange);
const savedListName = localStorage.getItem('listName');
if (savedListName) {
    listNameInput.value = savedListName;
    updateListNameDisplay(savedListName);
}
const visitorId = getVisitorId();
displayCountList(getCountData());
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
            }, 5500);
        }
    });
}
function annotateItem(mainCategory, subCategory, item) {
    const currentData = getCountData();
    const itemData = currentData[mainCategory][subCategory][item];
    // Prompt the user to enter an annotation
    const annotation = prompt('Enter your annotation for this item:');
    if (annotation) {
        itemData.annotations.push(annotation);
        setCountData(currentData);
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
function loadInventory() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch('inventory.json');
        const jsonData = yield response.json();
        const countData = {};
        for (const mainCategory in countData) {
            for (const subCategory in countData[mainCategory]) {
                for (const item of Object.keys(countData[mainCategory][subCategory])) {
                    if (!countData[mainCategory][subCategory][item]) {
                        countData[mainCategory][subCategory][item] = {
                            count: 0,
                            addedBy: visitorId,
                            annotations: [], // Add this line
                        };
                    }
                    ;
                }
            }
            return countData;
        }
    });
}
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
function addItem(mainCategory, subCategory, item) {
    const currentData = getCountData();
    if (!currentData[mainCategory]) {
        currentData[mainCategory] = {};
    }
    if (!currentData[mainCategory][subCategory]) {
        currentData[mainCategory][subCategory] = {};
    }
    if (!currentData[mainCategory][subCategory][item]) {
        currentData[mainCategory][subCategory][item] = {
            count: 1,
            addedBy: visitorId,
            annotations: [] // <-- Initialize the 'annotations' property here
        };
    }
    else {
        currentData[mainCategory][subCategory][item].count++;
    }
    setCountData(currentData);
}
function handleRowClick(row, item, mainCategory, subCategory, count) {
    const newCount = prompt(`Enter new count for ${item} (${mainCategory} > ${subCategory}):`, count.toString());
    if (newCount !== null) {
        const difference = parseInt(newCount) - count;
        const differenceCell = row.cells[1]; // Assuming the difference cell is at index 1
        differenceCell.textContent = difference.toString();
        differenceCell.style.color = difference < 0 ? 'red' : 'green';
        // Update the count and annotations in local storage
        const currentData = getCountData();
        currentData[mainCategory][subCategory][item].count = parseInt(newCount);
        currentData[mainCategory][subCategory][item].annotations.push(difference.toString()); // Push the difference as a new annotation
        setCountData(currentData); // Update the local storage with the new data
    }
}
function populateItems(items) {
    itemElement.innerHTML = '';
    items.forEach(itemName => {
        const optionItem = document.createElement('option');
        optionItem.textContent = itemName;
        itemElement.appendChild(optionItem);
    });
    itemElement.style.display = 'inline';
}
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
            addedBy: visitorId,
            annotations: [], // Add this line
        };
    }
    if (sign < 0 && countData[mainCategory][subCategory][item].count + count < 0) {
        showErrorOverlay();
        messageElement.textContent = `Cannot subtract ${Math.abs(count)} from ${item} as it doesn't have enough quantity!`;
        setTimeout(() => {
            messageElement.textContent = '';
        }, 5500);
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
renameListButton.addEventListener('click', () => {
    const currentListName = listNameInput.value;
    const newListName = prompt('Enter the new name for the list:', currentListName);
    if (newListName !== null && newListName.trim() !== '') {
        listNameInput.value = newListName.trim();
        updateListNameDisplay(newListName.trim());
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
function displayCountList(data) {
    var _a, _b, _c, _d, _e, _f;
    const countListElement = document.getElementById('countList');
    countListElement.innerHTML = '';
    // Create table headers
    const header = countListElement.createTHead();
    const headerRow = header.insertRow(0);
    headerRow.insertCell(0).textContent = 'Count';
    headerRow.insertCell(1).textContent = 'Annotations';
    headerRow.insertCell(2).textContent = 'Item';
    headerRow.insertCell(3).textContent = 'Type';
    headerRow.insertCell(4).textContent = 'Category';
    // Insert table data
    for (const mainCategory in data) {
        for (const subCategory in data[mainCategory]) {
            for (const item in data[mainCategory][subCategory]) {
                const count = ((_c = (_b = (_a = getCountData()[mainCategory]) === null || _a === void 0 ? void 0 : _a[subCategory]) === null || _b === void 0 ? void 0 : _b[item]) === null || _c === void 0 ? void 0 : _c.count) || 0;
                const annotations = ((_f = (_e = (_d = getCountData()[mainCategory]) === null || _d === void 0 ? void 0 : _d[subCategory]) === null || _e === void 0 ? void 0 : _e[item]) === null || _f === void 0 ? void 0 : _f.annotations) || [];
                const row = countListElement.insertRow(-1);
                row.insertCell(0).textContent = count.toString();
                row.insertCell(1).textContent = JSON.stringify(annotations);
                row.insertCell(2).textContent = item;
                row.insertCell(3).textContent = subCategory;
                row.insertCell(4).textContent = mainCategory;
                row.addEventListener('click', () => handleRowClick(row, item, mainCategory, subCategory, count));
            }
        }
    }
}
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
function exportListAsJSON() {
    const countData = getCountData();
    const sourceHash = localStorage.getItem('sourceHash');
    // Prepare the export data with annotations
    const exportData = { sourceHash: sourceHash || '' };
    for (const mainCategory in countData) {
        if (!exportData[mainCategory]) {
            exportData[mainCategory] = {};
        }
        for (const subCategory in countData[mainCategory]) {
            if (!exportData[mainCategory][subCategory]) {
                exportData[mainCategory][subCategory] = {};
            }
            for (const item in countData[mainCategory][subCategory]) {
                exportData[mainCategory][subCategory][item] = {
                    count: countData[mainCategory][subCategory][item].count,
                    addedBy: countData[mainCategory][subCategory][item].addedBy,
                    annotations: countData[mainCategory][subCategory][item].annotations,
                };
            }
        }
    }
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
function exportListAsCSV() {
    const countData = getCountData();
    const sourceHash = localStorage.getItem('sourceHash') || '';
    // Prepare the CSV headers
    const headers = ['mainCategory', 'subCategory', 'item', 'count', 'sourceHash'];
    let csvContent = headers.join(',') + '\n';
    // Iterate through the countData object and create rows for the CSV
    for (const mainCategory in countData) {
        for (const subCategory in countData[mainCategory]) {
            for (const item in countData[mainCategory][subCategory]) {
                const count = countData[mainCategory][subCategory][item].count;
                const row = [mainCategory, subCategory, item, count, sourceHash];
                csvContent += row.join(',') + '\n';
            }
        }
    }
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Get the list name from the listNameElement and append visitor UUID
    const listName = listNameElement.textContent || 'Current_Count';
    const fileName = `${listName}_${visitorId}.csv`;
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
                        messageElement.textContent = 'Warning: The source of the imported file is not identical to the current source file.';
                        setTimeout(() => {
                            messageElement.textContent = '';
                        }, 5000);
                    }
                    delete importedData.sourceHash; // Remove sourceHash from jsonData before merging with the current count
                    const currentData = getCountData();
                    // Merge the imported data with the current data
                    const mergedData = mergeCountData(currentData, importedData);
                    for (const mainCategory in mergedData) {
                        for (const subCategory in mergedData[mainCategory]) {
                            for (const item in mergedData[mainCategory][subCategory]) {
                                if (!mergedData[mainCategory][subCategory][item].annotations) {
                                    mergedData[mainCategory][subCategory][item].annotations = [];
                                }
                            }
                        }
                    }
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
            }, 5500);
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
                            // Merge annotations array
                            const currentAnnotations = result[mainCategory][subCategory][item].annotations || [];
                            const importedAnnotations = importedData[mainCategory][subCategory][item].annotations || [];
                            result[mainCategory][subCategory][item].annotations = currentAnnotations.concat(importedAnnotations);
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
function clearAllBrowserData() {
    if (confirm('Are you sure you want to clear all browser data for this page?')) {
        // List all the keys you want to remove from the local storage
        const keysToRemove = [
            'countData',
            'listName',
            'sourceHash',
            'visitorId',
            'importedFileHashes',
        ];
        // Remove each key from the local storage
        keysToRemove.forEach(key => localStorage.removeItem(key));
        // Optionally, reload the page to reflect the changes
        window.location.reload();
    }
}
