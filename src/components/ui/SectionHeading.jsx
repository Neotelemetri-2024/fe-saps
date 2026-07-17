import './SectionHeading.css'

function SectionHeading({ eyebrow, title, description, id }) {
  return (
    <div className="section-heading">
      <span className="section-heading__eyebrow">{eyebrow}</span>
      <h2 id={id}>{title}</h2>
      <p>{description}</p>
    </div>
  )
}

export default SectionHeading