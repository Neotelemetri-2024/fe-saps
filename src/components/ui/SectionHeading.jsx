function SectionHeading({ eyebrow, title, description, id }) {
  return (
    <div>
      {eyebrow && <span className="text-xs font-semibold uppercase tracking-wide text-primary">{eyebrow}</span>}
      <h2 id={id} className="text-2xl font-extrabold text-base-content">{title}</h2>
      {description && <p className="mt-1 text-sm text-base-content/60">{description}</p>}
    </div>
  )
}

export default SectionHeading
