# TOHL API

## design inspiration
* https://dribbble.com/shots/7482817-Liverpool-FC-eCommerce-Concept   
* https://www.tiajasmin.com/wp-content/uploads/2020/01/MiniPlans_Feature.jpg   
* https://dribbble.com/shots/2202572-Kontinental-Hockey-League-Redesign-Concept/attachments/407875?mode=media   


## workflow

* `tohl-api` is automatically deployed on TOHL website
* uploading a new export zip file triggers update process
* update process updates database

## player ids

Player ID is just `firstname_lastname` in all lowercase. e.g. 'ryan_damyt'

## endpoints

### player
```
query {
  player(id: ID!) {
    id
    fname
    lname
    display_fname
    display_lname
    height
    weight
    hand
    data: {
      items {
        season
        team
        number
        pos
        cd
        ij
        it
        sp
        st
        en
        du
        di
        sk
        pa
        pc
        df
        sc
        ex
        ld
        ov
        rookie
        age
        salary
        contract
      }
    }
    seasondata(season: ID): {
        season
        team
        number
        pos
        cd
        ij
        it
        sp
        st
        en
        du
        di
        sk
        pa
        pc
        df
        sc
        ex
        ld
        ov
        rookie
        age
        salary
        contract
    }
  }
}
```

#### player and season
`/api/p/<id>/<seasonid>/gamelogs.json` --> Player Gamelogs
`/api/p/<id>/<seasonid>/goals.json` --> Players Goals
`/api/p/<id>/<seasonid>/assist.json` --> Players Assist

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

