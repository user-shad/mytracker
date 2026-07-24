import { buildDemoData, demoLoginSummary } from '../src/lib/demoData.ts'
import { loadStore, saveStore } from './store.ts'

const seeded = buildDemoData(loadStore())
saveStore(seeded)

console.log('Demo data loaded on server.\n')
console.log(demoLoginSummary())
