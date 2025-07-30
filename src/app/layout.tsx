import './globals.css'

export const metadata = {
  title: 'Flora Distro POS',
  description: 'Point of Sale system for Flora Distro - Real Cannabis Anywhere',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <meta name="theme-color" content="#4a4a4a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sf-pro antialiased">
        <div className="min-h-screen bg-background text-text-primary">
          {children}
        </div>
      </body>
    </html>
  )
} 