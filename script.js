const houses = ["Gryffindor", "Hufflepuff", "Ravenclaw", "Slytherin", "Other"];

const impMaxes = {
    hp1: 1388,
    hp2: 1695,
    hp3: 2076,
    hp4: 3268,
    hp5: 4290,
    hp6: 2838,
    hp7: 3254
};

const assoMaxes = {
    hp1: 415,
    hp2: 659,
    hp3: 662,
    hp4: 898,
    hp5: 1052,
    hp6: 787,
    hp7: 970
};

const titles = {
    hp1: "1. Harry Potter and the Sorcerer's Stone",
    hp2: "2. Harry Potter and the Chamber of Secrets",
    hp3: "3. Harry Potter and the Prisoner of Azkaban",
    hp4: "4. Harry Potter and the Goblet of Fire",
    hp5: "5. Harry Potter and the Order of the Phoenix",
    hp6: "6. Harry Potter and the Half-Blood Prince",
    hp7: "7. Harry Potter and the Deathly Hollows"
}

let nodes = [];
let edges = [];

let allNodes = [];
let allEdges = [];

const edgeDefault = 'rgba(255, 255, 255, 0.1)';
const alphaTargetValue = 0.9;
const fontSize = 15;
const font = 'Open Sans Condensed:300';
const fontWeight = 'lighter';
const fontColor = 'white';

let edgeForce;
let simulation;
let dragDrop;
let collisionForce;

let edgeElements, nodeElements, textElements;

let nodesToChange = {};
let edgesToChange = {};

let width = window.innerWidth;
let height = window.innerHeight;
const repelForce = -2000;
let network;

let currentSeries = 'hp1';

// DOM ELEMENTS
// on the Network Page
let networkPage;
let seriesLeft, seriesRight, seriesTitle;

// on the Detail Page
let detailPage;
let backBtn;
let detailImg;
let detailName;
let detailDesc;
let learnMore;
let dotArea;

let isMouseDown = false;

init();

function init() {

    loadData();

    seriesLeft = document.getElementById('leftArrow');
    seriesRight = document.getElementById('rightArrow');
    seriesTitle = document.getElementById('series-title');

    networkPage = document.getElementById('network-page');
    detailPage = document.getElementById('detail-page');
    detailImg = document.getElementById('detail-img');
    backBtn = document.getElementById('goBack');
    detailName = document.getElementById('detail-name');
    detailDesc = document.getElementById('detail-desc');
    learnMore = document.getElementById('learn-more');
    dotArea = document.getElementById('dot-area');

    seriesLeft.addEventListener("click", goToPrev);
    seriesRight.addEventListener("click", goToNext);
    backBtn.addEventListener("click", closeDetailPage, true);
}

function cloneObj(original) {
    let keys = Object.keys(original);

    let obj = {};
    for (key of keys) {
        obj[key] = original[key];
    }
    return obj;
}

function loadData() {

    d3.json('/data/hp_nodes.json').then(json => {
        allNodes = json;

        d3.json('/data/hp_edges.json').then(json => {
            allEdges = json;

            for (node of allNodes[0]) {
                nodes.push(cloneObj(node));
            }

            for (edge of allEdges[0]) {
                edges.push(cloneObj(edge));
            }

            buildGraph();
        })
    });
}

function map(n, min, max, newMin, newMax) {
    let ratio = (newMax - newMin) / (max - min);
    return newMin + (n * ratio);
}

function getNodeSize(node) {
    let imp = node.importance;
    return map(imp, 1, impMaxes[currentSeries], 5, 70);
}

function getEdgeStrength(edge) {
    let asso = edge.associations;
    return map(asso, 1, assoMaxes[currentSeries], 0.1, 0.5);
}

function getNeighbours(node) {
    return edges.reduce((neighbours, edge) => {
        if (edge.target.id === node.id) {
            neighbours.push(edge.source.id);
        } else if (edge.source.id === node.id) {
            neighbours.push(edge.target.id);
        }
        return neighbours;
    }, [node.id]);
}

function getNodeFill(node) {
    if (getNodeSize(node) > 10) {
        return "url(#" + node.id + "_" + currentSeries + ")";
    } else {
        return '#1C2127';
    }
}

