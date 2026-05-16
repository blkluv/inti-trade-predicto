import Link from "next/link"

const footerSections = [
  {
    title: "Products",
    links: [
      { label: "Markets", href: "/markets" },
      { label: "Signals", href: "/signals" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "FAQ", href: "#" },
      { label: "Documentation", href: "#" },
      { label: "API Reference", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "About Us", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Careers", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Risk Disclosure", href: "#" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="bg-light-bg border-t border-light-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2">
              <span className="text-lg font-bold text-light-foreground">
                Inti Trade Predicto
              </span>
            </Link>
            <p className="mt-3 text-sm text-light-muted max-w-xs leading-relaxed">
              AI-powered prediction market intelligence. Real-time signals, full reasoning transparency.
            </p>
          </div>
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold text-light-foreground uppercase tracking-wider mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-light-muted hover:text-light-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-light-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-light-muted">
            &copy; {new Date().getFullYear()} Inti Trade Predicto. All rights reserved.
          </p>
          <p className="text-xs text-light-muted">
            Not financial advice. Trade responsibly.
          </p>
        </div>
      </div>
    </footer>
  )
}
