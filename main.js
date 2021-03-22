// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 175};
const NUM_EXAMPLES = 10;

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 250;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 275;
let graph_3_width = MAX_WIDTH / 2, graph_3_height = 575;

let data;
let all_time_toggle = false;
let slider = document.getElementById("year");
let curr_year = slider.value;
let curr_year_output = document.getElementById("year-value");
curr_year_output.innerHTML = slider.value;
// Update the current slider value
slider.oninput = function() {
    curr_year_output.innerHTML = this.value;
    curr_year = this.value;
    updateDashboard();
}

function allTimeHandle() {
    let checkBox = document.getElementById("allTimeBox");
    if (checkBox.checked) {
        all_time_toggle = true;
        curr_year_output.innerHTML = "All-time";
    } else {
        all_time_toggle = false;
        curr_year_output.innerHTML = curr_year;
    }
    updateDashboard();
}

// Load data from video_games.csv file
d3.csv("data/video_games.csv").then(function(d) {
    data = d;
    updateDashboard();
});

// Update dashboard corresponding to the change of user input
function updateDashboard() {
    updateData(curr_year, "Name");
}

/**
 * Converts a text to sentence case
 */
function sentenceCase(word) {
    return `${word[0].toUpperCase()}${word.substring(1)}`;
}

function trimText(label) {
    if (label.length > 20) {
        return label.substring(0, 20) + "..."
    }
    return label;
}

function darkenColor(color, percentage) {
    return d3.hsl(color).darker(percentage);
}

function validYear(searchYear, movieYear) {
    if (all_time_toggle == false) {
        return searchYear == movieYear;
    } else {
        return true;
    }
}

//
//
// GRAPH 1
//
//

let svg_graph_1 = d3.select("#graph1")
    .append("svg")
    .attr("width", graph_1_width)
    .attr("height", graph_1_height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

let x_graph_1 = d3.scaleLinear()
    .range([0, graph_1_width - margin.left - margin.right]);

let y_graph_1 = d3.scaleBand()
    .range([0, graph_1_height - margin.top - margin.bottom])
    .padding(0.1);

let salesRef_graph_1 = svg_graph_1.append("g");

let y_axis_label_graph_1 = svg_graph_1.append("g");

// Add x-axis label
svg_graph_1.append("text")
    .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2}, ${(graph_1_height - margin.top - margin.bottom) + 25})`)
    .style("text-anchor", "middle")
    .text("Global Sales");

// Add y-axis label
let y_axis_text = svg_graph_1.append("text")
    .attr("transform", `translate(-150, ${(graph_1_height - margin.top - margin.bottom) / 2})`)
    .style("text-anchor", "middle");

// Add title
let title_graph_1 = svg_graph_1.append("text")
    .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2}, ${-25})`)
    .style("text-anchor", "middle")
    .style("font-size", 15);

// Define color scale
let color_graph_1 = d3.scaleOrdinal()
    .range(d3.quantize(d3.interpolateHcl("#c3818c", "#c381bf"), NUM_EXAMPLES));

function updateData(currentYear, attr) {
    // Filter data by year
    let filteredData = data.filter(function(a) {return validYear(currentYear, a["Year"]);});
    filteredData.forEach(function(a) {a[attr] = trimText(a[attr])});
    
    attr_data = cleanData(filteredData, function(a, b) {return b["Global_Sales"] - a["Global_Sales"]}, NUM_EXAMPLES);

    x_graph_1.domain([0, d3.max(attr_data, function(d) { return d["Global_Sales"]; })]);
    y_graph_1.domain(attr_data.map(function(d) { return d[attr] }));
    color_graph_1.domain(attr_data.map(function(d) { return d[attr] }));
    
    // Render y-axis label
    y_axis_label_graph_1.call(d3.axisLeft(y_graph_1).tickSize(0).tickPadding(10));
    let bars = svg_graph_1.selectAll("rect").data(attr_data);
    
    // Render the bar elements on the DOM
    bars.enter()
        .append("rect")
        // Set up mouse interactivity functions
        .on("mouseover", function(d) {
            svg_graph_1.select(`#rect-${d["Rank"]}`).attr("fill", function(d) {
                return darkenColor(color_graph_1(d[attr]), 0.75);
            });
        })
        .on("mouseout", function(d) {
            svg_graph_1.select(`#rect-${d["Rank"]}`).attr("fill", function(d) {
                return color_graph_1(d[attr])
            });
        })
        .merge(bars)
        .transition()
        .duration(1000)
        .attr("fill", function(d) { return color_graph_1(d[attr]) })
        .attr("x", x_graph_1(0))
        .attr("y", function(d) { return y_graph_1(d[attr]); })
        .attr("width", function(d) { return x_graph_1(d["Global_Sales"]); })
        .attr("height",  y_graph_1.bandwidth())
        .attr("id", function(d) { return `rect-${d["Rank"]}` });
    
    let sales = salesRef_graph_1.selectAll("text").data(attr_data);
    // Render the text elements on the DOM
    sales.enter()
        .append("text")
        .merge(sales)
        .transition()
        .duration(1000)
        .attr("x", function(d) { return x_graph_1(d["Global_Sales"]) + 10; })
        .attr("y", function(d) { return y_graph_1(d[attr]) + 10; })
        .style("text-anchor", "start")
        .text(function(d) {return d["Global_Sales"];});
    y_axis_text.text(sentenceCase(attr));
    if (all_time_toggle == true) {
        title_graph_1.text("All-time Top 10 Video Games");
    } else {
        title_graph_1.text(`Top 10 Video Games in ${currentYear}`);
    }
    bars.exit().remove();
    sales.exit().remove();
}

/**
 * Cleans the provided data using the given comparator then strips to first numExamples
 * instances
 */
function cleanData(data, comparator, numExamples) {
    return data.sort(comparator).slice(0, numExamples);
}

// Darken bar fill in barplot on mouseover
let mouseover_graph1 = function(d) {
    svg_graph_1.select(`#rect-${d["Rank"]}`).attr("fill", function(d) {
        return darkenColor(color_graph_1(d["Name"]), 0.75);
    });
};

// Restore bar fill to original color on mouseout
let mouseout_graph1 = function(d) {
    svg_graph_1.select(`#rect-${d["Rank"]}`).attr("fill", function(d) {
        return color_graph_1(d["Name"])
    });
};

//
//
// GRAPH 2
//
//

let curr_region = document.getElementById("region").value;
data = {a: 9, b: 20, c:30, d:8, e:12}
let svg_graph_2 = d3.select("#graph2")
    .append("svg")
    .attr("width", graph_2_width)
    .attr("height", graph_2_height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

let radius = Math.min(graph_1_height, graph_1_width) / 2;
let color_graph_2 = d3.scaleOrdinal().domain(data).range(d3.schemeSet2);
let pie = d3.pie().value(function(d) {return d.value});
let data_ready = pie(d3.entries(data))
let arcGenerator = d3.arc().innerRadius(20).outerRadius(radius);
svg_graph_2.selectAll("mySlices")
    .data(data_ready)
    .enter()
    .append("path")
    .attr("d", arcGenerator)
    .attr("fill", function(d) {return color_graph_2(d.data.key)})
    .attr("stroke", "black")
    .style("stroke-width", "2px")
    .style("opacity", 0.75);
svg_graph_2.selectAll("mySlices")
    .data(data_ready)
    .enter()
    .append("text")
    .text(function(d) {return d.data.key})
    .attr("transform", function(d) {return "translate(" + arcGenerator.centroid(d) + ")"})
    .style("text-anchor", "middle")
    .style("font-size", 17);