import { describe, it, expect } from 'vitest'
import { createInMemoryWarehouse } from '../adapters/inMemoryWarehouse'

describe('InMemoryWarehouse', () => {
  it('can place and retrieve books from shelves', async () => {
    const warehouse = createInMemoryWarehouse()
    await warehouse.placeBooksOnShelf('book-1', 5, 'shelf-A')
    await warehouse.placeBooksOnShelf('book-1', 3, 'shelf-B')

    const shelves = await warehouse.findBookOnShelf('book-1')
    expect(shelves).toEqual([
      { shelf: 'shelf-A', count: 5 },
      { shelf: 'shelf-B', count: 3 }
    ])

    const total = await warehouse.getTotalStock('book-1')
    expect(total).toBe(8)
  })
})