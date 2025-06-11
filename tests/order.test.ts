import { describe, it, expect } from 'vitest'
import { createInMemoryWarehouse } from '../adapters/inMemoryWarehouse'

const warehouse = createInMemoryWarehouse()

const orders = new Map()
let orderCount = 1

const assignment4 = {
  async placeBooksOnShelf(bookId: string, number: number, shelf: string) {
    await warehouse.placeBooksOnShelf(bookId, number, shelf)
  },

  async findBookOnShelf(bookId: string) {
    return warehouse.findBookOnShelf(bookId)
  },

  async getTotalStock(bookId: string) {
    return warehouse.getTotalStock(bookId)
  },

  async takeBooksFromShelf(bookId: string, shelf: string, number: number) {
    return warehouse.takeBooksFromShelf(bookId, shelf, number)
  },

  async lookupBookById(bookId: string) {
    if (!bookId.startsWith('book-')) throw new Error('Invalid book ID')
    return {
      id: bookId,
      name: 'Mock Book',
      author: 'Mock Author',
      description: 'Mock description',
      price: 10,
      image: ''
    }
  },

  async orderBooks(order: string[]) {
    for (const bookId of order) await assignment4.lookupBookById(bookId)

    const counts: Record<string, number> = {}
    for (const id of order) counts[id] = (counts[id] || 0) + 1

    const orderId = `order-${orderCount++}`
    orders.set(orderId, counts)

    return { orderId }
  },

  async listOrders() {
    return Array.from(orders.entries()).map(([orderId, books]) => ({
      orderId,
      books
    }))
  },

  async fulfilOrder(orderId: string, booksFulfilled: Array<{ book: string, shelf: string, numberOfBooks: number }>) {
    const order = orders.get(orderId)
    if (!order) throw new Error('Order does not exist')

    const fulfilled: Record<string, number> = {}

    for (const { book, shelf, numberOfBooks } of booksFulfilled) {
      if (!order[book]) throw new Error('Book not in order')
      fulfilled[book] = (fulfilled[book] || 0) + numberOfBooks
      if (fulfilled[book] > order[book]) throw new Error('Too many fulfilled')

      const shelfInfo = await warehouse.findBookOnShelf(book)
      const shelfEntry = shelfInfo.find(s => s.shelf === shelf)
      if (!shelfEntry || shelfEntry.count < numberOfBooks)
        throw new Error('Not enough on shelf')

      await warehouse.takeBooksFromShelf(book, shelf, numberOfBooks)
    }

    for (const book of Object.keys(fulfilled)) {
      order[book] -= fulfilled[book]
      if (order[book] <= 0) delete order[book]
    }

    if (Object.keys(order).length === 0) {
      orders.delete(orderId)
    } else {
      orders.set(orderId, order)
    }
  }
}

describe('Order system', () => {
  it('creates and returns a new order ID', async () => {
    const result = await assignment4.orderBooks(['book-1', 'book-1', 'book-2'])

    expect(result).toHaveProperty('orderId')
    const ordersList = await assignment4.listOrders()

    expect(ordersList.length).toBeGreaterThan(0)
    expect(ordersList[0].books).toEqual({ 'book-1': 2, 'book-2': 1 })
  })

  it('fulfils an order completely', async () => {
    await assignment4.placeBooksOnShelf('book-1', 5, 'shelf-X')
    await assignment4.placeBooksOnShelf('book-2', 3, 'shelf-Y')

    const { orderId } = await assignment4.orderBooks(['book-1', 'book-2'])

    await assignment4.fulfilOrder(orderId, [
      { book: 'book-1', shelf: 'shelf-X', numberOfBooks: 1 },
      { book: 'book-2', shelf: 'shelf-Y', numberOfBooks: 1 }
    ])

    const ordersList = await assignment4.listOrders()
    expect(ordersList.find(o => o.orderId === orderId)).toBeUndefined()
  })

  it('removes the order when fully fulfilled', async () => {
    await assignment4.placeBooksOnShelf('book-3', 2, 'A')
    const { orderId } = await assignment4.orderBooks(['book-3', 'book-3'])

    await assignment4.fulfilOrder(orderId, [
      { book: 'book-3', shelf: 'A', numberOfBooks: 2 }
    ])

    const ordersList = await assignment4.listOrders()
    const found = ordersList.find(o => o.orderId === orderId)
    expect(found).toBeUndefined()
  })
})
