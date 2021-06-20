import express from 'express';
import * as fs from 'fs';

const data_dir = "../data/"

const current_game_time = data_dir + "current-game-time"
const current_players_file = data_dir + "current-players"
const current_pot_file = data_dir + "current-pot"

const last_players_file = data_dir + "last-players"
const last_pot_file = data_dir + "last-pot"
const last_winners_file = data_dir + "last-winners"
const last_winning_number_file = data_dir + "last-winning-number"

const app = express();
const port = 3000;

function readFile(path: string): string {
  return fs.readFileSync(path,'utf8');
}

function getCurrentPot(): number {
  return Number(readFile(current_pot_file))
}

function getCurrentPlayers(): string[] {
  return JSON.parse(readFile(current_players_file))
}

function getCurrentGameStart(): number {
  return Number(readFile(current_game_time))
}

function getLastPlayers(): any {
  return JSON.parse(readFile(last_players_file))
}

function getLastWinners(): string[] {
  return JSON.parse(readFile(last_winners_file))
}

function getLastPot(): number {
  return Number(BigInt(readFile(last_pot_file)) / BigInt('100000000000000000000000000000')))
}

function getLastWinningNumber(): number {
  return Number(readFile(last_winning_number_file))
}

app.get('/api/current/pot', (req, res) => {
  res.send(getCurrentPot().toString());
});

app.get('/api/current/players', (req, res) => {
  res.send(getCurrentPlayers());
});

app.get('/api/current/game-start', (req, res) => {
  res.send(getCurrentGameStart().toString());
});

app.get('/api/last/players', (req, res) => {
  res.send(getLastPlayers());
});

app.get('/api/last/winners', (req, res) => {
  res.send(getLastWinners());
});

app.get('/api/last/pot', (req, res) => {
  res.send(getLastPot().toString());
});

app.get('/api/last/winning-number', (req, res) => {
  res.send(getLastWinningNumber().toString());
});

app.listen(port, () => {
  console.log(`server is listening on ${port}`);
});
