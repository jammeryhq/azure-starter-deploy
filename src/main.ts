import * as core from '@actions/core'
import fs from 'fs'
import fetch from 'node-fetch'
import pMap from 'p-map'
import { BlobServiceClient } from '@azure/storage-blob'
import { read } from 'readdir'

async function run (): Promise<void> {
  try {
    const AZURE_STORAGE_CONNECTION_STRING = core.getInput('connection-string')
    const AZURE_STORAGE_CONTAINER_NAME = core.getInput('container-name')
    const API_ENDPOINT = core.getInput('api-endpoint')
    const API_SECRET = core.getInput('api-secret')

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME)

    const { name, version }: { name: string, version: string } = JSON.parse(fs.readFileSync('.jammeryhq/config.json', 'utf8'))
    if (!name || !version) throw new Error('Missing either name or version.')

    const starterFiles = await read('.')
    await pMap(starterFiles, async path => {
      const blockBlobClient = containerClient.getBlockBlobClient(`${name}/${version}/starter/${path}`)
      await blockBlobClient.uploadStream(fs.createReadStream(path))
    })

    const jammeryFiles = await read('.jammeryhq')
    await pMap(jammeryFiles, async path => {
      const blockBlobClient = containerClient.getBlockBlobClient(`${name}/${version}/jam/${path}`)
      await blockBlobClient.uploadStream(fs.createReadStream(`.jammeryhq/${path}`))
    })

    // Now update the DB version
    const response = await fetch(`${API_ENDPOINT}/v1/starters/version`, {
      method: 'POST',
      headers: { 'x-api-authorization': API_SECRET },
      body: JSON.stringify({ name, version })
    })

    if (!response.ok) throw new Error(await response.text())
  } catch (error) {
    core.setFailed(error.message)
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
