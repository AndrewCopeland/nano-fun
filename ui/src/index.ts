import express from 'express';
import * as fs from 'fs';

const data_dir = "../data/"
const winners_file = data_dir + "winners"
const winning_number_file = data_dir + "winning-number"
const game_time = data_dir + "game-time"
const players_file = data_dir + "players"


const app = express();
const port = 3000;

function readFile(path: string): string {
  return fs.readFileSync(path,'utf8');
}

function getWinners(): string {
  return readFile(winners_file);
}

function getWinningNumber(): number {
  return Number(readFile(winning_number_file));
}

function getGameTime(): string {
  return readFile(game_time);
}

function getCurrentPlayers(): string[] {
  return JSON.parse(readFile(players_file))
}



app.get('/', (req, res) => {
  var winners = getWinners()
  var winningNumber = getWinningNumber()
  var time = getGameTime()
  var result = `
  <html>
    <body>
    <h1>The Bananumber Game</h1>
    <h3>Winning Number: ${winningNumber}</h3>
    <h3>Winners: ${winners}</h3>
    <h3 id="time">${time}</h3>
    </body>
    <script>
      var obj = document.getElementById("time")
      var date = new Date(0);
      var epoch = Number(obj.innerText);
      date.setUTCSeconds(epoch);
      obj.innerText = "Date Played: " + date.toString();
    </script>
  </html>
  `
  res.send(result);
});

app.get('/api/current/players', (req, res) => {
  res.send(getCurrentPlayers());
});

app.get('/api/last/winners', (req, res) => {
  res.send(getWinners());
});

app.get('/api/last/winning-number', (req, res) => {
  res.send(getWinningNumber());
});


app.get('/api/last/game-time', (req, res) => {
  res.send(getGameTime());
});

app.listen(port, () => {
  console.log(`server is listening on ${port}`);
});
