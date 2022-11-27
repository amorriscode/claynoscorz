import express from 'express'

const app = express()
const host = process.env.HOST || 'http://localhost'
const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`🚀 Claynoscores listening on ${host}:${port}`)
})
