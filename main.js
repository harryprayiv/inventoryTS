// main.ts
import inventoryData from './inventory.json';
const inventoryDiv = document.getElementById('inventory');
function createNestedList(data, listElement) {
    for (const key in data) {
        const listItem = document.createElement('li');
        listItem.textContent = key;
        const nestedList = document.createElement('ul');
        listItem.appendChild(nestedList);
        listElement.appendChild(listItem);
        createNestedList(data[key], nestedList);
    }
}
if (inventoryDiv) {
    const list = document.createElement('ul');
    createNestedList(inventoryData, list);
    inventoryDiv.appendChild(list);
}
