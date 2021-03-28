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
let stat_toggle = true;
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

// Update graph1 representation to all-time data
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

let curr_region = "North America";
let curr_region_output = document.getElementById("region-value");
curr_region_output.innerHTML = curr_region;
// Update current region based on button clicked in graph2
function setRegion(region) {
    curr_region_output.innerHTML = region;
    curr_region = region;
    updateDataGraph2(curr_region);
}

let curr_genre = "Action";
let curr_genre_output = document.getElementById("genre-value");
curr_genre_output.innerHTML = curr_genre;
// Update current genre based on button clicked in graph3
function setGenre(genre) {
    curr_genre_output.innerHTML = genre;
    curr_genre = genre;
    updateDataGraph3(curr_genre);
}

function statHandle() {
    let checkBox = document.getElementById("statBox");
    if (checkBox.checked) {
        stat_toggle = true;
    } else {
        stat_toggle = false;
    }
    updateDataGraph3(curr_genre);
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

// Converts a text to sentence case
function sentenceCase(word) {
    return `${word[0].toUpperCase()}${word.substring(1)}`;
}

function trimText(label) {
    if (label.length > 30) {
        return label.substring(0, 30) + "..."
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
    // filteredData = cleanData(filteredData, function(a, b) {return b["Global_Sales"] - a["Global_Sales"]}, 3000);
    // Combine the same games but different platforms
    let dict = {};
    let dict2 = {};
    filteredData.forEach(function(a) {
        let at = a[attr];
        if (dict[at]) {
            dict[at] += parseFloat(a["Global_Sales"]);
        }  else {
            dict[at] = parseFloat(a["Global_Sales"]);
            dict2[at] = a["Rank"];
        }
    });
    let attr_data = [];
    for (let i=0; i < Object.keys(dict).length; i++) {
        let key = Object.keys(dict)[i];
        attr_data.push({attr: trimText(key), sales: dict[key].toFixed(2), rank: dict2[key]});
    }

    attr_data = cleanData(attr_data, function(a, b) {return b.sales - a.sales}, NUM_EXAMPLES);
    x_graph_1.domain([0, attr_data[0].sales]);
    // x_graph_1.domain([0, d3.max(attr_data, function(d) {return d.sales})]);
    y_graph_1.domain(attr_data.map(function(d) { return d.attr }));
    color_graph_1.domain(attr_data.map(function(d) { return d.attr }));
    
    // Render y-axis label
    y_axis_label_graph_1.call(d3.axisLeft(y_graph_1).tickSize(0).tickPadding(10));
    let bars = svg_graph_1.selectAll("rect").data(attr_data);
    
    // Render the bar elements on the DOM
    bars.enter()
        .append("rect")
        // Set up mouse interactivity functions
        .on("mouseover", function(d) {
            svg_graph_1.select(`#rect-${d.rank}`).attr("fill", function(d) {
                return darkenColor(color_graph_1(d.attr), 0.75);
            });
        })
        .on("mouseout", function(d) {
            svg_graph_1.select(`#rect-${d.rank}`).attr("fill", function(d) {
                return color_graph_1(d.attr)
            });
        })
        .merge(bars)
        .transition()
        .duration(1000)
        .attr("fill", function(d) { return color_graph_1(d.attr) })
        .attr("x", x_graph_1(0))
        .attr("y", function(d) { return y_graph_1(d.attr); })
        .attr("width", function(d) { return x_graph_1(d.sales); })
        .attr("height",  y_graph_1.bandwidth())
        .attr("id", function(d) { return `rect-${d.rank}` });
    
    let sales = salesRef_graph_1.selectAll("text").data(attr_data);
    // Render the text elements on the DOM
    sales.enter()
        .append("text")
        .merge(sales)
        .transition()
        .duration(1000)
        .attr("x", function(d) { return x_graph_1(d.sales) + 10; })
        .attr("y", function(d) { return y_graph_1(d.attr) + 10; })
        .style("text-anchor", "start")
        .text(function(d) {return d.sales;});
    y_axis_text.text(sentenceCase(attr));
    if (all_time_toggle == true) {
        title_graph_1.text("All-time Top 10 Video Games");
    } else {
        title_graph_1.text(`Top 10 Video Games released in ${currentYear}`);
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
    .attr("transform", `translate(${graph_2_width / 2}, ${graph_2_height / 2})`);

let radius = Math.min(graph_1_height, graph_1_width) / 2;

function updateDataGraph2(currentRegion) {
    let regionData = data;
    let dict = {}
    let curr_sales;
    let cutoff;
    switch (currentRegion) {
        case "North America":
            curr_sales = "NA_Sales";
            cutoff = 200;
            break;
        case "Europe":
            curr_sales = "EU_Sales";
            cutoff = 100;
            break;
        case "Japan":
            curr_sales = "JP_Sales";
            cutoff = 50;
            break;
        case "Other":
            curr_sales = "Other_Sales";
            cutoff = 30;
            break;
        default:
            curr_sales = "NA_Sales";
            cutoff = 200;
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
        if (dict[k] < cutoff) {
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
    let slices = svg_graph_2.selectAll("path")
        .data(data_ready);
    slices.enter()
        .append('path')
        .merge(slices)
        .transition()
        .duration(1000)
        .attr("d", arc)
        .attr("fill", function(d) {return color_graph_2(d.data.key)})
        .attr("stroke", "white")
        .style("stroke-width", "2px")
        .style("opacity", 0.75);
    let lines = svg_graph_2.selectAll("polyline")
        .data(data_ready);
    lines.enter()
        .append('polyline')
        .merge(lines)
        .attr("stroke", "black")
        .style("fill", "none")
        .attr("stroke-width", 1)
        .attr('points', function(d) {
            var posA = arc.centroid(d);
            var posB = outerArc.centroid(d);
            var posC = outerArc.centroid(d);
            var midAngle = d.startAngle + (d.endAngle - d.startAngle) / 2;
            posC[0] = radius * 0.95 * (midAngle < Math.PI ? 1 : -1);
            return [posA, posB, posC];
        });
    let labels = svg_graph_2.selectAll("text")
        .data(data_ready);
    labels.enter()
        .append('text')
        .merge(labels)
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
    .attr("transform", `translate(${margin.left + 40}, ${margin.top - 5})`);

let tooltip = d3.select("#graph3")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("background-color", "#d5b1e3")
    .style("color", "black")
    .style("border", "solid #570677")
    .style("border-width", "1px")
    .style("border-radius", "5px")
    .style("padding", "10px");

let mouseover = function(d) {
    let html = `${d.publisher}<br>${d.count}`;
    tooltip.html(html)
        .style("left", (d3.mouse(this)[0] + 250) + "px")
        .style("top", (d3.mouse(this)[1] + 100) + "px")
        .style("opacity", 1);
}
let mouseleave = function(d) {
    tooltip.transition().duration(500).style("opacity", 0);
}

// Declare axes and labels
let x_graph_3 = d3.scaleLinear().range([0, graph_3_width - margin.left - margin.right]);
let x_graph_3_label = svg_graph_3.append("g")
    .attr("transform", `translate(0, ${graph_3_height - margin.top - margin.bottom})`);
let y_graph_3 = d3.scaleBand().range([0, graph_3_height - margin.top - margin.bottom]);
let y_graph_3_label = svg_graph_3.append("g");
// Add axes' labels
svg_graph_3.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) / 2}, ${(graph_3_height - margin.top - margin.bottom) + 28})`)
    .style("text-anchor", "middle")
    .text("Count");
svg_graph_3.append("text")
    .attr("transform", `translate(-170, ${(graph_3_height - margin.top - margin.bottom) / 2})`)
    .style("text-anchor", "middle")
    .text("Publisher");
let color_graph_3 = d3.scaleOrdinal();
// Add title
let title_graph_3 = svg_graph_3.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) / 2}, ${-5})`)
    .style("text-anchor", "middle")
    .style("font-size", 18)
// Add stats
let stats_graph_3 = svg_graph_3.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) - 60}, ${((graph_3_height - margin.top - margin.bottom) / 2) - 45})`)
    .style("text-anchor", "middle")
    .style("font-size", 16)
    .style("font-weight", "bold")
    .text("Graph's Statistical Info");
let stats_graph_3_sum = svg_graph_3.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) - 60}, ${((graph_3_height - margin.top - margin.bottom) / 2) - 20})`)
    .style("text-anchor", "middle")
    .style("font-size", 14)
