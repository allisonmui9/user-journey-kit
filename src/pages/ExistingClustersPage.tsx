import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type FlowNodeType = 'event' | 'decision' | 'action'

interface FlowNode {
  id: string
  type: FlowNodeType
  label: string
}

interface FlowPath {
  label: string
  nextFlowId: string
}

interface Flow {
  id: string
  nodes: FlowNode[]
  decisions?: {
    [nodeId: string]: FlowPath[]
  }
}

const flows: { [key: string]: Flow } = {
  start: {
    id: 'start',
    nodes: [
      { id: 'event1', type: 'event', label: 'Navigate to existing clusters' },
      { id: 'action1', type: 'action', label: 'Browse cluster list' },
      { id: 'decision1', type: 'decision', label: 'Select cluster?' },
    ],
    decisions: {
      decision1: [
        { label: 'View Details', nextFlowId: 'viewDetailsFlow' },
        { label: 'Back', nextFlowId: 'start' },
      ],
    },
  },
  viewDetailsFlow: {
    id: 'viewDetailsFlow',
    nodes: [
      { id: 'event2', type: 'event', label: 'Display cluster configuration' },
      { id: 'action2', type: 'action', label: 'Review sharding setup' },
      { id: 'decision2', type: 'decision', label: 'Make changes?' },
    ],
    decisions: {
      decision2: [
        { label: 'Modify', nextFlowId: 'modifyFlow' },
        { label: 'Monitor', nextFlowId: 'monitorFlow' },
        { label: 'Back', nextFlowId: 'start' },
      ],
    },
  },
  modifyFlow: {
    id: 'modifyFlow',
    nodes: [
      { id: 'action3', type: 'action', label: 'Edit sharding parameters' },
      { id: 'event3', type: 'event', label: 'Apply changes' },
      { id: 'decision3', type: 'decision', label: 'Changes complete?' },
    ],
    decisions: {
      decision3: [
        { label: 'Confirm', nextFlowId: 'confirmFlow' },
        { label: 'Back', nextFlowId: 'viewDetailsFlow' },
      ],
    },
  },
  monitorFlow: {
    id: 'monitorFlow',
    nodes: [
      { id: 'action4', type: 'action', label: 'View cluster metrics' },
      { id: 'event4', type: 'event', label: 'Display performance data' },
    ],
    decisions: {},
  },
  confirmFlow: {
    id: 'confirmFlow',
    nodes: [
      { id: 'event5', type: 'event', label: 'Changes saved successfully' },
      { id: 'action5', type: 'action', label: 'Return to dashboard' },
    ],
    decisions: {},
  },
}

function ShapeNode({ node }: { node: FlowNode }) {
  const getShape = () => {
    switch (node.type) {
      case 'event':
        // Square
        return (
          <div
            style={{
              width: '120px',
              height: '80px',
              border: '2px solid var(--wf-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              padding: '8px',
              boxSizing: 'border-box',
            }}
          >
            {node.label}
          </div>
        )
      case 'decision':
        // Diamond
        return (
          <div
            style={{
              width: '120px',
              height: '120px',
              transform: 'rotate(45deg)',
              border: '2px solid var(--wf-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              fontSize: '11px',
              fontWeight: 'bold',
              padding: '8px',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ transform: 'rotate(-45deg)' }}>{node.label}</div>
          </div>
        )
      case 'action':
        // Circle
        return (
          <div
            style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              border: '2px solid var(--wf-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
              padding: '8px',
              boxSizing: 'border-box',
            }}
          >
            {node.label}
          </div>
        )
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
      {getShape()}
    </div>
  )
}

export default function ExistingClustersPage() {
  const navigate = useNavigate()
  const [currentFlowId, setCurrentFlowId] = useState('start')

  const currentFlow = flows[currentFlowId]

  const handleDecision = (nextFlowId: string) => {
    setCurrentFlowId(nextFlowId)
  }

  const currentDecisionNodeId = currentFlow.nodes.find((n) => n.type === 'decision')?.id

  return (
    <div className="wf" style={{ padding: '40px' }}>
      <div style={{ maxWidth: '700px' }}>
        <button
          onClick={() => navigate('/user-flow')}
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
        <h1 style={{ margin: '0 0 8px 0' }}>Existing Cluster Flow</h1>
        <p style={{ margin: '0 0 32px 0', color: 'var(--wf-muted)' }}>Interactive user flow diagram</p>

        {/* Flow Nodes */}
        {currentFlow.nodes.map((node) => (
          <ShapeNode key={node.id} node={node} />
        ))}

        {/* Decision Paths */}
        {currentDecisionNodeId &&
          currentFlow.decisions &&
          currentFlow.decisions[currentDecisionNodeId] && (
            <div style={{ marginTop: '32px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              {currentFlow.decisions[currentDecisionNodeId].map((path, index) => (
                <button
                  key={index}
                  onClick={() => handleDecision(path.nextFlowId)}
                  style={{
                    padding: '12px 24px',
                    border: '2px solid var(--wf-ink)',
                    background: 'white',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    fontWeight: 'bold',
                  }}
                >
                  {path.label}
                </button>
              ))}
            </div>
          )}
      </div>
    </div>
  )
}
