import { BookID, ShelfId } from './assignment-4'

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

export function createInMemoryWarehouse(): WarehousePort {
  const shelves: Map<BookID, Map<ShelfId, number>> = new Map()

  return {
    async placeBooksOnShelf(bookId, number, shelf) {
      if (!shelves.has(bookId)) {
        shelves.set(bookId, new Map())
      }
      const shelfMap = shelves.get(bookId)!
      shelfMap.set(shelf, (shelfMap.get(shelf) || 0) + number)
    },

    async findBookOnShelf(bookId) {
      const shelfMap = shelves.get(bookId)
      if (!shelfMap) return []
      return [...shelfMap.entries()].map(([shelf, count]) => ({ shelf, count }))
    },

    async getTotalStock(bookId) {
      const shelfMap = shelves.get(bookId)
      if (!shelfMap) return 0
      return [...shelfMap.values()].reduce((sum, c) => sum + c, 0)
    },

    async takeBooksFromShelf(bookId, shelf, number) {
      const shelfMap = shelves.get(bookId)
      if (!shelfMap || !shelfMap.has(shelf)) throw new Error('Shelf not found')
      const current = shelfMap.get(shelf)!
      if (current < number) throw new Error('Not enough books on shelf')
      if (current === number) {
        shelfMap.delete(shelf)
      } else {
        shelfMap.set(shelf, current - number)
      }
    }
  }
}
  