function FeatureCard({ title, description }) {
  return (
    <article className="card bg-base-100 p-5">
      <h2 className="text-lg font-semibold text-base-content">{title}</h2>
      <p className="mt-1 text-sm text-base-content/60">{description}</p>
    </article>
  )
}

export default FeatureCard
