import './FeatureCard.css'

function FeatureCard({ title, description }) {
  return (
    <article className="feature-card">
      <h2>{title}</h2>
      <p>{description}</p>
    </article>
  )
}

export default FeatureCard