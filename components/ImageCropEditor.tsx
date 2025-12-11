'use client'

import Cropper from 'react-easy-crop'
import { useCallback, useState } from 'react'
import { Button } from '@/components/ui/button'
import { getCroppedImg } from './cropImage';

interface ImageCropEditorProps {
  imageSrc: string
  onBack: () => void
  onUploaded: (url: string) => void
}

export default function ImageCropEditor({ imageSrc, onBack, onUploaded }: ImageCropEditorProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isUploading, setUploading] = useState(false)

  const onCropComplete = useCallback((_: any, areaPixels: any) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const uploadCroppedImage = useCallback(async () => {
    const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels)

    const formData = new FormData()
    formData.append('file', croppedBlob)
    formData.append('upload_preset', 'AI IMAGE') // Set in Cloudinary dashboard

    setUploading(true)

    const res = await fetch(`https://api.cloudinary.com/v1_1/dh75n51on/image/upload`, {
      method: 'POST',
      body: formData,
    })

    const data = await res.json()
    setUploading(false)
    onUploaded(data.secure_url)
  }, [croppedAreaPixels, imageSrc, onUploaded])

  return (
    <div className="space-y-4">
      <div className="relative h-[400px] w-full bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={onCropComplete}
        />
      </div>

      <div className="flex justify-between items-center gap-4">
        <Button variant="outline" onClick={onBack}>
          ⬅️ Back
        </Button>
        <Button onClick={uploadCroppedImage} disabled={isUploading}>
          {isUploading ? 'Uploading...' : 'Crop & Upload'}
        </Button>
      </div>
    </div>
  )
}