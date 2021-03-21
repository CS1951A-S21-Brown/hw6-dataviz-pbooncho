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
let curr_year = 2010;
let slider = new Slider('#year', {});
let attr_input = document.getElementById("attrInput");

// Load data from video_games.csv file
d3.csv("data/video_games.csv").then(function(d) {
    data = d;
    updateDashboard();
    createGraph(2010);
});

// Update curr_year on slideStop of range slider
slider.on("slideStop", function(range) {
    curr_year = range[0];
    updateDashboard();
});

/**
 * Set the data source
 */
function setData(attr) {
    cur_attr = attr;
    attr_input.placeholder = sentenceCase(attr);
    updateDashboard();
}

/**
 * Updates cur attribute with new artist or song from user input
 */
 function setAttr() {
    if (cur_attr === "artist") {
        cur_artist = attr_input.value;
    } else {
        cur_song = attr_input.value;
    }
    updateDashboard();
}

/**
 * Updates dashboard scatterplot and barplot after change in date or cur_attr
 */
function updateDashboard() {
    updateData(cur_start_year, cur_end_year, cur_attr);
    if (cur_attr === "artist") {
        setScatter(cur_start_year, cur_end_year, cur_artist);
    } else {
        setScatterSong(cur_start_year, cur_end_year, cur_song);
    }
}

/**
 * Abbreviates and shortens a given label by adding ellipses
 */
function trimText(label) {
    if (label.length > 20) {
        return label.substring(0, 20) + "..."
    }
    return label;
}

/**
 * Finds all artists collaborating on a song by splitting on predefined text
 * and returns a list of all artists
 */
 function splitArtist(artist) {
    let song_artists = artist.split(/(?:Featuring|&|,)/);
    return song_artists.map(s => trimText(s.trim()));
}

/**
 * Converts a text to sentence case
 */
function sentenceCase(word) {
    return `${word[0].toUpperCase()}${word.substring(1)}`;
}

/**
 * Checks if a date falls within a provided year range
 */
function validYear(start, end, cur) {
    return (Date.parse(start) < Date.parse(cur)) &&
        (Date.parse(cur) < Date.parse(end));
}

let svg_graph_1 = d3.select("#barplot")
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
let countRef_graph_1 = svg_graph_1.append("g");
let y_axis_label_graph_1 = svg_graph_1.append("g").attr("id", "y_bar_label");
// Add x-axis label
svg_graph_1.append("text")
    .attr("transform", `translate(${(bar_width - margin.left - margin.right) / 2}, ${(bar_height - margin.top - margin.bottom) + 15})`)
    .style("text-anchor", "middle")
    .text("Rank");
// Add y-axis label
let y_axis_text = svg_graph_1.append("text")
    .attr("transform", `translate(-120, ${(bar_height - margin.top - margin.bottom) / 2})`)
    .style("text-anchor", "middle");
// Add title
svg_graph_1.append("text")
    .attr("transform", `translate(${(bar_width - margin.left - margin.right) / 2}, ${-20})`)
    .style("text-anchor", "middle")
    .style("font-size", 15)
    .text("Top 10 video games of all time / a specific year");
// Define color scale
let color_graph_1 = d3.scaleOrdinal()
    .range(d3.quantize(d3.interpolateHcl("#c3818c", "#c381bf"), NUM_EXAMPLES));

function updateData(startYear, endYear, attr) {
    // Filter data by year
    let filteredData = data.filter(function(a) {
        return validYear(startYear, endYear, a.date);
    });
    // Store counts for each attr in hash
    let hash = {};
    filteredData.forEach(function(a) {
        let cleaned = trimText(a[attr]);
        if (hash[cleaned]) {
            hash[cleaned] += 1;
        }  else {
            hash[cleaned] = 1;
        }
    });
    
    // Post-process data before sorting and splicing
    let attr_data = [];
    for (let i=0; i < Object.keys(hash).length; i++) {
        let k = Object.keys(hash)[i];
        // Store each entry as hash of attr, count, and id
        attr_data.push({attr: k, count: hash[k], id: i});
    }
    attr_data = cleanData(attr_data, function(a, b) {return parseInt(b.count) - parseInt(a.count)}, NUM_EXAMPLES);
    
    // Update the x axis domain with the max count of the provided data
    x_graph_1.domain([0, d3.max(attr_data, function(d) { return parseInt(d.count); })]);
    // Update the y axis domains with the desired attribute
    y_graph_1.domain(attr_data.map(function(d) { return d.attr }));
    color_graph_1.domain(attr_data.map(function(d) { return d.attr }));
    
    // Render y-axis label
    y_axis_label_graph_1.call(d3.axisLeft(y_bar).tickSize(0).tickPadding(10));
    let bars = svg_graph_1.selectAll("rect").data(attr_data);
    
    // Render the bar elements on the DOM
    bars.enter()
        .append("rect")
        // Set up mouse interactivity functions
        .on("mouseover", mouseover_barplot)
        .on("mouseout", mouseout_barplot)
        .on("click", click_barplot)
        .merge(bars)
        .transition()
        .duration(1000)
        .attr("fill", function(d) { return color_graph_1(d.attr) })
        .attr("x", x_graph_1(0))
        .attr("y", function(d) { return y_graph_1(d.attr); })
        .attr("width", function(d) { return x_graph_1(parseInt(d.count)); })
        .attr("height",  y_graph_1.bandwidth())
        .attr("id", function(d) { return `rect-${d.id}` });
    /*
        In lieu of x-axis labels, display the count of the artist next to its bar on the bar plot.
     */
    let counts = countRef_graph_1.selectAll("text").data(attr_data);
    // Render the text elements on the DOM
    counts.enter()
        .append("text")
        .merge(counts)
        .transition()
        .duration(1000)
        .attr("x", function(d) { return x_graph_1(parseInt(d.count)) + 10; })
        .attr("y", function(d) { return y_graph_1(d.attr) + 10; })
        .style("text-anchor", "start")
        .text(function(d) {return parseInt(d.count);});
    // Add y-axis text and chart title
    y_axis_text.text(sentenceCase(attr));
    // Remove elements not in use if fewer groups in new dataset
    bars.exit().remove();
    counts.exit().remove();
}

/**
 * Cleans the provided data using the given comparator then strips to first numExamples
 * instances
 */
function cleanData(data, comparator, numExamples) {
    return data.sort(comparator).slice(0, numExamples);
}

// Darken bar fill in barplot on mouseover
let mouseover_barplot = function(d) {
    svg_barplot.select(`#rect-${d.id}`).attr("fill", function(d) {
        return darkenColor(color(d.attr), 0.5);
    });
};

// Set scatterplot to song or artist based on cur_attr
let click_barplot = function(d) {
    if (cur_attr === 'artist') {
        cur_artist = d.attr;
        setScatter(cur_start_year, cur_end_year, cur_artist);
    } else {
        cur_song = d.attr;
        setScatterSong(cur_start_year, cur_end_year, cur_song);
    }
};

// Restore bar fill to original color on mouseout
let mouseout_barplot = function(d) {
    svg_barplot.select(`#rect-${d.id}`).attr("fill", function(d) {
        return color(d.attr)
    });
};
    