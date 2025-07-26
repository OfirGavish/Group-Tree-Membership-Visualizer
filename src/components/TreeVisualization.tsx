'use client'

import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { TreeNode, TreeVisualizationProps } from '@/types'
import ContextMenu from './ContextMenu'
import EnhancedDetails from './EnhancedDetails'

export default function TreeVisualization({ 
  data, 
  onNodeSelect, 
  selectedNode, 
  expandedNodes,
  onDragStart,
  onDragEnd,
  onDrop
}: TreeVisualizationProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [contextMenu, setContextMenu] = useState<{
    isVisible: boolean
    position: { x: number; y: number }
    node: TreeNode | null
  }>({ isVisible: false, position: { x: 0, y: 0 }, node: null })
  
  const [enhancedDetails, setEnhancedDetails] = useState<{
    isVisible: boolean
    node: TreeNode | null
  }>({ isVisible: false, node: null })

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

    // Add nodes with enhanced styling and drag-and-drop functionality
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
        
        // Check if this was part of a drag operation - wait a bit to be sure
        const isDragging = d3.select(this).property('__isDragging')
        if (isDragging) {
          console.log('🚫 Ignoring click because of drag operation for:', d.data.name)
          return
        }
        
        // Small delay to ensure drag operations are fully processed
        setTimeout(() => {
          const stillDragging = d3.select(this).property('__isDragging')
          if (!stillDragging) {
            console.log('🖱️ Node clicked:', d.data.name, d.data.type)
            onNodeSelect(d.data)
          }
        }, 10)
      })
      .on('contextmenu', function(event, d) {
        event.preventDefault()
        event.stopPropagation()
        
        console.log('🖱️ Right-click on node:', d.data.name, d.data.type)
        
        // Get the mouse position relative to the page
        const rect = svgRef.current?.getBoundingClientRect()
        if (rect) {
          setContextMenu({
            isVisible: true,
            position: {
              x: event.clientX,
              y: event.clientY
            },
            node: d.data
          })
        }
      })
      .on('mouseover', function(event, d) {
        // Enhanced hover effect for groups when drag-drop is enabled
        if (d.data.type === 'group' && onDrop) {
          d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', 18)
            .style('filter', 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))')
            .style('stroke-width', 4)
        } else {
          d3.select(this).select('circle')
            .transition()
            .duration(200)
            .attr('r', 18)
            .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))')
        }
      })
      .on('mouseout', function(event, d) {
        d3.select(this).select('circle')
          .transition()
          .duration(200)
          .attr('r', 15)
          .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
          .style('stroke-width', 3)
      })
      .call(d3.drag<SVGGElement, d3.HierarchyPointNode<TreeNode>>()
        .on('start', function(event, d) {
          // Store the starting position to detect if it's a real drag or just a click
          const startPos = { x: event.x, y: event.y }
          d3.select(this).property('__dragStartPos', startPos)
          d3.select(this).property('__isDragging', false)
          
          // Only allow dragging users and devices
          if (!(d.data.type === 'user' || d.data.type === 'device')) {
            // Prevent dragging for groups but don't stop propagation (allow clicks)
            event.subject.fx = null
            event.subject.fy = null
            return
          }
        })
        .on('drag', function(event, d) {
          // Only process drag for users and devices
          if ((d.data.type === 'user' || d.data.type === 'device') && onDragStart) {
            const startPos = d3.select(this).property('__dragStartPos')
            if (!startPos) return
            
            const dragDistance = Math.sqrt(
              Math.pow(event.x - startPos.x, 2) + Math.pow(event.y - startPos.y, 2)
            )
            
            // Only start dragging if moved more than 5 pixels and not already dragging
            if (dragDistance > 5 && !d3.select(this).property('__isDragging')) {
              console.log('🏃 Starting drag for:', d.data.name)
              d3.select(this).property('__isDragging', true)
              onDragStart(d.data)
              
              // Add visual feedback for the dragged item
              d3.select(this).select('circle')
                .style('stroke', '#fbbf24')
                .style('stroke-width', 4)
                .style('opacity', 0.7)
                .style('filter', 'drop-shadow(0 4px 8px rgba(251, 191, 36, 0.5))')
              
              // Dim the original label
              d3.select(this).selectAll('text')
                .style('opacity', 0.6)
              
              // Highlight potential drop targets (groups)
              g.selectAll('.tree-node')
                .filter((dropTarget: any) => dropTarget.data.type === 'group')
                .select('circle')
                .style('stroke', '#10b981')
                .style('stroke-width', 4)
                .style('stroke-dasharray', '5,5')
                .style('filter', 'drop-shadow(0 0 12px rgba(16, 185, 129, 0.6))')
              
              // Add visual drop zones (circles showing detection radius)
              g.selectAll('.tree-node')
                .filter((dropTarget: any) => dropTarget.data.type === 'group')
                .append('circle')
                .attr('class', 'drop-zone-radius')
                .attr('r', 80) // Match the detection radius
                .style('fill', 'rgba(16, 185, 129, 0.1)')
                .style('stroke', 'rgba(16, 185, 129, 0.3)')
                .style('stroke-width', 2)
                .style('stroke-dasharray', '3,3')
                .style('pointer-events', 'none')
                .style('opacity', 0)
                .transition()
                .duration(200)
                .style('opacity', 1)
              
              // Add drop zone labels
              g.selectAll('.tree-node')
                .filter((dropTarget: any) => dropTarget.data.type === 'group')
                .append('text')
                .attr('class', 'drop-zone-hint')
                .attr('x', 0)
                .attr('y', -35)
                .style('text-anchor', 'middle')
                .style('font-size', '10px')
                .style('font-weight', 'bold')
                .style('fill', '#10b981')
                .style('text-shadow', '0 1px 2px rgba(0,0,0,0.8)')
                .style('pointer-events', 'none')
                .text('Drop here!')
                .style('opacity', 0)
                .transition()
                .duration(200)
                .style('opacity', 1)
              
              // Remove any existing ghost elements first
              svg.selectAll('.drag-ghost').remove()
              
              // Create a ghost element that follows the cursor
              const ghost = svg.append('g')
                .attr('class', 'drag-ghost')
                .style('pointer-events', 'none')
                .style('opacity', 0.9)
                .style('z-index', 1000)
              
              console.log('👻 Ghost element created:', ghost.node())
              
              // Add ghost circle
              ghost.append('circle')
                .attr('r', 15)
                .style('fill', d.data.type === 'user' ? 'url(#userGradient)' : 'url(#deviceGradient)')
                .style('stroke', '#fbbf24')
                .style('stroke-width', 3)
                .style('filter', 'drop-shadow(0 4px 12px rgba(251, 191, 36, 0.5))')
              
              // Add ghost icon
              ghost.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .style('font-size', '14px')
                .style('fill', 'white')
                .style('text-shadow', '0 1px 2px rgba(0,0,0,0.8)')
                .text(d.data.type === 'user' ? '👤' : '💻')
              
              // Add ghost label with background
              const labelGroup = ghost.append('g')
                .attr('transform', 'translate(50, 0)') // Move even further to the right to avoid covering icon
              
              // Calculate label dimensions
              const labelText = d.data.name
              const labelWidth = labelText.length * 7 + 16 // More accurate width calculation with padding
              const labelHeight = 20
              
              // Background for label
              labelGroup.append('rect')
                .attr('x', -labelWidth / 2)
                .attr('y', -labelHeight / 2)
                .attr('width', labelWidth)
                .attr('height', labelHeight)
                .attr('rx', 10)
                .style('fill', 'rgba(0,0,0,0.8)')
                .style('stroke', '#fbbf24')
                .style('stroke-width', 1)
              
              // Label text - centered within the rectangle
              labelGroup.append('text')
                .attr('x', 0) // Center horizontally
                .attr('y', 0) // Center vertically
                .attr('dy', '0.35em') // Fine-tune vertical centering
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('fill', '#ffffff')
                .style('text-anchor', 'middle')
                .text(labelText)
            }
            
            // Update ghost position during every drag move
            const ghost = svg.select('.drag-ghost')
            if (!ghost.empty()) {
              const [mouseX, mouseY] = d3.pointer(event.sourceEvent, svg.node())
              ghost.attr('transform', `translate(${mouseX + 15}, ${mouseY - 15})`)
            } else if (d3.select(this).property('__isDragging')) {
              // If we're dragging but ghost is missing, recreate it
              console.log('🔄 Recreating missing ghost element')
              
              // Remove any existing ghost elements first
              svg.selectAll('.drag-ghost').remove()
              
              // Create a new ghost element
              const newGhost = svg.append('g')
                .attr('class', 'drag-ghost')
                .style('pointer-events', 'none')
                .style('opacity', 0.9)
                .style('z-index', 1000)
              
              // Add ghost circle
              newGhost.append('circle')
                .attr('r', 15)
                .style('fill', d.data.type === 'user' ? 'url(#userGradient)' : 'url(#deviceGradient)')
                .style('stroke', '#fbbf24')
                .style('stroke-width', 3)
                .style('filter', 'drop-shadow(0 4px 12px rgba(251, 191, 36, 0.5))')
              
              // Add ghost icon
              newGhost.append('text')
                .attr('text-anchor', 'middle')
                .attr('dy', '0.35em')
                .style('font-size', '14px')
                .style('fill', 'white')
                .style('text-shadow', '0 1px 2px rgba(0,0,0,0.8)')
                .text(d.data.type === 'user' ? '👤' : '💻')
              
              // Add ghost label with background
              const labelGroup = newGhost.append('g')
                .attr('transform', 'translate(50, 0)') // Move even further to the right to avoid covering icon
              
              // Calculate label dimensions
              const labelText = d.data.name
              const labelWidth = labelText.length * 7 + 16 // More accurate width calculation with padding
              const labelHeight = 20
              
              // Background for label
              labelGroup.append('rect')
                .attr('x', -labelWidth / 2)
                .attr('y', -labelHeight / 2)
                .attr('width', labelWidth)
                .attr('height', labelHeight)
                .attr('rx', 10)
                .style('fill', 'rgba(0,0,0,0.8)')
                .style('stroke', '#fbbf24')
                .style('stroke-width', 1)
              
              // Label text - centered within the rectangle
              labelGroup.append('text')
                .attr('x', 0) // Center horizontally
                .attr('y', 0) // Center vertically
                .attr('dy', '0.35em') // Fine-tune vertical centering
                .style('font-size', '12px')
                .style('font-weight', 'bold')
                .style('fill', '#ffffff')
                .style('text-anchor', 'middle')
                .text(labelText)
              
              // Position the new ghost
              const [mouseX, mouseY] = d3.pointer(event.sourceEvent, svg.node())
              newGhost.attr('transform', `translate(${mouseX + 15}, ${mouseY - 15})`)
              
              console.log('👻 Ghost element recreated')
            } else {
              console.log('⚠️ Ghost element not found during drag move')
            }
          }
        })
        .on('end', function(event, d) {
          const isDragging = d3.select(this).property('__isDragging')
          
          // Prevent multiple end events for the same drag operation
          if (isDragging && d3.select(this).property('__dragProcessed')) {
            console.log('⚠️ Drop already processed for this drag operation')
            return
          }
          
          if ((d.data.type === 'user' || d.data.type === 'device') && onDrop && isDragging) {
            console.log('🎯 Processing drop for:', d.data.name)
            
            // Mark this drag as processed to prevent duplicate events
            d3.select(this).property('__dragProcessed', true)
            
            // Add a slight delay to ensure all D3 operations are complete
            setTimeout(() => {
              // Remove the ghost element
              svg.select('.drag-ghost').remove()
              
              // Remove visual feedback from dragged item
              d3.select(this).select('circle')
                .style('stroke', '#ffffff')
                .style('stroke-width', 3)
                .style('opacity', 1)
                .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
              
              // Restore original label opacity
              d3.select(this).selectAll('text')
                .style('opacity', 1)
              
              // Remove drop target highlighting and hints
              g.selectAll('.tree-node')
                .filter((dropTarget: any) => dropTarget.data.type === 'group')
                .select('circle')
                .style('stroke', '#ffffff')
                .style('stroke-width', 3)
                .style('stroke-dasharray', 'none')
                .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
              
              // Remove drop zone hints and radius indicators
              g.selectAll('.drop-zone-hint').remove()
              g.selectAll('.drop-zone-radius').remove()
              
              // Check if dropped on a valid target
              const [x, y] = d3.pointer(event.sourceEvent, g.node())
              console.log('🎯 Drop position:', { x, y })
              console.log('🎯 Mouse event details:', { 
                clientX: event.sourceEvent.clientX, 
                clientY: event.sourceEvent.clientY,
                pageX: event.sourceEvent.pageX,
                pageY: event.sourceEvent.pageY
              })
              
              // Get all group nodes for detailed distance checking
              const allGroupNodes = g.selectAll('.tree-node')
                .filter((node: any) => node.data.type === 'group')
                .data()
              
              console.log('🎯 All groups in tree with positions:')
              allGroupNodes.forEach((node: any, index) => {
                const distance = Math.sqrt(
                  Math.pow(x - (node.y || 0), 2) + Math.pow(y - (node.x || 0), 2)
                )
                console.log(`  ${index + 1}. ${node.data.name}: pos(${node.x}, ${node.y}) -> distance=${distance.toFixed(2)}px`)
              })
              
              const dropTargets = g.selectAll('.tree-node')
                .filter((dropTargetNode: any) => {
                  if (dropTargetNode.data.type !== 'group') return false
                  // Note: In D3 tree layout, x and y coordinates are often swapped
                  // x represents the vertical position, y represents the horizontal position
                  const distance = Math.sqrt(
                    Math.pow(x - (dropTargetNode.y || 0), 2) + Math.pow(y - (dropTargetNode.x || 0), 2)
                  )
                  return distance < 80 // Increased from 50 to 80 pixels for much easier targeting
                })
                .data()
              
              console.log('🎯 Found drop targets within 80px:', dropTargets.length)
              
              if (dropTargets.length > 0) {
                const targetData = dropTargets[0] as d3.HierarchyPointNode<TreeNode>
                console.log('🎯 Dropping:', d.data.name, '->', targetData.data.name)
                onDrop(d.data, targetData.data)
              } else {
                console.log('🎯 No valid drop target found - trying DOM element detection')
                
                // Alternative approach: use the actual DOM element under the mouse
                const elementUnderMouse = document.elementFromPoint(event.sourceEvent.clientX, event.sourceEvent.clientY)
                console.log('🎯 Element under mouse:', elementUnderMouse)
                
                if (elementUnderMouse) {
                  // Find the closest tree node element
                  const treeNodeElement = elementUnderMouse.closest('.tree-node')
                  if (treeNodeElement) {
                    // Get the D3 data bound to this element
                    const nodeData = d3.select(treeNodeElement).datum() as d3.HierarchyPointNode<TreeNode>
                    if (nodeData && nodeData.data.type === 'group') {
                      console.log('🎯 Found group via DOM detection:', nodeData.data.name)
                      onDrop(d.data, nodeData.data)
                    } else {
                      console.log('🎯 Element under mouse is not a group:', nodeData?.data.type)
                    }
                  } else {
                    console.log('🎯 No tree node found under mouse')
                  }
                }
                
                // Check if there are any groups in the tree at all
                const allGroups = g.selectAll('.tree-node')
                  .filter((node: any) => node.data.type === 'group')
                  .data()
                
                console.log('🎯 All groups in tree:', allGroups.map((n: any) => ({ name: n.data.name, x: n.x, y: n.y })))
                
                // If no groups are found, show user guidance
                if (allGroups.length === 0) {
                  console.log('💡 No groups visible in tree - user needs to expand nodes first')
                  
                  // Show a helpful message to the user
                  // Create a temporary notification element
                  const notification = svg.append('g')
                    .attr('class', 'drop-guidance')
                    .style('pointer-events', 'none')
                  
                  // Background rectangle
                  notification.append('rect')
                    .attr('x', 50)
                    .attr('y', 50)
                    .attr('width', 400)
                    .attr('height', 80)
                    .attr('rx', 10)
                    .style('fill', 'rgba(59, 130, 246, 0.95)')
                    .style('stroke', '#3b82f6')
                    .style('stroke-width', 2)
                    .style('filter', 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))')
                  
                  // Icon
                  notification.append('text')
                    .attr('x', 70)
                    .attr('y', 80)
                    .style('font-size', '20px')
                    .style('fill', 'white')
                    .text('💡')
                  
                  // Message text
                  notification.append('text')
                    .attr('x', 100)
                    .attr('y', 75)
                    .style('font-size', '14px')
                    .style('font-weight', 'bold')
                    .style('fill', 'white')
                    .text('No groups visible to drop on!')
                  
                  notification.append('text')
                    .attr('x', 100)
                    .attr('y', 95)
                    .style('font-size', '12px')
                    .style('fill', 'rgba(255, 255, 255, 0.9)')
                    .text('Click the + button on nodes to expand and see groups')
                  
                  // Auto-remove the notification after 4 seconds
                  setTimeout(() => {
                    notification.transition()
                      .duration(500)
                      .style('opacity', 0)
                      .remove()
                  }, 4000)
                }
              }
              
              if (onDragEnd) {
                onDragEnd()
              }
            }, 50) // 50ms delay to ensure D3 operations complete
          } else if (isDragging) {
            // Clean up visual feedback even if no drop occurred
            // But keep it visible for a moment if there are no groups to help with guidance
            const allGroups = g.selectAll('.tree-node')
              .filter((node: any) => node.data.type === 'group')
              .data()
            
            if (allGroups.length === 0) {
              // Keep visual feedback for a bit longer to show the guidance message
              setTimeout(() => {
                svg.select('.drag-ghost').remove()
                
                d3.select(this).select('circle')
                  .style('stroke', '#ffffff')
                  .style('stroke-width', 3)
                  .style('opacity', 1)
                  .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
                
                d3.select(this).selectAll('text')
                  .style('opacity', 1)
                
                g.selectAll('.drop-zone-hint').remove()
              }, 2000) // Keep for 2 seconds to read the guidance
            } else {
              // Clean up immediately if there were groups available
              svg.select('.drag-ghost').remove()
              
              d3.select(this).select('circle')
                .style('stroke', '#ffffff')
                .style('stroke-width', 3)
                .style('opacity', 1)
                .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
              
              d3.select(this).selectAll('text')
                .style('opacity', 1)
              
              g.selectAll('.tree-node')
                .filter((dropTarget: any) => dropTarget.data.type === 'group')
                .select('circle')
                .style('stroke', '#ffffff')
                .style('stroke-width', 3)
                .style('stroke-dasharray', 'none')
                .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))')
              
              g.selectAll('.drop-zone-hint').remove()
            }
            
            if (onDragEnd) {
              onDragEnd()
            }
          }
          
          // Clean up drag state after a delay
          setTimeout(() => {
            d3.select(this).property('__isDragging', false)
            d3.select(this).property('__dragStartPos', null)
            d3.select(this).property('__dragProcessed', false)
          }, 100)
        })
      )

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
  }, [data, selectedNode, onNodeSelect, expandedNodes, onDragStart, onDragEnd, onDrop])

  // Context menu handlers
  const handleContextMenuAction = (action: string, node: TreeNode) => {
    console.log('Context menu action:', action, 'for node:', node.name)
    
    switch (action) {
      case 'expand':
        if (node.children?.length || node.type === 'group' || node.type === 'user') {
          // Trigger expansion by selecting the node - this will be handled by the parent component
          onNodeSelect(node)
        }
        break
      case 'collapse':
        // Trigger collapse by selecting the node - this will be handled by the parent component
        onNodeSelect(node)
        break
      case 'show-details':
        setEnhancedDetails({ isVisible: true, node })
        break
      case 'copy-id':
        navigator.clipboard.writeText(node.data.id)
        break
      case 'copy-name':
        navigator.clipboard.writeText(node.name)
        break
    }
    
    setContextMenu({ isVisible: false, position: { x: 0, y: 0 }, node: null })
  }

  const handleContextMenuClose = () => {
    setContextMenu({ isVisible: false, position: { x: 0, y: 0 }, node: null })
  }

  const handleEnhancedDetailsClose = () => {
    setEnhancedDetails({ isVisible: false, node: null })
  }

  // Add click handler to close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.isVisible) {
        setContextMenu({ isVisible: false, position: { x: 0, y: 0 }, node: null })
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [contextMenu.isVisible])

  return (
    <div className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">Group Membership Tree</h3>
        <p className="text-sm text-white/70">
          Click on nodes to explore • Right-click for options • Click the <span className="inline-flex items-center justify-center w-4 h-4 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold mx-1 text-white">+</span> buttons to expand users/groups • Use mouse wheel or controls to zoom • Drag users/devices to groups to manage memberships
        </p>
      </div>
      <div className="overflow-hidden rounded-lg">
        <svg ref={svgRef} className="w-full h-auto" />
      </div>
      
      {/* Context Menu */}
      {contextMenu.node && (
        <ContextMenu
          x={contextMenu.position.x}
          y={contextMenu.position.y}
          targetNode={contextMenu.node}
          isVisible={contextMenu.isVisible}
          onClose={handleContextMenuClose}
          onExpand={(nodeId) => handleContextMenuAction('expand', contextMenu.node!)}
          onCollapse={(nodeId) => handleContextMenuAction('collapse', contextMenu.node!)}
          onShowDetails={(node) => handleContextMenuAction('show-details', node)}
          expandedNodes={expandedNodes}
        />
      )}
      
      {/* Enhanced Details Modal */}
      {enhancedDetails.node && (
        <EnhancedDetails
          node={enhancedDetails.node}
          isVisible={enhancedDetails.isVisible}
          onClose={handleEnhancedDetailsClose}
        />
      )}
    </div>
  )
}
