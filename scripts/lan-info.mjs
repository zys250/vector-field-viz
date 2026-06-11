import os from 'node:os'

const mode = process.argv.includes('--preview') ? 'preview' : 'dev'
const portIndex = process.argv.indexOf('--port')
const port = portIndex >= 0 ? process.argv[portIndex + 1] : mode === 'preview' ? '4173' : '5173'

const addresses = Object.values(os.networkInterfaces())
  .flat()
  .filter((item) => item && item.family === 'IPv4' && !item.internal)
  .map((item) => item.address)

console.log(`Vector Field Lab ${mode} share links`)
console.log(`Local:   http://127.0.0.1:${port}/`)

if (addresses.length === 0) {
  console.log('LAN:     No active IPv4 LAN address found.')
  console.log('Tip:     Connect this computer and the tablet to the same Wi-Fi, then run again.')
} else {
  for (const address of addresses) {
    console.log(`LAN:     http://${address}:${port}/`)
  }
}

console.log('')
console.log(`Start server: npm run ${mode === 'preview' ? 'preview:lan' : 'dev:lan'}`)
console.log('Note: allow Node/Vite through Windows Firewall when prompted.')
