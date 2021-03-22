// Add your JavaScript code here
const MAX_WIDTH = Math.max(1080, window.innerWidth);
const MAX_HEIGHT = 720;
const margin = {top: 40, right: 100, bottom: 40, left: 175};
const NUM_EXAMPLES = 10;

// Assumes the same graph width, height dimensions as the example dashboard. Feel free to change these if you'd like
let graph_1_width = (MAX_WIDTH / 2) - 10, graph_1_height = 350;
let graph_2_width = (MAX_WIDTH / 2) - 10, graph_2_height = 375;
let graph_3_width = MAX_WIDTH * 0.75, graph_3_height = 400;

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
    updateDataGraph1(curr_year, "Name");
}

let curr_region = "North America";
let curr_region_output = document.getElementById("region-value");
curr_region_output.innerHTML = curr_region;
function setRegion(region) {
    curr_region_output.innerHTML = region;
    curr_region = region;
    updateDataGraph2(curr_region);
}

let curr_genre = "Action";
let curr_genre_output = document.getElementById("genre-value");
curr_genre_output.innerHTML = curr_genre;
function setGenre(genre) {
    curr_genre_output.innerHTML = genre;
    curr_genre = genre;
    updateDataGraph3(curr_genre);
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
    updateDataGraph1(curr_year, "Name");
}

// Load data from video_games.csv file
d3.csv("data/video_games.csv").then(function(d) {
    data = d;
    updateDashboard();
});

// Update dashboard corresponding to the change of user input
function updateDashboard() {
    updateDataGraph1(curr_year, "Name");
    updateDataGraph2(curr_region);
    updateDataGraph3(curr_genre);
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
    .text("Global Sales (in millions)");

// Add y-axis label
let y_axis_text = svg_graph_1.append("text")
    .attr("transform", `translate(-150, ${(graph_1_height - margin.top - margin.bottom) / 2})`)
    .style("text-anchor", "middle");

// Add title
let title_graph_1 = svg_graph_1.append("text")
    .attr("transform", `translate(${(graph_1_width - margin.left - margin.right) / 2}, ${-25})`)
    .style("text-anchor", "middle")
    .style("font-size", 18);

// Define color scale
let color_graph_1 = d3.scaleOrdinal()
    .range(d3.quantize(d3.interpolateHcl("#c3818c", "#c381bf"), NUM_EXAMPLES));

function updateDataGraph1(currentYear, attr) {
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

//
//
// GRAPH 2
//
//

let svg_graph_2 = d3.select("#graph2")
    .append("svg")
    .attr("width", graph_2_width)
    .attr("height", graph_2_height)
    .append("g")
    .attr("transform", `translate(${graph_2_width / 2}, ${(graph_2_height / 2) + 10})`);

let radius = Math.min(graph_1_height, graph_1_width) / 2;

// Add title
let title_graph_2 = svg_graph_2.append("text")
    .attr("transform", `translate(0, ${-1 * radius})`)
    .style("text-anchor", "middle")
    .style("font-size", 18);

function updateDataGraph2(currentRegion) {
    let regionData = data;
    let dict = {}
    let curr_sales;
    switch (currentRegion) {
        case "North America":
            curr_sales = "NA_Sales";
            break;
        case "Europe":
            curr_sales = "EU_Sales";
            break;
        case "Japan":
            curr_sales = "JP_Sales";
            break;
        case "Other":
            curr_sales = "Other_Sales";
            break;
        default:
            curr_sales = "NA_Sales";
            break;
    };
    regionData.forEach(function(a) {
        let genre = trimText(a["Genre"]);
        if (dict[genre]) {
            dict[genre] += parseFloat(a[curr_sales]);
        } else {
            dict[genre] = parseFloat(a[curr_sales]);
        }
    });
    let clean_dict = {}
    let other_genres_sales = 0;
    for (let i = 0; i < Object.keys(dict).length; i++) {
        let k = Object.keys(dict)[i];
        if (dict[k] < 200) {
            other_genres_sales += dict[k];
        } else {
            clean_dict[k] = dict[k];
        }
    }
    clean_dict["Others"] = other_genres_sales;
    let color_graph_2 = d3.scaleOrdinal().domain(clean_dict).range(d3.schemeSet3);
    let pie = d3.pie().value(function(d) {return d.value}).sort(function(a, b) {return d3.ascending(a.value, b.value)});
    let data_ready = pie(d3.entries(clean_dict));
    let arc = d3.arc().innerRadius(radius * 0.4).outerRadius(radius * 0.8);
    let outerArc = d3.arc().innerRadius(radius * 0.9).outerRadius(radius * 0.9);
    let slices = svg_graph_2.selectAll('allSlices')
        .data(data_ready);
    slices.enter()
        .append('path')
        .transition()
        .duration(1000)
        .attr("d", arc)
        .attr("fill", function(d) {return color_graph_2(d.data.key)})
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.75);
    let lines = svg_graph_2.selectAll('allPolylines')
        .data(data_ready);
    lines.enter()
        .append('polyline')
        .attr("stroke", "black")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr('points', function(d) {
            var posA = arc.centroid(d);
            var posB = outerArc.centroid(d);
            var posC = posB;
            var midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            posC[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
            return [posA, posB, posC];
        });
    let labels = svg_graph_2.selectAll('allLabels')
        .data(data_ready);
    labels.enter()
        .append('text')
        .text(function(d) {return d.data.key + ' ( ' + d.data.value.toFixed(2) + ' M )'})
        .attr('transform', function(d) {
            var pos = outerArc.centroid(d);
            var midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            pos[0] = radius * 0.99 * (midAngle < Math.PI ? 1 : -1);
            return 'translate(' + pos + ')';
        })
        .style("text-anchor", function(d) {
            var midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            return (midAngle < Math.PI ? 'start' : 'end');
        });
    title_graph_2.text(`Top Genres in ${currentRegion}`);
    slices.exit().remove();
    lines.exit().remove();
    labels.exit().remove();
}

//
//
// GRAPH 3
//
//

let svg_graph_3 = d3.select("#graph3")
    .append("svg")
    .attr("width", graph_3_width)
    .attr("height", graph_3_height)
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

let tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);
// Declare axes and labels
let x_graph_3 = d3.scaleLinear().range([0, graph_3_width - margin.left - margin.right]);
let x_graph_3_label = svg_graph_3.append("g")
    .attr("transform", `translate(0, ${graph_3_height - margin.top - margin.bottom})`);
let y_graph_3 = d3.scaleBand().range([0, graph_3_height - margin.top - margin.bottom]);
let y_graph_3_label = svg_graph_3.append("g");
// Add axes' labels
svg_graph_3.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) / 2}, ${(graph_3_height - margin.top - margin.bottom) + 25})`)
    .style("text-anchor", "middle")
    .text("Count");
svg_graph_3.append("text")
    .attr("transform", `translate(-140, ${(graph_3_height - margin.top - margin.bottom) / 2})`)
    .style("text-anchor", "middle")
    .text("Publisher");
let color_graph_3 = d3.scaleOrdinal();
// Add title
let title_graph_3 = svg_graph_3.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) / 2}, ${-20})`)
    .style("text-anchor", "middle")
    .style("font-size", 18)
