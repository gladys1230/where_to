$(document).ready(function() {
    //Width and height of map
    var x = window.innerWidth * .7;
    var y = window.innerHeight + 10;
    var occupation;

    $.getScript("assets/js/list_of_jobs.js", function() {

        $('#occupation-auto').autocomplete({
            data,
            limit: 20,
        });

    });

    $.getScript("assets/js/list_of_cities.js", function() {

        $('.city-auto').autocomplete({
            data,
            limit: 20,
        });

    });


    var refresh_btn = $("<button id='refresh' class='waves-effect waves-light btn cyan lighten-3'>Refresh Charts</button>");
    var start_over = $("<button class='waves-effect waves-light btn cyan lighten-3 scroll-up start-over'>Start Over</button>");

    $(".slider").slider({
        transition: 2000,
        interval: 4000,
        indicators: false
    });


    $(".dropdown-button").click(function() {
        $("#dropdown1").css("display", "block");
        $("#dropdown1").mouseleave(function() {
            $("#dropdown1").css("display", "none");
        });
    });

    $("#dropdown1").mouseleave(function() {
        $("#dropdown1").css("display", "none");
    });

    $("#find-btn").click(function() {
        $(".slider-adjustment").css("position", "absolute");
        $("#compare-cities").css("display", "none");
        $("#heatmap").css("display", "none");
        $("#comparison").css("display", "none");
        $("#find-your-city").css("display", "block");
        $('html, body').animate({
            scrollTop: $("#find-your-city").offset().top
        }, 2000);
    });

    $("#compare-btn").click(function() {
        $(".slider-adjustment").css("position", "absolute");
        $("#find-your-city").css("display", "none");
        $("#heatmap").css("display", "none");
        $("#comparison").css("display", "none");
        $("#compare-cities").css("display", "block");
        $('html, body').animate({
            scrollTop: $("#compare-cities").offset().top
        }, 2000);
    });

    function scrollUp(e) {
        e.preventDefault();
        $('html, body').animate({
            scrollTop: $("body").offset().top
        }, 1500);
    };

    $("#find-submit").click(function(e) {
        //add route to search occupation occupation-auto
        e.preventDefault();
        x = window.innerWidth * .7;
        y = window.innerHeight + 10;
        drawMap();
        occupation = $("#occupation-auto").val();

         $.get("/api/whereto/" + occupation, function(res) {
            console.log("Submitting " + occupation + "to route");
            console.log(res);
            //d3 create badass map point.res
        });
        $("#heatmap").css("display", "block");
        $("#heatmap").append(start_over);
        $('html, body').animate({
            scrollTop: $("#heatmap").offset().top
        }, 1500);
    });

    $("#compare-submit").click(function(e) {
        e.preventDefault();
        x = window.innerWidth * .7;
        y = window.innerHeight + 10;
        console.log($('#city1').val());
        console.log($('#city2').val());
        //Saving city
        var city1 = $('#city1').val();
        var city2 = $('#city2').val();

        $.get("/api/data/" + city1, function(res) {
            console.log("get request finished after submit button");
            // console.log(res);
            drawCharts(res);
            //d3 create badass map point.res
        });

        $.get("/api/data/" + city2, function(res) {
            console.log("get request finished after submit button");
            // console.log(res);
            drawCharts(res);
        });


        $("#comparison").css("display", "block");
        $("#comparison").append(refresh_btn);
        $("#comparison").append(start_over);
        $('html, body').animate({
            scrollTop: $("#comparison").offset().top
        }, 2000);
    });

    //D3 code beyond this point
    /*  This visualization was made possible by modifying code provided by:

        Scott Murray, Choropleth example from "Interactive Data Visualization for the Web" 
        https://github.com/alignedleft/d3-book/blob/master/chapter_12/05_choropleth.html   
        
        Malcolm Maclean, tooltips example tutorial
        http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html

        Mike Bostock, Pie Chart Legend
        http://bl.ocks.org/mbostock/3888852      */

    function drawMap() {

        $("#heatmap").empty();
        // D3 Projection
        var projection = d3.geo.albersUsa()
            .translate([x / 2, y / 2]) // translate to center of screen
            .scale([1000]); // scale things down so see entire US


        // Define path generator
        var path = d3.geo.path() // path generator that will convert GeoJSON to SVG paths
            .projection(projection); // tell path generator to use albersUsa projection


        // Define linear scale for output
        var color = d3.scale.linear()
            .range(["rgb(227,228,229)", "rgb(227,228,229)", "rgb(227,228,229)", "rgb(227,228,229)", "rgb(227,228,229)"]);

        var coordinateColor = d3.scale.linear()
            .domain([20, 47])
            .range(["#6BFF33", "#FF3333"]);


        var legendText = ["City Rank #1-50", "City Rank #51-100", "City Rank #101-250", "City Rank #251-500", "City Rank #501-1,000"];

        //Create SVG element and append map to the SVG
        var canvas = d3.select("#heatmap")
            .append("svg")
            .attr("width", x)
            .attr("height", y);

        // Append Div for tooltip to SVG
        var div = d3.select("#heatmap")
            .append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Load in my states data!
        d3.csv("/assets/geojson/stateslived.csv", function(data) {
            color.domain([0, 1, 2, 3]); // setting the range of the input data

            // Load GeoJSON data and merge with states data
            d3.json("/assets/geojson/us-states.json", function(json) {

                // Loop through each state data value in the .csv file
                for (var i = 0; i < data.length; i++) {

                    // Grab State Name
                    var dataState = data[i].state;

                    // Grab data value 
                    var dataValue = data[i].visited;

                    // Find the corresponding state inside the GeoJSON
                    for (var j = 0; j < json.features.length; j++) {

                        var jsonState = json.features[j].properties.name;

                        if (dataState == jsonState) {

                            // Copy the data value into the JSON
                            json.features[j].properties.visited = dataValue;

                            // Stop looking through the JSON
                            break;
                        }
                    }
                }



                // Bind the data to the canvas and create one path per GeoJSON feature
                canvas.selectAll("path")
                    .data(json.features)
                    .enter()
                    .append("path")
                    .attr("d", path)
                    .style("stroke", "grey")
                    .style("stroke-width", "1")
                    .style("fill", function(d) {

                        // Get data value
                        var value = d.properties.visited;

                        if (value) {
                            //If value exists…
                            return color(value);
                        } else {
                            //If value is undefined…
                            return "rgb(213, 222, 217)";

                        }
                    });

                var cityData;

                $.get("/api/whereto/" + occupation, function(res) {
                    // $.get("/api/whereto/occupation", function(res) {
                    cityData = res;
                    console.log(cityData);
                    canvas.selectAll("circle")
                        .data(cityData)
                        .enter()
                        .append("circle")
                        .attr("cx", function(d) {
                            // console.log(d)
                            return projection([d.longitude, d.latitude])[0];
                        })
                        .attr("cy", function(d) {
                            return projection([d.longitude, d.latitude])[1];
                        })
                        .attr("r", 6)
                        .attr("fill", function(d) {
                            return coordinateColor(d.latitude);
                        })
                        // .style("opacity", 0.85)  

                    // Modification of custom tooltip code provided by Malcolm Maclean, "D3 Tips and Tricks" 
                    // http://www.d3noob.org/2013/01/adding-tooltips-to-d3js-graph.html
                    //STYLE CONTROLLED BY DIV.TOOLTIPS ABOVE
                    .on("mouseover", function(d) {
                        div.transition()
                            //when mouse over controls how fast blurb populates        
                            .duration(200)
                            //control blurb popup opacity  
                            .style("opacity", 1);
                        //writes information to the blurb
                        div.html(d.place + "<br/>" + "Lat: " + d.latitude + "<br/>" + "Lon: " + d.longitude)
                            //controls X placement of the blurb - left,right,center
                            .style("left", (d3.event.pageX) + "px")
                            //controls Y placement of the blurb - up,down
                            .style("top", (d3.event.pageY - 28) + "px");
                    })

                    // fade out tooltip on mouse out               
                    .on("mouseout", function(d) {
                        div.transition()
                            .duration(500)
                            .style("opacity", 0);
                    });
                });






                var arcInfo = {
                    type: "LineString",
                    coordinates: [
                        [-74.0059413, 40.7127837],
                        [-97.7430608, 30.267153]

                    ]
                };

                canvas.append("path")
                    .attr("d", function() {
                        return path(arcInfo);
                    })
                    .attr("stroke-width", "2")
                    .attr("stroke", "black");


                // Modified Legend Code from Mike Bostock: http://bl.ocks.org/mbostock/3888852
                var legend = d3.select("#heatmap").append("svg")
                    .attr("class", "legend")
                    .attr("width", 140)
                    .attr("height", 200)
                    .selectAll("g")
                    .data(coordinateColor.domain().slice().reverse())
                    .enter()
                    .append("g")
                    .attr("transform", function(d, i) {
                        return "translate(0," + i * 20 + ")";
                    });

                legend.append("rect")
                    .attr("width", 18)
                    .attr("height", 18)
                    .style("fill", coordinateColor);

                legend.append("text")
                    .data(legendText)
                    .attr("x", 24)
                    .attr("y", 9)
                    .attr("dy", ".35em")
                    .text(function(d) {
                        return d;
                    });
            });

        });

    };
    /****************************************************************************
        CODE FOR CHARTS

    *******************************************************************************/
    //sample draw charts
    // function drawCharts() {
    //     $("#comparison").empty();
    //     var donutData = genData([33, 54, 80, 45]);
    //     var donuts = new DonutCharts();
    //     donuts.create(donutData);
    //     function refresh() {
    //         donuts.update(genData([80, 33, 33, 25, 90]));
    //     }
    //     $(document).on('click', "#refresh", refresh);
    // };

    function drawCharts(data) {
        $("#comparison").empty();
        var donutData = genData([data.costOfLivingPlusRentIndex, data.cpi, data.restaurantPriceIndex, data.rentIndex]);
        var donuts = new DonutCharts();
        donuts.create(donutData);
        function refresh() {
            donuts.update(genData([data.costOfLivingPlusRentIndex, data.cpi, data.restaurantPriceIndex, data.rentIndex]));
        }
        $(document).on('click', "#refresh", refresh);
    };



    function DonutCharts() {

        var charts = d3.select('#comparison');
        var chart_m,
            chart_r,
            color = d3.scale.category20();

        var getCatNames = function(dataset) {
            var catNames = new Array();

            for (var i = 0; i < dataset[0].data.length; i++) {
                catNames.push(dataset[0].data[i].cat);
            }

            return catNames;
        }

        var createLegend = function(catNames) {
            var legends = charts.select('.legend')
                .selectAll('g')
                .data(catNames)
                .enter().append('g')
                .attr('transform', function(d, i) {
                    return 'translate(' + (i * 150 + 50) + ', 10)';
                });

            legends.append('circle')
                .attr('class', 'legend-icon')
                .attr('r', 6)
                .style('fill', function(d, i) {
                    return color(i);
                });

            legends.append('text')
                .attr('dx', '1em')
                .attr('dy', '.3em')
                .text(function(d) {
                    return d;
                });
        }

        var createCenter = function(pie) {

            var eventObj = {
                'mouseover': function(d, i) {
                    d3.select(this)
                        .transition()
                        .attr("r", chart_r * 0.65);
                },

                'mouseout': function(d, i) {
                    d3.select(this)
                        .transition()
                        .duration(500)
                        .ease('bounce')
                        .attr("r", chart_r * 0.6);
                },

                'click': function(d, i) {
                    var paths = charts.selectAll('.clicked');
                    pathAnim(paths, 0);
                    paths.classed('clicked', false);
                    resetAllCenterText();
                }
            }

            var donuts = d3.selectAll('.donut');

            // The circle displaying total data.
            donuts.append("svg:circle")
                .attr("r", chart_r * 0.6)
                .style("fill", "#32CD32")
                .on(eventObj);

            donuts.append('text')
                .attr('class', 'center-txt type')
                .attr('y', chart_r * -0.16)
                .attr('text-anchor', 'middle')
                .style('font-weight', 'bold')
                .text(function(d, i) {
                    return d.type;
                });
            donuts.append('text')
                .attr('class', 'center-txt value')
                .attr('text-anchor', 'middle');
            donuts.append('text')
                .attr('class', 'center-txt percentage')
                .attr('y', chart_r * 0.16)
                .attr('text-anchor', 'middle')
                .style('fill', '#A2A2A2');
        }

        var setCenterText = function(thisDonut) {
            var sum = d3.sum(thisDonut.selectAll('.clicked').data(), function(d) {
                return d.data.val;
            });

            thisDonut.select('.value')
                .text(function(d) {
                    return (sum) ? sum.toFixed(1) + d.unit : d.total.toFixed(1) + d.unit;
                });
            thisDonut.select('.percentage')
                .text(function(d) {
                    return (sum)

                });
        }

        var resetAllCenterText = function() {
            charts.selectAll('.value')
                .text(function(d) {
                    return d.total.toFixed(1) + d.unit;
                });
            charts.selectAll('.percentage')
                .text('');
        }

        var pathAnim = function(path, dir) {
            switch (dir) {
                case 0:
                    path.transition()
                        .duration(500)
                        .ease('bounce')
                        .attr('d', d3.svg.arc()
                            .innerRadius(chart_r * 0.7)
                            .outerRadius(chart_r)
                        );
                    break;

                case 1:
                    path.transition()
                        .attr('d', d3.svg.arc()
                            .innerRadius(chart_r * 0.7)
                            .outerRadius(chart_r * 1.08)
                        );
                    break;
            }
        }

        var updateDonut = function() {

            var eventObj = {

                'mouseover': function(d, i, j) {
                    pathAnim(d3.select(this), 1);

                    var thisDonut = charts.select('.type' + j);
                    thisDonut.select('.value').text(function(donut_d) {
                        return d.data.val.toFixed(1) + donut_d.unit;
                    });
                    thisDonut.select('.percentage').text(function(donut_d) {
                        return (d.data.val / donut_d.total * 100).toFixed(2) + '%';
                    });
                },

                'mouseout': function(d, i, j) {
                    var thisPath = d3.select(this);
                    if (!thisPath.classed('clicked')) {
                        pathAnim(thisPath, 0);
                    }
                    var thisDonut = charts.select('.type' + j);
                    setCenterText(thisDonut);
                },

                'click': function(d, i, j) {
                    var thisDonut = charts.select('.type' + j);

                    if (0 === thisDonut.selectAll('.clicked')[0].length) {
                        thisDonut.select('circle').on('click')();
                    }

                    var thisPath = d3.select(this);
                    var clicked = thisPath.classed('clicked');
                    pathAnim(thisPath, ~~(!clicked));
                    thisPath.classed('clicked', !clicked);

                    setCenterText(thisDonut);
                }
            };

            var pie = d3.layout.pie()
                .sort(null)
                .value(function(d) {
                    return d.val;
                });

            var arc = d3.svg.arc()
                .innerRadius(chart_r * 0.7)
                .outerRadius(function() {
                    return (d3.select(this).classed('clicked')) ? chart_r * 1.08 : chart_r;
                });

            // Start joining data with paths
            var paths = charts.selectAll('.donut')
                .selectAll('path')
                .data(function(d, i) {
                    return pie(d.data);
                });

            paths
                .transition()
                .duration(1000)
                .attr('d', arc);

            paths.enter()
                .append('svg:path')
                .attr('d', arc)
                .style('fill', function(d, i) {
                    return color(i);
                })
                .style('stroke', '#FFFFFF')
                .on(eventObj)

            paths.exit().remove();

            resetAllCenterText();
        }

        this.create = function(dataset) {
            var $charts = $('#comparison');
            chart_m = $charts.innerWidth() / dataset.length / 2 * 0.14;
            chart_r = $charts.innerWidth() / dataset.length / 2 * 0.85;

            charts.append('svg')
                .attr('class', 'legend')
                .attr('width', '100%')
                .attr('height', 50)
                .attr('transform', 'translate(0, -100)');

            var donut = charts.selectAll('.donut')
                .data(dataset)
                .enter().append('svg:svg')
                .attr('width', (chart_r + chart_m) * 2)
                .attr('height', (chart_r + chart_m) * 2)
                .append('svg:g')
                .attr('class', function(d, i) {
                    return 'donut type' + i;
                })
                .attr('transform', 'translate(' + (chart_r + chart_m) + ',' + (chart_r + chart_m) + ')');

            createLegend(getCatNames(dataset));
            createCenter();

            updateDonut();
        }

        this.update = function(dataset) {
            // Assume no new categ of data enter
            var donut = charts.selectAll(".donut")
                .data(dataset);

            updateDonut();
        }
    }


    /*
     * Returns a json-like object.
     */
    function genData(x) {
        // var type = ['Austin', 'New York'];
        // var unit = ['cpi', 'cpi'];
        // var cat = ['Latitude', 'Longitude', 'wut', 'hey'];
        // var arr = x;
        // var donutData = genData([data.costOfLivingPlusRentIndex, data.cpi, data.restaurantPriceIndex, data.rentIndex]);
        console.log("logging gen data!");
        console.log(x);

        var type = [x.areaName1];
        var unit = ['cpi', 'cpi'];
        var cat = ['Cost of Living + Rent Index', 'CPI', 'Restaurant Price Index', 'Rent Index'];
        var arr = x;

        var dataset = new Array();

        for (var i = 0; i < type.length; i++) {
            var data = new Array();
            var total = 0;

            for (var j = 0; j < cat.length; j++) {
                var value = arr[j]
                total += value;
                data.push({
                    "cat": cat[j],
                    "val": value
                });
            }

            dataset.push({
                "type": type[i],
                "unit": unit[i],
                "data": data,
                "total": total
            });
        }
        console.log(dataset);
        return dataset;
    }

    $(document).on("click", ".scroll-up", scrollUp);
});
