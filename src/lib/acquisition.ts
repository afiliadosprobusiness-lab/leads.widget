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
