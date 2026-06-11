/**
 * Vector Field Lab — SSH 公网隧道（免管理员权限）
 *
 * 使用 localhost.run 免费 SSH 反向隧道，
 * 无需防火墙放行，无需注册，手机/平板直接访问。
 *
 * 前置条件：系统已安装 OpenSSH 客户端（Windows 10+ 自带）
 *
 * 用法：
 *   node scripts/tunnel.mjs          默认 dev 模式 (port 5173)
 *   node scripts/tunnel.mjs preview  生产预览模式 (port 4173)
 *   node scripts/tunnel.mjs 3000     自定义端口
 */

import { spawn } from 'node:child_process'

const mode = process.argv[2] || 'dev'
const portMap = { dev: 5173, preview: 4173 }
const port = portMap[mode] || parseInt(mode, 10) || 5173

const label = mode === 'preview' ? '生产预览' : '开发模式'
console.log(`Vector Field Lab — SSH 隧道 (${label}, 端口 ${port})`)
console.log('正在连接 localhost.run ...')
console.log('')

// 用 127.0.0.1 而非 localhost，避免 Windows IPv6 双栈问题
const ssh = spawn('ssh', [
  '-o', 'StrictHostKeyChecking=no',
  '-o', 'UserKnownHostsFile=/dev/null',
  '-o', 'ServerAliveInterval=30',
  '-o', 'ServerAliveCountMax=3',
  '-R', `80:127.0.0.1:${port}`,
  'nokey@localhost.run',
], { stdio: 'inherit' })

ssh.on('close', (code) => {
  console.log(`\n隧道已关闭 (exit ${code})`)
})
