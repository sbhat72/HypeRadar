import Navbar from '@/components/ui/Navbar'

export default function AlertsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  )
}
