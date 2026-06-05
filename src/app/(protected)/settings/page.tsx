'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { updateSettings } from '@/app/actions/settings'
import Cropper from 'react-easy-crop'
import { getCroppedImg } from '@/lib/cropImage'

function IconCamera({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 7h3l2-3h8l2 3h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  )
}
function IconLock({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <rect x="4" y="11" width="16" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  )
}
function IconEye({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function IconEyeOff({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4 4" />
      <path d="M9.9 5.1A10 10 0 0 1 22 12c-.6 1.2-1.4 2.4-2.4 3.4" />
      <path d="M6.6 6.6C3.7 8.4 2 12 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.9-.8" />
    </svg>
  )
}
function IconSun({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}
function IconMoon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [photoBase64, setPhotoBase64] = useState('')

  // Crop state
  const [rawImage, setRawImage] = useState('')
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null)
  const [isDarkMode, setIsDarkMode] = useState(false)

  const [loadingInitial, setLoadingInitial] = useState(true)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 1. Fetch current settings / dark mode
  useEffect(() => {
    // Theme
    const saved = localStorage.getItem('theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsDarkMode(true)
    }

    // Current Store Name + Email
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/settings/me')
        if (res.ok) {
          const data = await res.json()
          if (data.username) setStoreName(data.username)
          if (data.email) setEmail(data.email)
          if (data.profile_photo) setPhotoBase64(data.profile_photo)
        }
      } catch (err) {}
      setLoadingInitial(false)
    }
    fetchUser()
  }, [])

  function toggleDarkMode() {
    setIsDarkMode((prev) => {
      const next = !prev
      if (next) {
        document.documentElement.classList.add('dark')
        localStorage.setItem('theme', 'dark')
      } else {
        document.documentElement.classList.remove('dark')
        localStorage.setItem('theme', 'light')
      }
      return next
    })
  }

  // 2. Handle image upload and open cropper
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setSuccess('')

    const reader = new FileReader()
    reader.onload = (event) => {
      setRawImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
    // Clear input
    e.target.value = ''
  }

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }

  const applyCrop = async () => {
    try {
      if (rawImage && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(rawImage, croppedAreaPixels)
        setPhotoBase64(croppedImage)
        setRawImage('')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // 3. Submit updates
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')

    const formData = new FormData()
    formData.append('storeName', storeName)
    formData.append('password', password)
    if (photoBase64) formData.append('profilePhoto', photoBase64)

    startTransition(async () => {
      const result = await updateSettings(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess('Settings updated. Refreshing to apply changes…')
        setTimeout(() => window.location.reload(), 1500)
      }
    })
  }

  return (
    <div className="px-4 py-5 md:px-8 md:py-8 max-w-[720px] mx-auto">
      <div className="page-header">
        <h1 className="page-title text-[22px]">Settings</h1>
        <p className="page-subtitle">Manage your store profile, credentials, and app preferences.</p>
      </div>

      {error && (
        <div
          className="p-3 rounded-lg text-[13px] mb-4"
          style={{ backgroundColor: 'var(--danger-soft)', color: 'var(--danger)' }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          className="p-3 rounded-lg text-[13px] mb-4"
          style={{ backgroundColor: 'var(--success-soft)', color: 'var(--success)' }}
        >
          {success}
        </div>
      )}

      {/* Appearance */}
      <section className="surface p-5 mb-4">
        <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Appearance</h2>
        <p className="text-[12.5px] mt-0.5 mb-4" style={{ color: 'var(--text-muted)' }}>Choose how the app looks.</p>

        <div className="flex items-center justify-between panel p-3.5">
          <div className="min-w-0">
            <p className="text-[13.5px] font-medium" style={{ color: 'var(--text)' }}>Theme</p>
            <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {isDarkMode ? 'Currently using dark mode' : 'Currently using light mode'}
            </p>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            className="btn btn-secondary"
          >
            {isDarkMode ? <><IconMoon /> Dark</> : <><IconSun /> Light</>}
          </button>
        </div>
      </section>

      {/* Profile */}
      <section className="surface p-5 mb-4">
        <h2 className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Store profile</h2>
        <p className="text-[12.5px] mt-0.5 mb-5" style={{ color: 'var(--text-muted)' }}>Update your store name, photo, and password.</p>

        {loadingInitial ? (
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>Loading current settings…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Profile Photo */}
            <div>
              <label className="field-label">Store logo / avatar</label>
              <div className="flex items-center gap-4">
                {photoBase64 ? (
                  <img src={photoBase64} alt="Preview" className="w-14 h-14 rounded-full object-cover" style={{ border: '1px solid var(--border)' }} />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold"
                    style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  >
                    {storeName ? storeName.charAt(0).toUpperCase() : '🛒'}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-secondary"
                >
                  <IconCamera /> Change photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Email (Read-Only) */}
            <div>
              <label className="field-label">
                Email <span className="text-[11px] font-normal" style={{ color: 'var(--text-subtle)' }}>(read-only)</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  disabled
                  className="input pr-9"
                  style={{ backgroundColor: 'var(--bg-subtle)' }}
                />
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-subtle)' }}
                >
                  <IconLock />
                </span>
              </div>
            </div>

            {/* Store Name */}
            <div>
              <label className="field-label">Store name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required
                className="input"
              />
            </div>

            {/* Password */}
            <div>
              <label className="field-label">New password <span className="text-[11px] font-normal" style={{ color: 'var(--text-subtle)' }}>(optional)</span></label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="input pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: 'var(--text-subtle)' }}
                  tabIndex={-1}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="btn btn-primary btn-lg"
              >
                {isPending ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Cropper Modal */}
      {rawImage && (
        <div className="modal-backdrop" onClick={() => setRawImage('')}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 480, padding: 0, overflow: 'hidden' }}
          >
            <div className="px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h3 className="text-[15px] font-semibold tracking-tight" style={{ color: 'var(--text)' }}>Crop photo</h3>
              <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Drag to reposition, scroll to zoom.</p>
            </div>
            <div className="relative" style={{ height: 360, background: '#0a0a0a' }}>
              <Cropper
                image={rawImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="px-5 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                aria-label="Zoom"
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-current"
                style={{ accentColor: 'var(--accent)' }}
              />
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <button type="button" onClick={() => setRawImage('')} className="btn btn-secondary" style={{ flex: 1 }}>
                Cancel
              </button>
              <button type="button" onClick={applyCrop} className="btn btn-primary" style={{ flex: 1 }}>
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