function getNodeBorderColor(node) {
    let houseIdx = node.house;
    switch (houses[houseIdx]) {
        case "Gryffindor":
            return '#DE2F6D';

        case "Hufflepuff":
            return 'rgba(255, 236, 0)';

        case "Ravenclaw":
            return 'rgba(0, 196, 255)';

        case "Slytherin":
            return 'rgba(0, 200, 30)';

        default:
            return 'rgba(255, 255, 255)';
    }
}

function getFontColor(node) {
    let houseIdx = node.house;
    switch (houses[houseIdx]) {
        case "Gryffindor":
            return 'rgba(255, 0, 145)';

        case "Hufflepuff":
            return 'rgba(255, 255, 0)';

        case "Ravenclaw":
            return 'rgba(0, 240, 255)';

        case "Slytherin":
            return 'rgba(0, 255, 150)';

        default:
            return 'rgba(255, 255, 255)';
    }
}

function getNeighbourNodeColor(node, neighbours) {

    let alpha = 0.3;

    if (Array.isArray(neighbours) && neighbours.indexOf(node.id) > -1) {
        alpha = 1;
    }

    let houseIdx = node.house;
    switch (houses[houseIdx]) {
        case "Gryffindor":
            return 'rgba(255, 0, 120, ' + alpha + ')';

        case "Hufflepuff":
            return 'rgba(255, 236, 0, ' + alpha + ')';

        case "Ravenclaw":
            return 'rgba(0, 196, 255, ' + alpha + ')';

        case "Slytherin":
            return 'rgba(0, 255, 66, ' + alpha + ')';

        default:
            return 'rgba(255, 255, 255, ' + alpha + ')';
    }
}

function isNeighbourLinked(node, edge) {
    return edge.target.id === node.id || edge.source.id === node.id;
}

function getNodeLabel(node, neighbours) {
    return Array.isArray(neighbours) && neighbours.indexOf(node.id) > -1 ? node.label : '';
}

function getEdgeColor(node, edge) {
    return isNeighbourLinked(node, edge) ? 'rgba(255, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)';
}

function getNewImportance(oldNode) {
    for (newNode of nodesToChange.fromNewNodes) {
        if (oldNode.id == newNode.id) {
            return newNode.importance;
        }
        return;
    }
}

let svg = d3.select('#svg-graph');
svg.attr('width', width).attr('height', height);

// svg groups to logically group the elements together
let edgeGroup = svg.append('g').attr('class', 'edges');
let nodeGroup = svg.append('g').attr('class', 'nodes');
let textGroup = svg.append('g').attr('class', 'texts');
let defGroup = svg.append("svg:defs");

