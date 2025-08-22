# City Builder v2 (Phaser 3 + React + Vite)

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Systems in v0.1 pre_alfa
//implemented
- Grid rendering & placement, tile assignment and save it to supabase
- Population arrivals (respecting global cap)
- Training at Training Center (converts 1 villager from any house to a profession)
- Gold income from full houses (+0.1/10s per full house)

- Minimal HUD overlay
- Quarry building (place near mountains, assign up to 2 workers; miners or villagers)
- New profession: Miner (train at Training Center)
- New resource: Stone (produced by Quarries)

- Resources production of conditions followed
- Implemented full interface
- Construction cost system
- Warehouse system


//nearest short-term fixes
to fix (UI):
blinking in construction and sometimes when we clck we dont choose building -- PERSIST 
same sprite logic for building in tower defence canvas -- DONE

to fix (all production building):
resource needed for construction also substract from available or from warehouse -- Need to implement resource cost first not only gold, 2nd stage 0.2;

game (overall):
when we switch the game, it pause, but functions still running. Also, it seems like it relaunch the 1st quest after we getting first 4 resources to warehouse. Need to make it run probably even if it switched. Or make global pause for all function dont refresh anything also.




//first pre-alfa milestone build to enter 0.2
Building and production system demonstration;
Vilagers moving house, resources moving warehouse;
1 text quest with multiple endings and outcomes;
early demonstration of Tower Defence Mechanics
