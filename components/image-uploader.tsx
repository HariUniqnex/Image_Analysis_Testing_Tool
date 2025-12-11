"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { Upload, Link, X, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ImageUploaderProps {
  onImageSelect: (source: string) => void
  onClear: () => void
}

export function ImageUploader({ onImageSelect, onClear }: ImageUploaderProps) {
  const [url, setUrl] = useState("")
  const [isDragging, setIsDragging] = useState(false)
  const [hasImage, setHasImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    (file: File) => {
      if (file && file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => {
          const result = e.target?.result as string
          onImageSelect(result)
          setHasImage(true)
        }
        reader.readAsDataURL(file)
      }
    },
    [onImageSelect],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFileChange(file)
    },
    [handleFileChange],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleUrlSubmit = useCallback(() => {
    if (url.trim()) {
      onImageSelect(url.trim())
      setHasImage(true)
    }
  }, [url, onImageSelect])

  const handleClear = useCallback(() => {
    setUrl("")
    setHasImage(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    onClear()
  }, [onClear])

  return (
    <div className="space-y-4">
      {hasImage && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleClear}>
            <X className="mr-2 h-4 w-4" />
            Clear
          </Button>
        </div>
      )}

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="url">
            <Link className="mr-2 h-4 w-4" />
            Paste URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
              isDragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50"
            }`}
          >
            <ImageIcon className="mb-4 h-12 w-12 text-muted-foreground" />
            <p className="mb-2 text-sm font-medium text-foreground">Drop your image here or click to browse</p>
            <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
              className="hidden"
            />
          </div>
        </TabsContent>

        <TabsContent value="url" className="mt-4">
          <div className="space-y-4">
            <Input
              type="url"
              placeholder="https://example.com/image.jpg"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleUrlSubmit()}
            />
            <Button onClick={handleUrlSubmit} className="w-full" disabled={!url.trim()}>
              Load Image
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
