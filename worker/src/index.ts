import express from 'express'
import dotenv from 'dotenv'
import { startJobPoller } from './jobs/poller'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start the server
app.listen(PORT, () => {
  console.log(`Worker server running on port ${PORT}`)

  // Start job poller
  startJobPoller()
})
