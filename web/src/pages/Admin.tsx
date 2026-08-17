import { Header } from '../components/Header'
import { Footer } from '../components/Footer'

// Route shell only — the dashboard itself is ticket #6.
export function Admin() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 items-center justify-center px-5 text-center">
        <p className="text-[15px] text-muted-text">Admin dashboard — coming soon.</p>
      </main>
      <Footer />
    </div>
  )
}
