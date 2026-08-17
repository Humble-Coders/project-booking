import { Header } from '../components/Header'
import { Hero } from '../components/Hero'
import { Footer } from '../components/Footer'
import { ProjectCard } from '../components/ProjectCard'
import { LoadingState, ErrorState } from '../components/LoadStates'
import { useProjects } from '../hooks/useProjects'
import type { Project } from '../lib/types'

export function Catalogue() {
  const { projects, loading, error, retry } = useProjects()

  // Booking modal is ticket #4 — stub keeps the wiring in place.
  const handleBook = (project: Project) => {
    console.info(`book stub: project ${project.id} (${project.title})`)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <div className="mx-auto max-w-[1200px] px-5 pb-[90px] pt-6">
          {error ? (
            <ErrorState onRetry={retry} />
          ) : loading ? (
            <LoadingState />
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-[18px] max-[400px]:grid-cols-1">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} onBook={handleBook} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
