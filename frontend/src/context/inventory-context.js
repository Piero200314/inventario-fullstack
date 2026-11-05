import {createContext, useContext} from "react";
export const InventoryContext = createContext(null);
export const useInventory = () => useContext(InventoryContext);
