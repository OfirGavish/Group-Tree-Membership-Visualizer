'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { TreeNode, TreeVisualizationProps } from '@/types'

export default function TreeVisualization({ data, onNodeSelect, selectedNode }: TreeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove() // Clear previous render

    const width = 800
    const height = 600
    const margin = { top: 20, right: 90, bottom: 30, left: 90 }

    // Create hierarchical layout
    const root = d3.hierarchy(data.nodes[0], (d) => d.children)
    const treeLayout = d3.tree<TreeNode>().size([height - margin.top - margin.bottom, width - margin.left - margin.right])
    const treeData = treeLayout(root)

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Add links
    g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'tree-link')
      .attr('d', d3.linkHorizontal<any, TreeNode>()
        .x((d) => d.y || 0)
        .y((d) => d.x || 0)
      )

    // Add nodes
    const node = g
      .selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'tree-node')
      .attr('transform', (d) => `translate(${d.y || 0},${d.x || 0})`)
      .on('click', (event, d) => {
        event.stopPropagation()
        onNodeSelect(d.data)
      })

    // Add circles for nodes
    node
      .append('circle')
      .attr('r', 10)
      .style('fill', (d) => {
        if (selectedNode && d.data.id === selectedNode.id) return '#ff6b6b'
        return d.data.type === 'user' ? '#4ecdc4' : '#45b7d1'
      })
      .style('stroke', (d) => d.data.type === 'user' ? '#2c3e50' : '#34495e')
      .style('stroke-width', 2)

    // Add labels
    node
      .append('text')
      .attr('dy', '.35em')
      .attr('x', (d) => (d.children ? -13 : 13))
      .style('text-anchor', (d) => (d.children ? 'end' : 'start'))
      .style('font-size', '12px')
      .style('font-family', 'sans-serif')
      .text((d) => d.data.name)

    // Add type indicators
    node
      .append('text')
      .attr('dy', '1.5em')
      .attr('x', (d) => (d.children ? -13 : 13))
      .style('text-anchor', (d) => (d.children ? 'end' : 'start'))
      .style('font-size', '10px')
      .style('font-family', 'sans-serif')
      .style('fill', '#666')
      .text((d) => d.data.type === 'user' ? '👤' : '👥')

  }, [data, selectedNode, onNodeSelect])

  return (
    <div className="w-full h-full flex flex-col items-center">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Group Membership Tree</h3>
        <div className="flex gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-teal-400"></div>
            <span>User</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span>Group</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <span>Selected</span>
          </div>
        </div>
      </div>
      <svg ref={svgRef} className="border border-gray-300 rounded-lg bg-white shadow-sm"></svg>
    </div>
  )
}
