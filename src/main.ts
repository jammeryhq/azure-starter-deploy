import * as core from '@actions/core'
import fs from 'fs'
import got from 'got'
import pMap from 'p-map'
import { BlobServiceClient } from '@azure/storage-blob'
import { read } from 'readdir'

async function run (): Promise<void> {
  try {
    const AZURE_STORAGE_CONNECTION_STRING = core.getInput('connection-string')
    const AZURE_STORAGE_CONTAINER_NAME = core.getInput('container-name')
    const GRAPHQL_API_ENDPOINT = core.getInput('graphql-endpoint')
    const GRAPHQL_API_SECRET = core.getInput('graphql-secret')

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING)
    const containerClient = blobServiceClient.getContainerClient(AZURE_STORAGE_CONTAINER_NAME)

    const graphql = got.extend({
      headers: { 'x-hasura-admin-secret': GRAPHQL_API_SECRET },
      resolveBodyOnly: true,
      responseType: 'json'
    })

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

    // Now update Hasura to set the latest versions
    const query = `mutation InsertStartersVersions ($payload: starters_versions_insert_input!) {
      insertStartersVersion (object: $payload, on_conflict: { constraint: starters_versions_pkey, update_columns: updatedAt }) {
        id
      }
    }`
    const variables = { payload: { name, version } }
    const { errors } = await graphql.post(GRAPHQL_API_ENDPOINT, { json: { query, variables }, resolveBodyOnly: true, responseType: 'json' })
    if (errors) throw new Error(errors[ 0 ].message)
  } catch (error) {
    core.setFailed(error.message)
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
