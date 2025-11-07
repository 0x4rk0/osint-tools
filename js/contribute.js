var IGNORED_PATH_SEGMENTS = {
      'Country Specific Tools': true,
      'Counties (A-Z)': true
    },
    resourceNameInput = document.getElementById('resource-name'),
    resourceLinkInput = document.getElementById('resource-link'),
    resourceTargetLabel = document.getElementById('resource-target-path'),
    addResourceButton = document.getElementById('add-resource'),
    jsonOutput = document.getElementById('json-output'),
    copyJsonButton = document.getElementById('copy-json'),
    downloadJsonButton = document.getElementById('download-json'),
    lastFocusedNode = null,
    root = null,
    margin = [20, 120, 20, 140],
    width = 960,
    height = 720,
    viewerWidth = 0,
    viewerHeight = 0,
    depthSpacing = 220,
    verticalSpacing = 1.35,
    i = 0,
    duration = 1250,
    currentSnippet = '';

if (jsonOutput) {
  jsonOutput.value = '';
}

var tree = d3.layout.tree()
    .size([height, width])
    .separation(function(a, b) {
      return (a.parent === b.parent ? 1.4 : 1.8);
    });

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var zoom = d3.behavior.zoom()
    .scaleExtent([0.2, 4])
    .on('zoom', onZoom);

updateLayoutDimensions();

var host = d3.select('#explorer');
if (host.empty()) {
  host = d3.select('#body');
}

var svg = host.append('svg:svg')
    .attr('width', viewerWidth)
    .attr('height', viewerHeight)
    .call(zoom);

var viewport = svg.append('svg:g');
var vis = viewport.append('svg:g')
    .attr('transform', 'translate(' + margin[3] + ',' + margin[0] + ')');

resizeCanvas();

d3.select(window).on('resize', resizeCanvas);

if (addResourceButton) {
  addResourceButton.addEventListener('click', handleAddResource);
}

if (copyJsonButton && jsonOutput) {
  copyJsonButton.addEventListener('click', function() {
    if (!currentSnippet) {
      alert('Add a resource first to generate JSON output.');
      return;
    }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentSnippet);
    } else if (jsonOutput) {
      jsonOutput.select();
      document.execCommand('copy');
    }
  });
}

