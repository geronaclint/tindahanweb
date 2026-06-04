'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { updateSettings } from '@/app/actions/settings'

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('')
  const [password, setPassword] = useState('')
  const [photoBase64, setPhotoBase64] = useState('')
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
      setIsDarkMode(true)
    }

    // Current Store Name
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/settings/me')
        if (res.ok) {
          const data = await res.json()
          if (data.username) setStoreName(data.username)
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

  // 2. Handle image upload and resize to base64
  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setSuccess('')

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        // Resize canvas
        const canvas = document.createElement('canvas')
        const MAX_WIDTH = 256
        const MAX_HEIGHT = 256
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width
            width = MAX_WIDTH
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height
            height = MAX_HEIGHT
          }
        }
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8) // Quality 0.8
        setPhotoBase64(dataUrl)
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
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
        setSuccess('Settings updated successfully! Refreshing to apply changes...')
        setTimeout(() => window.location.reload(), 1500)
      }
    })
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Store Settings</h1>
        <p className="text-xs text-gray-500 dark:text-gray-400">Manage store identity, credentials, and app preferences</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-8">
        
        {/* Appearance Settings */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Appearance</h2>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-100 dark:border-gray-700">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Theme</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Switch between Light and Dark mode UI</p>
            </div>
            <button
              type="button"
              onClick={toggleDarkMode}
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
              {isDarkMode ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </button>
          </div>
        </section>

        <hr className="border-gray-200 dark:border-gray-700" />

        {/* Store Identifiers */}
        <section>
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">App Profile</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {loadingInitial ? (
             <p className="text-sm text-gray-500 dark:text-gray-400">Loading current settings...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Profile Photo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Store Logo / Avatar
                </label>
                <div className="flex items-center gap-4">
                  {photoBase64 ? (
                    <img src={photoBase64} alt="Preview" className="w-16 h-16 rounded-full object-cover border border-gray-200 dark:border-gray-700" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 text-2xl font-bold border border-blue-200 dark:border-blue-800">
                      {storeName ? storeName.charAt(0).toUpperCase() : '🛒'}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    Change Photo
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

              {/* Store Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Store Name
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-900 dark:text-white"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password (Optional)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-gray-900 dark:text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-60 hover:bg-blue-700"
                >
                  {isPending ? 'Saving...' : 'Save Profile Settings'}
                </button>
              </div>
            </form>
          )}

        </section>
      </div>
    </div>
  )
}
