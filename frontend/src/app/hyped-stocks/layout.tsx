import Navbar from '@/components/ui/Navbar'

export default function HypedStocksLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
