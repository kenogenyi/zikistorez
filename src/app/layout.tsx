import Navbar from '@/components/NavbarServer' 
import Providers from '@/components/Providers'
import { cn, constructMetadata } from '@/lib/utils'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import Footer from '@/components/Footer'
import { cookies } from 'next/headers'
import { getServerSideUser } from '@/lib/payload-utils'

const inter = Inter({ subsets: ['latin'] })

export const metadata = constructMetadata()

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // ✅ Get user from cookie
  const { user } = await getServerSideUser(cookies())

  return (
    <html lang='en' className='h-full'>
      <body
        className={cn(
          'relative h-full font-sans antialiased',
          inter.className
        )}>
        <main className='relative flex flex-col min-h-screen'>
          <Providers>
            {/* ✅ Pass user to Navbar */}
            <Navbar />
            <div className='flex-grow flex-1'>{children}</div>
            <Footer />
          </Providers>
        </main>

        <Toaster position='top-center' richColors />
      </body>
    </html>
  )
}
