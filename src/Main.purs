module Main where

import Prelude

import Data.Array (take)
import Data.Foldable (foldl, traverse_)
import Data.List (List(..))
import Data.Map as M
import Data.Map.Internal (Map)
import Data.Maybe (fromMaybe)
import Effect (Effect)
import Effect.Aff (Aff, launchAff_)
import Effect.Class (liftEffect)
import Effect.Console (log)
import Effect.Ref (Ref, new, read, write)
import Effect.Unsafe (unsafePerformEffect)
import Halogen.Aff (awaitBody, runHalogenAff)
import Halogen.HTML (ClassName(..), text)
import Halogen.HTML.Properties as P
import Halogen.VDom.Driver (runUI)
import Web.HTML (window)
import Web.HTML.HTMLDocument as HTMLDocument
import Web.DOM.Element (setAttribute)
import Web.HTML.HTMLInputElement (value)
import Web.HTML.Window as Window
import Web.DOM.Document (createElement)
-- import Web.DOM.Element (setInnerHTML)
import Web.DOM.NonElementParentNode (getElementById)
import Web.DOM.Node (appendChild, removeChild)
import Web.Event.EventTarget (eventListener)
import Web.File.File (File, name)
import Web.File.FileReader as FileReader
import Web.HTML.Event.DragEvent (dataTransfer)
import Web.Event.Event (preventDefault, target)
import Web.UIEvent.MouseEvent (clientX, clientY)
import Web.HTML.Event.DataTransfer (items)
import Web.HTML.Event.DataTransfer.DataTransferItem (length)
-- import Web.HTML.HTMLDataTransferItem (getAsFile)
-- import Web.HTML.Event.DataTransfer
import Web.HTML.Navigator as Navigator
import Web.File.Url (createObjectURL)
import Web.HTML.History (URL)
import Web.Event.EventTarget (addEventListener)
import Fetch.Core (fetch)

import Data.Bifunctor (lmap)
import Data.Either (Either(..), note)
import Data.String.CodeUnits (fromCharArray, toCharArray)
import Data.String.Common (joinWith)
import Data.Tuple (Tuple(..))
import Control.Monad.Error.Class (catchError)
import Web.Event.Internal.Types (Event)
import Data.Argonaut.Core (Json)
import Data.ArrayBuffer.Types (ArrayBuffer)
import Halogen.HTML.Elements (style)
import Crypto.Subtle.Hash (sha256)


type ItemData = { count :: Int, addedBy :: String, notes :: Array (Tuple String Int) }

type SubCategoryData = Map ItemData

type MainCategoryData = Map SubCategoryData

type CountData = Map MainCategoryData

visitorId :: String
visitorId = getVisitorId

getButtonById :: String -> Effect (Maybe HTMLButtonElement)
getButtonById id = do
  doc <- window >>= document
  element <- HTMLDocument.getElementById id doc
  pure $ toHTMLElement =<< element

populateMainCategories :: CountData -> Effect Unit
populateMainCategories menuData = do
  setInnerHTML mainCategoryElement ""
  for_ (keys menuData) \key -> do
    optionItem <- createElement "option"
    optionItem # setInnerText key
    mainCategoryElement # appendChild optionItem

  mainCategoryElement # style "display" "inline"
  _ <- addEventListener "change" (mkEffectFn1 $ const $ do
    mainCategoryValue <- mainCategoryElement # getValue
    case lookup mainCategoryValue menuData of
      Just subCategories -> populateSubCategories subCategories
      Nothing -> pure unit
  ) mainCategoryElement

  mainCategoryValue <- mainCategoryElement # getValue
  case lookup mainCategoryValue menuData of
    Just subCategories -> populateSubCategories subCategories
    Nothing -> pure unit

