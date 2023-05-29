# [Inventori](https://glittery-puffpuff-043120.netlify.app/)

Inventori is a TypeScript application that offers a user-friendly system for managing and manipulating inventory data. It provides functionality to import and export inventory data from JSON files and also to export data in CSV format. It requires no commitment from users by exclusively utilizing the browser's local storage for data handling and management


[![Netlify Status](https://api.netlify.com/api/v1/badges/77991343-af4e-4913-be94-f1789ca2981d/deploy-status)](https://app.netlify.com/sites/glittery-puffpuff-043120/deploys)

# Key Features

## Unique Visitor Identification
Inventori generates and stores unique visitor IDs in the browser's local storage. These IDs are used to create distinctive names for the exported inventory data files.

## Export Inventory Data
Inventori supports the export of inventory data in two primary formats: JSON and CSV.

JSON: The exportListAsJSON() function retrieves the inventory data, prepares it, converts it into a JSON string, and finally creates a downloadable file with a unique filename based on the visitor's ID.

CSV: The exportListAsCSV() function, similar to its JSON counterpart, prepares the CSV headers and iterates through the inventory data to create CSV content. It then generates a Blob from the CSV content, and a downloadable file is produced.

## Import Inventory Data
Inventori facilitates the import of inventory data through the handleFileInputChange() function. It checks if the uploaded file is a JSON file, generates a file hash, and compares it with the hashes of previously imported files to prevent duplicate imports. Valid files are parsed, and their data are seamlessly merged with the current inventory data.

## Data Management
Inventori uses several functions to manage data effectively.

getImportedFileHashes() retrieves the hashes of imported files from local storage.

updateImportedFileHashes() adds a new hash to the list of imported file hashes stored in the local storage.

mergeCountData() combines the current inventory data with imported data, ensuring that counts are summed up correctly, and notes are merged without duplication.

clearImportedFileHashes() and clearAllBrowserData() functions are used to clear the list of imported file hashes and all app-related data from the local storage, respectively.

validateImportedData() validates the imported data, checking that it adheres to the required structure and contains all the necessary fields.

## QR Code Generation
The generateQRCode() function generates a QR code based on a given URL, which can be used to share the URL on mobile devices easily.

## Design Considerations
Inventori is designed to be system agnostic and completely permission free as a top priority. It does not send or receive data from a server. Instead, all data, including inventory counts, item names, categories, unique visitor IDs, and hashes of imported files, are stored and manipulated in the user's local browser storage. Users also have the option to clear all the app's data from the browser storage.


## How to Use

1. Select a main category, sub-category, and item from the dropdown menus.
2. Use the `+` and `-` buttons to add or subtract the quantity of the selected item.
3. Click the "Rename" button to change the name of the inventory list.
4. Click the "Clear List" button to clear the entire inventory list.
5. Click the "Export List as JSON" button to download the inventory list as a JSON file.


## Nix Deployment

To run the Inventory App locally, run.

```bash
git clone https://github.com/harryprayiv/inventoryTS.git
cd inventoryTS
nix run .#live-server

```

## Installation and Deployment for Non-Nix People

To run the Inventory App locally, clone this repository and open the `index.html` file in a web browser.

```bash
git clone https://github.com/harryprayiv/inventoryTS.git
cd inventoryTS

```