function buildGraph() {

    // simulation setup with all forces
    edgeForce = d3
        .forceLink(edges)
        .id(node => node.id)
        .strength(getEdgeStrength);

    collisionForce = d3
        .forceCollide()
        .radius(node => {
            return getNodeSize(node) + 5;
        })
        .strength(5)
        .iterations(10);

    simulation = d3
        .forceSimulation()
        .nodes(nodes)
        .force('edge', edgeForce)
        .force('charge', d3.forceManyBody()
            .strength(repelForce)
            .distanceMax(width / 2))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collide', collisionForce);

    dragDrop = d3.drag()
        .on('start', node => {
            node.fx = node.x;
            node.fy = node.y;
        })
        .on('drag', node => {
            simulation.alphaTarget(alphaTargetValue).restart();
            node.fx = d3.event.x;
            node.fy = d3.event.y;
        })
        .on('end', node => {
            if (!d3.event.activate) {
                simulation.alphaTarget(0);
            }
            node.fx = null;
            node.fy = null;
        });

    let largeNodes = nodes.filter(node => {
        return getNodeSize(node) > 10;
    });

    let defElements = svg.append("svg:defs");


    defElements.selectAll(".pattern")
        .data(largeNodes)
        .enter()
        .append("pattern")
        .attr("id", lNode => lNode.id + "_" + currentSeries)
        .attr("width", "1")
        .attr("height", "1")
        .attr("class", "pattern")
        .append("image")
        .attr("xlink:href", lNode => '/images/' + currentSeries + "/" + lNode.id + '.png')
        .attr("width", lNode => getNodeSize(lNode) * 2)
        .attr("height", lNode => getNodeSize(lNode) * 2)
        .attr("x", 0)
        .attr("y", 0)

    edgeElements = edgeGroup
        .selectAll('line')
        .data(edges)
        .enter().append('line')
        .attr('stroke-width', 1)
        .attr('stroke', edgeDefault);

    nodeElements = nodeGroup
        .selectAll('circle')
        .data(nodes)
        .enter().append('circle')
        .attr('r', 0)
        .attr('fill', getNodeFill)
        .attr('stroke', getNodeBorderColor)
        .call(dragDrop)
        .on('mouseover', hoverNode)
        .on('mouseout', mouseoutNode)
        .on('click', onMouseDown);

    nodeElements.transition()
        .duration(1000)
        .attr('r', getNodeSize);

    textElements = textGroup
        .selectAll('text')
        .data(nodes)
        .enter().append('text')
        .text('')
        .attr('font-size', fontSize)
        .attr('font-family', font)
        .attr('font-weight', fontWeight)
        .attr('fill', getFontColor)
        .attr('dx', (node) => {
            return -(node.label.length * 5 / 2);
        })
        .attr('dy', (node) => (getNodeSize(node) + 20));

    simulation.nodes(nodes).on('tick', () => {
        nodeElements
            .attr('cx', node => node.x)   // Math.max(getNodeSize(node), Math.min(node.x, width - (getNodeSize(node) * 2)))
            .attr('cy', node => node.y);  // Math.max(getNodeSize(node), Math.min(node.y, height - (getNodeSize(node) * 2)))
        textElements
            .attr('x', node => node.x)    // Math.max(getNodeSize(node), Math.min(node.x, width - (getNodeSize(node) * 4)))
            .attr('y', node => node.y);   // Math.max(getNodeSize(node), Math.min(node.y, height - (getNodeSize(node) * 4)))
        edgeElements
            .attr('x1', edge => edge.source.x)   // Math.max(getNodeSize(edge.source), Math.min(edge.source.x, width - (getNodeSize(edge.source) * 4)))
            .attr('y1', edge => edge.source.y)   // Math.max(getNodeSize(edge.source), Math.min(edge.source.y, height - (getNodeSize(edge.source) * 4)))
            .attr('x2', edge => edge.target.x)   // Math.max(getNodeSize(edge.target), Math.min(edge.target.x, width - (getNodeSize(edge.target) * 4)))
            .attr('y2', edge => edge.target.y);
    });

    simulation.force('edge').links(edges);

}

function hoverNode(hoveredNode) {
    const neighbours = getNeighbours(hoveredNode);

    nodeElements
        .attr('stroke', node => getNeighbourNodeColor(node, neighbours));

    textElements
        .text(node => getNodeLabel(node, neighbours));

    edgeElements
        .attr('stroke', edge => getEdgeColor(hoveredNode, edge));
}

function mouseoutNode(node) {

    nodeElements
        .attr('stroke', node => getNodeBorderColor(node));

    textElements
        .text('');

    edgeElements
        .attr('stroke', 'rgba(255, 255, 255, 0.1)');
}

function onMouseDown(selectedNode) {
    console.log('mouse down');
    openDetailPage(selectedNode);
}

function openDetailPage(selectedNode) {

    composeDetailInformation(selectedNode);

    networkPage.classList.add('hidden');
    detailPage.classList.remove('hidden');

}

function closeDetailPage(e) {
    networkPage.classList.remove('hidden');
    detailPage.classList.add('hidden');
}

function loadNewData(newSeriesIdx) {

    console.log(newSeriesIdx);
    let newNodes = [...allNodes[newSeriesIdx]];
    let newEdges = [...allEdges[newSeriesIdx]];

    for (newNode of newNodes) {
        if (newNode.id == "Ron") {
            console.log("Ron's new importance is " + newNode.importance + " in the loadNewData function.");
        }
    }

    updateData(newNodes, newEdges);
}

