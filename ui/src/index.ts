import express from 'express';
import * as fs from 'fs';

const data_dir = "../data/"
const winners_file = data_dir + "winners"
const winning_number_file = data_dir + "winning-number"
const game_number_file = data_dir + "game-number"


const app = express();
const port = 3000;

function getWinners(): string {
  return fs.readFileSync(winners_file,'utf8');
}

function getWinningNumber(): number {
  return Number(fs.readFileSync(winning_number_file,'utf8'));
}

app.get('/', (req, res) => {
  var winners = getWinners()
  var winningNumber = getWinningNumber()
  res.send(`The Bananumber Game\n  Winning Number: ${winningNumber}\n  Winners: ${winners}`);
});

app.listen(port, () => {
  console.log(`server is listening on ${port}`);
});