if (downloadJsonButton && jsonOutput) {
  downloadJsonButton.addEventListener('click', function() {
    if (!currentSnippet) {
      alert('Add a resource first to generate JSON output.');
      return;
    }
    var blob = new Blob([currentSnippet], {type: 'application/json'});
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'arf.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

d3.json('arf.json', function(error, json) {
  if (error || !json) {
    if (jsonOutput) {
      jsonOutput.value = 'Unable to load arf.json: ' + (error ? error : 'Unknown error');
    }
    return;
  }
  root = json;
  root.x0 = height / 2;
  root.y0 = 0;

  function collapse(d) {
    if (d.children) {
      d._children = d.children;
      d._children.forEach(collapse);
      d.children = null;
    }
  }

  root.children.forEach(collapse);
  assignParents(root, null);
  warmCache(root);
  update(root);
  centerNode(root);
  setLastFocusedNode(root);
});

function update(source) {
  var nodes = tree.nodes(root).reverse();

  nodes.forEach(function(d) {
    d.y = d.depth * depthSpacing;
    d.x = d.x * verticalSpacing;
  });

  var node = vis.selectAll('g.node')
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  var nodeEnter = node.enter().append('svg:g')
      .attr('class', 'node')
      .attr('transform', function(d) { return 'translate(' + source.y0 + ',' + source.x0 + ')'; })
      .on('click', handleNodeClick);

  nodeEnter.append('svg:circle')
      .attr('r', 1e-6)
      .style('fill', function(d) { return d._children ? 'lightsteelblue' : '#fff'; });

  nodeEnter.append('a')
      .attr('target', '_blank')
      .attr('xlink:href', function(d) { return d.url; })
      .append('svg:text')
      .attr('x', function(d) { return d.children || d._children ? -10 : 10; })
      .attr('dy', '.35em')
      .attr('text-anchor', function(d) { return d.children || d._children ? 'end' : 'start'; })
      .text(function(d) { return d.name; })
      .style('fill-opacity', 1e-6);

  nodeEnter.append('svg:title')
      .text(function(d) { return d.description; });

  var nodeUpdate = node.transition()
      .duration(duration)
      .attr('transform', function(d) { return 'translate(' + d.y + ',' + d.x + ')'; });

  nodeUpdate.select('circle')
      .attr('r', 6)
      .style('fill', function(d) { return d._children ? 'lightsteelblue' : '#fff'; });

  nodeUpdate.select('text')
      .style('fill-opacity', 1);

  var nodeExit = node.exit().transition()
      .duration(duration)
      .attr('transform', function(d) { return 'translate(' + source.y + ',' + source.x + ')'; })
      .remove();

  nodeExit.select('circle')
      .attr('r', 1e-6);

  nodeExit.select('text')
      .style('fill-opacity', 1e-6);

  var link = vis.selectAll('path.link')
      .data(tree.links(nodes), function(d) { return d.target.id; });

  link.enter().insert('svg:path', 'g')
      .attr('class', 'link')
      .attr('d', function(d) {
        var o = {x: source.x0, y: source.y0};
        return diagonal({source: o, target: o});
      })
    .transition()
      .duration(duration)
      .attr('d', diagonal);

  link.transition()
      .duration(duration)
      .attr('d', diagonal);

  link.exit().transition()
      .duration(duration)
      .attr('d', function(d) {
        var o = {x: source.x, y: source.y};
        return diagonal({source: o, target: o});
      })
      .remove();

  nodes.forEach(function(d) {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

function centerNode(source) {
  var scale = zoom.scale();
  var x = -((source.y0 || source.y || 0));
  var y = -((source.x0 || source.x || 0));

  x = x * scale + viewerWidth / 2;
  y = y * scale + viewerHeight / 2;

  zoom.translate([x, y]);
  viewport.transition()
      .duration(duration)
      .attr('transform', 'translate(' + x + ',' + y + ') scale(' + scale + ')');
}

function onZoom() {
  viewport.attr('transform', 'translate(' + d3.event.translate[0] + ',' + d3.event.translate[1] + ') scale(' + d3.event.scale + ')');
}

function handleNodeClick(d) {
  var target = d && d.type === 'link' && d.parentRef ? d.parentRef : d;
  setLastFocusedNode(target || d);
  warmCache(target);

  if (d.type === 'link' && d.url) {
    if (typeof window !== 'undefined' && window.open) {
      window.open(d.url, '_blank');
    }
    if (d3.event) {
      d3.event.stopPropagation();
    }
    return;
  }

  toggle(d);
  update(d);
  centerNode(d);
}

function resizeCanvas() {
  updateLayoutDimensions();

  if (svg) {
    svg.attr('width', viewerWidth).attr('height', viewerHeight);
  }

  if (root) {
    update(root);
    centerNode(lastFocusedNode || root);
  }
}

function updateLayoutDimensions() {
  var minContentWidth = 360;
  var minContentHeight = 420;

  var viewportW = getViewportDimension(960, 'width') - 24;
  viewerWidth = Math.max(viewportW, minContentWidth + margin[1] + margin[3]);
  width = Math.max(viewerWidth - margin[1] - margin[3], minContentWidth);

  var viewportH = getViewportDimension(720, 'height') - 120;
  viewerHeight = Math.max(viewportH, minContentHeight + margin[0] + margin[2]);
  height = Math.max(viewerHeight - margin[0] - margin[2], minContentHeight);

  tree.size([height, width]);
}

function getViewportDimension(base, axis) {
  var win = typeof window !== 'undefined' ? window : null;
  var inner = win ? (axis === 'width' ? win.innerWidth : win.innerHeight) : 0;
  var docSize = (typeof document !== 'undefined' && document.documentElement) ?
      (axis === 'width' ? document.documentElement.clientWidth : document.documentElement.clientHeight) : 0;

  return Math.max(base, inner || 0, docSize || 0);
}

function assignParents(node, parent) {
  if (!node) {
    return;
  }
  node.parentRef = parent;
  var children = (node.children || []).concat(node._children || []);
  children.forEach(function(child) {
    assignParents(child, node);
  });
}

function warmCache(node) {
  if (!node || node._cacheWarmed) {
    return;
  }
  node._cacheWarmed = true;
  var children = (node.children || []).concat(node._children || []);
  children.forEach(function(child) {
    assignParents(child, node);
    warmCache(child);
  });
}

function setLastFocusedNode(node) {
  if (!node) {
    return;
  }
  lastFocusedNode = sanitizeTarget(node);

  if (resourceTargetLabel) {
    var path = buildPathString(lastFocusedNode);
    resourceTargetLabel.textContent = path || '(root)';
  }

  if (addResourceButton) {
    addResourceButton.disabled = !lastFocusedNode;
  }
}

function sanitizeTarget(node) {
  if (!node) {
    return null;
  }
  if (node.type === 'link' && node.parentRef) {
    return node.parentRef;
  }
  return node;
}

function handleAddResource() {
  if (!lastFocusedNode || !resourceNameInput || !resourceLinkInput) {
    return;
  }

  var name = (resourceNameInput.value || '').trim();
  var url = (resourceLinkInput.value || '').trim();

  if (!name || !url) {
    alert('Provide both a name and URL for the new resource.');
    return;
  }

  var target = lastFocusedNode;
  if (target._children && !target.children) {
    target.children = target._children;
    target._children = null;
  }
  if (!Array.isArray(target.children)) {
    target.children = [];
  }

  var newNode = {
    name: name,
    type: 'link',
    children: [],
    url: url,
    description: name + ' (added via in-browser workflow)'
  };

  target.children.push(newNode);
  assignParents(root, null);
  warmCache(target);
  update(target);
  centerNode(target);
  setLastFocusedNode(target);
  updateSnippetPreview(target, newNode);
  resourceNameInput.value = '';
  resourceLinkInput.value = '';
}

function updateSnippetPreview(target, newChild) {
  if (!jsonOutput || !target || !newChild) {
    return;
  }
  var snippet = buildSnippet(target, newChild);
  currentSnippet = JSON.stringify(snippet, null, 2);
  jsonOutput.value = currentSnippet;
}

function buildPathString(node) {
  var parts = [];
  var current = node;
  while (current) {
    if (current.name) {
      parts.push(current.name);
    }
    current = current.parentRef;
  }
  if (!parts.length) {
    return '';
  }
  parts = filterPathComponents(parts.reverse());
  return parts.join(' > ');
}

function filterPathComponents(parts) {
  return parts.filter(function(name, index) {
    if (!name) {
      return false;
    }
    var lower = name.toLowerCase();
    if (index === 0 && lower.indexOf('osint') === 0) {
      return false;
    }
    if (IGNORED_PATH_SEGMENTS[name]) {
      return false;
    }
    if (/^[a-z]$/i.test(name) && name.length === 1) {
      return false;
    }
    return true;
  });
}

function filterChainNodes(nodes) {
  return nodes.filter(function(node, index) {
    var name = node.name || '';
    var lower = name.toLowerCase();
    if (index === 0 && lower.indexOf('osint') === 0) {
      return false;
    }
    if (IGNORED_PATH_SEGMENTS[name]) {
      return false;
    }
    if (/^[a-z]$/i.test(name) && name.length === 1) {
      return false;
    }
    return true;
  });
}

function buildSnippet(target, newChild) {
  var chain = [];
  var current = target;
  while (current) {
    chain.push(current);
    current = current.parentRef;
  }
  chain = filterChainNodes(chain.reverse());
  if (!chain.length) {
    chain = [target];
  }

  function cloneNode(node) {
    var clone = {
      name: node.name,
      type: node.type
    };
    if (node.description) {
      clone.description = node.description;
    }
    if (node.url) {
      clone.url = node.url;
    }
    return clone;
  }

  function buildLevel(index) {
    var clone = cloneNode(chain[index]);
    if (index === chain.length - 1) {
      clone.children = [cloneNode(newChild)];
      clone.children[0].children = [];
    } else {
      clone.children = [buildLevel(index + 1)];
    }
    return clone;
  }

  return buildLevel(0);
}

function toggle(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
}
