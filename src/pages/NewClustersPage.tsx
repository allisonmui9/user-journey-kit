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
      { id: 'event1', type: 'event', label: 'Navigate to the Atlas UI' },
      { id: 'decision1', type: 'decision', label: 'New or existing cluster?' },
    ],
    decisions: {
      decision1: [
        { label: 'New Cluster', nextFlowId: 'newClusterFlow' },
        { label: 'Existing Cluster', nextFlowId: 'existingClusterFlow' },
      ],
    },
  },
  newClusterFlow: {
    id: 'newClusterFlow',
    nodes: [
      { id: 'action1', type: 'action', label: 'Enter cluster name' },
      { id: 'event2', type: 'event', label: 'Configure sharding' },
      { id: 'decision2', type: 'decision', label: 'Ready to create?' },
    ],
    decisions: {
      decision2: [
        { label: 'Confirm', nextFlowId: 'confirmFlow' },
        { label: 'Back', nextFlowId: 'start' },
      ],
    },
  },
  existingClusterFlow: {
    id: 'existingClusterFlow',
    nodes: [
      { id: 'action2', type: 'action', label: 'Select cluster from list' },
      { id: 'event3', type: 'event', label: 'View cluster details' },
      { id: 'decision3', type: 'decision', label: 'What action?' },
    ],
    decisions: {
      decision3: [
        { label: 'Modify sharding', nextFlowId: 'modifyFlow' },
        { label: 'Back', nextFlowId: 'start' },
      ],
    },
  },
  confirmFlow: {
    id: 'confirmFlow',
    nodes: [
      { id: 'action3', type: 'action', label: 'Create cluster' },
      { id: 'event4', type: 'event', label: 'Cluster created successfully' },
    ],
    decisions: {},
  },
  modifyFlow: {
    id: 'modifyFlow',
    nodes: [
      { id: 'action4', type: 'action', label: 'Update sharding config' },
      { id: 'event5', type: 'event', label: 'Changes applied' },
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

export default function NewClustersPage() {
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
        <h1 style={{ margin: '0 0 8px 0' }}>New Cluster Flow</h1>
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