function updateData(newNodes, newEdges) {

    let newNodeIDs = [];
    let nodeIDs = [];

    for (let newNode of newNodes) {
        newNodeIDs.push(newNode.id);
    }

    for (let node of nodes) {
        nodeIDs.push(node.id);
    }

    // filters out the nodes that are not in the new node list
    let nodesToRemove = nodes.filter(node => {
        return newNodeIDs.indexOf(node.id) == -1;
    });

    // filters out the new nodes to be added from the new node list
    let nodesToAdd = newNodes.filter(newNode => {
        return nodeIDs.indexOf(newNode.id) == -1;
    });

    nodesToChange.fromOldNodes = nodes.filter(node => {
        return newNodeIDs.indexOf(node.id) > -1;
    });

    nodesToChange.fromNewNodes = newNodes.filter(node => {
        return nodeIDs.indexOf(node.id) > -1;
    });

    // REMOVES AND ADDS THE NODES

    // remove old nodes
    nodesToRemove.forEach(node => {
        nodes.splice(nodes.indexOf(node), 1);
    });

    // add new nodes 
    nodesToAdd.forEach(node => {
        nodes.push(node);
    });

    // CHANGE VALUES IN THE EXISTING NODES

    // updates existing nodes
    nodesToChange.fromOldNodes.forEach(oldNode => {
        findAndUpdateNode(nodesToChange, oldNode);
    });

    // updates edges
    edges = newEdges;
}

function findAndUpdateNode(nodesToChange, oldNode) {

    nodesToChange.fromNewNodes.forEach(newNode => {
        if (oldNode.id == newNode.id) {
            let i = nodes.indexOf(oldNode);
            nodes[i].importance = newNode.importance;
        }
        return;
    });
}

function updateGraph() {

    let largeNodes = nodes.filter(node => {
        return getNodeSize(node) > 10;
    });

    let defElements = svg.append("svg:defs");

    defElements.selectAll(".pattern")
        .data(largeNodes)
        .enter()
        .append("pattern")
        .attr("id", lNode => lNode.id + "_" + currentSeries)
        .attr("width", "1")
        .attr("height", "1")
        .attr("class", "pattern")
        .append("image")
        .attr("xlink:href", lNode => {
            let url = '/images/' + currentSeries + "/" + lNode.id + '.png';
            console.log(url);
            return url;
        })
        .attr("width", lNode => getNodeSize(lNode) * 2)
        .attr("height", lNode => getNodeSize(lNode) * 2)
        .attr("x", 0)
        .attr("y", 0)

    // EDGES

    edgeElements = edgeGroup.selectAll('line')
        .data(edges, edge => edge.target.id + edge.source.id);

    edgeElements.exit().remove();

    let edgeEnter = edgeElements
        .enter()
        .append('line')
        .attr('stroke-width', 1)
        .attr('stroke', edgeDefault);

    edgeElements = edgeEnter.merge(edgeElements);

    // NODES
    nodeElements = nodeGroup.selectAll('circle')
        .data(nodes, node => node.id);

    nodeElements.exit().remove();

    let nodeEnter = nodeElements
        .enter()
        .append('circle')
        .attr('r', 0)
        .attr('fill', getNodeFill)
        .attr('stroke', getNodeBorderColor)
        .call(dragDrop)
        .on('mouseover', hoverNode)
        .on('mouseout', mouseoutNode)
        .on('click', onMouseDown);

    nodeElements = nodeEnter.merge(nodeElements);

    nodeElements.transition()
        .duration(10)
        .attr('fill', getNodeFill);

    nodeElements.transition()
        .duration(2000)
        .attr('r', getNodeSize);

    // TEXTS
    textElements = textGroup.selectAll('text')
        .data(nodes, node => node.id);

    textElements.exit().remove();

    let textEnter = textGroup.selectAll('text')
        .data(nodes)
        .enter()
        .append('text')
        .text('')
        .attr('font-size', fontSize)
        .attr('font-family', font)
        .attr('font-weight', fontWeight)
        .attr('fill', getFontColor)
        .attr('dx', (node) => {
            return -(node.label.length * 5 / 2);
        })
        .attr('dy', (node) => (getNodeSize(node) + 20));

    textElements = textEnter.merge(textElements);

}

function updateSimulation() {

    updateGraph();

    simulation.nodes(nodes).on('tick', () => {
        nodeElements
            .attr('cx', node => node.x)
            .attr('cy', node => node.y);
        textElements
            .attr('x', node => node.x)
            .attr('y', node => node.y);
        edgeElements
            .attr('x1', edge => edge.source.x)
            .attr('y1', edge => edge.source.y)
            .attr('x2', edge => edge.target.x)
            .attr('y2', edge => edge.target.y);
    });

    simulation.force('edge').links(edges);
    simulation.alphaTarget(alphaTargetValue).restart();

}

