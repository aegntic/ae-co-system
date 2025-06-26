import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'zkFlow.pro - Smart Form Automation | Save Hours Daily',
  description: 'Automate repetitive form filling and complex login sequences. Record once, replay anywhere. 7-day free trial!',
  keywords: 'form automation, auto fill, password manager, productivity tool, chrome extension',
  openGraph: {
    title: 'zkFlow.pro - Smart Form Automation',
    description: 'Save 10+ hours per month with intelligent form automation',
    url: 'https://zkflow.pro',
    siteName: 'zkFlow.pro',
    images: [
      {
        url: 'https://zkflow.pro/og-image.png',
        width: 1200,
        height: 630,
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'zkFlow.pro - Smart Form Automation',
    description: 'Save 10+ hours per month with intelligent form automation',
    images: ['https://zkflow.pro/og-image.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
        <Toaster 
          position="bottom-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1e293b',
              color: '#fff',
              borderRadius: '8px',
            },
          }}
        />
      </body>
    </html>
  )
}