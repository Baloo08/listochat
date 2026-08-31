export interface CRDistrict {
  name: string;
}

export interface CRCanton {
  name: string;
  distritos: string[];
}

export interface CRProvincia {
  name: string;
  cantones: CRCanton[];
}

export const COSTA_RICA_GEO: CRProvincia[] = [
  {
    name: 'San José',
    cantones: [
      { name: 'San José', distritos: ['Carmen', 'Merced', 'Hospital', 'Catedral', 'Zapote', 'San Francisco de Dos Ríos', 'Uruca', 'Mata Redonda', 'Pavas', 'Hatillo', 'San Sebastián'] },
      { name: 'Escazú', distritos: ['Escazú Centro', 'San Antonio', 'San Rafael'] },
      { name: 'Desamparados', distritos: ['Desamparados Centro', 'San Miguel', 'San Juan de Dios', 'San Rafael Arriba', 'San Antonio', 'Frailes', 'Patarrá', 'San Cristóbal', 'Rosario', 'Damas', 'San Rafael Abajo', 'Gravilias', 'Los Guido'] },
      { name: 'Puriscal', distritos: ['Santiago', 'Mercedes Sur', 'Barbacoas', 'Grifo Alto', 'San Rafael', 'Candelarita', 'Desamparaditos', 'San Antonio', 'Chires'] },
      { name: 'Tarrazú', distritos: ['San Marcos', 'San Lorenzo', 'San Carlos'] },
      { name: 'Aserrí', distritos: ['Aserrí Centro', 'Tarbaca', 'Vuelta de Jorco', 'San Gabriel', 'Legua', 'Monterrey', 'Salitrillos'] },
      { name: 'Mora', distritos: ['Colón', 'Guayabo', 'Tabarcia', 'Piedras Negras', 'Picagres', 'Jaris', 'Quitirrisí'] },
      { name: 'Goicoechea', distritos: ['Guadalupe', 'San Francisco', 'Calle Blancos', 'Mata de Plátano', 'Ipís', 'Rancho Redondo', 'Purral'] },
      { name: 'Santa Ana', distritos: ['Santa Ana Centro', 'Salitral', 'Pozos', 'Uruca', 'Piedades', 'Brasil'] },
      { name: 'Alajuelita', distritos: ['Alajuelita Centro', 'San Josecito', 'San Antonio', 'Concepción', 'San Felipe'] },
      { name: 'Vázquez de Coronado', distritos: ['San Isidro', 'San Rafael', 'Dulce Nombre de Jesús', 'Patalillo', 'Cascajal'] },
      { name: 'Acosta', distritos: ['San Ignacio', 'Guaitil', 'Palmichal', 'Cangrejal', 'Sabanillas'] },
      { name: 'Tibás', distritos: ['San Juan', 'Cinco Esquinas', 'Anselmo Llorente', 'León XIII', 'Colima'] },
      { name: 'Moravia', distritos: ['San Vicente', 'San Jerónimo', 'La Trinidad'] },
      { name: 'Montes de Oca', distritos: ['San Pedro', 'Sabanilla', 'Mercedes', 'San Rafael'] },
      { name: 'Turrubares', distritos: ['San Pablo', 'San Pedro', 'San Juan de Mata', 'San Luis', 'Carara'] },
      { name: 'Dota', distritos: ['Santa María', 'Jardín', 'Copey'] },
      { name: 'Curridabat', distritos: ['Curridabat Centro', 'Granadilla', 'Sánchez', 'Tirrases'] },
      { name: 'Pérez Zeledón', distritos: ['San Isidro de El General', 'El General', 'Daniel Flores', 'Rivas', 'San Pedro', 'Platanares', 'Pejibaye', 'Cajón', 'Barú', 'Río Nuevo', 'Páramo', 'La Amistad'] },
      { name: 'León Cortés', distritos: ['San Pablo', 'San Andrés', 'Llano Bonito', 'San Isidro', 'Santa Cruz', 'San Antonio'] }
    ]
  },
  {
    name: 'Alajuela',
    cantones: [
      { name: 'Alajuela', distritos: ['Alajuela Centro', 'San José', 'Carrizal', 'San Antonio', 'Guácima', 'San Isidro', 'Sabanilla', 'San Rafael', 'Río Segundo', 'Desamparados', 'Turrúcares', 'Tambor', 'Garita', 'Sarapiquí'] },
      { name: 'San Ramón', distritos: ['San Ramón Centro', 'Santiago', 'San Juan', 'Piedades Norte', 'Piedades Sur', 'San Rafael', 'San Isidro', 'Ángeles', 'Alfaro', 'Volio', 'Concepción', 'Zapotal', 'Peñas Blancas', 'San Lorenzo'] },
      { name: 'Grecia', distritos: ['Grecia Centro', 'San Isidro', 'San José', 'San Roque', 'Tacares', 'Puente de Piedra', 'Bolívar'] },
      { name: 'San Mateo', distritos: ['San Mateo Centro', 'Desmonte', 'Jesús María', 'Labrador'] },
      { name: 'Atenas', distritos: ['Atenas Centro', 'Jesús', 'Mercedes', 'San Isidro', 'Concepción', 'San José', 'Santa Eulalia', 'Escobal'] },
      { name: 'Naranjo', distritos: ['Naranjo Centro', 'San Miguel', 'San José', 'Cirrí Sur', 'San Jerónimo', 'San Juan', 'El Rosario', 'Palmitos'] },
      { name: 'Palmares', distritos: ['Palmares Centro', 'Zaragoza', 'Buenos Aires', 'Santiago', 'Candelaria', 'Esquipulas', 'La Granja'] },
      { name: 'Poás', distritos: ['San Pedro', 'San Juan', 'San Rafael', 'Carrillos', 'Sabana Redonda'] },
      { name: 'Orotina', distritos: ['Orotina Centro', 'El Mastate', 'Hacienda Vieja', 'Coyolar', 'La Ceiba'] },
      { name: 'San Carlos', distritos: ['Quesada', 'Florencia', 'Buenavista', 'Aguas Zarcas', 'Venecia', 'Pital', 'La Fortuna', 'La Tigra', 'La Palmera', 'Venado', 'Cutris', 'Monterrey', 'Pocosol'] },
      { name: 'Zarcero', distritos: ['Zarcero Centro', 'Laguna', 'Tapesco', 'Guadalupe', 'Palmira', 'Zapote', 'Brisas'] },
      { name: 'Sarchí', distritos: ['Sarchí Norte', 'Sarchí Sur', 'Toro Amarillo', 'San Pedro', 'Rodríguez'] },
      { name: 'Upala', distritos: ['Upala Centro', 'Aguas Claras', 'San José (Pizote)', 'Bijagua', 'Delicias', 'Dos Ríos', 'Yolillal', 'Canalete'] },
      { name: 'Los Chiles', distritos: ['Los Chiles Centro', 'Caño Negro', 'El Amparo', 'San Jorge'] },
      { name: 'Guatuso', distritos: ['San Rafael', 'Buenavista', 'Cote', 'Katira'] },
      { name: 'Río Cuarto', distritos: ['Río Cuarto Centro', 'Santa Rita', 'Santa Isabel'] }
    ]
  },
  {
    name: 'Cartago',
    cantones: [
      { name: 'Cartago', distritos: ['Oriental', 'Occidental', 'Carmen', 'San Nicolás', 'Aguacaliente', 'Guadalupe', 'Corralillo', 'Tierra Blanca', 'Dulce Nombre', 'Llano Grande', 'Quebradilla'] },
      { name: 'Paraíso', distritos: ['Paraíso Centro', 'Santiago', 'Orosi', 'Cachí', 'Llanos de Santa Lucía', 'Birrisito'] },
      { name: 'La Unión', distritos: ['Tres Ríos', 'San Diego', 'San Juan', 'San Rafael', 'Concepción', 'Dulce Nombre', 'San Ramón', 'Río Azul'] },
      { name: 'Jiménez', distritos: ['Juan Viñas', 'Tucurrique', 'Pejibaye', 'La Victoria'] },
      { name: 'Turrialba', distritos: ['Turrialba Centro', 'La Suiza', 'Peralta', 'Santa Cruz', 'Santa Teresita', 'Pavones', 'Tuis', 'Tayutic', 'Santa Rosa', 'Tres Equis', 'La Isabel', 'Chirripó'] },
      { name: 'Alvarado', distritos: ['Pacayas', 'Cervantes', 'Capellades'] },
      { name: 'Oreamuno', distritos: ['San Rafael', 'Cot', 'Potrero Cerrado', 'Cipreses', 'Santa Rosa'] },
      { name: 'El Guarco', distritos: ['El Tejar', 'San Isidro', 'Tobosi', 'Patio de Agua'] }
    ]
  },
  {
    name: 'Heredia',
    cantones: [
      { name: 'Heredia', distritos: ['Heredia Centro', 'Mercedes', 'San Francisco', 'Ulloa', 'Varablanca'] },
      { name: 'Barva', distritos: ['Barva Centro', 'San Pedro', 'San Pablo', 'San Roque', 'Santa Lucía', 'San José de la Montaña'] },
      { name: 'Santo Domingo', distritos: ['Santo Domingo Centro', 'San Vicente', 'San Miguel', 'Paracito', 'Santo Tomás', 'Santa Rosa', 'Tures', 'Pará'] },
      { name: 'Santa Bárbara', distritos: ['Santa Bárbara Centro', 'San Pedro', 'San Juan', 'Jesús', 'Santo Domingo', 'Purabá'] },
      { name: 'San Rafael', distritos: ['San Rafael Centro', 'San Josecito', 'Santiago', 'Ángeles', 'Concepción'] },
      { name: 'San Isidro', distritos: ['San Isidro Centro', 'San José', 'Concepción', 'San Francisco'] },
      { name: 'Belén', distritos: ['San Antonio', 'La Ribera', 'La Asunción'] },
      { name: 'Flores', distritos: ['San Joaquín', 'Barrantes', 'Llorente'] },
      { name: 'San Pablo', distritos: ['San Pablo Centro', 'Rincón de Sabanilla'] },
      { name: 'Sarapiquí', distritos: ['Puerto Viejo', 'La Virgen', 'Horquetas', 'Llanuras del Gaspar', 'Cureña'] }
    ]
  },
  {
    name: 'Guanacaste',
    cantones: [
      { name: 'Liberia', distritos: ['Liberia Centro', 'Cañas Dulces', 'Mayorga', 'Nacascolo', 'Curubandé'] },
      { name: 'Nicoya', distritos: ['Nicoya Centro', 'Mansión', 'San Antonio', 'Quebrada Honda', 'Sámara', 'Nosara', 'Belén de Nosarita'] },
      { name: 'Santa Cruz', distritos: ['Santa Cruz Centro', 'Bolsón', 'Veintisiete de Abril', 'Tempate', 'Cartagena', 'Cuajiniquil', 'Diriá', 'Cabo Velas', 'Tamarindo'] },
      { name: 'Bagaces', distritos: ['Bagaces Centro', 'La Fortuna', 'Mogote', 'Río Naranjo'] },
      { name: 'Carrillo', distritos: ['Filadelfia', 'Palmira', 'Sardinal', 'Belén'] },
      { name: 'Cañas', distritos: ['Cañas Centro', 'Palmira', 'San Miguel', 'Bebedero', 'Porozó'] },
      { name: 'Abangares', distritos: ['Las Juntas', 'Sierra', 'San Juan', 'Colorado'] },
      { name: 'Tilarán', distritos: ['Tilarán Centro', 'Quebrada Grande', 'Tronadora', 'Santa Rosa', 'Líbano', 'Tierras Morenas', 'Arenal', 'Cabeceras'] },
      { name: 'Nandayure', distritos: ['Carmona', 'Santa Rita', 'Zapotal', 'San Pablo', 'Porvenir', 'Bejuco'] },
      { name: 'La Cruz', distritos: ['La Cruz Centro', 'Santa Cecilia', 'La Garita', 'Santa Elena'] },
      { name: 'Hojancha', distritos: ['Hojancha Centro', 'Monte Romo', 'Puerto Carrillo', 'Huacas', 'Matambú'] }
    ]
  },
  {
    name: 'Puntarenas',
    cantones: [
      { name: 'Puntarenas', distritos: ['Puntarenas Centro', 'Pitahaya', 'Chomes', 'Lepanto', 'Paquera', 'Manzanillo', 'Guacimal', 'Barranca', 'Isla del Coco', 'Cóbano', 'Chacarita', 'Chira', 'Acapulco', 'El Roble', 'Arancibia'] },
      { name: 'Esparza', distritos: ['Espíritu Santo', 'San Juan Grande', 'Macacona', 'San Rafael', 'San Jerónimo', 'Caldera'] },
      { name: 'Buenos Aires', distritos: ['Buenos Aires Centro', 'Volcán', 'Potrero Grande', 'Boruca', 'Pilas', 'Colinas', 'Chánguena', 'Biolley', 'Brunka'] },
      { name: 'Montes de Oro', distritos: ['Miramar', 'La Unión', 'San Isidro'] },
      { name: 'Osa', distritos: ['Ciudad Cortés', 'Palmar', 'Sierpe', 'Bahía Ballena', 'Piedras Blancas', 'Bahía Drake'] },
      { name: 'Quepos', distritos: ['Quepos Centro', 'Savegre', 'Naranjito'] },
      { name: 'Golfito', distritos: ['Golfito Centro', 'Guaycará', 'Pavones'] },
      { name: 'Coto Brus', distritos: ['San Vito', 'Sabalito', 'Aguabuena', 'Limoncito', 'Pittier', 'Gutiérrez Braun'] },
      { name: 'Parrita', distritos: ['Parrita Centro'] },
      { name: 'Corredores', distritos: ['Corredor', 'La Cuesta', 'Canoas', 'Laurel'] },
      { name: 'Garabito', distritos: ['Jacó', 'Tárcoles', 'Lagunillas'] },
      { name: 'Monteverde', distritos: ['Monteverde Centro', 'Santa Elena'] },
      { name: 'Puerto Jiménez', distritos: ['Puerto Jiménez Centro'] }
    ]
  },
  {
    name: 'Limón',
    cantones: [
      { name: 'Limón', distritos: ['Limón Centro', 'Valle La Estrella', 'Río Blanco', 'Matama'] },
      { name: 'Pococí', distritos: ['Guápiles', 'Jiménez', 'Rita', 'Roxana', 'Cariari', 'Colorado', 'La Colonia'] },
      { name: 'Siquirres', distritos: ['Siquirres Centro', 'Pacuarito', 'Florida', 'Germania', 'El Cairo', 'Alegría', 'Reventazón'] },
      { name: 'Talamanca', distritos: ['Bratsi', 'Sixaola', 'Cahuita', 'Telire'] },
      { name: 'Matina', distritos: ['Matina Centro', 'Batán', 'Carrandí'] },
      { name: 'Guácimo', distritos: ['Guácimo Centro', 'Mercedes', 'Pocora', 'Río Jiménez', 'Duacarí'] }
    ]
  }
];

export function getCRProvincias(): string[] {
  return COSTA_RICA_GEO.map(p => p.name);
}

export function getCRCantones(provinciaName: string): string[] {
  const p = COSTA_RICA_GEO.find(prov => prov.name.toLowerCase() === (provinciaName || '').toLowerCase());
  return p ? p.cantones.map(c => c.name) : [];
}

export function getCRDistritos(provinciaName: string, cantonName: string): string[] {
  const p = COSTA_RICA_GEO.find(prov => prov.name.toLowerCase() === (provinciaName || '').toLowerCase());
  if (!p) return [];
  const c = p.cantones.find(cant => cant.name.toLowerCase() === (cantonName || '').toLowerCase());
  return c ? c.distritos : [];
}
