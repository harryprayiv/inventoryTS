module Main where

import Prelude

import Control.Monad.Aff (Aff, later', makeAff)
import Control.Monad.Eff.Console (log)
import Control.Monad.Except (throwError)
import Data.Array (head)
import Data.Either (Either(..))
import Data.Foldable (for_)
import Data.Functor (($>))
import Data.Int (toNumber)
import Data.JSON.Decode (decodeJSON)
import Data.Maybe (Maybe(..), fromJust)
import Data.Nullable (toNullable)
import DOM (DOM)
import DOM.Event.EventTarget (dispatchEvent)
import DOM.File.File (file)
import DOM.File.FileList (item)
import DOM.File.FileReader (newFileReader, readAsText)
import DOM.File.Types (File, FileReader)
import DOM.HTML.Types (ElementType(..), HTMLElement, HTMLSelectElement, HTMLTableElement, HTMLInputElement, HTMLButtonElement, HTMLParagraphElement)
import DOM.HTML.HTMLElement (innerText)
import DOM.HTML.HTMLSelectElement as SelectElement
import Effect (Effect)
import Effect.Aff (launchAff_)
import Effect.Class.Console (logShow)
import Effect.Exception (Error, message)
import Effect.Ref (Ref, new, read, write)
import Foreign.Object as FO
import Web.Event.Event (Event, EventType(..), event)
import Web.HTML (window)
import Web.HTML.HTMLDocument as HTMLDocument
import Web.HTML.Window as Window

type ItemData =
  { count :: Int
  , addedBy :: String
  }

type SubCategoryData =
  FO.Object ItemData

type MainCategoryData =
  FO.Object SubCategoryData

type CountData =
  FO.Object MainCategoryData

foreign import _confirm :: String -> Effect Boolean

foreign import _setTimeout :: Effect Unit -> Int -> Effect Unit

foreign import _digestMessage :: ArrayBuffer -> Aff String

foreign import _removeChild :: HTMLElement -> HTMLElement -> Effect Unit

main :: Effect Unit
main = launchAff_ do
  document <- HTML.window >>= HTMLDocument.toDocument
  mainCategoryElement <- getElementById "mainCategory" >>= unsafeCoerceElement
  subCategoryElement <- getElementById "subCategory" >>= unsafeCoerceElement
  itemElement <- getElementById "item" >>= unsafeCoerceElement
  countListElement <- getElementById "countList" >>= unsafeCoerceElement
  importInventoryButton <- getElementById "importInventory" >>= unsafeCoerceElement
  clearBrowserDataButton <- getElementById "clearBrowserDataButton" >>= unsafeCoerceElement
  incrementButton <- getElementById "increment" >>= unsafeCoerceElement
  decrementButton <- getElementById "decrement" >>= unsafeCoerceElement
  countInput <- getElementById "countInput" >>= unsafeCoerceElement
  messageElement <- getElementById "statusMessage" >>= unsafeCoerceElement

  addEventListener (EventType "change") (handleInventoryFileInputChange document messageElement mainCategoryElement subCategoryElement itemElement) importInventoryButton
  addEventListener (EventType "click") (clearAllBrowserData messageElement) clearBrowserDataButton

  incrementButton `onClick` changeCount 1 mainCategoryElement subCategoryElement itemElement countInput messageElement
  decrementButton `onClick` changeCount (-1) mainCategoryElement subCategoryElement itemElement countInput messageElement

  fetch "./inventory.json" >>= case _ of
    Left err -> do
      Console.error $ "Error fetching menu data: " <> message err
      showErrorOverlay document
    Right response -> do
      buffer <- responseArrayBuffer response
      hash <- _digestMessage buffer
      jsonData <- new TextDecoder <*> pure buffer >>= decode
      let menuData = decodeJSON jsonData :: Either Error CountData
      case menuData of
        Left err -> throwError err
        Right menuData' -> do
          populateMainCategories mainCategoryElement subCategoryElement itemElement menuData'
          setItem "sourceHash" hash

getElementById :: String -> Aff HTMLElement
getElementById id = Window.window >>= HTMLDocument.document >>= Document.getElementById id

unsafeCoerceElement :: forall a. HTMLElement -> Aff a
unsafeCoerceElement = pure <<< unsafeCoerce

addEventListener :: EventType -> (Event -> Aff Unit) -> HTMLElement -> Aff Unit
addEventListener eventType handler element = do
  wrappedHandler <- Event.wrapEventHandler handler
  Event.addEventListener eventType wrapped

countData mainCategory subCategory item { count } = count + count

setCountData countData

Console.log "Updated count:" countData
displayCountList countData

countInput.value = "1"
messageElement.textContent = "Recorded " <> (if count >= 0 then "add" else "subtract") <> " " <> show (abs count) <> " of " <> item <> "!"
setTimeout 3000 do
  messageElement.textContent = ""

listNameInput <- getElementById "listName" >>= unsafeCoerceElement
renameListButton <- getElementById "renameList" >>= unsafeCoerceElement
clearListButton <- getElementById "clearList" >>= unsafeCoerceElement
listNameElement <- getElementById "listName" >>= unsafeCoerceElement

renameListButton `onClick` do
  currentListName <- listNameInput.value
  newListName <- prompt "Enter the new name for the list:" currentListName
  case newListName of
    Just name | name /= "" -> do
      listNameInput.value = name
      updateListNameDisplay name
    _ -> pure unit

clearListButton `onClick` do
  confirmResult <- confirm "Are you sure you want to clear the list?"
  when confirmResult do
    removeItem "countData"
    countListElement.innerHTML = ""
    clearImportedFileHashes

digestMessage :: ArrayBuffer -> Effect String
digestMessage = -- Implement digestMessage function using crypto.subtle.digest

updateListNameDisplay :: String -> Effect Unit
updateListNameDisplay listName = do
  listNameElement.textContent = listName
  document.title = listName

savedListName <- getItem "listName"
for_ savedListName \name -> do
  listNameInput.value = name
  updateListNameDisplay name

displayCountList :: CountData -> Effect Unit
displayCountList countData = do
  countListElement <- getElementById "countList" >>= unsafeCoerceElement
  countListElement.innerHTML = ""

  -- Create table headers
  header <- countListElement.createTHead
  headerRow <- header.insertRow 0
  (headerRow.insertCell 0).textContent = "Count"
  (headerRow.insertCell 1).textContent = "Item"
  (headerRow.insertCell 2).textContent = "Type"
  (headerRow.insertCell 3).textContent = "Category"

  -- Insert table data
  for mainCategory countData \mainCategoryData ->
    for subCategory mainCategoryData \subCategoryData ->
      for item subCategoryData \itemData -> do
        let count = itemData.count
        row <- countListElement.insertRow -1

        (row.insertCell 0).textContent = show count
        (row.insertCell 1).textContent = item
        (row.insertCell 2).textContent = subCategory
        (row.insertCell 3).textContent = mainCategory

displayCountList (getCountData)

getCountData :: Effect CountData
getCountData = do
  countDataString <- getItem "countData"
  case countDataString of
    Just jsonString -> pure (unsafeDecodeJSON jsonString)
    _ -> pure mempty

setCountData :: CountData -> Effect Unit
setCountData countData =
  let countDataString = encodeJSON countData
  in setItem "countData" countDataString

exportListButton <- getElementById "exportList" >>= unsafeCoerceElement

exportListButton `onClick` do
  exportListAsJSON

exportListAsJSON :: Effect Unit
exportListAsJSON = do
  countData <- getCountData
  sourceHash <- getItem "sourceHash"
  let exportData = (sourceHash <|> "") : countData
  let dataString = encodeJSON exportData
  blob <- new Blob [dataString] { type: "application/json" }
  url <- URL.createObjectURL blob
  link <- createElement "a"
  link.href = url

  -- Get the list name from the listNameElement and append visitor UUID
  listName <- listNameElement.textContent
  let fileName = (listName <|> "Current_Count") <> "_" <> visitorId <> ".json"

  link.download = fileName
  document.body.appendChild link
  link.click
  setTimeout 100 do
    document.body.removeChild link
    URL.revokeObjectURL url

getVisitorId :: Effect String
getVisitorId = -- Implement getVisitorId function using localStorage.getItem

generateUniqueId :: Effect String
generateUniqueId = -- Implement generateUniqueId function

visitorId <- getVisitorId

handleFileInputChange :: Event -> Effect Unit
handleFileInputChange event = do
  fileInput <- target event >>= unsafeCoerceElement
  file <- fileInput.files.item 0

  case file of
    Just f | f.type == "application/json" -> do
      buffer <- f.arrayBuffer
      fileHash <- digestMessage buffer
      importedFileHashes <- getImportedFileHashes

      if fileHash `elem` importedFileHashes
        then do
          showErrorOverlay
          messageElement.textContent = "This file has already been imported."
          setTimeout 3000 do
            messageElement.textContent = ""
        else do
          reader <- new FileReader
          reader.onload = async \e -> do
            let importedData = unsafeDecodeJSON (e.target.result)
            storedSourceHash <- getItem "sourceHash"
            let importedSourceHash = importedData.sourceHash
            if storedSourceHash /= importedSourceHash
              then do
                showErrorOverlay
                messageElement.textContent = "Warning: The source of the imported file is not identical to the current source file."
                setTimeout 5000 do
                  messageElement.textContent = ""
              else do
                delete importedData "sourceHash"
                currentData <- getCountData
                let mergedData = mergeCountData currentData importedData
                setCountData mergedData
                displayCountList mergedData
                updateImportedFileHashes fileHash
      _ -> do
        messageElement.textContent = "Please select a JSON file."
        setTimeout 5500 do
          messageElement.textContent = ""

getImportedFileHashes :: Effect (Array String)
getImportedFileHashes = do
  importedFileHashesString <- getItem "importedFileHashes"
  case importedFileHashesString of
    Just jsonString -> pure (unsafeDecodeJSON jsonString)
    _ -> pure []

updateImportedFileHashes :: String -> Effect Unit
updateImportedFileHashes newHash = do
  importedFileHashes <- getImportedFileHashes
  setItem "importedFileHashes" (encodeJSON (newHash : importedFileHashes))

importListButton <- getElementById "importList" >>= unsafeCoerceElement
importListButton `addEventListener` "change" handleFileInputChange

mergeCountData :: CountData -> CountData -> CountData
mergeCountData currentData importedData =
  let
    insertData acc mainCategory subCategory item =
      case acc # lookup mainCategory of
        Just mainCat ->
          case mainCat # lookup subCategory of
            Just subCat ->
              case subCat # lookup item of
                Just countItem ->
                  insert mainCategory (insert subCategory (insert item { count = countItem.count + item.count } subCat) mainCat) acc
                _ ->
                  insert mainCategory (insert subCategory (insert item.item item subCat) mainCat) acc
            _ ->
              insert mainCategory (insert subCategory (singleton item.item item) mainCat) acc
        _ ->
          insert mainCategory (singleton subCategory (singleton item.item item)) acc
  in
    foldl
      (\acc mainCategory ->
        foldl
          (\acc' subCategory ->
            foldl (\acc'' item -> insertData acc'' mainCategory subCategory item) acc' subCategory.items
          )
          acc
          mainCategory.subCategories
      )
      currentData
      (map snd (toList importedData))

clearImportedFileHashes :: Effect Unit
clearImportedFileHashes = do
  sourceHash <- getItem "sourceHash"
  case sourceHash of
    Just hash -> setItem "importedFileHashes" (encodeJSON [hash])
    _ -> removeItem "importedFileHashes"