import { FightInput } from "../elo/engine";

export const sampleFights: FightInput[] = [
  {
    date: "2023-05-06",
    fighterA: "Aljamain Sterling",
    fighterB: "Henry Cejudo",
    winner: "fighterA",
    method: "decision",
    weightClass: "bantamweight",
    rounds: 5,
    event: "UFC 288",
  },
  {
    date: "2023-07-29",
    fighterA: "Dustin Poirier",
    fighterB: "Justin Gaethje",
    winner: "fighterB",
    method: "ko",
    weightClass: "lightweight",
    rounds: 2,
    event: "UFC 291",
  },
  {
    date: "2023-11-11",
    fighterA: "Alex Pereira",
    fighterB: "Jiri Prochazka",
    winner: "fighterA",
    method: "tko",
    weightClass: "light heavyweight",
    rounds: 2,
    event: "UFC 295",
  },
  {
    date: "2024-04-13",
    fighterA: "Max Holloway",
    fighterB: "Justin Gaethje",
    winner: "fighterA",
    method: "ko",
    weightClass: "lightweight",
    rounds: 5,
    event: "UFC 300",
  },
];
