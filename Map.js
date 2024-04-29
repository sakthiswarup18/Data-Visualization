document.addEventListener('DOMContentLoaded', function() {
    const svg = d3.select("#mapSVG");
    const width = +svg.attr("width");
    const height = +svg.attr("height");
    const projection = d3.geoMercator().scale(175).translate([width / 2, height / 2]);
    const path = d3.geoPath().projection(projection);

    let tooltip = d3.select("#tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("id", "tooltip")
            .attr("class", "tooltip")
            .style("display", "none");
    }

    const countryNameToCode = {
        "United States": "United States of America",
    };

    let colorScale; 

    Promise.all([
        d3.json('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json'),
        d3.csv('jobs_in_data.csv')
    ]).then(function([geojson, data]) {
        const modifiedData = data.map(d => {
            return {
                ...d,
                company_location: countryNameToCode[d.company_location] || d.company_location
            };
        });

        colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, d3.max(modifiedData, d => +d.salary_in_usd) * 2]);

        function drawMap(dataForMap) {
            svg.selectAll("path")
                .data(geojson.features)
                .join("path")
                .attr("d", path)
                .attr("fill", d => {
                    const countryName = d.properties.name;
                    const countryData = dataForMap.filter(d => d.company_location === countryName);
                    const countryAverageSalary = d3.mean(countryData, d => +d.salary_in_usd);
                    return colorScale(countryAverageSalary || 0);
                })
                .on("mouseover", (event, d) => {
                    const countryName = d.properties.name;
                    const countryData = dataForMap.filter(d => d.company_location === countryName);
                    const countryAverageSalary = d3.mean(countryData, d => +d.salary_in_usd);
                    tooltip.style("display", "block")
                           .style("left", (event.pageX + 10) + "px")
                           .style("top", (event.pageY - 10) + "px")
                           .html(`<strong>${countryName}</strong><br>Average Salary: $${countryAverageSalary ? countryAverageSalary.toFixed(2) : 'N/A'}`);
                })
                .on("mousemove", (event) => {
                    tooltip.style("left", (event.pageX + 10) + "px")
                           .style("top", (event.pageY - 10) + "px");
                })
                .on("mouseout", () => {
                    tooltip.style("display", "none");
                });

            svg.selectAll("text")
                .data(geojson.features.filter(d => dataForMap.some(data => data.company_location === d.properties.name)))
                .join("text")
                .attr("text-anchor", "middle")
                .attr("font-size", "8px")
                .attr("fill", "black")
                .attr("transform", d => {
                    const centroid = path.centroid(d);
                    return `translate(${centroid[0]}, ${centroid[1]})`;
                })
                .text(d => d.properties.name);

            console.log("Map drawn or updated.");
        }

        document.getElementById('year2020').addEventListener('click', () => drawMap(modifiedData.filter(d => d.work_year.toString() === "2020")));
        document.getElementById('year2021').addEventListener('click', () => drawMap(modifiedData.filter(d => d.work_year.toString() === "2021")));
        document.getElementById('year2022').addEventListener('click', () => drawMap(modifiedData.filter(d => d.work_year.toString() === "2022")));
        document.getElementById('year2023').addEventListener('click', () => drawMap(modifiedData.filter(d => d.work_year.toString() === "2023")));

        drawMap(modifiedData);
    });

    const zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on("zoom", zoomed);

    svg.call(zoom);

    function zoomed(event) {
        const {transform} = event;
        projection.scale(150 * transform.k).translate([transform.x, transform.y]);
        svg.selectAll("path").attr("d", path);
        svg.selectAll("text").attr("transform", d => {
            const centroid = path.centroid(d);
            return `translate(${centroid[0]}, ${centroid[1]}) scale(${transform.k})`;
        }).attr("font-size", d => 8 / transform.k + "px");
    }
});
