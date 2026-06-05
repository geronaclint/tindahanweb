/**
 * Barcode Scanner Component — Production-grade
 * Supports: UPC-A, UPC-E, EAN-13, EAN-8, Code 128, Code 39, ITF, Codabar
 * Uses @zxing/library with optimized camera settings for mobile scanning
 */
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import {
  BrowserMultiFormatReader,
  BarcodeFormat,
  DecodeHintType,
} from '@zxing/library'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [error, setError] = useState('')
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDevice, setSelectedDevice] = useState<string>('')
  const [scanning, setScanning] = useState(false)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const hasScanned = useRef(false)
  const streamRef = useRef<MediaStream | null>(null)

  // Configure the reader with ALL common retail barcode formats
  const createReader = useCallback(() => {
    const hints = new Map()
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.UPC_A,       // The barcode in your image
      BarcodeFormat.UPC_E,       // Compact UPC
      BarcodeFormat.EAN_13,      // Most common in PH stores
      BarcodeFormat.EAN_8,       // Shorter EAN
      BarcodeFormat.CODE_128,    // Modern retail
      BarcodeFormat.CODE_39,     // Industrial
      BarcodeFormat.ITF,         // Carton barcodes
      BarcodeFormat.CODABAR,     // Older retail systems
    ])
    // Try harder to find barcodes
    hints.set(DecodeHintType.TRY_HARDER, true)

    return new BrowserMultiFormatReader(hints, 150) // 150ms between scan attempts
  }, [])

  // Stop the current video stream and reader
  const stopScanning = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset()
      readerRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  // Start scanning with a specific camera
  const startScanning = useCallback(
    async (deviceId?: string) => {
      stopScanning()
      hasScanned.current = false
      setLastScanned(null)
      setError('')

      try {
        const reader = createReader()
        readerRef.current = reader

        if (!videoRef.current) return

        // Request camera with optimized settings for barcode scanning
        const constraints: MediaStreamConstraints = {
          video: {
            ...(deviceId
              ? { deviceId: { exact: deviceId } }
              : { facingMode: 'environment' }), // Prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 },
            // @ts-ignore — advanced constraints for focus/torch
            focusMode: { ideal: 'continuous' },
            zoom: { ideal: 1.5 },
          },
        }

        // Get the stream manually so we can control it
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play()

        setScanning(true)

        // Start continuous decoding
        reader.decodeFromVideoDevice(
          deviceId || null,
          videoRef.current,
          (result) => {
            if (result && !hasScanned.current) {
              const text = result.getText().trim()
              if (text.length >= 4) {
                // Valid barcode found!
                hasScanned.current = true
                setLastScanned(text)

                // Vibrate on success (mobile)
                if (navigator.vibrate) navigator.vibrate(200)

                // Small delay so user sees the result before modal closes
                setTimeout(() => {
                  onScan(text)
                }, 400)
              }
            }
          }
        )
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        if (message.includes('NotAllowed') || message.includes('Permission')) {
          setError('Camera permission denied. Please allow camera access in your browser settings and try again.')
        } else if (message.includes('NotFound') || message.includes('no video')) {
          setError('No camera found on this device.')
        } else if (message.includes('NotReadable') || message.includes('in use')) {
          setError('Camera is in use by another app. Close other camera apps and try again.')
        } else {
          setError(`Scanner error: ${message}`)
        }
        setScanning(false)
      }
    },
    [createReader, stopScanning, onScan]
  )

  // Initialize on mount — enumerate cameras and start scanning
  useEffect(() => {
    async function init() {
      try {
        // Need to request permission first before enumerating
        const tempStream = await navigator.mediaDevices.getUserMedia({ video: true })
        tempStream.getTracks().forEach((t) => t.stop())

        // Now enumerate all video devices
        const allDevices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = allDevices.filter((d) => d.kind === 'videoinput')
        setDevices(videoDevices)

        // Prefer back/rear/environment camera
        const backCamera = videoDevices.find(
          (d) =>
            d.label.toLowerCase().includes('back') ||
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment') ||
            d.label.toLowerCase().includes('0, facing')
        )
        const startDeviceId = backCamera?.deviceId || videoDevices[0]?.deviceId
        if (startDeviceId) setSelectedDevice(startDeviceId)

        await startScanning(startDeviceId)
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        setError(`Camera access failed: ${message}`)
      }
    }
    init()

    return () => stopScanning()
  }, [startScanning, stopScanning])

  // Switch to a different camera
  async function handleCameraSwitch(deviceId: string) {
    setSelectedDevice(deviceId)
    await startScanning(deviceId)
  }

  // Retry scanning (reset the "already scanned" lock)
  function handleRetry() {
    hasScanned.current = false
    setLastScanned(null)
    startScanning(selectedDevice || undefined)
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-black/90 text-white safe-area-top">
        <div>
          <h3 className="font-semibold text-sm tracking-tight">Scan barcode</h3>
          <p className="text-[11px] text-gray-400 mt-0.5">
            UPC-A · EAN-13 · Code 128 · and more
          </p>
        </div>
        <button
          onClick={() => {
            stopScanning()
            onClose()
          }}
          className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white text-base transition-colors"
          aria-label="Close scanner"
        >
          ✕
        </button>
      </div>

      {/* Camera Feed */}
      <div className="flex-1 relative flex items-center justify-center bg-black overflow-hidden">
        {error ? (
          <div className="text-center text-white px-6">
            <p className="text-5xl mb-4">⚠️</p>
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium mr-2"
            >
              Retry
            </button>
            <button
              onClick={() => { stopScanning(); onClose() }}
              className="px-6 py-2.5 bg-white/10 text-white rounded-lg text-sm font-medium"
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

            {/* Scan overlay — red line animation + corner brackets */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {/* Darkened area outside scan box */}
              <div className="absolute inset-0 bg-black/40" />

              {/* Clear scan window */}
              <div className="relative w-72 h-44 z-10">
                {/* Transparent cutout */}
                <div className="absolute inset-0 bg-black/0 rounded-lg border-2 border-white/30" />

                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-green-400 rounded-br-lg" />

                {/* Animated scan line */}
                {scanning && !lastScanned && (
                  <div className="absolute inset-x-2 h-0.5 bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-bounce top-1/2" />
                )}

                {/* Success indicator */}
                {lastScanned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-lg">
                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-bold">
                      ✓ {lastScanned}
                    </div>
                  </div>
                )}
              </div>

              {/* Helper text */}
              <p className="absolute bottom-8 text-white text-xs bg-black/60 px-4 py-1.5 rounded-full z-10">
                {lastScanned
                  ? 'Barcode detected!'
                  : 'Point camera at barcode — hold steady'}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Camera Switcher (multiple cameras) */}
      {devices.length > 1 && !error && (
        <div className="p-2 bg-black/90 flex gap-1.5">
          {devices.map((d, i) => (
            <button
              key={d.deviceId}
              onClick={() => handleCameraSwitch(d.deviceId)}
              className={`flex-1 py-2 rounded-md text-xs font-medium transition-colors ${
                selectedDevice === d.deviceId
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {d.label
                ? d.label.replace(/\(.*\)/, '').trim().slice(0, 20)
                : `Camera ${i + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Manual entry fallback */}
      <div className="p-3 bg-black/90 safe-area-bottom">
        <p className="text-gray-500 text-[11px] text-center mb-1.5">
          Camera not working? Enter barcode manually:
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const code = (fd.get('manual') as string).trim()
            if (code) {
              stopScanning()
              onScan(code)
            }
          }}
          className="flex gap-2"
        >
          <input
            name="manual"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            placeholder="e.g. 0745760973590"
            className="flex-1 bg-white/10 text-white border border-white/20 rounded-md px-3 py-2.5 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-white/40"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-white text-black rounded-md text-sm font-semibold hover:bg-gray-200 transition-colors"
          >
            Go
          </button>
        </form>
      </div>
    </div>
  )
}
