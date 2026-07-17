/** Famous footballer names for AI teammates / opponents */

export const FAMOUS_FOOTBALLERS = [
  'Lionel Messi',
  'Cristiano Ronaldo',
  'Kylian Mbappé',
  'Erling Haaland',
  'Neymar Jr',
  'Kevin De Bruyne',
  'Luka Modrić',
  'Robert Lewandowski',
  'Mohamed Salah',
  'Harry Kane',
  'Vinícius Jr',
  'Jude Bellingham',
  'Rodri',
  'Virgil van Dijk',
  'Manuel Neuer',
  'Gianluigi Buffon',
  'Ronaldinho',
  'Zinedine Zidane',
  'Thierry Henry',
  'Andrés Iniesta',
  'Xavi Hernández',
  'Kaká',
  'Rivaldo',
  'Paolo Maldini',
  'Franz Beckenbauer',
  'Pelé',
  'Diego Maradona',
  'George Best',
  'Eric Cantona',
  'David Beckham',
] as const;

export function pickFamousFootballerNames(count: number, seed = Math.random): string[] {
  const pool = [...FAMOUS_FOOTBALLERS];
  const picked: string[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(seed() * pool.length);
    picked.push(pool.splice(idx, 1)[0]!);
  }
  while (picked.length < count) {
    picked.push(`Legend ${picked.length + 1}`);
  }
  return picked;
}
