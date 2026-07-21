'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface Props {
  storeId?: string
  draftMode?: boolean
  onUploaded: (url: string) => void
}

export default function FloorPlanUpload({ storeId, draftMode = false, onUploaded }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const processFile = useCallback(
    async (file: File) => {
      setPreview(URL.createObjectURL(file))
      setUploading(true)
      setError('')

      if (draftMode || !storeId) {
        const reader = new FileReader()
        reader.onload = () => {
          onUploaded(reader.result as string)
          setUploading(false)
        }
        reader.onerror = () => {
          setError('Could not read file')
          setUploading(false)
        }
        reader.readAsDataURL(file)
        return
      }

      const form = new FormData()
      form.append('file', file)
      form.append('storeId', storeId)

      const res = await fetch('/api/stores/floor-plan', { method: 'POST', body: form })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Upload failed')
      } else {
        onUploaded(data.url)
      }
      setUploading(false)
    },
    [storeId, draftMode, onUploaded]
  )

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0]
      if (file) await processFile(file)
    },
    [processFile]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 1,
  })

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
          isDragActive ? 'border-foreground bg-elevated' : 'border-border hover:border-muted'
        }`}
      >
        <input {...getInputProps()} capture="environment" />
        {preview ? (
          <img src={preview} alt="Floor plan preview" className="max-h-48 rounded-lg object-contain" />
        ) : (
          <div className="text-center text-muted">
            <p className="text-sm font-medium">{isDragActive ? 'Drop it here' : 'Drag & drop your floor plan'}</p>
            <p className="text-xs mt-1">or click to browse — PNG, JPG</p>
          </div>
        )}
      </div>

      <label className="block">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) processFile(file)
          }}
        />
        <span className="flex w-full cursor-pointer items-center justify-center rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-elevated">
          Take a photo (mobile)
        </span>
      </label>

      {uploading && <p className="text-sm text-muted">Uploading…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
