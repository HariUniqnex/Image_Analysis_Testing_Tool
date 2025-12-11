"use client"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"

export type GoogleCloudOperation = "resize" | "lifestyle" | "compress"

export interface GoogleCloudConfig {
  operation: GoogleCloudOperation
  // Resize options
  width?: number
  height?: number
  maintainAspectRatio?: boolean
  // Compression options
  quality?: number
  format?: "jpeg" | "png" | "webp"
  // Lifestyle options
  prompt?: string
  style?: string
}

interface GoogleCloudOptionsProps {
  config: GoogleCloudConfig
  onChange: (config: GoogleCloudConfig) => void
}

export function GoogleCloudOptions({ config, onChange }: GoogleCloudOptionsProps) {
  const handleOperationChange = (operation: GoogleCloudOperation) => {
    onChange({ ...config, operation })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Operation</Label>
        <Select value={config.operation} onValueChange={(v) => handleOperationChange(v as GoogleCloudOperation)}>
          <SelectTrigger>
            <SelectValue placeholder="Select operation" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="resize">Resize Image</SelectItem>
            <SelectItem value="lifestyle">Lifestyle Image Creation</SelectItem>
            <SelectItem value="compress">Image Compression</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {config.operation === "resize" && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-sm font-medium">Resize Options</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                placeholder="e.g. 800"
                value={config.width || ""}
                onChange={(e) => onChange({ ...config, width: Number.parseInt(e.target.value) || undefined })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (px)</Label>
              <Input
                id="height"
                type="number"
                placeholder="e.g. 600"
                value={config.height || ""}
                onChange={(e) => onChange({ ...config, height: Number.parseInt(e.target.value) || undefined })}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="aspectRatio"
              checked={config.maintainAspectRatio ?? true}
              onChange={(e) => onChange({ ...config, maintainAspectRatio: e.target.checked })}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="aspectRatio" className="text-sm font-normal">
              Maintain aspect ratio
            </Label>
          </div>
        </div>
      )}

      {config.operation === "lifestyle" && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-sm font-medium">Lifestyle Image Options</h4>
          <div className="space-y-2">
            <Label htmlFor="prompt">Scene Description</Label>
            <Textarea
              id="prompt"
              placeholder="Describe the lifestyle scene you want (e.g., 'Modern living room with natural lighting')"
              value={config.prompt || ""}
              onChange={(e) => onChange({ ...config, prompt: e.target.value })}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Style</Label>
            <Select value={config.style || "modern"} onValueChange={(v) => onChange({ ...config, style: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="minimalist">Minimalist</SelectItem>
                <SelectItem value="rustic">Rustic</SelectItem>
                <SelectItem value="luxury">Luxury</SelectItem>
                <SelectItem value="outdoor">Outdoor</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {config.operation === "compress" && (
        <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
          <h4 className="text-sm font-medium">Compression Options</h4>
          <div className="space-y-2">
            <Label>Output Format</Label>
            <Select
              value={config.format || "jpeg"}
              onValueChange={(v) => onChange({ ...config, format: v as "jpeg" | "png" | "webp" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Quality</Label>
              <span className="text-sm text-muted-foreground">{config.quality || 80}%</span>
            </div>
            <Slider
              value={[config.quality || 80]}
              onValueChange={([value]) => onChange({ ...config, quality: value })}
              min={10}
              max={100}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Lower quality = smaller file size. Recommended: 60-80% for web use.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
