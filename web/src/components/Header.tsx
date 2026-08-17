import logo from '../assets/humble-logo.png'

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-bg/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-5 py-3">
        <a
          href="https://humblecoders.in"
          aria-label="Humble Coders home"
          className="flex items-center"
        >
          <img src={logo} alt="Humble Coders" className="h-10 w-auto" />
        </a>
        <span className="rounded-full border border-line bg-field px-3.5 py-1.5 text-[13px] font-semibold text-muted-text">
          Project Booking
        </span>
      </div>
    </header>
  )
}
