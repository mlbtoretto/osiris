/** NASA NSSDC Planetary Fact Sheet. Physical constants, not a forecast. */
export const NASA_FACT_SHEET = 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/';

export type NasaPlanet = {
  id: string;
  name: string;
  color: string;
  gravityG: number;
  tempC: number;
  pressure: string;
  air: string;
  adapt: 'yes' | 'no';
  why: string;
};

export const NASA_PLANETS: NasaPlanet[] = [
  { id: 'mercury', name: 'Mercury', color: '#b8b1a6', gravityG: 0.38, tempC: 167, pressure: 'none', air: 'Trace sodium and oxygen', adapt: 'no', why: 'No air. Day side about 430°C, night side about -180°C.' },
  { id: 'venus', name: 'Venus', color: '#e6c27a', gravityG: 0.90, tempC: 464, pressure: '92 bar', air: '96.5% carbon dioxide', adapt: 'no', why: '464°C and 92 times Earth pressure. A person is crushed and cooked.' },
  { id: 'earth', name: 'Earth', color: '#3d8bfd', gravityG: 1, tempC: 15, pressure: '1 bar', air: '78% nitrogen, 21% oxygen', adapt: 'yes', why: 'The only body where a human can breathe the open air.' },
  { id: 'mars', name: 'Mars', color: '#c1440e', gravityG: 0.38, tempC: -63, pressure: '0.006 bar', air: '95% carbon dioxide', adapt: 'no', why: 'Mean -63°C and 0.6% of Earth pressure. A suit can visit. The body cannot adapt to that air.' },
  { id: 'jupiter', name: 'Jupiter', color: '#c9a36a', gravityG: 2.53, tempC: -108, pressure: 'no surface', air: 'Hydrogen and helium', adapt: 'no', why: 'No ground. About -108°C at the cloud deck, and the radiation above it is lethal.' },
  { id: 'saturn', name: 'Saturn', color: '#e6d3a3', gravityG: 1.06, tempC: -139, pressure: 'no surface', air: 'Hydrogen and helium', adapt: 'no', why: 'No ground. About -139°C at the cloud deck.' },
  { id: 'uranus', name: 'Uranus', color: '#7de0d6', gravityG: 0.89, tempC: -197, pressure: 'no surface', air: 'Hydrogen, helium, methane', adapt: 'no', why: 'No ground. About -197°C.' },
  { id: 'neptune', name: 'Neptune', color: '#4169e1', gravityG: 1.14, tempC: -201, pressure: 'no surface', air: 'Hydrogen, helium, methane', adapt: 'no', why: 'No ground. About -201°C. Winds exceed 1,000 km/h.' },
];
