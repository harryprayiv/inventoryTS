const loadMenuButton = document.getElementById('loadMenu');
const mainCategoryElement = document.getElementById('mainCategory');
const subCategoryElement = document.getElementById('subCategory');
const itemElement = document.getElementById('item');
loadMenuButton.addEventListener('click', () => {
    fetch('./inventory.json')
        .then(response => response.json())
        .then(menuData => {
        populateMainCategories(menuData);
    })
        .catch(error => console.error('Error fetching menu data:', error));
});
function populateMainCategories(menuData) {
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
function populateSubCategories(subCategories) {
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
function populateItems(items) {
    itemElement.innerHTML = ''; // Clear the previous menu items
    Object.keys(items).forEach(key => {
        const optionItem = document.createElement('option');
        optionItem.textContent = key;
        itemElement.appendChild(optionItem);
    });
    itemElement.style.display = 'inline';
}
