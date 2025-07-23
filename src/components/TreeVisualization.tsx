'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'
import { TreeNode, TreeVisualizationProps } from '@/types'

export default function TreeVisualization({ data, onNodeSelect, selectedNode, expandedNodes }: TreeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current || !data.nodes.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove() // Clear previous render

    const width = 1000
    const height = 700
    const margin = { top: 40, right: 120, bottom: 40, left: 120 }

    // Filter tree data based on expanded nodes
    const filterTreeData = (node: TreeNode): TreeNode => {
      const filteredNode = { ...node }
      
      // Only include children if this node is expanded
      if (node.children && expandedNodes.has(node.id)) {
        filteredNode.children = node.children.map(filterTreeData)
      } else {
        // Don't include children if node is not expanded
        delete filteredNode.children
      }
      
      return filteredNode
    }

    const filteredRoot = filterTreeData(data.nodes[0])

    // Create hierarchical layout
    const root = d3.hierarchy(filteredRoot, (d) => d.children)
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

    // Device gradient
    const deviceGradient = defs.append('linearGradient')
      .attr('id', 'deviceGradient')
      .attr('gradientUnits', 'objectBoundingBox')
    deviceGradient.append('stop').attr('offset', '0%').attr('stop-color', '#10b981')
    deviceGradient.append('stop').attr('offset', '100%').attr('stop-color', '#059669')

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
        if (d.data.type === 'user') {
          return 'url(#userGradient)'
        } else if (d.data.type === 'device') {
          return 'url(#deviceGradient)'
        } else {
          return 'url(#groupGradient)'
        }
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
      .text((d) => {
        if (d.data.type === 'user') return '👤'
        if (d.data.type === 'device') return '💻'
        return '👥'
      })

    // Add expand/collapse indicators for nodes that have children (both groups and users)
    const expandButton = node
      .filter((d) => {
        // Find the original node in the full tree data to check if it has children
        const findOriginalNode = (node: TreeNode, searchId: string): TreeNode | null => {
          if (node.id === searchId) return node
          if (node.children) {
            for (const child of node.children) {
              const found = findOriginalNode(child, searchId)
              if (found) return found
            }
          }
          return null
        }
        
        const originalNode = findOriginalNode(data.nodes[0], d.data.id)
        
        // For users, check if they could have groups (show + button for expandable users)
        if (d.data.type === 'user') {
          // Show expand button if user is not expanded (they could have groups)
          // or if they are expanded and have children
          return !expandedNodes.has(d.data.id) || Boolean(originalNode?.children && originalNode.children.length > 0)
        }
        
        // For groups, check if they have children in the original tree
        return Boolean(originalNode?.children && originalNode.children.length > 0)
      })
      .append('g')
      .attr('class', 'expand-button')
      .attr('transform', 'translate(20, -20)')
      .style('cursor', 'pointer')
      .on('click', function(event, d) {
        event.stopPropagation()
        console.log('Expand button clicked:', d.data.name)
        onNodeSelect(d.data)
      })

    expandButton
      .append('circle')
      .attr('r', 8)
      .style('fill', 'rgba(255,255,255,0.9)')
      .style('stroke', '#666')
      .style('stroke-width', 1)
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style('fill', 'rgba(255,255,255,1)')
          .attr('r', 9)
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .style('fill', 'rgba(255,255,255,0.9)')
          .attr('r', 8)
      })

    expandButton
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', '10px')
      .style('font-weight', 'bold')
      .style('fill', '#666')
      .style('pointer-events', 'none')
      .text((d) => {
        // Find the original node in the full tree data to check if it has children
        const findOriginalNode = (node: TreeNode, searchId: string): TreeNode | null => {
          if (node.id === searchId) return node
          if (node.children) {
            for (const child of node.children) {
              const found = findOriginalNode(child, searchId)
              if (found) return found
            }
          }
          return null
        }
        
        const originalNode = findOriginalNode(data.nodes[0], d.data.id)
        const isExpanded = expandedNodes.has(d.data.id)
        
        // For users and devices (similar behavior)
        if (d.data.type === 'user' || d.data.type === 'device') {
          // If user/device is not expanded, show + (they can be expanded to show groups)
          // If user/device is expanded and has children, show - (they can be collapsed)
          if (!isExpanded) return '+'
          const hasChildren = originalNode?.children && originalNode.children.length > 0
          return hasChildren ? '−' : '+'
        }
        
        // For groups
        const hasChildren = originalNode?.children && originalNode.children.length > 0
        if (!hasChildren) return '' // No button if no children
        return isExpanded ? '−' : '+'
      })

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
      .text((d) => {
        if (d.data.type === 'user') return 'User'
        if (d.data.type === 'device') return 'Device'
        return 'Group'
      })

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
  }, [data, selectedNode, onNodeSelect, expandedNodes])

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Group Membership Tree</h3>
        <p className="text-sm text-white/70">
          Click on nodes to explore • Click the <span className="inline-flex items-center justify-center w-4 h-4 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold mx-1 text-white">+</span> buttons to expand users/groups • Use mouse wheel or controls to zoom
        </p>
      </div>
      <div className="overflow-hidden rounded-lg">
        <svg ref={svgRef} className="w-full h-auto" />
      </div>
    </div>
  )
}