let mouseover = function(d) {
    let color_span = `<span style="color: ${color_graph_3(d["Publisher"])};">`;
    let html = `${d["Rank"]}<br/>
        ${color_span}${d["Publisher"]}</span><br/>
        Publisher: ${color_span}${d["Publisher"]}</span>`;
    
    tooltip.html(html)
        .style("left", `${(d3.event.pageX) + 30}px`)
        .style("top", `${(d3.event.pageY) - 100}px`)
        .style("box-shadow", `2px 2px 5px ${color_graph_3(d["Publisher"])}`)
        .transition()
        .duration(200)
        .style("opacity", 0.9)
};
let mouseout = function(d) {
    tooltip.transition()
        .duration(200)
        .style("opacity", 0);
};

function updateDataGraph3(currentGenre) {
    let filteredData = data.filter(function(d) {return d["Genre"] == currentGenre});
    let dict = {};
    filteredData.forEach(function(a) {
        let publisher = trimText(a["Publisher"]);
        if (dict[publisher]) {
            dict[publisher] += 1;
        } else {
            dict[publisher] = 1;
        }
    });
    let clean_data = [];
    for (let i = 0; i < Object.keys(dict).length; i++) {
        let key = Object.keys(dict)[i];
        clean_data.push({publisher: key, count: dict[key]});
    }
    clean_data = cleanData(clean_data, function(a, b) {return b.count - a.count}, NUM_EXAMPLES);
    x_graph_3.domain([0, d3.max(clean_data, function(d) {return d.count})]);
    x_graph_3_label.call(d3.axisBottom(x_graph_3));
    y_graph_3.domain(clean_data.map(function(d) {return d.publisher}));
    y_graph_3_label.call(d3.axisLeft(y_graph_3));
    let dots = svg_graph_3.selectAll("circle").data(clean_data);
    dots.enter()
        .append("circle")
        .on("mouseover", mouseover)
        .on("mouseout", mouseout)
        .merge(dots)
        .transition()
        .duration(1000)
        .attr("cx", function(d) {return x_graph_3(d.count)})
        .attr("cy", function(d) {return y_graph_3(d.publisher) + 15})
        .attr("r", 4)
        .attr("fill", "#570677")
        .style("opacity", 0.75);
    title_graph_3.text(`Top Publishers for ${currentGenre} games`);
    dots.exit().remove();
}