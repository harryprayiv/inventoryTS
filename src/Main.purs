module Main where

import Prelude

import Control.Monad.Except (throwError)
import Data.Array (head)
import Data.Either (Either(..))
import Data.Foldable (for_)
import Data.Functor (($>))
import Data.Int (toNumber)
import Data.Maybe (Maybe(..), fromJust)
import Data.Nullable (toNullable)
import Data.Time.Duration (Milliseconds(..))
import Data.Time.Clock.POSIX (posixTime)
import Effect.Random (random)
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
import Web.Storage (Storage, getItem, setItem)
import Web.Storage.LocalStorage (localStorage)


type ItemData =
  { count :: Int
  , addedBy :: String
  }

newtype UniqueId = UniqueId String
derive instance newtypeUniqueId :: Newtype UniqueId _

instance showUniqueId :: Show UniqueId where
  show (UniqueId s) = s

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
  Event.addEventListener eventType wrappedHandler element

countData mainCategory subCategory item { count } = count + count

-- setCountData countData

changeCount :: Int -> HTMLElement -> HTMLElement -> HTMLElement -> HTMLElement -> HTMLElement -> Event -> Aff Unit
changeCount count mainCategoryElement subCategoryElement itemElement countInput messageElement event = do
  let mainCategory = mainCategoryElement.value
  let subCategory = subCategoryElement.value
  let item = itemElement.value
  currentCountData <- liftEffect getCountData
  let newCountData = countData mainCategory subCategory item currentCountData count
  liftEffect $ setCountData newCountData
  Console.log "Updated count:" newCountData
  displayCountList newCountData
  liftEffect $ setInputValue countInput "1"
  liftEffect $ HTMLElement.setTextContent ("Recorded " <> (if count >= 0 then "add" else "subtract") <> " " <> show (abs count) <> " of " <> item <> "!") messageElement
  setTimeout 3000 $ liftEffect $ \_ -> HTMLElement.setTextContent "" messageElement

  listNameInput <- getElementById "listName" >>= unsafeCoerceElement
  renameListButton <- getElementById "renameList" >>= unsafeCoerceElement
  clearListButton <- getElementById "clearList" >>= unsafeCoerceElement
  listNameElement <- getElementById "listName" >>= unsafeCoerceElement

renameListButtonOnClick :: HTMLElement -> HTMLElement -> Aff Unit
renameListButtonOnClick renameListButton listNameInput = do
  currentListName <- liftEffect $ HTMLInputElement.getValue listNameInput
  newListName <- prompt "Enter the new name for the list:" currentListName
  case newListName of
    Just name | name /= "" -> do
      liftEffect $ HTMLInputElement.setValue listNameInput name
      updateListNameDisplay name
    _ -> pure unit

clearListButtonOnClick :: HTMLElement -> HTMLElement -> Aff Unit
clearListButtonOnClick clearListButton countListElement = do
  clearListButton `addEventListener` "click" \_ -> do
    confirmResult <- confirm "Are you sure you want to clear the list?"
    when confirmResult do
      liftEffect $ removeItem "countData"
      liftEffect $ HTMLElement.setInnerHTML "" countListElement
      liftEffect clearImportedFileHashes

setInputValue :: HTMLElement -> String -> Effect Unit
setInputValue element value = do
  input <- HTMLInputElement.fromElement element
  HTMLInputElement.setValue value input

-- Implement digestMessage function using crypto.subtle.digest
digestMessage :: ArrayBuffer -> Effect String
digestMessage = undefined

updateListNameDisplay :: String -> Effect Unit
updateListNameDisplay listName = do
  listNameElement <- getElementById "listName" >>= unsafeCoerceElement
  HTMLElement.setTextContent listName listNameElement
  document <- Document.window >>= HTMLDocument.document
  Document.setTitle listName document

-- savedListName <- liftEffect $ getItem "listName"
-- for_ savedListName \name -> do
--   liftEffect $ HTMLInputElement.setValue listNameInput name
--   updateListNameDisplay name

displayCountList :: CountData -> Effect Unit
displayCountList countData = do
  countListElement <- getElementById "countList" >>= unsafeCoerceElement
  HTMLElement.setInnerHTML "" countListElement

  -- Create table headers
  header <- HTMLElement.createTHead countListElement
  headerRow <- HTMLTableElement.insertRow 0 header
  _ <- setElemTextContent "Count" =<< HTMLTableRowElement.insertCell 0 headerRow
  _ <- setElemTextContent "Item" =<< HTMLTableRowElement.insertCell 1 headerRow
  _ <- setElemTextContent "Type" =<< HTMLTableRowElement.insertCell 2 headerRow
  _ <- setElemTextContent "Category" =<< HTMLTableRowElement.insertCell 3 headerRow

  -- Insert table data
  for_ countData \mainCategoryData ->
    for_ mainCategoryData \subCategoryData ->
      for_ subCategoryData \itemData -> do
        let count = itemData.count
        row <- HTMLTableElement.insertRow (-1) countListElement
        _ <- setElemTextContent (show count) =<< HTMLTableRowElement.insertCell 0 row
        _ <- setElemTextContent item =<< HTMLTableRowElement.insertCell 1 row
        _ <- setElemTextContent subCategory =<< HTMLTableRowElement.insertCell 2 row
        _ <- setElemTextContent mainCategory =<< HTMLTableRowElement.insertCell 3 row

  where
    setElemTextContent :: String -> HTMLElement -> Effect Unit
    setElemTextContent content elem = HTMLElement.setTextContent content elem

  -- displayCountList (getCountData)

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

exportListButtonOnClick :: HTMLElement -> Aff Unit
exportListButtonOnClick exportListButton = do
  exportListButton `addEventListener` (EventType "click") \_ -> do
    exportListAsJSON

exportListAsJSON :: Aff Unit
exportListAsJSON = do
  countData <- liftEffect getCountData
  sourceHash <- liftEffect getItem "sourceHash"
  let exportData = (sourceHash <|> "") : countData
  let dataString = encodeJSON exportData
  blob <- liftEffect $ new Blob [dataString] { type: "application/json" }
  url <- liftEffect $ URL.createObjectURL blob
  link <- liftEffect $ createElement "a"
  liftEffect $ HTMLElement.setHref url link

  -- Get the list name from the listNameElement and append visitor UUID
  listName <- liftEffect $ HTMLElement.getTextContent listNameElement
  let fileName = (listName <|> "Current_Count") <> "_" <> visitorId <> ".json"

  liftEffect $ HTMLElement.setDownload fileName link
  liftEffect $ HTMLElement.appendChild link document.body
  liftEffect $ HTMLElement.click link
  liftEffect $ setTimeout 100 do
    HTMLElement.removeChild link document.body
    URL.revokeObjectURL url

getVisitorId :: Effect String
getVisitorId = do
  storage <- localStorage
  mVisitorId <- getItem "visitorId" storage
  case mVisitorId of
    Just visitorId -> pure visitorId
    Nothing -> do
      newVisitorId <- generateUniqueId
      setItem "visitorId" (show newVisitorId) storage
      pure $ show newVisitorId

generateUniqueId :: Effect UniqueId
generateUniqueId = do
  currentTime <- posixTime
  randomNumber <- random
  let timeString = show (Milliseconds currentTime)
      randomString = show (floor (randomNumber * 1000000.0) :: Int)
  pure $ UniqueId $ timeString <> randomString

-- visitorId <- getVisitorId

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