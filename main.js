// Import the JSON data
import inventoryData from './inventory.json';
const inventory = document.getElementById('inventory');
function buildInventoryList(data) {
    for (const category in data) {
        const categoryDiv = document.createElement('div');
        const categoryTitle = document.createElement('h2');
        categoryTitle.textContent = category;
        categoryDiv.appendChild(categoryTitle);
        for (const subCategory in data[category]) {
            const subCategoryDiv = document.createElement('div');
            const subCategoryTitle = document.createElement('h3');
            subCategoryTitle.textContent = subCategory;
            subCategoryDiv.appendChild(subCategoryTitle);
            const itemList = document.createElement('ul');
            for (const itemName in data[category][subCategory]) {
                const listItem = document.createElement('li');
                listItem.textContent = itemName;
                itemList.appendChild(listItem);
            }
            subCategoryDiv.appendChild(itemList);
            categoryDiv.appendChild(subCategoryDiv);
        }
        inventory.appendChild(categoryDiv);
    }
}
buildInventoryList(inventoryData);
