export type AcquisitionProspectStatus = 'pending' | 'approved' | 'discarded';
export type AcquisitionProspectStatusFilter = 'all' | AcquisitionProspectStatus;

export interface AcquisitionProspect {
  id: string;
  businessName: string;
  category: string;
  city: string;
  country: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviewsCount: number;
  commercialScore: number;
  mapsUrl: string;
  status: AcquisitionProspectStatus;
  source: string;
}

export interface AcquisitionSearchParams {
  category: string;
  city: string;
  country: string;
}

export interface AcquisitionFilterParams {
  minScore: number;
  status: AcquisitionProspectStatusFilter;
}

export interface AcquisitionMetrics {
  found: number;
  pending: number;
  approved: number;
  discarded: number;
}

export interface AcquisitionCrmDraft {
  client_id: string;
  name: string;
  phone: string;
  email: string;
  interest: string;
  stage: 'new';
  source: 'acquisition_google_places';
  source_lead_id: string;
  notes: string;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
}

const normalize = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const ACQUISITION_PROSPECTS_MOCK: AcquisitionProspect[] = [
  {
    id: 'gplace-001',
    businessName: 'Centro Dental Miraflores',
    category: 'Clinica dental',
    city: 'Lima',
    country: 'Peru',
    address: 'Av. Jose Pardo 410, Miraflores',
    phone: '+51 999 102 410',
    website: 'https://centrodentalmiraflores.pe',
    rating: 4.8,
    reviewsCount: 214,
    commercialScore: 93,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Centro+Dental+Miraflores+Lima',
    status: 'pending',
    source: 'google_places',
  },
  {
    id: 'gplace-002',
    businessName: 'Taller Premium Surco',
    category: 'Taller automotriz',
    city: 'Lima',
    country: 'Peru',
    address: 'Av. Benavides 5220, Surco',
    phone: '+51 998 301 144',
    website: 'https://tallerpremiumsurco.pe',
    rating: 4.7,
    reviewsCount: 166,
    commercialScore: 86,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Taller+Premium+Surco+Lima',
    status: 'pending',
    source: 'google_places',
  },
  {
    id: 'gplace-003',
    businessName: 'Inmobiliaria Costa Norte',
    category: 'Inmobiliaria',
    city: 'Trujillo',
    country: 'Peru',
    address: 'Av. America Norte 1201, Trujillo',
    phone: '+51 982 410 755',
    website: 'https://costanorteinmobiliaria.pe',
    rating: 4.6,
    reviewsCount: 132,
    commercialScore: 88,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Inmobiliaria+Costa+Norte+Trujillo',
    status: 'pending',
    source: 'google_places',
  },
  {
    id: 'gplace-004',
    businessName: 'Spa Bella Aurora',
    category: 'Estetica',
    city: 'Lima',
    country: 'Peru',
    address: 'Calle Los Laureles 188, San Isidro',
    phone: '+51 981 004 228',
    website: 'https://spabellaaurora.pe',
    rating: 4.4,
    reviewsCount: 81,
    commercialScore: 64,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Spa+Bella+Aurora+Lima',
    status: 'pending',
    source: 'google_places',
  },
  {
    id: 'gplace-005',
    businessName: 'Estudio Juridico Altura',
    category: 'Estudio juridico',
    city: 'Arequipa',
    country: 'Peru',
    address: 'Calle Mercaderes 220, Arequipa',
    phone: '+51 970 550 221',
    website: 'https://estudioaltura.pe',
    rating: 4.5,
    reviewsCount: 73,
    commercialScore: 79,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Estudio+Juridico+Altura+Arequipa',
    status: 'pending',
    source: 'google_places',
  },
  {
    id: 'gplace-006',
    businessName: 'Clinica Renovar Providencia',
    category: 'Clinica estetica',
    city: 'Santiago',
    country: 'Chile',
    address: 'Av. Providencia 2550, Santiago',
    phone: '+56 9 6123 8841',
    website: 'https://clinicarenovar.cl',
    rating: 4.7,
    reviewsCount: 198,
    commercialScore: 90,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Clinica+Renovar+Providencia+Santiago',
    status: 'pending',
    source: 'google_places',
  },
  {
    id: 'gplace-007',
    businessName: 'Grupo Inmobiliario Roma',
    category: 'Inmobiliaria',
    city: 'Ciudad de Mexico',
    country: 'Mexico',
    address: 'Av. Insurgentes Sur 1440, Ciudad de Mexico',
    phone: '+52 55 4102 7799',
    website: 'https://gruporoma.mx',
    rating: 4.6,
    reviewsCount: 149,
    commercialScore: 87,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Grupo+Inmobiliario+Roma+Ciudad+de+Mexico',
    status: 'pending',
    source: 'google_places',
  },
  {
    id: 'gplace-008',
    businessName: 'Taller Andino Cusco',
    category: 'Taller automotriz',
    city: 'Cusco',
    country: 'Peru',
    address: 'Av. La Cultura 1815, Cusco',
    phone: '+51 984 770 319',
    website: '',
    rating: 4.3,
    reviewsCount: 58,
    commercialScore: 72,
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Taller+Andino+Cusco',
    status: 'pending',
    source: 'google_places',
  },
];