function composeDetailInformation(node) {

    while (dotArea.firstChild) {
        dotArea.removeChild(dotArea.firstChild);
    }

    // prepare data
    let imgfile = "./images/detail/" + node.id + ".png";
    let name = node.label;
    let desc = node.desc;
    let nIDs = getNeighbours(node);
    let dotInfos = {};

    maxSent = -1000;
    minSent = 1000;

    nIDs.forEach(nID => {


        if (nID != node.id) {
            for (edge of edges) {
                if ((edge.source.id == nID && edge.target.id == node.id) || (edge.source.id == node.id && edge.target.id == nID)) {
                    setDotInfo(nID, edge.sentiment, dotInfos);
                }

                if (edge.sentiment > maxSent) {
                    maxSent = edge.sentiment;
                }

                if (edge.sentiment < minSent) {
                    minSent = edge.sentiment;
                }
            }
        }

    });

    console.log(dotInfos);
    console.log("max sentiment score: " + maxSent);
    console.log("min sentiment score: " + minSent);

    detailImg.src = imgfile;
    detailName.textContent = name;
    detailDesc.textContent = desc;

    let urlVars = name.split(' ');
    let urlStr = urlVars.join('_');
    let url = "http://harrypotter.wikia.com/wiki/" + urlStr;

    learnMore.href = url;

    console.log(url);

    let absMinSent = Math.abs(minSent);
    let absMaxSent = Math.abs(maxSent);
    let maxY = absMinSent > absMaxSent ? absMinSent : absMaxSent;

    for (name in dotInfos) {
        let dotContainer = document.createElement("div");
        dotContainer.className = "data-dot-container";

        let dot = document.createElement("div");
        dot.className = "data-dot";

        dot.style.backgroundColor = dotInfos[name]['color'];

        let sent = dotInfos[name]['sentiment'];
        let top;
        if (sent >= 0) {
            top = map(Math.abs(sent), 0, maxY, 155, 5);
        } else {
            top = map(Math.abs(sent), 0, maxY, 155, 310);
        }

        top = Math.floor(top);

        dot.style.top = top + 'px';

        dot.value = name + " " + sent;

        dot.addEventListener('mouseover', onDotMouseOver, false);
        dot.addEventListener('mouseout', onDotMouseOut, false);

        dotContainer.appendChild(dot);

        dotArea.appendChild(dotContainer);

    }

}

function setDotInfo(nId, sent, nObj) {

    for (node of nodes) {
        if (node.id == nId) {
            nObj[node.label] = {};
            nObj[node.label]['color'] = getNodeBorderColor(node);
            nObj[node.label]['sentiment'] = sent;
        }
    }
}

function goToPrev(e) {

    let seriesIDs = Object.keys(titles);
    let seriesIdx = seriesIDs.indexOf(currentSeries);

    seriesIdx--;
    if (seriesIdx < 0) seriesIdx = 6;

    let seriesID = seriesIDs[seriesIdx];

    currentSeries = seriesID;
    console.log(currentSeries);

    seriesTitle.textContent = titles[seriesID];

    loadNewData(seriesIdx);
    updateSimulation();
}

function goToNext(e) {

    let seriesIDs = Object.keys(titles);
    let seriesIdx = seriesIDs.indexOf(currentSeries);

    seriesIdx++;
    if (seriesIdx > 6) seriesIdx = 0;

    let seriesID = seriesIDs[seriesIdx];

    currentSeries = seriesID;
    console.log(currentSeries);


    seriesTitle.textContent = titles[seriesID];

    loadNewData(seriesIdx);
    updateSimulation();
}

function onDotMouseOver(e) {

    let dotLabel = document.getElementById('dot-label');
    let valueStr = e.target.value;
    let values = valueStr.split(" ");
    let name = values[0] + " " + values[1];
    let sentiment = values[2];

    dotLabel.textContent = name + ': ' + sentiment;
    let targetPos = e.target.getBoundingClientRect();

    dotLabel.style.visibility = 'visible';

    let top = targetPos.top;
    let left = targetPos.left;

    if (sentiment >= 0) {
        top -= 310;
        left -= 5;
    } else {
        top -= 240;
        left -= 5;
    }
    dotLabel.style.top = top + 'px';
    dotLabel.style.left = left + 'px';

}

function onDotMouseOut(e) {
    let dotLabel = document.getElementById('dot-label');
    dotLabel.style.visibility = 'hidden';
}