let stats_graph_3_max = svg_graph_3.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) - 60}, ${((graph_3_height - margin.top - margin.bottom) / 2)})`)
    .style("text-anchor", "middle")
    .style("font-size", 14)
let stats_graph_3_min = svg_graph_3.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) - 60}, ${((graph_3_height - margin.top - margin.bottom) / 2) + 20})`)
    .style("text-anchor", "middle")
    .style("font-size", 14)
let stats_graph_3_mean = svg_graph_3.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) - 60}, ${((graph_3_height - margin.top - margin.bottom) / 2) + 40})`)
    .style("text-anchor", "middle")
    .style("font-size", 14)
let stats_graph_3_std = svg_graph_3.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) - 60}, ${((graph_3_height - margin.top - margin.bottom) / 2) + 60})`)
    .style("text-anchor", "middle")
    .style("font-size", 14)
let stats_graph_3_q1 = svg_graph_3.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) - 60}, ${((graph_3_height - margin.top - margin.bottom) / 2) + 80})`)
    .style("text-anchor", "middle")
    .style("font-size", 14)
let stats_graph_3_q2 = svg_graph_3.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) - 60}, ${((graph_3_height - margin.top - margin.bottom) / 2) + 100})`)
    .style("text-anchor", "middle")
    .style("font-size", 14)