populateSubCategories :: SubCategoryData -> Effect Unit
populateSubCategories subCategories = do
  subCategoryElement # innerHTML ""
  for_ (keys subCategories) \key -> do
    optionItem <- createElement "option"
    optionItem # setInnerText key
    subCategoryElement # appendChild optionItem

  subCategoryElement # style "display" "inline"
  _ <- addEventListener "change" (mkEffectFn1 $ const $ do
    subCategoryValue <- subCategoryElement # getValue
    case lookup subCategoryValue subCategories of
      Just items -> populateItems (keys items)
      Nothing -> pure unit
  ) subCategoryElement

  subCategoryValue <- subCategoryElement # getValue
  case lookup subCategoryValue subCategories of
    Just items -> populateItems (keys items)
    Nothing -> pure unit

addItem :: String -> String -> String -> Effect Unit
addItem mainCategory subCategory item = do
  currentData <- getCountData
  let
    newData = insertWithDefault mainCategory (null :: MainCategoryData) (insertWithDefault subCategory (null :: SubCategoryData) (insertWithDefault item { count: 1, addedBy: visitorId, notes: [(Tuple visitorId 1)] } currentData)) currentData
  setCountData newData

handleRowClick :: HTMLElement -> String -> String -> String -> Int -> Effect Unit
handleRowClick row item mainCategory subCategory count = do
  newCount <- prompt $ "Enter new note for " <> item <> " (" <> mainCategory <> " > " <> subCategory <> "):"
  case newCount >>= readInt of
    Just newCountValue -> do
      let
        difference = newCountValue - count
      differenceCell <- row # cells # item 1
      differenceCell # setInnerText (show difference)
      differenceCell # style "color" (if difference < 0 then "red" else "green")

      currentData <- getCountData
      let
        updatedData = adjust mainCategory (\mainData -> adjust subCategory (\subData -> adjust item (\itemData -> itemData { count = newCountValue, notes = snoc (notes itemData) (Tuple visitorId difference) }) subData) mainData) currentData
      setCountData updatedData
    _ -> pure unit

populateItems :: Array String -> Effect Unit
populateItems items = do
  itemElement # innerHTML ""
  for_ items \itemName -> do
    optionItem <- createElement "option"
    optionItem # setInnerText itemName
    itemElement # appendChild optionItem

  itemElement # style "display" "inline"

changeCount :: Int -> Effect Unit
changeCount sign = do
  count <- countInput # getValue >>= readInt
  let countValue = count * sign
  mainCategory <- mainCategoryElement # getValue
  subCategory <- subCategoryElement # getValue
  item <- itemElement # getValue

  countData <- getCountData
  let
    updatedCountData = adjust mainCategory (\mainData -> adjust subCategory (\subData -> insertWithDefault item { count: 0, addedBy: visitorId, notes: [] } subData) mainData) countData

    updatedCount = lookup mainCategory countData >>= lookup subCategory >>= lookup item >>= (_.count >>> (flip (+)) countValue) <|> Just 0

  case updatedCount of
    Just updatedCountValue
      | sign < 0 && updatedCountValue < 0 -> do
          showErrorOverlay
          messageElement # setInnerText ("Cannot subtract " <> show (abs countValue) <> " from " <> item <> " as it doesn't have enough quantity!")
          setTimeout 5500 $ messageElement # setInnerText ""
          pure unit
      | otherwise -> do
          let
            finalCountData = adjust mainCategory (\mainData -> adjust subCategory (\subData -> adjust item (\itemData -> itemData { count = updatedCountValue }) subData) mainData) updatedCountData
          setCountData finalCountData
          consoleLog "Updated count:" finalCountData
          displayCountList finalCountData

          countInput # setValue "1"
          messageElement # setInnerText ("Recorded " <> (if countValue >= 0 then "add" else "subtract") <> " " <> show (abs countValue) <> " of " <> item <> "!")
          setTimeout 3000 $ messageElement # setInnerText ""
    _ -> pure unit

annotateItem :: String -> String -> String -> Effect Unit
annotateItem mainCategory subCategory item = do
  currentData <- getCountData
  let itemData = lookup mainCategory currentData >>= lookup subCategory >>= lookup item

  note <- prompt "Enter your note for this item:"
  case itemData of
    Just itemDataValue -> do
      let
        updatedNotes = snoc (notes itemDataValue) (Tuple visitorId (note >>= readInt))
        updatedData = adjust mainCategory (\mainData -> adjust subCategory (\subData -> adjust item (\_ -> itemDataValue { notes = updatedNotes }) subData) mainData) currentData
      setCountData updatedData
    _ -> pure unit

