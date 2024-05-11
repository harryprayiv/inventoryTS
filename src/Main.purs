module Data.Inventory where

import Prelude

-- import Foreign.Class (class Decode, class Encode)
import Foreign.Generic 
import Data.Generic.Rep (class Generic)
import Data.Maybe (Maybe)
import Foreign (ForeignError)


-- import Foreign.Generic.Class  (class Decode, class Encode)
-- import Data.Foreign.Generic (defaultOptions, genericDecode, genericEncode, defaultOptions)


type Tag = String

data Item = Item
  { description :: String
  , quantity :: Int
  , tags :: Array Tag
  , images :: Array String
  }

derive instance genericItem :: Generic Item _
instance encodeItem :: Encode Item where
  encode = genericEncode defaultOptions
instance decodeItem :: Decode Item where
  decode = genericDecode defaultOptions

data Container = Container
  { id :: String
  , name :: String
  , tags :: Array Tag
  , items :: Array Item
  , images :: Array String
  }

derive instance genericContainer :: Generic Container _
instance encodeContainer :: Encode Container where
  encode = genericEncode defaultOptions
instance decodeContainer :: Decode Container where
  decode = genericDecode defaultOptions

type Inventory = Array Container