let stats_graph_3_q3 = svg_graph_3.append("text")
    .attr("transform", `translate(${(graph_3_width - margin.left - margin.right) - 60}, ${((graph_3_height - margin.top - margin.bottom) / 2) + 120})`)
    .style("text-anchor", "middle")
    .style("font-size", 14)

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
        .on("mouseleave", mouseleave)
        .merge(dots)
        .transition()
        .duration(1000)
        .attr("cx", function(d) {return x_graph_3(d.count)})
        .attr("cy", function(d) {return y_graph_3(d.publisher) + 18})
        .attr("r", 8)
        .attr("fill", "#570677")
        .style("opacity", 0.75);
    title_graph_3.text(`Top Publishers for ${currentGenre} games`);
    dots.exit().remove();
    let count_list = [];
    clean_data.forEach(function(a) {
        count_list.push(a.count)
    });
    count_list = count_list.sort((a, b) => a - b);
    let sum = count_list.reduce((a, b) => a + b, 0);
    let n = count_list.length;
    let mean = sum / n;
    let std = Math.sqrt(count_list.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / (n - 1));
    let q1 = quantileCalculator(count_list, 0.25);
    let q2 = quantileCalculator(count_list, 0.5);
    let q3 = quantileCalculator(count_list, 0.75);
    stats_graph_3_sum.text(`Sum = ${sum}`);
    stats_graph_3_max.text(`Max = ${count_list[n - 1]}`);
    stats_graph_3_min.text(`Min = ${count_list[0]}`);
    stats_graph_3_mean.text(`Mean = ${mean.toFixed(2)}`);
    stats_graph_3_std.text(`Std. deviation = ${std.toFixed(2)}`);
    stats_graph_3_q1.text(`1st Quantile = ${q1.toFixed(2)}`);
    stats_graph_3_q2.text(`2nd Quantile (Median) = ${q2.toFixed(2)}`);
    stats_graph_3_q3.text(`3rd Quantile = ${q3.toFixed(2)}`);
    let elementList = [stats_graph_3, stats_graph_3_sum, stats_graph_3_max, stats_graph_3_min, stats_graph_3_mean, stats_graph_3_std, stats_graph_3_q1, stats_graph_3_q2, stats_graph_3_q3];
    if (stat_toggle == false) {
        setVisibility(elementList, "hidden");
    }
    else {
        setVisibility(elementList, "visible");
    }
}

function quantileCalculator(array, q) {
    let pos = (array.length - 1) * q;
    let base = Math.floor(pos);
    let rest = pos - base;
    if (array[base + 1] !== undefined) {
        return array[base] + rest * (array[base + 1] - array[base]);
    }
    else {
        return sorted[base];
    }
}

function setVisibility(elementList, status) {
    elementList.forEach(function(e) {
        e.style("visibility", status);
    })
}