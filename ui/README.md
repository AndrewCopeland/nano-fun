## API Docs


### /api/history
Return a list of json objects representing all past games. Each game has a unique identifier represented as the `id`.
```json

[
    {
        "id": 567,
        "pot": 60,
        "distribution": 30,
        "winning_number": 7,
        "time_played": 6378399373,
        "players": [
            {
                "account": "ban_73738ssdfsdf",
                "number": 7
            },
            {
                "account": "ban_1xasssdfsd8",
                "number": 7
            }
        ],
        "winners": [
            "ban_73738ssdfsdf",
            "ban_1xasssdfsd8"
        ]
    }
]
```

### /api/history/last
Similiar to the endpoint above except only the most recent game is returned
```json
{
    "id": 567,
    "pot": 60,
    "distribution": 30,
    "winning_number": 7,
    "time_played": 6378399373,
    "players": [
        {
            "account": "ban_73738ssdfsdf",
            "number": 7
        },
        {
            "account": "ban_1xasssdfsd8",
            "number": 7
        }
    ],
    "winners": [
        "ban_73738ssdfsdf",
        "ban_1xasssdfsd8"
    ]
}
```

### /api/current/pot
Returns a float that represents the current pot
```
88
```

### /api/current/players
Returns a list of the current players and the number each player guessed
```json
[
    {
        "account": "ban_73738ssdfsdf",
        "number": 7
    },
    {
        "account": "ban_1xasssdfsd8",
        "number": 7
    }
]
```

### /api/current/game-start
Returns an integer representing the time in which that last game finished playing. This is epoch time and should be converted to local time for the user.
```
16865658494
```

### /api/last/players
Returns a list of players the numbers they guessed for the last game.
```json
[
    {
        "account": "ban_73738ssdfsdf",
        "number": 7
    },
    {
        "account": "ban_1xasssdfsd8",
        "number": 7
    }
]
```

### /api/last/winners
Returns a list of players that won the last game.
```json
[
    "ban_73738ssdfsdf",
    "ban_1xasssdfsd8"
]
```

### /api/last/pot
Returns a float that represents the pot of the last game
```
88.937
```

### /api/last/winning-number
Returns an integer representing the winning number for the last game.
```
7
```