updateListNameDisplay :: String -> Effect Unit
updateListNameDisplay listName = do
  listNameElement # setInnerText listName
  document # setTitle listName

displayCountList :: CountData -> Effect Unit
displayCountList countData = do
  countListElement <- getElementById "countList" >>= unsafeCoerce
  countListElement # innerHTML ""

  -- Create colgroup with column widths
  colgroup <- createElement "colgroup"
  for_ ["10%", "20%", "35%", "20%", "15%"] \width -> do
    col <- createElement "col"
    col # style "width" width
    colgroup # appendChild col
  countListElement # appendChild colgroup

  -- Create table headers
  header <- countListElement # createTHead
  headerRow <- header # insertRow 0
  forWithIndex_ ["Count", "Diff", "Item", "Type", "Category"] \i text -> do
    headerRow # insertCell i # setInnerText text

  -- Insert table 
  for_ (M.keys ) \mainCategory -> do
    for_ (M.keys (M.lookup mainCategory )) \subCategory -> do
      for_ (M.keys (M.lookup subCategory (M.lookup mainCategory ))) \item -> do
        let count = M.lookup mainCategory  >>= M.lookup subCategory >>= M.lookup item >>= (_.count) <|> Just 0
            notes = M.lookup mainCategory  >>= M.lookup subCategory >>= M.lookup item >>= (_.notes) <|> Just []
        row <- countListElement # insertRow (-1)

        row # insertCell 0 # setInnerText (fromMaybe "0" (count <#> show))

        case notes of
          Just ns | not (null ns) -> do
            let lastAnnotation = snd (last ns)
                lastAnnotationVisitorId = fst (last ns)
            noteCell <- row # insertCell 1
            noteCell # setInnerText (show lastAnnotation)
            noteCell # addClass (if lastAnnotationVisitorId == visitorId then "current-session" else "imported-session")
            noteCell # style "color" (if lastAnnotation < 0 then "red" else "green")
          _ -> row # insertCell 1 # setInnerText ""

        row # insertCell 2 # setInnerText item
        row # insertCell 3 # setInnerText subCategory
        row # insertCell 4 # setInnerText mainCategory

        row # addEventListener "click" (handleRowClick row item mainCategory subCategory (fromMaybe 0 count))

getCountData :: Effect CountData
getCountData = do
  countDataString <- getItem "countData"
  case countDataString of
    Just str -> pure (unsafeFromJson str)
    _ -> pure M.null

setCountData :: CountData -> Effect Unit
setCountData countData = do
  let countDataString = toJson countData
  setItem "countData" countDataString

mergeCountData :: CountData -> CountData -> CountData
mergeCountData currentData importedData =
  let
    mergeItem mainCategory subCategory item =
      case M.lookup item (fromMaybe M.null (M.lookup subCategory (M.lookup mainCategory currentData))) of
        Just current -> current { count = count current + count item
                                , notes = notes current <> notes item }
        Nothing -> item

    mergeSubCategory mainCategory subCategory =
      M.unionWith (mergeItem mainCategory subCategory) subCategory (fromMaybe M.null (M.lookup subCategory (M.lookup mainCategory currentData)))

    mergeMainCategory mainCategory =
      M.unionWith (mergeSubCategory mainCategory) mainCategory (fromMaybe M.null (M.lookup mainCategory currentData))
  in
    M.unionWith mergeMainCategory importedData currentData

