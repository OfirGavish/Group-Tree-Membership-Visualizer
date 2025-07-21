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

    const width = 1000
    const height = 700
    const margin = { top: 40, right: 120, bottom: 40, left: 120 }

    // Create hierarchical layout
    const root = d3.hierarchy(data.nodes[0], (d) => d.children)
    const treeLayout = d3.tree<TreeNode>().size([height - margin.top - margin.bottom, width - margin.left - margin.right])
    const treeData = treeLayout(root)

    // Set up zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform)
      })

    svg
      .attr('width', width)
      .attr('height', height)
      .style('background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
      .style('border-radius', '12px')
      .call(zoom)

    // Define gradients
    const defs = svg.append('defs')
    
    // User gradient
    const userGradient = defs.append('linearGradient')
      .attr('id', 'userGradient')
      .attr('gradientUnits', 'objectBoundingBox')
    userGradient.append('stop').attr('offset', '0%').attr('stop-color', '#4ecdc4')
    userGradient.append('stop').attr('offset', '100%').attr('stop-color', '#44a08d')

    // Group gradient  
    const groupGradient = defs.append('linearGradient')
      .attr('id', 'groupGradient')
      .attr('gradientUnits', 'objectBoundingBox')
    groupGradient.append('stop').attr('offset', '0%').attr('stop-color', '#45b7d1')
    groupGradient.append('stop').attr('offset', '100%').attr('stop-color', '#96c93d')

    // Selected gradient
    const selectedGradient = defs.append('linearGradient')
      .attr('id', 'selectedGradient')
      .attr('gradientUnits', 'objectBoundingBox')
    selectedGradient.append('stop').attr('offset', '0%').attr('stop-color', '#ff6b6b')
    selectedGradient.append('stop').attr('offset', '100%').attr('stop-color', '#ee5a52')

    // Add a subtle grid pattern
    const pattern = defs.append('pattern')
      .attr('id', 'grid')
      .attr('width', 50)
      .attr('height', 50)
      .attr('patternUnits', 'userSpaceOnUse')

    pattern.append('path')
      .attr('d', 'M 50 0 L 0 0 0 50')
      .attr('fill', 'none')
      .attr('stroke', 'rgba(255,255,255,0.1)')
      .attr('stroke-width', 1)

    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#grid)')

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Add enhanced links with curves
    const linkGenerator = d3.linkHorizontal<any, TreeNode>()
      .x((d) => d.y || 0)
      .y((d) => d.x || 0)

    g.selectAll('.link')
      .data(treeData.links())
      .enter()
      .append('path')
      .attr('class', 'tree-link')
      .attr('d', linkGenerator)
      .style('fill', 'none')
      .style('stroke', 'rgba(255,255,255,0.6)')
      .style('stroke-width', 3)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')

    // Add nodes with enhanced styling
    const node = g
      .selectAll('.node')
      .data(treeData.descendants())
      .enter()
      .append('g')
      .attr('class', 'tree-node')
      .attr('transform', (d) => `translate(${d.y || 0},${d.x || 0})`)
      .style('cursor', 'pointer')
      .on('click', function(event, d) {
        event.stopPropagation()
        console.log('Node clicked:', d.data.name, d.data.type)
        onNodeSelect(d.data)
      })
      .on('mouseover', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', 18)
          .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))')
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', 15)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
      })

    // Add enhanced circles for nodes
    node
      .append('circle')
      .attr('r', 15)
      .style('fill', (d) => {
        if (selectedNode && d.data.id === selectedNode.id) {
          return 'url(#selectedGradient)'
        }
        return d.data.type === 'user' 
          ? 'url(#userGradient)' 
          : 'url(#groupGradient)'
      })
      .style('stroke', '#ffffff')
      .style('stroke-width', 3)
      .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')

    // Add icons inside circles
    node
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '14px')
      .style('fill', 'white')
      .style('pointer-events', 'none')
      .text((d) => d.data.type === 'user' ? '👤' : '👥')

    // Add expand/collapse indicators for groups
    node
      .filter((d) => d.data.type === 'group')
      .append('circle')
      .attr('cx', 20)
      .attr('cy', -20)
      .attr('r', 8)
      .style('fill', 'rgba(255,255,255,0.9)')
      .style('stroke', '#666')
      .style('stroke-width', 1)
      .style('cursor', 'pointer')

    node
      .filter((d) => d.data.type === 'group')
      .append('text')
      .attr('x', 20)
      .attr('y', -20)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#666')
      .style('pointer-events', 'none')
      .text((d) => d.children && d.children.length > 0 ? '−' : '+')

    // Add enhanced labels with better positioning and styling
    node
      .append('text')
      .attr('dy', '.35em')
      .attr('x', (d) => (d.children ? -25 : 25))
      .style('text-anchor', (d) => (d.children ? 'end' : 'start'))
      .style('font-size', '14px')
      .style('font-family', '"Inter", -apple-system, BlinkMacSystemFont, sans-serif')
      .style('font-weight', '600')
      .style('fill', '#ffffff')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)')
      .style('pointer-events', 'none')
      .text((d) => d.data.name)

    // Add type labels below names
    node
      .append('text')
      .attr('dy', '1.8em')
      .attr('x', (d) => (d.children ? -25 : 25))
      .style('text-anchor', (d) => (d.children ? 'end' : 'start'))
      .style('font-size', '11px')
      .style('font-family', '"Inter", -apple-system, BlinkMacSystemFont, sans-serif')
      .style('font-weight', '400')
      .style('fill', 'rgba(255,255,255,0.8)')
      .style('text-shadow', '0 1px 2px rgba(0,0,0,0.5)')
      .style('pointer-events', 'none')
      .text((d) => d.data.type === 'user' ? 'User' : 'Group')

    // Add zoom control buttons
    const zoomControls = svg.append('g')
      .attr('class', 'zoom-controls')
      .attr('transform', `translate(${width - 60}, 20)`)

    // Zoom in button
    const zoomInButton = zoomControls.append('g')
      .style('cursor', 'pointer')
      .on('click', () => {
        svg.transition().duration(300).call(zoom.scaleBy, 1.5)
      })

    zoomInButton.append('rect')
      .attr('width', 30)
      .attr('height', 30)
      .attr('rx', 5)
      .style('fill', 'rgba(255,255,255,0.9)')
      .style('stroke', '#ccc')

    zoomInButton.append('text')
      .attr('x', 15)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('+')

    // Zoom out button
    const zoomOutButton = zoomControls.append('g')
      .attr('transform', 'translate(0, 35)')
      .style('cursor', 'pointer')
      .on('click', () => {
        svg.transition().duration(300).call(zoom.scaleBy, 0.67)
      })

    zoomOutButton.append('rect')
      .attr('width', 30)
      .attr('height', 30)
      .attr('rx', 5)
      .style('fill', 'rgba(255,255,255,0.9)')
      .style('stroke', '#ccc')

    zoomOutButton.append('text')
      .attr('x', 15)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '18px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('−')

    // Reset zoom button
    const resetButton = zoomControls.append('g')
      .attr('transform', 'translate(0, 70)')
      .style('cursor', 'pointer')
      .on('click', () => {
        const bounds = g.node()?.getBBox()
        if (bounds) {
          const fullWidth = width
          const fullHeight = height
          const scale = 0.8 * Math.min(fullWidth / bounds.width, fullHeight / bounds.height)
          const translate = [fullWidth / 2 - scale * (bounds.x + bounds.width / 2), fullHeight / 2 - scale * (bounds.y + bounds.height / 2)]
          
          svg.transition().duration(500).call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale))
        }
      })

    resetButton.append('rect')
      .attr('width', 30)
      .attr('height', 30)
      .attr('rx', 5)
      .style('fill', 'rgba(255,255,255,0.9)')
      .style('stroke', '#ccc')

    resetButton.append('text')
      .attr('x', 15)
      .attr('y', 15)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text('⌂')

    // Set initial zoom to fit content
    const bounds = g.node()?.getBBox()
    if (bounds) {
      const fullWidth = width
      const fullHeight = height
      const scale = 0.8 * Math.min(fullWidth / bounds.width, fullHeight / bounds.height)
      const translate = [fullWidth / 2 - scale * (bounds.x + bounds.width / 2), fullHeight / 2 - scale * (bounds.y + bounds.height / 2)]
      
      svg.call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale))
    }
  }, [data, selectedNode, onNodeSelect])

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Group Membership Tree</h3>
        <p className="text-sm text-gray-600">Click on group nodes to expand/collapse. Use mouse wheel or controls to zoom.</p>
      </div>
      <div className="overflow-hidden rounded-lg">
        <svg ref={svgRef} className="w-full h-auto" />
      </div>
    </div>
  )
}
