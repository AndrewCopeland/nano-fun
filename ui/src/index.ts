import express from 'express';
import * as fs from 'fs';

const data_dir = "../data/"
const winners_file = data_dir + "winners"
const winning_number_file = data_dir + "winning-number"
const game_time = data_dir + "game-time"


const app = express();
const port = 3000;

function getWinners(): string {
  return fs.readFileSync(winners_file,'utf8');
}

function getWinningNumber(): number {
  return Number(fs.readFileSync(winning_number_file,'utf8'));
}

function getGameTime(): string {
  return fs.readFileSync(game_time,'utf8');
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
      obj.innerText = date;
    </script>
  </html>
  `
  res.send(result);
});

app.listen(port, () => {
  console.log(`server is listening on ${port}`);
});