exportListAsJSON :: Effect Unit
exportListAsJSON = do
  countData <- getCountData
  sourceHash <- getItem "sourceHash"

  let
    exportData = foldl (\acc mainCategory -> M.insert mainCategory (foldl (\acc' subCategory -> M.insert subCategory (foldl (\acc'' item -> M.insert item { addedBy = addedBy item, notes = notes item } acc'') M.null (M.lookup subCategory (M.lookup mainCategory countData))) acc') M.null (M.lookup mainCategory countData)) acc) (M.singleton "sourceHash" (fromMaybe "" sourceHash)) countData

    dataString = stringifyWithIndent 2 exportData
    blob = newBlob [dataString] { type: "application/json" }
    url = createObjectURL blob

  link <- createElement "a"
  link # setAttribute "href" url

  listName <- (listNameElement # getTextContent) <#> fromMaybe "Current_Count"
  let fileName = listName <> "_" <> visitorId <> ".json"

  link # setAttribute "download" fileName
  appendChild documentBody link
  link # click
  setTimeout 100 $ do
    removeChild documentBody link
    revokeObjectURL url

exportListAsCSV :: Effect Unit
exportListAsCSV = do
  countData <- getCountData
  sourceHash <- getItem "sourceHash"

  let
    headers = ["Count", "Diff", "Item", "Type", "Category"]
    csvContent = joinWith "\n" $ (intercalate "," headers) : do
      mainCategory <- M.keys countData
      subCategory <- M.keys (countData ! mainCategory)
      item <- M.keys (countData ! mainCategory ! subCategory)
      let
        count = count (countData ! mainCategory ! subCategory ! item)
        notes = notes (countData ! mainCategory ! subCategory ! item)
        diff = if null notes then "" else show (snd (head notes))
        row = [show count, diff, item, subCategory, mainCategory]
      pure $ intercalate "," row

    blob = newBlob [csvContent] { type: "text/csv" }
    url = createObjectURL blob

  link <- createElement "a"
  link # setAttribute "href" url

  listName <- (listNameElement # getTextContent) <#> fromMaybe "Current_Count"
  let fileName = listName <> "_" <> visitorId <> ".csv"

  link # setAttribute "download" fileName
  appendChild documentBody link
  link # click
  setTimeout 100 $ do
    removeChild documentBody link
    revokeObjectURL url

getVisitorId :: Effect String
getVisitorId = do
  visitorId <- getItem "visitorId"
  case visitorId of
    Just id -> pure id
    Nothing -> do
      newId <- generateUniqueId
      setItem "visitorId" newId
      pure newId

generateUniqueId :: Effect String
generateUniqueId = do
  r1 <- random
  r2 <- random
  pure $ take 13 (drop 2 (show (r1 :: Number) :: String)) <> take 13 (drop 2 (show (r2 :: Number) :: String))

getImportedFileHashes :: Effect (Array String)
getImportedFileHashes = do
  importedFileHashesString <- getItem "importedFileHashes"
  case importedFileHashesString of
    Just str -> pure (unsafeFromJson str)
    _ -> pure []

updateImportedFileHashes :: String -> Effect Unit
updateImportedFileHashes newHash = do
  importedFileHashes <- getImportedFileHashes
  setItem "importedFileHashes" (toJson (importedFileHashes <> [newHash]))

clearImportedFileHashes :: Effect Unit
clearImportedFileHashes = do
  sourceHash <- getItem "sourceHash"
  case sourceHash of
    Just hash -> setItem "importedFileHashes" (toJson [hash])
    Nothing -> removeItem "importedFileHashes"

clearAllBrowserData :: Effect Unit
clearAllBrowserData = do
  let
    keysToRemove = ["countData", "listName", "sourceHash", "visitorId", "importedFileHashes"]
    removeKeys = traverse_ removeItem keysToRemove

  confirmResult <- confirm "Are you sure you want to clear all browser data for this page?"
  when confirmResult $ do
    removeKeys
    reload

showErrorOverlay :: Effect Unit
showErrorOverlay = do
  overlay <- createElement "div"
  setAttribute "id" "errorOverlay" overlay
  style "position" "fixed" overlay
  style "top" "0" overlay
  style "left" "0" overlay
  style "width" "100%" overlay
  style "height" "100%" overlay
  style "backgroundColor" "rgba(0, 0, 0, 0.5)" overlay
  style "display" "flex" overlay
  style "justifyContent" "center" overlay
  style "alignItems" "center" overlay
  style "zIndex" "9999" overlay

  gifContainer <- createElement "div"
  style "width" "400px" gifContainer
  style "height" "400px" gifContainer
  style "backgroundImage" "url(\"https://media.tenor.com/1SastyjoZWoAAAAj/dennis-nedry.gif\")" gifContainer
  style "backgroundSize" "contain" gifContainer
  style "backgroundRepeat" "no-repeat" gifContainer
  style "backgroundPosition" "center center" gifContainer

  appendChild overlay gifContainer
  appendChild documentBody overlay
  setTimeout 2000 $ removeChild documentBody overlay

validateImportedData :: Json -> Boolean
validateImportedData importedData = 
  case importedData of
    Json.Null -> false
    _ -> 
      case readProp "sourceHash" importedData of
        Just (Json.String _) -> true
        _ -> false

generateQRCode :: String -> Effect Unit
generateQRCode url = do
  qrcodeElement <- getElementById "qrcode"
  qrcodeElement # innerHTML ""

  _ <- new (unsafeCoerce QRCode) [toForeign qrcodeElement, unsafeFromJson "{ \"text\": url, \"width\": 90, \"height\": 90 }"]
  pure unit

loadInventory :: Effect CountData
loadInventory = do
  response <- fetch "inventory.json"
  jsonData <- response.json
  let
    countData = foldl (\mainCategory countData -> foldl (\subCategory countData ->
      foldl (\item countData ->
        if isNothing (lookup mainCategory countData) then
          insert mainCategory (singleton subCategory (singleton item { count: 0, addedBy: visitorId, notes: [] })) countData
        else
          insert mainCategory (insert subCategory (singleton item { count: 0, addedBy: visitorId, notes: [] }) (fromMaybe mnull (lookup mainCategory countData))) countData
      ) countData (keys (lookup subCategory (lookup mainCategory jsonData)))
    ) countData (keys (lookup mainCategory jsonData))) mnull (keys jsonData)
  pure countData

handleInventoryFileInputChange :: Event -> Effect Unit
handleInventoryFileInputChange event = do
  fileInput <- target event
  file <- item 0 =<< files fileInput

  case file of
    Just f | fileType f == "application/json" -> do
      reader <- newFileReader
      addEventListener "load" (\e -> do
        inventoryData <- parseJson =<< result reader
        case inventoryData of
          Left err -> do
            showErrorOverlay
            setMessage "Error loading JSON file: Invalid JSON format."
          Right inventoryData -> populateMainCategories inventoryData
      ) reader
      readAsText reader f
    _ -> setMessage "Please select a JSON file."

digestMessage :: ArrayBuffer -> Aff String
digestMessage buffer = do
  hashBuffer <- sha256 "SHA-256" buffer
  let hashArray = toUnfoldable $ typedArrayFromBuffer hashBuffer
  pure $ joinWith "" $ map (\b -> padLeft 2 '0' (showInt16 b)) hashArray

handleFileInputChange :: Event -> Aff Unit
handleFileInputChange event = do
  fileInput <- liftEffect $ target event
  file <- liftEffect $ item 0 =<< files fileInput

  case file of
    Just f | fileType f == "application/json" -> do
      buffer <- toArrayBuffer f
      fileHash <- digestMessage buffer
      importedFileHashes <- liftEffect getImportedFileHashes

      if elem fileHash importedFileHashes then do
        liftEffect showErrorOverlay
        liftEffect $ setMessage "This file has already been imported."
        liftEffect $ setTimeout 3000 $ setMessage ""
        pure unit
      else do
        reader <- liftEffect newFileReader
        let
          onLoad :: Event -> Aff Unit
          onLoad _ = do
            importedData <- parseJson =<< liftEffect (result reader)

            case importedData of
              Left _ -> do
                liftEffect showErrorOverlay
                liftEffect $ setMessage "Error loading JSON file: Invalid JSON format."
                liftEffect $ setTimeout 3000 $ setMessage ""
              Right importedData -> do
                if not $ validateImportedData importedData then do
                  liftEffect showErrorOverlay
                  liftEffect $ setMessage "Error loading JSON file: Invalid data format."
                  liftEffect $ setTimeout 3000 $ setMessage ""
                else do
                  storedSourceHash <- liftEffect $ getItem "sourceHash"
                  let
                    importedSourceHash = importedData.sourceHash
                    importedData' = delete "sourceHash" importedData

                  when (storedSourceHash /= importedSourceHash) $ do
                    liftEffect showErrorOverlay
                    liftEffect $ setMessage "Warning: The source of the imported file is not identical to the current source file which will cause issues in summing multiple counts."
                    liftEffect $ setTimeout 10000 $ setMessage ""

                  currentData <- liftEffect getCountData

                  let
                    mergedData = mergeCountData currentData importedData'
                    mergedData' = map (map (map (\item -> item { notes = fromMaybe [] (notes item) }))) mergedData

                  liftEffect $ setCountData mergedData'
                  liftEffect $ displayCountList mergedData'

                  liftEffect $ updateImportedFileHashes fileHash
        liftEffect $ addEventListener "load" onLoad reader
        liftEffect $ readAsText reader f
    _ -> do
      liftEffect $ setMessage "Please select a JSON file."
      liftEffect $ setTimeout 5500 $ setMessage ""


main :: Effect Unit
main = do
  visitorId <- getVisitorId
  generateQRCode =<< documentUrl
  displayCountList =<< getCountData

  let
    handleFetchError :: Error -> Aff Unit
    handleFetchError error = do
      liftEffect $ consoleError "Error fetching menu data:" error
      liftEffect showErrorOverlay

  Aff.launchAff_ do
    response <- fetch "./inventory.json" `catchError` handleFetchError
    buffer <- toArrayBuffer =<< response.body
    hash <- digestMessage buffer
    jsonData <- liftEffect $ decodeUtf8 buffer
    menuData <- either (const $ throwError $ error "Invalid JSON data") pure $ parseJson jsonData

    liftEffect $ do
      populateMainCategories menuData
      setItem "sourceHash" hash

    -- Set up the event listeners
    setupEventListeners

  `catchError` \error -> do
    consoleError "Error in main block:" error
    showErrorOverlay

setupEventListeners :: Aff Unit
setupEventListeners = do
  fileInput <- liftEffect $ getElementById "fileInput"
  addEventListener "change" (launchAff_ <<< handleFileInputChange) fileInput

  importInventoryButton <- getHtmlInputElementById "importInventory"
  _ <- addEventListener "change" (mkEffectFn1 handleInventoryFileInputChange) importInventoryButton

  clearBrowserDataButton <- getHtmlButtonElementById "clearBrowserDataButton"
  _ <- addEventListener "click" (mkEffectFn1 clearAllBrowserData) clearBrowserDataButton

  incrementButton <- getHtmlButtonElementById "increment"
  _ <- addEventListener "click" (mkEffectFn1 $ const $ changeCount 1) incrementButton

  decrementButton <- getHtmlButtonElementById "decrement"
  _ <- addEventListener "click" (mkEffectFn1 $ const $ changeCount (-1)) decrementButton

  clearListButton <- getHtmlButtonElementById "clearList"
  _ <- addEventListener "click" (mkEffectFn1 $ const $ do
    confirmResult <- confirm "Are you sure you want to clear the list?"
    when confirmResult $ do
      _ <- localStorageRemoveItem "countData"
      countListElement # innerHTML ""
      clearImportedFileHashes
  ) clearListButton

  exportCsvButton <- getHtmlButtonElementById "exportCsv"
  _ <- addEventListener "click" (mkEffectFn1 $ const $ exportListAsCSV) exportCsvButton

  exportListButton <- getHtmlButtonElementById "exportList"
  _ <- addEventListener "click" (mkEffectFn1 $ const $ exportListAsJSON) exportListButton

  importListButton <- getHtmlInputElementById "importList"
  _ <- addEventListener "change" (mkEffectFn1 handleFileInputChange) importListButton

  renameListButton <- getHtmlButtonElementById "renameList"
  _ <- addEventListener "click" (mkEffectFn1 handleRenameList) renameListButton

  savedListName <- localStorageGetItem "listName"
  case savedListName of
    Just name -> liftEffect $ HTMLElement