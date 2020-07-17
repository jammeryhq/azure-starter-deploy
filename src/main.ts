import * as core from '@actions/core'
import { BlobServiceClient } from '@azure/storage-blob'
import fs from 'fs'
import { read } from 'readdir'

async function run (): Promise<void> {
  const AZURE_STORAGE_CONNECTION_STRING = core.getInput('connection-string')
  const AZURE_STORAGE_CONTAINER_NAME = core.getInput('container-name')

  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
  const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME)

  try {
    const { name, version } = require('package.json')
    const files = await read('.')

    const uploadPath = path => `${name}/${version}/${path}`

    for await (const path of files) {
      const blockBlobClient = containerClient.getBlockBlobClient(uploadPath(path))
      await blockBlobClient.uploadStream(fs.createReadStream(path))
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
