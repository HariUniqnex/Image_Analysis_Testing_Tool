import { ImageTester } from "@/components/image-tester"

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-3xl font-bold text-foreground">Image Processing Tester</h1>
        <p className="mb-8 text-muted-foreground">Test Remove BG, Meshy, and Google Cloud image processing APIs</p>
        <ImageTester />
      </div>
    </main>
  )
}
