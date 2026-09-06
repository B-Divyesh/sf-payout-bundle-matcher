import { spawn } from 'node:child_process'

function run(command, args, env = process.env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: process.cwd(), env, stdio: 'inherit' })
    child.on('error', reject)
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited with ${code}`)))
  })
}

let preview
try {
  if (!process.env.BASE_URL) {
    preview = spawn(process.execPath, ['.factory/preview.mjs'], { cwd: process.cwd(), stdio: 'inherit' })
    for (let attempt = 0; attempt < 40; attempt += 1) {
      try {
        const response = await fetch('http://127.0.0.1:4173/')
        if (response.ok) break
      } catch { /* wait for preview */ }
      await new Promise(resolve => setTimeout(resolve, 100))
      if (attempt === 39) throw new Error('Factory preview did not start.')
    }
  }
  await run(process.execPath, ['.factory/evidence/e2e.mjs'])
  await run(process.execPath, ['.factory/evidence/pwa-update.mjs'])
} finally {
  preview?.kill('SIGTERM')
}