export const searchAcquisitionMockData = (params: AcquisitionSearchParams): AcquisitionProspect[] => {
  const categoryNeedle = normalize(params.category);
  const cityNeedle = normalize(params.city);
  const countryNeedle = normalize(params.country);

  return ACQUISITION_PROSPECTS_MOCK
    .filter((prospect) => {
      if (categoryNeedle && !normalize(prospect.category).includes(categoryNeedle)) return false;
      if (cityNeedle && !normalize(prospect.city).includes(cityNeedle)) return false;
      if (countryNeedle && countryNeedle !== 'all' && !normalize(prospect.country).includes(countryNeedle)) return false;
      return true;
    })
    .map((prospect) => ({ ...prospect }));
};

export const filterAcquisitionProspects = (
  prospects: AcquisitionProspect[],
  filters: AcquisitionFilterParams,
) => {
  return prospects.filter((prospect) => {
    if (filters.status !== 'all' && prospect.status !== filters.status) return false;
    if (Number.isFinite(filters.minScore) && prospect.commercialScore < filters.minScore) return false;
    return true;
  });
};

export const getAcquisitionMetrics = (prospects: AcquisitionProspect[]): AcquisitionMetrics => {
  return prospects.reduce<AcquisitionMetrics>(
    (acc, prospect) => {
      acc.found += 1;
      if (prospect.status === 'pending') acc.pending += 1;
      if (prospect.status === 'approved') acc.approved += 1;
      if (prospect.status === 'discarded') acc.discarded += 1;
      return acc;
    },
    { found: 0, pending: 0, approved: 0, discarded: 0 },
  );
};

export const buildAcquisitionCrmDraft = (
  prospect: AcquisitionProspect,
  clientId: string,
  nowIso = new Date().toISOString(),
): AcquisitionCrmDraft => {
  const noteLines = [
    `Origen: Adquisicion`,
    `Rating: ${prospect.rating}/5`,
    `Resenas: ${prospect.reviewsCount}`,
    `Telefono: ${prospect.phone || '-'}`,
    `Website: ${prospect.website || '-'}`,
    `Google Maps: ${prospect.mapsUrl}`,
  ];

  return {
    client_id: clientId,
    name: prospect.businessName,
    phone: prospect.phone,
    email: '',
    interest: [prospect.category, prospect.city].filter(Boolean).join(' - '),
    stage: 'new',
    source: 'acquisition_google_places',
    source_lead_id: prospect.id,
    notes: noteLines.join('\n'),
    created_at: nowIso,
    updated_at: nowIso,
    last_activity_at: nowIso,
  };
};
