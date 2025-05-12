import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

export default function ForceDirectedGraph() {
  const svgRef = useRef(null);
  const [nodes, setNodes] = useState([
    { id: "Root", group: 0, label: "Root", val: 20 },
    { id: "Child1", group: 1, label: "Child 1", val: 15 },
    { id: "Child2", group: 1, label: "Child 2", val: 15 },
    { id: "Child3", group: 1, label: "Child 3", val: 15 },
    { id: "Grandchild1", group: 2, label: "Grandchild 1", val: 10 },
    { id: "Grandchild2", group: 2, label: "Grandchild 2", val: 10 },
    { id: "Grandchild3", group: 2, label: "Grandchild 3", val: 10 },
    { id: "Grandchild4", group: 2, label: "Grandchild 4", val: 10 },
    { id: "Grandchild5", group: 2, label: "Grandchild 5", val: 10 },
  ]);
  
  const [links, setLinks] = useState([
    { source: "Root", target: "Child1", value: 2 },
    { source: "Root", target: "Child2", value: 2 },
    { source: "Root", target: "Child3", value: 2 },
    { source: "Child1", target: "Grandchild1", value: 1 },
    { source: "Child1", target: "Grandchild2", value: 1 },
    { source: "Child2", target: "Grandchild3", value: 1 },
    { source: "Child2", target: "Grandchild4", value: 1 },
    { source: "Child3", target: "Grandchild5", value: 1 },
  ]);

  const [newNodeName, setNewNodeName] = useState("");
  const [selectedParent, setSelectedParent] = useState("Root");
  const [nodeToRemove, setNodeToRemove] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [nodeLabelEdit, setNodeLabelEdit] = useState("");

  const colors = d3.scaleOrdinal(d3.schemeCategory10);
  const width = 800;
  const height = 600;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const simulation = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => d.val + 10));

    svg.attr("viewBox", [0, 0, width, height]);

    // Draw the links
    const link = svg.append("g")
      .selectAll("line")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#999")
      .attr("stroke-width", d => Math.sqrt(d.value));

    // Draw the nodes
    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .enter()
      .append("g")
      .call(drag(simulation))
      .on("click", (event, d) => {
        setSelectedNode(d);
        setNodeLabelEdit(d.label);
        setShowForm(true);
        event.stopPropagation();
      });

    // Add circles to the node groups
    node.append("circle")
      .attr("r", d => d.val)
      .attr("fill", d => colors(d.group))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    // Add labels to the node groups
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", ".35em")
      .text(d => d.label)
      .attr("fill", "#fff")
      .style("font-size", "12px")
      .style("pointer-events", "none");

    // Set up the simulation tick function
    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("transform", d => `translate(${d.x},${d.y})`);
    });

    // Helper function for dragging
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }
      
      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }
      
      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }
      
      return d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended);
    }

    // Clear selection when clicking on the svg background
    svg.on("click", () => {
      setSelectedNode(null);
      setShowForm(false);
    });

  }, [nodes, links]);

  const addNode = () => {
    if (!newNodeName.trim()) return;
    
    const existingNode = nodes.find(node => node.id === newNodeName);
    if (existingNode) {
      alert("A node with this ID already exists.");
      return;
    }

    const parentNode = nodes.find(node => node.id === selectedParent);
    if (!parentNode) return;
    
    const newNode = {
      id: newNodeName,
      label: newNodeName,
      group: parentNode.group + 1,
      val: Math.max(parentNode.val - 5, 5)
    };
    
    const newLink = {
      source: selectedParent,
      target: newNodeName,
      value: 1
    };
    
    setNodes([...nodes, newNode]);
    setLinks([...links, newLink]);
    setNewNodeName("");
  };

  const removeNode = () => {
    if (nodeToRemove === "Root") {
      alert("Cannot remove the root node.");
      return;
    }

    const filteredNodes = nodes.filter(node => node.id !== nodeToRemove);
    const filteredLinks = links.filter(link => 
      link.source.id !== nodeToRemove && link.target.id !== nodeToRemove
    );
    
    setNodes(filteredNodes);
    setLinks(filteredLinks);
    setNodeToRemove("");
  };

  const updateNodeLabel = () => {
    if (!selectedNode || !nodeLabelEdit.trim()) return;
    
    const updatedNodes = nodes.map(node => {
      if (node.id === selectedNode.id) {
        return { ...node, label: nodeLabelEdit };
      }
      return node;
    });
    
    setNodes(updatedNodes);
    setShowForm(false);
    setSelectedNode(null);
  };

  const exportData = () => {
    const data = {
      nodes: nodes,
      links: links
    };
    
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = href;
    link.download = "force-directed-graph-data.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.nodes && data.links) {
          setNodes(data.nodes);
          setLinks(data.links);
        }
      } catch (error) {
        alert("Error importing data: " + error.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className="bg-gray-100 p-4 rounded-lg shadow-lg w-full mb-4">
        <h2 className="text-xl font-bold mb-4 text-center">Force-Directed Graph Editor</h2>
        
        <svg 
          ref={svgRef}
          className="bg-gray-800 rounded-lg shadow-inner mb-4 w-full"
          style={{ height: "500px" }}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold mb-2">Add Node</h3>
            <div className="flex flex-col space-y-2">
              <input
                type="text"
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                placeholder="New Node Name"
                className="border p-2 rounded"
              />
              <select
                value={selectedParent}
                onChange={(e) => setSelectedParent(e.target.value)}
                className="border p-2 rounded"
              >
                {nodes.map(node => (
                  <option key={node.id} value={node.id}>{node.label}</option>
                ))}
              </select>
              <button 
                onClick={addNode}
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Add Node
              </button>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-bold mb-2">Remove Node</h3>
            <div className="flex flex-col space-y-2">
              <select
                value={nodeToRemove}
                onChange={(e) => setNodeToRemove(e.target.value)}
                className="border p-2 rounded"
              >
                <option value="">Select Node to Remove</option>
                {nodes.map(node => (
                  <option key={node.id} value={node.id}>{node.label}</option>
                ))}
              </select>
              <button 
                onClick={removeNode}
                className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
              >
                Remove Node
              </button>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex justify-between">
          <div>
            <button 
              onClick={exportData}
              className="bg-green-500 text-white p-2 rounded hover:bg-green-600 mr-2"
            >
              Export Data
            </button>
            <label className="bg-purple-500 text-white p-2 rounded hover:bg-purple-600 cursor-pointer">
              Import Data
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
      
      {showForm && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
          <div className="bg-white p-4 rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold mb-2">Edit Node: {selectedNode.label}</h3>
            <div className="flex flex-col space-y-2">
              <input
                type="text"
                value={nodeLabelEdit}
                onChange={(e) => setNodeLabelEdit(e.target.value)}
                placeholder="Node Label"
                className="border p-2 rounded"
              />
              <div className="flex justify-end space-x-2">
                <button 
                  onClick={() => setShowForm(false)}
                  className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button 
                  onClick={updateNodeLabel}
                  className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}