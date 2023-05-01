module Main where

import Prelude
import Control.Monad.Except (ExceptT, runExceptT)
import DOM (DOM)
import DOM.HTML (window)
import DOM.HTML.Window (document)
import DOM.Node.Types (HTMLElement, HTMLButtonElement, HTMLInputElement, HTMLParagraphElement, HTMLSelectElement, HTMLTableElement)
import Web.HTML.HTMLDocument (getElementById)
import Web.HTML.HTMLElement (textContent)
import Web.HTML.HTMLInputElement (checked, files)
import Web.HTML.HTMLSelectElement (value)
import Web.HTML.Window (alert, prompt)

foreign import getVisitorId_ :: Effect String
getVisitorId :: forall eff. Eff (dom :: DOM | eff) String
getVisitorId = runEffectFn1 getVisitorId_

main :: forall eff. Eff (dom :: DOM | eff) Unit
main = do
  window >>= document >>= \doc -> do
    mainCategoryElement <- getElementById "mainCategory" doc >>= assertElementIs HTMLSelectElement
    subCategoryElement <- getElementById "subCategory" doc >>= assertElementIs HTMLSelectElement
    itemElement <- getElementById "item" doc >>= assertElementIs HTMLSelectElement
    countListElement <- getElementById "countList" doc >>= assertElementIs HTMLTableElement
    countInputElement <- getElementById "countInput" doc >>= assertElementIs HTMLInputElement
    messageElement <- getElementById "statusMessage" doc >>= assertElementIs HTMLParagraphElement
    renameListButton <- getElementById "renameList" doc >>= assertElementIs HTMLButtonElement

    let
      selectedMainCategory :: Maybe String
      selectedMainCategory = Nothing
      selectedSubCategory :: Maybe String
      selectedSubCategory = Nothing
      selectedItem :: Maybe String
      selectedItem = Nothing

    listNameElement <- getElementById "listName" doc >>= assertElementIs HTMLElement
    listNameInputElement <- getElementById "listNameInput" doc >>= assertElementIs HTMLInputElement

    importInventoryButton <- getElementById "importInventory" doc >>= assertElementIs HTMLInputElement
    _ <- importInventoryButton `on` change $ handleInventoryFileInputChange

    clearBrowserDataButton <- getElementById "clearBrowserDataButton" doc >>= assertElementIs HTMLButtonElement
    _ <- clearBrowserDataButton `on` click $ clearAllBrowserData

    incrementButton <- getElementById "increment" doc >>= assertElementIs HTMLButtonElement
    _ <- incrementButton `on` click $ changeCount 1

    decrementButton <- getElementById "decrement" doc >>= assertElementIs HTMLButtonElement
    _ <- decrementButton `on` click $ changeCount (-1)

    clearListButton <- getElementById "clearList" doc >>= assertElementIs HTMLButtonElement
    _ <- clearListButton `on` click $ do
      confirmResult <- confirm "Are you sure you want to clear the list?"
      when confirmResult $ do
        _ <- localStorageRemoveItem "countData"
        countListElement # setInnerHTML ""
        clearImportedFileHashes

    exportCsvButton <- getElementById "exportCsv" doc >>= assertElementIs HTMLButtonElement
    _ <- exportCsvButton `on` click $ exportListAsCSV

    exportListButton <- getElementById "exportList" doc >>= assertElementIs HTMLButtonElement
    _ <- exportListButton `on` click $ exportListAsJSON

    importListButton <- getElementById "importList" doc >>= assertElementIs HTMLInputElement
    _ <- importListButton `on` change $ handleFileInputChange

    savedListName <- localStorageGetItem "listName"
    case savedListName of
      Just name -> textContent list
