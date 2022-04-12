import React, { useEffect, useState } from "react";
import * as d3 from "d3";

const YScale = ({ scaleHeight, numberOfSlices, yScaleTicks }) => {
  function drawYScale(scaleTicks, scaleHeight) {
    const yScaleSVG = d3.select("#d3_scale").select("svg");
    yScaleSVG.selectAll(".y_axis").remove();
    // console.log("Y SCALE TICKS");
    // console.log(scaleTicks);
    let yScale = d3
      .scaleTime()
      .domain(
        d3.extent(scaleTicks, function (d) {
          return new Date(d);
        })
      )
      .range([scaleHeight, 0]);

    yScaleSVG
      .append("g")
      .classed("y_axis", true)
      .html("")
      .attr("transform", "translate(50, 10)")
      .transition()
      .duration(500)
      .call(
        d3
          .axisLeft(yScale)
          .tickFormat(d3.timeFormat("%H:%M:%S"))
          .tickValues(
            scaleTicks.map(function (d, idx) {
              return new Date(d);
            })
          )
      );
    const chartScaleHeight = scaleHeight;
    // console.log("heatmap points length", heatmapPoints.length);
    // console.log(heatmapPoints);

    const individualTextBlockHeight = chartScaleHeight / numberOfSlices;

    yScaleSVG
      .select(".y_axis")
      .selectAll(".tick")
      .select(function (date, index) {
        const yShift = chartScaleHeight - individualTextBlockHeight * index;
        this.style.transform = `translate(0,${yShift}px)`;
      });
  }

  useEffect(() => {
    drawYScale(yScaleTicks, scaleHeight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yScaleTicks, scaleHeight]);

  return (
    <div
      id="d3_scale"
      style={{ marginLeft: "2.2rem", position: "absolute" }}
    ></div>
  );
};

export default YScale;
