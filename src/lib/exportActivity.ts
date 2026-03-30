import { Activity } from '../types';

export interface FlowExport {
  _format: 'ideas-flow-v1';
  _exportedAt: string;
  _source: string;
  activity: {
    title: string;
    shortDescription: string;
    longDescription: string;
    execution: string;
    duration: string;
    durationMinutes: number;
    groupSize: string;
    difficulty: string;
    location: string;
    tags: string[];
    youtubeUrl: string;
    videoUrl: string;
    images: string[];
    materials: Array<{
      name: string;
      url: string;
      size: number;
      type: string;
    }>;
    links: Array<{
      label: string;
      url: string;
    }>;
    costs: Array<{
      description: string;
      price: string;
    }>;
    contact: {
      company: string;
      country: string;
      phone: string;
      whatsapp: string;
      email: string;
    };
    author: string;
  };
}

export function activityToFlowExport(activity: Activity): FlowExport {
  return {
    _format: 'ideas-flow-v1',
    _exportedAt: new Date().toISOString(),
    _source: `${window.location.origin}/activity/${activity.id}`,
    activity: {
      title: activity.title,
      shortDescription: activity.shortDescription,
      longDescription: activity.longDescription,
      execution: activity.execution,
      duration: activity.duration,
      durationMinutes: activity.durationMinutes,
      groupSize: activity.groupSize,
      difficulty: activity.difficulty,
      location: activity.location,
      tags: activity.tags,
      youtubeUrl: activity.youtubeUrl,
      videoUrl: activity.videoUrl,
      images: activity.images,
      materials: activity.materials.map((m) => ({
        name: m.name,
        url: m.url,
        size: m.size,
        type: m.type,
      })),
      links: activity.links.map((l) => ({
        label: l.label,
        url: l.url,
      })),
      costs: activity.costs.map((c) => ({
        description: c.description,
        price: c.price,
      })),
      contact: {
        company: activity.contact.company,
        country: activity.contact.country,
        phone: activity.contact.phone,
        whatsapp: activity.contact.whatsapp,
        email: activity.contact.email,
      },
      author: activity.author,
    },
  };
}

export function downloadFlowExport(activity: Activity): void {
  const data = activityToFlowExport(activity);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const safeName = activity.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);

  const a = document.createElement('a');
  a.href = url;
  a.download = `flow-${safeName}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
