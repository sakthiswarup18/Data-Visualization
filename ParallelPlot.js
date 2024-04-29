const margin = { top: 30, right: 150, bottom: 10, left: 0 },
      width = 810 - margin.left - margin.right,
      height = 490 - margin.top - margin.bottom;

const svg = d3.select("#parallelPlot svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const experienceLevelMapping = {
    "entry-level": "Entry-Level",
    "executive": "Executive",
    "mid-level": "Mid-Level",
    "senior": "Senior"
};
const experienceLevels = ["Entry-Level", "Executive", "Mid-Level", "Senior", "Other"];

const colorScale = d3.scaleOrdinal()
                     .domain(experienceLevels)
                     .range(d3.schemeTableau10);

d3.csv("jobs_in_data.csv").then(function (data) {
    data.forEach(d => {
        let normalizedLevel = d.experience_level.trim().toLowerCase().replace(/[^a-z\-]/g, "");
        d.experience_level = experienceLevelMapping[normalizedLevel] || "Other";
    });

    const dimensions = ['work_year', 'salary_in_usd']; 
    const y = {};
    dimensions.forEach(dimension => {
        y[dimension] = d3.scaleLinear()
                         .domain(d3.extent(data, d => +d[dimension]))
                         .range([height, 0])
                         .nice(); 
    });

    const x = d3.scalePoint()
                .range([0, width])
                .padding(0.5)
                .domain(dimensions);

    svg.selectAll("myPath")
       .data(data)
       .enter().append("path")
       .attr("d", d => path(d, dimensions, x, y))
       .style("stroke", d => colorScale(d.experience_level))
       .classed("line", true);

    svg.selectAll("myAxis")
       .data(dimensions)
       .enter()
       .append("g")
       .attr("class", "axis")
       .attr("transform", d => `translate(${x(d)})`)
       .each(function(d) {
           d3.select(this).call(d3.axisLeft(y[d]).tickFormat(d === 'work_year' ? d3.format('d') : null));
       })
       .append("text")
       .style("text-anchor", "middle")
       .attr("y", -9)
       .text(d => d)
       .style("fill", "black");

    svg.selectAll(".axis")
       .each(function(d) {
           if (d === 'salary_in_usd') {
               d3.select(this).selectAll("text")
                .attr("transform", "translate(15,0)")
                .style("text-anchor", "start");
           }
       });

    const legend = svg.selectAll(".legend")
        .data(colorScale.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0,${i * 20})`);

    legend.append("rect")
        .attr("x", width - 30)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", colorScale);

    legend.append("text")
        .attr("x", width )
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "start")
        .text(d => d);
});

function path(d, dimensions, x, y) {
    return d3.line()(dimensions.map(p => [x(p), y[p](d[p])]));
}
