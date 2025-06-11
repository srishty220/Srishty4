import { MongoMemoryServer } from 'mongodb-memory-server'

export default async () => {
  const instance = await MongoMemoryServer.create({ binary: { version: '7.0.7' } })
  while (instance.state === 'new') await instance.start()

  const uri = instance.getUri()
  ;(global as any).__MONGOINSTANCE = instance
  ;(global as any).MONGO_URI = uri.slice(0, uri.lastIndexOf('/'))
}
