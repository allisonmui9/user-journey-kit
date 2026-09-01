import { useNavigate } from 'react-router-dom'

export default function UserFlowPage() {
  const navigate = useNavigate()

  return (
    <div className="wf" style={{ padding: '40px' }}>
      <div style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--wf-link)',
              cursor: 'pointer',
              fontSize: '14px',
              padding: '0 0 16px 0',
              textDecoration: 'underline',
            }}
          >
            ← Back
          </button>
          <h1 style={{ margin: '0 0 8px 0' }}>User Flow</h1>
          <p style={{ margin: '0', color: 'var(--wf-muted)' }}>Atlas Shard Routing</p>
        </div>

        {/* Single Flow Start */}
        <div
          onClick={() => navigate('/user-flow/diagram')}
          style={{
            padding: '24px',
            cursor: 'pointer',
            border: '1px solid var(--wf-line-muted)',
            borderRadius: '4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '32px' }}>📊</span>
            <div>
              <p style={{ margin: '0', fontWeight: 'bold' }}>Start Flow</p>
              <p style={{ margin: '4px 0 0 0', color: 'var(--wf-muted)', fontSize: '14px' }}>View the complete user flow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

