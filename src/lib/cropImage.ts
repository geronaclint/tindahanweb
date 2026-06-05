export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) {
    throw new Error('No 2d context')
  }

  // Set canvas size to the desired output size but capped to max 500px for profile photo
  const MAX_SIZE = 500
  const scale = Math.min(1, MAX_SIZE / Math.max(pixelCrop.width, pixelCrop.height))
  const newWidth = pixelCrop.width * scale
  const newHeight = pixelCrop.height * scale

  canvas.width = newWidth
  canvas.height = newHeight

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    newWidth,
    newHeight
  )

  // As Base64 string
  return canvas.toDataURL('image/jpeg', 0.8)
}
