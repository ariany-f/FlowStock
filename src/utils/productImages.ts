import { ImageSourcePropType } from 'react-native';

export const PRODUCT_LOCAL_IMAGES: Record<string, any> = {
  // Por ID de produto do mock (PNGs oficiais recortados sem fundo)
  prod_1: require('../../assets/products/spaten.png'), // Cerveja Spaten Puro Malte
  prod_2: require('../../assets/products/corona.png'), // Cerveja Corona Extra Long Neck isolada
  prod_3: require('../../assets/products/keg_inox.png'), // Barril Inox Chopp Brahma 50L
  prod_4: require('../../assets/products/brahma.png'), // Cerveja Brahma Original garrafa
  prod_5: require('../../assets/products/tanqueray.png'), // Gin Tanqueray London Dry 750ml
  prod_6: require('../../assets/products/johnnie_walker.png'), // Whisky Johnnie Walker Black Label 1L
  prod_7: require('../../assets/products/absolut.png'), // Vodka Absolut garrafa
  prod_8: require('../../assets/products/monin.png'), // Xarope Monin coquetelaria
  prod_9: require('../../assets/products/heineken.png'), // Heineken 330ml Long Neck packshot
  prod_10: require('../../assets/products/keg_inox.png'), // Chopp Heineken Barril 50L
  prod_11: require('../../assets/products/guarana.png'), // Lata Guaraná Antarctica 350ml
  prod_12: require('../../assets/products/redbull.png'), // Energético Red Bull lata 250ml
  prod_13: require('../../assets/products/eisenbahn.png'), // Eisenbahn Pilsen packshot
  prod_14: require('../../assets/products/heineken_600.png'), // Heineken 600ml retornável garrafa
  prod_15: require('../../assets/products/brahma.png'), // Brahma Duplo Malte 600ml
  prod_16: require('../../assets/products/ice.png'), // Gelo em Cubos para bar

  // Por marca ou palavra-chave para fallback confiável
  heineken: require('../../assets/products/heineken.png'),
  corona: require('../../assets/products/corona.png'),
  eisenbahn: require('../../assets/products/eisenbahn.png'),
  spaten: require('../../assets/products/spaten.png'),
  brahma: require('../../assets/products/brahma.png'),
  original: require('../../assets/products/brahma.png'),
  tanqueray: require('../../assets/products/tanqueray.png'),
  johnnie: require('../../assets/products/johnnie_walker.png'),
  walker: require('../../assets/products/johnnie_walker.png'),
  absolut: require('../../assets/products/absolut.png'),
  redbull: require('../../assets/products/redbull.png'),
  antarctica: require('../../assets/products/guarana.png'),
  guarana: require('../../assets/products/guarana.png'),
  chopp: require('../../assets/products/keg_inox.png'),
  barril: require('../../assets/products/keg_inox.png'),
  erdinger: require('../../assets/products/erdinger.png'),
  schneider: require('../../assets/products/erdinger.png'),
  gelo: require('../../assets/products/ice.png'),
  monin: require('../../assets/products/monin.png'),
};

/**
 * Retorna uma fonte de imagem React Native segura, priorizando imagens PNG sem fundo dos produtos reais
 * e evitando placeholders genéricos.
 */
export function getProductImage(
  item?: { id?: string; brand?: string; name?: string; imageUrl?: string } | string | null
): ImageSourcePropType {
  if (!item) {
    return require('../../assets/products/heineken.png');
  }

  if (typeof item === 'string') {
    const key = item.toLowerCase();
    for (const [k, v] of Object.entries(PRODUCT_LOCAL_IMAGES)) {
      if (key.includes(k)) return v;
    }
    // Se for URL externa segura que não seja unsplash genérica
    if (item.startsWith('http') && !item.includes('photo-1518176258769-f227c798150e') && !item.includes('photo-1584225064785-c62a8b43d148')) {
      return { uri: item };
    }
    return require('../../assets/products/heineken.png');
  }

  // Busca prioritária por ID do produto
  if (item.id && PRODUCT_LOCAL_IMAGES[item.id]) {
    return PRODUCT_LOCAL_IMAGES[item.id];
  }

  // Busca por marca
  const brand = (item.brand || '').toLowerCase();
  for (const [k, v] of Object.entries(PRODUCT_LOCAL_IMAGES)) {
    if (brand.includes(k)) return v;
  }

  // Busca por nome do produto
  const name = (item.name || '').toLowerCase();
  for (const [k, v] of Object.entries(PRODUCT_LOCAL_IMAGES)) {
    if (name.includes(k)) return v;
  }

  // Se tiver imageUrl válida e não for imagem genérica de pessoas
  if (
    item.imageUrl &&
    (item.imageUrl.startsWith('http') || item.imageUrl.startsWith('data:')) &&
    !item.imageUrl.includes('photo-1518176258769-f227c798150e') &&
    !item.imageUrl.includes('photo-1584225064785-c62a8b43d148') &&
    !item.imageUrl.includes('photo-1535958636474-b021ee887b13')
  ) {
    return { uri: item.imageUrl };
  }

  return require('../../assets/products/heineken.png');
}
