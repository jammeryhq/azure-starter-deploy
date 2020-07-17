import * as core from '@actions/core'
import { BlobServiceClient } from '@azure/storage-blob'
import fs from 'fs/promises'
import { read } from 'readdir'

async function run (): Promise<void> {
  const AZURE_STORAGE_CONNECTION_STRING = core.getInput('connection-string')
  const AZURE_STORAGE_CONTAINER_NAME = core.getInput('container-name')

  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
  const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME)

  try {
    console.log(AZURE_STORAGE_CONNECTION_STRING, AZURE_STORAGE_CONTAINER_NAME)
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
