export default function InfoTip({ text }) {
  return (
    <span className="info-tip" title={text} role="img" aria-label={text}>
      i
    </span>
  )
}

