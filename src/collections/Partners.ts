import { optimize, Preset, vectorizeRaw } from '@neplex/vectorizer'
import { readFile } from 'fs/promises'
import path from 'path'
import { APIError, type CollectionBeforeOperationHook, type CollectionConfig } from 'payload'
import sharp from 'sharp'

const RASTER_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/tiff', 'image/gif']

// Traces the uploaded raster logo into real vector paths before Payload stores the file
const convertLogoToSvg: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  if ((operation !== 'create' && operation !== 'update') || !req.file) {
    return args
  }

  const { file } = req

  // Direct SVG uploads are rejected so every stored logo is one we generated (no embedded scripts)
  if (!RASTER_MIME_TYPES.includes(file.mimetype)) {
    throw new APIError('Envie o logo em PNG, JPG ou WebP; ele será convertido para SVG.', 400)
  }

  const source = file.data?.length ? file.data : await readFile(file.tempFilePath!)

  const { data: pixels, info } = await sharp(source)
    .resize({ width: 1024, height: 1024, fit: 'inside', withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })

  const svg = await optimize(await vectorizeRaw(pixels, { width: info.width, height: info.height }, Preset.Poster))
  const data = Buffer.from(svg)

  req.file = {
    data,
    mimetype: 'image/svg+xml',
    name: `${path.parse(file.name).name}.svg`,
    size: data.length,
  }

  return args
}

export const Partners: CollectionConfig = {
  slug: 'partners',
  labels: {
    singular: 'Parceiro',
    plural: 'Parceiros',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'filename', 'link'],
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeOperation: [convertLogoToSvg],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Título do Parceiro',
      required: true,
    },
    {
      name: 'link',
      type: 'text',
      label: 'Link da organização',
      required: true,
      validate: (value: null | string | undefined) => {
        if (!value) {
          return 'Informe o link da organização.'
        }

        try {
          const { protocol } = new URL(value)
          return protocol === 'http:' || protocol === 'https:' ? true : 'Use um link http:// ou https://.'
        } catch {
          return 'Informe um link válido, ex.: https://exemplo.com.br'
        }
      },
    },
  ],
  upload: {
    // svg+xml is the type the hook produces; raster types let the admin file picker accept PNG/JPG
    mimeTypes: [...RASTER_MIME_TYPES, 'image/svg+xml'],
  },
}
