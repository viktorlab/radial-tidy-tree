import { data } from './data';

const diameter = 1600;

const width = diameter;
const height = diameter;

let i = 0;

const duration = 350;

let root;

const colorMap = {
  'Class A': '#001b36',
  'Class B': 'green',
  'Class C': 'blue',
  'Class F': 'red'
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
  const druggableColorScaleMap = new Map()
  //Find max value of approved drugs to set as upper bound for the color scale, 1 as lower
  // Map colorScale for class name, so it can be evaluated later with d.numberOfApprovedDrugs to color the node fill 
  for (const key in colorMap) {
    const maxApprovedDrugs = Math.max.apply(
      Math,
      nodes.filter((d) => d.type === undefined && d.numberOfApprovedDrugs > 0 && d.parent.parent.parent.name === key).map((d) => d.numberOfApprovedDrugs)
    );
    const colorScale = d3.scale.linear().domain([1, maxApprovedDrugs]).range(['#fff', colorMap[key]]);
    druggableColorScaleMap[key] = colorScale
  }



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
    .style('fill', (d) => (d.children ? 'lightsteelblue' : '#fff'));

  nodeUpdate
    .select('circle')
    .attr('r', 4.5)
    .style('fill', (d) => (d.type === undefined && d.isDruggable ? druggableColorScaleMap[d.parent.parent.parent.name](d.numberOfApprovedDrugs) : '#fff'));

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
