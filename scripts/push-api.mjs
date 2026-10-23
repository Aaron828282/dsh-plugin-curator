#!/usr/bin/env node
/**
 * Push the working tree to GitHub through the REST API.
 *
 * Why this exists: git push needs github.com:443, which is intermittently
 * unreachable from this network (300 s timeouts, connection resets), while
 * api.github.com keeps working. This uploads blobs, builds a tree and moves
 * refs/heads/main — same result, different transport.
 *
 * Token: $GITHUB_TOKEN, else ~/.dsh/secrets/github.token (last line).
 * Usage: node scripts/push-api.mjs [remote=origin] [branch=main]
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import https from 'node:https'

const [, , remoteName = 'origin', branch = 'main'] = process.argv
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()

function token() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN.trim()
  const file = join(homedir(), '.dsh', 'secrets', 'github.token')
  return readFileSync(file, 'utf8').trim().split(/\r?\n/).pop()
}

function api(method, url, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null
    const req = https.request(url, {
      method,
      headers: {
        Authorization: 'Bearer ' + token(),
        Accept: 'application/vnd.github+json',
        'User-Agent': 'dsh-plugin-curator',
        ...(data ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      timeout: 60000,
    }, (res) => {
      let text = ''
      res.on('data', (chunk) => { text += chunk })
      res.on('end', () => {
        let parsed = null
        try { parsed = JSON.parse(text) } catch {}
        resolve({ status: res.statusCode, body: parsed, text })
      })
    })
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}

function tracked(root) {
  return execFileSync('git', ['-C', root, 'ls-files'], { encoding: 'utf8' })
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
}

const remote = execFileSync('git', ['-C', root, 'remote', 'get-url', remoteName], { encoding: 'utf8' }).trim()
const match = /github\.com[/:]([^/]+)\/([^/]+?)(?:\.git)?$/.exec(remote)
if (match === null) throw new Error('not a GitHub remote: ' + remote)
const [, owner, repo] = match
const base = 'https://api.github.com/repos/' + owner + '/' + repo

const ref = await api('GET', base + '/git/ref/heads/' + branch)
const headSha = ref.status === 200 ? ref.body.object.sha : null
let baseTree = null
if (headSha !== null) {
  const headCommit = await api('GET', base + '/git/commits/' + headSha)
  baseTree = headCommit.body.tree.sha
}

const tree = []
for (const file of tracked(root)) {
  const content = readFileSync(join(root, file))
  const blob = await api('POST', base + '/git/blobs', { content: content.toString('base64'), encoding: 'base64' })
  if (blob.status !== 201) throw new Error('blob failed: ' + file + ' ' + blob.status)
  tree.push({ path: file, mode: '100644', type: 'blob', sha: blob.body.sha })
}

const newTree = await api('POST', base + '/git/trees', { ...(baseTree ? { base_tree: baseTree } : {}), tree })
if (newTree.status !== 201) throw new Error('tree failed: ' + newTree.text.slice(0, 160))

const message = execFileSync('git', ['-C', root, 'log', '-1', '--format=%B'], { encoding: 'utf8' }).trim()
const parents = headSha === null ? [] : [headSha]
const commit = await api('POST', base + '/git/commits', { message, tree: newTree.body.sha, parents })
if (commit.status !== 201) throw new Error('commit failed: ' + commit.text.slice(0, 160))

if (headSha === null) {
  const created = await api('POST', base + '/git/refs', { ref: 'refs/heads/' + branch, sha: commit.body.sha })
  if (created.status !== 201) throw new Error('ref create failed: ' + created.text.slice(0, 160))
} else {
  const moved = await api('PATCH', base + '/git/refs/heads/' + branch, { sha: commit.body.sha, force: false })
  if (moved.status !== 200) throw new Error('ref update failed: ' + moved.text.slice(0, 160))
}

console.log('pushed ' + commit.body.sha.slice(0, 7) + ' -> ' + owner + '/' + repo + '#' + branch)
