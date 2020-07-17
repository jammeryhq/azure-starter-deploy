import * as core from '@actions/core'
import { BlobServiceClient } from '@azure/storage-blob'
import fs from 'fs/promises'
import { read } from 'readdir'

const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING as string
const AZURE_STORAGE_CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_STARTERS as string

async function run (): Promise<void> {
  // const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
  // const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME)
  // const blockBlobClient = containerClient.getBlockBlobClient('some')

  try {
    core.debug(process.env.AZURE_STORAGE_CONTAINER_NAME as string)
    const files = await read('.', ['*'])
    core.debug(JSON.stringify(files))

    core.debug(new Date().toTimeString())
    core.debug(new Date().toTimeString())

    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    core.setFailed(error.message)
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
