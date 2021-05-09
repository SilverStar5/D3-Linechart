var svg, chart1, chart2;

function lineChart(config) {
    // set the dimensions and margins of the graph
    var margin = { top: 30, right: 60, bottom: 30, left: 60 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;
    var bisectDate = d3.bisector(function(d) { return d.date; }).left;

    var x, y, t1, t2;
    if (config.mode == 'create') {
        // append the svg object to the body of the page
        svg = d3.select(config.elemID)
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");
    } else {
        document.querySelectorAll(".focus").forEach(e => {
            e.remove();
        });

        document.querySelectorAll(".overlay").forEach(e => {
            e.remove();
        });

        document.querySelectorAll(".axis").forEach(e => {
            e.remove();
        });

        document.querySelectorAll(".grid").forEach(e => {
            e.remove();
        });
    }

    //Read the data
    d3.json(config.data, function(error, source) {
        if (error) throw error;

        let from = Date.parse(config.from + "-01-01");
        let to = Date.parse(config.to + "-12-31");

        var data = new Array();
        source.forEach(function(d) {
            let date = Date.parse(d.date);
            if (date >= from && date <= to) {
                data.push({
                    date: d3.timeParse("%Y-%m-%d")(d.date),
                    value1: +d.value1,
                    value2: +d.value2
                });
            }
        });

        x = d3.scaleTime()
            .domain(d3.extent(data, function(d) { return d.date; }))
            .range([0, width]);

        y = d3.scaleLinear()
            .domain([0, d3.max(source, function(d) { return Math.max(+d.value1, +d.value2); })])
            .range([height, 0]);

        // gridlines in x axis function
        function make_x_gridlines() {
            return d3.axisBottom(x)
                .ticks(5)
        }

        // gridlines in y axis function
        function make_y_gridlines() {
            return d3.axisLeft(y)
                .ticks(5)
        }

        // Add X axis --> it is a date format
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .attr("class", "axis")
            .call(d3.axisBottom(x));

        // Add Y axis
        svg.append("g")
            .attr("class", "axis")
            .call(d3.axisLeft(y));

        // add the X gridlines
        svg.append("g")
            .attr("class", "grid")
            .attr("transform", "translate(0," + height + ")")
            .call(make_x_gridlines()
                .tickSize(-height)
                .tickFormat("")
            )

        // add the Y gridlines
        svg.append("g")
            .attr("class", "grid")
            .call(make_y_gridlines()
                .tickSize(-width)
                .tickFormat("")
            )

        if (config.mode == 'create') {
            createChart(data);
        } else {
            updateChart(data);
        }

        makeTooltip(data);
    });

    function createChart(data) {
        // Add the line1
        chart1 = svg.append("path")
            .datum(data)
            .attr("class", "type1")
            .attr("d", d3.line()
                .x(function(d) { return x(d.date) })
                .y(function(d) { return y(d.value1) })
            )

        // Add the line2
        chart2 = svg.append("path")
            .datum(data)
            .attr("class", "type2")
            .attr("d", d3.line()
                .x(function(d) { return x(d.date) })
                .y(function(d) { return y(d.value2) })
            )
    }

    function updateChart(data) {
        chart1.datum(data)
            .transition()
            .duration(1000)
            .attr("d", d3.line()
                .x(function(d) { return x(+d.date) })
                .y(function(d) { return y(+d.value1) })
            )
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)

        chart2.datum(data)
            .transition()
            .duration(1000)
            .attr("d", d3.line()
                .x(function(d) { return x(+d.date) })
                .y(function(d) { return y(+d.value2) })
            )
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
    }

    function makeTooltip(data) {
        t1 = svg.append("g")
            .attr("class", "focus")
            .style("display", "none");

        t1.append("circle")
            .attr("r", 5);

        t1.append("rect")
            .attr("class", "tooltip1")
            .attr("width", 140)
            .attr("height", 40)
            .attr("x", -80)
            .attr("y", -45)
            .attr("rx", 8)
            .attr("ry", 8)

        t1.append("text")
            .attr("class", "tooltip-value")
            .attr("x", -70)
            .attr("y", -28);

        t1.append("text")
            .attr("class", "tooltip-label")
            .attr("x", -70)
            .attr("y", -15);

        t2 = svg.append("g")
            .attr("class", "focus")
            .style("display", "none");

        t2.append("circle")
            .attr("r", 5);

        t2.append("rect")
            .attr("class", "tooltip2")
            .attr("width", 65)
            .attr("height", 40)
            .attr("x", -50)
            .attr("y", -45)
            .attr("rx", 8)
            .attr("ry", 8)

        t2.append("text")
            .attr("class", "tooltip-value")
            .attr("x", -40)
            .attr("y", -28);

        t2.append("text")
            .attr("class", "tooltip-label")
            .attr("x", -40)
            .attr("y", -15);

        svg.append("rect")
            .attr("class", "overlay")
            .attr("width", width)
            .attr("height", height)
            .on("mouseover", function() {
                t1.style("display", null);
                t2.style("display", null);
            })
            .on("mouseout", function() {
                t1.style("display", "none");
                t2.style("display", "none");
            })
            .on("mousemove", mousemove);

        function mousemove() {
            var x0 = x.invert(d3.mouse(this)[0]),
                i = bisectDate(data, x0, 1),
                d0 = data[i - 1],
                d1 = data[i],
                d = x0 - d0.date > d1.date - x0 ? d1 : d0;

            t1.attr("transform", "translate(" + x(d.date) + "," + y(d.value1) + ")");
            t1.select(".tooltip-value").text(transK(d.value1));
            t1.select(".tooltip-label").text("Numin Jade Fund Capital");
            t2.attr("transform", "translate(" + x(d.date) + "," + y(d.value2) + ")");
            t2.select(".tooltip-value").text(transK(d.value2));
            t2.select(".tooltip-label").text("S&P 500");

            function transK(value) {
                return Math.floor(value / 1000) + "K" + Math.round((value % 1000) / 10);
            }
        }

    }
}