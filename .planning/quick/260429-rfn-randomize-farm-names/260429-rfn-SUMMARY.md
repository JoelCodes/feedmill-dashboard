---
status: complete
date: 2026-04-29
---

# Quick Task 260429-rfn: Randomize Farm Names with Parody Names

## What Changed

Replaced all 33 customer/farm names in the mock production data with fun parody names.

## Name Changes

### Premix (11 orders)
| Original | New |
|----------|-----|
| Westbridge Farm | Chick Magnet Farms |
| Starbird @ Jaedel | Fowl Play Poultry |
| Jaedel Leg Brd Pullets | Eggs Benedict Arnold |
| Vanderkooi Poultry | What The Cluck |
| Paul's Investments | Lord of the Wings |
| One-Nine-Zero Chicken Ranch | Eggcellent Acres |
| Meadowview Poultry | Cluckingham Palace |
| Coligny Creek Egg Co | The Yolkels |
| 5 Cedar | Henhouse of Cards |

### Excel (11 orders)
| Original | New |
|----------|-----|
| Severinski Farm Inc | Moo-licious Dairy |
| Jireh Farms | Holy Cow Ranch |
| Nicrest Farms | Udderly Ridiculous |
| Lakewater Holsteins Ltd. | Pasture Bedtime |
| Hayward Acres Inc | The Dairy Godmother |
| Trilean - Makin Bacon | Hogwarts Express |
| Trilean - RNS Nursery | Pig Deal Farms |
| Frueh Farm | Got Milk? Incorporated |
| Corner's Pride McGrath | Legendairy Farms |
| Chemainus Farms Ltd | Milky Way Ranch |
| Kloot Farms Ltd | Hay There Neighbor |

### CGM (11 orders)
| Original | New |
|----------|-----|
| Rockwall @ Peardonville | Winner Winner Chicken |
| VanTilborg @ Mt Lehman | Pecking Order Farms |
| Wincrest Broilers | Drumstick Dynasty |
| Windemere Brd Layer | Feather Frenzy Farm |
| Stak Farms | Poultrygeist Manor |
| Whytebridge Farms Inc. | Game of Chickens |
| South Grove Farms | The Walking Hen |
| Flokstar Farm on McSween | Bawk to the Future |
| Cedarcroft Poultry Ltd | Plucky Ducky Ranch |
| Mission View Acres | Scrambled Priorities |
| Triple H Farms Ltd | Hen Solo Enterprises |

## Files Modified

- `src/services/millProduction.ts` - Updated all customer names in mock data
- Also updated product names that referenced farm names (e.g., "SEVERINSKI DAIRY MASH" -> "MOOLICIOUS DAIRY MASH")

## Theme Categories

- **Poultry puns**: Chick Magnet, Fowl Play, What The Cluck, Cluckingham Palace, Pecking Order
- **Egg puns**: Eggs Benedict Arnold, Eggcellent Acres, The Yolkels, Scrambled Priorities
- **Pop culture**: Lord of the Wings, Game of Chickens, The Walking Hen, Bawk to the Future, Hen Solo, Hogwarts Express, Poultrygeist Manor, Henhouse of Cards
- **Dairy puns**: Moo-licious, Udderly Ridiculous, Legendairy, Pasture Bedtime, The Dairy Godmother, Got Milk?
