import type { CollectionConfig } from 'payload'

export const HomeMedia: CollectionConfig = {
  slug: 'home-media',
  labels: {
    singular: 'Mídia da Home',
    plural: 'Mídias da Home',
  },
  admin: {
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'type'],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texto alternativo',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      label: 'Tipo',
      required: true,
      options: [
        { label: 'Banner', value: 'banner' },
        { label: 'Cases', value: 'cases' },
      ],
    },
  ],
  upload: {
    // Only formats sharp can process, so every upload is converted
    mimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/tiff', 'image/avif'],
    formatOptions: {
      format: 'webp',
    },
  },
}
