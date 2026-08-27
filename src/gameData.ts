export type CharacterId = 'tiana' | 'lupe' | 'manel' | 'cintia';

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  placeholderColor: number;
}

export const characters: CharacterDefinition[] = [
  { id: 'tiana', name: 'Tiana', placeholderColor: 0xb875d6 },
  { id: 'lupe', name: 'Lupe', placeholderColor: 0x3d78d8 },
  { id: 'manel', name: 'Manel', placeholderColor: 0x252525 },
  { id: 'cintia', name: 'Cintia', placeholderColor: 0x4ca85a }
];
