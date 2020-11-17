import { data } from './data';

const diameter = 1600;

const width = diameter;
const height = diameter;

let i = 0;

const duration = 350;

let root;
let druggableColor = [
  {
    type: "class",
    color: "#720899"
  },
  {
    type: "class",
    color: "green"
  },
  {
    type: "class",
    color: "#302999"
  },
  {
    type: "class",
    color: "#921029"
  }
]

let groupColors = [
  {
    type: "group",
    color: "#d04fff"
  },
  {
    type: "group",
    color: "#00ff00"
  },
  {
    type: "group",
    color: "#4545ff"
  },
  {
    type: "group",
    color: "#db5555"
  }
]

let subgroupColors = [
  {
    type: "group",
    color: "#8f4aac"
  },
  {
    type: "group",
    color: "#65ac60"
  },
  {
    type: "group",
    color: "#6464c6"
  },
  {
    type: "group",
    color: "#d01625"
  }
]

let classColors = [
  {
    type: "druggable",
    color: "#d777cd"
  },
  {
    type: "druggable",
    color: "#b0ffb0"
  },
  {
    type: "druggable",
    color: "#9e9eff"
  },
  {
    type: "druggable",
    color: "#ee8498"
  }
]

const colorMap = {
  /* classname, classColor,    groupColor     subgroupColors,     protein color (if druggable)             */
  'Class A': [classColors[0], groupColors[0], subgroupColors[0], druggableColor[0]],
  'Class B': [classColors[1], groupColors[1], subgroupColors[1], druggableColor[1]],
  'Class C': [classColors[2], groupColors[2], subgroupColors[2], druggableColor[2]],
  'Class F': [classColors[3], groupColors[3], subgroupColors[3], druggableColor[3]]
};

const tree = d3.layout
.tree()
.size([360, diameter / 2 - 80])
.separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

const diagonal = d3.svg.diagonal.radial().projection((d) => [d.y, (d.x / 180) * Math.PI]);

const svg = d3
.select('body')
.append('svg')
.attr('width', width)
.attr('height', height)
.append('g')
.attr('transform', 'translate(' + diameter / 2 + ',' + diameter / 2 + ')');

root = data;
root.x0 = height / 2;
root.y0 = 0;

update(root);

d3.select(self.frameElement).style('height', '1600px');

function update(source) {
  // Compute the new tree layout.
  var nodes = tree.nodes(root),
    links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach((d) => (d.y = d.depth * 160));

  // Update the nodes…
  const node = svg.selectAll('g.node').data(nodes, (d) => {
    return d.id || (d.id = ++i);
  });

  // Enter any new nodes at the parent's previous position.
  const nodeEnter = node.enter().append('g').attr('class', 'node').on('click', handleClick);

  nodeEnter
  .append('circle')
  .attr('r', 1e-6)
  .style('fill', (d) => (d._children ? 'lightsteelblue' : '#fff'));

  nodeEnter
  .append('text')
  .attr('x', (d) => {
    const sign = d.x < 180 ? 1 : -1;
    return (d.type === undefined ? 20 : 10) * sign;
  })
  .attr('dy', '.35em')
  .attr('text-anchor', (d) => (d.x < 180 ? 'start' : 'end'))
  .text((d) => d.name)
  .attr('dz', (d) => (d.type == undefined ? 0 : 999))
  .style('font-weight', (d) => (d.type == undefined ? 'normal' : 'bold'))
  .style('fill-opacity', 1e-6);

  // Transition nodes to their new position.
  const nodeUpdate = node
  .transition()
  .duration(duration)
  .attr('transform', (d) => 'rotate(' + (d.x - 90) + ')translate(' + d.y + ')');

  nodeUpdate
  .select('circle')
  .attr('r', 4.5)
  .style('fill', (d) => {
    return getColorForNode(d)
  });

  nodeUpdate
  .select('circle')
  .attr('r', 4.5)
  .style('fill', (d) => getColorForNode(d));

  nodeUpdate
  .select('text')
  .style('fill-opacity', 1)
  .attr('transform', (d) => (d.x < 180 ? 'translate(0)' : 'rotate(180)'));

  const nodeExit = node.exit().transition().duration(duration).remove();

  nodeExit.select('circle').attr('r', 1e-6);

  nodeExit.select('text').style('fill-opacity', 1e-6);

  // Update the links…
  const link = svg.selectAll('path.link').data(links, (d) => d.target.id);

  // Enter any new links at the parent's previous position.
  link
  .enter()
  .insert('path', 'g')
  .attr('class', 'link')
  .attr('d', (d) => {
    const o = { x: source.x0, y: source.y0 };
    return diagonal({ source: o, target: o });
  });

  // Transition links to their new position.
  link.transition().duration(duration).attr('d', diagonal);

  // Transition exiting nodes to the parent's new position.
  link
  .exit()
  .transition()
  .duration(duration)
  .attr('d', (d) => {
    const o = { x: source.x, y: source.y };
    return diagonal({ source: o, target: o });
  })
  .remove();

  // Stash the old positions for transition.
  nodes.forEach((d) => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
}

// Toggle children on click.
function handleClick(d) {
  if (d.drugList && d.drugList.length > 0) {
    showDrugList(d.drugList);
  }

  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }

  update(d);
}

// Collapse nodes
function collapse(d) {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
}

function getColorForNode(d) {
  if (d.type === 'class') {
    const classColor = colorMap[d.name][0];
    return classColor.color;
  } else if (d.type === undefined && d.isDruggable) {
    return colorMap[d.parent.parent.parent.name][3].color
  } else if (d.type === 'group' || d.type === 'subgroup') {
    const colorKey = d.type === 'group' ? d.parent.name : d.parent.parent.name
    const colors = colorMap[colorKey]
    const index = d.type === 'group' ? 1 : 2
    return colors[index].color
  }

}

function showDrugList(drugList) {
  buildList(drugList);

  $('#drugListModal').modal({
    show: true
  });
}

function buildList(data) {
  data.forEach((d) => {
    $('.body-content').append(`
    <ul class='list-group'>
      <li class='list-group-item'>${d}</li>
    </ul>
    `);
  });
}

$('#drugListModal').on('hidden.bs.modal', () => {
  $('.body-content').html('');
});
