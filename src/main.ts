import * as core from '@actions/core'
import { wait } from './wait'

async function run (): Promise<void> {
  try {
    const ms: string = core.getInput('milliseconds')
    core.debug(`Waiting ${ms} milliseconds ...`)
    const connectionString = core.getInput('connection-string')
    core.debug(`Connection String: ${connectionString}`)

    core.debug(new Date().toTimeString())
    await wait(parseInt(ms, 10))
    core.debug(new Date().toTimeString())

    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    core.setFailed(error.message)
  }
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
run()
