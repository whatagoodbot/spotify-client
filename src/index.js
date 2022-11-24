import { performance } from 'perf_hooks'
import broker from '@whatagoodbot/mqtt'
import controllers from './controllers/index.js'
import { logger, metrics } from '@whatagoodbot/utilities'
import SpotifyClient from './lib/spotify.js'

const spotify = new SpotifyClient(process.env.API_KEY_SPOTIFY, process.env.API_SECRET_SPOTIFY)
const topicPrefix = `${process.env.NODE_ENV}/`

const subscribe = () => {
  Object.keys(controllers).forEach((topic) => {
    broker.client.subscribe(`${topicPrefix}${topic}`, (err) => {
      logger.info(`Subscribed to ${topicPrefix}${topic}`)
      if (err) {
        logger.error(error)
        logger.debug({ topic })
      }
    })
  })
}

if (broker.client.connected) {
  subscribe()
} else {
  broker.client.on('connect', subscribe)
}

broker.client.on('error', (err) => {
  logger.error(error)
})

broker.client.on('message', async (fullTopic, data) => {
  const functionName = 'receivedMessage'
  const startTime = performance.now()
  const topic = fullTopic.substring(topicPrefix.length)
  logger.debug({ event: functionName, topic })

  let requestPayload
  try {
    requestPayload = JSON.parse(data.toString())
    const validatedRequest = broker[topic].validate(requestPayload)
    if (validatedRequest.errors) throw { message: validatedRequest.errors } // eslint-disable-line
    const processedResponses = await controllers[topic](requestPayload, spotify)
    if (!processedResponses || !processedResponses.length) return
    for (const current in processedResponses) {
      const processedResponse = processedResponses[current]
      const validatedResponse = broker[processedResponse.topic].validate({
        ...validatedRequest,
        ...processedResponse.payload
      })
      if (validatedResponse.errors) throw { message: validatedResponse.errors } // eslint-disable-line
      if (processedResponse.topic && !process.env.FULLDEBUG) {
        logger.debug({ event: 'Publishing', topic: processedResponse.topic })
        broker.client.publish(`${topicPrefix}${processedResponse.topic}`, JSON.stringify(validatedResponse))
      }
    }
    metrics.trackExecution(functionName, 'mqtt', performance.now() - startTime, true, { topic })
  } catch (error) {
    logger.error(error)
    logger.debug({ topic, requestPayload })
  }
})