import previous_assignment from './assignment-3'

import { createInMemoryWarehouse } from '../adapters/inMemoryWarehouse'

const warehouse = createInMemoryWarehouse()
const orders = new Map<OrderId, Record<BookID, number>>()
let nextOrderId = 1

export type BookID = string

export interface Book {
  id?: BookID
  name: string
  author: string
  description: string
  price: number
  image: string
  stock?: number
};

export interface Filter {
  from?: number
  to?: number
  name?: string
  author?: string
};

// If multiple filters are provided, any book that matches at least one of them should be returned
// Within a single filter, a book would need to match all the given conditions
async function listBooks (filters?: Filter[]): Promise<Book[]> {
  const books = await previous_assignment.listBooks(filters)

  const booksWithStock = await Promise.all(books.map(async (book) => {
    const stock = await warehouse.getTotalStock(book.id!)
    return { ...book, stock }
  }))

  return booksWithStock
}

async function createOrUpdateBook (book: Book): Promise<BookID> {
  return await previous_assignment.createOrUpdateBook(book)
}

async function removeBook (book: BookID): Promise<void> {
  await previous_assignment.removeBook(book)
}

async function lookupBookById (bookId: BookID): Promise<Book> {
  const foundBook = await previous_assignment.listBooks()
    .then(books => books.find(b => b.id === bookId))

  if (!foundBook) {
    throw new Error('Book not found')
  }

  const stockEntries = await warehouse.findBookOnShelf(bookId)
  const stock = stockEntries.reduce((sum, entry) => sum + entry.count, 0)

  return { ...foundBook, stock }
  
}

export type ShelfId = string
export type OrderId = string

async function placeBooksOnShelf (bookId: BookID, numberOfBooks: number, shelf: ShelfId): Promise<void> {
  console.log(`Placing ${numberOfBooks} copies of book ${bookId} on shelf ${shelf}`)
  
  await lookupBookById(bookId)

  await warehouse.placeBooksOnShelf(bookId, numberOfBooks, shelf)
}



async function orderBooks (order: BookID[]): Promise<{ orderId: OrderId }> {
  
  for (const bookId of order) {
    await lookupBookById(bookId)
  }

  
  const bookCounts: Record<BookID, number> = {}
  for (const id of order) {
    bookCounts[id] = (bookCounts[id] || 0) + 1
  }

  
  const orderId = `order-${nextOrderId++}`
  orders.set(orderId, bookCounts)

  return { orderId }
}

async function findBookOnShelf (bookId: BookID): Promise<Array<{ shelf: ShelfId, count: number }>> {
  return await warehouse.findBookOnShelf(bookId)
}

async function fulfilOrder (order: OrderId, booksFulfilled: Array<{ book: BookID, shelf: ShelfId, numberOfBooks: number }>): Promise<void> {
  const existing = orders.get(order)
  if (!existing) throw new Error(`Order ${order} does not exist`)

  const fulfilledCount: Record<BookID, number> = {}

  for (const entry of booksFulfilled) {
    const { book, shelf, numberOfBooks } = entry

    if (!existing[book]) {
      throw new Error(`Book ${book} was not in the order`)
    }

    
    fulfilledCount[book] = (fulfilledCount[book] || 0) + numberOfBooks
    if (fulfilledCount[book] > existing[book]) {
      throw new Error(`Too many copies of book ${book} fulfilled`)
    }

    
    const shelfEntries = await warehouse.findBookOnShelf(book)
    const shelfData = shelfEntries.find(s => s.shelf === shelf)
    if (!shelfData || shelfData.count < numberOfBooks) {
      throw new Error(`Not enough copies of book ${book} on shelf ${shelf}`)
    }

    
    await warehouse.takeBooksFromShelf(book, shelf, numberOfBooks)
  }

  
  for (const book of Object.keys(fulfilledCount)) {
    existing[book] -= fulfilledCount[book]
    if (existing[book] <= 0) delete existing[book]
  }

  
  if (Object.keys(existing).length === 0) {
    orders.delete(order)
  } else {
    orders.set(order, existing)
  }
}

async function listOrders (): Promise<Array<{ orderId: OrderId, books: Record<BookID, number> }>> {
 return Array.from(orders.entries()).map(([orderId, books]) => ({
    orderId,
    books
  }))
}

const assignment = 'assignment-4'

export default {
  assignment,
  createOrUpdateBook,
  removeBook,
  listBooks,
  placeBooksOnShelf,
  orderBooks,
  findBookOnShelf,
  fulfilOrder,
  listOrders,
  lookupBookById
}
