import { cp, mkdir, readdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const distDir = path.join(root, 'dist')
const targetDir = path.join(root, 'harmonyos', 'entry', 'src', 'main', 'resources', 'rawfile', 'web')

if (!existsSync(distDir)) {
  throw new Error(`Missing dist directory: ${distDir}. Run npm run build first.`)
}

await mkdir(targetDir, { recursive: true })

for (const entry of await readdir(targetDir)) {
  if (entry === '.gitkeep') continue
  await rm(path.join(targetDir, entry), { recursive: true, force: true })
}

await cp(distDir, targetDir, { recursive: true })

console.log(`Synced Vite build into HarmonyOS rawfile web assets:\n${targetDir}`)
