import * as core from '@actions/core'
import fs from 'fs'
import got from 'got'
import { BlobServiceClient } from '@azure/storage-blob'
import { read } from 'readdir'

async function run (): Promise<void> {
  const AZURE_STORAGE_CONNECTION_STRING = core.getInput('connection-string')
  const AZURE_STORAGE_CONTAINER_NAME = core.getInput('container-name')
  const GRAPHQL_API_ENDPOINT = core.getInput('graphql-endpoint')
  const GRAPHQL_API_SECRET = core.getInput('graphql-secret')

  const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
  const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME)

  const graphql = got.extend({
    prefixUrl: GRAPHQL_API_ENDPOINT,
    headers: { Authorization: `Bearer ${GRAPHQL_API_SECRET}` },
    resolveBodyOnly: true,
    responseType: 'json'
  })

  try {
    const { name, version }: { name: string, version: string } = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    if (!name || !version) throw new Error('Missing either name or version.')

    const files = await read('.')

    const uploadPath = (path: string): string => `${name}/${version}/${path}`

    for await (const path of files) {
      const blockBlobClient = containerClient.getBlockBlobClient(uploadPath(path))
      await blockBlobClient.uploadStream(fs.createReadStream(path))
    }

    // Now update Hasura to set the latest versions
    const query = `mutation InsertStartersVersions ($payload: starters_versions_insert_input!) {
      insertStartersVersion (object: $payload) {
        id
      }
    }`
    const variables = { payload: { name, version } }
    await graphql.post('v1/graphql', { json: { query, variables } })
  } catch (error) {
    core.setFailed(error.message)
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
