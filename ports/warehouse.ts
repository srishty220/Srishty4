import { BookID } from '../adapter/assignment-4'

export type ShelfId = string

export interface ShelfEntry {
  shelf: ShelfId
  count: number
}

export interface WarehousePort {
  placeBooksOnShelf(bookId: BookID, number: number, shelf: ShelfId): Promise<void>
  findBookOnShelf(bookId: BookID): Promise<ShelfEntry[]>
  getTotalStock(bookId: BookID): Promise<number>
  takeBooksFromShelf(bookId: BookID, shelf: ShelfId, number: number): Promise<void>
}
