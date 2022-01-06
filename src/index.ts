import express from "express"
const port = process.env.PORT || 3000
const app = express()

import { setupWebSocket } from "./websocket"
import cors from "cors"
import http from "http"

const server = new http.Server(app)

setupWebSocket(server)

app.use(cors())
app.use(express.json())

server.listen(port, () => console.log(`Listening on PORT ${port}`))
