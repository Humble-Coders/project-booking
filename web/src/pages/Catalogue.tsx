import { useState } from 'react'
import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { Footer } from '../components/Footer'
import { ProjectCard } from '../components/ProjectCard'
import { BookingModal } from '../components/BookingModal'
import { MyBookingBanner } from '../components/MyBookingBanner'
import { BookingClosedBanner } from '../components/BookingClosedBanner'
import { LoadingState, ErrorState } from '../components/LoadStates'
import { useProjects } from '../hooks/useProjects'
import { getMyBooking } from '../lib/myBooking'
import type { Project } from '../lib/types'

export function Catalogue() {
  const { projects, loading, error, bookingOpen, retry, refresh } = useProjects()
  const [booking, setBooking] = useState<Project | null>(null)
  const [myBooking, setMyBookingState] = useState<string | null>(() => getMyBooking())

  const closeModal = () => {
    setBooking(null)
    // the modal may have written the note (success or already_booked)
    setMyBookingState(getMyBooking())
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        {/* Already booked? That's the more useful thing to say, gate or no gate.
            The closed banner waits for the first load: the gate starts out
            assumed-closed, and flashing "booking hasn't opened" at someone on
            the morning it has would be a small heart attack for no reason. */}
        {myBooking !== null ? (
          <MyBookingBanner project={myBooking} />
        ) : (
          !loading && !error && !bookingOpen && <BookingClosedBanner />
        )}
        <div className="mx-auto max-w-[1200px] px-5 pb-[90px] pt-6">
          {error ? (
            <ErrorState onRetry={retry} />
          ) : loading ? (
            <LoadingState />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-[18px] max-[400px]:grid-cols-1">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} bookingOpen={bookingOpen} onBook={setBooking} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      {booking !== null && (
        <BookingModal project={booking} onClose={closeModal} onOutcome={refresh} />
      )}
    </div>
  )
}
