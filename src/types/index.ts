export type Icon = "X" | "O" | null
export interface Player {
  nickname: string
  icon: Icon
}
export interface Game {
  room: string
  turn: string
  players: Player[]
  winner: Player | null
  draw: boolean
  history: Icon[]
  status: string
  board: (null | string)[]
}
export type Movement = {
  pos: number
  room: string
  nickname: string
}
