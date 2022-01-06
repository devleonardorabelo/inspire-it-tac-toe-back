import http from "http"
import { Server } from "socket.io"
import { FINISH_TEMPLATE } from "./constants"
import { Game, Icon, Movement, Player } from "./types"

let DB: Game[] = []

const checkHasWinner = (game: Game): Player | null => {
  for (let i = 0; i < FINISH_TEMPLATE.length; i++) {
    const [a, b, c] = FINISH_TEMPLATE[i]
    if (
      game.board[a] &&
      game.board[a] === game.board[b] &&
      game.board[a] === game.board[c]
    ) {
      const player = game.players.find(
        (player) => player.icon === game.board[a]
      )
      if (player) return player
      else return null
    }
  }
  return null
}

const checkIsDraw = (game: Game) => {
  return game.board.every(Boolean)
}

const nextTurn = (game: Game) => {
  return game.board.filter(Boolean).length % 2 === 0
    ? game.players[1]
    : game.players[0]
}

export const setupWebSocket = (server: http.Server) => {
  const io = new Server(server, { cors: { origin: "*" } })
  io.on("connection", (socket) => {
    socket.on("move", (data: Movement) => {
      const roomIndex = DB.findIndex((e) => e.room === data.room)
      if (roomIndex !== -1) {
        if (
          DB[roomIndex].winner ||
          DB[roomIndex].players.length !== 2 ||
          DB[roomIndex].board[data.pos] !== null
        )
          return
        const player = DB[roomIndex].players.find(
          (e) => e.nickname === data.nickname
        )
        const nextPlayer = nextTurn(DB[roomIndex])
        if (!player?.nickname || nextPlayer?.nickname === player?.nickname)
          return
        DB[roomIndex].board[data.pos] = player.icon
        const isDraw = checkIsDraw(DB[roomIndex])
        const hasWinner = checkHasWinner(DB[roomIndex])
        if (isDraw) DB[roomIndex].history.push(null)
        if (hasWinner) DB[roomIndex].history.push(hasWinner.icon)
        DB[roomIndex] = {
          ...DB[roomIndex],
          turn: nextPlayer.nickname,
          winner: hasWinner ?? null,
          draw: isDraw,
        }
        return io.to(data.room).emit("board", { ...DB[roomIndex] })
      }
    })
    socket.on("enterTheRoom", (data: { room: string; nickname: string }) => {
      if (data.room) {
        const roomIndex = DB.findIndex((e) => e.room === data.room)
        let icon: Icon = "X"
        if (roomIndex !== -1) {
          const findIsPlayer = DB[roomIndex].players.find(
            (e) => e.nickname === data.nickname
          )
          if (findIsPlayer) {
            socket.join(data.room)
            io.to(data.room).emit("connection")
            return io.to(data.room).emit("board", { ...DB[roomIndex] })
          }
          if (DB[roomIndex].players.length >= 2) return
          icon = "O"
          DB[roomIndex].players.push({ nickname: data.nickname, icon })
          DB[roomIndex].status = "started"
          socket.join(data.room)
          io.to(data.room).emit("connection")
          return io.to(data.room).emit("board", { ...DB[roomIndex] })
        } else {
          const newGame: Game = {
            history: [],
            players: [{ nickname: data.nickname, icon }],
            room: data.room,
            turn: data.nickname,
            winner: null,
            status: "waiting_another_player",
            board: Array(9).fill(null),
            draw: false,
          }
          DB.push(newGame)
          socket.join(data.room)
          io.to(data.room).emit("connection")
          return io.to(data.room).emit("board", { ...newGame })
        }
      }
    })
    socket.on("restart", (room: string) => {
      const roomIndex = DB.findIndex((e) => e.room === room)
      if (roomIndex !== -1) {
        DB[roomIndex] = {
          ...DB[roomIndex],
          draw: false,
          status: "started",
          board: Array(9).fill(null),
          winner: null,
        }
        return io.to(room).emit("board", { ...DB[roomIndex] })
      }
    })
  })
}
