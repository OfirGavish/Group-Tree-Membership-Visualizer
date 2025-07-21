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

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // Add a subtle grid pattern
    const defs = svg.append('defs')
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
      .on('click', (event, d) => {
        event.stopPropagation()
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
          return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)'
        }
        return d.data.type === 'user' 
          ? 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)' 
          : 'linear-gradient(135deg, #45b7d1 0%, #96c93d 100%)'
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
    <div className="w-full h-full flex flex-col items-center bg-gray-50 rounded-xl overflow-hidden shadow-lg">
      <div className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Group Membership Tree</h3>
            <p className="text-blue-100 text-sm">Click and drag to pan • Scroll to zoom • Click nodes to explore</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg"></div>
              <span>User</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-400 to-green-400 shadow-lg"></div>
              <span>Group</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-lg"></div>
              <span>Selected</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="relative w-full h-full bg-gray-900 overflow-hidden">
        <svg 
          ref={svgRef} 
          className="w-full h-full cursor-move"
          style={{ minHeight: '600px' }}
        />
        
        {/* Zoom controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => {
              const svg = d3.select(svgRef.current)
              svg.transition().duration(300).call(
                // @ts-ignore
                svg.property('__zoom')?.scaleBy, 1.5
              )
            }}
            className="w-10 h-10 bg-white/90 hover:bg-white rounded-lg shadow-lg flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all duration-200"
            title="Zoom In"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>
          
          <button
            onClick={() => {
              const svg = d3.select(svgRef.current)
              svg.transition().duration(300).call(
                // @ts-ignore
                svg.property('__zoom')?.scaleBy, 1 / 1.5
              )
            }}
            className="w-10 h-10 bg-white/90 hover:bg-white rounded-lg shadow-lg flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all duration-200"
            title="Zoom Out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
            </svg>
            </button>
          
          <button
            onClick={() => {
              const svg = d3.select(svgRef.current)
              const gNode = svg.select('g').node() as SVGGElement
              const bounds = gNode?.getBBox()
              if (bounds) {
                const fullWidth = 1000
                const fullHeight = 700
                const scale = 0.8 * Math.min(fullWidth / bounds.width, fullHeight / bounds.height)
                const translate = [fullWidth / 2 - scale * (bounds.x + bounds.width / 2), fullHeight / 2 - scale * (bounds.y + bounds.height / 2)]
                
                svg.transition().duration(500).call(
                  // @ts-ignore
                  svg.property('__zoom')?.transform,
                  d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
                )
              }
            }}
            className="w-10 h-10 bg-white/90 hover:bg-white rounded-lg shadow-lg flex items-center justify-center text-gray-700 hover:text-gray-900 transition-all duration-200"
            title="Fit to Screen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </div>
        
        {/* Instructions overlay */}
        <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-2 rounded-lg text-xs">
          💡 Use mouse wheel to zoom, drag to pan
        </div>
      </div>
    </div>
  )
}
