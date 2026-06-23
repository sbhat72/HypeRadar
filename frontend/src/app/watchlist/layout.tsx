import Navbar from '@/components/ui/Navbar'

export default function WatchlistLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
