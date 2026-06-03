/**
 * Barcode Scanner Component
 * Uses @zxing/library to decode barcodes from device camera
 * Supports EAN-13, UPC-A, Code 128 (common Philippine retail barcodes)
 */
'use client'

import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/library'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null)
  const [error, setError] = useState('')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [scanning, setScanning] = useState(false)
  const hasScanned = useRef(false)

  // Start the scanner when the component mounts
  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader()

    async function startScanner() {
      try {
        // Get available video input devices (cameras)
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter(device => device.kind === 'videoinput')
        setDevices(videoDevices)

        // Prefer back/rear camera on mobile
        const backCamera = videoDevices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
        )
        const deviceId = backCamera?.deviceId || videoDevices[0]?.deviceId || null
        setSelectedDevice(deviceId || '')

        if (!videoRef.current) return

        setScanning(true)
        codeReaderRef.current = codeReader
        await codeReader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err) => {
            if (result && !hasScanned.current) {
              hasScanned.current = true // Prevent multiple scans
              const text = result.getText()
              onScan(text)
            }
          }
        )
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        if (message.includes('NotAllowedError') || message.includes('Permission')) {
          setError('Camera permission denied. Please allow camera access and try again.')
        } else if (message.includes('NotFoundError')) {
          setError('No camera found on this device.')
        } else {
          setError(`Scanner error: ${message}`)
        }
        setScanning(false)
      }
    }

    startScanner()

    // Cleanup: stop video stream when modal closes
    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset()
      }
    }
  }, [onScan])

  // Switch camera
  async function switchCamera(deviceId: string) {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset()
    }
    setSelectedDevice(deviceId)
    hasScanned.current = false

    const codeReader = new BrowserMultiFormatReader()
    codeReaderRef.current = codeReader
    if (videoRef.current) {
      await codeReader.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result) => {
          if (result && !hasScanned.current) {
            hasScanned.current = true
            onScan(result.getText())
          }
        }
      )
    }
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/80 text-white">
        <div>
          <h3 className="font-semibold">Scan Barcode</h3>
          <p className="text-xs text-gray-300">Point at EAN-13, UPC-A, or Code 128 barcode</p>
        </div>
        <button
          onClick={onClose}
          className="text-white text-2xl leading-none px-2"
          aria-label="Close scanner"
        >
          ✕
        </button>
      </div>

      {/* Camera Feed */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {error ? (
          <div className="text-center text-white px-6">
            <p className="text-4xl mb-3">📷</p>
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2 bg-white text-black rounded-lg text-sm font-medium"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />

            {/* Scan window overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-64 h-40 border-2 border-white rounded-lg relative">
                <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg" />
                {scanning && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-green-400 animate-pulse" />
                )}
              </div>
              <p className="absolute bottom-32 text-white text-xs bg-black/50 px-3 py-1 rounded-full">
                Align barcode within the box
              </p>
            </div>
          </>
        )}
      </div>

      {/* Camera Switcher (only if multiple cameras) */}
      {devices.length > 1 && !error && (
        <div className="p-3 bg-black/80">
          <select
            value={selectedDevice}
            onChange={(e) => switchCamera(e.target.value)}
            className="w-full bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm"
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label || `Camera ${d.deviceId.slice(0, 8)}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Manual entry fallback */}
      <div className="p-4 bg-black/80">
        <p className="text-gray-400 text-xs text-center mb-2">Or enter barcode manually:</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const code = fd.get('manual') as string
            if (code.trim()) onScan(code.trim())
          }}
          className="flex gap-2"
        >
          <input
            name="manual"
            type="text"
            placeholder="Enter barcode..."
            className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"
          >
            Go
          </button>
        </form>
      </div>
    </div>
  )
}
