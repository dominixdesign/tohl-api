# TOHL API


## paths

### player
`/api/p/<id>` --> Player Details
`/api/p/<id>/trades` --> Player Trade

#### player and season
`/api/p/<id>/gamelogs/<seasonid>` --> Player Gamelogs

------

### team
`/api/t/<id>` --> Team Details
`/api/t/<id>/trades` --> Team Trades

#### team and season
`/api/t/<teamid>/roster/<seasonid>` --> All Players with skills and vitals  
`/api/t/<teamid>/lines/<seasonid>/<gameday>` --> Lines of gameday  
`/api/t/<teamid>/finances/<seasonid>` --> Finances of a single team  

------

### season
`/api/s/<seasonid>/today` --> Results from Today  
`/api/s/<seasonid>/standings` --> All standings (league, divisions, conferences)  
`/api/s/<seasonid>/stats/scorer` --> Scorerlist of all players  
`/api/s/<seasonid>/stats/teams` --> Teamsstats of all teams  
`/api/s/<seasonid>/stats/records` --> Records of current season  
`/api/s/<seasonid>/stats/pow` --> Player of the week  
`/api/s/<seasonid>/stats/tow` --> Team of the week  
`/api/s/<seasonid>/stats/pom` --> Player of the month  
`/api/s/<seasonid>/gameday/<gameday>` --> Games from gameday  
`/api/s/<seasonid>/gamedays` --> All Games   
`/api/s/<seasonid>/finances` --> Finances of a all teams  

