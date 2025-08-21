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
to fix (warehouse):
assign warehouse - only one tile available for warehouse assignment, make all 9 tiles available (highlight them) -- DONE
implement dynamic resources in warehouse no need to click to refresh -- DONE
destroy button need to fix for warehouse -- DONE
implement graphical movement for resources inside warehouse (the same as for incoming villagers) -- DONE
when we re-assign warehouse with available resources. it should move in a bulk of 4
work on assigning warehouse button when producting building is full with resources

to fix (house):
income level increase not per fullfilment but per occupant. Normal villager + 0.1, proffesional + 0.2, master + 0.3 -- DONE

to fix (all production building):
if resource available become > 20, production stops with the warning inside the interface -- DONE
resource needed for construction also substract from available or from warehouse -- Need to implement resiurce cost first not only gold, 2nd stage 0.2
show message warehouse is full when button is red -- DONE

//first pre-alfa milestone build to enter 0.2
Building and production system demonstration;
Vilagers moving house, resources moving warehouse;
1 text quest with multiple endings and outcomes;
early demonstration of Tower Defence Mechanics
