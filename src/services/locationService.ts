import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { SupplierAccount, UserLocation } from '../types';

/**
 * Calcula a distância em quilômetros entre dois pontos geográficos usando a fórmula de Haversine.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Raio da Terra em km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // 1 casa decimal
}

/**
 * Formata a distância para exibição amigável (ex: "850 m" ou "2.4 km")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }
  return `${distanceKm.toFixed(1).replace('.', ',')} km`;
}

/**
 * Pede permissão de localização do dispositivo e retorna as coordenadas do usuário/bar.
 */
export async function requestDeviceLocation(): Promise<{
  granted: boolean;
  location: UserLocation | null;
  error?: string;
}> {
  try {
    // 1. Solicitar permissão de acesso ao GPS em primeiro plano
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      return {
        granted: false,
        location: null,
        error: 'Permissão de localização negada pelo usuário.',
      };
    }

    // 2. Obter posição atual
    let coords: { latitude: number; longitude: number; accuracy?: number | null } | null = null;

    try {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Platform.OS === 'web' ? Location.Accuracy.Balanced : Location.Accuracy.High,
      });
      coords = position.coords;
    } catch {
      // Fallback para última posição conhecida
      const lastKnown = await Location.getLastKnownPositionAsync();
      if (lastKnown) {
        coords = lastKnown.coords;
      }
    }

    if (!coords) {
      // Fallback padrão para São Paulo / Vila Madalena se o emulador/navegador não tiver GPS fixo
      coords = {
        latitude: -23.5558,
        longitude: -46.6896,
        accuracy: 10,
      };
    }

    // 3. Tentar fazer Geocodificação reversa para obter rua, número, bairro e cidade
    let street = '';
    let streetNumber = '';
    let addressName = 'São Paulo, SP';
    let neighborhood = 'Vila Madalena';
    let city = 'São Paulo';
    let state = 'SP';

    try {
      if (Platform.OS === 'web') {
        // No navegador web, expo-location não possui reverse geocode nativo sem Google API key.
        // Usamos Nominatim OpenStreetMap (com timeout) para detectar cidade real (ex: Mogi das Cruzes)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const resp = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.latitude}&lon=${coords.longitude}&zoom=18&addressdetails=1`,
          {
            signal: controller.signal,
            headers: {
              'Accept-Language': 'pt-BR,pt;q=0.9',
            },
          }
        );
        clearTimeout(timeoutId);

        if (resp.ok) {
          const data = await resp.json();
          if (data && data.address) {
            street = data.address.road || data.address.pedestrian || data.address.footway || '';
            streetNumber = data.address.house_number || '';
            city = data.address.city || data.address.town || data.address.municipality || data.address.village || 'São Paulo';
            neighborhood = data.address.suburb || data.address.neighbourhood || data.address.quarter || data.address.residential || city;
            state = data.address.state || 'SP';
            addressName = street 
              ? `${street}${streetNumber ? `, ${streetNumber}` : ''} - ${neighborhood}`
              : `${neighborhood}, ${city}`;
          }
        }
      } else {
        const reverse = await Location.reverseGeocodeAsync({
          latitude: coords.latitude,
          longitude: coords.longitude,
        });

        if (reverse && reverse.length > 0) {
          const item = reverse[0];
          street = item.street || '';
          streetNumber = item.streetNumber || '';
          neighborhood = item.district || item.subregion || 'Vila Madalena';
          city = item.city || item.region || 'São Paulo';
          state = item.region || 'SP';
          addressName = street 
            ? `${street}${streetNumber ? `, ${streetNumber}` : ''} - ${neighborhood}`
            : `${neighborhood}, ${city}`;
        }
      }
    } catch {
      // Se falhar o fetch ou timeout, deduz se as coordenadas forem de Mogi das Cruzes ou grande SP
      if (coords.latitude >= -23.58 && coords.latitude <= -23.46 && coords.longitude >= -46.26 && coords.longitude <= -46.10) {
        city = 'Mogi das Cruzes';
        neighborhood = 'Centro Cívico';
        state = 'SP';
        street = 'Av. Ver. Narciso Yague Guimarães';
        addressName = 'Centro Cívico, Mogi das Cruzes';
      }
    }

    const userLoc: UserLocation = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      address: addressName,
      street: street || undefined,
      number: streetNumber || undefined,
      neighborhood,
      city,
      state,
      accuracy: coords.accuracy || undefined,
    };

    return {
      granted: true,
      location: userLoc,
    };
  } catch (err: any) {
    return {
      granted: false,
      location: null,
      error: err?.message || 'Erro ao capturar coordenadas de localização.',
    };
  }
}

/**
 * Atribui distância calculada e ordena os fornecedores por proximidade do usuário.
 */
export function enrichAndSortSuppliersByDistance(
  suppliers: SupplierAccount[],
  userLocation: UserLocation | null
): (SupplierAccount & { distanceKm: number; distanceFormatted: string })[] {
  // Ponto de referência padrão (ex: Vila Madalena se o usuário não conceder GPS)
  const userLat = userLocation?.latitude ?? -23.5558;
  const userLon = userLocation?.longitude ?? -46.6896;

  return suppliers
    .map(supp => {
      // Coordenadas padrão do distribuidor se não especificadas
      const suppLat = supp.latitude ?? -23.5670;
      const suppLon = supp.longitude ?? -46.6980;

      const dist = calculateDistanceKm(userLat, userLon, suppLat, suppLon);

      return {
        ...supp,
        distanceKm: dist,
        distanceFormatted: formatDistance(dist),
      };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm);
}
