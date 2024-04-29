document.addEventListener('DOMContentLoaded', function() {
    const width = 600;
    const height = 400;
    const radius = Math.min(width, height) / 2;

    const svg = d3.select('.chart')
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const pie = d3.pie()
        .sort(null)
        .value(d => d.count);

    const arc = d3.arc()
        .outerRadius(radius - 30)
        .innerRadius(radius - 100);

    const outerArc = d3.arc()
        .outerRadius(radius - 20)
        .innerRadius(radius - 20);

    const midAngle = d => d.startAngle + (d.endAngle - d.startAngle) / 2;

    d3.csv("jobs_in_data.csv").then(function(data) {
        const employmentCount = d3.rollup(data, v => v.length, d => d.employment_type);
        const processedData = Array.from(employmentCount, ([type, count]) => ({ type, count }));

        const slices = svg.selectAll(".slice")
            .data(pie(processedData))
            .enter().append("g")
            .attr("class", "slice");

        slices.append("path")
            .attr("d", arc)
            .attr("fill", d => color(d.data.type));

        const legend = svg.selectAll(".legend")
            .data(processedData)
            .enter().append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(0,${i * 20})`);

        legend.append("rect")
            .attr("x", width / 2 - 18)
            .attr("width", 18)
            .attr("height", 18)
            .attr("fill", d => color(d.type));

        legend.append("text")
            .attr("x", width / 2 - 24)
            .attr("y", 9)
            .attr("dy", ".35em")
            .style("text-anchor", "end")
            .text(d => d.type);
    }).catch(function(error){
        console.error("Error loading the CSV file: ", error);
    });
});
