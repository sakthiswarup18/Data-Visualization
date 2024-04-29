d3.csv("jobs_in_data.csv").then(function(data) {
    data.forEach(function(d) {
        d.work_year = +d.work_year;
        d.salary_in_usd = +d.salary_in_usd;
    });

    var processedData = d3.rollups(data, 
        v => d3.mean(v, d => d.salary_in_usd), 
        d => d.work_year, 
        d => d.job_category
    ).map(([year, categoriesMap]) => ({
        year,
        categories: Array.from(categoriesMap, ([category, average_salary]) => ({category, average_salary}))
    }));

    const margin = {top: 10, right: 200, bottom: 30, left: 60},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#my_dataviz")
        .append("svg")
            .attr("width", width + margin.left + margin.right+45)
            .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    const x = d3.scaleLinear()
        .domain(d3.extent(data, d => d.work_year))
        .range([0, width]);
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x).tickFormat(d3.format("d")));

    const y = d3.scaleLinear()
        .domain([0, 250000]) 
        .range([height, 0]);
    svg.append("g")
        .call(d3.axisLeft(y));

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    processedData.forEach(function(yearData) {
        yearData.categories.forEach(function(categoryData) {
            const { category } = categoryData;
            let dataForLine = processedData.map(function(e) {
                let cat = e.categories.find(c => c.category === category);
                return cat ? { year: e.year, average_salary: cat.average_salary } : null;
            }).filter(e => e);

            const line = d3.line()
                .x(d => x(d.year))
                .y(d => y(d.average_salary))
                .curve(d3.curveMonotoneX);

            svg.append("path")
                .datum(dataForLine)
                .attr("fill", "none")
                .attr("stroke", color(category))
                .attr("stroke-width", 3) 
                .attr("d", line)
                .on("mouseover", function(event, data) {
                    div.transition()
                        .duration(200)
                        .style("opacity", .9);
                    const mouseX = x.invert(d3.pointer(event)[0]);
                    const closest = data.reduce((prev, curr) => 
                        (Math.abs(curr.year - mouseX) < Math.abs(prev.year - mouseX) ? curr : prev));
                    div.html("Category: " + category + "<br/>Year: " + closest.year + "<br/>Avg Salary: $" + Math.round(closest.average_salary))
                        .style("left", (event.pageX + 10) + "px")
                        .style("top", (event.pageY - 28) + "px");
                })
                .on("mouseout", function() {
                    div.transition()
                        .duration(500)
                        .style("opacity", 0);
                });
        });
    });

    const legend = svg.selectAll(".legend")
        .data(color.domain())
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    legend.append("rect")
        .attr("x", width + margin.right - 18+45)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", color);

    legend.append("text")
        .attr("x", width + margin.right - 20+45)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d; });
});
