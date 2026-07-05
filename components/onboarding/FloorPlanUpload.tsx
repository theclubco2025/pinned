'use client'

import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'

interface Props {
  storeId: string
  onUploaded: (url: string) => void
}

export default function FloorPlanUpload({ storeId, onUploaded }: Props) {
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const onDrop = useCallback(
    async (accepted: File[]) => {
      const file = accepted[0]
      if (!file) return

      setPreview(URL.createObjectURL(file))
      setUploading(true)
      setError('')

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
    [storeId, onUploaded]
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
        <input {...getInputProps()} />
        {preview ? (
          <img src={preview} alt="Floor plan preview" className="max-h-48 rounded-lg object-contain" />
        ) : (
          <div className="text-center text-muted">
            <p className="text-sm font-medium">{isDragActive ? 'Drop it here' : 'Drag & drop your floor plan'}</p>
            <p className="text-xs mt-1">or click to browse — PNG, JPG, PDF</p>
          </div>
        )}
      </div>

      {uploading && <p className="text-sm text-muted">Uploading…</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
