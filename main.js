const mainCategoryElement = document.getElementById('mainCategory');
const subCategoryElement = document.getElementById('subCategory');
const itemElement = document.getElementById('item');
const countListElement = document.getElementById('countList');
fetch('./inventory.json')
    .then(response => response.json())
    .then(menuData => {
    populateMainCategories(menuData);
})
    .catch(error => console.error('Error fetching menu data:', error));
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
    Object.keys(items).forEach(key => {
        const optionItem = document.createElement('option');
        optionItem.textContent = key;
        itemElement.appendChild(optionItem);
    });
    itemElement.style.display = 'inline';
}
const incrementButton = document.getElementById('increment');
const decrementButton = document.getElementById('decrement');
const countInput = document.getElementById('countInput');
const messageElement = document.getElementById('message');
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
    if (!countData[mainCategory][subCategory][item])
        countData[mainCategory][subCategory][item] = 0;
    if (sign < 0 && countData[mainCategory][subCategory][item] + count < 0) {
        messageElement.textContent = `Cannot subtract ${Math.abs(count)} from ${item} as it doesn't have enough quantity!`;
        setTimeout(() => {
            messageElement.textContent = '';
        }, 3000);
        return;
    }
    countData[mainCategory][subCategory][item] += count;
    setCountData(countData);
    console.log('Updated count:', countData);
    displayCountList(countData);
    countInput.value = '0';
    messageElement.textContent = `Recorded ${count >= 0 ? 'add' : 'subtract'} ${Math.abs(count)} of ${item}!`;
    setTimeout(() => {
        messageElement.textContent = '';
    }, 3000);
}
function displayCountList(countData) {
    countListElement.innerHTML = ''; // Clear the previous count list
    Object.entries(countData).forEach(([mainCategory, subCategories]) => {
        Object.entries(subCategories).forEach(([subCategory, items]) => {
            Object.entries(items).forEach(([item, count]) => {
                const itemId = `item-${mainCategory}-${subCategory}-${item}`.replace(/[^a-zA-Z0-9-_]/g, '_');
                let itemElement = document.getElementById(itemId);
                if (itemElement) {
                    // Update the count for the existing element
                    itemElement.textContent = `${mainCategory} > ${subCategory} > ${item}: ${count}`;
                }
                else {
                    // Create a new element for the item
                    itemElement = document.createElement('div');
                    itemElement.id = itemId;
                    itemElement.textContent = `${mainCategory} > ${subCategory} > ${item}: ${count}`;
                    countListElement.appendChild(itemElement);
                }
            });
        });
    });
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
