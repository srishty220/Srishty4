import { MongoClient, Db, Collection } from 'mongodb'
import type { BookID, ShelfId } from '../adapter/assignment-4'

export interface WarehouseBook {
  bookId: BookID
  shelf: ShelfId
  count: number
}

export interface MongoWarehouse {
  placeBooksOnShelf: (bookId: BookID, numberOfBooks: number, shelf: ShelfId) => Promise<void>
  takeBooksFromShelf: (bookId: BookID, shelf: ShelfId, numberOfBooks: number) => Promise<void>
  findBookOnShelf: (bookId: BookID) => Promise<Array<{ shelf: ShelfId, count: number }>>
  getTotalStock: (bookId: BookID) => Promise<number>
}

export function createMongoWarehouse(db: Db): MongoWarehouse {
  const collection: Collection<WarehouseBook> = db.collection('warehouse_books')

  return {
    async placeBooksOnShelf(bookId, numberOfBooks, shelf) {
      const existing = await collection.findOne({ bookId, shelf })

      if (existing) {
        await collection.updateOne(
          { bookId, shelf },
          { $inc: { count: numberOfBooks } }
        )
      } else {
        await collection.insertOne({ bookId, shelf, count: numberOfBooks })
      }
    },

    async takeBooksFromShelf(bookId, shelf, numberOfBooks) {
      const existing = await collection.findOne({ bookId, shelf })
      if (!existing || existing.count < numberOfBooks) {
        throw new Error('Not enough books on shelf')
      }

      await collection.updateOne(
        { bookId, shelf },
        { $inc: { count: -numberOfBooks } }
      )
    },

    async findBookOnShelf(bookId) {
      const results = await collection.find({ bookId }).toArray()
      return results.map(({ shelf, count }) => ({ shelf, count }))
    },

    async getTotalStock(bookId) {
      const results = await collection.aggregate([
        { $match: { bookId } },
        { $group: { _id: null, total: { $sum: '$count' } } }
      ]).toArray()

      return results[0]?.total ?? 0
    }
  }
}
