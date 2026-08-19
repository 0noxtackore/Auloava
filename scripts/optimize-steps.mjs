import sharp from 'sharp'
import { readdir, rm } from 'node:fs/promises'
import { join } from 'node:path'

const dir = 'public/images/steps'
const files = (await readdir(dir)).filter((f) => f.endsWith('.png'))

for (const f of files) {
  const name = f.replace(/\.png$/, '')
  const input = join(dir, f)
  const output = join(dir, `${name}.webp`)
  await sharp(input)
    .rotate()
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(output)
  const { size } = await import('node:fs/promises').then((fs) => fs.stat(output))
  console.log(`${f} -> ${name}.webp (${(size / 1024).toFixed(0)} KB)`)
  await rm(input)
}
console.log('done')
